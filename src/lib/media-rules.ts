/**
 * Règles de la médiathèque — pur / testable (pas de `server-only`, pas de DB,
 * pas de `fs`). C'est ici que vit toute la validation d'un téléversement : le
 * module serveur `src/lib/media.ts` ne fait qu'appliquer ces décisions.
 *
 * Principe : **rien de ce que le navigateur envoie n'est cru sur parole**.
 * Le type est déduit des octets du fichier (et non de l'extension ni du
 * `Content-Type` déclaré), et le nom de fichier final est régénéré côté serveur.
 */

/**
 * Images acceptées en ENTRÉE.
 *
 * La liste est large parce qu'elles ne sont jamais servies telles quelles :
 * `storeUpload` les fait toutes passer par sharp, qui les **réencode en WebP**.
 * Le fichier déposé par le restaurateur n'atteint donc jamais le navigateur —
 * y compris un SVG piégé, qui ressort rasterisé, sans le moindre script.
 *
 * En pratique cela couvre ce qui sort d'un téléphone ou d'un appareil photo :
 * HEIC (format par défaut des iPhone), JPEG, PNG, WebP, AVIF, GIF, TIFF, SVG.
 */
export const IMAGE_MIME_WHITELIST: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
  "image/heic": "heic",
  "image/heif": "heif",
  "image/gif": "gif",
  "image/tiff": "tiff",
  "image/bmp": "bmp",
  "image/svg+xml": "svg",
};

/**
 * Vidéos acceptées. Elles, en revanche, sont stockées **telles quelles** (pas
 * de réencodage) : la liste reste donc volontairement courte et limitée aux
 * conteneurs que tous les navigateurs savent lire.
 */
export const VIDEO_MIME_WHITELIST: Record<string, string> = {
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
};

/** Types acceptés → extension canonique du fichier écrit sur disque. */
export const MEDIA_MIME_WHITELIST: Record<string, string> = {
  ...IMAGE_MIME_WHITELIST,
  ...VIDEO_MIME_WHITELIST,
};

export const REJECTED_MIME_HINT =
  "Format non reconnu. Photos : JPEG, PNG, HEIC, WebP, AVIF, GIF, TIFF, BMP ou SVG. Vidéos : MP4, WebM ou MOV.";

/** Taille maximale d'UN fichier (8 Mio). */
export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

/**
 * Taille maximale d'UNE requête d'envoi, tous fichiers confondus.
 *
 * Next tronque silencieusement les corps de requête au-delà de 10 Mio (option
 * `proxyClientMaxBodySize`, appliquée à TOUTES les routes) : le multipart
 * devient alors illisible et l'admin reçoit une erreur incompréhensible. On
 * reste donc volontairement sous ce seuil plutôt que de relever la limite
 * globale, qui protège aussi les routes publiques. Un envoi de 10 photos n'est
 * pas perdu pour autant : le client les répartit en plusieurs requêtes via
 * `planUploadBatches`.
 */
export const MAX_REQUEST_BYTES = 9 * 1024 * 1024;

/**
 * Nombre maximal de fichiers par requête. La garde de volume ne suffit pas :
 * 500 vignettes de 10 Ko tiennent sous `MAX_REQUEST_BYTES` mais monopoliseraient
 * le serveur (une passe `sharp` par fichier).
 */
export const MAX_FILES_PER_REQUEST = 20;

/** Marge d'enrobage multipart (frontières, en-têtes) réservée par fichier. */
const MULTIPART_OVERHEAD_PER_FILE = 512;

export interface UploadBatchPlan {
  /** Indices des fichiers, groupés en requêtes tenant sous la limite. */
  batches: number[][];
  /** Indices des fichiers refusés d'emblée (trop lourds à eux seuls). */
  tooLarge: number[];
}

/**
 * Répartit des fichiers en requêtes respectant les deux plafonds : un fichier
 * trop lourd est écarté (il ne passera jamais), les autres sont groupés pour
 * qu'aucune requête ne dépasse `MAX_REQUEST_BYTES`.
 *
 * Pur et testable : c'est la même règle des deux côtés — le client s'en sert
 * pour découper, le serveur pour refuser proprement.
 */
