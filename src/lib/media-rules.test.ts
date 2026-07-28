import { describe, expect, it } from "vitest";
import {
  MAX_FILES_PER_REQUEST,
  MAX_REQUEST_BYTES,
  MAX_UPLOAD_BYTES,
  buildMediaPath,
  checkUpload,
  contentTypeForPath,
  extensionForMime,
  isSafeMediaUrl,
  planUploadBatches,
  resolveMediaSegments,
  safeMediaSlug,
  sniffMimeType,
} from "./media-rules";

const MO = 1024 * 1024;

/** Fabrique un en-tête d'octets à partir d'une liste (complétée de zéros). */
function header(...bytes: number[]): Uint8Array {
  const out = new Uint8Array(32);
  out.set(bytes);
  return out;
}

/** En-tête d'un conteneur ISO-BMFF : 4 octets de taille, « ftyp », la marque. */
function isoHeader(brand: string): Uint8Array {
  const out = new Uint8Array(32);
  out.set([0, 0, 0, 0x20]);
  for (let i = 0; i < 4; i++) out[4 + i] = "ftyp".charCodeAt(i);
  for (let i = 0; i < brand.length; i++) out[8 + i] = brand.charCodeAt(i);
  return out;
}

describe("sniffMimeType", () => {
  it("reconnaît un JPEG à ses octets d'en-tête", () => {
    expect(sniffMimeType(header(0xff, 0xd8, 0xff, 0xe0))).toBe("image/jpeg");
  });

  it("reconnaît un PNG", () => {
    expect(
      sniffMimeType(header(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)),
    ).toBe("image/png");
  });

  it("reconnaît un WebP (conteneur RIFF)", () => {
    const bytes = new Uint8Array(32);
    for (let i = 0; i < 4; i++) bytes[i] = "RIFF".charCodeAt(i);
    for (let i = 0; i < 4; i++) bytes[8 + i] = "WEBP".charCodeAt(i);
    expect(sniffMimeType(bytes)).toBe("image/webp");
  });

  it("distingue AVIF et MP4 dans un conteneur ISO-BMFF", () => {
    expect(sniffMimeType(isoHeader("avif"))).toBe("image/avif");
    expect(sniffMimeType(isoHeader("isom"))).toBe("video/mp4");
  });

  it("reconnaît les formats de téléphone et bureautiques", () => {
    // GIF
    expect(sniffMimeType(new TextEncoder().encode("GIF89a....."))).toBe(
      "image/gif",
    );
    // BMP
    expect(sniffMimeType(new TextEncoder().encode("BM......."))).toBe(
      "image/bmp",
    );
    // TIFF, dans les deux boutismes
    expect(sniffMimeType(header(0x49, 0x49, 0x2a, 0x00))).toBe("image/tiff");
    expect(sniffMimeType(header(0x4d, 0x4d, 0x00, 0x2a))).toBe("image/tiff");
    // HEIC : format par défaut des photos iPhone
    expect(sniffMimeType(isoHeader("heic"))).toBe("image/heic");
    expect(sniffMimeType(isoHeader("mif1"))).toBe("image/heic");
    // WebM
    expect(sniffMimeType(header(0x1a, 0x45, 0xdf, 0xa3))).toBe("video/webm");
    // QuickTime / MOV
    expect(sniffMimeType(isoHeader("qt  "))).toBe("video/quicktime");
  });

  it("accepte le SVG — il sera rasterisé, donc inoffensif", () => {
    const svg = new TextEncoder().encode(
      '<svg xmlns="http://www.w3.org/2000/svg">',
    );
    expect(sniffMimeType(svg)).toBe("image/svg+xml");
  });

  it("refuse un fichier vide ou tronqué", () => {
    expect(sniffMimeType(new Uint8Array(0))).toBeNull();
    expect(sniffMimeType(new Uint8Array([0xff, 0xd8]))).toBeNull();
  });
});

