import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  env: {
    PRISMA_CLIENT_ENGINE_TYPE: "binary",
  },
};

export default nextConfig;
