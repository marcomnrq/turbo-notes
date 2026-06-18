import { AuthForm } from "@/components/auth-form";

export const metadata = { title: "Sign up · Turbo Notes" };

export default function SignupPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <AuthForm mode="signup" />
    </main>
  );
}