describe("checkUpload", () => {
  it("accepte une image valide et renvoie son extension canonique", () => {
    const result = checkUpload(1024, header(0xff, 0xd8, 0xff));
    expect(result).toEqual({
      ok: true,
      mimeType: "image/jpeg",
      extension: "jpg",
    });
  });

  it("refuse un fichier vide", () => {
    expect(checkUpload(0, header(0xff, 0xd8, 0xff))).toMatchObject({
      reason: "empty",
    });
  });

  it("refuse un fichier au-delà de la taille maximale", () => {
    expect(
      checkUpload(MAX_UPLOAD_BYTES + 1, header(0xff, 0xd8, 0xff)),
    ).toMatchObject({ reason: "too-large" });
  });

  it("refuse un format non reconnu quelle que soit la taille annoncée", () => {
    expect(checkUpload(500, header(0x00, 0x01, 0x02))).toMatchObject({
      reason: "unsupported",
    });
  });
});

describe("planUploadBatches", () => {
  it("envoie en une seule requête ce qui tient sous la limite", () => {
    const plan = planUploadBatches([2 * MO, 3 * MO]);
    expect(plan.batches).toEqual([[0, 1]]);
    expect(plan.tooLarge).toEqual([]);
  });

  it("répartit un lot de photos de téléphone en plusieurs requêtes", () => {
    // 10 × 4 Mo = 40 Mo : un envoi unique serait tronqué par Next.
    const plan = planUploadBatches(Array.from({ length: 10 }, () => 4 * MO));
    expect(plan.batches.length).toBeGreaterThan(1);
    expect(plan.batches.flat()).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    for (const batch of plan.batches) {
      const total = batch.reduce((sum) => sum + 4 * MO, 0);
      expect(total).toBeLessThanOrEqual(MAX_REQUEST_BYTES);
    }
  });

  it("écarte les fichiers trop lourds sans bloquer les autres", () => {
    const plan = planUploadBatches([1 * MO, MAX_UPLOAD_BYTES + 1, 2 * MO]);
    expect(plan.tooLarge).toEqual([1]);
    expect(plan.batches.flat()).toEqual([0, 2]);
  });

  it("n'invente pas de requête vide quand tout est refusé", () => {
    const plan = planUploadBatches([20 * MO, 30 * MO]);
    expect(plan.batches).toEqual([]);
    expect(plan.tooLarge).toEqual([0, 1]);
  });

  it("isole un fichier qui remplit à lui seul une requête", () => {
    const plan = planUploadBatches([8 * MO, 8 * MO]);
    expect(plan.batches).toEqual([[0], [1]]);
  });

  it("accepte une liste vide", () => {
    expect(planUploadBatches([])).toEqual({ batches: [], tooLarge: [] });
  });

  it("borne aussi le NOMBRE de fichiers par requête", () => {
    // 50 vignettes de 10 Ko tiennent largement sous la limite de volume :
    // sans plafond de comptage, le serveur en écarterait en silence.
    const plan = planUploadBatches(Array.from({ length: 50 }, () => 10 * 1024));
    expect(plan.batches.length).toBe(3);
    for (const batch of plan.batches) {
      expect(batch.length).toBeLessThanOrEqual(MAX_FILES_PER_REQUEST);
    }
    expect(plan.batches.flat()).toHaveLength(50);
  });
});

describe("safeMediaSlug", () => {
  it("aplatit les accents et normalise la casse", () => {
    expect(safeMediaSlug("Thiéboudiène Poisson.JPG")).toBe(
      "thieboudiene-poisson",
    );
  });

  it("neutralise toute tentative de chemin", () => {
    for (const attack of [
      "../../etc/passwd",
      "..%2f..%2fshadow.png",
      "C:\\Windows\\system32",
      "/etc/hosts",
      "....//....//secret.png",
    ]) {
      expect(safeMediaSlug(attack)).toMatch(/^[a-z0-9-]+$/);
    }
    expect(safeMediaSlug("C:\\Windows\\system32")).toBe("c-windows-system32");
  });

  it("borne la longueur et ne finit jamais par un tiret", () => {
    const slug = safeMediaSlug("a".repeat(200));
    expect(slug).toHaveLength(60);
    expect(slug.endsWith("-")).toBe(false);
  });

  it("retombe sur « media » quand il ne reste rien d'exploitable", () => {
    expect(safeMediaSlug("!!!.png")).toBe("media");
    expect(safeMediaSlug("")).toBe("media");
  });
});

