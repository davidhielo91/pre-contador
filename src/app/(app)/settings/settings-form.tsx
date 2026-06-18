"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { UserPlus, AlertCircle, CheckCircle2 } from "lucide-react";

export function SettingsForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("asesor");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setLoading(true);

    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al crear usuario");

      setName("");
      setEmail("");
      setPassword("");
      setRole("asesor");
      setSuccess(true);
      setTimeout(() => setSuccess(false), 4000);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear usuario");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Crear usuario</CardTitle>
        <CardDescription>Agregar un nuevo asesor o administrador al sistema</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="space-y-1.5">
            <Label htmlFor="new-name" className="text-xs font-medium text-muted-foreground">
              Nombre completo
            </Label>
            <Input
              id="new-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="María García"
              required
              className="h-9 bg-background border-border text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="new-email" className="text-xs font-medium text-muted-foreground">
              Correo electrónico
            </Label>
            <Input
              id="new-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="maria@despacho.com"
              required
              className="h-9 bg-background border-border text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="new-password" className="text-xs font-medium text-muted-foreground">
              Contraseña
            </Label>
            <Input
              id="new-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 8 caracteres"
              minLength={8}
              required
              className="h-9 bg-background border-border text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Rol</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger className="h-9 bg-background border-border text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="asesor">Asesor</SelectItem>
                <SelectItem value="administrador">Administrador</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-md bg-destructive/10 border border-destructive/20 px-3 py-2">
              <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
              <p className="text-xs text-destructive">{error}</p>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 rounded-md bg-success/10 border border-success/20 px-3 py-2">
              <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
              <p className="text-xs text-success">Usuario creado correctamente</p>
            </div>
          )}

          <Button type="submit" size="sm" className="w-full gap-1.5" disabled={loading}>
            <UserPlus className="h-3.5 w-3.5" />
            {loading ? "Creando..." : "Crear usuario"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
