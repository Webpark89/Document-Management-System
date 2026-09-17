import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** App root and Monorepo root */
const appRoot = path.dirname(fileURLToPath(import.meta.url));
const monorepoRoot = path.resolve(appRoot, "..");

const nextConfig: any = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:4000/api/:path*",
      },
    ];
  },
  turbopack: {
    root: monorepoRoot,
  },
  outputFileTracingRoot: monorepoRoot,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
