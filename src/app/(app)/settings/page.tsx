import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Settings } from "lucide-react";

export default async function SettingsPage() {
  const session = await auth();
  if (session?.user?.role !== "administrador") redirect("/dashboard");

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-primary/10 p-2">
          <Settings className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-primary">Configuración</h1>
          <p className="text-sm text-muted">Información del sistema</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Información del sistema</CardTitle>
          <CardDescription>
            Configuración general del centro de pre-diagnósticos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <span className="text-xs text-muted uppercase tracking-wider font-medium">Landing de diagnóstico</span>
            <p className="font-medium mt-0.5">
              <a
                href="https://pensiones.contadorgerardohuerta.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                pensiones.contadorgerardohuerta.com
              </a>
            </p>
          </div>
          <div>
            <span className="text-xs text-muted uppercase tracking-wider font-medium">Endpoint público</span>
            <p className="font-mono text-xs mt-0.5 bg-background border border-border rounded px-2 py-1 text-muted-foreground">
              POST /api/public/leads
            </p>
          </div>
          <div>
            <span className="text-xs text-muted uppercase tracking-wider font-medium">Rate limit</span>
            <p className="mt-0.5 text-muted-foreground">5 solicitudes / minuto por IP</p>
          </div>
          <div>
            <span className="text-xs text-muted uppercase tracking-wider font-medium">Versión</span>
            <p className="mt-0.5 text-muted-foreground">1.0.0</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
