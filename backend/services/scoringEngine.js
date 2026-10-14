/**
 * secondLook Scoring Engine
 *
 * Separates ATS/readability scoring from job-match scoring.
 * Uses the skill taxonomy for deterministic matching and
 * accepts AI-extracted evidence for semantic scoring.
 *
 * Scoring weights are configurable via SCORING_CONFIG.
 */

const {
  normalizeSkill,
  getSkill,
  getRelatedSkills,
  areRelated,
  extractSkillsFromText,
  inferJobCategories,
  CATEGORIES,
} = require('./skillTaxonomy');

// ---------------------------------------------------------------
// Default scoring configuration (weights sum to 1.0)
// ---------------------------------------------------------------
const SCORING_CONFIG = {
  jobMatch: {
    requiredSkills:    0.40,
    preferredSkills:   0.15,
    relevantExperience: 0.20,
    projectEvidence:   0.15,
    qualifications:    0.05,
    domainAlignment:   0.05,
  },
  ats: {
    structureClarity:  0.30,
    sectionPresence:   0.25,
    formattingQuality: 0.20,
    contactInfo:       0.15,
    lengthAppropriate: 0.10,
  },
  // Partial credit for related skills (not the exact skill required)
  relatedSkillCredit: 0.3,
  // Partial credit for skills in the same category
  sameCategoryCredit: 0.15,
};

// ---------------------------------------------------------------
// ATS / Readability Score (document quality, NOT job relevance)
// ---------------------------------------------------------------

/**
 * Calculate ATS readability score based on document structure.
 * This score is independent of any job description.
 *
 * @param {string} resumeText - Extracted resume text
 * @param {object} parsedProfile - AI-extracted structured profile (optional)
 * @returns {{ score: number, breakdown: object }}
 */
function calculateATSScore(resumeText, parsedProfile = {}) {
  const text = resumeText || '';
  const lower = text.toLowerCase();
  const lines = text.split('\n').filter(l => l.trim().length > 0);

  // 1. Section presence (education, experience, skills, etc.)
  const sectionKeywords = [
    { key: 'education', patterns: ['education', 'academic', 'degree', 'university', 'college', 'bachelor', 'master'] },
    { key: 'experience', patterns: ['experience', 'work history', 'employment', 'professional experience'] },
    { key: 'skills', patterns: ['skills', 'technical skills', 'technologies', 'competencies', 'proficiencies'] },
    { key: 'projects', patterns: ['projects', 'personal projects', 'academic projects', 'portfolio'] },
    { key: 'contact', patterns: ['email', 'phone', 'linkedin', 'github', 'contact'] },
  ];

  const sectionsFound = {};
  let sectionCount = 0;
  for (const section of sectionKeywords) {
    const found = section.patterns.some(p => lower.includes(p));
    sectionsFound[section.key] = found;
    if (found) sectionCount++;
  }
  const sectionScore = Math.min((sectionCount / sectionKeywords.length) * 100, 100);

  // 2. Structure clarity (headings, bullet points, consistent formatting)
  const hasBullets = /[\u2022\u2023\u25E6\-\*]\s/.test(text);
  const hasNumbers = /\d+[\.\)]\s/.test(text);
  const hasConsistentSpacing = lines.length > 5;
  const structureScore = (
    (hasBullets ? 35 : 0) +
    (hasNumbers ? 15 : 0) +
    (hasConsistentSpacing ? 25 : 0) +
    (lines.length > 10 ? 25 : Math.round((lines.length / 10) * 25))
  );

  // 3. Formatting quality (no excessive whitespace, reasonable line lengths)
  const avgLineLength = lines.length > 0
    ? lines.reduce((sum, l) => sum + l.trim().length, 0) / lines.length
    : 0;
  const hasReasonableLines = avgLineLength > 20 && avgLineLength < 150;
  const hasNoExcessiveGaps = !/\n{4,}/.test(text);
  const formattingScore = (
    (hasReasonableLines ? 50 : 25) +
    (hasNoExcessiveGaps ? 30 : 10) +
    (text.length > 200 ? 20 : Math.round((text.length / 200) * 20))
  );

  // 4. Contact info
  const hasEmail = /[\w.-]+@[\w.-]+\.\w{2,}/.test(text);
  const hasPhone = /[\+\(]?\d[\d\s\-\(\)]{6,}/.test(text);
  const hasLinkedIn = /linkedin/i.test(text);
  const contactScore = (
    (hasEmail ? 40 : 0) +
    (hasPhone ? 30 : 0) +
    (hasLinkedIn ? 30 : 20) // 20 for having any other link
  );

  // 5. Length appropriateness
  const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;
  let lengthScore = 100;
  if (wordCount < 100) lengthScore = 30;
  else if (wordCount < 200) lengthScore = 60;
  else if (wordCount > 2000) lengthScore = 70; // too long
  else if (wordCount > 1500) lengthScore = 85;

  // Weighted overall
  const weights = SCORING_CONFIG.ats;
  const overallATS = Math.round(
    weights.structureClarity * structureScore +
    weights.sectionPresence * sectionScore +
    weights.formattingQuality * formattingScore +
    weights.contactInfo * contactScore +
    weights.lengthAppropriate * lengthScore
  );

  return {
    score: clamp(overallATS, 0, 100),
    breakdown: {
      structureClarity: Math.round(structureScore),
      sectionPresence: Math.round(sectionScore),
      formattingQuality: Math.round(formattingScore),
      contactInfo: Math.round(contactScore),
      lengthAppropriate: Math.round(lengthScore),
      sectionsFound,
      wordCount,
    },
  };
}

