"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { ImageIcon, Link2, Loader2, X } from "lucide-react";
import { MediaLibrary, type MediaItem } from "@/components/admin/MediaLibrary";
import { cn } from "@/lib/utils";

interface MediaPickerProps {
  /** Nom du champ posté dans le formulaire (l'URL du média). */
  name: string;
  defaultValue?: string | null;
  label?: string;
  required?: boolean;
  className?: string;
  /** Restreint la médiathèque aux images (ex. affiche d'une vidéo). */
  mediaKind?: "all" | "image";
}

/**
 * Sélecteur d'image du CRM : aperçu + médiathèque en modale + saisie manuelle
 * d'un chemin (compatibilité avec les images du modèle, ex. `/images/…`).
 *
 * Le champ réellement posté est un `input hidden` : côté Server Action, rien ne
 * change par rapport à l'ancien champ texte.
 */
export function MediaPicker({
  name,
  defaultValue,
  label = "Image",
  required = false,
  className,
  mediaKind = "all",
}: MediaPickerProps) {
  const [value, setValue] = useState(defaultValue ?? "");
  const [open, setOpen] = useState(false);
  const [manual, setManual] = useState(false);
  const [media, setMedia] = useState<MediaItem[] | null>(null);
  // `document` n'existe pas au rendu serveur : le portail n'est monté qu'ensuite.
  const [monte, setMonte] = useState(false);

  useEffect(() => setMonte(true), []);

  // La médiathèque n'est chargée qu'à la première ouverture de la modale.
  useEffect(() => {
    if (!open || media) return;
    let cancelled = false;
    fetch("/api/admin/media", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : { media: [] }))
      .then((data: { media: MediaItem[] }) => {
        if (!cancelled) setMedia(data.media ?? []);
      })
      .catch(() => {
        if (!cancelled) setMedia([]);
      });
    return () => {
      cancelled = true;
    };
  }, [open, media]);

  // Fermeture au clavier.
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  // Les vidéos acceptées ne se limitent plus au MP4 (WebM, MOV).
  const isVideo = /\.(mp4|webm|mov)$/i.test(value);

  const manquant = required && !value;

  return (
    <div className={cn("space-y-2", className)}>
      {/*
        Champ réellement posté. `required` n'aurait aucun effet sur un input
        caché (les champs masqués sont exclus de la validation HTML) : on
        signale donc l'oubli visuellement ici, et le Zod côté serveur
        (`mediaUrlSchema`) reste la vraie garde.
      */}
      <input type="hidden" name={name} value={value} />

      <div
        className={cn(
          "flex items-center gap-3 rounded-xl border bg-ink p-2.5",
          manquant ? "border-red-500/50" : "border-white/10",
        )}
      >
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-ink-soft">
          {value ? (
            isVideo ? (
              <video
                src={value}
                muted
                playsInline
                preload="metadata"
                className="h-full w-full object-cover"
              />
            ) : (
              <Image
                src={value}
                alt=""
                fill
                sizes="64px"
                className="object-contain p-1"
              />
            )
          ) : (
            <span className="grid h-full w-full place-items-center text-muted">
              <ImageIcon className="h-5 w-5" />
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-cream">
            {label}
            {required && <span className="ml-1 text-red-400">*</span>}
          </p>
          <p
            className={cn(
              "truncate text-xs",
              manquant ? "text-red-400" : "text-muted",
            )}
            title={value}
          >
            {value || (manquant ? "Média obligatoire" : "Aucun média choisi")}
          </p>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="rounded-lg bg-gold px-3 py-1 text-xs font-semibold text-ink transition hover:bg-gold-400"
            >
              Choisir ou téléverser
            </button>
            <button
              type="button"
              onClick={() => setManual((current) => !current)}
              className="flex items-center gap-1 text-xs text-muted transition hover:text-cream"
            >
              <Link2 className="h-3 w-3" /> chemin manuel
            </button>
            {value && (
              <button
                type="button"
                onClick={() => setValue("")}
                className="text-xs text-red-400 transition hover:text-red-300"
              >
                retirer
              </button>
            )}
          </div>
        </div>
      </div>

      {manual && (
        <input
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="/images/… ou /media/…"
          className="w-full rounded-lg border border-white/10 bg-ink px-3 py-2 text-sm text-cream placeholder:text-muted focus:border-gold/60 focus:outline-none"
        />
      )}

      {/*
        La modale est rendue dans <body> via un portail, et NON à sa place dans
        l'arbre : le sélecteur vit à l'intérieur du <form> d'un plat, et un
        champ de recherche imbriqué dans ce formulaire soumettrait le plat à la
        moindre touche « Entrée ». Le portail sort la médiathèque du formulaire.
      */}
      {open &&
        monte &&
        createPortal(
          <div className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-black/70 p-4">
            <div className="my-8 w-full max-w-4xl rounded-2xl border border-white/10 bg-ink p-5 shadow-2xl">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-display text-lg font-semibold text-cream">
                  Médiathèque
                </h2>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-full p-2 text-muted transition hover:bg-white/5 hover:text-cream"
                  aria-label="Fermer la médiathèque"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {media === null ? (
                <p className="flex items-center justify-center gap-2 py-12 text-sm text-muted">
                  <Loader2 className="h-4 w-4 animate-spin" /> Chargement…
                </p>
              ) : (
                <MediaLibrary
                  initialMedia={media}
                  selectedUrl={value}
                  compact
                  allowedKind={mediaKind}
                  onSelect={(item) => {
                    setValue(item.url);
                    setOpen(false);
                  }}
                />
              )}
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
