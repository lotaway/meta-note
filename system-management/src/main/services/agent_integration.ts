/** Integrated Agent System - Complete Implementation */

import { llmService } from './llm'
import { MemoryContextStorage, ContextStorage } from './context_storage'

// Re-export all agent types and classes
export {
    AgentStatus,
    AgentResult,
    BaseAgent,
    QAAgent,
    PlanningAgent,
    RouterAgent,
    RiskAgent,
    VerificationAgent,
    LLMAgent,
    RAGAgent,
    MCPAgent
} from './agent_service'

export {
    RuntimeStatus,
    RuntimeState,
    AgentRuntime
} from './agent_runtime'

/** Complete Agent System with Full Runtime Integration */
export class IntegratedAgentService {
    private runtime: AgentRuntime
    private contextStorage: ContextStorage
    private llmModel: any

    constructor(sessionId?: string, maxIterations: number = 10) {
        this.llmModel = llmService
        this.contextStorage = new MemoryContextStorage() // Default to memory storage

        // Initialize runtime
        this.runtime = new AgentRuntime(
            this.llmModel,
            maxIterations,
            this.contextStorage,
            sessionId
        )

        this.registerAllAgents()
    }

    private registerAllAgents(): void {
        // Register all agents with the runtime
        this.runtime.registerAgent("qa", new QAAgent(this.llmModel))
        this.runtime.registerAgent("planning", new PlanningAgent(this.llmModel))
        this.runtime.registerAgent("router", new RouterAgent(this.llmModel))
        this.runtime.registerAgent("risk", new RiskAgent(this.llmModel))
        this.runtime.registerAgent("verification", new VerificationAgent(this.llmModel))
        this.runtime.registerAgent("llm", new LLMAgent(this.llmModel))
        this.runtime.registerAgent("rag", new RAGAgent(this.llmModel))
        this.runtime.registerAgent("mcp", new MCPAgent(this.llmModel))
    }

    setHumanCallback(callback: (data: any) => Promise<void> | void): void {
        this.runtime.setHumanCallback(callback)
    }

    setContextStorage(storage: ContextStorage): void {
        this.contextStorage = storage
        // Re-initialize runtime with new storage
        this.runtime = new AgentRuntime(
            this.llmModel,
            this.runtime.state.maxIterations,
            this.contextStorage,
            this.runtime.sessionId
        )
        this.registerAllAgents()
    }

    async execute(
        query: string,
        startAgent: string = "qa",
        streamCallback?: (chunk: string) => void,
        initialContext?: Record<string, any>
    ): Promise<RuntimeState> {
        console.info("Starting integrated agent system execution")
        return await this.runtime.execute(query, startAgent, streamCallback, initialContext)
    }

    async resume(
        decisionData: Record<string, any>,
        streamCallback?: (chunk: string) => void
    ): Promise<RuntimeState> {
        return await this.runtime.resume(decisionData, streamCallback)
    }

    async resumeAfterMaxIterations(
        streamCallback?: (chunk: string) => void
    ): Promise<RuntimeState> {
        return await this.runtime.resumeAfterMaxIterations(streamCallback)
    }

    getCurrentState(): RuntimeState {
        return this.runtime.state
    }

    getSessionId(): string | undefined {
        return this.runtime.sessionId
    }
}

/** Factory function to create agent service instances */
export function createAgentService(sessionId?: string, maxIterations: number = 10): IntegratedAgentService {
    return new IntegratedAgentService(sessionId, maxIterations)
}

/** Default agent service instance */
export const integratedAgentService = new IntegratedAgentService()
