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
import { buildPaletteStyle, resolvePaletteName } from "@/lib/palette";

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

export async function generateMetadata(): Promise<Metadata> {
  const siteConfig = await getSiteConfig();
  // Titre, description, mots-clés, image de partage et favicon viennent tous de
  // /admin/parametres ; les valeurs ci-dessous ne servent que si rien n'est saisi.
  const titre =
    siteConfig.seo.metaTitle || `${siteConfig.name} | Spécialités africaines`;
  const description = siteConfig.seo.metaDescription || siteConfig.description;
  const partage = siteConfig.branding.ogImageUrl;

  return {
    metadataBase: new URL(siteConfig.url),
    title: { default: titre, template: `%s | ${siteConfig.name}` },
    description,
    keywords: siteConfig.seo.keywords,
    ...(siteConfig.branding.faviconUrl
      ? { icons: { icon: siteConfig.branding.faviconUrl } }
      : {}),
    alternates: { canonical: "/" },
    openGraph: {
      title: titre,
      description,
      type: "website",
      locale: siteConfig.locale,
      url: siteConfig.url,
      siteName: siteConfig.name,
      images: partage
        ? [{ url: partage, width: 1200, height: 630, alt: siteConfig.name }]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: titre,
      description,
      images: partage ? [partage] : undefined,
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
  const colorPalette = resolvePaletteName(appearance?.colorPalette);
  // Palette « perso » : les nuances sont dérivées de la couleur choisie au CRM
  // et injectées en variables CSS ; les palettes prêtes vivent dans globals.css.
  const paletteStyle = buildPaletteStyle(colorPalette, siteConfig.accentColor);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    name: siteConfig.name,
    description: siteConfig.description,
    url: siteConfig.url,
    servesCuisine: "Africaine, ouest-africaine, sénégalaise",
    priceRange: siteConfig.priceRange,
    telephone: siteConfig.contact.phone,
    email: siteConfig.contact.email,
    address: {
      "@type": "PostalAddress",
      streetAddress: siteConfig.contact.address,
      addressCountry: "FR",
    },
    image: siteConfig.branding.ogImageUrl
      ? [`${siteConfig.url}${siteConfig.branding.ogImageUrl}`]
      : undefined,
    menu: `${siteConfig.url}/menu`,
    acceptsReservations: true,
  };

  return (
    <html
      lang="fr"
      data-color-palette={colorPalette}
      style={paletteStyle}
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
