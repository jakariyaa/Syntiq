import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { api } from "@/lib/api";
import { toast } from "sonner";

interface QuizGameProps {
    quizSessionId: string;
    questions: any[];
    onFinish: (result: any) => void;
}

export function QuizGame({ quizSessionId, questions, onFinish }: QuizGameProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState<{ questionId: string; selectedAnswer: string }[]>([]);
    const [submitting, setSubmitting] = useState(false);

    const currentQuestion = questions[currentIndex];
    const progress = ((currentIndex) / questions.length) * 100;

    const handleOptionClick = async (option: string) => {
        const newAnswers = [...answers, { questionId: currentQuestion.id, selectedAnswer: option }];
        setAnswers(newAnswers);

        if (currentIndex < questions.length - 1) {
            setCurrentIndex(currentIndex + 1);
        } else {
            // Submit
            await submitQuiz(newAnswers);
        }
    };

    const submitQuiz = async (finalAnswers: typeof answers) => {
        setSubmitting(true);
        try {
            const result = await api.submitQuiz(quizSessionId, finalAnswers);
            onFinish(result);
        } catch (error) {
            console.error(error);
            toast.error("Failed to submit quiz.");
            setSubmitting(false);
        }
    };

    if (!currentQuestion) return <div>Loading...</div>;

    return (
        <Card className="w-full max-w-lg mx-auto mt-8">
            <CardHeader>
                <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-muted-foreground">Question {currentIndex + 1} of {questions.length}</span>
                    <span className="text-xs font-semibold px-2 py-1 bg-secondary rounded-full">{currentQuestion.difficulty}</span>
                </div>
                <Progress value={progress} className="h-2" />
                <CardTitle className="mt-4 text-xl">{currentQuestion.questionText}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                {currentQuestion.options.map((option: string, idx: number) => (
                    <Button
                        key={idx}
                        variant="outline"
                        className="w-full justify-start text-left h-auto py-3 px-4 text-base whitespace-normal"
                        onClick={() => handleOptionClick(option)}
                        disabled={submitting}
                    >
                        {option}
                    </Button>
                ))}
            </CardContent>
        </Card>
    );
}
