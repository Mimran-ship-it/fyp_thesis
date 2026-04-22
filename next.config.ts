import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Next.js 16: use top-level serverExternalPackages (replaces experimental.serverComponentsExternalPackages).
  serverExternalPackages: [
    "@react-pdf/renderer",
    "@react-pdf/font",
    "@react-pdf/layout",
    "@react-pdf/png-js",
    "@react-pdf/pdfkit",
  ],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
};

export default nextConfig;
