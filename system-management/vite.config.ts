import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import electron from 'vite-plugin-electron'
import renderer from 'vite-plugin-electron-renderer'
import fs from 'fs'
import path from 'path'

function getInjectEntries() {
  const injectsDir = path.join(__dirname, 'src/main/injects')
  if (!fs.existsSync(injectsDir)) {
    return []
  }

  const files = fs.readdirSync(injectsDir)
  return files
    .filter(file => file.endsWith('.ts') && file.includes('-inject'))
    .map(file => {
      const name = file.replace('.ts', '')
      return {
        entry: `src/main/injects/${file}`,
        name: name,
        fileName: `${name}.js`
      }
    })
}

export default defineConfig({
  define: {
    // Only the gateway address is configurable. Direct service addresses
    // (10101 / 8082 / 8080) must never be injected into the renderer.
    'import.meta.env.VITE_GATEWAY_URL': JSON.stringify(
      process.env.VITE_GATEWAY_URL || '',
    ),
    'import.meta.env.VITE_GATEWAY_HOST': JSON.stringify(
      process.env.VITE_GATEWAY_HOST || 'localhost',
    ),
    'import.meta.env.VITE_GATEWAY_PORT': JSON.stringify(
      process.env.VITE_GATEWAY_PORT || '10081',
    ),
    'import.meta.env.VITE_WEB_SERVER_PORT': JSON.stringify(
      process.env.WEB_SERVER_PORT || '5051',
    ),
    'import.meta.env.VITE_VOICE_API_URL': JSON.stringify(
      process.env.VITE_VOICE_API_URL || '',
    ),
  },
  plugins: [
    react(),
    electron([
      {
        entry: 'src/main/desktop-main.ts',
        vite: {
          define: {
            'process.env.WEBSOCKET_PORT': JSON.stringify(process.env.WEBSOCKET_PORT || '5050'),
            'process.env.WEB_SERVER_PORT': JSON.stringify(process.env.WEB_SERVER_PORT || '5051'),
            'process.env.DEV_SERVER_PORT': JSON.stringify(process.env.DEV_SERVER_PORT || '5173'),
          },
          build: {
            outDir: 'dist-electron/main',
            minify: false,
            rollupOptions: {
              external: [
                'better-sqlite3',
                'fluent-ffmpeg',
                'ws',
                'reflect-metadata',
                'rxjs',
                /^@nestjs\/.*/
              ]
            }
          },
        },
      },
      ...getInjectEntries().map(inject => ({
        entry: inject.entry,
        onstart(options) {
          options.reload()
        },
        vite: {
          build: {
            outDir: 'dist-electron/main',
            minify: false,
            rollupOptions: {
              output: {
                entryFileNames: inject.fileName,
                format: 'iife' as const,
              },
            },
          },
        },
      })),
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
              output: {
                entryFileNames: 'preload.js',
              },
              external: ['better-sqlite3']
            }
          },
        },
      },
      {
        entry: 'src/main/monitor-preload.ts',
        onstart(options) {
          options.reload()
        },
        vite: {
          build: {
            outDir: 'dist-electron/preload',
            minify: false,
            rollupOptions: {
              output: {
                entryFileNames: 'monitor-preload.js',
              },
              external: ['better-sqlite3']
            }
          },
        },
      },
    ]),
    renderer(),
  ],
})
