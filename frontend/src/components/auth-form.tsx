"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { PasswordInput } from "@/components/password-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";

interface AuthFormProps {
  mode: "login" | "signup";
}

/** Email/password form shared by the login and signup pages. */
export function AuthForm({ mode }: AuthFormProps) {
  const isSignup = mode === "signup";
  const { login, signup } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    try {
      if (isSignup) await signup(email, password);
      else await login(email, password);
      router.push("/notes");
    } catch (error) {
      const message = authErrorMessage(error, isSignup);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="password">Password</Label>
        <PasswordInput
          id="password"
          required
          minLength={isSignup ? 8 : undefined}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
        />
      </div>

      <Button type="submit" size="lg" disabled={submitting} className="w-full">
        {submitting ? "Please wait…" : isSignup ? "Create account" : "Log in"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        {isSignup ? "Already have an account? " : "Don't have an account? "}
        <Link
          href={isSignup ? "/login" : "/signup"}
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          {isSignup ? "Log in" : "Sign up"}
        </Link>
      </p>
    </form>
  );
}

/** Map backend errors to a friendly message. */
function authErrorMessage(error: unknown, isSignup: boolean): string {
  if (error instanceof ApiError) {
    const body = error.body as Record<string, unknown> | null;
    // Django DRF field errors: {"email": ["..."], "password": ["..."]}
    if (body && typeof body === "object") {
      const first = Object.values(body).find(
        (v) => Array.isArray(v) && v.length,
      );
      if (Array.isArray(first) && typeof first[0] === "string") return first[0];
      if (typeof body.detail === "string") return body.detail;
    }
    if (error.status === 401) return "Invalid email or password.";
  }
  return isSignup
    ? "Couldn't create your account. Please try again."
    : "Something went wrong. Please try again.";
}
