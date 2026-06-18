import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const session = await auth();
  if (session?.user?.role !== "administrador") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const admin = await prisma.user.findFirst({
    where: { role: "administrador", active: true },
    select: { id: true },
  });

  if (!admin) {
    return NextResponse.json({ error: "No se encontró un administrador activo" }, { status: 404 });
  }

  const { count } = await prisma.lead.updateMany({
    where: { userId: null },
    data: { userId: admin.id },
  });

  return NextResponse.json({ actualizados: count });
}
