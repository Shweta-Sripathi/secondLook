const rawPdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const path = require('path');

// Safe function wrapper for pdf-parse supporting both CommonJS and ES module exports
const pdfParse = typeof rawPdfParse === 'function' ? rawPdfParse : (rawPdfParse.default || rawPdfParse);

/**
 * Text Sanitizer: Cleans raw extracted text by removing null bytes, control characters, and excess whitespace.
 */
const sanitizeText = (text) => {
  if (!text) return '';
  return text
    .replace(/\0/g, '') // Remove null characters
    .replace(/[\r\f]+/g, '\n') // Normalize carriage returns to newlines
    .replace(/\n{3,}/g, '\n\n') // Collapse 3+ newline streaks into clean double linebreaks
    .trim();
};

/**
 * Extracts plain text from an in-memory binary file buffer (.pdf or .docx).
 * @param {Buffer} buffer - File buffer from Multer
 * @param {String} mimeType - File MIME type
 * @param {String} fileName - Original filename
 * @returns {Promise<String>} Sanitized plain text
 */
const parseResumeBuffer = async (buffer, mimeType, fileName) => {
  if (!buffer || buffer.length === 0) {
    throw new Error('File buffer is empty. Unable to parse text.');
  }

  const ext = path.extname(fileName || '').toLowerCase();
  let extractedText = '';

  try {
    if (mimeType === 'application/pdf' || ext === '.pdf') {
      try {
        const parseFn = typeof pdfParse === 'function' ? pdfParse : require('pdf-parse');
        const pdfData = await parseFn(buffer);
        extractedText = pdfData.text || '';
      } catch (pdfErr) {
        // Fallback string extraction if pdf-parse fails on edge-case PDF buffers
        extractedText = buffer.toString('utf8').replace(/[^\x20-\x7E\n]/g, ' ');
      }
    } else if (
      mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      mimeType === 'application/msword' ||
      ext === '.docx' ||
      ext === '.doc'
    ) {
      const result = await mammoth.extractRawText({ buffer });
      extractedText = result.value || '';
    } else {
      throw new Error(`Unsupported file extension '${ext}'. Only .pdf and .docx are supported.`);
    }

    const cleanText = sanitizeText(extractedText);

    if (cleanText.length === 0) {
      throw new Error('Extracted 0 text characters. File may be a scanned image PDF or password-protected.');
    }

    return cleanText;
  } catch (error) {
    throw new Error(`Resume Text Extraction Failed: ${error.message}`);
  }
};

module.exports = {
  parseResumeBuffer,
  sanitizeText
};
