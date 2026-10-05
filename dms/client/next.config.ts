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
        destination: "http://127.0.0.1:4000/api/:path*",
      },
    ];
  },
  turbopack: {
    root: monorepoRoot,
  },
  outputFileTracingRoot: monorepoRoot,

  typescript: {
    ignoreBuildErrors: true,
  },
  serverExternalPackages: [],

  // Keep backend connections alive — avoids per-request TCP overhead
  httpAgentOptions: {
    keepAlive: true,
  },

  // Give backend up to 30s to respond — prevents 504/ECONNREFUSED on cold start
  experimental: {
    proxyTimeout: 30_000,
  },
};

// Add allowed origins for dev server WebSocket
if (process.env.NODE_ENV !== "production") {
  // Merge, preserving proxyTimeout set above
  (nextConfig as any).experimental = {
    proxyTimeout: 30_000,
    ...((nextConfig as any).experimental || {}),
  };
  (nextConfig as any).devIndicators = {
    buildActivity: true,
  };
}


// Allow local network IP for HMR WebSocket
nextConfig.allowedDevOrigins = ['192.168.1.59', '192.168.1.57', '127.0.0.1', 'localhost'];

export default nextConfig;
