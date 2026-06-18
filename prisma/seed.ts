import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // ── Limpieza de datos ────────────────────────────────────────────────────────
  // Controlado por RESET_ON_STARTUP=true en las variables de entorno de EasyPanel.
  // Cuando el sistema esté en producción con datos reales, elimina esa variable
  // o cámbiala a false para que los leads no se borren en cada deploy.
  if (process.env.RESET_ON_STARTUP === "true") {
    await prisma.leadActivity.deleteMany({});
    await prisma.leadStatusHistory.deleteMany({});
    await prisma.leadNote.deleteMany({});
    await prisma.lead.deleteMany({});
    console.log("✓ Base de datos limpiada (RESET_ON_STARTUP=true)");
  }

  // ── Admin ────────────────────────────────────────────────────────────────────
  const adminEmail    = process.env.ADMIN_EMAIL    || "admin@despacho.com";
  const adminPassword = process.env.ADMIN_PASSWORD || "admin123";
  const hashedPassword = await hash(adminPassword, 12);

  const existingUser = await prisma.user.findUnique({ where: { email: adminEmail } });

  if (existingUser) {
    await prisma.user.update({
      where: { email: adminEmail },
      data: { password: hashedPassword },
    });
    console.log(`✓ Contraseña del administrador sincronizada: ${adminEmail}`);
  } else {
    await prisma.user.create({
      data: {
        name: "Administrador",
        email: adminEmail,
        password: hashedPassword,
        role: "administrador",
      },
    });
    console.log(`✓ Usuario administrador creado: ${adminEmail}`);
  }

  // Reasignar leads sin asignar al administrador
  const adminUser = await prisma.user.findFirst({
    where: { role: "administrador", active: true },
    select: { id: true },
  });
  if (adminUser) {
    const { count } = await prisma.lead.updateMany({
      where: { userId: null },
      data: { userId: adminUser.id },
    });
    if (count > 0) console.log(`✓ ${count} leads reasignados al administrador`);
  }

  console.log("✓ Sistema listo");
}

main()
  .catch((e) => {
    console.error("Error en seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
