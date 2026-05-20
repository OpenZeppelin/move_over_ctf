import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  // Emit a directory + index.html for every route (e.g. out/en/index.html
  // instead of out/en.html). Without this, `serve` (used in the prod
  // Dockerfile) redirects /en.html → /en and then falls back to the root
  // index.html, which strips all per-page <meta> tags (og:image, canonical,
  // etc.) from social-media previews.
  trailingSlash: true,
};

export default nextConfig;
