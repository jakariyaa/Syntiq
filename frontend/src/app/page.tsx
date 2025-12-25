"use client";

import { useState } from "react";
import { authClient, useSession } from "@/lib/auth-client";
import { TopicSelector } from "@/components/TopicSelector";
import { QuizGame } from "@/components/QuizGame";
import { QuizResults } from "@/components/QuizResults";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

export default function Home() {
  const { data: session, isPending } = useSession();
  const [gameState, setGameState] = useState<"TOPIC" | "PLAYING" | "RESULTS">("TOPIC");
  const [quizData, setQuizData] = useState<{ sessionId: string; questions: any[] } | null>(null);
  const [resultData, setResultData] = useState<any>(null);

  // Auth State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);

  // Auth Handlers
  const handleLogin = async () => {
    setLoading(true);
    try {
      await authClient.signIn.email({
        email,
        password
      }, {
        onSuccess: () => {
          toast.success("Logged in successfully!");
        },
        onError: (ctx) => {
          toast.error(ctx.error.message);
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    setLoading(true);
    try {
      await authClient.signUp.email({
        email,
        password,
        name,
      }, {
        onSuccess: () => {
          setVerificationSent(true);
          toast.success("Account created! Please check your email for verification.");
        },
        onError: (ctx) => {
          toast.error(ctx.error.message);
        }
      });
    } finally {
      setLoading(false);
    }
  };

  // Quiz Handlers
  const handleQuizStart = (data: any) => {
    setQuizData({ sessionId: data.quizSessionId, questions: data.questions });
    setGameState("PLAYING");
  };

  const handleQuizFinish = (result: any) => {
    setResultData(result);
    setGameState("RESULTS");
  };

  const handleRestart = () => {
    setGameState("TOPIC");
    setQuizData(null);
    setResultData(null);
  };

  if (isPending) return <div className="flex justify-center p-10">Loading...</div>;

  if (!session) {
    if (verificationSent) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4">
          <Card className="w-full max-w-md text-center">
            <CardHeader>
              <CardTitle className="text-2xl">Check your Email</CardTitle>
              <CardDescription>We've sent a verification link to <strong>{email}</strong>.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Please verify your account to continue.
              </p>
              <Button variant="outline" onClick={() => setVerificationSent(false)}>
                Back to Login
              </Button>
            </CardContent>
          </Card>
        </div>
      )
    }

    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-2xl">Welcome to Syntiq</CardTitle>
            <CardDescription>Login or Register to start quizzing</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="space-y-4">
                <div className="space-y-2">
                  <Input
                    placeholder="Email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <Input
                    placeholder="Password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <Button className="w-full" onClick={handleLogin} disabled={loading || !email || !password}>
                  {loading ? "Logging in..." : "Login"}
                </Button>
              </TabsContent>

              <TabsContent value="register" className="space-y-4">
                <div className="space-y-2">
                  <Input
                    placeholder="Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                  <Input
                    placeholder="Email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <Input
                    placeholder="Password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <Button className="w-full" onClick={handleRegister} disabled={loading || !email || !password || !name}>
                  {loading ? "Creating Account..." : "Create Account"}
                </Button>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-8 font-sans">
      <header className="flex justify-between items-center max-w-4xl mx-auto mb-10">
        <h1 className="text-2xl font-bold tracking-tight">Syntiq</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium">{session.user.name || session.user.email}</span>
          <Button variant="outline" size="sm" onClick={() => authClient.signOut()}>Sign Out</Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto">
        {gameState === "TOPIC" && (
          <TopicSelector onQuizStart={handleQuizStart} />
        )}

        {gameState === "PLAYING" && quizData && (
          <QuizGame
            quizSessionId={quizData.sessionId}
            questions={quizData.questions}
            onFinish={handleQuizFinish}
          />
        )}

        {gameState === "RESULTS" && resultData && (
          <QuizResults
            result={resultData}
            onRestart={handleRestart}
          />
        )}
      </main>
    </div>
  );
}
