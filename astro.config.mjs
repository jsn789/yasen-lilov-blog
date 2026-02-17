// @ts-check
import { defineConfig } from 'astro/config';
import sanity from '@sanity/astro';
import react from '@astrojs/react';
import vercel from '@astrojs/vercel';

export default defineConfig({
  output: 'static',
  adapter: vercel(),
  integrations: [
    sanity({
      projectId: 'tize4taj',
      dataset: 'production',
      useCdn: true,
      apiVersion: '2024-07-01',
      studioBasePath: '/admin',
    }),
    react(),
  ],
});
