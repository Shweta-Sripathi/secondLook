/**
 * secondLook AI Analysis Service
 *
 * Wraps the Gemini API with:
 * - Structured output schema and server-side validation
 * - Hash-based caching to avoid duplicate calls
 * - Exponential backoff with retry
 * - Concurrency limiting
 * - Graceful degradation (returns deterministic results when AI fails)
 * - Configurable model name via GEMINI_MODEL env var
 */

const crypto = require('crypto');
const { GoogleGenAI, Type } = require('@google/genai');
const {
  extractSkillsFromText,
  inferJobCategories,
  normalizeSkill,
  getSkill,
} = require('./skillTaxonomy');

// ---------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------
const DEFAULT_MODEL = 'gemini-2.0-flash';
const MAX_RETRIES = 3;
const BASE_DELAY_MS = 2000;
const TIMEOUT_MS = 30000;
const MAX_CONCURRENT = 3;

// ---------------------------------------------------------------
// In-memory cache (keyed by input hash)
// ---------------------------------------------------------------
const analysisCache = new Map();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

// Concurrency limiter
let activeRequests = 0;
const requestQueue = [];

// ---------------------------------------------------------------
// Gemini structured output schema
// ---------------------------------------------------------------
const analysisSchema = {
  type: Type.OBJECT,
  properties: {
    extractedSkills: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          skill: { type: Type.STRING, description: 'Skill name' },
          evidenceType: { type: Type.STRING, description: 'listed | project | experience | inferred' },
          evidence: { type: Type.STRING, description: 'Brief quote or description from resume' },
          confidence: { type: Type.STRING, description: 'high | medium | low' },
        },
        required: ['skill', 'evidenceType', 'evidence', 'confidence'],
      },
    },
    requirementMatches: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          requirement: { type: Type.STRING, description: 'Job requirement or skill' },
          status: { type: Type.STRING, description: 'demonstrated | partial | not-found | uncertain' },
          evidence: { type: Type.STRING, description: 'Supporting evidence from resume or explanation' },
          confidence: { type: Type.STRING, description: 'high | medium | low' },
        },
        required: ['requirement', 'status', 'evidence', 'confidence'],
      },
    },
    strengths: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Evidence-based strengths relevant to the target role',
    },
    improvements: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          area: { type: Type.STRING },
          suggestion: { type: Type.STRING },
          priority: { type: Type.STRING, description: 'high | medium | low' },
        },
        required: ['area', 'suggestion', 'priority'],
      },
    },
    experienceRelevance: { type: Type.NUMBER, description: '0-100 relevance of work experience to the job' },
    projectRelevance: { type: Type.NUMBER, description: '0-100 relevance of projects to the job' },
    qualificationScore: { type: Type.NUMBER, description: '0-100 qualification alignment' },
    domainAlignment: { type: Type.NUMBER, description: '0-100 domain/industry alignment' },
    summary: { type: Type.STRING, description: 'Brief professional assessment (2-3 sentences)' },
  },
  required: ['extractedSkills', 'requirementMatches', 'strengths', 'improvements',
             'experienceRelevance', 'projectRelevance', 'qualificationScore', 'domainAlignment', 'summary'],
};

// ---------------------------------------------------------------
// Public API
// ---------------------------------------------------------------

/**
 * Analyze a resume against a job description using Gemini AI.
 * Returns structured, validated analysis or gracefully degrades.
 *
 * @param {string} resumeText
 * @param {string} jobDescriptionText
 * @param {string[]} requiredSkills - pre-extracted required skills
 * @param {string[]} preferredSkills - pre-extracted preferred skills
 * @returns {Promise<object>} Analysis result
 */
async function analyzeWithAI(resumeText, jobDescriptionText = '', requiredSkills = [], preferredSkills = []) {
  // Generate cache key
  const cacheKey = generateCacheKey(resumeText, jobDescriptionText, requiredSkills, preferredSkills);

  // Check cache
  const cached = analysisCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return { ...cached.data, fromCache: true };
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY_HERE') {
    console.log('[secondLook] GEMINI_API_KEY not configured. Using taxonomy-only analysis.');
    return buildDeterministicResult(resumeText, jobDescriptionText, requiredSkills, preferredSkills);
  }

  try {
    const result = await withConcurrencyLimit(async () => {
      return await callGeminiWithRetry(apiKey, resumeText, jobDescriptionText, requiredSkills, preferredSkills);
    });

    // Validate the AI response
    const validated = validateAndNormalize(result);

    // Cache the result
    analysisCache.set(cacheKey, { data: validated, timestamp: Date.now() });

    // Evict old cache entries periodically
    if (analysisCache.size > 100) {
      evictStaleCache();
    }

    return { ...validated, fromCache: false, aiAvailable: true };
  } catch (error) {
    console.error('[secondLook] AI analysis failed:', error.message);

    // Graceful degradation: return deterministic results
    const fallback = buildDeterministicResult(resumeText, jobDescriptionText, requiredSkills, preferredSkills);
    return { ...fallback, aiAvailable: false, aiError: error.message };
  }
}

