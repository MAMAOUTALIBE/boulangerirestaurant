/** @type {import('next').NextConfig} */
const nextConfig = {
  // Sortie autonome : serveur Node minimal pour le déploiement (Docker/VPS).
  output: "standalone",
  // Toutes les images sont locales (public/images) → pas de domaine distant.
  images: {
    formats: ["image/avif", "image/webp"],
  },
  poweredByHeader: false,
  compress: true,
  // En-têtes de sécurité appliqués à toutes les réponses.
  // (CSP volontairement omise ici : à définir et tester séparément pour ne pas
  //  casser Stripe / les scripts inline JSON-LD.)
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-DNS-Prefetch-Control", value: "on" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
