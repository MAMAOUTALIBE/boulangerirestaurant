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
  async headers() {
    // CSP déployée en Report-Only d'abord : elle N'EMPÊCHE RIEN mais remonte les
    // violations (console + /api/csp-report) pour l'ajuster sans risque, avant de
    // basculer en `Content-Security-Policy` (enforce). `'unsafe-inline'` sur
    // script-src reste toléré pour Next (hydratation) + JSON-LD ; l'objectif à
    // terme est de passer aux nonces. Même ainsi, object-src/base-uri/
    // frame-ancestors/connect-src/form-action réduisent déjà fortement le XSS.
    const csp = [
      "default-src 'self'",
      "base-uri 'self'",
      "object-src 'none'",
      "frame-ancestors 'self'",
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      "style-src 'self' 'unsafe-inline'",
      "script-src 'self' 'unsafe-inline' https://js.stripe.com",
      "connect-src 'self' https://api.stripe.com https://*.upstash.io",
      "frame-src 'self' https://js.stripe.com https://hooks.stripe.com",
      "form-action 'self'",
      "report-uri /api/csp-report",
    ].join("; ");

    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-DNS-Prefetch-Control", value: "on" },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          {
            key: "Permissions-Policy",
            value:
              "camera=(), microphone=(), geolocation=(), interest-cohort=(), browsing-topics=(), usb=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          { key: "Content-Security-Policy-Report-Only", value: csp },
        ],
      },
    ];
  },
};

export default nextConfig;
