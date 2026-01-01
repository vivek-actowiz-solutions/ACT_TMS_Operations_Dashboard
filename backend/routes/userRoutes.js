import express from "express";

const router = express.Router();


import { createUser, loginUser, getUserProfile,getAllUsers ,editUser, getUsersByRole,changePassword,logout,forgotPassword,verifyOTP,getAllUsersRD,} from "../controllers/userController.js";
import verifyToken from "../middleware/Auth.js";
import { authorize, developerOnly } from "../middleware/Autho.js";


router.get("/all/rd",getAllUsersRD)
router.post("/register", createUser);
router.post("/login",  loginUser);
router.get("/all",authorize(['SuperAdmin',"Sales","TL","Manager","Admin"]),getAllUsers);
router.get(
  "/",
  authorize(["SuperAdmin", "Sales", "TL", "Manager", "Admin",]),
  getUsersByRole
);
router.get("/profile/:id",verifyToken, getUserProfile);
router.put("/edit/:id", editUser);
router.put("/change-password/", verifyToken, changePassword);
router.post("/logout",verifyToken,logout)
router.post("/forgot-password", forgotPassword);
router.post("/verify-otp", verifyOTP);

export default router;
  