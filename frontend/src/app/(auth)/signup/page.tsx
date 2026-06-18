import { AuthForm } from "@/components/auth-form";

export const metadata = { title: "Sign up · Turbo Notes" };

export default function SignupPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Create your account
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Start organizing your notes in seconds.
          </p>
        </div>
        <AuthForm mode="signup" />
      </div>
    </main>
  );
}
