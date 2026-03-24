import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
    images: {
        unoptimized: true
    },
    // FIX: Proxy /api/* calls to the Laravel backend.
    // Frontend always calls its own host (works on any IP/device on the network).
    // Only update the destination port if your Laravel runs on a different port.
    async rewrites() {
        return [
            {
                source: '/api/:path*',
                destination: 'http://localhost:8000/api/:path*',
            },
        ];
    },
};

export default nextConfig;

