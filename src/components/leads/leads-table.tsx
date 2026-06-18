"use client";

import { useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  PRIORIDADES,
  FUENTES,
  PRIORIDAD_COLORS,
  ESTADO_COLORS,
  SCORE_COLORS,
  SEGMENTOS,
} from "@/lib/constants";
import { format, differenceInHours } from "date-fns";
import { es } from "date-fns/locale";
import { Search, ArrowRight, Inbox, X, ChevronLeft, ChevronRight, AlertTriangle, ArrowUpDown, ArrowDown } from "lucide-react";

interface LeadWithUser {
  id: string;
  nombre: string;
  edad: number;
  temaInteres: string;
  fuente: string | null;
  categoria: string;
  prioridad: string;
  estadoLead: string;
  createdAt: Date;
  scoreViabilidad: number | null;
  etiquetaViabilidad: string | null;
  fechaUltimoContacto: Date | null;
  vecesRecibido: number;
}

const FILTER_LABELS: Record<string, string> = {
  estado: "Estado",
  categoria: "Categoría",
  prioridad: "Prioridad",
  fuente: "Fuente",
  segmento: "Segmento",
  sinContacto: "Sin contacto",
};

const OPCIONES_SIN_CONTACTO = [
  { value: "24", label: "> 24 horas" },
  { value: "72", label: "> 3 días" },
  { value: "168", label: "> 7 días" },
];

