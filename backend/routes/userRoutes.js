import express from "express";
import {
  getUserProfile,
  updateUserProfile,
  getUserDashboard,
  getUserActivity,
  getAllPatients,
} from "../controllers/userController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.use(protect);

router.get("/profile", authorizeRoles("user"), getUserProfile);
router.put("/profile", authorizeRoles("user"), updateUserProfile);
router.get("/dashboard", authorizeRoles("user"), getUserDashboard);
router.get("/activity", authorizeRoles("user"), getUserActivity);
router.get("/patients", authorizeRoles("admin"), getAllPatients);

export default router;
