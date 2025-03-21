import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export async function GET() {
  let databaseStatus = { connected: false, type: "PostgreSQL" };

  try {
    // Test database connection with a simple query
    await prisma.$queryRaw`SELECT 1`;
    databaseStatus.connected = true;
  } catch (error) {
    console.error("Database connection test failed:", error);
  }

  return NextResponse.json({
    nodeVersion: process.version,
    nodeEnv: process.env.NODE_ENV,
    databaseUrl: process.env.DATABASE_URL ? "Set" : "Not Set",
    nextAuthUrl: process.env.NEXTAUTH_URL ? "Set" : "Not Set",
    database: databaseStatus,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
  });
} 