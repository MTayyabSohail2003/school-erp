import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'AR-School ERP',
    short_name: 'AR-School',
    description: 'School Management Enterprise Resource Planning System',
    start_url: '/dashboard',
    display: 'standalone',
    background_color: '#022c22',
    theme_color: '#10b981',
    icons: [
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}
