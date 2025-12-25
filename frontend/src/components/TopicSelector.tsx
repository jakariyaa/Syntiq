import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { toast } from "sonner";

interface TopicSelectorProps {
    onQuizStart: (data: any) => void;
}

const PRESETS = ["General Knowledge", "React", "History", "Science", "Technology"];

export function TopicSelector({ onQuizStart }: TopicSelectorProps) {
    const [topic, setTopic] = useState("");
    const [loading, setLoading] = useState(false);

    const handleStart = async (selectedTopic: string) => {
        if (!selectedTopic.trim()) return;

        setLoading(true);
        try {
            const data = await api.startQuiz(selectedTopic);
            onQuizStart(data);
        } catch (error) {
            console.error(error);
            toast.error("Failed to start quiz. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="w-full max-w-md mx-auto">
            <CardHeader>
                <CardTitle className="text-2xl font-bold text-center">Choose a Topic</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                    {PRESETS.map((p) => (
                        <Button
                            key={p}
                            variant="outline"
                            onClick={() => handleStart(p)}
                            disabled={loading}
                        >
                            {p}
                        </Button>
                    ))}
                </div>
                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">Or type your own</span>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Input
                        placeholder="e.g. 'Advanced Python'"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        disabled={loading}
                        onKeyDown={(e) => e.key === "Enter" && handleStart(topic)}
                    />
                    <Button onClick={() => handleStart(topic)} disabled={loading || !topic.trim()}>
                        Start
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
