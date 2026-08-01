import "server-only";
import { prisma } from "@/lib/prisma";
import { resolveOnlineOrderingEnabled } from "@/lib/online-ordering-rules";

export const ONLINE_ORDERING_DISABLED_MESSAGE =
  "La commande en ligne est temporairement désactivée. Venez commander et payer directement au restaurant, sur place ou à emporter.";

/**
 * Le défaut est volontairement fermé, y compris si la ligne singleton n'existe
 * pas encore ou si la base est momentanément indisponible.
 */
export async function isOnlineOrderingEnabled(): Promise<boolean> {
  const setting = await prisma.orderingSetting
    .findUnique({
      where: { id: "default" },
      select: { onlineOrderingEnabled: true },
    })
    .catch(() => null);
  return resolveOnlineOrderingEnabled(setting?.onlineOrderingEnabled);
}
