import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";
import { OrderProvider } from "@/context/OrderContext";
import { LangProvider } from "@/context/LangContext";
import { CartDrawer } from "@/components/CartDrawer";
import { CookieConsent } from "@/components/CookieConsent";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import { AiAssistant } from "@/components/AiAssistant";
import { getSiteConfig } from "@/lib/site-settings";
import { SiteConfigProvider } from "@/context/SiteConfigContext";
import { prisma } from "@/lib/prisma";
import { serializeJsonLd } from "@/lib/utils";

const sans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const display = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  weight: ["500", "600", "700", "800"],
});

const heroImage = "/images/hero-plateau-turc-premium.png";

export async function generateMetadata(): Promise<Metadata> {
  const siteConfig = await getSiteConfig();
  return {
    metadataBase: new URL(siteConfig.url),
    title: {
      default: `${siteConfig.name} | Restaurant turc & grillades`,
      template: `%s | ${siteConfig.name}`,
    },
    description: siteConfig.description,
    keywords: [
      "restaurant turc",
      "grillades turques",
      "kebab",
      "adana kebab",
      "iskender",
      "lahmacun",
      "pide",
      "baklava",
      "livraison",
    ],
    alternates: { canonical: "/" },
    openGraph: {
      title: siteConfig.name,
      description: siteConfig.description,
      type: "website",
      locale: siteConfig.locale,
      url: siteConfig.url,
      siteName: siteConfig.name,
      images: [
        {
          url: heroImage,
          width: 1200,
          height: 630,
          alt: siteConfig.name,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: siteConfig.name,
      description: siteConfig.description,
      images: [heroImage],
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [appearance, siteConfig] = await Promise.all([
    prisma.orderingSetting
      .findUnique({
        where: { id: "default" },
        select: { colorPalette: true },
      })
      .catch(() => null),
    getSiteConfig(),
  ]);
  const colorPalette =
    appearance?.colorPalette === "terracotta" ||
    appearance?.colorPalette === "emeraude"
      ? appearance.colorPalette
      : "ambre";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    name: siteConfig.name,
    description: siteConfig.description,
    url: siteConfig.url,
    servesCuisine: "Turque, grillades, kebab",
    priceRange: siteConfig.priceRange,
    telephone: siteConfig.contact.phone,
    email: siteConfig.contact.email,
    address: {
      "@type": "PostalAddress",
      streetAddress: siteConfig.contact.address,
      addressCountry: "FR",
    },
    image: [`${siteConfig.url}${heroImage}`],
    menu: `${siteConfig.url}/menu`,
    acceptsReservations: true,
  };

  return (
    <html
      lang="fr"
      data-color-palette={colorPalette}
      data-scroll-behavior="smooth"
      className={`${sans.variable} ${display.variable}`}
    >
      <body className="bg-ink font-sans text-cream antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
        />
        <SiteConfigProvider value={siteConfig}>
          <LangProvider>
            <CartProvider>
              <OrderProvider>
                {children}
                <CartDrawer />
                <AiAssistant />
              </OrderProvider>
            </CartProvider>
          </LangProvider>
        </SiteConfigProvider>
        <CookieConsent />
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
