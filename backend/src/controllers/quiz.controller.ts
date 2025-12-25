import { Request, Response } from "express";
import { prisma } from "../lib/db";

const MOCK_QUESTIONS = [
    {
        questionText: "Which language is used for styling web pages?",
        options: ["HTML", "CSS", "JavaScript", "Python"],
        correctAnswer: "CSS",
        subtopic: "Frontend",
        difficulty: "EASY",
        explanation: "CSS (Cascading Style Sheets) is used to control the layout and appearance of web pages."
    },
    {
        questionText: "What does HTML stand for?",
        options: ["Hyper Text Markup Language", "High Tech Modern Language", "Hyperlinks and Text Markup Language", "Home Tool Markup Language"],
        correctAnswer: "Hyper Text Markup Language",
        subtopic: "Frontend",
        difficulty: "EASY",
        explanation: "HTML stands for Hyper Text Markup Language."
    },
    {
        questionText: "Which is a backend framework for Node.js?",
        options: ["React", "Express", "Vue", "Angular"],
        correctAnswer: "Express",
        subtopic: "Backend",
        difficulty: "MEDIUM",
        explanation: "Express is a minimal and flexible Node.js web application framework."
    },
    {
        questionText: "What is the primary key in a database?",
        options: ["A unique identifier for a record", "The first column in a table", "A password for the database", "The largest number in a table"],
        correctAnswer: "A unique identifier for a record",
        subtopic: "Database",
        difficulty: "MEDIUM",
        explanation: "A primary key is a unique identifier for each record in a database table."
    },
    {
        questionText: "Which of these is a NoSQL database?",
        options: ["PostgreSQL", "MySQL", "MongoDB", "SQLite"],
        correctAnswer: "MongoDB",
        subtopic: "Database",
        difficulty: "MEDIUM",
        explanation: "MongoDB is a popular NoSQL database program."
    },
    {
        questionText: "What does API stand for?",
        options: ["Application Programming Interface", "Apple Pie Ingredients", "Advanced Peripheral Interface", "Automated Program Instruction"],
        correctAnswer: "Application Programming Interface",
        subtopic: "General",
        difficulty: "EASY",
        explanation: "API stands for Application Programming Interface."
    },
    {
        questionText: "Which HTTP method is used to create a resource?",
        options: ["GET", "POST", "PUT", "DELETE"],
        correctAnswer: "POST",
        subtopic: "API",
        difficulty: "MEDIUM",
        explanation: "POST is typically used to send data to a server to create/update a resource."
    },
    {
        questionText: "What is Git?",
        options: ["A programming language", "A version control system", "A web browser", "A text editor"],
        correctAnswer: "A version control system",
        subtopic: "Tools",
        difficulty: "EASY",
        explanation: "Git is a distributed version control system."
    },
    {
        questionText: "What represents 'true' or 'false' values in code?",
        options: ["String", "Integer", "Boolean", "Array"],
        correctAnswer: "Boolean",
        subtopic: "CS Basics",
        difficulty: "EASY",
        explanation: "Boolean is a data type that has one of two possible values."
    },
    {
        questionText: "Which symbol creates a comment in JavaScript?",
        options: ["//", "<!-- -->", "#", "**"],
        correctAnswer: "//",
        subtopic: "Language",
        difficulty: "EASY",
        explanation: "// is used for single-line comments in JavaScript."
    }
];

export const startQuiz = async (req: Request, res: Response) => {
    try {
        const userId = req.user.id;

        // Create Quiz Session
        const quizSession = await prisma.quizSession.create({
            data: {
                userId,
                status: "STARTED",
                questions: {
                    create: MOCK_QUESTIONS.map(q => ({
                        questionText: q.questionText,
                        options: q.options,
                        correctAnswer: q.correctAnswer,
                        subtopic: q.subtopic,
                        difficulty: q.difficulty,
                        explanation: q.explanation
                    }))
                }
            },
            include: {
                questions: {
                    select: {
                        id: true,
                        questionText: true,
                        options: true,
                        subtopic: true,
                        difficulty: true
                        // Exclude correctAnswer and explanation
                    }
                }
            }
        });

        res.json({
            quizSessionId: quizSession.id,
            questions: quizSession.questions
        });

    } catch (error) {
        console.error("Start Quiz Error:", error);
        res.status(500).json({ error: "Failed to start quiz" });
    }
};

export const submitQuiz = async (req: Request, res: Response) => {
    try {
        const userId = req.user.id;
        const { quizSessionId, answers } = req.body; // answers: [{ questionId, selectedAnswer }]

        if (!quizSessionId || !Array.isArray(answers)) {
            res.status(400).json({ error: "Invalid payload" });
            return;
        }

        const session = await prisma.quizSession.findUnique({
            where: { id: quizSessionId },
            include: { questions: true }
        });

        if (!session) {
            res.status(404).json({ error: "Session not found" });
            return;
        }

        if (session.status === "COMPLETED") {
            res.status(400).json({ error: "Quiz already completed" });
            return;
        }

        if (session.userId !== userId) {
            res.status(403).json({ error: "Unauthorized" });
            return;
        }

        let score = 0;
        let correctCount = 0;
        const total = session.questions.length;

        // Process answers
        const userAnswersData = answers.map((ans: any) => {
            const question = session.questions.find(q => q.id === ans.questionId);
            if (!question) return null;

            const isCorrect = question.correctAnswer === ans.selectedAnswer;
            if (isCorrect) {
                score += 10; // Simple scoring: 10 points per question
                correctCount++;
            }

            return {
                userId,
                quizSessionId,
                questionSnapshotId: question.id,
                selectedAnswer: ans.selectedAnswer,
                isCorrect
            };
        }).filter(Boolean);

        // Transaction to ensure atomicity
        await prisma.$transaction(async (tx) => {
            // 1. Save User Answers
            if (userAnswersData.length > 0) {
                await tx.userAnswer.createMany({
                    data: userAnswersData
                });
            }

            // 2. Update Quiz Session
            await tx.quizSession.update({
                where: { id: quizSessionId },
                data: {
                    status: "COMPLETED",
                    score,
                    completedAt: new Date()
                }
            });

            // 3. Update User Subtopic Stats (Simplified: just checking existence for now)
            // In a real app we'd aggregate per subtopic. Skipping for V1 brevity or adding simple loop.
            for (const ua of userAnswersData) {
                const qs = session.questions.find(q => q.id === ua.questionSnapshotId);
                if (qs) {
                    await tx.userSubtopicStat.upsert({
                        where: {
                            userId_subtopic: { userId, subtopic: qs.subtopic }
                        },
                        update: {
                            total: { increment: 1 },
                            correct: { increment: ua.isCorrect ? 1 : 0 },
                            // Recalculate accuracy is tricky in atomic update, 
                            // might leave accuracy calculation for read-time or separate job.
                            // For now just updating counts.
                        },
                        create: {
                            userId,
                            subtopic: qs.subtopic,
                            total: 1,
                            correct: ua.isCorrect ? 1 : 0,
                            accuracy: ua.isCorrect ? 100.0 : 0.0
                        }
                    });
                }
            }

            // 4. Update Leaderboard
            await tx.leaderboard.upsert({
                where: { userId },
                update: {
                    totalScore: { increment: score }
                },
                create: {
                    userId,
                    totalScore: score
                }
            });
        });

        res.json({
            message: "Quiz submitted successfully",
            score,
            correctCount,
            totalQuestions: total
        });

    } catch (error) {
        console.error("Submit Quiz Error:", error);
        res.status(500).json({ error: "Failed to submit quiz" });
    }
};
