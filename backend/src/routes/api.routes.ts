import { Router } from "express";
import prisma from "../prisma.js";
import * as resourceController from "../controllers/resource.controller.js";
import * as authController from "../controllers/auth.controller.js";
import * as aiController from "../controllers/ai.controller.js";
import * as profileController from "../controllers/profile.controller.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

// --- Auth Routes ---
router.post("/auth/signup", authController.signup);
router.post("/auth/login", authController.login);
router.post("/auth/google", authController.googleLogin);
router.get("/auth/me", authenticate, authController.me);

// --- Profile Routes ---
router.post("/profiles/avatar", authenticate, profileController.getAvatar);

// --- AI Routes ---
router.post("/ai-tasks", authenticate, aiController.getAiSuggestions);

// --- Generic Resource Routes ---
const resources = [
  { path: "tasks", model: prisma.task },
  { path: "projects", model: prisma.project },
  { path: "tags", model: prisma.tag },
  { path: "comments", model: prisma.comment },
  { path: "time-logs", model: prisma.timeLog },
  { path: "notifications", model: prisma.notification },
  { path: "habits", model: prisma.habit },
  { path: "habit-completions", model: prisma.habitCompletion },
  { path: "daily-notes", model: prisma.dailyNote },
  { path: "goals", model: prisma.goal },
  { path: "profiles", model: prisma.profile },
  { path: "user-roles", model: prisma.userRole },
];

resources.forEach(({ path, model }) => {
  router.get(`/${path}`, authenticate, resourceController.getResource(model, path));
  router.post(`/${path}`, authenticate, resourceController.createResource(model, path));
  router.patch(`/${path}/:id`, authenticate, resourceController.updateResource(model, path));
  router.delete(`/${path}/:id`, authenticate, resourceController.deleteResource(model));
});

export default router;
