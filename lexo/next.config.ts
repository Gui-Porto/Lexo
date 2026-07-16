import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // TypeScript e ESLint desabilitados no build — Render free tier tem 512MB RAM e o
  // type checker carrega o projeto inteiro na memória. Erros continuam visíveis no IDE.
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  experimental: {
    viewTransition: true,
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // 🔒 SEGURANÇA [VULN-5]: HSTS contra SSL-strip/downgrade (CWE-319).
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          // 🔒 SEGURANÇA [VULN-5]: CSP limita o blast radius de qualquer XSS (CWE-693).
          // Baseline pragmático: 'unsafe-inline' é necessário porque o App Router injeta
          // scripts inline de hydration. HARDENING recomendado: migrar para CSP baseada em
          // nonce (gerado no proxy.ts e propagado), o que permite remover 'unsafe-inline'.
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              // 'unsafe-eval' só em dev: o devtool de source map do webpack (next dev)
              // embrulha os chunks em eval(), bloqueado pelo CSP e quebrando todo o JS
              // do client (ex: as animações de reveal-on-scroll da landing) sem erro visível.
              // Build de produção não usa eval, então lá o CSP fica só com 'unsafe-inline'.
              `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV !== "production" ? " 'unsafe-eval'" : ""}`,
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob:",
              "font-src 'self' data:",
              "connect-src 'self'",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self' https://accounts.google.com",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
