import { NextResponse } from "next/server";

export async function DELETE() {
  return NextResponse.json({ error: "No disponible" }, { status: 403 });
}

export async function PATCH() {
  return NextResponse.json({ error: "No disponible" }, { status: 403 });
}
