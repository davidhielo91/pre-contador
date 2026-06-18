"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Inbox,
  Settings,
  Shield,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";

const baseNavItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/leads", label: "Bandeja de Leads", icon: Inbox },
];

export function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "administrador";
  const navItems = isAdmin
    ? [...baseNavItems, { href: "/settings", label: "Configuración", icon: Settings }]
    : baseNavItems;

  return (
    <>
      <button
        className="fixed top-4 left-4 z-50 lg:hidden rounded-md p-1.5 bg-card border border-border shadow-sm"
        onClick={() => setOpen(true)}
        aria-label="Abrir menú"
      >
        <Menu className="h-4 w-4 text-primary" />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-60 flex-col bg-sidebar transition-transform duration-200 lg:static lg:translate-x-0",
          "shadow-[var(--shadow-sidebar)]",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Brand */}
        <div className="flex h-14 items-center justify-between px-4 border-b border-border">
          <Link href="/dashboard" className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary shadow-sm">
              <Shield className="h-4 w-4 text-primary-foreground" />
            </div>
            <div className="min-w-0">
              <p className="text-[13px] font-semibold text-sidebar-foreground leading-tight truncate">
                Pre-Diagnósticos
              </p>
              <p className="text-[10px] text-sidebar-muted uppercase tracking-widest">
                IMSS · Pensiones
              </p>
            </div>
          </Link>
          <button
            onClick={() => setOpen(false)}
            className="rounded-md p-1 text-sidebar-muted hover:bg-sidebar-accent lg:hidden"
            aria-label="Cerrar menú"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2.5 py-3 space-y-0.5">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors duration-150",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-foreground"
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-border px-2.5 py-3">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-foreground"
            onClick={() => signOut({ callbackUrl: "/login" })}
          >
            <LogOut className="h-4 w-4" />
            Cerrar sesión
          </Button>
        </div>
      </aside>
    </>
  );
}
