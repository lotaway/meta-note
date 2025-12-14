import {defineConfig} from 'vite'
import react from '@vitejs/plugin-react'
import electron from "vite-plugin-electron"
import electronRenderer from "vite-plugin-electron-renderer"
import path from "path"
import pkg from './package.json'

// https://vitejs.dev/config/
export default defineConfig(({command}) => {
    const isServe = command === 'serve'
    const isBuild = command === 'build'
    const sourcemap = isServe || !!process.env.VSCODE_DEBUG

    return {
        plugins: [
            react(),
            electron([
                {
                    entry: "./src/main/desktop-main.ts",
                    onstart(options) {
                        if (process.env.VSCODE_DEBUG) {
                            console.log(/* For `.vscode/.debug.script.mjs` */'[startup] Electron App')
                        } else {
                            options.startup()
                        }
                    },
                    vite: {
                        build: {
                            sourcemap,
                            minify: isBuild,
                            outDir: 'dist-electron/main',
                            rollupOptions: {
                                external: Object.keys('dependencies' in pkg ? pkg.dependencies : {}),
                            },
                        },
                    }
                },
                {
                    entry: './src/main/preload.ts',
                    onstart(options) {
                        // Notify the Renderer-Process to reload the page when the Preload-Scripts build is complete,
                        // instead of restarting the entire Electron App.
                        options.reload()
                    },
                    vite: {
                        build: {
                            sourcemap,
                            minify: isBuild,
                            outDir: 'dist-electron/main',
                            rollupOptions: {
                                external: Object.keys('dependencies' in pkg ? pkg.dependencies : {}),
                            },
                        },
                    }
                }
            ]),
            electronRenderer({
                nodeIntegration: true
            })
        ],
        base: "./", //  定义基础路径为相对路径，否则vite生成的路径为相对网站根目录的`/xxx`，而electron需要本地路径`./xxx`
        server: {
            port: parseInt(process.env.DEV_SERVER_PORT || "30002", 10),
            // open: true
        },
        build: {
            rollupOptions: {
                // input: path.resolve(__dirname, "./index.html")
            }
        }
    }
})
