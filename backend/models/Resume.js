const mongoose = require('mongoose');

/**
 * Resume Schema: Stores candidate resume metadata, raw extracted text, and parsed profile sections.
 */
const resumeSchema = new mongoose.Schema(
  {
    candidateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    fileName: {
      type: String,
      required: true
    },
    fileType: {
      type: String,
      required: true
    },
    rawText: {
      type: String,
      required: true
    },
    parsedProfile: {
      skills: [{ type: String }],
      experience: [
        {
          company: String,
          role: String,
          dates: String,
          bulletPoints: [String]
        }
      ],
      education: [
        {
          institution: String,
          degree: String,
          year: String
        }
      ],
      contact: {
        email: String,
        phone: String,
        linkedin: String
      }
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Resume', resumeSchema);
