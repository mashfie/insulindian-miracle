import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  trailingSlash: true,
  turbopack: {
    root: process.cwd(),
  },
  experimental: {
    viewTransition: true,
    workerThreads: true,
    webpackBuildWorker: false,
  },
};

export default nextConfig;
