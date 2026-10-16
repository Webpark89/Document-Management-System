import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** App root and Monorepo root */
const appRoot = path.dirname(fileURLToPath(import.meta.url));
const monorepoRoot = path.resolve(appRoot, "..");

const nextConfig: any = {
  distDir: process.env.DMS_DIST_DIR || ".next",
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${process.env.DMS_BACKEND_URL || "http://127.0.0.1:4000"}/api/:path*`,
      },
    ];
  },
  turbopack: {
    root: monorepoRoot,
  },
  outputFileTracingRoot: monorepoRoot,

  typescript: {
    ignoreBuildErrors: false,
  },
  serverExternalPackages: [],

  // Keep backend connections alive — avoids per-request TCP overhead
  httpAgentOptions: {
    keepAlive: true,
  },

  // PDF transactions can wait 30s for a connection and run for up to 60s.
  experimental: {
    proxyTimeout: 120_000,
  },
};

// Add allowed origins for dev server WebSocket
if (process.env.NODE_ENV !== "production") {
  // Merge, preserving proxyTimeout set above
  (nextConfig as any).experimental = {
    proxyTimeout: 120_000,
    ...((nextConfig as any).experimental || {}),
  };
  (nextConfig as any).devIndicators = {
    buildActivity: true,
  };
}

// Allow local network IP for HMR WebSocket
nextConfig.allowedDevOrigins = [
  "192.168.1.59",
  "192.168.1.57",
  "127.0.0.1",
  "localhost",
];

export default nextConfig;
