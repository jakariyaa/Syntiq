import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { startQuiz, submitQuiz } from "../controllers/quiz.controller";

const router = Router();

router.post("/start", requireAuth, startQuiz);
router.post("/submit", requireAuth, submitQuiz);

export default router;
