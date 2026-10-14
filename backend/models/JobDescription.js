const mongoose = require('mongoose');

/**
 * JobDescription Schema: Stores recruiter job postings, required skills, and candidate interest applications.
 */
const jobDescriptionSchema = new mongoose.Schema(
  {
    recruiterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    title: {
      type: String,
      required: [true, 'Please provide a job title'],
      trim: true
    },
    company: {
      type: String,
      required: [true, 'Please provide a company name'],
      trim: true
    },
    descriptionText: {
      type: String,
      required: [true, 'Please provide the job description text']
    },
    extractedSkills: [{ type: String }],
    applications: [
      {
        candidateId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        resumeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Resume' },
        analysisReportId: { type: mongoose.Schema.Types.ObjectId, ref: 'AnalysisReport' },
        appliedAt: { type: Date, default: Date.now }
      }
    ]
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('JobDescription', jobDescriptionSchema);
