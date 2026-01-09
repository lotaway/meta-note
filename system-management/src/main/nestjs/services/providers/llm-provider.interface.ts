export interface LLMProvider {
    checkConnection(): Promise<boolean>
    completion(prompt: string): Promise<any>
    embedding(content: string): Promise<number[]>
    start(): Promise<void>
    isStop(): boolean
    stop(): Promise<void>
}
