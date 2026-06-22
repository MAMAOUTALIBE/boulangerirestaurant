import { prisma } from "@/lib/prisma";
import {
  ServiceBoard,
  type ServiceOrder,
} from "@/components/admin/ServiceBoard";

export const dynamic = "force-dynamic";

export default async function ServicePage() {
  const [rows, setting] = await Promise.all([
    prisma.order.findMany({
      where: {
        status: { in: ["en attente", "payée", "en préparation", "prête"] },
      },
      orderBy: { createdAt: "asc" },
      include: {
        items: true,
        events: { orderBy: { createdAt: "desc" }, take: 1 },
      },
    }),
    prisma.orderingSetting.findUnique({ where: { id: "default" } }),
  ]);

  const orders: ServiceOrder[] = rows.map((o) => {
    const due = o.scheduledAt
      ? o.scheduledAt.getTime()
      : o.createdAt.getTime() + o.prepTimeMin * 60000;
    const enteredAt = o.events[0]?.createdAt.getTime() ?? o.createdAt.getTime();
    return {
      id: o.id,
      reference: o.reference,
      customerName: o.customerName,
      status: o.status,
      total: o.total,
      fulfillment: o.fulfillment,
      dueAtMs: due,
      enteredAtMs: enteredAt,
      items: o.items.map((i) => ({ name: i.name, quantity: i.quantity })),
    };
  });

  const thresholds = {
    imminentMin: setting?.imminentMin ?? 5,
    prepMaxMin: setting?.prepMaxMin ?? 10,
    stageMaxMin: setting?.stageMaxMin ?? 5,
  };

  return <ServiceBoard orders={orders} thresholds={thresholds} />;
}
