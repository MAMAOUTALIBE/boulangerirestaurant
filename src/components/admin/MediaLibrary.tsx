"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  Check,
  Copy,
  Loader2,
  Lock,
  RefreshCw,
  Search,
  Trash2,
  UploadCloud,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MAX_UPLOAD_BYTES, planUploadBatches } from "@/lib/media-rules";

/** Plafond par photo, exprimé en Mo pour les messages d'interface. */
const MAX_UPLOAD_MO = Math.round(MAX_UPLOAD_BYTES / (1024 * 1024));

/** Formats proposés dans le sélecteur de fichiers du navigateur. */
const ACCEPT_UPLOAD =
  "image/*,.heic,.heif,video/mp4,video/webm,video/quicktime";

export interface MediaItem {
  id: string;
  url: string;
  filename: string;
  mimeType: string;
  size: number;
  width: number | null;
  height: number | null;
  alt: string | null;
  folder: string | null;
  source: string;
}

interface MediaLibraryProps {
  initialMedia: MediaItem[];
  /** Mode sélecteur : un clic sur une vignette renvoie l'URL au lieu d'éditer. */
  onSelect?: (media: MediaItem) => void;
  /** URL actuellement sélectionnée (surlignée dans la grille). */
  selectedUrl?: string | null;
  /** Masque l'édition du texte alternatif et la suppression (mode sélecteur). */
  compact?: boolean;
  /** Restreint la sélection et le téléversement aux images. */
  allowedKind?: "all" | "image";
}

/** Poids lisible d'un fichier (Ko / Mo). */
function formatSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
  return `${Math.max(1, Math.round(bytes / 1024))} Ko`;
}

/**
 * Médiathèque du CRM : téléversement (glisser-déposer ou sélection), recherche,
 * texte alternatif et suppression. Réutilisée telle quelle dans la modale du
 * `MediaPicker`, en mode `compact`.
 */
