import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";

export async function GET() {
  try {
    // Check if a test user exists
    const testEmail = "test@example.com";
    let user = await prisma.user.findUnique({
      where: { email: testEmail },
      select: { 
        id: true, 
        email: true, 
        name: true,
        password: true 
      }
    });

    // Create a test user if one doesn't exist
    if (!user) {
      const hashedPassword = await bcrypt.hash("password123", 10);
      user = await prisma.user.create({
        data: {
          email: testEmail,
          name: "Test User",
          password: hashedPassword,
          role: "PROFESSOR"
        },
        select: { 
          id: true, 
          email: true, 
          name: true,
          password: true 
        }
      });
      console.log("Created test user:", user.email);
    }

    // Test password verification
    const validPassword = await bcrypt.compare("password123", user.password);
    
    return NextResponse.json({
      message: "Auth debug",
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      },
      passwordValid: validPassword,
      authSettings: {
        mode: process.env.NODE_ENV,
        debug: process.env.DEBUG,
        nextAuthUrl: process.env.NEXTAUTH_URL?.substring(0, 15) + "..."
      }
    });
  } catch (error) {
    console.error("Auth debug error:", error);
    return NextResponse.json({ 
      error: "Auth debug error", 
      details: String(error),
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
} 