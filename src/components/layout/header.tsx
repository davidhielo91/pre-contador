"use client";

import { useSession } from "next-auth/react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { NotificationBell } from "./notification-bell";

export function Header() {
  const { data: session } = useSession();

  return (
    <header className="flex h-14 items-center justify-between gap-4 border-b border-border bg-card pl-14 pr-4 sm:pl-6 sm:pr-6 lg:pl-6">
      {/* Spacer visible only on mobile for hamburger button */}
      <div className="lg:hidden" aria-hidden="true" />

      <div className="flex items-center gap-3 ml-auto">
        <NotificationBell />
        <div className="text-right hidden xs:block">
          <p className="text-sm font-medium text-card-foreground leading-tight">
            {session?.user?.name}
          </p>
          <p className="text-[11px] uppercase tracking-wider text-muted">
            {session?.user?.role === "administrador" ? "Administrador" : "Asesor"}
          </p>
        </div>
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
            {session?.user?.name?.charAt(0)?.toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
