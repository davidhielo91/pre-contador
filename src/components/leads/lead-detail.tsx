"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  ArrowLeft,
  MessageSquare,
  Mail,
  Plus,
  Archive,
  History,
  User,
  MapPin,
  Phone,
  FileText,
  Tag,
  AlertTriangle,
  CheckCircle2,
  RotateCcw,
  Trash2,
  Bell,
  BellOff,
  Sparkles,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ESTADOS_LEAD,
  PRIORIDAD_COLORS,
  CATEGORIAS_INTERNAS,
  PRIORIDADES,
  VIABILIDADES,
  ESTADO_COLORS,
  SEGMENTOS_INTERES,
  SEGMENTO_INTERES_COLORS,
} from "@/lib/constants";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { generarCorreo } from "@/lib/classification";

interface LeadDetailProps {
  lead: {
    id: string;
    nombre: string;
    telefono: string;
    correo: string | null;
    edad: number;
    ciudad: string;
    estado: string | null;
    yaEstaPensionado: string;
    temaInteres: string;
    tieneSemanasCotizadas: string | null;
    fuente: string | null;
    objetivoPrincipal: string | null;
    situacion: string;
    categoria: string;
    prioridad: string;
    viabilidad: string;
    estadoLead: string;
    userId: string | null;
    telefonoNormalizado: string | null;
    fechaUltimoContacto: Date | null;
    fechaProximaAccion: Date | null;
    vecesRecibido: number;
    resumenIA: string | null;
    segmentoInteres?: string | null;
    createdAt: Date;
    asignadoA: { id: string; name: string } | null;
    activities: Array<{
      id: string;
      tipo: string;
      nota: string | null;
      createdAt: Date;
      user: { name: string } | null;
    }>;
    notes: Array<{
      id: string;
      contenido: string;
      createdAt: Date;
      user: { name: string } | null;
    }>;
  };
}

const TIPO_LABELS: Record<string, string> = {
  lead_creado:             "Lead creado",
  clasificacion_automatica:"Clasificación automática",
  formulario_reenviado:    "Volvió a enviar formulario",
  whatsapp_enviado:        "WhatsApp enviado",
  correo_enviado:          "Correo enviado",
  nota_agregada:           "Nota agregada",
  estado_cambiado:         "Estado cambiado",
  archivado:               "Archivado",
};

const TIPO_ICONS: Record<string, React.ElementType> = {
  lead_creado:             User,
  clasificacion_automatica:Tag,
  formulario_reenviado:    RotateCcw,
  whatsapp_enviado:        MessageSquare,
  correo_enviado:          Mail,
  nota_agregada:           FileText,
  estado_cambiado:         Tag,
  archivado:               Archive,
};

const TIPO_COLORS: Record<string, string> = {
  lead_creado:             "bg-blue-100 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400",
  clasificacion_automatica:"bg-slate-100 text-slate-500 dark:bg-slate-800/50 dark:text-slate-400",
  formulario_reenviado:    "bg-orange-100 text-orange-600 dark:bg-orange-950/50 dark:text-orange-400",
  whatsapp_enviado:        "bg-green-100 text-green-600 dark:bg-green-950/50 dark:text-green-400",
  correo_enviado:          "bg-sky-100 text-sky-600 dark:bg-sky-950/50 dark:text-sky-400",
  nota_agregada:           "bg-amber-100 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400",
  estado_cambiado:         "bg-purple-100 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400",
  archivado:               "bg-slate-100 text-slate-500 dark:bg-slate-800/50 dark:text-slate-400",
};

