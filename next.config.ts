import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com", // Google avatar
        pathname: "/**",
      },
    ],
  },
  experimental: {
    serverActions: { bodySizeLimit: "5mb" }, // untuk upload gambar besar
  },
};

export default nextConfig;
