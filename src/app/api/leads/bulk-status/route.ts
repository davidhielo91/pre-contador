import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ESTADOS_LEAD } from "@/lib/constants";

const MAX_IDS = 200;

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  let body: { ids?: unknown; estadoLead?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const { ids, estadoLead } = body;

  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: "ids debe ser un array no vacío" }, { status: 400 });
  }
  if (ids.length > MAX_IDS) {
    return NextResponse.json({ error: `Máximo ${MAX_IDS} ids por operación` }, { status: 400 });
  }
  if (typeof estadoLead !== "string" || !(ESTADOS_LEAD as readonly string[]).includes(estadoLead)) {
    return NextResponse.json({ error: "estadoLead inválido" }, { status: 400 });
  }

  const leads = await prisma.lead.findMany({
    where: { id: { in: ids as string[] } },
    select: { id: true, estadoLead: true },
  });

  const aActualizar = leads.filter((l) => l.estadoLead !== estadoLead);

  if (aActualizar.length === 0) {
    return NextResponse.json({ actualizados: 0 });
  }

  await prisma.$transaction(async (tx) => {
    for (const lead of aActualizar) {
      await tx.lead.update({
        where: { id: lead.id },
        data: { estadoLead, fechaUltimoContacto: new Date() },
      });
      await tx.leadStatusHistory.create({
        data: {
          leadId: lead.id,
          estadoAnterior: lead.estadoLead,
          estadoNuevo: estadoLead,
          userId: session.user.id,
        },
      });
      await tx.leadActivity.create({
        data: {
          leadId: lead.id,
          tipo: "estado_cambiado",
          nota: `${lead.estadoLead} → ${estadoLead}`,
          userId: session.user.id,
        },
      });
    }
  });

  return NextResponse.json({ actualizados: aActualizar.length });
}
