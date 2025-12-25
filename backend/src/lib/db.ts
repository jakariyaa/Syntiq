import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;



const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

// Prevent multiple instances in development if needed, 
// though typically just exporting a const is fine in Node/Bun for singleton module caching.
export const prisma = new PrismaClient({ adapter });
