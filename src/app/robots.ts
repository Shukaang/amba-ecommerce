import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/api', '/auth', '/(auth)'],
    },
    sitemap: 'https://ambaastore.com/sitemap.xml',
  };
}