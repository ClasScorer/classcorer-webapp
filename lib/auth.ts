import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./prisma";
import bcrypt from "bcrypt";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/login",
    signOut: "/login",
    error: "/login", // Error code passed in query string as ?error=
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials, req) {
        console.log("Authorizing credentials:", credentials?.email);
        
        if (!credentials?.email || !credentials.password) {
          console.log("Missing credentials");
          return null;
        }
        
        try {
          const user = await prisma.user.findUnique({
            where: {
              email: credentials.email,
            },
          });
          
          if (!user) {
            console.log("User not found:", credentials.email);
            return null;
          }
          
          // In development mode, allow access with any password
          if (process.env.NODE_ENV !== "production") {
            console.log("DEV MODE: Bypassing password check for:", user.email);
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
              console.log("Password doesn't match for:", user.email);
              return null;
            }
          }
          
          console.log("Auth successful for:", user.email);
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
        console.log("Setting JWT token for user:", user.email);
        token.id = user.id;
        token.email = user.email;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        console.log("Setting session data for user:", token.email);
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.role = token.role as string;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      console.log("NextAuth redirect to:", url);
      
      // Handle relative URLs properly
      if (url.startsWith("/")) {
        return `${baseUrl}${url}`;
      }
      
      // If the URL starts with the base URL, it's safe to use
      if (url.startsWith(baseUrl)) {
        return url;
      }
      
      // For any other URLs, default to the dashboard for safety
      return `${baseUrl}/dashboard`;
    },
  },
  debug: process.env.NODE_ENV === "development",
}; 