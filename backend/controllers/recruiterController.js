const { parseResumeBuffer } = require('../services/parserService');
const { analyzeWithAI } = require('../services/aiAnalysisService');
const { calculateATSScore, calculateJobMatchScore, calculateOverallScore } = require('../services/scoringEngine');
const { extractSkillsFromText } = require('../services/skillTaxonomy');
const JobDescription = require('../models/JobDescription');
const AnalysisReport = require('../models/AnalysisReport');
const Resume = require('../models/Resume');
const User = require('../models/User');

/**
 * @desc    Create a new job description posting
 * @route   POST /api/recruiter/job-description
 * @access  Private (Recruiter)
 */
const createJobDescription = async (req, res, next) => {
  try {
    const { title, company, descriptionText } = req.body;

    if (!title || !company || !descriptionText) {
      res.status(400);
      return next(new Error('Please provide title, company, and description text'));
    }

    // Auto-extract skills from JD text using taxonomy
    const detectedSkills = extractSkillsFromText(descriptionText);
    const extractedSkillNames = detectedSkills.map(s => s.name);

    const job = await JobDescription.create({
      recruiterId: req.user._id,
      title,
      company,
      descriptionText,
      extractedSkills: extractedSkillNames,
    });

    res.status(201).json({
      success: true,
      message: `Job posting "${title}" created`,
      data: job,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all job descriptions for the logged-in recruiter
 * @route   GET /api/recruiter/job-descriptions
 * @access  Private (Recruiter)
 */
const getJobDescriptions = async (req, res, next) => {
  try {
    const jobs = await JobDescription.find({ recruiterId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);

    res.status(200).json({
      success: true,
      count: jobs.length,
      data: jobs,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get ranked applicants for a specific job with full profile details
 * @route   GET /api/recruiter/job-applications/:jobId
 * @access  Private (Recruiter)
 */
const getJobApplications = async (req, res, next) => {
  try {
    const { jobId } = req.params;

    const job = await JobDescription.findById(jobId);

    if (!job) {
      res.status(404);
      return next(new Error('Job posting not found'));
    }

    // Ownership check: only the recruiter who created the job can view applications
    if (job.recruiterId.toString() !== req.user._id.toString()) {
      res.status(403);
      return next(new Error('Not authorized to view applications for this job'));
    }

    // Get analysis reports for this job, ranked by overall score
    const reports = await AnalysisReport.find({ jobDescriptionId: jobId })
      .populate({
        path: 'candidateId',
        select: 'name email profile'
      })
      .populate('resumeId', 'fileName fileType createdAt')
      .sort({ 'scores.overallScore': -1 })
      .limit(100);

    res.status(200).json({
      success: true,
      count: reports.length,
      data: reports,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Batch upload and analyze multiple resumes against a job
 * @route   POST /api/recruiter/batch-scan
 * @access  Private (Recruiter)
 */
const batchScanResumes = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      res.status(400);
      return next(new Error('Please upload at least one resume file'));
    }

    const { jobId } = req.body;
    let jobDoc = null;
    let jobText = '';

    if (jobId) {
      jobDoc = await JobDescription.findById(jobId);
      if (!jobDoc) {
        res.status(404);
        return next(new Error('Selected job posting not found'));
      }
      // Ownership check
      if (jobDoc.recruiterId.toString() !== req.user._id.toString()) {
        res.status(403);
        return next(new Error('Not authorized to scan resumes for this job'));
      }
      jobText = jobDoc.descriptionText;
    }

    const results = [];
    let successCount = 0;
    let failCount = 0;

    for (const file of req.files) {
      try {
        const extractedText = await parseResumeBuffer(file.buffer, file.mimetype, file.originalname);

        // ATS score (document quality)
        const atsResult = calculateATSScore(extractedText);

        // AI analysis
        const aiResult = await analyzeWithAI(extractedText, jobText);

        // Evidence map
        const aiEvidence = {};
        if (aiResult.requirementMatches) {
          for (const match of aiResult.requirementMatches) {
            if (match.status === 'demonstrated' || match.status === 'partial') {
              aiEvidence[match.requirement] = match.evidence;
            }
          }
        }

        // Job match score
        const jobMatchResult = calculateJobMatchScore({
          resumeText: extractedText,
          jobDescriptionText: jobText,
          requiredSkills: jobDoc ? jobDoc.extractedSkills : [],
          preferredSkills: [],
          aiEvidence,
          aiScores: {
            experienceRelevance: aiResult.experienceRelevance,
            projectRelevance: aiResult.projectRelevance,
            qualificationScore: aiResult.qualificationScore,
            domainAlignment: aiResult.domainAlignment,
          },
        });

        const overallScore = calculateOverallScore(atsResult.score, jobMatchResult.score);

        // Note: batch-scanned resumes uploaded by recruiter are stored
        // with a placeholder candidate. In a full implementation,
        // these would be linked to actual candidates or create anonymous profiles.
        let reportDoc = null;
        try {
          const resumeDoc = await Resume.create({
            candidateId: req.user._id, // placeholder -- recruiter-uploaded
            fileName: file.originalname,
            fileType: file.mimetype.includes('pdf') ? 'pdf' : 'docx',
            rawText: extractedText,
            parsedProfile: {},
          });

          reportDoc = await AnalysisReport.create({
            candidateId: req.user._id, // placeholder
            recruiterId: req.user._id,
            resumeId: resumeDoc._id,
            jobDescriptionId: jobDoc ? jobDoc._id : undefined,
            scores: {
              overallScore,
              atsScore: atsResult.score,
              jobMatchScore: jobMatchResult.score,
              keywordMatchScore: jobMatchResult.breakdown.requiredSkillScore,
              semanticFitScore: aiResult.experienceRelevance || 50,
              impactScore: aiResult.projectRelevance || 50,
              formattingScore: atsResult.breakdown.formattingQuality,
            },
            keywords: {
              foundKeywords: jobMatchResult.skillMatches.map(m => m.skillName),
              missingKeywords: jobMatchResult.missingSkills.map(m => m.skillName),
            },
            bulletImprovements: [],
            interviewQuestions: [],
            summary: aiResult.summary || 'Batch analysis completed.',
          });
        } catch (dbErr) {
          console.log('[secondLook] Batch DB notice:', dbErr.message);
        }

        results.push({
          fileName: file.originalname,
          overallScore,
          atsScore: atsResult.score,
          jobMatchScore: jobMatchResult.score,
          matched: jobMatchResult.skillMatches.map(m => m.skillName),
          missing: jobMatchResult.missingSkills.map(m => m.skillName),
          summary: aiResult.summary,
          reportId: reportDoc ? reportDoc._id : null,
        });
        successCount++;
      } catch (err) {
        results.push({ fileName: file.originalname, error: err.message });
        failCount++;
      }
    }

    res.status(200).json({
      success: true,
      message: `Batch scan completed: ${successCount} succeeded, ${failCount} failed`,
      data: results,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createJobDescription,
  getJobDescriptions,
  getJobApplications,
  batchScanResumes,
};
