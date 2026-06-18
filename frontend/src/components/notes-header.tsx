"use client";

import { LogOutIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/lib/auth";

/** Top app bar with the product name and a user menu (email + log out). */
export function NotesHeader() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  async function handleLogout() {
    setSigningOut(true);
    await logout();
    router.push("/login");
  }

  return (
    <header className="flex h-14 items-center justify-between border-b border-black/10 px-4">
      <span className="font-heading text-lg font-bold tracking-tight text-brand">
        Turbo Notes
      </span>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="ghost" size="sm" className="gap-2">
              <span className="flex size-6 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                {(user?.email ?? "?").charAt(0).toUpperCase()}
              </span>
              <span className="hidden text-sm sm:inline">{user?.email}</span>
            </Button>
          }
        />
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={handleLogout} disabled={signingOut}>
            <LogOutIcon data-icon="inline-start" />
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
