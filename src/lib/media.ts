import "server-only";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import type { Media } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  SNIFF_BYTES,
  buildMediaPath,
  checkUpload,
  extensionForMime,
  isImageMime,
  resolveMediaSegments,
  type UploadRejection,
} from "@/lib/media-rules";

/**
 * Médiathèque du CRM (couche serveur).
 *
 * ⚠️ Les fichiers téléversés sont stockés **hors de `public/`**, dans
 * `.data/uploads` : ce dossier est déjà exclu du dépôt (`.gitignore`) ET du
 * `rsync --delete` du déploiement (`deploy/update-production.sh`), donc une mise
 * à jour du code ne peut pas effacer les médias du client. En production ce
 * dossier est un volume Docker nommé (`uploads`), qui survit aux rebuilds.
 *
 * Ils sont servis par la route `/media/[...path]` — un chemin same-origin, donc
 * compatible `next/image` sans `remotePatterns` et conforme à la CSP `img-src 'self'`.
 */

/**
 * Racine de stockage des téléversements.
 *
 * Par défaut `.data/uploads` **relatif au répertoire de travail** : c'est
 * correct pour les deux façons documentées de lancer l'app — `npm run dev` et
 * `npm start` partent de la racine du projet, et dans l'image Docker le
 * `WORKDIR` est `/app`, où le volume `uploads` est monté. Si vous lancez le
 * serveur depuis un autre dossier, fixez un chemin **absolu** via `MEDIA_DIR`,
 * sinon les médias atterriraient à côté du volume.
 */
export const MEDIA_ROOT = path.resolve(
  process.cwd(),
  process.env.MEDIA_DIR ?? ".data/uploads",
);

export class MediaError extends Error {}

/**
 * Charge `sharp` à la demande : sert uniquement à lire les dimensions et à
 * recompresser. S'il est indisponible (build minimal, plateforme exotique), on
 * enregistre le fichier tel quel — la médiathèque continue de fonctionner.
 */
async function loadSharp() {
  try {
    const mod = await import("sharp");
    return mod.default;
  } catch {
    return null;
  }
}

/** Crée le dossier de destination s'il n'existe pas encore. */
async function ensureDirectory(absolutePath: string): Promise<void> {
  await fs.mkdir(path.dirname(absolutePath), { recursive: true });
}

/**
 * Enregistre un fichier téléversé et crée sa ligne `Media`.
 *
 * Le type est déduit des **octets** du fichier (`checkUpload`), jamais du
 * `Content-Type` déclaré par le navigateur, et le nom final est régénéré côté
 * serveur — le client ne choisit donc ni le format ni l'emplacement.
 */
export async function storeUpload(
  file: File,
  options: { alt?: string | null; folder?: string | null } = {},
): Promise<Media> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const verdict = checkUpload(
    buffer.byteLength,
    buffer.subarray(0, SNIFF_BYTES),
  );
  if (!("ok" in verdict)) {
    throw new MediaError((verdict as UploadRejection).message);
  }

  let bytes: Buffer = buffer;
  let mimeType = verdict.mimeType;
  let extension = verdict.extension;
  let width: number | null = null;
  let height: number | null = null;

  if (isImageMime(mimeType)) {
    // Toute image est réencodée en WebP. Ce n'est pas qu'une optimisation :
    // c'est ce qui rend sûre la liste large de formats acceptés en entrée
    // (HEIC, TIFF, SVG…). Le fichier déposé n'atteint jamais le navigateur.
    // Donc si la conversion échoue, on REFUSE — jamais de repli sur l'original.
    const sharp = await loadSharp();
    if (!sharp) {
      throw new MediaError(
        "Traitement d'image indisponible sur le serveur. Réessayez plus tard.",
      );
    }
    try {
      const optimized = await sharp(buffer, {
        // Les GIF et HEIC animés : on ne garde que la première image.
        animated: false,
        // Borne le coût de décodage d'une image volontairement démesurée.
        limitInputPixels: 100_000_000,
      })
        // `rotate()` sans argument applique l'orientation EXIF : sans lui, une
        // photo prise au téléphone arrive couchée dans la médiathèque.
        .rotate()
        .resize({
          width: 2000,
          height: 2000,
          fit: "inside",
          withoutEnlargement: true,
        })
        .webp({ quality: 82 })
        .toBuffer({ resolveWithObject: true });
      bytes = optimized.data;
      width = optimized.info.width;
      height = optimized.info.height;
      mimeType = "image/webp";
      extension = extensionForMime(mimeType) ?? "webp";
    } catch {
      throw new MediaError(
        "Image illisible ou corrompue : elle n'a pas pu être convertie.",
      );
    }
  }

  const { relativePath, filename, url } = buildMediaPath(
    new Date(),
    file.name || "media",
    extension,
    crypto.randomBytes(4).toString("hex"),
  );
  const absolutePath = path.join(MEDIA_ROOT, relativePath);
  await ensureDirectory(absolutePath);
  await fs.writeFile(absolutePath, bytes);

  return prisma.media.create({
    data: {
      url,
      filename,
      mimeType,
      size: bytes.byteLength,
      width,
      height,
      alt: options.alt?.trim() || null,
      folder: options.folder?.trim() || null,
      source: "upload",
    },
  });
}

