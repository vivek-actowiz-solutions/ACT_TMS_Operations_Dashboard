import POC from "../models/POC.js";
import fs from "fs";
import path from "path";
import { generatePOCDocxBuffer } from "../utils/generatePOCDocx.js";

 

export const createPOC = async (req, res) => {
  try {
    const body = req.body;

    console.log("Create POC request body:", body);

    // Convert string fields to array/object if needed
    if (typeof body.MandatoryFields === "string") {
      body.MandatoryFields = JSON.parse(body.MandatoryFields);
    }
    if (typeof body.TargetWebsite === "string") {
      body.TargetWebsite = JSON.parse(body.TargetWebsite);
    }

    // ⛔ Check if POC already exists for this task
    let existingPOC = await POC.findOne({ taskId: body.taskId });

    let pocDoc;
      

    if (existingPOC && existingPOC.generatedPOCFile) {
      const oldFilePath = path.join("uploads", "poc", path.basename(existingPOC.generatedPOCFile));
      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath); // delete old file
        console.log("Old POC file deleted:", oldFilePath);
      } else {
        console.log("Old file not found:", oldFilePath);
      }
    }

    if (existingPOC) {
      // 🔄 Update existing POC
      Object.assign(existingPOC, body);
      pocDoc = await existingPOC.save();
    } else {
      // 🆕 Create new POC entry
      pocDoc = await POC.create(body);
    }

    // ---------------------------------------------------------
    //  📄 Generate DOCX buffer
    // ---------------------------------------------------------
    const buffer = await generatePOCDocxBuffer(pocDoc);

    // Create uploads folder if missing
    const folderPath = path.join("uploads", "poc");
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }
    const now = new Date();
    const dateSuffix = `${now.getFullYear()}_${String(
      now.getMonth() + 1
    ).padStart(2, "0")}_${String(now.getDate()).padStart(
      2,
      "0"
    )}_${String(now.getHours()).padStart(2, "0")}_${String(
      now.getMinutes()
    ).padStart(2, "0")}`;

    let projectName = "project";
    if (body.projectName) {
      projectName = body.projectName
        .replace(/\s+/g, "_")                
        .replace(/[^a-zA-Z0-9._-]/g, "_")
           
    }
    // File name
    const fileName = `${projectName}_POCFile_${dateSuffix}.docx`;
    const filePath = path.join(folderPath, fileName);

    // Save file
    fs.writeFileSync(filePath, buffer);

    // Save file URL in DB

    pocDoc.generatedPOCFile = `/uploads/poc/${fileName}`;
    await pocDoc.save();




    return res.status(201).json({
      message: "POC created successfully & DOCX generated",
      data: pocDoc,
      fileUrl: `/uploads/poc/${fileName}`,
    });

  } catch (error) {
    console.error("Create POC error:", error);
    return res.status(500).json({ message: "Server Error", error });
  }
};



// get POCdox file 
export const getPOCDocx = async (req, res) => {
  try {
    const { pocId } = req.params;

    const poc = await POC.findById(pocId);
    if (!poc) return res.status(404).json({ message: "POC not found" });

    const filePath = path.join("uploads", "poc", path.basename(poc.generatedPOCFile));

    if (fs.existsSync(filePath)) {
      return res.sendFile(filePath, { root: "." }); // root "." ensures relative path works
    } else {
      console.error("File not found at:", filePath);
      return res.status(404).json({ message: "File not found" });
    }
  } catch (error) {
    console.error("Get POC error:", error);
    return res.status(500).json({ message: "Server Error", error });
  }
};



