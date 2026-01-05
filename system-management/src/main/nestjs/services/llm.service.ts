import { Injectable, OnModuleDestroy } from '@nestjs/common'
import { spawn, ChildProcess } from 'child_process'
import path from 'path'
import fs from 'fs'
import { app } from 'electron'

@Injectable()
export class LLMService implements OnModuleDestroy {
    private process: ChildProcess | null = null;
    private port: number = 8080;
    private modelPath: string = '';
    private serverPath: string = '';
    private localProvider: string | undefined;
    private isExternalAvailable: boolean = false;
    private checkInterval: NodeJS.Timeout | null = null;

    constructor() {
        const resourcesPath = app.isPackaged ? process.resourcesPath : path.join(process.cwd(), 'extraResources')

        if (process.platform === 'win32') {
            this.serverPath = path.join(resourcesPath, 'llama-server.exe')
        } else {
            this.serverPath = path.join(resourcesPath, 'llama-server')
        }

        this.modelPath = path.join(resourcesPath, 'models', 'model.gguf')
        this.localProvider = process.env.LOCAL_LLM_PROVIDER
    }

    async onModuleDestroy() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval)
        }
        await this.stop()
    }

    async start() {
        await this.checkExternalProvider()
        if (this.localProvider) {
            this.checkInterval = setInterval(() => {
                this.checkExternalProvider()
            }, 30000)
        }
    }

    private async checkExternalProvider() {
        if (!this.localProvider) return

        try {
            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), 2000)
            const response = await fetch(`${this.localProvider}/api/show`, {
                signal: controller.signal
            }).catch(() => null)
            clearTimeout(timeoutId)

            if (response && response.ok) {
                if (!this.isExternalAvailable) {
                    console.log(`[LLMService] Connected to external LLM provider at ${this.localProvider}`)
                    if (this.process) {
                        console.log('[LLMService] Stopping local server as external provider is available')
                        this.stop()
                    }
                }
                this.isExternalAvailable = true
            } else {
                if (this.isExternalAvailable) {
                    console.warn(`[LLMService] External LLM provider lost connection`)
                }
                this.isExternalAvailable = false
            }
        } catch (e) {
            this.isExternalAvailable = false
        }
    }

    private async ensureLocalServerRunning() {
        if (this.process) return

        if (await this.checkLocalConnection()) {
            console.log("Connected to existing local LLM server (e.g. Llama.app)")
            return
        }

        console.log(`Starting LLM Server from ${this.serverPath}`)
        console.log(`Loading model: ${this.modelPath}`)

        if (!fs.existsSync(this.serverPath)) {
            console.warn(`llama-server executable not found at: ${this.serverPath}`)
            return
        }

        const args = [
            '-m', this.modelPath,
            '--port', this.port.toString(),
            '--ctx-size', '8192',
            '--parallel', '4'
        ]

        this.process = spawn(this.serverPath, args, {
            stdio: 'inherit',
            windowsHide: true
        })

        this.process.on('error', (err) => {
            console.error('Failed to start llama-server:', err)
        })

        this.process.on('exit', (code, signal) => {
            console.log(`llama-server exited with code ${code} and signal ${signal}`)
            this.process = null
        })
        let retries = 10
        while (retries > 0) {
            if (await this.checkLocalConnection()) return
            await new Promise(resolve => setTimeout(resolve, 1000))
            retries--
        }
        console.error('Failed to connect to local llama-server after startup')
    }

    async checkLocalConnection(): Promise<boolean> {
        try {
            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), 1000)
            const response = await fetch(`http://127.0.0.1:${this.port}/health`, {
                signal: controller.signal
            }).catch(() => null)
            clearTimeout(timeoutId)
            return !!(response && response.ok)
        } catch (e) {
            return false
        }
    }

    async checkConnection(): Promise<boolean> {
        return this.checkLocalConnection()
    }

    async stop() {
        if (this.process) {
            this.process.kill()
            this.process = null
        }
    }

    async completion(prompt: string) {
        if (this.isExternalAvailable && this.localProvider) {
            try {
                const response = await fetch(`${this.localProvider}/v1/chat/completions`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        model: 'local',
                        messages: [{ role: 'user', content: prompt }],
                        stream: false
                    })
                })

                if (response.ok) {
                    const data = await response.json() as any;
                    return data.choices?.[0]?.message?.content || data
                }
            } catch (err) {
                console.error('External provider failed, falling back to local:', err)
            }
        }

        await this.ensureLocalServerRunning()

        try {
            const response = await fetch(`http://127.0.0.1:${this.port}/completion`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt,
                    n_predict: 512,
                    temperature: 0.7
                })
            })
            return await response.json()
        } catch (error) {
            console.error('LLM Completion error:', error)
            throw error
        }
    }

    async embedding(content: string) {
        if (this.isExternalAvailable && this.localProvider) {
            try {
                const response = await fetch(`${this.localProvider}/v1/embeddings`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        input: content,
                        model: 'text-embedding-ada-002' // or whatever
                    })
                })
                if (response.ok) {
                    const data = await response.json() as any
                    return data.data?.[0]?.embedding || data
                }
            } catch (err) {
                console.error('External embedding failed, falling back to local:', err)
            }
        }

        await this.ensureLocalServerRunning()

        try {
            const response = await fetch(`http://127.0.0.1:${this.port}/embedding`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content
                })
            })
            const data = await response.json()
            return data.embedding
        } catch (error) {
            console.error('LLM Embedding error:', error)
            throw error
        }
    }
}
