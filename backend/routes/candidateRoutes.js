const express = require('express');
const router = express.Router();
const { analyzeResume, analyzeAgainstJob, getHistory, expressInterest, getPublicJobs } = require('../controllers/candidateController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const { uploadSingle } = require('../middleware/uploadMiddleware');

// All candidate routes require authentication and 'candidate' role authorization
router.use(protect);
router.use(authorizeRoles('candidate'));

router.post('/analyze', uploadSingle, analyzeResume);
router.post('/analyze-job/:jobId', uploadSingle, analyzeAgainstJob);
router.get('/history', getHistory);
router.get('/jobs', getPublicJobs);
router.post('/express-interest/:jobId', expressInterest);

module.exports = router;
