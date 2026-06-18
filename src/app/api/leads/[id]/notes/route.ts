import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const { contenido } = await _request.json();

  if (!contenido?.trim()) {
    return NextResponse.json({ error: "La nota no puede estar vacía" }, { status: 400 });
  }

  if (contenido.length > 5000) {
    return NextResponse.json({ error: "La nota no puede superar 5,000 caracteres" }, { status: 400 });
  }

  await prisma.leadNote.create({
    data: {
      leadId: id,
      contenido,
      userId: session.user.id,
    },
  });

  await prisma.leadActivity.create({
    data: {
      leadId: id,
      tipo: "nota_agregada",
      nota: contenido.slice(0, 200),
      userId: session.user.id,
    },
  });

  return NextResponse.json({ success: true });
}
