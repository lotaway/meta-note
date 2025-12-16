import Database from 'better-sqlite3'
import { app } from 'electron'
import path from 'path'
import { llmService } from './llm'

export interface Document {
    id?: number
    content: string
    metadata: string
    embedding?: number[]
}

export class RAGService {
    private db: Database.Database

    constructor() {
        const dbPath = path.join(app.getPath('userData'), 'rag.db')
        this.db = new Database(dbPath)
        this.initDB()
    }

    private initDB() {
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS documents (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                content TEXT,
                metadata TEXT,
                embedding BLOB
            )
        `)
    }

    async addDocument(content: string, metadata: any = {}) {
        const chunks = this.splitText(content)

        for (const chunk of chunks) {
            const embedding = await llmService.embedding(chunk)

            const stmt = this.db.prepare('INSERT INTO documents (content, metadata, embedding) VALUES (?, ?, ?)')
            stmt.run(chunk, JSON.stringify(metadata), Buffer.from(new Float32Array(embedding).buffer))
        }
    }

    async search(query: string, limit: number = 5): Promise<Document[]> {
        const queryEmbedding = await llmService.embedding(query)
        const queryVec = new Float32Array(queryEmbedding)

        const docs = this.db.prepare('SELECT * FROM documents').all()

        const scoredDocs = docs.map((doc: any) => {
            const embedding = new Float32Array(doc.embedding.buffer, doc.embedding.byteOffset, doc.embedding.byteLength / 4)
            const score = this.cosineSimilarity(queryVec, embedding)
            return { ...doc, score }
        })

        scoredDocs.sort((a: any, b: any) => b.score - a.score)
        return scoredDocs.slice(0, limit)
    }

    private splitText(text: string, chunkSize: number = 500): string[] {
        const chunks = []
        for (let i = 0; i < text.length; i += chunkSize) {
            chunks.push(text.slice(i, i + chunkSize))
        }
        return chunks
    }

    private cosineSimilarity(a: Float32Array, b: Float32Array): number {
        let dot = 0
        let magA = 0
        let magB = 0
        for (let i = 0; i < a.length; i++) {
            dot += a[i] * b[i]
            magA += a[i] * a[i]
            magB += b[i] * b[i]
        }
        return dot / (Math.sqrt(magA) * Math.sqrt(magB))
    }
}

export const ragService = new RAGService()
