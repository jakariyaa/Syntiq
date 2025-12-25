import { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/db";


// Extend Express Request type to include user
declare global {
    namespace Express {
        interface Request {
            user?: any; // Replace 'any' with your User type if available
            session?: any;
        }
    }
}

export const requireAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        // 1. Get token from cookie
        // Note: BetterAuth usually sets a signed cookie or raw cookie depending on config.
        // We'll look for 'better-auth.session_token'.
        // Express might need 'cookie-parser' middleware to parse 'req.cookies'.
        // For now, we'll try to parse it manually from the header if cookie-parser isn't installed yet,
        // or assume cookie-parser will be added.

        let token = req.headers.authorization?.split(" ")[1]; // Bearer <token>

        // Fallback to cookie if no Bearer token
        if (!token && req.headers.cookie) {
            const match = req.headers.cookie.match(/better-auth\.session_token=([^;]+)/);
            if (match) {
                token = match[1];
            }
        }

        if (!token) {
            res.status(401).json({ error: "Unauthorized: No session token found" });
            return;
        }

        // 2. Verify session in DB
        const session = await prisma.session.findUnique({
            where: { token },
            include: { user: true },
        });

        if (!session) {
            res.status(401).json({ error: "Unauthorized: Invalid session" });
            return;
        }

        // 3. Check expiration
        if (new Date() > session.expiresAt) {
            res.status(401).json({ error: "Unauthorized: Session expired" });
            return;
        }

        // 4. Attach to request
        req.user = session.user;
        req.session = session;

        next();
    } catch (error) {
        console.error("Auth Middleware Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};
