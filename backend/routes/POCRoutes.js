import express from "express";
import { createPOC, getPOCDocx } from "../controllers/POC.js";

const router = express.Router();

router.post("/create", createPOC);
router.get("/docx/:pocId", getPOCDocx);


export default router;
