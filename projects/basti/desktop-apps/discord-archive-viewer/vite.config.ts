import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import electron from 'vite-plugin-electron';
import renderer from 'vite-plugin-electron-renderer';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filenameLocal = fileURLToPath(import.meta.url);
const __dirnameLocal = path.dirname(__filenameLocal);

const ROOT = __dirnameLocal;
const MAIN_ENTRY = path.resolve(ROOT, 'src/main/main.ts');
const PRELOAD_ENTRY = path.resolve(ROOT, 'src/preload/preload.ts');
const RENDERER_ROOT = path.resolve(ROOT, 'src/renderer');
const DIST_RENDERER = path.resolve(ROOT, 'dist');
const DIST_ELECTRON = path.resolve(ROOT, 'dist-electron');

export default defineConfig({
  resolve: {
    alias: {
      '@shared': path.resolve(ROOT, 'src/shared'),
    },
  },
  root: RENDERER_ROOT,
  base: './',
  build: {
    outDir: DIST_RENDERER,
    emptyOutDir: true,
  },
  plugins: [
    react(),
    electron([
      {
        entry: MAIN_ENTRY,
        vite: {
          build: {
            outDir: DIST_ELECTRON,
            sourcemap: false,
            minify: false,
            rollupOptions: {
              external: ['electron'],
            },
          },
          resolve: {
            alias: {
              '@shared': path.resolve(ROOT, 'src/shared'),
            },
          },
        },
      },
      {
        entry: PRELOAD_ENTRY,
        onstart(options) {
          options.reload();
        },
        vite: {
          build: {
            outDir: DIST_ELECTRON,
            sourcemap: false,
            minify: false,
            rollupOptions: {
              external: ['electron'],
            },
          },
          resolve: {
            alias: {
              '@shared': path.resolve(ROOT, 'src/shared'),
            },
          },
        },
      },
    ]),
    renderer(),
  ],
});
