const express = require('express');
const router = express.Router();
const {
  createJobDescription,
  getJobDescriptions,
  getJobApplications,
  batchScanResumes
} = require('../controllers/recruiterController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const { uploadBatch } = require('../middleware/uploadMiddleware');

// All recruiter routes require authentication and 'recruiter' role authorization
router.use(protect);
router.use(authorizeRoles('recruiter'));

router.post('/job-description', createJobDescription);
router.get('/job-descriptions', getJobDescriptions);
router.get('/job-applications/:jobId', getJobApplications);
router.post('/batch-scan', uploadBatch, batchScanResumes);

module.exports = router;