export interface MediaFilter {
  /** Recherche libre sur le nom de fichier et le texte alternatif. */
  query?: string;
  folder?: string;
  /** Limite le résultat (défaut 200). */
  take?: number;
}

/** Médias de la bibliothèque, les plus récents d'abord. */
export async function listMedia(filter: MediaFilter = {}): Promise<Media[]> {
  const query = filter.query?.trim();
  return prisma.media.findMany({
    where: {
      ...(filter.folder ? { folder: filter.folder } : {}),
      ...(query
        ? {
            OR: [
              { filename: { contains: query, mode: "insensitive" as const } },
              { alt: { contains: query, mode: "insensitive" as const } },
              { url: { contains: query, mode: "insensitive" as const } },
            ],
          }
        : {}),
    },
    orderBy: [{ createdAt: "desc" }],
    take: filter.take ?? 200,
  });
}

/**
 * Met à jour les métadonnées éditables d'un média.
 * Seuls les champs **fournis** sont écrits : un `undefined` laisse la valeur
 * existante intacte (une chaîne vide, elle, efface volontairement).
 */
export async function updateMediaMeta(
  id: string,
  data: { alt?: string; folder?: string },
): Promise<void> {
  await prisma.media.update({
    where: { id },
    data: {
      ...(data.alt !== undefined ? { alt: data.alt.trim() || null } : {}),
      ...(data.folder !== undefined
        ? { folder: data.folder.trim() || null }
        : {}),
    },
  });
}

/**
 * Endroits où une URL de média est référencée. Sert à refuser une suppression
 * qui casserait une page, plutôt que de laisser une image morte s'afficher.
 *
 * À étendre au fur et à mesure que d'autres modèles pointent vers un média
 * (catégories au lot 2, contenus au lot 3, logo/OG au lot 4).
 */
export async function findMediaUsages(url: string): Promise<string[]> {
  const [dishes, seasonal, categories, contenus, identite] = await Promise.all([
    prisma.dish.count({ where: { image: url } }),
    prisma.seasonalProduct.count({ where: { image: url } }),
    prisma.category.count({ where: { image: url } }),
    prisma.contentBlock.count({
      where: { OR: [{ mediaUrl: url }, { posterUrl: url }] },
    }),
    prisma.siteSetting.count({
      where: {
        id: "default",
        OR: [{ logoUrl: url }, { faviconUrl: url }, { ogImageUrl: url }],
      },
    }),
  ]);

  const usages: string[] = [];
  if (dishes > 0) usages.push(`${dishes} plat·s du menu`);
  if (seasonal > 0) usages.push(`${seasonal} produit·s de saison`);
  if (categories > 0) usages.push(`${categories} catégorie·s`);
  if (contenus > 0) usages.push(`${contenus} bloc·s de contenu`);
  if (identite > 0)
    usages.push("l'identité du site (logo, favicon ou partage)");
  return usages;
}

/**
 * Supprime un média téléversé (ligne + fichier). Refuse les médias `template`
 * (livrés par le dépôt : ils reviendraient au déploiement suivant) et ceux
 * encore utilisés quelque part.
 */
