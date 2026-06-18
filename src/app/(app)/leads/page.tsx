import { prisma } from "@/lib/prisma";
import { LeadsTable } from "@/components/leads/leads-table";
import { ImportDialog } from "@/components/leads/import-dialog";
import { Inbox, Download } from "lucide-react";
import { Suspense } from "react";
import { subDays } from "date-fns";

const PAGE_SIZE = 30;

interface PageProps {
  searchParams: Promise<{
    tab?: string;
    estado?: string;
    categoria?: string;
    prioridad?: string;
    fuente?: string;
    busqueda?: string;
    pagina?: string;
    segmento?: string;
    sinContacto?: string;
    orden?: string;
  }>;
}

async function getLeads(filters: Record<string, string | undefined>) {
  const where: Record<string, unknown> = {};
  const hoy = new Date();
  const esArchivados = filters.tab === "archivados";

  if (esArchivados) {
    where.estadoLead = "Archivado";
  } else {
    if (filters.estado && filters.estado !== "Archivado") {
      where.estadoLead = filters.estado;
    } else {
      where.estadoLead = { in: ["Nuevo", "Contactado"] };
    }
  }

  if (filters.categoria) where.categoria = filters.categoria;
  if (filters.prioridad) where.prioridad = filters.prioridad;
  if (filters.fuente) where.fuente = filters.fuente;

  if (!esArchivados && filters.segmento) {
    const seg = filters.segmento;
    if (seg === "Invalidez") {
      where.categoria = { contains: "Invalidez" };
    } else if (seg === "Ley 73") {
      where.categoria = { contains: "Ley 73" };
    } else if (seg === "Cambio cesantía") {
      where.categoria = { contains: "cesantía" };
    } else if (seg === "Pensión baja") {
      where.categoria = { contains: "baja" };
    } else if (seg === "Requiere revisión") {
      where.categoria = "Requiere revisión manual";
    } else if (seg === "Regresaron") {
      where.vecesRecibido = { gt: 1 };
    }
  }

  if (!esArchivados && filters.sinContacto) {
    const horas = parseInt(filters.sinContacto, 10);
    if (!isNaN(horas)) {
      where.createdAt = { lte: subDays(hoy, horas / 24) };
      where.estadoLead = "Nuevo";
    }
  }

  if (filters.busqueda) {
    where.OR = [
      { nombre: { contains: filters.busqueda } },
      { correo: { contains: filters.busqueda } },
      { telefono: { contains: filters.busqueda } },
    ];
  }

  const page = Math.max(1, parseInt(filters.pagina ?? "1") || 1);
  const skip = (page - 1) * PAGE_SIZE;

  const orderBy =
    filters.orden === "recientes"
      ? [{ createdAt: "desc" as const }]
      : [{ scoreViabilidad: { sort: "desc" as const, nulls: "last" as const } }, { createdAt: "desc" as const }];

  const [leads, filteredTotal, totalActivos, totalArchivados] = await Promise.all([
    prisma.lead.findMany({
      where,
      orderBy,
      take: PAGE_SIZE,
      skip,
      include: { asignadoA: { select: { name: true } } },
    }),
    prisma.lead.count({ where }),
    prisma.lead.count({ where: { estadoLead: { in: ["Nuevo", "Contactado"] } } }),
    prisma.lead.count({ where: { estadoLead: "Archivado" } }),
  ]);

  return { leads, filteredTotal, totalActivos, totalArchivados, page, pageSize: PAGE_SIZE };
}

export default async function LeadsPage({ searchParams }: PageProps) {
  const filters = await searchParams;
  const { leads, filteredTotal, totalActivos, totalArchivados, page, pageSize } = await getLeads(filters);
  const tab = filters.tab === "archivados" ? "archivados" : "activos";

  const exportParams = new URLSearchParams();
  if (filters.estado) exportParams.set("estado", filters.estado);
  if (filters.categoria) exportParams.set("categoria", filters.categoria);
  if (filters.prioridad) exportParams.set("prioridad", filters.prioridad);
  if (filters.fuente) exportParams.set("fuente", filters.fuente);
  if (filters.busqueda) exportParams.set("busqueda", filters.busqueda);
  if (tab === "archivados") exportParams.set("estado", "Archivado");
  const exportUrl = `/api/leads/export${exportParams.toString() ? `?${exportParams.toString()}` : ""}`;

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="rounded-lg bg-primary/10 p-2 shrink-0">
            <Inbox className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-primary">Bandeja de Leads</h1>
            <p className="text-sm text-muted">Gestión y seguimiento de prospectos</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <ImportDialog />
          <a
            href={exportUrl}
            className="inline-flex items-center justify-center gap-1.5 h-8 rounded-md border border-border bg-background shadow-sm hover:bg-accent/5 hover:border-accent/30 hover:text-accent active:bg-accent/10 px-3 text-xs font-medium transition-all duration-150 text-muted-foreground"
          >
            <Download className="h-3.5 w-3.5" />
            Exportar
          </a>
        </div>
      </div>

      <Suspense fallback={<div className="text-sm text-muted">Cargando…</div>}>
        <LeadsTable
          leads={leads}
          filteredTotal={filteredTotal}
          totalActivos={totalActivos}
          totalArchivados={totalArchivados}
          page={page}
          pageSize={pageSize}
          tab={tab}
        />
      </Suspense>
    </div>
  );
}
