import { AuthForm } from "@/components/auth-form";

export const metadata = { title: "Log in · Turbo Notes" };

export default function LoginPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Welcome back
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Log in to your Turbo Notes account.
          </p>
        </div>
        <AuthForm mode="login" />
      </div>
    </main>
  );
}
