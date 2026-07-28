import { NextResponse } from "next/server";
import { isAdminSession } from "@/lib/session";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { MediaError, listMedia, storeUpload } from "@/lib/media";
import {
  MAX_FILES_PER_REQUEST,
  MAX_REQUEST_BYTES,
  MAX_UPLOAD_BYTES,
} from "@/lib/media-rules";

export const dynamic = "force-dynamic";

/**
 * Réponse de refus — construite à CHAQUE appel, jamais partagée : le corps
 * d'une `Response` est un flux à usage unique, un objet réutilisé serait vide
 * (voire en erreur) dès la deuxième requête refusée.
 */
function denied(): NextResponse {
  return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
}

/** GET /api/admin/media — liste la médiathèque (recherche facultative). */
export async function GET(request: Request) {
  if (!(await isAdminSession())) return denied();

  const { searchParams } = new URL(request.url);
  const media = await listMedia({
    query: searchParams.get("q") ?? undefined,
    folder: searchParams.get("folder") ?? undefined,
  });
  return NextResponse.json({ media });
}

/**
 * POST /api/admin/media — téléverse un ou plusieurs fichiers (champ `files`).
 *
 * Route plutôt que Server Action : le téléversement multiple avec retour
 * d'erreur fichier par fichier se prête mal au cycle `redirect` des actions.
 * Chaque fichier est validé par ses octets (voir `src/lib/media-rules.ts`).
 */
export async function POST(request: Request) {
  if (!(await isAdminSession())) return denied();

  const ip = await clientIp();
  if (!(await rateLimit(`media-upload:${ip}`, 30, 60_000))) {
    return NextResponse.json(
      { error: "Trop de téléversements. Réessayez dans une minute." },
      { status: 429 },
    );
  }

  // Garde AVANT lecture du corps : au-delà de ~10 Mio, Next tronque la requête
  // et le multipart devient illisible — l'admin verrait « Requête invalide »
  // sans comprendre. On refuse donc explicitement, avec le bon message.
  const declaredLength = Number(request.headers.get("content-length") ?? 0);
  if (declaredLength > MAX_REQUEST_BYTES) {
    return NextResponse.json(
      {
        error: `Envoi trop volumineux (${Math.round(
          declaredLength / (1024 * 1024),
        )} Mo). Chaque photo est limitée à ${Math.round(
          MAX_UPLOAD_BYTES / (1024 * 1024),
        )} Mo — envoyez-en moins à la fois.`,
      },
      { status: 413 },
    );
  }

  const formData = await request.formData().catch(() => null);
  if (!formData) {
    return NextResponse.json(
      { error: "Fichiers illisibles. Réessayez avec moins de photos." },
      { status: 400 },
    );
  }

  const files = formData
    .getAll("files")
    .filter((entry): entry is File => entry instanceof File);
  if (files.length === 0) {
    return NextResponse.json({ error: "Aucun fichier reçu." }, { status: 400 });
  }

  const alt = String(formData.get("alt") ?? "") || null;
  const folder = String(formData.get("folder") ?? "") || null;

  const created = [];
  const errors: { filename: string; message: string }[] = [];

  // Plafond de sécurité sur le NOMBRE de fichiers (la garde Content-Length ne
  // borne que le volume : 500 vignettes minuscules passeraient). Les fichiers
  // au-delà sont signalés, jamais ignorés en silence.
  for (const file of files.slice(MAX_FILES_PER_REQUEST)) {
    errors.push({
      filename: file.name || "fichier",
      message: `Non traité : ${MAX_FILES_PER_REQUEST} fichiers maximum par envoi.`,
    });
  }

  for (const file of files.slice(0, MAX_FILES_PER_REQUEST)) {
    try {
      created.push(await storeUpload(file, { alt, folder }));
    } catch (error) {
      errors.push({
        filename: file.name || "fichier",
        message:
          error instanceof MediaError
            ? error.message
            : "Téléversement impossible.",
      });
    }
  }

  return NextResponse.json(
    { media: created, errors },
    { status: created.length > 0 ? 201 : 400 },
  );
}
