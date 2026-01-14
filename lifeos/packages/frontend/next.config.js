/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  async rewrites() {
    // Use INTERNAL_API_URL for Docker container communication
    // Falls back to localhost for local development
    const apiUrl = process.env.INTERNAL_API_URL || 'http://localhost:5000';
    return [
      {
        source: '/api/:path*',
        destination: `${apiUrl}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