// ---------------------------------------------------------------
// Gemini API call with retry
// ---------------------------------------------------------------

async function callGeminiWithRetry(apiKey, resumeText, jdText, requiredSkills, preferredSkills) {
  const model = process.env.GEMINI_MODEL || DEFAULT_MODEL;
  const ai = new GoogleGenAI({ apiKey });

  const prompt = buildPrompt(resumeText, jdText, requiredSkills, preferredSkills);

  let lastError;
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const response = await withTimeout(
        ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: analysisSchema,
            systemInstruction: [
              'You are a professional resume analyst for secondLook, an AI recruitment platform.',
              'Analyze the resume against the job description objectively.',
              'Base all assessments on evidence found in the resume text.',
              'Do not fabricate skills, experience, or qualifications not present in the resume.',
              'If something is uncertain, mark it as uncertain rather than claimed.',
              'Do not use emojis in any output.',
            ].join(' '),
          },
        }),
        TIMEOUT_MS
      );

      const parsed = JSON.parse(response.text);
      return parsed;
    } catch (error) {
      lastError = error;
      if (attempt < MAX_RETRIES - 1) {
        const delay = BASE_DELAY_MS * Math.pow(2, attempt) + Math.random() * 1000;
        console.log(`[secondLook] Gemini retry ${attempt + 1}/${MAX_RETRIES} in ${Math.round(delay)}ms`);
        await sleep(delay);
      }
    }
  }

  throw lastError;
}

// ---------------------------------------------------------------
// Prompt builder
// ---------------------------------------------------------------

function buildPrompt(resumeText, jdText, requiredSkills, preferredSkills) {
  const categories = inferJobCategories(jdText);

  return `Analyze this resume against the job description.

RESUME TEXT:
${truncateText(resumeText, 6000)}

JOB DESCRIPTION:
${jdText ? truncateText(jdText, 3000) : 'General software development role'}

${requiredSkills.length > 0 ? `REQUIRED SKILLS: ${requiredSkills.join(', ')}` : ''}
${preferredSkills.length > 0 ? `PREFERRED SKILLS: ${preferredSkills.join(', ')}` : ''}
RELEVANT CATEGORIES: ${categories.join(', ')}

Instructions:
1. Extract all skills from the resume. For each skill, note whether it was explicitly listed, demonstrated through a project, shown in work experience, or inferred from context. Provide the evidence.
2. For each job requirement (from the required skills list and job description), assess whether the candidate has demonstrated it, partially demonstrated it, or whether no evidence was found.
3. List evidence-based strengths relevant to the target role.
4. Suggest improvements with priority (focus on missing required skills first).
5. Score experience relevance, project relevance, qualification alignment, and domain alignment (each 0-100).
6. Write a professional summary (2-3 sentences, no emojis).

Be honest. Do not claim skills are demonstrated when there is no evidence. Mark uncertain assessments as uncertain.`;
}

// ---------------------------------------------------------------
// Deterministic fallback (taxonomy-only, no fabrication)
// ---------------------------------------------------------------

