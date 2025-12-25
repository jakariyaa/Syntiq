import { prisma } from "../src/lib/db";

async function main() {
    const user = await prisma.user.findUnique({
        where: { email: "test-user@example.com" }
    });

    // Check if session token exists or create one (reusing logic or assuming cookie is set)
    // For this script, we'll simulate the inputs directly or use fetch if server is running?
    // Let's use `fetch` to hit the running server to test the actual API.

    const cookie = "better-auth.session_token=test-token-1766663688548"; // From previous step

    // 1. Start Quiz
    console.log("Starting Quiz...");
    const startRes = await fetch("http://localhost:4000/api/quiz/start", {
        method: "POST",
        headers: {
            "Cookie": cookie
        }
    });

    if (!startRes.ok) {
        console.error("Start Failed:", startRes.status, await startRes.text());
        return;
    }

    const startData = await startRes.json();
    console.log("Quiz Started. Session ID:", startData.quizSessionId);
    console.log("Questions received:", startData.questions.length);

    // 2. Formulate Answers (Answering all 'A' or something, or trying to match correct ones?)
    // In our mock controller, we know the questions.
    // "Which language is used for styling web pages?" -> "CSS"

    const answers = startData.questions.map((q: any) => {
        let answer = "Wrong Answer";
        // Simple logic to get some right
        if (q.questionText.includes("styling")) answer = "CSS";
        if (q.questionText.includes("HTML stand for")) answer = "Hyper Text Markup Language";

        return {
            questionId: q.id,
            selectedAnswer: answer
        };
    });

    // 3. Submit Quiz
    console.log("Submitting Quiz...");
    const submitRes = await fetch("http://localhost:4000/api/quiz/submit", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Cookie": cookie
        },
        body: JSON.stringify({
            quizSessionId: startData.quizSessionId,
            answers
        })
    });

    if (!submitRes.ok) {
        console.error("Submit Failed:", submitRes.status, await submitRes.text());
        return;
    }

    const submitData = await submitRes.json();
    console.log("Quiz Submitted. Result:", submitData);
}

main();