// ---------------------------------------------------------------
// Job-Match Score (relevance to a specific job description)
// ---------------------------------------------------------------

/**
 * Calculate job-match score using taxonomy-based skill matching
 * combined with AI-extracted evidence.
 *
 * @param {object} params
 * @param {string} params.resumeText
 * @param {string} params.jobDescriptionText
 * @param {string[]} params.requiredSkills - from JD parsing
 * @param {string[]} params.preferredSkills - from JD parsing
 * @param {object} params.aiEvidence - AI-extracted evidence mapping
 * @param {object} params.aiScores - AI-provided supplementary scores
 * @returns {{ score: number, breakdown: object, skillMatches: object[], missingSkills: object[], partialMatches: object[] }}
 */
function calculateJobMatchScore({
  resumeText = '',
  jobDescriptionText = '',
  requiredSkills = [],
  preferredSkills = [],
  aiEvidence = {},
  aiScores = {},
}) {
  // Extract skills from resume text using taxonomy
  const resumeSkills = extractSkillsFromText(resumeText);
  const resumeSkillIds = new Set(resumeSkills.map(s => s.id));

  // Normalize required and preferred skills
  const normalizedRequired = normalizeSkillList(requiredSkills);
  const normalizedPreferred = normalizeSkillList(preferredSkills);

  // If no explicit required/preferred provided, extract from JD text
  if (normalizedRequired.length === 0 && jobDescriptionText) {
    const jdSkills = extractSkillsFromText(jobDescriptionText);
    for (const s of jdSkills) {
      normalizedRequired.push(s.id);
    }
  }

  // Deduplicate
  const reqSet = [...new Set(normalizedRequired)];
  const prefSet = [...new Set(normalizedPreferred.filter(p => !reqSet.includes(p)))];

  // Match required skills
  const { matches: reqMatches, missing: reqMissing, partial: reqPartial, score: reqScore } =
    matchSkillSet(reqSet, resumeSkillIds, aiEvidence);

  // Match preferred skills
  const { matches: prefMatches, missing: prefMissing, partial: prefPartial, score: prefScore } =
    matchSkillSet(prefSet, resumeSkillIds, aiEvidence);

  // Experience relevance (from AI or basic heuristic)
  const experienceScore = aiScores.experienceRelevance || estimateExperienceRelevance(resumeText, jobDescriptionText);

  // Project evidence (from AI or basic heuristic)
  const projectScore = aiScores.projectRelevance || estimateProjectRelevance(resumeText, jobDescriptionText);

  // Qualifications
  const qualificationScore = aiScores.qualificationScore || 50;

  // Domain alignment
  const domainScore = aiScores.domainAlignment || estimateDomainAlignment(resumeText, jobDescriptionText);

  // Weighted overall
  const weights = SCORING_CONFIG.jobMatch;
  const overallMatch = Math.round(
    weights.requiredSkills * reqScore +
    weights.preferredSkills * prefScore +
    weights.relevantExperience * experienceScore +
    weights.projectEvidence * projectScore +
    weights.qualifications * qualificationScore +
    weights.domainAlignment * domainScore
  );

  return {
    score: clamp(overallMatch, 0, 100),
    breakdown: {
      requiredSkillScore: Math.round(reqScore),
      preferredSkillScore: Math.round(prefScore),
      experienceRelevance: Math.round(experienceScore),
      projectEvidence: Math.round(projectScore),
      qualifications: Math.round(qualificationScore),
      domainAlignment: Math.round(domainScore),
      weights,
    },
    skillMatches: [...reqMatches, ...prefMatches],
    missingSkills: [...reqMissing, ...prefMissing],
    partialMatches: [...reqPartial, ...prefPartial],
    resumeSkills,
    requiredSkillIds: reqSet,
    preferredSkillIds: prefSet,
  };
}

// ---------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------

/**
 * Match a set of required/preferred skill IDs against candidate skills.
 */
