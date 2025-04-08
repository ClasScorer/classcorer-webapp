"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import Link from "next/link";
import { AlertCircle, CheckCircle2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [registered, setRegistered] = useState(false);

  useEffect(() => {
    // Check if user was redirected from signup page
    if (searchParams?.get("registered") === "true") {
      setRegistered(true);
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
          <CardDescription>
            Sign in to your account to continue
          </CardDescription>
        </CardHeader>
        <CardContent>
          {registered && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md flex items-center text-green-700">
              <CheckCircle2 className="h-5 w-5 mr-2 flex-shrink-0" />
              <p className="text-sm">Account created successfully! Please sign in.</p>
            </div>
          )}
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="professor@university.edu"
                defaultValue="test@example.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                defaultValue="password123"
                required
              />
            </div>
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md flex items-center text-red-700">
                <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
                <p className="text-sm">{error}</p>
              </div>
            )}
            
            {/* Login with test credentials button */}
            <Button
              className="w-full mb-4"
              onClick={async () => {
                console.log("Using test credentials");
                setIsLoading(true);
                setError(null);
                
                try {
                  const result = await signIn("credentials", {
                    email: "test@example.com",
                    password: "password123",
                    redirect: true,
                    callbackUrl: "/dashboard"
                  });
                  
                  console.log("Test login result:", result);
                  
                  // With redirect:true above, this code won't run unless there's an error
                  if (result?.error) {
                    setError(`Test login failed: ${result.error}`);
                  }
                } catch (err) {
                  console.error("Test login error:", err);
                  setError(`Test login error: ${err instanceof Error ? err.message : String(err)}`);
                } finally {
                  setIsLoading(false);
                }
              }}
              disabled={isLoading}
            >
              {isLoading ? "Signing in..." : "Sign in with Test Account"}
            </Button>
            
            {/* Normal login form button */}
            <Button
              type="button"
              className="w-full"
              onClick={async () => {
                console.log("Manual login button clicked");
                const email = (document.getElementById("email") as HTMLInputElement)?.value;
                const password = (document.getElementById("password") as HTMLInputElement)?.value;
                
                if (!email || !password) {
                  setError("Please enter email and password");
                  return;
                }
                
                setIsLoading(true);
                setError(null);
                
                try {
                  console.log("Calling signIn with:", { email });
                  const result = await signIn("credentials", {
                    email,
                    password,
                    redirect: true,
                    callbackUrl: "/dashboard"
                  });
                  
                  console.log("Sign in result:", result);
                  
                  // With redirect:true above, this code won't run unless there's an error
                  if (result?.error) {
                    setError(`Authentication failed: ${result.error}`);
                  }
                } catch (err) {
                  console.error("Sign in error:", err);
                  setError(`Error: ${err instanceof Error ? err.message : String(err)}`);
                } finally {
                  setIsLoading(false);
                }
              }}
              disabled={isLoading}
            >
              {isLoading ? "Signing in..." : "Sign in"}
            </Button>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-2 justify-center">
          <div className="text-sm text-center">
            Don't have an account?{" "}
            <Link href="/signup" className="text-primary hover:underline">
              Sign up
            </Link>
          </div>
          <div className="text-xs text-center text-muted-foreground">
            <a 
              href="/api/debug-auth" 
              target="_blank" 
              className="hover:underline"
              onClick={async (e) => {
                e.preventDefault();
                try {
                  setError(null);
                  const res = await fetch('/api/debug-auth');
                  const data = await res.json();
                  console.log("Debug auth result:", data);
                  setError(`Test user created/verified: ${data.user.email} (password: password123)`);
                } catch (err) {
                  console.error("Error creating test user:", err);
                  setError(`Error creating test user: ${err instanceof Error ? err.message : String(err)}`);
                }
              }}
            >
              Create test account
            </a>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
} 