export async function deleteMedia(id: string): Promise<void> {
  const media = await prisma.media.findUnique({ where: { id } });
  if (!media) throw new MediaError("Média introuvable.");
  if (media.source === "template") {
    throw new MediaError(
      "Ce média fait partie du modèle du site : il ne peut pas être supprimé " +
        "depuis le CRM (il reviendrait à la prochaine mise à jour).",
    );
  }

  const usages = await findMediaUsages(media.url);
  if (usages.length > 0) {
    throw new MediaError(
      `Média encore utilisé (${usages.join(", ")}). Remplacez-le d'abord.`,
    );
  }

  // Le fichier peut avoir déjà disparu : la ligne part quand même.
  await removeFile(media.url);
  await prisma.media.delete({ where: { id } });
}

/**
 * Remplace le fichier d'un média existant par un nouveau.
 *
 * Le nouveau fichier reçoit une URL neuve (le nom porte un suffixe aléatoire),
 * ce qui est indispensable : les médias sont servis avec un cache `immutable`,
 * donc réécrire le même chemin laisserait les visiteurs sur l'ancienne image
 * pendant un an. On répercute donc l'URL partout où l'ancienne était utilisée —
 * plats, catégories, produits de saison, blocs de contenu, identité du site —
 * en une seule transaction, puis on efface l'ancien fichier.
 *
 * Résultat côté restaurateur : « remplacer la photo » met à jour d'un coup
 * toutes les pages qui l'affichaient, sans avoir à les rouvrir une par une.
 */
export async function replaceMedia(id: string, file: File): Promise<Media> {
  const ancien = await prisma.media.findUnique({ where: { id } });
  if (!ancien) throw new MediaError("Média introuvable.");
  if (ancien.source === "template") {
    throw new MediaError(
      "Ce média fait partie du modèle du site : téléversez-en un nouveau " +
        "plutôt que de le remplacer (il reviendrait à la mise à jour suivante).",
    );
  }

  // On écrit d'abord le nouveau fichier : si le téléversement échoue, rien
  // n'a bougé et l'ancienne image continue de s'afficher.
  const nouveau = await storeUpload(file, {
    alt: ancien.alt,
    folder: ancien.folder,
  });

  await prisma.$transaction([
    prisma.dish.updateMany({
      where: { image: ancien.url },
      data: { image: nouveau.url },
    }),
    prisma.category.updateMany({
      where: { image: ancien.url },
      data: { image: nouveau.url },
    }),
    prisma.seasonalProduct.updateMany({
      where: { image: ancien.url },
      data: { image: nouveau.url },
    }),
    prisma.contentBlock.updateMany({
      where: { mediaUrl: ancien.url },
      data: { mediaUrl: nouveau.url },
    }),
    prisma.contentBlock.updateMany({
      where: { posterUrl: ancien.url },
      data: { posterUrl: nouveau.url },
    }),
    prisma.siteSetting.updateMany({
      where: { logoUrl: ancien.url },
      data: { logoUrl: nouveau.url },
    }),
    prisma.siteSetting.updateMany({
      where: { faviconUrl: ancien.url },
      data: { faviconUrl: nouveau.url },
    }),
    prisma.siteSetting.updateMany({
      where: { ogImageUrl: ancien.url },
      data: { ogImageUrl: nouveau.url },
    }),
    prisma.media.delete({ where: { id } }),
  ]);

  await removeFile(ancien.url);
  return nouveau;
}

/** Efface le fichier d'un média téléversé (silencieux s'il a déjà disparu). */
async function removeFile(url: string): Promise<void> {
  const relativePath = resolveMediaSegments(
    url.replace(/^\/media\//, "").split("/"),
  );
  if (!relativePath) return;
  await fs.unlink(path.join(MEDIA_ROOT, relativePath)).catch(() => undefined);
}

/** Chemin absolu d'un média téléversé, ou `null` si le chemin est refusé. */
export function resolveUploadPath(segments: string[]): string | null {
  const relativePath = resolveMediaSegments(segments);
  if (!relativePath) return null;
  const absolutePath = path.resolve(MEDIA_ROOT, relativePath);
  // Défense en profondeur : le chemin résolu doit rester sous la racine.
  if (
    absolutePath !== MEDIA_ROOT &&
    !absolutePath.startsWith(MEDIA_ROOT + path.sep)
  ) {
    return null;
  }
  return absolutePath;
}
