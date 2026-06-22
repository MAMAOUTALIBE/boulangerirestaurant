import { notFound } from "next/navigation";
import { getOrderByReference } from "@/lib/orders";
import { PrintTrigger } from "@/components/admin/PrintTrigger";
import { siteConfig } from "@/lib/config";

export const dynamic = "force-dynamic";

/** Ticket cuisine imprimable (impression auto à l'ouverture). */
export default async function TicketPage({
  params,
}: {
  params: Promise<{ reference: string }>;
}) {
  const { reference } = await params;
  const order = await getOrderByReference(reference);
  if (!order) notFound();

  const mode =
    order.fulfillment === "livraison"
      ? "LIVRAISON"
      : order.fulfillment === "surplace"
        ? "SUR PLACE"
        : "À EMPORTER";

  return (
    <main className="mx-auto max-w-sm bg-white p-6 font-mono text-sm text-black">
      <PrintTrigger />
      <div className="text-center">
        <h1 className="text-lg font-bold">{siteConfig.shortName} — CUISINE</h1>
        <p className="text-base font-bold">{mode}</p>
        <p>{order.reference}</p>
        <p>{new Date(order.createdAt).toLocaleString("fr-FR")}</p>
        {order.scheduledAt && (
          <p className="font-bold">
            Pour : {new Date(order.scheduledAt).toLocaleString("fr-FR")}
          </p>
        )}
      </div>

      <hr className="my-3 border-dashed border-black" />

      <ul className="space-y-2">
        {order.items.map((i) => (
          <li key={i.id}>
            <p className="font-bold">
              {i.quantity}× {i.name}
            </p>
            {i.options && i.options.length > 0 && (
              <p className="pl-3">
                + {i.options.map((o) => o.label).join(", ")}
              </p>
            )}
            {i.note && <p className="pl-3 italic">⚠ {i.note}</p>}
          </li>
        ))}
      </ul>

      <hr className="my-3 border-dashed border-black" />

      <p>Client : {order.customer.name}</p>
      <p>Tél : {order.customer.phone}</p>
      {order.fulfillment === "livraison" && order.customer.address && (
        <p>Adresse : {order.customer.address}</p>
      )}
      {order.customer.notes && <p>Note : {order.customer.notes}</p>}

      <p className="mt-3 text-center text-xs">
        — Préparation estimée {order.prepTimeMin} min —
      </p>
    </main>
  );
}
