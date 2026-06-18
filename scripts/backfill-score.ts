import { prisma } from "../src/lib/prisma";
import { calcularScoreViabilidad } from "../src/lib/classification";

async function main() {
  const leads = await prisma.lead.findMany({
    orderBy: { createdAt: "asc" },
  });

  console.log(`Leads encontrados: ${leads.length}\n`);

  let actualizados = 0;

  for (const lead of leads) {
    const scoreResult = calcularScoreViabilidad(
      {
        nombre: lead.nombre,
        telefono: lead.telefono,
        correo: lead.correo ?? undefined,
        edad: lead.edad,
        ciudad: lead.ciudad,
        estado: lead.estado ?? undefined,
        yaEstaPensionado: lead.yaEstaPensionado,
        temaInteres: lead.temaInteres,
        tieneSemanasCotizadas: lead.tieneSemanasCotizadas ?? undefined,
        fuente: lead.fuente ?? undefined,
        objetivoPrincipal: lead.objetivoPrincipal ?? undefined,
        situacion: lead.situacion,
      },
      lead.categoria,
    );

    await prisma.lead.update({
      where: { id: lead.id },
      data: {
        scoreViabilidad: scoreResult.score,
        etiquetaViabilidad: scoreResult.etiqueta,
      },
    });

    console.log(
      `${lead.nombre.slice(0, 30).padEnd(30)} | score: ${String(scoreResult.score).padStart(2)} | ${scoreResult.etiqueta}`,
    );

    actualizados++;
  }

  console.log(`\n✓ Backfill completo: ${actualizados} leads actualizados`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
