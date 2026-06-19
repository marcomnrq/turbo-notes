import { AuthForm } from "@/components/features/auth/auth-form";

export const metadata = { title: "Log in · Turbo Notes" };

export default function LoginPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <AuthForm mode="login" />
    </main>
  );
}
