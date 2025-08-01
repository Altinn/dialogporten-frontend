import react from '@vitejs/plugin-react-swc';
import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default () => {
  // Get version from environment variable or use package.json version as fallback
  // For CI/CD, BUILD_VERSION will be set to version-gitSha (e.g., "1.49.0-a1b2c3d")
  // For local development, it will fall back to package.json version
  const buildVersion = process.env.BUILD_VERSION;

  return defineConfig({
    plugins: [react()],
    ...(process.env.PORT && {
      server: {
        port: Number.parseInt(process.env.PORT),
      },
    }),
    define: {
      __APP_VERSION__: JSON.stringify(buildVersion),
    },
    build: {
      sourcemap: 'hidden',
      rollupOptions: {
        output: {
          // Use version-based naming when BUILD_VERSION is set, otherwise use hash
          entryFileNames: process.env.BUILD_VERSION ? `assets/[name].${buildVersion}.js` : 'assets/[name].[hash].js',
          chunkFileNames: process.env.BUILD_VERSION ? `assets/[name].${buildVersion}.js` : 'assets/[name].[hash].js',
          assetFileNames: (assetInfo) => {
            const info = assetInfo.name.split('.');
            const ext = info[info.length - 1];
            const fileName = process.env.BUILD_VERSION ? `[name].${buildVersion}.${ext}` : `[name].[hash].${ext}`;

            return `assets/${fileName}`;
          },
          // Ensure source maps are generated with proper naming
          sourcemapExcludeSources: false,
        },
      },
    },
  });
};
