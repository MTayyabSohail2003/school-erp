import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'School ERP System',
        short_name: 'School ERP',
        description: 'Comprehensive School Management ERP System',
        start_url: '/dashboard',
        display: 'standalone',
        background_color: '#0f172a', // Matches our dark mode sidebar (slate-900)
        theme_color: '#0f172a',
        icons: [
            {
                src: '/icon-192x192.png',
                sizes: '192x192',
                type: 'image/png',
            },
            {
                src: '/icon-512x512.png',
                sizes: '512x512',
                type: 'image/png',
            },
        ],
    };
}
