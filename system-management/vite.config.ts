import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import electron from 'vite-plugin-electron'
import renderer from 'vite-plugin-electron-renderer'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    electron([
      {
        // Main-Process entry file of the Electron App.
        entry: 'src/main/desktop-main.ts',
        vite: {
          build: {
            outDir: 'dist-electron/main',
            minify: false,
            rollupOptions: {
              external: ['better-sqlite3', '@electron/remote', 'fluent-ffmpeg', 'ws']
            }
          },
        },
      },
      {
        entry: 'src/main/preload.ts',
        onstart(options) {
          options.reload()
        },
        vite: {
          build: {
            outDir: 'dist-electron/preload',
            minify: false,
            rollupOptions: {
              external: ['better-sqlite3', '@electron/remote']
            }
          },
        },
      },
    ]),
    renderer(),
  ],
})