function buildDeterministicResult(resumeText, jdText, requiredSkills, preferredSkills) {
  const resumeSkills = extractSkillsFromText(resumeText);
  const jdSkills = extractSkillsFromText(jdText);

  // Build extracted skills list
  const extractedSkills = resumeSkills.map(s => ({
    skill: s.name,
    evidenceType: 'listed',
    evidence: 'Found in resume text via taxonomy matching',
    confidence: s.matchType === 'exact' ? 'high' : 'medium',
  }));

  // Build requirement matches
  const allRequired = [...new Set([
    ...requiredSkills.map(r => normalizeSkill(r)).filter(Boolean),
    ...jdSkills.map(s => s.id),
  ])];

  const resumeSkillIds = new Set(resumeSkills.map(s => s.id));

  const requirementMatches = allRequired.map(reqId => {
    const skill = getSkill(reqId);
    const name = skill ? skill.name : reqId;

    if (resumeSkillIds.has(reqId)) {
      return { requirement: name, status: 'demonstrated', evidence: 'Skill found in resume text', confidence: 'high' };
    }

    // Check related
    const related = skill ? skill.related : [];
    for (const relId of related) {
      if (resumeSkillIds.has(relId)) {
        const relSkill = getSkill(relId);
        return {
          requirement: name,
          status: 'partial',
          evidence: `Related skill "${relSkill ? relSkill.name : relId}" found in resume`,
          confidence: 'medium',
        };
      }
    }

    return { requirement: name, status: 'not-found', evidence: 'No matching evidence found in resume', confidence: 'high' };
  });

  // Simple strengths based on skill count
  const strengths = [];
  if (resumeSkills.length >= 5) strengths.push('Diverse technical skill set demonstrated');
  if (resumeSkills.some(s => s.id === 'git')) strengths.push('Version control proficiency indicated');

  const demonstrated = requirementMatches.filter(m => m.status === 'demonstrated').length;
  if (demonstrated > 0) {
    strengths.push(`${demonstrated} of ${allRequired.length} required skills directly matched`);
  }

  // Improvements
  const missing = requirementMatches.filter(m => m.status === 'not-found');
  const improvements = missing.map(m => ({
    area: m.requirement,
    suggestion: `Consider gaining experience with ${m.requirement} to strengthen your candidacy`,
    priority: 'high',
  }));

  return {
    extractedSkills,
    requirementMatches,
    strengths,
    improvements,
    experienceRelevance: 50,
    projectRelevance: 50,
    qualificationScore: 50,
    domainAlignment: estimateDomainScore(resumeSkills, jdText),
    summary: `Taxonomy-based analysis identified ${resumeSkills.length} skills. ${demonstrated} of ${allRequired.length} required skills matched. AI-enhanced analysis unavailable.`,
    aiAvailable: false,
  };
}

function estimateDomainScore(resumeSkills, jdText) {
  if (!jdText) return 50;
  const jdCategories = inferJobCategories(jdText);
  const resumeCategories = new Set(
    resumeSkills.map(s => { const sk = getSkill(s.id); return sk ? sk.category : null; }).filter(Boolean)
  );
  let overlap = 0;
  for (const c of jdCategories) { if (resumeCategories.has(c)) overlap++; }
  return jdCategories.length > 0 ? Math.round((overlap / jdCategories.length) * 100) : 50;
}

// ---------------------------------------------------------------
// Validation
// ---------------------------------------------------------------

function validateAndNormalize(data) {
  const result = { ...data };

  // Ensure arrays exist
  if (!Array.isArray(result.extractedSkills)) result.extractedSkills = [];
  if (!Array.isArray(result.requirementMatches)) result.requirementMatches = [];
  if (!Array.isArray(result.strengths)) result.strengths = [];
  if (!Array.isArray(result.improvements)) result.improvements = [];

  // Clamp numeric scores
  result.experienceRelevance = clamp(result.experienceRelevance || 50, 0, 100);
  result.projectRelevance = clamp(result.projectRelevance || 50, 0, 100);
  result.qualificationScore = clamp(result.qualificationScore || 50, 0, 100);
  result.domainAlignment = clamp(result.domainAlignment || 50, 0, 100);

  // Ensure summary is a string
  if (typeof result.summary !== 'string') result.summary = 'Analysis completed.';

  // Validate extracted skills entries
  result.extractedSkills = result.extractedSkills.filter(s =>
    s && typeof s.skill === 'string' && typeof s.evidenceType === 'string'
  );

  // Validate requirement matches
  result.requirementMatches = result.requirementMatches.filter(m =>
    m && typeof m.requirement === 'string' && typeof m.status === 'string'
  );

  return result;
}

// ---------------------------------------------------------------
// Utility functions
// ---------------------------------------------------------------

function generateCacheKey(resumeText, jdText, required, preferred) {
  const input = JSON.stringify({
    resume: resumeText ? resumeText.substring(0, 5000) : '',
    jd: jdText || '',
    req: required.sort(),
    pref: preferred.sort(),
    taxonomy: 'v1',
  });
  return crypto.createHash('sha256').update(input).digest('hex');
}

function evictStaleCache() {
  const now = Date.now();
  for (const [key, entry] of analysisCache.entries()) {
    if (now - entry.timestamp > CACHE_TTL_MS) {
      analysisCache.delete(key);
    }
  }
}

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`Request timeout after ${ms}ms`)), ms)
    ),
  ]);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function withConcurrencyLimit(fn) {
  while (activeRequests >= MAX_CONCURRENT) {
    await new Promise(resolve => requestQueue.push(resolve));
  }
  activeRequests++;
  try {
    return await fn();
  } finally {
    activeRequests--;
    if (requestQueue.length > 0) {
      const next = requestQueue.shift();
      next();
    }
  }
}

function truncateText(text, maxLength) {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '\n[...truncated]';
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, Math.round(value)));
}

module.exports = {
  analyzeWithAI,
};
