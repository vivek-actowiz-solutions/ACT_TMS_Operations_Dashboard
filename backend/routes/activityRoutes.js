import express from "express";
import ActivityLog from "../models/ActivityLog.js";

const router = express.Router();

// ✅ Fetch logs for a specific task
router.get("/:taskId/logs/:domainName", async (req, res) => {
  try {
    const { taskId, domainName } = req.params;

    const decoded = decodeURIComponent(domainName);

    const logs = await ActivityLog.find({
      taskId: taskId,
      domainName: decoded
    }).sort({ timestamp: -1 });

    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});




export default router;
