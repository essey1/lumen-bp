/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Prevent Next.js from bundling Prisma's native query engine (.node binary)
  serverExternalPackages: ["@prisma/client", "prisma"],
}

export default nextConfig
