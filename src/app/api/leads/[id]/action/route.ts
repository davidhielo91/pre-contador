import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

const ACCIONES_MAP: Record<string, { tipo: string; estado?: string; nota: string; estadosSolo?: string[] }> = {
  whatsapp_enviado: {
    tipo: "whatsapp_enviado",
    estado: "Contactado",
    nota: "WhatsApp enviado al prospecto",
    estadosSolo: ["Nuevo"],
  },
  correo_enviado: {
    tipo: "correo_enviado",
    estado: "Contactado",
    nota: "Correo enviado al prospecto",
    estadosSolo: ["Nuevo"],
  },
  archivado: {
    tipo: "archivado",
    estado: "Archivado",
    nota: "Lead archivado",
  },
};

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const { tipo } = await _request.json();
  const accion = ACCIONES_MAP[tipo];

  if (!accion) {
    return NextResponse.json({ error: "Acción no válida" }, { status: 400 });
  }

  const updateData: Record<string, unknown> = {
    fechaUltimoContacto: new Date(),
  };

  if (accion.estado) {
    const oldLead = await prisma.lead.findUnique({ where: { id } });
    if (oldLead) {
      const debeActualizar = !accion.estadosSolo || accion.estadosSolo.includes(oldLead.estadoLead);
      if (debeActualizar) {
        await prisma.leadStatusHistory.create({
          data: {
            leadId: id,
            estadoAnterior: oldLead.estadoLead,
            estadoNuevo: accion.estado,
            userId: session.user.id,
          },
        });
        updateData.estadoLead = accion.estado;
      }
    }
  }

  await prisma.lead.update({ where: { id }, data: updateData });

  await prisma.leadActivity.create({
    data: {
      leadId: id,
      tipo: accion.tipo,
      nota: accion.nota,
      userId: session.user.id,
    },
  });

  return NextResponse.json({ success: true });
}
