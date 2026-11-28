import type { NextConfig } from "next";

// Content-Security-Policy is built from these directives.
// 'unsafe-inline' for style is required by Tailwind CSS v4 (injects via CSSOM).
// 'unsafe-eval' is NOT listed; eval is blocked.
const CSP = [
  "default-src 'self'",
  // Scripts: self + RapiDoc CDN (API docs page) + Vercel Analytics
  "script-src 'self' 'unsafe-inline' https://unpkg.com https://va.vercel-scripts.com",
  // Styles: self + Google Fonts + inline (Tailwind)
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  // Fonts: self + Google Fonts
  "font-src 'self' https://fonts.gstatic.com",
  // Images: self + data URIs (OG images, embedded SVG)
  "img-src 'self' data: https:",
  // Connect: self + AI provider APIs (all go through the server, but Vercel Analytics calls the edge)
  "connect-src 'self' https://va.vercel-scripts.com",
  // Frames: none (overridden for /embed routes below)
  "frame-ancestors 'none'",
  // Forms only submit to same origin
  "form-action 'self'",
  // No browser features beyond what Permissions-Policy covers
  "base-uri 'self'",
  "object-src 'none'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Content-Security-Policy", value: CSP },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // standalone output enables Docker deployment for enterprise self-hosted
  output: process.env.DOCKER_BUILD === "1" ? "standalone" : undefined,
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
      {
        source: "/embed/:path*",
        headers: [{ key: "Content-Security-Policy", value: "frame-ancestors *" }],
      },
    ];
  },
};

export default nextConfig;
