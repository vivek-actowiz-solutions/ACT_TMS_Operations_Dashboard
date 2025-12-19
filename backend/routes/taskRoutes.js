import express from "express";
import { authorize, developerOnly } from "../middleware/Autho.js";





import {
  createTask,
  getTask,
updateTask,
  submitTask,
  getSingleTask,
  updateTaskDomainStatus,
  getDevelopersDomainStatus,
  getDomainStats,
  editDomainSubmission,
  getTaskDomain,
  reOpenTask,
  getReopenTaskData,
  getTaskList,
  getSingleTaskList,
  terminateDomain,
  getAllUsersTaskCreatedStats,
  getTaskRD,
  getSingleTaskRD,
  testDB2,
  getDomainStatsRD,
  getTLUsers,
  getAllTasks,
  assignTask

} from "../controllers/taskController.js";

const router = express.Router();

import upload from "../middleware/multer.js";


router.get("/tasks/test", testDB2);

router.post("/tasks", authorize(['Admin', 'Manager','Sales','SuperAdmin']), upload.fields([
  { name: "sowFile", maxCount: 10 },
  { name: "inputFile", maxCount: 10 },
  { name: "clientSampleSchemaFiles", maxCount: 20 },
]), createTask);

router.get("/tasks/getAllTasks", authorize(['Admin', 'Manager','Sales','SuperAdmin']), getAllTasks);
router.post("/tasks/assign/:id", authorize(['Admin', 'Manager','Sales','SuperAdmin']), assignTask);

router.get("/tasks/list", authorize(['Admin', 'Manager','Sales','SuperAdmin']), getTaskList);


 router.get("/tasks-rd/stats", authorize(['Admin', 'TL', 'Developer', 'Manager','Sales','SuperAdmin']), getDomainStatsRD);

router.get("/tasks/:id/reopen-data",
  authorize(['Admin', 'Manager','Sales','SuperAdmin']),
  getReopenTaskData
);




router.put("/tasks/:id/reopen", upload.fields([{ name: "sowFile", maxCount: 20 }]), authorize(['Admin', 'Manager','Sales','SuperAdmin']), reOpenTask);

router.put(
  "/tasks/domain-status",
  authorize([ 'Manager', 'Admin','SuperAdmin']),
  upload.single('file'),
  updateTaskDomainStatus
);
router.put(
  "/tasks/:id",
  authorize(['Admin','SuperAdmin' , 'Manager',]),
  upload.fields([
    { name: "sowFile", maxCount: 10 },
    { name: "inputFile", maxCount: 10 },
    { name: "clientSampleSchemaFile", maxCount: 20 },
    { name: "outputFiles", maxCount: 20 },
  ]),
  updateTask
);

router.post("/tasks/:id/submit", authorize(['Admin', 'TL','SuperAdmin','Manager']), upload.fields([
  { name: "outputFiles", maxCount: 20 },
]), submitTask);

router.post(
  "/tasks/:id/edit-submission",

  authorize(['Admin','SuperAdmin','Manager']),
  upload.fields([
    { name: "outputFiles", maxCount: 20 },
    { name: "newOutputFiles", maxCount: 20 }
  ]),
  editDomainSubmission
);



router.get("/tasks/developers", authorize(['Manager', 'Admin', 'SuperAdmin']), getDevelopersDomainStatus);
router.get("/tasks/assignTo", authorize(['Admin', 'SuperAdmin', 'Manager']), getTLUsers);
router.get("/tasks/stats", authorize(['Admin', 'TL', 'Developer', 'Manager','Sales','SuperAdmin']), getDomainStats);
router.get("/tasks", authorize(['Admin', 'TL', 'Developer', 'Manager','Sales','SuperAdmin']), developerOnly, getTask);
router.get(
  "/tasks/:id/domain/:domainName",
  authorize(['Admin', 'TL', 'Developer', 'Manager']),
  getTaskDomain
);

router.get("/tasks/:id", authorize(['Admin', 'TL', 'Developer', 'Manager','SuperAdmin','Sales']), getSingleTask);
// TL and Manager can update domain status
router.get("/tasks/single/:id", authorize(['Admin', 'TL', 'Manager','SuperAdmin','Sales']), getSingleTaskList);


router.get("/tasks/developers", authorize(['Manager', 'TL', 'Sales','SuperAdmin']), getDevelopersDomainStatus);
router.get("/tasks/created/by-all-users", authorize(['Manager', 'TL', 'Admin','SuperAdmin','Sales']), getAllUsersTaskCreatedStats);
router.put("/tasks/domain/terminate", authorize(['Manager', 'Admin','SuperAdmin']), terminateDomain);



router.get("/tasks-rd", authorize(['Admin', 'TL', 'Developer', 'Manager','SuperAdmin','Sales']), getTaskRD);

 router.get("/tasks-rd/:id", authorize(['Admin', 'TL', 'Developer', 'Manager','SuperAdmin','Sales']), getSingleTaskRD);


export default router;