export function MediaLibrary({
  initialMedia,
  onSelect,
  selectedUrl,
  compact = false,
  allowedKind = "all",
}: MediaLibraryProps) {
  const [media, setMedia] = useState<MediaItem[]>(initialMedia);
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const visibleMedia =
    allowedKind === "image"
      ? media.filter((item) => item.mimeType.startsWith("image/"))
      : media;

  const refresh = useCallback(async (search: string) => {
    const response = await fetch(
      `/api/admin/media?q=${encodeURIComponent(search)}`,
      { cache: "no-store" },
    );
    if (!response.ok) return;
    const data = (await response.json()) as { media: MediaItem[] };
    setMedia(data.media);
  }, []);

  // Recherche différée : évite une requête par frappe.
  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void refresh(query);
    }, 250);
    return () => window.clearTimeout(timeout);
  }, [query, refresh]);

  const upload = useCallback(
    async (files: FileList | File[]) => {
      const list = Array.from(files).filter(
        (file) => allowedKind === "all" || file.type.startsWith("image/"),
      );
      if (list.length === 0) return;

      setBusy(true);
      setError(null);
      setMessage(null);

      // Un envoi unique dépasserait la limite de corps de requête dès quelques
      // photos de téléphone : on répartit en plusieurs requêtes, transparent pour
      // l'utilisateur qui a simplement déposé ses 10 photos d'un coup.
      const { batches, tooLarge } = planUploadBatches(list.map((f) => f.size));
      const added: MediaItem[] = [];
      const failures = tooLarge.map((index) => ({
        filename: list[index].name || "fichier",
        message: `Photo trop lourde (max ${MAX_UPLOAD_MO} Mo).`,
      }));

      for (const batch of batches) {
        const formData = new FormData();
        for (const index of batch) formData.append("files", list[index]);

        const response = await fetch("/api/admin/media", {
          method: "POST",
          body: formData,
        }).catch(() => null);

        if (!response) {
          failures.push({
            filename: `${batch.length} fichier·s`,
            message: "envoi interrompu, vérifiez votre connexion",
          });
          continue;
        }

        const data = (await response.json().catch(() => null)) as {
          media?: MediaItem[];
          errors?: { filename: string; message: string }[];
          error?: string;
        } | null;

        if (data?.media?.length) added.push(...data.media);
        if (data?.errors?.length) failures.push(...data.errors);
        else if (!data?.media?.length) {
          failures.push({
            filename: `${batch.length} fichier·s`,
            message: data?.error ?? "téléversement impossible",
          });
        }
      }

      setBusy(false);
      if (added.length > 0) {
        setMedia((current) => [...added, ...current]);
        setMessage(
          `${added.length} média${added.length > 1 ? "s" : ""} ajouté${
            added.length > 1 ? "s" : ""
          }.`,
        );
      }
      if (failures.length > 0) {
        setError(
          failures.map((f) => `${f.filename} : ${f.message}`).join(" — "),
        );
      }
    },
    [allowedKind],
  );

  const remove = useCallback(async (item: MediaItem) => {
    setError(null);
    setMessage(null);
    const response = await fetch(`/api/admin/media/${item.id}`, {
      method: "DELETE",
    }).catch(() => null);
    const data = (await response?.json().catch(() => null)) as {
      error?: string;
    } | null;

    if (!response?.ok) {
      setError(data?.error ?? "Suppression impossible.");
      return;
    }
    setMedia((current) => current.filter((m) => m.id !== item.id));
    setMessage("Média supprimé.");
  }, []);

  /**
   * Remplace le fichier d'un média. L'URL change (cache immuable), mais le
   * serveur répercute la nouvelle sur toutes les pages qui l'utilisaient.
   */
  const replace = useCallback(async (item: MediaItem, file: File) => {
    setBusy(true);
    setError(null);
    setMessage(null);

    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch(`/api/admin/media/${item.id}`, {
      method: "PUT",
      body: formData,
    }).catch(() => null);

    setBusy(false);
    const data = (await response?.json().catch(() => null)) as {
      media?: MediaItem;
      error?: string;
    } | null;

    if (!response?.ok || !data?.media) {
      setError(data?.error ?? "Remplacement impossible.");
      return;
    }
    setMedia((current) =>
      current.map((m) => (m.id === item.id ? (data.media as MediaItem) : m)),
    );
    setMessage("Média remplacé — les pages qui l'utilisaient sont à jour.");
  }, []);

  const saveAlt = useCallback(async (item: MediaItem, alt: string) => {
    if ((item.alt ?? "") === alt) return;
    setMedia((current) =>
      current.map((m) => (m.id === item.id ? { ...m, alt } : m)),
    );
    await fetch(`/api/admin/media/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ alt }),
    }).catch(() => undefined);
  }, []);

  const copyUrl = useCallback(async (item: MediaItem) => {
    await navigator.clipboard?.writeText(item.url).catch(() => undefined);
    setCopiedId(item.id);
    window.setTimeout(() => setCopiedId(null), 1500);
  }, []);

  return (
    <div className="space-y-4">
      {/* Zone de dépôt */}
      <div
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          void upload(event.dataTransfer.files);
        }}
        className={cn(
          "rounded-2xl border-2 border-dashed p-6 text-center transition",
          dragging
            ? "border-gold bg-gold/5"
            : "border-white/15 bg-ink-soft hover:border-white/25",
        )}
      >
        <UploadCloud className="mx-auto h-8 w-8 text-gold" />
        <p className="mt-2 text-sm text-cream">
          Glissez vos photos ici, ou
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="ml-1 font-semibold text-gold underline-offset-2 hover:underline"
          >
            parcourez vos fichiers
          </button>
        </p>
        <p className="mt-1 text-xs text-muted">
          Photos : JPEG, PNG, HEIC (iPhone), WebP, AVIF, GIF, TIFF, BMP ou SVG.
          Vidéos : MP4, WebM ou MOV. {MAX_UPLOAD_MO} Mo par fichier. Les images
          sont converties, redressées et optimisées automatiquement.
        </p>
        <input
          ref={inputRef}
          type="file"
          accept={
            allowedKind === "image" ? "image/*,.heic,.heif" : ACCEPT_UPLOAD
          }
          multiple
          className="hidden"
          onChange={(event) => {
            if (event.target.files) void upload(event.target.files);
            event.target.value = "";
          }}
        />
        {busy && (
          <p className="mt-3 flex items-center justify-center gap-2 text-sm text-gold">
            <Loader2 className="h-4 w-4 animate-spin" /> Téléversement en cours…
          </p>
        )}
      </div>

      {message && (
        <p className="rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-2 text-sm text-green-300">
          {message}
        </p>
      )}
      {error && (
        <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-300">
          {error}
        </p>
      )}

      {/* Recherche */}
      <label className="flex items-center gap-2 rounded-xl border border-white/10 bg-ink px-3 py-2">
        <Search className="h-4 w-4 shrink-0 text-muted" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          // Ceinture de sécurité : même hors du <form> grâce au portail du
          // MediaPicker, « Entrée » ne doit jamais soumettre quoi que ce soit.
          onKeyDown={(event) => {
            if (event.key === "Enter") event.preventDefault();
          }}
          placeholder="Rechercher un média (nom, description)…"
          className="w-full bg-transparent text-sm text-cream placeholder:text-muted focus:outline-none"
        />
      </label>

      {/* Grille */}
      {visibleMedia.length === 0 ? (
        <p className="rounded-2xl border border-white/10 bg-ink-soft p-10 text-center text-sm text-muted">
          Aucun média pour le moment.
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {visibleMedia.map((item) => {
            const isVideo = item.mimeType.startsWith("video/");
            const selected = selectedUrl === item.url;
            return (
              <li
                key={item.id}
                className={cn(
                  "overflow-hidden rounded-xl border bg-ink-soft transition",
                  selected
                    ? "border-gold ring-2 ring-gold/40"
                    : "border-white/10 hover:border-white/25",
                )}
              >
                <button
                  type="button"
                  onClick={() => onSelect?.(item)}
                  disabled={!onSelect}
                  className="relative block aspect-square w-full bg-ink disabled:cursor-default"
                  title={onSelect ? "Choisir ce média" : item.filename}
                >
                  {isVideo ? (
                    <video
                      src={item.url}
                      muted
                      playsInline
                      preload="metadata"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Image
                      src={item.url}
                      alt={item.alt ?? item.filename}
                      fill
                      sizes="(max-width: 640px) 50vw, 220px"
                      className="object-cover"
                    />
                  )}
                  {selected && (
                    <span className="absolute right-2 top-2 grid h-6 w-6 place-items-center rounded-full bg-gold text-ink">
                      <Check className="h-4 w-4" />
                    </span>
                  )}
                </button>

                <div className="space-y-2 p-2.5">
                  <p
                    className="truncate text-xs font-medium text-cream"
                    title={item.filename}
                  >
                    {item.filename}
                  </p>
                  <p className="text-[0.7rem] text-muted">
                    {formatSize(item.size)}
                    {item.width && item.height
                      ? ` · ${item.width}×${item.height}`
                      : ""}
                  </p>

                  {!compact && (
                    <>
                      <input
                        defaultValue={item.alt ?? ""}
                        onBlur={(event) =>
                          void saveAlt(item, event.target.value.trim())
                        }
                        placeholder="Description (accessibilité)"
                        className="w-full rounded border border-white/10 bg-ink px-2 py-1 text-[0.7rem] text-cream placeholder:text-muted focus:border-gold/60 focus:outline-none"
                      />
                      <div className="flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => void copyUrl(item)}
                          className="flex items-center gap-1 text-[0.7rem] text-muted transition hover:text-cream"
                        >
                          {copiedId === item.id ? (
                            <>
                              <Check className="h-3 w-3" /> copié
                            </>
                          ) : (
                            <>
                              <Copy className="h-3 w-3" /> lien
                            </>
                          )}
                        </button>
                        {item.source === "template" ? (
                          <span
                            className="flex items-center gap-1 text-[0.7rem] text-muted"
                            title="Média livré avec le site : non supprimable depuis le CRM."
                          >
                            <Lock className="h-3 w-3" /> modèle
                          </span>
                        ) : (
                          <span className="flex items-center gap-2">
                            <label
                              className="flex cursor-pointer items-center gap-1 text-[0.7rem] text-muted transition hover:text-cream"
                              title="Remplacer ce fichier partout où il est utilisé"
                            >
                              <RefreshCw className="h-3 w-3" /> remplacer
                              <input
                                type="file"
                                accept={ACCEPT_UPLOAD}
                                className="hidden"
                                onChange={(event) => {
                                  const fichier = event.target.files?.[0];
                                  if (fichier) void replace(item, fichier);
                                  event.target.value = "";
                                }}
                              />
                            </label>
                            <button
                              type="button"
                              onClick={() => void remove(item)}
                              className="flex items-center gap-1 text-[0.7rem] text-red-400 transition hover:text-red-300"
                            >
                              <Trash2 className="h-3 w-3" /> supprimer
                            </button>
                          </span>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
