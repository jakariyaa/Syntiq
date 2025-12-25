import { prisma } from "./db";

export const getWeakSubtopics = async (userId: string): Promise<string[]> => {
    // Define "weak" as accuracy < 60% with at least 3 attempts
    const weakStats = await prisma.userSubtopicStat.findMany({
        where: {
            userId,
            total: {
                gte: 3
            },
            accuracy: {
                lt: 60
            }
        },
        select: {
            subtopic: true
        }
    });

    return weakStats.map(stat => stat.subtopic);
};
