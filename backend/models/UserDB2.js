import { connectDB2 } from "../config/multiDb.js";
import { userSchema } from "./User.js";

export const UserDB2 = connectDB2.model("UserRD", userSchema, "users");
