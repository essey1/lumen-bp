"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
  return (
    <Button
      variant="outline"
      onClick={() => signOut({ callbackUrl: "/auth/login" })}
    >
      <LogOut className="size-4" aria-hidden="true" />
      Sign Out
    </Button>
  );
}
