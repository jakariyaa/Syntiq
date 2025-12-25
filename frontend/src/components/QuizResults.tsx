import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface QuizResultsProps {
    result: {
        score: number;
        correctCount: number;
        totalQuestions: number;
        message: string;
    };
    onRestart: () => void;
}

export function QuizResults({ result, onRestart }: QuizResultsProps) {
    const percentage = Math.round((result.correctCount / result.totalQuestions) * 100);

    return (
        <Card className="w-full max-w-md mx-auto text-center">
            <CardHeader>
                <CardTitle className="text-3xl">Quiz Complete!</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="text-6xl font-extrabold text-primary">
                    {result.score} pts
                </div>
                <div className="text-xl text-muted-foreground">
                    You got <span className="font-bold text-foreground">{result.correctCount}</span> out of {result.totalQuestions} correct.
                </div>
                <div className="w-full bg-secondary h-4 rounded-full overflow-hidden">
                    <div
                        className="bg-primary h-full transition-all"
                        style={{ width: `${percentage}%` }}
                    />
                </div>
            </CardContent>
            <CardFooter>
                <Button className="w-full" size="lg" onClick={onRestart}>
                    Play Again
                </Button>
            </CardFooter>
        </Card>
    );
}
