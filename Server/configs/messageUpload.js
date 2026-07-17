import multer from "multer";
import path from "path";

const allowedExtensions = new Set([
  ".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg", ".avif", ".bmp",
  ".mp4", ".mov", ".avi", ".mkv", ".webm", ".m4v",
  ".mp3", ".wav", ".aac", ".ogg", ".m4a", ".flac",
  ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".csv", ".ppt", ".pptx", ".txt",
  ".zip", ".rar", ".7z", ".json", ".xml",
  ".js", ".ts", ".jsx", ".tsx", ".html", ".css", ".java", ".c", ".cpp", ".h", ".hpp", ".py", ".php", ".rb", ".go", ".rs", ".sql", ".md", ".yml", ".yaml",
]);

const messageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    if (!allowedExtensions.has(extension)) {
      const error = new Error("This file type is not supported");
      error.code = "UNSUPPORTED_FILE_TYPE";
      return callback(error);
    }
    callback(null, true);
  },
});

export const messageAttachmentUpload = messageUpload.any();

export const handleMessageUpload = (req, res, next) => {
  messageAttachmentUpload(req, res, (error) => {
    if (!error) return next();
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({ success: false, message: "Attachments must be 25 MB or smaller" });
    }
    if (error.code === "UNSUPPORTED_FILE_TYPE") {
      return res.status(415).json({ success: false, message: "This file type is not supported" });
    }
    if (error.code === "LIMIT_FILE_COUNT" || error.code === "LIMIT_UNEXPECTED_FILE") {
      return res.status(400).json({ success: false, message: "Only one attachment can be sent at a time" });
    }
    return res.status(400).json({ success: false, message: error.message || "Invalid attachment upload" });
  });
};
