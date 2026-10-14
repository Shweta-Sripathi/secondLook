/**
 * Deterministic Keyword Extraction & Overlap Calculation
 */
const calculateKeywordOverlap = (resumeText, jobDescriptionText, foundKeywordsFromAI = []) => {
  if (!jobDescriptionText || jobDescriptionText.trim().length === 0) {
    return {
      keywordMatchScore: 85,
      foundKeywords: foundKeywordsFromAI.length > 0 ? foundKeywordsFromAI : ['JavaScript', 'Communication', 'Problem Solving'],
      missingKeywords: []
    };
  }

  const jdTextLower = jobDescriptionText.toLowerCase();
  const resumeTextLower = resumeText.toLowerCase();

  // Extract candidate keyword tokens from job description
  const words = jdTextLower.match(/\b[a-z0-9+#.]{2,}\b/g) || [];
  
  // Filter out common English stop words
  const stopWords = new Set(['the', 'and', 'for', 'with', 'that', 'this', 'from', 'have', 'will', 'you', 'are', 'not', 'our', 'team', 'work', 'experience', 'ability', 'required', 'skills', 'must', 'plus', 'preferred']);
  const uniqueJdKeywords = [...new Set(words.filter(w => !stopWords.has(w)))].slice(0, 20);

  if (uniqueJdKeywords.length === 0) {
    return {
      keywordMatchScore: 80,
      foundKeywords: foundKeywordsFromAI,
      missingKeywords: []
    };
  }

  const foundKeywords = uniqueJdKeywords.filter(keyword => resumeTextLower.includes(keyword));
  const missingKeywords = uniqueJdKeywords.filter(keyword => !resumeTextLower.includes(keyword));

  const keywordMatchScore = Math.min(Math.round((foundKeywords.length / uniqueJdKeywords.length) * 100), 100);

  return {
    keywordMatchScore,
    foundKeywords: [...new Set([...foundKeywords, ...foundKeywordsFromAI])],
    missingKeywords
  };
};

/**
 * Computes Hybrid ATS Score based on weighted formula:
 * Overall = (40% Keyword Match) + (30% Semantic Fit) + (20% Impact) + (10% Formatting)
 */
const calculateHybridATSScore = (resumeText, jobDescriptionText, aiScores = {}, aiKeywords = {}) => {
  const keywordResult = calculateKeywordOverlap(
    resumeText,
    jobDescriptionText,
    aiKeywords.foundKeywords || []
  );

  const keywordMatchScore = keywordResult.keywordMatchScore;
  const semanticFitScore = aiScores.semanticFitScore || 75;
  const impactScore = aiScores.impactScore || 70;
  const formattingScore = aiScores.formattingScore || 80;

  // Hybrid Formula Weighted Calculation
  const rawOverall =
    0.40 * keywordMatchScore +
    0.30 * semanticFitScore +
    0.20 * impactScore +
    0.10 * formattingScore;

  const overallScore = Math.min(Math.max(Math.round(rawOverall), 0), 100);

  return {
    scores: {
      overallScore,
      keywordMatchScore,
      semanticFitScore,
      impactScore,
      formattingScore
    },
    keywords: {
      foundKeywords: keywordResult.foundKeywords,
      missingKeywords: keywordResult.missingKeywords.length > 0 ? keywordResult.missingKeywords : (aiKeywords.missingKeywords || [])
    }
  };
};

module.exports = {
  calculateKeywordOverlap,
  calculateHybridATSScore
};
