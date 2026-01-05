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

    constructor() {
        const resourcesPath = app.isPackaged ? process.resourcesPath : path.join(process.cwd(), 'extraResources')

        if (process.platform === 'win32') {
            this.serverPath = path.join(resourcesPath, 'llama-server.exe')
        } else {
            this.serverPath = path.join(resourcesPath, 'llama-server')
        }

        this.modelPath = path.join(resourcesPath, 'models', 'model.gguf')
    }

    async onModuleDestroy() {
        await this.stop()
    }

    async start() {
        if (await this.checkConnection()) {
            console.log("Connected to existing LLM server (e.g. Llama.app)")
            return
        }

        if (this.process) return

        console.log(`Starting LLM Server from ${this.serverPath}`)
        console.log(`Loading model: ${this.modelPath}`)

        if (!fs.existsSync(this.serverPath)) {
            console.warn(`llama-server executable not found at: ${this.serverPath}`)
            console.warn("Assuming external Llama.app or server will be started manually.")
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
    }

    async checkConnection(): Promise<boolean> {
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

    async stop() {
        if (this.process) {
            this.process.kill()
            this.process = null
        }
    }

    async completion(prompt: string) {
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
