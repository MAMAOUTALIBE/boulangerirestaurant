/**
 * Indexation des médias livrés avec le dépôt (`public/images`, `public/videos`).
 *
 * Ces fichiers font partie du modèle du site : ils ne sont pas téléversés depuis
 * le CRM, mais on veut qu'ils soient **choisissables** dans la médiathèque
 * (sinon un nouveau client démarre avec un sélecteur d'images vide alors que le
 * site est déjà illustré). Ils sont marqués `source: "template"` et refusés à la
 * suppression côté CRM — ils reviendraient au déploiement suivant.
 *
 * Ce module vit dans `prisma/seeds/` et non dans `src/lib/` : le seed tourne
 * hors de Next (via `tsx`) et ne peut pas importer un module `server-only`.
 *
 * Idempotent (upsert par URL) et non destructif : appelé quel que soit le profil.
 */
import fs from "node:fs/promises";
import path from "node:path";
import type { PrismaClient } from "@prisma/client";

/** Dossiers de `public/` parcourus. */
const TEMPLATE_DIRECTORIES = ["images", "videos"] as const;

/** Extensions reconnues → type MIME enregistré. */
const TEMPLATE_EXTENSIONS: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".mp4": "video/mp4",
};

/** Liste récursivement les fichiers d'un dossier (silencieux s'il n'existe pas). */
async function walkDirectory(root: string): Promise<string[]> {
  const entries = await fs
    .readdir(root, { withFileTypes: true })
    .catch(() => []);
  const files: string[] = [];
  for (const entry of entries) {
    const absolutePath = path.join(root, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walkDirectory(absolutePath)));
    } else if (entry.isFile()) {
      files.push(absolutePath);
    }
  }
  return files;
}

/** Crée/actualise une ligne `Media` par fichier trouvé. Renvoie le total indexé. */
export async function indexTemplateMedia(
  prisma: PrismaClient,
  projectRoot: string = process.cwd(),
): Promise<number> {
  const publicRoot = path.resolve(projectRoot, "public");
  let indexed = 0;

  for (const directory of TEMPLATE_DIRECTORIES) {
    const files = await walkDirectory(path.join(publicRoot, directory));
    for (const absolutePath of files) {
      const mimeType =
        TEMPLATE_EXTENSIONS[path.extname(absolutePath).toLowerCase()];
      if (!mimeType) continue;

      const stats = await fs.stat(absolutePath).catch(() => null);
      if (!stats) continue;

      const segments = path.relative(publicRoot, absolutePath).split(path.sep);
      const url = `/${segments.join("/")}`;
      // Sous-dossier de rangement (`images/africain/x.webp` → « africain »).
      const folder = segments.length > 2 ? segments[1] : directory;

      await prisma.media.upsert({
        where: { url },
        update: { mimeType, size: stats.size, source: "template" },
        create: {
          url,
          filename: path.basename(absolutePath),
          mimeType,
          size: stats.size,
          folder,
          source: "template",
        },
      });
      indexed += 1;
    }
  }
  return indexed;
}
