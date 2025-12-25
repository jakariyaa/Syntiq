import { prisma } from "../src/lib/db";

async function main() {
    const email = "test-user@example.com";
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
        console.log("User not found");
        return;
    }

    const weakSubtopic = "React Hooks";

    await prisma.userSubtopicStat.upsert({
        where: {
            userId_subtopic: { userId: user.id, subtopic: weakSubtopic }
        },
        update: {
            total: 5,
            correct: 1, // 20% accuracy
            accuracy: 20.0
        },
        create: {
            userId: user.id,
            subtopic: weakSubtopic,
            total: 5,
            correct: 1,
            accuracy: 20.0
        }
    });

    console.log(`Seeded weak stat for '${weakSubtopic}' (20% accuracy)`);
}

main();
