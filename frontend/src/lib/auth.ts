import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma";

export const auth = betterAuth({
    database: prismaAdapter(prisma, {
        provider: "postgresql",
    }),
    emailOTP: {
        enabled: true,
    },
    // emailAndPassword: {
    //     enabled: true,
    // },
});
