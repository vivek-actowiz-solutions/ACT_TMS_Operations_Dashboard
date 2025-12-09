
import mongoose from "mongoose"; 

const activityLogSchema = new mongoose.Schema({
  taskId: { type: mongoose.Schema.Types.ObjectId, ref: "Task", required: true }, 
  domainName: { type: String },
  action: { type: String, required: true }, // e.g., "Task Created", "Task Updated", "Task Submitted"
  changedBy: { type: String, required: true },
  role: { type: String },
  timestamp: { type: Date, default: Date.now },
}); 

export default mongoose.model("ActivityLog", activityLogSchema);
