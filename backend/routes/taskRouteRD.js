import express from "express";
const router = express.Router();


import { getTaskRD, getSingleTaskRD } from "../controllers/taskController.js";
import { authorize } from "../middleware/authorize.js";


router.get("/tasks/rd", authorize(['Admin', 'TL', 'Developer', 'Manager']),getTaskRD);
router.get("/tasks/rd/:id", authorize(['Admin', 'TL', 'Developer', 'Manager']) , getSingleTaskRD);


export default router;