import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/login', '/signup'],
      disallow: [
        '/admin',
        '/api',
        '/(after-auth)',
        '/dashboard',
        '/novels',
        '/profile',
        '/reading-test',
        '/payment',
        '/settings',
      ],
    },
    sitemap: 'https://reading-champ.com/sitemap.xml',
  }
}