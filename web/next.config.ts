import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  trailingSlash: true,
  experimental: {
    viewTransition: true,
  },
};

export default nextConfig;
