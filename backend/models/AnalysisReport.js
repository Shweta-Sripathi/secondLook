const mongoose = require('mongoose');

/**
 * AnalysisReport Schema
 *
 * Stores AI-powered resume evaluations with separate ATS readability
 * and job-match scores, skill evidence mapping, and improvement recommendations.
 */
const analysisReportSchema = new mongoose.Schema(
  {
    candidateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    recruiterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    resumeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Resume',
      required: true
    },
    jobDescriptionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'JobDescription'
    },
    scores: {
      overallScore: { type: Number, required: true },
      atsScore: { type: Number, default: 0 },
      jobMatchScore: { type: Number, default: 0 },
      keywordMatchScore: { type: Number, required: true },
      semanticFitScore: { type: Number, required: true },
      impactScore: { type: Number, required: true },
      formattingScore: { type: Number, required: true }
    },
    keywords: {
      foundKeywords: [{ type: String }],
      missingKeywords: [{ type: String }]
    },
    bulletImprovements: [
      {
        original: { type: String },
        suggested: { type: String },
        reason: { type: String }
      }
    ],
    interviewQuestions: [{ type: String }],
    summary: { type: String }
  },
  {
    timestamps: true
  }
);

// Index for faster queries
analysisReportSchema.index({ candidateId: 1, createdAt: -1 });
analysisReportSchema.index({ jobDescriptionId: 1, 'scores.overallScore': -1 });

module.exports = mongoose.model('AnalysisReport', analysisReportSchema);
