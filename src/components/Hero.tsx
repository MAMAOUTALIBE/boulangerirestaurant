"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Flame,
  MapPin,
  MessageCircle,
  ShoppingBag,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";
import { siteConfig } from "@/lib/config";

const serviceHighlights: {
  title: string;
  detail: string;
  Icon: LucideIcon;
}[] = [
  {
    title: "Click & collect",
    detail: "Prêt au créneau choisi",
    Icon: ShoppingBag,
  },
  {
    title: "Livraison",
    detail: "Juvisy et alentours",
    Icon: MapPin,
  },
  {
    title: "Sur place",
    detail: "Salle conviviale",
    Icon: UtensilsCrossed,
  },
  {
    title: "Grillades au charbon",
    detail: "Préparé minute",
    Icon: Flame,
  },
];

const HERO_SLIDE_INTERVAL_MS = 5600;
const HERO_VIDEO_START_AT = 1.2;
const HERO_VIDEO_SLIDE_INTERVAL_MS = 10800;

type HeroSlideBase = {
  label: string;
  alt: string;
  durationMs?: number;
};

type HeroImageSlide = HeroSlideBase & {
  type: "image";
  src: string;
};

type HeroVideoSlide = HeroSlideBase & {
  type: "video";
  src: string;
  poster: string;
  mediaClassName: string;
  startAt: number;
};

type HeroSlide = HeroImageSlide | HeroVideoSlide;

const heroSlides = [
  {
    type: "video",
    label: "Grillades animées",
    src: "/videos/hero-grillades-animees.mp4",
    poster: "/images/hero-slide-grillades-turques.png",
    alt: "Animation de viandes grillées, flammes et légumes sur un barbecue",
    durationMs: HERO_VIDEO_SLIDE_INTERVAL_MS,
    mediaClassName: "object-[50%_48%] sm:object-[50%_50%] lg:object-[50%_54%]",
    startAt: HERO_VIDEO_START_AT,
  },
  {
    type: "image",
    label: "Anatolia Grill",
    src: "/images/hero-plateau-turc-premium.png",
    alt: "Grand plateau de grillades turques : kebabs, brochettes, côtelettes d'agneau, riz et pain",
  },
  {
    type: "image",
    label: "Grillades & kebabs",
    src: "/images/hero-slide-grillades-turques.png",
    alt: "Assortiment de grillades turques au charbon avec brochettes et viandes marinées",
  },
  {
    type: "image",
    label: "Adana kebab",
    src: "/images/hero-slide-adana-kebab.png",
    alt: "Adana kebab grillé, brochettes de viande hachée épicée, salade d'oignons et pain",
  },
  {
    type: "image",
    label: "Pide & lahmacun",
    src: "/images/hero-slide-pide-lahmacun.png",
    alt: "Pide et lahmacun dorés garnis de viande hachée, légumes et herbes fraîches",
  },
  {
    type: "image",
    label: "Desserts & boissons",
    src: "/images/hero-slide-desserts-turcs.png",
    alt: "Baklava aux pistaches, loukoums et thé turc servis dans des verres traditionnels",
  },
] satisfies readonly HeroSlide[];

