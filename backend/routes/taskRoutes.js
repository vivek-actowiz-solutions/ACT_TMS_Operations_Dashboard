import express from "express";
import { authorize, developerOnly } from "../middleware/Autho.js";





import {
  createTask,
  getTask,

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
  getTLUsers

} from "../controllers/taskController.js";

const router = express.Router();

import upload from "../middleware/multer.js";


router.get("/tasks/test", testDB2);
// router.get("/tasksrd", gettaskcheck);
router.post("/tasks", authorize(['Admin', 'Manager']), upload.fields([
  { name: "sowFile", maxCount: 10 },
  { name: "inputFile", maxCount: 10 },
  { name: "clientSampleSchemaFiles", maxCount: 20 },
]), createTask);

router.get("/tasks/list", authorize(['Admin', 'Manager']), getTaskList);


 router.get("/tasks-rd/stats", authorize(['Admin', 'TL', 'Developer', 'Manager']), getDomainStatsRD);

router.get("/tasks/:id/reopen-data",
  authorize(['Admin', 'Manager']),
  getReopenTaskData
);


router.put("/tasks/:id/reopen", upload.fields([{ name: "sowFile", maxCount: 20 }]), authorize(['Admin', 'Manager']), reOpenTask);

router.put(
  "/tasks/domain-status",
  authorize(['TL', 'Manager', 'Admin']),
  upload.single('file'),
  updateTaskDomainStatus
);
// router.put(
//   "/tasks/:id",
//   authorize(['Admin',  'TL', 'Manager']),
//   upload.fields([
//     { name: "sowFile", maxCount: 10 },
//     { name: "inputFile", maxCount: 10 },
//     { name: "clientSampleSchemaFile", maxCount: 20 },
//     { name: "outputFiles", maxCount: 20 },
//   ]),
//   updateTask
// );

router.post("/tasks/:id/submit", authorize(['Admin', 'TL', 'Developer']), upload.fields([
  { name: "outputFiles", maxCount: 20 },
]), submitTask);

router.post(
  "/tasks/:id/edit-submission",

  authorize(['Admin', 'TL', 'Developer']),
  upload.fields([
    { name: "outputFiles", maxCount: 20 },
    { name: "newOutputFiles", maxCount: 20 }
  ]),
  editDomainSubmission
);



router.get("/tasks/developers", authorize(['Manager', 'Admin', 'TL']), getDevelopersDomainStatus);
router.get("/tasks/assignTo", authorize(['Admin', 'TL', 'Developer', 'Manager']), getTLUsers);
router.get("/tasks/stats", authorize(['Admin', 'TL', 'Developer', 'Manager']), getDomainStats);
router.get("/tasks", authorize(['Admin', 'TL', 'Developer', 'Manager']), developerOnly, getTask);
router.get(
  "/tasks/:id/domain/:domainName",
  authorize(['Admin', 'TL', 'Developer', 'Manager']),
  getTaskDomain
);

router.get("/tasks/:id", authorize(['Admin', 'TL', 'Developer', 'Manager']), getSingleTask);
// TL and Manager can update domain status
router.get("/tasks/single/:id", authorize(['Admin', 'TL', 'Manager']), getSingleTaskList);


router.get("/tasks/developers", authorize(['Manager', 'TL', '']), getDevelopersDomainStatus);
router.get("/tasks/created/by-all-users", authorize(['Manager', 'TL', 'Admin']), getAllUsersTaskCreatedStats);
router.put("/tasks/domain/terminate", authorize(['Manager', 'Admin']), terminateDomain);



router.get("/tasks-rd", authorize(['Admin', 'TL', 'Developer', 'Manager']), getTaskRD);

 router.get("/tasks-rd/:id", authorize(['Admin', 'TL', 'Developer', 'Manager']), getSingleTaskRD);


export default router;