export function planUploadBatches(
  sizes: number[],
  maxPerFile: number = MAX_UPLOAD_BYTES,
  maxPerRequest: number = MAX_REQUEST_BYTES,
): UploadBatchPlan {
  const batches: number[][] = [];
  const tooLarge: number[] = [];
  let current: number[] = [];
  let currentBytes = 0;

  sizes.forEach((size, index) => {
    if (size > maxPerFile) {
      tooLarge.push(index);
      return;
    }
    const cost = size + MULTIPART_OVERHEAD_PER_FILE;
    const plein =
      currentBytes + cost > maxPerRequest ||
      current.length >= MAX_FILES_PER_REQUEST;
    if (current.length > 0 && plein) {
      batches.push(current);
      current = [];
      currentBytes = 0;
    }
    current.push(index);
    currentBytes += cost;
  });

  if (current.length > 0) batches.push(current);
  return { batches, tooLarge };
}

/** Nombre d'octets à lire pour identifier un format (les en-têtes suffisent). */
export const SNIFF_BYTES = 64;

/** Vrai si le type détecté est une image (donc réencodée en WebP à l'entrée). */
export function isImageMime(mimeType: string): boolean {
  return mimeType in IMAGE_MIME_WHITELIST;
}

function startsWith(bytes: Uint8Array, signature: readonly number[]): boolean {
  if (bytes.length < signature.length) return false;
  return signature.every((byte, i) => bytes[i] === byte);
}

/** Compare une zone d'octets à une chaîne ASCII (ex. « WEBP » en position 8). */
function matchesAscii(
  bytes: Uint8Array,
  offset: number,
  ascii: string,
): boolean {
  if (bytes.length < offset + ascii.length) return false;
  for (let i = 0; i < ascii.length; i++) {
    if (bytes[offset + i] !== ascii.charCodeAt(i)) return false;
  }
  return true;
}

/**
 * Déduit le type MIME des octets d'en-tête (« magic bytes »).
 * Renvoie `null` si le format n'est pas reconnu — donc refusé.
 */
export function sniffMimeType(bytes: Uint8Array): string | null {
  // JPEG : FF D8 FF
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) return "image/jpeg";
  // PNG : 89 50 4E 47 0D 0A 1A 0A
  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) {
    return "image/png";
  }
  // GIF : « GIF87a » ou « GIF89a »
  if (matchesAscii(bytes, 0, "GIF8")) return "image/gif";
  // BMP : « BM »
  if (matchesAscii(bytes, 0, "BM")) return "image/bmp";
  // TIFF : « II* » (petit-boutiste) ou « MM* » (gros-boutiste)
  if (
    startsWith(bytes, [0x49, 0x49, 0x2a, 0x00]) ||
    startsWith(bytes, [0x4d, 0x4d, 0x00, 0x2a])
  ) {
    return "image/tiff";
  }
  // Conteneur RIFF : « RIFF » … « WEBP »
  if (matchesAscii(bytes, 0, "RIFF") && matchesAscii(bytes, 8, "WEBP")) {
    return "image/webp";
  }
  // WebM / Matroska : en-tête EBML 1A 45 DF A3
  if (startsWith(bytes, [0x1a, 0x45, 0xdf, 0xa3])) return "video/webm";
  // Conteneur ISO-BMFF : taille (4 o) puis « ftyp » puis la marque.
  if (matchesAscii(bytes, 4, "ftyp")) {
    if (matchesAscii(bytes, 8, "avif") || matchesAscii(bytes, 8, "avis")) {
      return "image/avif";
    }
    // Photos iPhone : heic / heix / hevc / mif1 / msf1.
    for (const marque of ["heic", "heix", "hevc", "hevx", "mif1", "msf1"]) {
      if (matchesAscii(bytes, 8, marque)) return "image/heic";
    }
    if (matchesAscii(bytes, 8, "qt  ")) return "video/quicktime";
    return "video/mp4";
  }
  // SVG : document XML. Accepté car rasterisé à l'entrée (voir la whitelist).
  if (looksLikeSvg(bytes)) return "image/svg+xml";
  return null;
}

/**
 * Détecte un SVG dans les premiers octets : soit la balise `<svg`, soit un
 * prologue XML/commentaire qui la précède. Volontairement tolérant — la sûreté
 * ne vient pas d'ici mais du réencodage en WebP.
 */
function looksLikeSvg(bytes: Uint8Array): boolean {
  const debut = new TextDecoder("utf-8", { fatal: false })
    .decode(bytes.subarray(0, SNIFF_BYTES))
    .trimStart()
    .toLowerCase();
  return (
    debut.startsWith("<svg") ||
    debut.startsWith("<?xml") ||
    debut.startsWith("<!doctype svg")
  );
}

/** Extension canonique d'un type accepté, ou `null` si le type est refusé. */
export function extensionForMime(mimeType: string): string | null {
  return MEDIA_MIME_WHITELIST[mimeType] ?? null;
}