function matchSkillSet(skillIds, candidateSkillIds, aiEvidence = {}) {
  const matches = [];
  const missing = [];
  const partial = [];

  if (skillIds.length === 0) {
    return { matches, missing, partial, score: 75 }; // neutral when no skills specified
  }

  let totalCredit = 0;

  for (const reqId of skillIds) {
    const skill = getSkill(reqId);
    const skillName = skill ? skill.name : reqId;

    // Check direct match
    if (candidateSkillIds.has(reqId)) {
      matches.push({
        skillId: reqId,
        skillName,
        matchType: 'exact',
        credit: 1.0,
        evidence: aiEvidence[reqId] || 'Found in resume',
      });
      totalCredit += 1.0;
      continue;
    }

    // Check AI evidence
    if (aiEvidence[reqId]) {
      matches.push({
        skillId: reqId,
        skillName,
        matchType: 'ai-evidence',
        credit: 0.85,
        evidence: aiEvidence[reqId],
      });
      totalCredit += 0.85;
      continue;
    }

    // Check related skills
    let foundRelated = false;
    const relatedIds = getRelatedSkills(reqId);
    for (const relId of relatedIds) {
      if (candidateSkillIds.has(relId)) {
        const relSkill = getSkill(relId);
        partial.push({
          skillId: reqId,
          skillName,
          matchType: 'related',
          relatedTo: relSkill ? relSkill.name : relId,
          credit: SCORING_CONFIG.relatedSkillCredit,
          evidence: `Related skill "${relSkill ? relSkill.name : relId}" found`,
        });
        totalCredit += SCORING_CONFIG.relatedSkillCredit;
        foundRelated = true;
        break;
      }
    }

    if (foundRelated) continue;

    // Check same category
    let foundCategory = false;
    for (const candId of candidateSkillIds) {
      if (reqId !== candId && areRelated(reqId, candId)) {
        // Already checked above
      }
      const reqSkill = getSkill(reqId);
      const candSkill = getSkill(candId);
      if (reqSkill && candSkill && reqSkill.category === candSkill.category) {
        partial.push({
          skillId: reqId,
          skillName,
          matchType: 'same-category',
          relatedTo: candSkill.name,
          credit: SCORING_CONFIG.sameCategoryCredit,
          evidence: `Same category skill "${candSkill.name}" found`,
        });
        totalCredit += SCORING_CONFIG.sameCategoryCredit;
        foundCategory = true;
        break;
      }
    }

    if (foundCategory) continue;

    // Not found
    missing.push({
      skillId: reqId,
      skillName,
      matchType: 'missing',
      credit: 0,
      priority: skill ? 'high' : 'medium',
    });
  }

  const score = skillIds.length > 0
    ? (totalCredit / skillIds.length) * 100
    : 75;

  return { matches, missing, partial, score: clamp(score, 0, 100) };
}

/**
 * Normalize an array of skill name strings to canonical IDs.
 * Filters out unrecognized skills.
 */
function normalizeSkillList(skills) {
  if (!Array.isArray(skills)) return [];
  const result = [];
  for (const raw of skills) {
    const id = normalizeSkill(raw);
    if (id) result.push(id);
  }
  return result;
}

/**
 * Estimate experience relevance from text overlap (basic heuristic).
 */
function estimateExperienceRelevance(resumeText, jdText) {
  if (!jdText || !resumeText) return 50;
  const lower = resumeText.toLowerCase();
  const hasExperience = /experience|worked|developed|built|implemented|designed|managed/i.test(lower);
  const hasYears = /\d+\s*(years?|yrs?)/.test(lower);
  return hasExperience ? (hasYears ? 75 : 60) : 40;
}

/**
 * Estimate project relevance (basic heuristic).
 */
function estimateProjectRelevance(resumeText, jdText) {
  if (!resumeText) return 30;
  const lower = resumeText.toLowerCase();
  const hasProjects = /project|portfolio|built|created|developed|application|website|app/i.test(lower);
  return hasProjects ? 70 : 35;
}

/**
 * Estimate domain alignment (basic heuristic).
 */
function estimateDomainAlignment(resumeText, jdText) {
  if (!jdText || !resumeText) return 50;
  const jdCategories = inferJobCategories(jdText);
  const resumeSkills = extractSkillsFromText(resumeText);
  const resumeCategories = new Set(resumeSkills.map(s => {
    const skill = getSkill(s.id);
    return skill ? skill.category : null;
  }).filter(Boolean));

  let overlap = 0;
  for (const cat of jdCategories) {
    if (resumeCategories.has(cat)) overlap++;
  }

  return jdCategories.length > 0
    ? Math.round((overlap / jdCategories.length) * 100)
    : 50;
}

/**
 * Compute a combined overall score from ATS and job-match.
 * This is for display purposes; they should also be shown separately.
 */
function calculateOverallScore(atsScore, jobMatchScore) {
  // Weighted: 30% ATS readability + 70% job match
  return clamp(Math.round(0.3 * atsScore + 0.7 * jobMatchScore), 0, 100);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

module.exports = {
  SCORING_CONFIG,
  calculateATSScore,
  calculateJobMatchScore,
  calculateOverallScore,
  normalizeSkillList,
};
