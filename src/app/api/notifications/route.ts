import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { endOfDay } from "date-fns";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const hoy = endOfDay(new Date());

  const [leadsNuevos, seguimientosVencidos, totalNuevos, totalSeguimientos] = await Promise.all([
    prisma.lead.findMany({
      where: { estadoLead: "Nuevo" },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, nombre: true, temaInteres: true, createdAt: true },
    }),
    prisma.lead.findMany({
      where: {
        fechaProximaAccion: { lte: hoy },
        estadoLead: { not: "Archivado" },
      },
      orderBy: { fechaProximaAccion: "asc" },
      take: 5,
      select: { id: true, nombre: true, fechaProximaAccion: true },
    }),
    prisma.lead.count({ where: { estadoLead: "Nuevo" } }),
    prisma.lead.count({
      where: {
        fechaProximaAccion: { lte: hoy },
        estadoLead: { not: "Archivado" },
      },
    }),
  ]);

  return NextResponse.json({
    totalBadge: totalNuevos + totalSeguimientos,
    leadsNuevos,
    seguimientosVencidos,
    totalNuevos,
    totalSeguimientos,
  });
}
