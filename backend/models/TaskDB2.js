import { connectDB2 } from "../config/multiDb.js";
import { taskSchema } from "./Task.js";

export const TaskDB2 = connectDB2.model("TaskRD", taskSchema,"tasks");
 