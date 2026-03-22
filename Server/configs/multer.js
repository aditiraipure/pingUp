import multer from "multer";

// Configure multer storage
const storage = multer.diskStorage({});

// Create multer instance
const upload = multer({ storage });

export default upload;