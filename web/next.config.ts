import path from "node:path";

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  experimental: {
    viewTransition: true,
  },
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;
