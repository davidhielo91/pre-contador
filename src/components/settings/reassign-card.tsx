"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserCheck, AlertCircle, CheckCircle2 } from "lucide-react";

export function ReassignCard() {
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<number | null>(null);
  const [error, setError] = useState("");

  async function handleReasignar() {
    setError("");
    setResultado(null);
    setLoading(true);
    try {
      const res = await fetch("/api/leads/reassign-admin", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al reasignar");
      setResultado(data.actualizados);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Reasignar leads sin asignar</CardTitle>
        <CardDescription>
          Asigna al administrador todos los leads que actualmente no tienen asesor asignado
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {error && (
          <div className="flex items-center gap-2 rounded-md bg-destructive/10 border border-destructive/20 px-3 py-2">
            <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
            <p className="text-xs text-destructive">{error}</p>
          </div>
        )}
        {resultado !== null && (
          <div className="flex items-center gap-2 rounded-md bg-success/10 border border-success/20 px-3 py-2">
            <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
            <p className="text-xs text-success">
              {resultado === 0
                ? "No había leads sin asignar"
                : `${resultado} lead${resultado !== 1 ? "s" : ""} reasignado${resultado !== 1 ? "s" : ""} al administrador`}
            </p>
          </div>
        )}
        <Button
          size="sm"
          variant="outline"
          className="w-full gap-1.5"
          onClick={handleReasignar}
          disabled={loading}
        >
          <UserCheck className="h-3.5 w-3.5" />
          {loading ? "Reasignando..." : "Reasignar al administrador"}
        </Button>
      </CardContent>
    </Card>
  );
}
