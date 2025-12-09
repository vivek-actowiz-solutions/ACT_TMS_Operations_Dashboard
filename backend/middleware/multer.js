import fs from "fs";
import path from "path";
import multer from "multer";

const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },

  filename: (req, file, cb) => {
    const now = new Date();
    const dateSuffix = `${now.getFullYear()}_${String(
      now.getMonth() + 1
    ).padStart(2, "0")}_${String(now.getDate()).padStart(
      2,
      "0"
    )}_${String(now.getHours()).padStart(2, "0")}_${String(
      now.getMinutes()
    ).padStart(2, "0")}_${String(now.getSeconds()).padStart(2, "0")}`;

    // --------------------- FIXED ---------------------
    let projectName = "project";
    if (req.body.title) {
      projectName = req.body.title
        .replace(/\s+/g, "_")                // replace spaces
        .replace(/[^a-zA-Z0-9._-]/g, "_");   // remove illegal characters
    }

    if (req.query.title) {
      projectName = req.query.title
        .replace(/\s+/g, "_")
        .replace(/[^a-zA-Z0-9._-]/g, "_");
    }



    let fileType = "file";

    if (file.fieldname === "file") fileType = "file";
    else if (file.fieldname === "inputFile") fileType = "inputfile";
    else if (file.fieldname === "outputFiles") fileType = "outputfile";
    else if (file.fieldname === "sowFile") fileType = "sowfile";
    else if (file.fieldname === "clientSampleSchemaFile")
      fileType = "clientSampleSchema";

    const ext = path.extname(file.originalname);

    const newFileName = `${projectName}_${fileType}_${dateSuffix}${ext}`;
    cb(null, newFileName);
  },
});

const fileFilter = (req, file, cb) => {
  // Allow JSON uploads
  if (
    file.mimetype === "application/json" ||
    file.mimetype === "text/json" ||
    file.mimetype === "application/octet-stream" ||
    file.mimetype === "text/plain"
  ) {
    cb(null, true);
  } else {
    cb(null, true);
  }
};


// IMPORTANT: USE fileFilter
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 }, // Optional: 50 MB limit
});
export default upload;
