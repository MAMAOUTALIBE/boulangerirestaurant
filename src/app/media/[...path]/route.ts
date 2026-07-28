import fs from "node:fs/promises";
import { createReadStream } from "node:fs";
import { Readable } from "node:stream";
import { NextResponse } from "next/server";
import { contentTypeForPath } from "@/lib/media-rules";
import { resolveUploadPath } from "@/lib/media";

/**
 * GET /media/<AAAA>/<MM>/<fichier> — sert un média téléversé depuis le CRM.
 *
 * Les uploads vivent hors de `public/` (voir `src/lib/media.ts`) pour survivre
 * au `rsync --delete` du déploiement ; cette route les rend accessibles à une
 * URL same-origin, donc utilisable par `next/image` et conforme à la CSP.
 *
 * Public par nature (ce sont les photos du site), mais strictement borné : le
 * chemin demandé est validé segment par segment puis re-vérifié après
 * résolution, et le contenu est **diffusé en flux** — une vidéo de plusieurs
 * Mo demandée par dix visiteurs ne doit pas tenir dix fois en mémoire.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path: segments } = await params;
  const absolutePath = resolveUploadPath(segments);
  if (!absolutePath) {
    return new NextResponse("Introuvable", { status: 404 });
  }

  // `stat` sans suivre les liens : un lien symbolique déposé dans le volume ne
  // doit pas devenir une fenêtre de lecture sur le reste du conteneur.
  const stats = await fs.lstat(absolutePath).catch(() => null);
  if (!stats || !stats.isFile()) {
    return new NextResponse("Introuvable", { status: 404 });
  }

  const stream = Readable.toWeb(
    createReadStream(absolutePath),
  ) as ReadableStream<Uint8Array>;

  return new NextResponse(stream, {
    headers: {
      "Content-Type": contentTypeForPath(absolutePath),
      "Content-Length": String(stats.size),
      // Le nom de fichier contient un suffixe aléatoire : le contenu d'une URL
      // donnée ne change jamais, on peut donc mettre en cache agressivement.
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
