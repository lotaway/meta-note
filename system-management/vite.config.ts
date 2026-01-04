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
  plugins: [
    react(),
    electron([
      {
        entry: 'src/main/desktop-main.ts',
        vite: {
          build: {
            outDir: 'dist-electron/main',
            minify: false,
            rollupOptions: {
              external: [
                'better-sqlite3',
                '@electron/remote',
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
              external: ['better-sqlite3', '@electron/remote']
            }
          },
        },
      },
    ]),
    renderer(),
  ],
})