/** Hero premium : promesse forte, image immersive et réassurance immédiate. */
export function Hero() {
  const [activeSlide, setActiveSlide] = useState(0);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [readyVideoSrcs, setReadyVideoSrcs] = useState<Record<string, boolean>>(
    {},
  );
  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({});

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );
    const updateMotionPreference = () => {
      setPrefersReducedMotion(prefersReducedMotion.matches);
    };

    updateMotionPreference();

    prefersReducedMotion.addEventListener("change", updateMotionPreference);

    return () => {
      prefersReducedMotion.removeEventListener(
        "change",
        updateMotionPreference,
      );
    };
  }, []);

  useEffect(() => {
    if (prefersReducedMotion) {
      return;
    }

    const active = heroSlides[activeSlide];

    if (active.type === "video" && !readyVideoSrcs[active.src]) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setActiveSlide((current) => (current + 1) % heroSlides.length);
    }, active.durationMs ?? HERO_SLIDE_INTERVAL_MS);

    return () => window.clearTimeout(timeout);
  }, [activeSlide, prefersReducedMotion, readyVideoSrcs]);

  useEffect(() => {
    const active = heroSlides[activeSlide];

    Object.entries(videoRefs.current).forEach(([src, video]) => {
      if (!video) {
        return;
      }

      if (
        active.type !== "video" ||
        active.src !== src ||
        prefersReducedMotion
      ) {
        video.pause();
        return;
      }

      try {
        video.currentTime = active.startAt;
      } catch {
        // Certains navigateurs refusent le seek avant le chargement des métadonnées.
      }

      void video.play().catch(() => undefined);
    });
  }, [activeSlide, prefersReducedMotion]);

  return (
    <section
      id="accueil"
      className="relative overflow-hidden bg-[#050505] px-4 pb-3 pt-[5.15rem] text-cream sm:px-6 sm:pb-9 sm:pt-[6.75rem] lg:min-h-[min(840px,calc(100svh-0.5rem))] lg:pt-[7rem] 2xl:min-h-[min(920px,calc(100svh-0.5rem))] 2xl:pt-[7.35rem] 3xl:min-h-[min(1040px,calc(100svh-0.5rem))] 4xl:min-h-[min(1180px,calc(100svh-0.5rem))]"
    >
      <div className="pointer-events-none absolute inset-0 z-0 h-full w-full">
        {heroSlides.map((slide, index) => (
          <motion.div
            key={slide.src}
            aria-hidden={index !== activeSlide}
            className="absolute inset-0"
            initial={false}
            animate={{
              opacity: index === activeSlide ? 1 : 0,
              scale:
                index === activeSlide
                  ? slide.type === "video"
                    ? 1.02
                    : 1.055
                  : slide.type === "video"
                    ? 1
                    : 1.015,
            }}
            transition={{
              opacity: { duration: 1.05, ease: "easeInOut" },
              scale: { duration: 6.2, ease: "easeOut" },
            }}
          >
            {slide.type === "video" ? (
              <video
                ref={(node) => {
                  videoRefs.current[slide.src] = node;
                }}
                aria-label={index === activeSlide ? slide.alt : undefined}
                autoPlay={index === activeSlide && !prefersReducedMotion}
                className={`h-full w-full origin-center object-cover brightness-[1.05] contrast-[1.08] saturate-[1.12] ${slide.mediaClassName}`}
                loop
                muted
                playsInline
                poster={slide.poster}
                preload="auto"
                onCanPlay={(event) => {
                  setReadyVideoSrcs((current) =>
                    current[slide.src]
                      ? current
                      : { ...current, [slide.src]: true },
                  );

                  if (index === activeSlide && !prefersReducedMotion) {
                    const video = event.currentTarget;

                    if (video.currentTime < slide.startAt) {
                      video.currentTime = slide.startAt;
                    }

                    void video.play().catch(() => undefined);
                  }
                }}
                onError={() => {
                  setReadyVideoSrcs((current) =>
                    current[slide.src]
                      ? current
                      : { ...current, [slide.src]: true },
                  );
                }}
              >
                <source src={slide.src} type="video/mp4" />
              </video>
            ) : null}
            {slide.type === "video" ? (
              <div
                className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,5,5,0.52)_0%,rgba(5,5,5,0.36)_34%,rgba(5,5,5,0.7)_72%,rgba(5,5,5,0.46)_100%)] sm:bg-[linear-gradient(90deg,rgba(5,5,5,0.84)_0%,rgba(5,5,5,0.62)_46%,rgba(5,5,5,0.24)_76%,rgba(5,5,5,0.08)_100%)] lg:bg-[linear-gradient(90deg,rgba(5,5,5,0.76)_0%,rgba(5,5,5,0.5)_40%,rgba(5,5,5,0.16)_70%,rgba(5,5,5,0.04)_100%)]"
                aria-hidden
              />
            ) : (
              <Image
                src={slide.src}
                alt={index === activeSlide ? slide.alt : ""}
                fill
                priority={index === 1}
                sizes="100vw"
                className="origin-right object-cover object-[58%_60%] brightness-[1.08] contrast-[1.08] saturate-[1.08] sm:object-[58%_60%] lg:object-[58%_62%] 3xl:object-[60%_62%]"
              />
            )}
          </motion.div>
        ))}
        <div
          className="via-black/38 absolute inset-x-0 top-0 h-44 bg-gradient-to-b from-black/75 to-transparent sm:h-48 3xl:h-64"
          aria-hidden
        />
      </div>

      <div className="relative z-20 mx-auto flex w-full max-w-[1680px] flex-col gap-5 sm:gap-6 lg:gap-7 3xl:max-w-[2100px] 4xl:max-w-[2360px]">
        <div className="flex min-h-[420px] items-center pb-1 min-[390px]:min-h-[460px] sm:min-h-[560px] sm:pb-2 md:min-h-[600px] lg:min-h-[560px] 2xl:min-h-[630px] 3xl:min-h-[720px] 4xl:min-h-[820px]">
          <motion.div
            className="relative z-20 -mt-8 max-w-[620px] py-3 sm:-mt-[5.25rem] sm:max-w-[650px] sm:py-4 lg:-mt-[6rem] lg:pl-2 xl:-mt-[6.75rem] xl:pl-4 3xl:-mt-32 3xl:max-w-[780px]"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65 }}
          >
            <div
              className="pointer-events-none absolute -bottom-5 -left-5 -right-8 -top-5 bg-[linear-gradient(90deg,rgba(5,5,5,0.76)_0%,rgba(5,5,5,0.58)_56%,rgba(5,5,5,0.18)_82%,transparent_100%)] sm:-left-7 lg:-bottom-8 lg:-left-10 lg:-right-24 lg:-top-8"
              aria-hidden
            />

            <div className="relative z-10">
              <h1 className="font-display text-[2.65rem] font-bold leading-[0.98] text-[#F8F3EA] drop-shadow-[0_3px_8px_rgba(0,0,0,0.96)] min-[390px]:text-5xl sm:text-6xl lg:text-[4.15rem] xl:text-[4.8rem] 3xl:text-[5.8rem] 4xl:text-[6.5rem]">
                <span className="block text-[#D89A1C]">Anatolia Grill</span>
              </h1>

              <p className="text-[#F8F3EA]/88 mt-3 max-w-[18rem] text-sm font-semibold leading-5 drop-shadow-[0_2px_5px_rgba(0,0,0,0.98)] sm:mt-5 sm:max-w-xl sm:text-xl sm:leading-8 3xl:max-w-3xl 3xl:text-2xl 3xl:leading-10">
                Grillades au charbon. Commandez maintenant.
              </p>

              <div className="mt-5 hidden flex-col gap-3 sm:mt-6 sm:flex sm:flex-row sm:flex-wrap 3xl:gap-4">
                <Link
                  href="/commander"
                  className="inline-flex min-h-[3.5rem] w-full items-center justify-center gap-3 rounded-full bg-[#D89A1C] px-8 py-3 text-base font-black text-[#050505] shadow-[0_24px_58px_-24px_rgba(216,154,28,0.98)] transition hover:-translate-y-1 hover:bg-[#f0ad2f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D89A1C]/70 sm:min-h-[3.75rem] sm:w-auto sm:px-10 sm:py-3.5 sm:text-lg 3xl:min-h-[4.4rem] 3xl:px-12 3xl:text-xl"
                >
                  <ShoppingBag className="h-5 w-5 3xl:h-6 3xl:w-6" />
                  Commander
                </Link>
                <div className="contents">
                  <a
                    href={siteConfig.socials.whatsapp}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-[#25D366]/16 hover:bg-[#25D366]/24 inline-flex min-h-[3rem] flex-1 items-center justify-center gap-2.5 rounded-full border border-[#25D366]/70 px-4 py-2.5 text-sm font-bold text-[#F8F3EA] transition hover:-translate-y-1 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366]/70 sm:min-h-[3.75rem] sm:flex-none sm:gap-3 sm:px-8 sm:py-3.5 sm:text-base 3xl:min-h-[4.4rem] 3xl:px-10 3xl:text-xl"
                  >
                    <MessageCircle className="h-5 w-5 text-[#25D366] 3xl:h-6 3xl:w-6" />
                    WhatsApp
                  </a>
                  <span className="hidden basis-full sm:block" aria-hidden />
                  <Link
                    href="/menu"
                    className="inline-flex min-h-[3rem] flex-1 items-center justify-center gap-2 rounded-full border border-white/25 bg-black/20 px-4 py-2.5 text-sm font-bold text-[#F8F3EA] transition hover:-translate-y-1 hover:border-[#D89A1C]/70 hover:bg-black/35 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 sm:flex-none sm:gap-2.5 sm:px-6 3xl:min-h-[3.6rem] 3xl:px-8 3xl:text-base"
                  >
                    <UtensilsCrossed className="h-4 w-4 3xl:h-5 3xl:w-5" />
                    <span className="whitespace-nowrap">Voir le menu</span>
                  </Link>
                </div>
              </div>

              <div
                className="mt-4 flex items-center gap-2 sm:mt-5 3xl:mt-7 3xl:gap-3"
                aria-label="Visuels du hero"
              >
                {heroSlides.map((slide, index) => (
                  <button
                    key={slide.src}
                    type="button"
                    aria-label={`Afficher ${slide.label}`}
                    aria-current={index === activeSlide ? "true" : undefined}
                    onClick={() => setActiveSlide(index)}
                    className={`h-2 rounded-full transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D89A1C]/70 3xl:h-2.5 ${
                      index === activeSlide
                        ? "w-8 bg-[#D89A1C] 3xl:w-10"
                        : "w-2 bg-white/45 hover:bg-white/75 3xl:w-2.5"
                    }`}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Mobile : réassurance en ruban premium défilant */}
        <div
          className="hero-service-marquee relative z-20 -mx-4 overflow-hidden pb-0.5 sm:hidden"
          aria-label="Services disponibles : click and collect, livraison, sur place et grillades au charbon"
        >
          <div className="hero-service-track" aria-hidden="true">
            {[...serviceHighlights, ...serviceHighlights].map(
              ({ title, Icon }, index) => (
                <span key={`${title}-${index}`} className="hero-service-chip">
                  <Icon className="h-4 w-4 shrink-0 text-[#D89A1C]" />
                  <span>{title}</span>
                </span>
              ),
            )}
          </div>
        </div>

        <motion.div
          aria-label="Services disponibles"
          className="bg-black/48 relative z-20 hidden overflow-hidden rounded-[24px] border border-white/10 shadow-[0_22px_60px_-34px_rgba(216,154,28,0.95)] backdrop-blur-[2px] sm:block sm:rounded-[28px] 3xl:rounded-[34px]"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.2 }}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {serviceHighlights.map(({ title, detail, Icon }) => (
              <div
                key={title}
                className="flex items-center gap-4 border-t border-white/10 px-5 py-4 first:border-t-0 sm:px-6 lg:border-l lg:border-t-0 lg:px-7 lg:first:border-l-0 3xl:gap-5 3xl:px-9 3xl:py-6"
              >
                <span className="border-[#D89A1C]/58 bg-black/28 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border text-[#D89A1C] sm:h-14 sm:w-14 3xl:h-16 3xl:w-16">
                  <Icon className="h-5 w-5 3xl:h-6 3xl:w-6" />
                </span>
                <span className="min-w-0">
                  <span className="block text-lg font-black leading-tight text-[#F8F3EA] sm:text-xl 3xl:text-2xl">
                    {title}
                  </span>
                  <span className="text-[#F8F3EA]/78 mt-1 block text-sm font-medium leading-snug sm:text-base 3xl:text-lg">
                    {detail}
                  </span>
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
