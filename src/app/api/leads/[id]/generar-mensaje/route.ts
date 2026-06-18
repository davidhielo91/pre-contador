import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generarMensajeWAConIA } from "@/lib/ai";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  if (!process.env.MISTRAL_API_KEY) {
    return NextResponse.json({ error: "Mistral no configurado" }, { status: 503 });
  }

  const { id } = await params;
  const lead = await prisma.lead.findUnique({
    where: { id },
    select: {
      nombre: true,
      edad: true,
      ciudad: true,
      temaInteres: true,
      situacion: true,
      categoria: true,
      prioridad: true,
      yaEstaPensionado: true,
      objetivoPrincipal: true,
    },
  });

  if (!lead) {
    return NextResponse.json({ error: "Lead no encontrado" }, { status: 404 });
  }

  try {
    const mensaje = await generarMensajeWAConIA(lead);
    return NextResponse.json({ mensaje });
  } catch {
    return NextResponse.json({ error: "Error al generar el mensaje" }, { status: 500 });
  }
}
