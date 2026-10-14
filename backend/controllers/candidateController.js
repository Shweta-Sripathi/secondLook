const { parseResumeBuffer } = require('../services/parserService');
const { analyzeWithAI } = require('../services/aiAnalysisService');
const { calculateATSScore, calculateJobMatchScore, calculateOverallScore } = require('../services/scoringEngine');
const Resume = require('../models/Resume');
const AnalysisReport = require('../models/AnalysisReport');
const JobDescription = require('../models/JobDescription');

/**
 * @desc    Upload single resume, extract text, evaluate with new scoring engine
 * @route   POST /api/candidate/analyze
 * @access  Private (Candidate)
 */
const analyzeResume = async (req, res, next) => {
  try {
    if (!req.file) {
      res.status(400);
      return next(new Error('Please upload a resume file (.pdf or .docx)'));
    }

    const { originalname, mimetype, buffer } = req.file;
    const jobDescriptionText = req.body.jobDescription || '';
    const candidateId = req.user._id;

    // Step 1: Extract text from file buffer
    const extractedText = await parseResumeBuffer(buffer, mimetype, originalname);

    // Step 2: Calculate deterministic ATS readability score
    const atsResult = calculateATSScore(extractedText);

    // Step 3: Run AI-enhanced analysis
    const aiResult = await analyzeWithAI(extractedText, jobDescriptionText);

    // Step 4: Build AI evidence map for scoring
    const aiEvidence = {};
    if (aiResult.requirementMatches) {
      for (const match of aiResult.requirementMatches) {
        if (match.status === 'demonstrated' || match.status === 'partial') {
          aiEvidence[match.requirement] = match.evidence;
        }
      }
    }

    // Step 5: Calculate job-match score
    const jobMatchResult = calculateJobMatchScore({
      resumeText: extractedText,
      jobDescriptionText,
      requiredSkills: [],
      preferredSkills: [],
      aiEvidence,
      aiScores: {
        experienceRelevance: aiResult.experienceRelevance,
        projectRelevance: aiResult.projectRelevance,
        qualificationScore: aiResult.qualificationScore,
        domainAlignment: aiResult.domainAlignment,
      },
    });

    // Step 6: Calculate overall score
    const overallScore = calculateOverallScore(atsResult.score, jobMatchResult.score);

    // Step 7: Build AI suggestions for missing skills
    const aiSuggestions = [];
    for (const missing of jobMatchResult.missingSkills) {
      aiSuggestions.push({
        skill: missing.skillName,
        suggestion: `Consider learning ${missing.skillName} through online courses (Coursera, Udemy) or hands-on projects. Add relevant certifications or personal projects showcasing this skill.`,
        priority: missing.importance === 'required' ? 'high' : 'medium',
        resources: getResourceSuggestion(missing.skillName),
      });
    }

    // Step 8: Persist to database
    let reportId = null;
    try {
      const resumeDoc = await Resume.create({
        candidateId,
        fileName: originalname,
        fileType: mimetype.includes('pdf') ? 'pdf' : 'docx',
        rawText: extractedText,
        parsedProfile: {},
      });

      const reportDoc = await AnalysisReport.create({
        candidateId,
        resumeId: resumeDoc._id,
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
        bulletImprovements: (aiResult.improvements || []).map(imp => ({
          original: imp.area,
          suggested: imp.suggestion,
          reason: imp.priority,
        })),
        interviewQuestions: [],
        summary: aiResult.summary || 'Analysis completed.',
      });
      reportId = reportDoc._id;
    } catch (dbErr) {
      console.log('[secondLook] DB persistence notice:', dbErr.message);
    }

    res.status(200).json({
      success: true,
      message: 'Resume analyzed successfully',
      reportId,
      scores: {
        overallScore,
        atsScore: atsResult.score,
        atsBreakdown: atsResult.breakdown,
        jobMatchScore: jobMatchResult.score,
        jobMatchBreakdown: jobMatchResult.breakdown,
      },
      skills: {
        matched: jobMatchResult.skillMatches,
        missing: jobMatchResult.missingSkills,
        partial: jobMatchResult.partialMatches,
        resumeSkills: jobMatchResult.resumeSkills,
      },
      strengths: aiResult.strengths || [],
      improvements: aiResult.improvements || [],
      aiSuggestions,
      requirementMatches: aiResult.requirementMatches || [],
      summary: aiResult.summary,
      aiAvailable: aiResult.aiAvailable !== false,
      keywords: {
        foundKeywords: jobMatchResult.skillMatches.map(m => m.skillName),
        missingKeywords: jobMatchResult.missingSkills.map(m => m.skillName),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Generate resource suggestions for a given skill
 */
function getResourceSuggestion(skill) {
  const skillLower = skill.toLowerCase();
  const resourceMap = {
    'react': 'React Docs (react.dev), Full Stack Open, Scrimba React Course',
    'node.js': 'Node.js Docs, The Odin Project, freeCodeCamp Node.js',
    'python': 'Python.org tutorials, Automate the Boring Stuff, CS50P',
    'docker': 'Docker Docs, Play with Docker, Docker Mastery on Udemy',
    'aws': 'AWS Free Tier, Cloud Practitioner cert, A Cloud Guru',
    'kubernetes': 'Kubernetes.io tutorials, KodeKloud, CKA prep',
    'typescript': 'TypeScript Handbook, Total TypeScript, Type-Challenges',
    'mongodb': 'MongoDB University, Mongoose Docs, freeCodeCamp MongoDB',
    'java': 'Oracle Java Tutorials, Baeldung, Java MOOC (Helsinki)',
    'sql': 'SQLBolt, Mode Analytics SQL Tutorial, LeetCode SQL',
    'git': 'Pro Git Book, Learn Git Branching, GitHub Skills',
    'ci/cd': 'GitHub Actions Docs, Jenkins Docs, CircleCI Academy',
    'graphql': 'GraphQL.org, How to GraphQL, Apollo Docs',
    'flutter': 'Flutter.dev codelabs, Dart.dev, Angela Yu Flutter course',
    'tensorflow': 'TensorFlow.org tutorials, fast.ai, Coursera Deep Learning',
    'spring boot': 'Spring.io guides, Baeldung, Spring Boot in Action',
  };

  for (const [key, value] of Object.entries(resourceMap)) {
    if (skillLower.includes(key) || key.includes(skillLower)) {
      return value;
    }
  }
  return `Search for ${skill} courses on Coursera, Udemy, or YouTube. Build a personal project using ${skill}.`;
}

/**
 * @desc    Analyze resume against a specific recruiter job description
 * @route   POST /api/candidate/analyze-job/:jobId
 * @access  Private (Candidate)
 */
const analyzeAgainstJob = async (req, res, next) => {
  try {
    if (!req.file) {
      res.status(400);
      return next(new Error('Please upload a resume file (.pdf or .docx)'));
    }

    const { jobId } = req.params;
    const candidateId = req.user._id;

    // Get the job description
    let job = null;
    try {
      job = await JobDescription.findById(jobId);
    } catch (err) {
      console.log('[secondLook] Job fetch notice:', err.message);
    }

    if (!job) {
      res.status(404);
      return next(new Error('Job posting not found'));
    }

    const { originalname, mimetype, buffer } = req.file;
    const extractedText = await parseResumeBuffer(buffer, mimetype, originalname);
    const atsResult = calculateATSScore(extractedText);
    const aiResult = await analyzeWithAI(extractedText, job.descriptionText);

    const aiEvidence = {};
    if (aiResult.requirementMatches) {
      for (const match of aiResult.requirementMatches) {
        if (match.status === 'demonstrated' || match.status === 'partial') {
          aiEvidence[match.requirement] = match.evidence;
        }
      }
    }

    const jobMatchResult = calculateJobMatchScore({
      resumeText: extractedText,
      jobDescriptionText: job.descriptionText,
      requiredSkills: job.extractedSkills || [],
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

    // Build AI suggestions
    const aiSuggestions = [];
    for (const missing of jobMatchResult.missingSkills) {
      aiSuggestions.push({
        skill: missing.skillName,
        suggestion: `To match "${job.title}" at ${job.company}, consider learning ${missing.skillName}. Focus on practical projects that demonstrate this skill.`,
        priority: missing.importance === 'required' ? 'high' : 'medium',
        resources: getResourceSuggestion(missing.skillName),
      });
    }

    // Persist
    try {
      const resumeDoc = await Resume.create({
        candidateId,
        fileName: originalname,
        fileType: mimetype.includes('pdf') ? 'pdf' : 'docx',
        rawText: extractedText,
        parsedProfile: {},
      });

      await AnalysisReport.create({
        candidateId,
        resumeId: resumeDoc._id,
        jobDescriptionId: job._id,
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
        summary: aiResult.summary || 'Job-specific analysis completed.',
      });
    } catch (dbErr) {
      console.log('[secondLook] DB persistence notice:', dbErr.message);
    }

    res.status(200).json({
      success: true,
      message: `Resume analyzed against "${job.title}" at ${job.company}`,
      jobTitle: job.title,
      company: job.company,
      scores: {
        overallScore,
        atsScore: atsResult.score,
        jobMatchScore: jobMatchResult.score,
      },
      skills: {
        matched: jobMatchResult.skillMatches,
        missing: jobMatchResult.missingSkills,
        partial: jobMatchResult.partialMatches,
        resumeSkills: jobMatchResult.resumeSkills,
      },
      aiSuggestions,
      improvements: aiResult.improvements || [],
      summary: aiResult.summary,
      keywords: {
        foundKeywords: jobMatchResult.skillMatches.map(m => m.skillName),
        missingKeywords: jobMatchResult.missingSkills.map(m => m.skillName),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get candidate scan history from MongoDB
 * @route   GET /api/candidate/history
 * @access  Private (Candidate)
 */
const getHistory = async (req, res, next) => {
  try {
    const candidateId = req.user._id;

    let reports = [];
    try {
      reports = await AnalysisReport.find({ candidateId })
        .populate('resumeId', 'fileName fileType createdAt')
        .populate('jobDescriptionId', 'title company')
        .sort({ createdAt: -1 })
        .limit(50);
    } catch (err) {
      console.log('[secondLook] History fetch notice:', err.message);
    }

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
 * @desc    Express interest in a recruiter job post
 * @route   POST /api/candidate/express-interest/:jobId
 * @access  Private (Candidate)
 */
const expressInterest = async (req, res, next) => {
  try {
    const { jobId } = req.params;
    const candidateId = req.user._id;

    let job = null;
    try {
      job = await JobDescription.findById(jobId);
    } catch (err) {
      console.log('[secondLook] Job fetch notice:', err.message);
    }

    if (!job) {
      res.status(404);
      return next(new Error('Job posting not found'));
    }

    // Check for duplicate application
    const alreadyApplied = job.applications.some(
      app => app.candidateId && app.candidateId.toString() === candidateId.toString()
    );
    if (alreadyApplied) {
      res.status(400);
      return next(new Error('You have already expressed interest in this position'));
    }

    // Get latest resume
    let latestResume = null;
    try {
      latestResume = await Resume.findOne({ candidateId }).sort({ createdAt: -1 });
    } catch (err) {
      console.log('[secondLook] Resume fetch notice:', err.message);
    }

    if (!latestResume) {
      res.status(400);
      return next(new Error('Please upload a resume before applying'));
    }

    // Analyze against job
    const aiResult = await analyzeWithAI(latestResume.rawText, job.descriptionText);
    const atsResult = calculateATSScore(latestResume.rawText);

    const aiEvidence = {};
    if (aiResult.requirementMatches) {
      for (const match of aiResult.requirementMatches) {
        if (match.status === 'demonstrated' || match.status === 'partial') {
          aiEvidence[match.requirement] = match.evidence;
        }
      }
    }

    const jobMatchResult = calculateJobMatchScore({
      resumeText: latestResume.rawText,
      jobDescriptionText: job.descriptionText,
      requiredSkills: job.extractedSkills || [],
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

    try {
      const reportDoc = await AnalysisReport.create({
        candidateId,
        recruiterId: job.recruiterId,
        resumeId: latestResume._id,
        jobDescriptionId: job._id,
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
        summary: aiResult.summary || 'Application analysis completed.',
      });

      job.applications.push({
        candidateId,
        resumeId: latestResume._id,
        analysisReportId: reportDoc._id,
        appliedAt: new Date(),
      });
      await job.save();
    } catch (err) {
      console.log('[secondLook] Application save notice:', err.message);
    }

    res.status(200).json({
      success: true,
      message: `Interest expressed in ${job.title} at ${job.company}`,
      scores: { overallScore, atsScore: atsResult.score, jobMatchScore: jobMatchResult.score },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all public job descriptions for candidate feed
 * @route   GET /api/candidate/jobs
 * @access  Private (Candidate)
 */
const getPublicJobs = async (req, res, next) => {
  try {
    let jobs = [];
    try {
      jobs = await JobDescription.find()
        .populate('recruiterId', 'name')
        .sort({ createdAt: -1 })
        .limit(50);
    } catch (err) {
      console.log('[secondLook] Public jobs notice:', err.message);
    }

    res.status(200).json({
      success: true,
      count: jobs.length,
      data: jobs,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  analyzeResume,
  analyzeAgainstJob,
  getHistory,
  expressInterest,
  getPublicJobs,
};
