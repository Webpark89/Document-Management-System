import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** App root — avoids Next.js picking the parent repo lockfile as workspace root */
const appRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  turbopack: {
    root: appRoot,
  },
  outputFileTracingRoot: appRoot,
};

export default nextConfig;
