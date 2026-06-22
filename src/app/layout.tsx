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
import { siteConfig } from "@/lib/config";

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

const heroImage = "/images/boulangerie-hero.webp";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} | Boulangerie artisanale`,
    template: `%s | ${siteConfig.name}`,
  },
  description: `${siteConfig.name} : pains au levain, viennoiseries pur beurre, pâtisseries de saison et snacking frais. Commandez en ligne ou scannez le QR code.`,
  keywords: [
    "boulangerie",
    "boulangerie artisanale",
    "pain au levain",
    "croissant",
    "pain au chocolat",
    "pâtisserie",
    "livraison",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    title: siteConfig.name,
    description: "Pain frais, viennoiseries et pâtisseries maison.",
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
    description: "Pain frais, viennoiseries et pâtisseries maison.",
    images: [heroImage],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Bakery",
    name: siteConfig.name,
    description: siteConfig.description,
    url: siteConfig.url,
    servesCuisine: "Boulangerie, pâtisserie, snacking",
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
      data-scroll-behavior="smooth"
      className={`${sans.variable} ${display.variable}`}
    >
      <body className="bg-ink font-sans text-cream antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <LangProvider>
          <CartProvider>
            <OrderProvider>
              {children}
              <CartDrawer />
              <AiAssistant />
            </OrderProvider>
          </CartProvider>
        </LangProvider>
        <CookieConsent />
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
