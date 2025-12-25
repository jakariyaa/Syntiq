import { prisma } from "../src/lib/db";

async function main() {
    const user = await prisma.user.findUnique({
        where: { email: "test-user@example.com" }
    });

    if (!user) {
        console.error("Test user not found");
        return;
    }

    const token = "test-token-" + Date.now();
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

    const session = await prisma.session.create({
        data: {
            token,
            expiresAt,
            userId: user.id
        }
    });

    console.log("Session created:");
    console.log("Token:", session.token);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
