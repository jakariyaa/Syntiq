const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

export interface QuizStartResponse {
    quizSessionId: string;
    questions: {
        id: string;
        questionText: string;
        options: string[];
        subtopic: string;
        difficulty: string;
    }[];
}

export interface QuizSubmitResponse {
    message: string;
    score: number;
    correctCount: number;
    totalQuestions: number;
}

export const api = {
    startQuiz: async (topic: string): Promise<QuizStartResponse> => {
        const res = await fetch(`${BACKEND_URL}/api/quiz/start`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ topic }),
            credentials: "include", // Important for cookies
        });

        if (!res.ok) {
            throw new Error(`Failed to start quiz: ${res.statusText}`);
        }

        return res.json();
    },

    submitQuiz: async (quizSessionId: string, answers: { questionId: string; selectedAnswer: string }[]): Promise<QuizSubmitResponse> => {
        const res = await fetch(`${BACKEND_URL}/api/quiz/submit`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ quizSessionId, answers }),
            credentials: "include",
        });

        if (!res.ok) {
            throw new Error(`Failed to submit quiz: ${res.statusText}`);
        }

        return res.json();
    },
};
