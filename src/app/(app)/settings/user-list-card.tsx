"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Shield, ToggleLeft, ToggleRight, Trash2, Loader2 } from "lucide-react";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
}

export function UserListCard({ users }: { users: User[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  async function toggleActive(userId: string, currentActive: boolean) {
    setLoading(userId);
    try {
      await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !currentActive }),
      });
      router.refresh();
    } finally {
      setLoading(null);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setError("");
    try {
      const res = await fetch(`/api/users/${deleteTarget.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Error al eliminar");
        return;
      }
      setDeleteTarget(null);
      router.refresh();
    } catch {
      setError("Error de conexión");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Usuarios del sistema</CardTitle>
        <CardDescription>Usuarios internos con acceso al panel</CardDescription>
      </CardHeader>
      <CardContent>
        {users.length === 0 ? (
          <p className="text-sm text-muted">No hay usuarios registrados</p>
        ) : (
          <div className="space-y-3">
            {users.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between rounded-lg border border-border p-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 shrink-0">
                    <Shield className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{user.name}</p>
                    <p className="text-xs text-muted truncate">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge
                    variant={user.role === "administrador" ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {user.role === "administrador" ? "Admin" : "Asesor"}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleActive(user.id, user.active)}
                    disabled={loading === user.id}
                    className={`h-7 px-2 text-xs gap-1 ${
                      user.active
                        ? "text-success hover:text-destructive hover:bg-destructive/5"
                        : "text-muted hover:text-success hover:bg-success/5"
                    }`}
                  >
                    {user.active ? (
                      <>
                        <ToggleRight className="h-4 w-4" />
                        Activo
                      </>
                    ) : (
                      <>
                        <ToggleLeft className="h-4 w-4" />
                        Inactivo
                      </>
                    )}
                  </Button>
                  {user.role !== "administrador" && (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-muted hover:text-destructive hover:bg-destructive/5"
                          onClick={() => setDeleteTarget(user)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Eliminar usuario</DialogTitle>
                          <DialogDescription>
                            ¿Estás seguro de eliminar a <strong>{deleteTarget?.name}</strong>?
                            Los leads asignados quedarán sin asesor.
                          </DialogDescription>
                        </DialogHeader>
                        {error && (
                          <p className="text-xs text-destructive bg-destructive/5 rounded px-3 py-2">{error}</p>
                        )}
                        <DialogFooter className="gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => { setDeleteTarget(null); setError(""); }}
                            disabled={deleting}
                          >
                            Cancelar
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={handleDelete}
                            disabled={deleting}
                          >
                            {deleting ? (
                              <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Eliminando…</>
                            ) : (
                              <><Trash2 className="h-3.5 w-3.5" /> Eliminar</>
                            )}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
