"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, Inbox, Clock } from "lucide-react";
import Link from "next/link";

interface LeadNuevo {
  id: string;
  nombre: string;
  temaInteres: string;
  createdAt: string;
}

interface Seguimiento {
  id: string;
  nombre: string;
  fechaProximaAccion: string;
}

interface NotificationsData {
  totalBadge: number;
  leadsNuevos: LeadNuevo[];
  seguimientosVencidos: Seguimiento[];
  totalNuevos: number;
  totalSeguimientos: number;
}

function tiempoRelativo(fecha: string): string {
  const diff = Date.now() - new Date(fecha).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "ahora";
  if (mins < 60) return `hace ${mins}m`;
  const horas = Math.floor(mins / 60);
  if (horas < 24) return `hace ${horas}h`;
  const dias = Math.floor(horas / 24);
  if (dias === 1) return "ayer";
  return `hace ${dias}d`;
}

function labelSeguimiento(fecha: string): string {
  const d = new Date(fecha);
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  const diff = Math.floor((hoy.getTime() - d.getTime()) / 86400000);
  if (diff <= 0) return "vence hoy";
  if (diff === 1) return "venció ayer";
  return `hace ${diff}d`;
}

export function NotificationBell() {
  const [data, setData] = useState<NotificationsData | null>(null);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/notifications")
      .then((r) => r.json())
      .then(setData)
      .catch(() => {});
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const badge = data?.totalBadge ?? 0;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative h-8 w-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-card-foreground hover:bg-accent/10 transition-colors"
        title="Notificaciones"
        aria-label="Notificaciones"
      >
        <Bell className="h-4 w-4" />
        {badge > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-0.5 flex items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white leading-none">
            {badge > 99 ? "99+" : badge}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-10 z-50 w-80 rounded-xl border border-border bg-card shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <span className="text-sm font-semibold text-card-foreground">Notificaciones</span>
            {badge === 0 && <span className="text-xs text-muted">Todo al día ✓</span>}
            {badge > 0 && (
              <span className="text-[11px] font-semibold text-red-500">{badge} pendientes</span>
            )}
          </div>

          {/* Leads nuevos sin contactar */}
          {data && data.leadsNuevos.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 px-4 pt-3 pb-1.5">
                <Inbox className="h-3 w-3 text-blue-500" />
                <span className="text-[11px] font-semibold text-muted uppercase tracking-wider">
                  {data.totalNuevos} leads sin contactar
                </span>
              </div>
              {data.leadsNuevos.map((l) => (
                <Link
                  key={l.id}
                  href={`/leads/${l.id}`}
                  onClick={() => setOpen(false)}
                  className="flex items-start justify-between gap-2 px-4 py-2 hover:bg-accent/5 transition-colors group"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-card-foreground truncate group-hover:text-primary transition-colors">
                      {l.nombre}
                    </p>
                    <p className="text-xs text-muted truncate">{l.temaInteres}</p>
                  </div>
                  <span className="text-[11px] text-muted shrink-0 mt-0.5 whitespace-nowrap">
                    {tiempoRelativo(l.createdAt)}
                  </span>
                </Link>
              ))}
              {data.totalNuevos > 5 && (
                <Link
                  href="/leads"
                  onClick={() => setOpen(false)}
                  className="block px-4 py-1.5 text-xs text-primary hover:underline"
                >
                  +{data.totalNuevos - 5} más →
                </Link>
              )}
            </div>
          )}

          {/* Seguimientos vencidos */}
          {data && data.seguimientosVencidos.length > 0 && (
            <div className={data.leadsNuevos.length > 0 ? "border-t border-border" : ""}>
              <div className="flex items-center gap-1.5 px-4 pt-3 pb-1.5">
                <Clock className="h-3 w-3 text-amber-500" />
                <span className="text-[11px] font-semibold text-muted uppercase tracking-wider">
                  {data.totalSeguimientos} seguimientos vencidos
                </span>
              </div>
              {data.seguimientosVencidos.map((l) => (
                <Link
                  key={l.id}
                  href={`/leads/${l.id}`}
                  onClick={() => setOpen(false)}
                  className="flex items-start justify-between gap-2 px-4 py-2 hover:bg-accent/5 transition-colors group"
                >
                  <p className="text-sm font-medium text-card-foreground truncate group-hover:text-primary transition-colors">
                    {l.nombre}
                  </p>
                  <span className="text-[11px] text-amber-600 shrink-0 mt-0.5 whitespace-nowrap">
                    {labelSeguimiento(l.fechaProximaAccion)}
                  </span>
                </Link>
              ))}
              {data.totalSeguimientos > 5 && (
                <Link
                  href="/leads"
                  onClick={() => setOpen(false)}
                  className="block px-4 py-1.5 text-xs text-primary hover:underline"
                >
                  +{data.totalSeguimientos - 5} más →
                </Link>
              )}
            </div>
          )}

          {/* Estado vacío */}
          {data && badge === 0 && (
            <p className="px-4 py-8 text-center text-sm text-muted">
              No hay notificaciones pendientes
            </p>
          )}

          {/* Cargando */}
          {!data && (
            <p className="px-4 py-8 text-center text-sm text-muted">Cargando…</p>
          )}

          {/* Footer */}
          <div className="px-4 py-2.5 border-t border-border">
            <Link
              href="/leads"
              onClick={() => setOpen(false)}
              className="text-xs text-primary hover:underline"
            >
              Ver todos los leads →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
