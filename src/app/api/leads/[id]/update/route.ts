import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { calcularScoreViabilidad } from "@/lib/classification";

const ALLOWED_FIELDS = [
  "categoria",
  "prioridad",
  "viabilidad",
  "estadoLead",
  "userId",
  "notasInternas",
  "fechaProximaAccion",
];

export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const body = await _request.json();
  const field = Object.keys(body)[0];
  const value = body[field];

  if (!field || !ALLOWED_FIELDS.includes(field)) {
    return NextResponse.json({ error: "Campo no permitido" }, { status: 400 });
  }

  const oldLead = await prisma.lead.findUnique({ where: { id } });
  if (!oldLead) {
    return NextResponse.json({ error: "Lead no encontrado" }, { status: 404 });
  }

  const updateData: Record<string, unknown> = {};

  if (field === "fechaProximaAccion") {
    updateData[field] = value ? new Date(value) : null;
  } else if (field === "userId") {
    updateData[field] = value || null;
  } else {
    updateData[field] = value;
  }

  if (field === "estadoLead" && value !== oldLead.estadoLead) {
    updateData.fechaUltimoContacto = new Date();

    await prisma.leadStatusHistory.create({
      data: {
        leadId: id,
        estadoAnterior: oldLead.estadoLead,
        estadoNuevo: value,
        userId: session.user.id,
      },
    });

    await prisma.leadActivity.create({
      data: {
        leadId: id,
        tipo: "estado_cambiado",
        nota: `${oldLead.estadoLead} → ${value}`,
        userId: session.user.id,
      },
    });
  }

  if (field === "categoria" && value !== oldLead.categoria) {
    const scoreResult = calcularScoreViabilidad(
      {
        nombre: oldLead.nombre,
        telefono: oldLead.telefono,
        correo: oldLead.correo ?? undefined,
        edad: oldLead.edad,
        ciudad: oldLead.ciudad,
        estado: oldLead.estado ?? undefined,
        yaEstaPensionado: oldLead.yaEstaPensionado,
        temaInteres: oldLead.temaInteres,
        tieneSemanasCotizadas: oldLead.tieneSemanasCotizadas ?? undefined,
        fuente: oldLead.fuente ?? undefined,
        objetivoPrincipal: oldLead.objetivoPrincipal ?? undefined,
        situacion: oldLead.situacion,
      },
      value as string,
    );

    updateData.scoreViabilidad = scoreResult.score;
    updateData.etiquetaViabilidad = scoreResult.etiqueta;

    await prisma.leadActivity.create({
      data: {
        leadId: id,
        tipo: "clasificacion_automatica",
        nota: `Categoría cambiada manualmente a: ${value} | Score: ${scoreResult.score} (${scoreResult.etiqueta})`,
        userId: session.user.id,
      },
    });
  }

  await prisma.lead.update({
    where: { id },
    data: updateData,
  });

  return NextResponse.json({ success: true });
}
