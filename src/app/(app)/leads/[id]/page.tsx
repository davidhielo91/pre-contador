import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { LeadDetail } from "@/components/leads/lead-detail";

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const lead = await prisma.lead.findUnique({
    where: { id },
    include: {
      asignadoA: { select: { id: true, name: true } },
      activities: {
        orderBy: { createdAt: "desc" },
        include: { user: { select: { name: true } } },
      },
      notes: {
        orderBy: { createdAt: "desc" },
        include: { user: { select: { name: true } } },
      },
    },
  });

  if (!lead) notFound();

  return <LeadDetail lead={lead} />;
}