/**
 * Base de nom de fichier sûre, dérivée du nom d'origine : accents aplatis,
 * minuscules, seuls `[a-z0-9-]` conservés, longueur bornée.
 *
 * Toute notion de chemin disparaît (`/`, `\`, `..`, `%2e%2e`…) : le résultat ne
 * peut pas s'échapper du dossier de destination.
 */
export function safeMediaSlug(originalName: string): string {
  const withoutExtension = originalName.replace(/\.[^.]+$/, "");
  const slug = withoutExtension
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60)
    .replace(/-$/, "");
  return slug || "media";
}

/**
 * Chemin de stockage d'un média : `AAAA/MM/<slug>-<suffixe>.<ext>`.
 * Le suffixe aléatoire est fourni par l'appelant (le serveur) pour rester pur
 * et testable ; il garantit qu'aucun téléversement n'en écrase un autre.
 */
export function buildMediaPath(
  date: Date,
  originalName: string,
  extension: string,
  suffix: string,
): { relativePath: string; filename: string; url: string } {
  const year = String(date.getFullYear());
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const filename = `${safeMediaSlug(originalName)}-${suffix}.${extension}`;
  const relativePath = `${year}/${month}/${filename}`;
  return { relativePath, filename, url: `/media/${relativePath}` };
}

/**
 * N'accepte qu'un chemin de média **interne** : les uploads (`/media/…`) et les
 * fichiers livrés avec le dépôt (`/images/…`, `/videos/…`). Empêche qu'un champ
 * « image » du CRM pointe vers `javascript:`, `data:` ou un domaine tiers.
 */
export function isSafeMediaUrl(url: string): boolean {
  if (!/^\/(media|images|videos)\//.test(url)) return false;
  if (url.includes("..") || url.includes("//") || url.includes("\\")) {
    return false;
  }
  return true;
}

/**
 * Segments d'URL demandés à la route `/media/[...path]` → chemin relatif sûr.
 * Renvoie `null` si un segment tente de remonter l'arborescence ou contient un
 * caractère inattendu (défense en profondeur, avant même le contrôle `fs`).
 */
export function resolveMediaSegments(segments: string[]): string | null {
  if (segments.length === 0 || segments.length > 4) return null;
  for (const segment of segments) {
    if (!segment || segment === "." || segment === "..") return null;
    if (!/^[a-zA-Z0-9._-]+$/.test(segment)) return null;
  }
  return segments.join("/");
}

/**
 * Types réellement SERVIS par `/media/[...path]`.
 *
 * Volontairement distinct de la liste d'entrée : `storeUpload` réencode toutes
 * les images en WebP, donc seuls ces formats sont un jour écrits sur disque.
 * Surtout, `image/svg+xml` en est ABSENT — aucun fichier servi depuis notre
 * origine ne doit pouvoir être interprété comme un document scriptable, même
 * si un `.svg` se retrouvait dans le dossier par un autre chemin.
 */
const SERVED_MIME_BY_EXTENSION: Record<string, string> = {
  webp: "image/webp",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  avif: "image/avif",
  mp4: "video/mp4",
  webm: "video/webm",
  mov: "video/quicktime",
};

/** Type MIME renvoyé par la route de service, déduit de l'extension écrite. */
export function contentTypeForPath(path: string): string {
  const extension = path.slice(path.lastIndexOf(".") + 1).toLowerCase();
  return SERVED_MIME_BY_EXTENSION[extension] ?? "application/octet-stream";
}

export interface UploadRejection {
  reason: "empty" | "too-large" | "unsupported";
  message: string;
}

/**
 * Décision d'acceptation d'un téléversement, à partir de sa taille et de ses
 * premiers octets. Renvoie le type MIME retenu ou le motif de refus.
 */
export function checkUpload(
  size: number,
  header: Uint8Array,
): { ok: true; mimeType: string; extension: string } | UploadRejection {
  if (size <= 0) {
    return { reason: "empty", message: "Fichier vide." };
  }
  if (size > MAX_UPLOAD_BYTES) {
    return {
      reason: "too-large",
      message: `Fichier trop lourd (max ${Math.round(
        MAX_UPLOAD_BYTES / (1024 * 1024),
      )} Mo).`,
    };
  }
  const mimeType = sniffMimeType(header);
  const extension = mimeType ? extensionForMime(mimeType) : null;
  if (!mimeType || !extension) {
    return { reason: "unsupported", message: REJECTED_MIME_HINT };
  }
  return { ok: true, mimeType, extension };
}
