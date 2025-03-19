import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/app/lib/prisma";
import bcrypt from "bcrypt";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) {
          return null;
        }
        
        try {
          const user = await prisma.user.findUnique({
            where: {
              email: credentials.email,
            },
          });
          
          if (!user) {
            console.log("User not found");
            return null;
          }
          
          // In development mode, allow access with any password
          if (process.env.NODE_ENV !== "production") {
            console.log("DEV MODE: Bypassing password check");
            return {
              id: user.id,
              email: user.email,
              name: user.name,
              role: user.role,
            };
          }
          
          // Optional: In production, check password if the hash exists
          if (user.password) {
            const passwordMatch = await bcrypt.compare(credentials.password, user.password);
            
            if (!passwordMatch) {
              console.log("Password doesn't match");
              return null;
            }
          }
          
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          };
        } catch (error) {
          console.error("Error during authentication:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
  debug: process.env.NODE_ENV === "development",
}; 