import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { count } = await prisma.lead.updateMany({
    where: { estadoLead: "Nuevo" },
    data: { estadoLead: "Contactado" },
  });

  return NextResponse.json({ ok: true, actualizados: count });
}
