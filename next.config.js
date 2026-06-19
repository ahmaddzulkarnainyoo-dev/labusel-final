/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Ini akan membuat build tetap jalan meskipun ada error ESLint
    ignoreDuringBuilds: true,
  },
}

module.exports = nextConfig