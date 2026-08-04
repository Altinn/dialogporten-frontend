import { fileURLToPath } from 'node:url';
import { unified } from '@astrojs/markdown-remark';
import starlight from '@astrojs/starlight';
import { defineConfig, passthroughImageService } from 'astro/config';
import rehypeMermaid from 'rehype-mermaid';

const mermaidClient = fileURLToPath(new URL('./src/scripts/mermaid.ts', import.meta.url));

export default defineConfig({
  site: process.env.URL || 'http://localhost',
  base: process.env.BASEURL || '/',
  image: {
    service: passthroughImageService(),
  },
  markdown: {
    processor: unified({
      rehypePlugins: [[rehypeMermaid, { strategy: 'pre-mermaid' }]],
    }),
  },
  integrations: [
    {
      name: 'mermaid-client',
      hooks: {
        'astro:config:setup': ({ injectScript }) => {
          injectScript('page', `import ${JSON.stringify(mermaidClient)};`);
        },
      },
    },
    starlight({
      title: 'Dialogporten Frontend',
      logo: {
        src: './src/assets/logo.svg',
        alt: 'Dialogporten Frontend',
      },
      favicon: '/img/favicon.ico',
      customCss: ['./src/styles/custom.css'],
      editLink: {
        baseUrl: 'https://github.com/altinn/dialogporten-frontend/edit/main/packages/docs/',
      },
      social: [
        {
          icon: 'github',
          label: 'GitHub',
          href: 'https://github.com/altinn/dialogporten-frontend',
        },
      ],
      credits: false,
      lastUpdated: true,
    }),
  ],
});
