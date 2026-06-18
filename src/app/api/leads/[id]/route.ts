import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  if (session.user.role !== "administrador") {
    return NextResponse.json({ error: "Solo administradores pueden eliminar leads" }, { status: 403 });
  }

  const { id } = await params;

  const lead = await prisma.lead.findUnique({ where: { id }, select: { id: true } });
  if (!lead) {
    return NextResponse.json({ error: "Lead no encontrado" }, { status: 404 });
  }

  // Borrar registros relacionados antes del lead
  await prisma.leadActivity.deleteMany({ where: { leadId: id } });
  await prisma.leadStatusHistory.deleteMany({ where: { leadId: id } });
  await prisma.leadNote.deleteMany({ where: { leadId: id } });
  await prisma.lead.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
