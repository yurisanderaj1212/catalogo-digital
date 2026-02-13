import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
  // Removemos la configuración de export estático para que funcione en Render
};

export default nextConfig;
