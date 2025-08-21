import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  serverExternalPackages: ['@supabase/supabase-js'],
  typescript: {
    // Ignorar erros de tipo durante o build para permitir deploy
    ignoreBuildErrors: false,
  },
  eslint: {
    // Ignorar erros de ESLint durante o build para permitir deploy
    ignoreDuringBuilds: false,
  },
};

export default nextConfig;
