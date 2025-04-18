import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // não faz o build falhar em caso de erro de lint
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
