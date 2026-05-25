/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Tell Next.js not to bundle the Prisma client — it ships a native .dll.node
  // query engine that must be resolved by Node at runtime, not inlined by webpack.
  serverExternalPackages: ["prisma-client-local"],
}

export default nextConfig
