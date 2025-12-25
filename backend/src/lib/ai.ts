import { GoogleGenerativeAI } from "@google/generative-ai";
import { z } from "zod";

const apiKey = process.env.GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

// Define allowed difficulties and subtopics if we wanted to be strict,
// but for now we trust the AI to follow instructions or use strings.

const QuestionSchema = z.object({
  questionText: z.string(),
  options: z.array(z.string()).length(4),
  correctAnswer: z.string(),
  explanation: z.string(),
  subtopic: z.string(),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]),
});

const QuizResponseSchema = z.array(QuestionSchema).length(10);

export type GeneratedQuestion = z.infer<typeof QuestionSchema>;

export const generateQuiz = async (
  topic: string,
  weakSubtopics?: string[],
): Promise<GeneratedQuestion[]> => {
  if (!apiKey) {
    console.warn(
      "GEMINI_API_KEY is not set. Using fallback mocks will be handled by controller.",
    );
    throw new Error("GEMINI_API_KEY not set");
  }

  let promptContext = "";
  if (weakSubtopics && weakSubtopics.length > 0) {
    promptContext = `
    ATTENTION: The user has shown weakness in the following subtopics: ${weakSubtopics.join(", ")}.
    You MUST generate at least 5 questions (50% of the quiz) specifically focusing on these weak subtopics to help them improve.
    `;
  }

  const prompt = `
    You are an expert quiz generator.
    Generate exactly 10 multiple-choice questions (MCQs) on the topic: "${topic}".
    ${promptContext}
    
    Requirements:
    1. Output MUST be a valid JSON array.
    2. Each object must strictly follow this structure:
       {
         "questionText": "Question string",
         "options": ["Option A", "Option B", "Option C", "Option D"],
         "correctAnswer": "Exact string match of one of the options",
         "explanation": "Brief explanation of why the answer is correct",
         "subtopic": "Specific sub-field within the topic",
         "difficulty": "EASY" | "MEDIUM" | "HARD"
       }
    3. Ensure a mix of difficulties.
    4. Ensure strictly 4 options per question.
    5. Do NOT wrap the JSON in markdown code blocks (like \`\`\`json). Return raw JSON only.
    `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Clean up markdown if AI adds it despite instructions
    const cleanText = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const json = JSON.parse(cleanText);
    const validated = QuizResponseSchema.parse(json);

    return validated;
  } catch (error) {
    console.error("AI Generation Error:", error);
    throw error;
  }
};
