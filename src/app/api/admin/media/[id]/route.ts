import { NextResponse } from "next/server";
import { isAdminSession } from "@/lib/session";
import {
  MediaError,
  deleteMedia,
  replaceMedia,
  updateMediaMeta,
} from "@/lib/media";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { MAX_REQUEST_BYTES } from "@/lib/media-rules";

export const dynamic = "force-dynamic";

/**
 * Réponse de refus — construite à CHAQUE appel, jamais partagée : le corps
 * d'une `Response` est un flux à usage unique. Un objet réutilisé partirait
 * sans corps dès la deuxième requête refusée du process.
 */
function denied(): NextResponse {
  return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
}

/** PATCH /api/admin/media/[id] — met à jour le texte alternatif / le dossier. */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminSession())) return denied();

  const { id } = await params;
  const body = (await request.json().catch(() => null)) as {
    alt?: string;
    folder?: string;
  } | null;
  if (!body) {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  try {
    await updateMediaMeta(id, {
      alt: typeof body.alt === "string" ? body.alt.slice(0, 300) : undefined,
      folder:
        typeof body.folder === "string" ? body.folder.slice(0, 60) : undefined,
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Média introuvable." }, { status: 404 });
  }
}

/**
 * PUT /api/admin/media/[id] — remplace le fichier d'un média (champ `file`).
 *
 * L'URL change (cache immuable oblige) mais toutes les références sont
 * répercutées : les pages qui affichaient l'ancienne image montrent la nouvelle
 * sans que le restaurateur ait à les rouvrir.
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminSession())) return denied();

  const ip = await clientIp();
  if (!(await rateLimit(`media-replace:${ip}`, 30, 60_000))) {
    return NextResponse.json(
      { error: "Trop de remplacements. Réessayez dans une minute." },
      { status: 429 },
    );
  }

  const declaredLength = Number(request.headers.get("content-length") ?? 0);
  if (declaredLength > MAX_REQUEST_BYTES) {
    return NextResponse.json(
      { error: "Fichier trop volumineux." },
      { status: 413 },
    );
  }

  const { id } = await params;
  const formData = await request.formData().catch(() => null);
  const file = formData?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Aucun fichier reçu." }, { status: 400 });
  }

  try {
    return NextResponse.json({ media: await replaceMedia(id, file) });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof MediaError
            ? error.message
            : "Remplacement impossible.",
      },
      { status: 400 },
    );
  }
}

/** DELETE /api/admin/media/[id] — supprime un média téléversé. */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminSession())) return denied();

  const { id } = await params;
  try {
    await deleteMedia(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof MediaError
            ? error.message
            : "Suppression impossible.",
      },
      { status: 400 },
    );
  }
}