export function LeadsTable({
  leads,
  filteredTotal,
  totalActivos,
  totalArchivados,
  page,
  pageSize,
  tab,
}: {
  leads: LeadWithUser[];
  filteredTotal: number;
  totalActivos: number;
  totalArchivados: number;
  page: number;
  pageSize: number;
  tab: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const esArchivados = tab === "archivados";
  const orden = searchParams.get("orden") || "score";

  function setFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "todas") {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete("pagina");
    router.push(`/leads?${params.toString()}`);
  }

  function setOrden(nuevoOrden: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (nuevoOrden === "score") {
      params.delete("orden");
    } else {
      params.set("orden", nuevoOrden);
    }
    params.delete("pagina");
    router.push(`/leads?${params.toString()}`);
  }

  function switchTab(nuevoTab: string) {
    router.push(nuevoTab === "archivados" ? "/leads?tab=archivados" : "/leads");
  }

  function goToPage(p: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("pagina", String(p));
    router.push(`/leads?${params.toString()}`);
  }

  const totalPages = Math.ceil(filteredTotal / pageSize);

  const FILTER_KEYS = esArchivados
    ? ["categoria", "prioridad", "fuente", "busqueda"]
    : ["categoria", "prioridad", "fuente", "busqueda", "segmento", "sinContacto"];
  const activeFilters = FILTER_KEYS
    .filter((k) => searchParams.get(k))
    .map((k) => ({ key: k, value: searchParams.get(k)! }));

  const isFiltered = activeFilters.length > 0;

  function horasSinContacto(lead: LeadWithUser): number | null {
    if (esArchivados) return null;
    if (lead.fechaUltimoContacto) return null;
    if (lead.estadoLead !== "Nuevo") return null;
    return differenceInHours(new Date(), new Date(lead.createdAt));
  }

  return (
    <div className="space-y-3">
      {/* Tab switcher */}
      <div className="flex gap-1 p-1 bg-muted/30 rounded-lg border border-border w-fit">
        <button
          onClick={() => switchTab("activos")}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
            !esArchivados
              ? "bg-card shadow-sm text-card-foreground"
              : "text-muted hover:text-card-foreground"
          }`}
        >
          Activos
          <span className={`text-[11px] tabular-nums px-1.5 py-0.5 rounded-full ${
            !esArchivados ? "bg-primary/10 text-primary" : "bg-muted/50 text-muted"
          }`}>
            {totalActivos}
          </span>
        </button>
        <button
          onClick={() => switchTab("archivados")}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
            esArchivados
              ? "bg-card shadow-sm text-card-foreground"
              : "text-muted hover:text-card-foreground"
          }`}
        >
          Archivados
          <span className={`text-[11px] tabular-nums px-1.5 py-0.5 rounded-full ${
            esArchivados ? "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300" : "bg-muted/50 text-muted"
          }`}>
            {totalArchivados}
          </span>
        </button>
      </div>

      {!esArchivados && <FilterBar searchParams={searchParams} onFilterChange={setFilter} />}
      {esArchivados && <FilterBarArchivados searchParams={searchParams} onFilterChange={setFilter} />}

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-1.5 flex-wrap">
          {activeFilters.map(({ key, value }) => {
            const label = key === "sinContacto"
              ? `> ${value}h`
              : value;
            return (
              <button
                key={key}
                onClick={() => setFilter(key, "")}
                className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/8 px-2.5 py-0.5 text-[11px] font-medium text-primary hover:bg-primary/15 transition-colors"
              >
                <span className="text-primary/60">{FILTER_LABELS[key] ?? key}:</span>
                {label}
                <X className="h-3 w-3 ml-0.5 opacity-60" />
              </button>
            );
          })}
          {activeFilters.length > 1 && (
            <button
              onClick={() => router.push(esArchivados ? "/leads?tab=archivados" : "/leads")}
              className="text-[11px] text-muted hover:text-card-foreground transition-colors underline underline-offset-2"
            >
              Limpiar todo
            </button>
          )}
        </div>
        <p className="text-xs text-muted shrink-0 tabular-nums">
          {isFiltered ? (
            <><span className="font-medium text-card-foreground">{filteredTotal}</span> de {esArchivados ? totalArchivados : totalActivos} leads</>
          ) : (
            <><span className="font-medium text-card-foreground">{filteredTotal}</span> lead{filteredTotal !== 1 ? "s" : ""}</>
          )}
        </p>
      </div>

      <div className="rounded-lg border border-border bg-card shadow-[var(--shadow-card)] overflow-hidden">
        {leads.length === 0 ? (
          <div className="py-14 text-center">
            <Inbox className="mx-auto h-9 w-9 text-muted/25" />
            <p className="mt-3 text-sm font-medium text-card-foreground">Sin resultados</p>
            <p className="text-xs text-muted mt-0.5">
              {isFiltered ? "Prueba ajustando los filtros" : "Todavía no hay leads"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-5" />
                  <TableHead>Nombre / Tema</TableHead>
                  <TableHead className="hidden md:table-cell">Categoría</TableHead>
                  <TableHead className="hidden sm:table-cell">
                    <button
                      onClick={() => setOrden(orden === "score" ? "recientes" : "score")}
                      className={`inline-flex items-center gap-1 hover:text-card-foreground transition-colors ${orden === "score" ? "text-primary font-semibold" : "text-muted-foreground"}`}
                    >
                      Score
                      {orden === "score" ? <ArrowDown className="h-3 w-3" /> : <ArrowUpDown className="h-3 w-3 opacity-40" />}
                    </button>
                  </TableHead>
                  <TableHead className="hidden sm:table-cell">Prioridad</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right hidden sm:table-cell">
                    <button
                      onClick={() => setOrden(orden === "recientes" ? "score" : "recientes")}
                      className={`inline-flex items-center gap-1 hover:text-card-foreground transition-colors ${orden === "recientes" ? "text-primary font-semibold" : "text-muted-foreground"}`}
                    >
                      Fecha
                      {orden === "recientes" ? <ArrowDown className="h-3 w-3" /> : <ArrowUpDown className="h-3 w-3 opacity-40" />}
                    </button>
                  </TableHead>
                  <TableHead className="w-8" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.map((lead) => {
                  const horasSinC = horasSinContacto(lead);
                  const sinContactoCritico = horasSinC !== null && horasSinC >= 24;
                  return (
                    <TableRow
                      key={lead.id}
                      className={`cursor-pointer group ${
                        sinContactoCritico ? "bg-red-50/40 dark:bg-red-950/20" : ""
                      }`}
                      onClick={() => router.push(`/leads/${lead.id}`)}
                    >
                      {/* Indicador rojo >24h sin contacto */}
                      <TableCell className="pr-0">
                        {sinContactoCritico && (
                          <div className="flex items-center justify-center">
                            <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
                          </div>
                        )}
                      </TableCell>

                      {/* Nombre + Tema */}
                      <TableCell>
                        <p className="font-medium text-[13px] text-card-foreground leading-snug">
                          {lead.nombre}
                          {sinContactoCritico && (
                            <span className="ml-1.5 text-[10px] font-semibold text-red-600 dark:text-red-400">
                              {horasSinC}h
                            </span>
                          )}
                          {lead.vecesRecibido > 1 && (
                            <span className="ml-1.5 text-[10px] font-semibold text-violet-600 dark:text-violet-400">
                              ↩ {lead.vecesRecibido}x
                            </span>
                          )}
                        </p>
                        <p className="text-[11px] text-muted mt-0.5 leading-none">
                          {lead.temaInteres}{lead.edad ? ` · ${lead.edad}a` : ""}
                        </p>
                      </TableCell>

                      <TableCell className="hidden md:table-cell">
                        <span className="text-xs text-muted-foreground leading-snug line-clamp-2 max-w-[140px]">
                          {lead.categoria}
                        </span>
                      </TableCell>

                      {/* Score */}
                      <TableCell className="hidden sm:table-cell">
                        {lead.scoreViabilidad !== null ? (
                          <Badge
                            variant="outline"
                            className={`text-[11px] px-2 py-0.5 font-semibold whitespace-nowrap ${
                              SCORE_COLORS[lead.etiquetaViabilidad ?? ""] || ""
                            }`}
                          >
                            {lead.scoreViabilidad}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted/40">—</span>
                        )}
                      </TableCell>

                      {/* Prioridad */}
                      <TableCell className="hidden sm:table-cell">
                        <Badge
                          variant="outline"
                          className={`text-[11px] px-2 py-0.5 font-medium whitespace-nowrap ${
                            PRIORIDAD_COLORS[lead.prioridad] || ""
                          }`}
                        >
                          {lead.prioridad}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`text-[11px] px-2 py-0.5 font-medium whitespace-nowrap ${
                            ESTADO_COLORS[lead.estadoLead] || "text-muted-foreground"
                          }`}
                        >
                          {lead.estadoLead}
                        </Badge>
                      </TableCell>


                      <TableCell className="hidden sm:table-cell text-right text-xs text-muted tabular-nums">
                        {format(new Date(lead.createdAt), "dd MMM yy", { locale: es })}
                      </TableCell>

                      <TableCell
                        className="text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Link
                          href={`/leads/${lead.id}`}
                          className="inline-flex items-center justify-center w-6 h-6 rounded-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-sidebar-accent"
                          aria-label="Ver lead"
                        >
                          <ArrowRight className="h-3.5 w-3.5 text-primary" />
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-muted tabular-nums">
            Página <span className="font-medium text-card-foreground">{page}</span> de{" "}
            <span className="font-medium text-card-foreground">{totalPages}</span>
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => goToPage(page - 1)}
              disabled={page <= 1}
              className="inline-flex items-center justify-center h-7 w-7 rounded-md border border-border bg-card text-muted-foreground hover:bg-sidebar-accent hover:text-card-foreground disabled:opacity-40 disabled:pointer-events-none transition-colors"
              aria-label="Página anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
              .reduce<(number | "…")[]>((acc, p, i, arr) => {
                if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("…");
                acc.push(p);
                return acc;
              }, [])
              .map((p, i) =>
                p === "…" ? (
                  <span key={`ellipsis-${i}`} className="px-1 text-xs text-muted">…</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => goToPage(p as number)}
                    className={`inline-flex items-center justify-center h-7 min-w-[28px] rounded-md border text-xs font-medium transition-colors ${
                      p === page
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-card text-muted-foreground hover:bg-sidebar-accent hover:text-card-foreground"
                    }`}
                  >
                    {p}
                  </button>
                )
              )}
            <button
              onClick={() => goToPage(page + 1)}
              disabled={page >= totalPages}
              className="inline-flex items-center justify-center h-7 w-7 rounded-md border border-border bg-card text-muted-foreground hover:bg-sidebar-accent hover:text-card-foreground disabled:opacity-40 disabled:pointer-events-none transition-colors"
              aria-label="Página siguiente"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function FilterBarArchivados({
  searchParams,
  onFilterChange,
}: {
  searchParams: URLSearchParams;
  onFilterChange: (key: string, value: string) => void;
}) {
  const [searchValue, setSearchValue] = useState(searchParams.get("busqueda") || "");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleSearch(value: string) {
    setSearchValue(value);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => onFilterChange("busqueda", value), 350);
  }

  return (
    <div className="flex flex-wrap gap-2">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted" />
        <Input
          placeholder="Buscar nombre, correo o teléfono…"
          className="h-8 pl-8 text-sm bg-card border-border"
          value={searchValue}
          onChange={(e) => handleSearch(e.target.value)}
        />
      </div>
      <FilterSelect
        placeholder="Prioridad"
        paramKey="prioridad"
        options={PRIORIDADES as unknown as string[]}
        searchParams={searchParams}
        onFilterChange={onFilterChange}
      />
      <FilterSelect
        placeholder="Fuente"
        paramKey="fuente"
        options={FUENTES as unknown as string[]}
        searchParams={searchParams}
        onFilterChange={onFilterChange}
      />
    </div>
  );
}

function FilterBar({
  searchParams,
  onFilterChange,
}: {
  searchParams: URLSearchParams;
  onFilterChange: (key: string, value: string) => void;
}) {
  const [searchValue, setSearchValue] = useState(searchParams.get("busqueda") || "");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleSearch(value: string) {
    setSearchValue(value);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => onFilterChange("busqueda", value), 350);
  }

  return (
    <div className="flex flex-wrap gap-2">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted" />
        <Input
          placeholder="Buscar nombre, correo o teléfono…"
          className="h-8 pl-8 text-sm bg-card border-border"
          value={searchValue}
          onChange={(e) => handleSearch(e.target.value)}
        />
      </div>

      <FilterSelect
        placeholder="Segmento"
        paramKey="segmento"
        options={SEGMENTOS as unknown as string[]}
        searchParams={searchParams}
        onFilterChange={onFilterChange}
      />
      <FilterSelect
        placeholder="Prioridad"
        paramKey="prioridad"
        options={PRIORIDADES as unknown as string[]}
        searchParams={searchParams}
        onFilterChange={onFilterChange}
      />
      <FilterSelect
        placeholder="Fuente"
        paramKey="fuente"
        options={FUENTES as unknown as string[]}
        searchParams={searchParams}
        onFilterChange={onFilterChange}
      />
      <FilterSelect
        placeholder="Sin contacto"
        paramKey="sinContacto"
        options={OPCIONES_SIN_CONTACTO.map((o) => o.value)}
        optionLabels={OPCIONES_SIN_CONTACTO.map((o) => o.label)}
        searchParams={searchParams}
        onFilterChange={onFilterChange}
      />
    </div>
  );
}

function FilterSelect({
  placeholder,
  paramKey,
  options,
  optionLabels,
  searchParams,
  onFilterChange,
}: {
  placeholder: string;
  paramKey: string;
  options: string[];
  optionLabels?: string[];
  searchParams: URLSearchParams;
  onFilterChange: (key: string, value: string) => void;
}) {
  const active = !!searchParams.get(paramKey);
  return (
    <Select
      value={searchParams.get(paramKey) || "todas"}
      onValueChange={(v) => onFilterChange(paramKey, v)}
    >
      <SelectTrigger
        className={`h-8 text-sm border-border ${
          active
            ? "bg-primary/8 border-primary/40 text-primary font-medium"
            : "bg-card"
        } w-auto min-w-[110px] max-w-[150px]`}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="todas">{placeholder}: Todos</SelectItem>
        {options.map((opt, i) => (
          <SelectItem key={opt} value={opt}>
            {optionLabels?.[i] ?? opt}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
