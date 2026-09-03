import multer from 'multer';

const storage = multer.memoryStorage();

export const noteUpload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = /\.(pdf|docx|ppt|pptx)$/i;
    if (!allowed.test(file.originalname)) {
      return cb(new Error('Only PDF, DOCX, PPT, and PPTX files are allowed'));
    }
    cb(null, true);
  },
});

export const resumeUpload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = /\.pdf$/i;
    if (!allowed.test(file.originalname)) {
      return cb(new Error('Only PDF files are allowed for resume upload'));
    }
    cb(null, true);
  },
});
