import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.join(__dirname, ".."),
  },
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
