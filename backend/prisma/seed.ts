import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log("Seeding data...");

    // Create User
    const user = await prisma.user.upsert({
        where: { email: "test-user@example.com" },
        update: {},
        create: {
            name: "Test User",
            email: "test-user@example.com",
            emailVerified: true,
        },
    });
    console.log("Created/Found user:", user.email);

    // Create a Quiz Session (Completed)
    const quiz = await prisma.quizSession.create({
        data: {
            userId: user.id,
            status: "COMPLETED",
            score: 80,
            startedAt: new Date(Date.now() - 1000 * 60 * 10), // 10 mins ago
            completedAt: new Date(),
            questions: {
                create: [
                    {
                        questionText: "What is the capital of France?",
                        options: ["London", "Berlin", "Paris", "Madrid"],
                        correctAnswer: "Paris",
                        subtopic: "Geography",
                        difficulty: "EASY",
                    },
                    {
                        questionText: "What is 2 + 2?",
                        options: ["3", "4", "5", "6"],
                        correctAnswer: "4",
                        subtopic: "Math",
                        difficulty: "EASY",
                    }
                ]
            }
        }
    });
    console.log("Created quiz session:", quiz.id);

    // Create User Answer
    // Need to fetch questions first to link them
    const questions = await prisma.questionSnapshot.findMany({ where: { quizSessionId: quiz.id } });
    if (questions.length > 0) {
        await prisma.userAnswer.create({
            data: {
                userId: user.id,
                quizSessionId: quiz.id,
                questionSnapshotId: questions[0].id,
                selectedAnswer: "Paris",
                isCorrect: true
            }
        });
        await prisma.userAnswer.create({
            data: {
                userId: user.id,
                quizSessionId: quiz.id,
                questionSnapshotId: questions[1].id,
                selectedAnswer: "4",
                isCorrect: true
            }
        });
    }

    // Create Leaderboard Entry
    await prisma.leaderboard.upsert({
        where: { userId: user.id },
        update: { totalScore: 80 },
        create: {
            userId: user.id,
            totalScore: 80
        }
    });

    console.log("Seeding completed.");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
