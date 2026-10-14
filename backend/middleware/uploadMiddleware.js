const multer = require('multer');
const path = require('path');

// Configure in-memory storage buffer (keeps raw file in memory as req.file.buffer)
const storage = multer.memoryStorage();

/**
 * File filter validator: Ensures uploaded files are strictly PDF or DOCX documents
 */
const fileFilter = (req, file, cb) => {
  const allowedExtensions = /pdf|docx|doc/;
  const extName = allowedExtensions.test(path.extname(file.originalname).toLowerCase());
  const mimeType =
    file.mimetype === 'application/pdf' ||
    file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    file.mimetype === 'application/msword' ||
    allowedExtensions.test(file.mimetype);

  if (extName && mimeType) {
    return cb(null, true);
  } else {
    cb(new Error('Invalid file format. Only .pdf and .docx resume files are accepted!'));
  }
};

// Initialize Multer instance with 10MB file limit and in-memory storage
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter
});

// Export middleware handlers for single file uploads and batch file uploads
const uploadSingle = upload.single('resume');
const uploadBatch = upload.array('resumes', 10);

module.exports = {
  uploadSingle,
  uploadBatch
};
