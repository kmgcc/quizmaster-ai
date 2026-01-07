import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  // Load env vars (no prefix filter)
  const env = loadEnv(mode, '.', '');

  // GitHub Pages project sites are served under "/<repo_name>/".
  // In GitHub Actions, GITHUB_REPOSITORY is like "owner/repo".
  const repo = process.env.GITHUB_REPOSITORY?.split('/')[1];
  const base = mode === 'production' ? (repo ? `/${repo}/` : '/') : '/';

  return {
    base,

    server: {
      port: 3000,
      host: '0.0.0.0',
    },

    plugins: [
      react(),
      VitePWA({
        // Auto-update service worker when you rebuild
        registerType: 'autoUpdate',

        // Enable SW in dev so you can test “Install app” locally
        devOptions: { enabled: true },

        // Optional: if you have these assets in /public
        includeAssets: ['favicon.ico'],

        manifest: {
          name: 'QuizMaster AI',
          short_name: 'QuizMaster',
          start_url: '.',
          display: 'standalone',
          background_color: '#111111',
          theme_color: '#111111',
          icons: [
            { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
            { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
          ],
        },
      }),
    ],

    // Do NOT bake API keys into the bundle. Users will input their own key and store it in browser storage.
    define: {
      'process.env.API_KEY': JSON.stringify(''),
      'process.env.GEMINI_API_KEY': JSON.stringify(''),
    },

    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
  };
});