export function LeadDetail({ lead }: LeadDetailProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "administrador";
  const [nuevaNota, setNuevaNota] = useState("");
  const [nuevoEstado, setNuevoEstado] = useState(lead.estadoLead);
  const [nuevaCategoria, setNuevaCategoria] = useState(lead.categoria);
  const [nuevaPrioridad, setNuevaPrioridad] = useState(lead.prioridad);
  const [nuevaViabilidad, setNuevaViabilidad] = useState(lead.viabilidad);
  const [nuevoSegmento, setNuevoSegmento] = useState(lead.segmentoInteres ?? "");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [proximaAccion, setProximaAccion] = useState<Date | null>(
    lead.fechaProximaAccion ? new Date(lead.fechaProximaAccion) : null
  );
  const [correoIA, setCorreoIA]                     = useState<{ asunto: string; cuerpo: string } | null>(null);
  const [generandoCorreoIA, setGenerandoCorreoIA]   = useState(false);
  const [resumenIA, setResumenIA]                   = useState<string | null>(lead.resumenIA);
  const [generandoResumenIA, setGenerandoResumenIA] = useState(false);

  async function generarResumen() {
    setGenerandoResumenIA(true);
    try {
      const res = await fetch(`/api/leads/${lead.id}/generar-resumen`, { method: "POST" });
      const data = await res.json();
      if (data.resumen) {
        setResumenIA(data.resumen);
      } else {
        showError(data.error ?? "Error al generar el resumen. Intenta de nuevo.");
      }
    } catch {
      showError("Error al generar el resumen. Intenta de nuevo.");
    }
    setGenerandoResumenIA(false);
  }

  async function generarCorreoIA() {
    setGenerandoCorreoIA(true);
    try {
      const res = await fetch(`/api/leads/${lead.id}/generar-correo`, { method: "POST" });
      const data = await res.json();
      if (data.asunto && data.cuerpo) {
        setCorreoIA({ asunto: data.asunto, cuerpo: data.cuerpo });
      } else {
        console.error("Error generando correo IA:", data.error ?? data);
      }
    } catch (err) {
      console.error("Error generando correo IA:", err);
    }
    setGenerandoCorreoIA(false);
  }


  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/leads/${lead.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      router.push("/leads");
      router.refresh();
    } catch {
      setErrorMsg("Error al eliminar el lead. Intenta de nuevo.");
      setConfirmDelete(false);
      setDeleting(false);
    }
  }

  function showError(msg: string) {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(""), 3000);
  }

  async function handleAddNote() {
    if (!nuevaNota.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/leads/${lead.id}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contenido: nuevaNota }),
      });
      if (!res.ok) throw new Error();
      setNuevaNota("");
      router.refresh();
    } catch {
      showError("Error al guardar la nota. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateField(field: string, value: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/leads/${lead.id}/update`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      showError("Error al actualizar el campo. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  async function handleQuickAction(tipo: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/leads/${lead.id}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipo }),
      });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      showError("Error al registrar la acción. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSeguimiento(dias: number | null) {
    const fecha = dias !== null
      ? new Date(Date.now() + dias * 24 * 60 * 60 * 1000)
      : null;
    setProximaAccion(fecha);
    await handleUpdateField("fechaProximaAccion", fecha ? fecha.toISOString() : "");
  }

  const correo = generarCorreo(lead.nombre, lead.prioridad);

  return (
    <div className="space-y-5 max-w-5xl pb-8">

      {/* Toasts */}
      {errorMsg && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-lg bg-destructive px-4 py-2.5 text-sm text-destructive-foreground shadow-[var(--shadow-dialog)]">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {errorMsg}
        </div>
      )}

      {/* Page header */}
      <div>
        <Button variant="ghost" size="sm" asChild className="text-muted-foreground -ml-2 mb-3 h-7">
          <Link href="/leads">
            <ArrowLeft className="h-3.5 w-3.5 mr-1" />
            Bandeja de leads
          </Link>
        </Button>

        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-card-foreground">{lead.nombre}</h1>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <Badge
                variant="outline"
                className={`text-[11px] px-2 py-0.5 font-medium ${PRIORIDAD_COLORS[lead.prioridad] || ""}`}
              >
                {lead.prioridad}
              </Badge>
              <Badge
                variant="outline"
                className={`text-[11px] px-2 py-0.5 font-medium ${ESTADO_COLORS[lead.estadoLead] || ""}`}
              >
                {lead.estadoLead}
              </Badge>
              {lead.vecesRecibido > 1 && (
                <Badge
                  variant="outline"
                  className="text-[11px] px-2 py-0.5 font-medium text-orange-600 bg-orange-50 border-orange-200 dark:text-orange-400 dark:bg-orange-950/40 dark:border-orange-800 inline-flex items-center gap-1"
                >
                  <RotateCcw className="h-2.5 w-2.5" />
                  Reenviado {lead.vecesRecibido}x
                </Badge>
              )}
              <span className="text-xs text-muted">
                {lead.temaInteres} · {lead.edad} años · {lead.ciudad}{lead.estado ? `, ${lead.estado}` : ""}
              </span>
            </div>
          </div>
          <div className="text-right shrink-0 hidden sm:block">
            <p className="text-[11px] text-muted uppercase tracking-wider">Recibido</p>
            <p className="text-sm font-semibold text-card-foreground mt-0.5">
              {format(new Date(lead.createdAt), "dd MMM yyyy", { locale: es })}
            </p>
            {lead.fuente && (
              <span className="mt-1 inline-block text-[10px] text-muted bg-sidebar-accent border border-border rounded px-2 py-0.5">
                {lead.fuente}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Body grid */}
      <div className="grid gap-5 lg:grid-cols-3">

        {/* ── Main column ── */}
        <div className="lg:col-span-2 space-y-5">

          {/* Datos del prospecto */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Datos del prospecto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                <InfoRow icon={Phone} label="Teléfono" value={lead.telefono} />
                <InfoRow icon={Mail} label="Correo" value={lead.correo || "—"} />
                <InfoRow icon={MapPin} label="Ubicación" value={`${lead.ciudad}${lead.estado ? `, ${lead.estado}` : ""}`} />
                <InfoRow icon={User} label="¿Ya pensionado?" value={lead.yaEstaPensionado === "si" ? "Sí" : lead.yaEstaPensionado === "no" ? "No" : "No sé"} />
                <InfoRow icon={FileText} label="Semanas cotizadas" value={
                  lead.tieneSemanasCotizadas === "si" ? "Sí" :
                  lead.tieneSemanasCotizadas === "no" ? "No" :
                  lead.tieneSemanasCotizadas === "no_seguro" ? "No estoy seguro" : "—"
                } />
                <InfoRow icon={Tag} label="Objetivo" value={lead.objetivoPrincipal || "—"} />
              </dl>

              <div className="pt-3 border-t border-border">
                <p className="text-[11px] text-muted uppercase tracking-wider font-medium mb-2">
                  Situación que comenta
                </p>
                <p className="text-sm text-card-foreground bg-surface rounded-md px-3.5 py-3 border border-border leading-relaxed">
                  {lead.situacion}
                </p>
              </div>

              <div className="pt-3 border-t border-border space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] text-muted uppercase tracking-wider font-medium">
                    Resumen del caso
                  </p>
                  {!resumenIA && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 gap-1.5 text-xs text-violet-700 border-violet-200 bg-violet-50 hover:bg-violet-100 dark:text-violet-400 dark:border-violet-900 dark:bg-violet-950/30 disabled:opacity-60"
                      onClick={generarResumen}
                      disabled={generandoResumenIA}
                    >
                      {generandoResumenIA ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                      {generandoResumenIA ? "Generando…" : "Generar con IA"}
                    </Button>
                  )}
                </div>
                {resumenIA ? (
                  <p className="text-sm text-card-foreground bg-violet-50/50 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-800 rounded-md px-3.5 py-3 leading-relaxed">
                    {resumenIA}
                  </p>
                ) : (
                  <p className="text-xs text-muted italic">
                    Genera un resumen del caso con IA para revisión rápida.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Historial */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <History className="h-4 w-4 text-muted" />
                <CardTitle className="text-sm font-semibold">Historial de actividad</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {lead.activities.length === 0 ? (
                <p className="text-sm text-muted py-2">Sin actividad registrada</p>
              ) : (
                <div className="space-y-0">
                  {lead.activities.map((act, i) => {
                    const Icon = TIPO_ICONS[act.tipo] || History;
                    const colorCls = TIPO_COLORS[act.tipo] || "bg-slate-100 text-slate-500 dark:bg-slate-800/50 dark:text-slate-400";
                    return (
                      <div key={act.id} className="relative flex gap-3 pb-4 last:pb-0">
                        {i < lead.activities.length - 1 && (
                          <div className="absolute left-[15px] top-8 bottom-0 w-px bg-border" />
                        )}
                        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${colorCls}`}>
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                        <div className="flex-1 min-w-0 pt-1">
                          <p className="text-sm font-medium text-card-foreground leading-snug">
                            {TIPO_LABELS[act.tipo] || act.tipo}
                          </p>
                          {act.nota && (
                            <p className="text-xs text-muted mt-0.5 leading-relaxed">{act.nota}</p>
                          )}
                          <p className="text-[11px] text-muted/60 mt-0.5">
                            {act.user?.name || "Sistema"} · {format(new Date(act.createdAt), "dd MMM yyyy HH:mm", { locale: es })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notas internas */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted" />
                <CardTitle className="text-sm font-semibold">Notas internas</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                placeholder="Escribe una nota interna…"
                value={nuevaNota}
                onChange={(e) => setNuevaNota(e.target.value)}
                className="min-h-[72px] text-sm bg-background border-border resize-none"
              />
              <Button
                size="sm"
                onClick={handleAddNote}
                disabled={loading || !nuevaNota.trim()}
                className="gap-1.5"
              >
                <Plus className="h-3.5 w-3.5" />
                Agregar nota
              </Button>

              {lead.notes.length > 0 && (
                <div className="space-y-2 pt-1">
                  {lead.notes.map((note) => (
                    <div
                      key={note.id}
                      className="rounded-lg bg-surface border border-border px-3.5 py-3 text-sm"
                    >
                      <p className="text-card-foreground leading-relaxed">{note.contenido}</p>
                      <p className="text-[11px] text-muted mt-1.5">
                        {note.user?.name || "Sistema"} · {format(new Date(note.createdAt), "dd MMM yyyy HH:mm", { locale: es })}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── Right sidebar ── */}
        <div className="space-y-4">

          {/* Gestión */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted">
                Gestión
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              <div>
                <p className="text-[11px] text-muted font-medium mb-1.5">Estado</p>
                <Select
                  value={nuevoEstado}
                  onValueChange={(v) => { setNuevoEstado(v); handleUpdateField("estadoLead", v); }}
                >
                  <SelectTrigger className="h-8 bg-background border-border text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(ESTADOS_LEAD as unknown as string[]).map((est) => (
                      <SelectItem key={est} value={est}>{est}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Clasificación */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted">
                Clasificación
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              <SelectField
                label="Categoría"
                value={nuevaCategoria}
                options={CATEGORIAS_INTERNAS as unknown as string[]}
                onChange={(v) => { setNuevaCategoria(v); handleUpdateField("categoria", v); }}
              />
              <SelectField
                label="Prioridad"
                value={nuevaPrioridad}
                options={PRIORIDADES as unknown as string[]}
                onChange={(v) => { setNuevaPrioridad(v); handleUpdateField("prioridad", v); }}
              />
              <SelectField
                label="Viabilidad"
                value={nuevaViabilidad}
                options={VIABILIDADES as unknown as string[]}
                onChange={(v) => { setNuevaViabilidad(v); handleUpdateField("viabilidad", v); }}
              />
              <div>
                <p className="text-[11px] text-muted font-medium mb-1.5">Grupo de interés</p>
                <Select
                  value={nuevoSegmento || "sin_clasificar"}
                  onValueChange={(v) => {
                    const val = v === "sin_clasificar" ? "" : v;
                    setNuevoSegmento(val);
                    handleUpdateField("segmentoInteres", val);
                  }}
                >
                  <SelectTrigger className="h-8 bg-background border-border text-sm">
                    <SelectValue placeholder="Sin clasificar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sin_clasificar">Sin clasificar</SelectItem>
                    {(SEGMENTOS_INTERES as unknown as string[]).map((s) => (
                      <SelectItem key={s} value={s}>
                        Grupo {s} — {s === "A" ? "Listo para comprar" : s === "B" ? "Interesado con dudas" : "Curioso"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Contactar */}
          <Card>
            <CardContent className="pt-4 space-y-3">
              <p className="text-[10px] text-muted uppercase tracking-wider font-semibold px-0.5">
                Contactar
              </p>

              {/* ── Correo ── */}
              <div className="space-y-1.5">
                <p className="text-[10px] text-muted uppercase tracking-wider px-0.5">Correo electrónico</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start gap-2 h-8 text-sm text-sky-700 border-sky-200 bg-sky-50 hover:bg-sky-100 hover:text-sky-800 dark:text-sky-400 dark:border-sky-900 dark:bg-sky-950/30 disabled:opacity-50"
                  disabled={!lead.correo}
                  onClick={() => {
                    const asunto = correoIA?.asunto ?? correo.asunto;
                    const cuerpo = correoIA?.cuerpo ?? correo.cuerpo;
                    window.open(`mailto:${lead.correo}?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(cuerpo)}`, "_self");
                    handleQuickAction("correo_enviado");
                  }}
                >
                  <Mail className="h-3.5 w-3.5 shrink-0" />
                  {lead.correo ? "Abrir correo" : "Sin correo registrado"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start gap-2 h-8 text-sm text-violet-700 border-violet-200 bg-violet-50 hover:bg-violet-100 dark:text-violet-400 dark:border-violet-900 dark:bg-violet-950/30 disabled:opacity-60"
                  onClick={generarCorreoIA}
                  disabled={generandoCorreoIA || !lead.correo}
                >
                  {generandoCorreoIA ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                  {generandoCorreoIA ? "Generando…" : correoIA ? "Regenerar correo con IA" : "Generar correo con IA"}
                </Button>
                {correoIA && (
                  <div className="rounded-lg border border-violet-200 bg-violet-50/50 dark:border-violet-800 dark:bg-violet-950/20 p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-semibold text-violet-600 dark:text-violet-400 uppercase tracking-wider flex items-center gap-1">
                        <Sparkles className="h-3 w-3" /> Editar antes de enviar
                      </p>
                      <button
                        onClick={generarCorreoIA}
                        disabled={generandoCorreoIA}
                        className="flex items-center gap-1 text-[10px] text-violet-500 hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-200 disabled:opacity-40 transition-colors"
                        title="Generar otra versión"
                      >
                        {generandoCorreoIA ? <Loader2 className="h-3 w-3 animate-spin" /> : <RotateCcw className="h-3 w-3" />}
                        Regenerar
                      </button>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted mb-0.5 uppercase tracking-wider">Asunto</p>
                      <input
                        type="text"
                        className="w-full text-xs font-medium text-card-foreground bg-white dark:bg-card border border-border rounded px-2 py-1.5 outline-none focus:ring-1 focus:ring-violet-300"
                        value={correoIA.asunto}
                        onChange={(e) => setCorreoIA({ ...correoIA, asunto: e.target.value })}
                      />
                    </div>
                    <div>
                      <p className="text-[10px] text-muted mb-0.5 uppercase tracking-wider">Cuerpo</p>
                      <textarea
                        className="w-full text-xs text-card-foreground bg-white dark:bg-card border border-border rounded px-2 py-1.5 resize-none outline-none focus:ring-1 focus:ring-violet-300 leading-relaxed"
                        rows={7}
                        value={correoIA.cuerpo}
                        onChange={(e) => setCorreoIA({ ...correoIA, cuerpo: e.target.value })}
                      />
                    </div>
                  </div>
                )}
              </div>

              <Separator className="my-1" />

              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start gap-2 h-8 text-sm text-slate-600 hover:text-slate-800"
                onClick={() => handleQuickAction("archivado")}
              >
                <Archive className="h-3.5 w-3.5" />
                Archivar lead
              </Button>

              <Separator className="my-1" />

              {/* Recordatorio */}
              <div>
                <p className="text-[10px] text-muted uppercase tracking-wider font-semibold px-0.5 pb-1.5 pt-0.5">
                  Recordatorio
                </p>
                {proximaAccion ? (
                  <div className="flex items-center justify-between rounded-md border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30 px-2.5 py-1.5 mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <Bell className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                      <span className="text-xs text-amber-700 dark:text-amber-300 font-medium">
                        {format(proximaAccion, "d MMM yyyy", { locale: es })}
                      </span>
                    </div>
                    <button
                      onClick={() => handleSeguimiento(null)}
                      className="text-amber-500 hover:text-amber-700 transition-colors"
                      aria-label="Quitar recordatorio"
                    >
                      <BellOff className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : null}
                <div className="flex gap-1 flex-wrap">
                  {[{ label: "1d", dias: 1 }, { label: "3d", dias: 3 }, { label: "7d", dias: 7 }, { label: "15d", dias: 15 }].map(({ label, dias }) => (
                    <button
                      key={dias}
                      onClick={() => handleSeguimiento(dias)}
                      className="px-2.5 py-1 text-xs rounded-md border border-border bg-background hover:bg-sidebar-accent hover:border-primary/30 text-muted-foreground hover:text-card-foreground transition-colors"
                    >
                      +{label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Eliminar — solo admins */}
              {isAdmin && (
                <>
                  <Separator className="my-1" />
                  {!confirmDelete ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start gap-2 h-8 text-sm text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => setConfirmDelete(true)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Eliminar lead
                    </Button>
                  ) : (
                    <div className="rounded-md border border-destructive/30 bg-destructive/5 p-2.5 space-y-2">
                      <p className="text-xs text-destructive font-medium leading-snug">
                        ¿Eliminar permanentemente? No se puede deshacer.
                      </p>
                      <div className="flex gap-1.5">
                        <Button
                          size="sm"
                          variant="destructive"
                          className="flex-1 h-7 text-xs"
                          onClick={handleDelete}
                          disabled={deleting}
                        >
                          {deleting ? "Eliminando..." : "Sí, eliminar"}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 h-7 text-xs"
                          onClick={() => setConfirmDelete(false)}
                          disabled={deleting}
                        >
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] text-muted uppercase tracking-wider font-medium flex items-center gap-1">
        <Icon className="h-3 w-3 opacity-70" />
        {label}
      </dt>
      <dd className="mt-0.5 text-sm font-medium text-card-foreground">{value}</dd>
    </div>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <p className="text-[11px] text-muted font-medium mb-1.5">{label}</p>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-8 bg-background border-border text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt} value={opt}>{opt}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
