import { listMedia } from "@/lib/media";
import { MediaLibrary } from "@/components/admin/MediaLibrary";

export const dynamic = "force-dynamic";

/**
 * Médiathèque du CRM : point d'entrée unique pour les photos et vidéos du site.
 * Les médias téléversés ici sont ensuite choisissables partout où une image est
 * attendue (menu, contenus, identité) via le `MediaPicker`.
 */
export default async function AdminMediasPage() {
  const media = await listMedia();
  const uploaded = media.filter((m) => m.source === "upload").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-cream">
          Médiathèque
        </h1>
        <p className="mt-1 text-sm text-muted">
          {media.length} média·s · {uploaded} téléversé·s depuis le CRM. Les
          médias marqués « modèle » sont livrés avec le site.
        </p>
      </div>

      <MediaLibrary initialMedia={media} />
    </div>
  );
}