describe("buildMediaPath", () => {
  it("range le fichier par année/mois et suffixe le nom", () => {
    const result = buildMediaPath(
      new Date(2026, 6, 28),
      "Yassa Poulet.jpeg",
      "webp",
      "a1b2c3",
    );
    expect(result).toEqual({
      relativePath: "2026/07/yassa-poulet-a1b2c3.webp",
      filename: "yassa-poulet-a1b2c3.webp",
      url: "/media/2026/07/yassa-poulet-a1b2c3.webp",
    });
  });

  it("produit toujours une URL interne sûre", () => {
    const { url } = buildMediaPath(
      new Date(2026, 0, 5),
      "../../evil",
      "png",
      "zz",
    );
    expect(isSafeMediaUrl(url)).toBe(true);
  });
});

describe("isSafeMediaUrl", () => {
  it("accepte les médias internes", () => {
    expect(isSafeMediaUrl("/media/2026/07/plat-a1.webp")).toBe(true);
    expect(isSafeMediaUrl("/images/africain/yassa-poulet.webp")).toBe(true);
    expect(isSafeMediaUrl("/videos/hero-grillades-animees.mp4")).toBe(true);
  });

  it("refuse les schémas dangereux et les domaines tiers", () => {
    expect(isSafeMediaUrl("javascript:alert(1)")).toBe(false);
    expect(isSafeMediaUrl("data:image/svg+xml;base64,PHN2Zz4=")).toBe(false);
    expect(isSafeMediaUrl("https://exemple.test/photo.png")).toBe(false);
    expect(isSafeMediaUrl("//exemple.test/photo.png")).toBe(false);
  });

  it("refuse la remontée d'arborescence", () => {
    expect(isSafeMediaUrl("/media/../../.env")).toBe(false);
  });
});

describe("resolveMediaSegments", () => {
  it("reconstitue un chemin relatif à partir des segments d'URL", () => {
    expect(resolveMediaSegments(["2026", "07", "plat-a1.webp"])).toBe(
      "2026/07/plat-a1.webp",
    );
  });

  it("refuse toute remontée ou caractère inattendu", () => {
    expect(resolveMediaSegments([".."])).toBeNull();
    expect(resolveMediaSegments(["2026", "..", ".env"])).toBeNull();
    expect(resolveMediaSegments(["2026", "07", "pl at.webp"])).toBeNull();
    expect(resolveMediaSegments([])).toBeNull();
  });
});

describe("contentTypeForPath / extensionForMime", () => {
  it("fait l'aller-retour entre extension et type MIME", () => {
    expect(extensionForMime("image/webp")).toBe("webp");
    expect(contentTypeForPath("2026/07/plat.webp")).toBe("image/webp");
    expect(contentTypeForPath("2026/07/clip.mp4")).toBe("video/mp4");
  });

  it("accepte le SVG en ENTRÉE (il sera converti en WebP)", () => {
    expect(extensionForMime("image/svg+xml")).toBe("svg");
  });

  it("ne SERT jamais un SVG, même si le fichier existait", () => {
    // Défense en profondeur : rien servi depuis notre origine ne doit pouvoir
    // être interprété comme un document scriptable.
    expect(contentTypeForPath("plat.svg")).toBe("application/octet-stream");
    expect(contentTypeForPath("plat.html")).toBe("application/octet-stream");
    expect(contentTypeForPath("plat.heic")).toBe("application/octet-stream");
  });

  it("sert les formats réellement écrits sur disque", () => {
    expect(contentTypeForPath("2026/07/plat.webp")).toBe("image/webp");
    expect(contentTypeForPath("2026/07/clip.mp4")).toBe("video/mp4");
    expect(contentTypeForPath("2026/07/clip.webm")).toBe("video/webm");
    expect(contentTypeForPath("2026/07/clip.mov")).toBe("video/quicktime");
  });

  it("refuse un type inconnu", () => {
    expect(extensionForMime("application/pdf")).toBeNull();
  });
});
