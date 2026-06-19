"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { PasswordInput } from "@/components/features/auth/password-input";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ApiError } from "@/lib/api";

interface AuthFormProps {
  mode: "login" | "signup";
}

const COPY = {
  login: {
    image: "/images/sleepy-cat.png",
    heading: "Welcome back!",
    submitLabel: "Log In",
    footerPrefix: "Not friends yet? ",
    footerLink: "Sign up",
    footerHref: "/signup",
    imageAlt: "A sleepy cat illustration",
  },
  signup: {
    image: "/images/cactus.png",
    heading: "Yay, New Friend!",
    submitLabel: "Sign Up",
    footerPrefix: "",
    footerLink: "We're already friends!",
    footerHref: "/login",
    imageAlt: "A cute cactus illustration",
  },
} as const;

/** Email/password form shared by the login and signup pages. */
export function AuthForm({ mode }: AuthFormProps) {
  const isSignup = mode === "signup";
  const { login, signup } = useAuth();
  const router = useRouter();
  const copy = COPY[mode];

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
    <div className="flex w-full max-w-sm flex-col items-center">
      <Image
        src={copy.image}
        alt={copy.imageAlt}
        width={120}
        height={120}
        className="mb-6 h-28 w-28 object-contain"
        priority
      />
      <h1 className="mb-8 text-center font-heading text-5xl font-bold leading-none text-brand">
        {copy.heading}
      </h1>

      <form onSubmit={handleSubmit} className="flex w-full flex-col gap-4">
        <Input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email address"
          aria-label="Email address"
          className="h-12 w-full rounded-full border-brand-muted bg-background px-6 text-sm placeholder:text-black/60 focus-visible:border-brand focus-visible:ring-brand/30"
        />

        <PasswordInput
          id="password"
          required
          minLength={isSignup ? 8 : undefined}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          aria-label="Password"
          className="h-12 w-full rounded-full border-brand-muted bg-background px-6 pe-12 text-sm placeholder:text-black/60 focus-visible:border-brand focus-visible:ring-brand/30"
        />

        <Button
          type="submit"
          variant="outline"
          disabled={submitting}
          className="h-12 w-full rounded-full"
        >
          {submitting ? "Please wait…" : copy.submitLabel}
        </Button>
      </form>

      <Link
        href={copy.footerHref}
        className="mt-6 text-center text-sm text-brand-muted underline underline-offset-4 hover:text-brand"
      >
        {copy.footerPrefix}
        {copy.footerLink}
      </Link>
    </div>
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
