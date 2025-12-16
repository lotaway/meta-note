/** Agent Runtime System - Core Execution Engine */

import { ContextStorage } from './context_storage'

// Define agent types here to avoid circular dependencies
export enum AgentStatus {
    SUCCESS = "success",
    FAILURE = "failure",
    NEEDS_RETRY = "needs_retry",
    NEEDS_HUMAN = "needs_human",
    CONTINUE = "continue",
    COMPLETE = "complete"
}

export interface AgentResult {
    status: AgentStatus
    data: any
    message: string
    metadata?: any
    next_agent?: string
}

export enum RuntimeStatus {
    RUNNING = "running",
    WAITING_HUMAN = "waiting_human",
    MAX_ITERATIONS = "max_iterations",
    COMPLETED = "completed",
    FAILED = "failed"
}

export class RuntimeState {
    status: RuntimeStatus = RuntimeStatus.RUNNING;
    iterationCount: number = 0;
    iterationCountRound: number = 1;
    maxIterations: number
    currentAgent: string = "qa";
    context: Record<string, any> = {};
    history: Array<Record<string, any>> = [];
    errorMessage: string = "";

    constructor(maxIterations: number = 10) {
        this.maxIterations = maxIterations
    }

    toDict(): Record<string, any> {
        return {
            status: this.status,
            iteration_count: this.iterationCount,
            iteration_count_round: this.iterationCountRound,
            max_iterations: this.maxIterations,
            current_agent: this.currentAgent,
            context: this.context,
            history: this.history,
            error_message: this.errorMessage
        }
    }

    static fromDict(data: Record<string, any>): RuntimeState {
        const state = new RuntimeState(data.max_iterations)
        state.status = data.status as RuntimeStatus
        state.iterationCount = data.iteration_count
        state.iterationCountRound = data.iteration_count_round
        state.currentAgent = data.current_agent
        state.context = data.context || {}
        state.history = data.history || []
        state.errorMessage = data.error_message || ""
        return state
    }
}

export class AgentRuntime {
    private llm: any
    private agents: Map<string, BaseAgent> = new Map();
    private state: RuntimeState
    private contextStorage?: ContextStorage
    private sessionId?: string
    private humanCallback?: (data: any) => Promise<void> | void

    constructor(
        llmModel: any,
        maxIterations: number,
        contextStorage?: ContextStorage,
        sessionId?: string
    ) {
        this.llm = llmModel
        this.state = new RuntimeState(maxIterations)
        this.contextStorage = contextStorage
        this.sessionId = sessionId

        if (this.sessionId && this.contextStorage) {
            this.loadState().then(loadedState => {
                if (loadedState) {
                    this.state = loadedState
                    console.info(`Loaded existing state for session ${this.sessionId}`)
                }
            })
        }
    }

    registerAgent(name: string, agent: BaseAgent): void {
        this.agents.set(name, agent)
        console.info(`Registered agent: ${name}`)
    }

    setHumanCallback(callback: (data: any) => Promise<void> | void): void {
        this.humanCallback = callback
    }

    private async saveState(): Promise<boolean> {
        if (!this.sessionId || !this.contextStorage) {
            return false
        }

        try {
            const stateData = this.state.toDict()
            const success = await this.contextStorage.save(this.sessionId, stateData)
            if (success) {
                console.debug(`Saved state for session ${this.sessionId}`)
            }
            return success
        } catch (error) {
            console.error(`Failed to save state: ${error}`)
            return false
        }
    }

    private async loadState(): Promise<RuntimeState | null> {
        if (!this.sessionId || !this.contextStorage) {
            return null
        }

        try {
            const stateData = await this.contextStorage.load(this.sessionId)
            if (stateData) {
                return RuntimeState.fromDict(stateData)
            }
            return null
        } catch (error) {
            console.error(`Failed to load state: ${error}`)
            return null
        }
    }

    async execute(
        initialInput: any,
        startAgent: string = "qa",
        streamCallback?: (chunk: string) => void,
        initialContext?: Record<string, any>
    ): Promise<RuntimeState> {
        console.info("=".repeat(80))
        console.info("Starting new agent workflow execution")
        console.info(`  Start agent: ${startAgent}`)
        console.info(`  Max iterations: ${this.state.maxIterations}`)

        const inputPreview = String(initialInput).length > 200
            ? String(initialInput).substring(0, 200) + "..."
            : String(initialInput)
        console.info(`  Initial input: ${inputPreview}`)
        console.info("=".repeat(80))

        this.state = new RuntimeState(this.state.maxIterations)
        this.state.context["initial_input"] = initialInput
        if (initialContext) {
            this.state.context = { ...this.state.context, ...initialContext }
        }
        this.state.currentAgent = startAgent

        const result = await this.runLoop(initialInput, streamCallback)

        // Save final state
        await this.saveState()

        return result
    }

    async resume(decisionData: Record<string, any>, streamCallback?: (chunk: string) => void): Promise<RuntimeState> {
        if (this.state.status !== RuntimeStatus.WAITING_HUMAN) {
            throw new Error(
                `Cannot resume: Runtime is in ${this.state.status} state, not waiting_human`
            )
        }

        if (decisionData.approved) {
            this.state.status = RuntimeStatus.RUNNING
            console.info("Resuming execution after human approval")

            // Use provided data if available, otherwise use data from last history entry or context
            const currentInput = decisionData.data

            // If feedback provided, add to context
            if (decisionData.feedback) {
                this.state.context["human_feedback"] = decisionData.feedback
            }

            const result = await this.runLoop(currentInput, streamCallback)

            // Save state after resume
            await this.saveState()

            return result
        } else {
            this.state.status = RuntimeStatus.FAILED
            this.state.errorMessage = `Human rejected operation: ${decisionData.feedback || 'No reason provided'}`
            console.info(this.state.errorMessage)
            return this.state
        }
    }

    async resumeAfterMaxIterations(streamCallback?: (chunk: string) => void): Promise<RuntimeState> {
        if (this.state.status !== RuntimeStatus.MAX_ITERATIONS) {
            throw new Error(
                `Cannot resume: Runtime is in ${this.state.status} state, not max_iterations`
            )
        }

        // Reset iteration count for new round
        this.state.iterationCount = 0
        this.state.status = RuntimeStatus.RUNNING
        this.state.iterationCountRound++
        console.info(
            `Resuming execution after max_iterations (round ${this.state.iterationCountRound})`
        )

        // Get the last input from context or history
        let currentInput: any = null
        if (this.state.history.length > 0) {
            const lastEntry = this.state.history[this.state.history.length - 1]
            currentInput = lastEntry.data
        }

        if (currentInput === null) {
            currentInput = this.state.context.initial_input
        }

        const result = await this.runLoop(currentInput, streamCallback)

        // Save state after resume
        await this.saveState()

        return result
    }

    private updateProcessFile(plan: Array<Record<string, any>>, completedTasks: string[]): void {
        try {
            const originalQuery = this.state.context.original_query || "任务清单"
            const title = originalQuery.length > 50
                ? originalQuery.substring(0, 50) + "..."
                : originalQuery

            const content = [`# ${title}`]

            for (const task of plan) {
                const taskId = task.task_id || ""
                const description = task.description || ""
                const isCompleted = completedTasks.includes(taskId)
                const checkbox = isCompleted ? "[x]" : "[ ]"

                content.push(`- ${checkbox} ${description}`)
            }

            const processChecklist = content.join("\n")
            this.state.context.process_checklist = processChecklist
            console.info(`\nExample process.md content stored in context:\n${processChecklist}`)

        } catch (error) {
            console.error(`Failed to update process checklist: ${error}`)
        }
    }

    private async runLoop(currentInput: any, streamCallback?: (chunk: string) => void): Promise<RuntimeState> {
        console.debug(`Entering execution loop with status: ${this.state.status}`)

        while (this.state.status === RuntimeStatus.RUNNING) {
            if (this.state.iterationCount >= this.state.maxIterations) {
                this.state.status = RuntimeStatus.MAX_ITERATIONS
                console.info(`Max iterations reached (${this.state.maxIterations})`)

                if (this.humanCallback) {
                    const humanData = {
                        type: "max_iterations",
                        iteration_count: this.state.iterationCount,
                        context: this.state.context,
                        history: this.state.history
                    }

                    if (typeof this.humanCallback === 'function') {
                        await this.humanCallback(humanData)
                    }
                }

                break
            }

            this.state.iterationCount++
            console.info(`Iteration ${this.state.iterationCount}/${this.state.maxIterations}`)

            const agent = this.agents.get(this.state.currentAgent)
            if (!agent) {
                this.state.status = RuntimeStatus.FAILED
                this.state.errorMessage = `Agent not found: ${this.state.currentAgent}`
                console.error(this.state.errorMessage)
                break
            }

            try {
                const result = await agent.execute(currentInput, this.state.context)
                this.logExecution(agent, currentInput, result)

                // Add to history
                this.state.history.push({
                    agent: this.state.currentAgent,
                    input: currentInput,
                    result: result,
                    timestamp: new Date().toISOString()
                })

                // Handle agent result
                switch (result.status) {
                    case AgentStatus.SUCCESS:
                    case AgentStatus.CONTINUE:
                        if (result.next_agent) {
                            this.state.currentAgent = result.next_agent
                            currentInput = result.data
                        } else {
                            this.state.status = RuntimeStatus.COMPLETED
                        }
                        break

                    case AgentStatus.NEEDS_HUMAN:
                        this.state.status = RuntimeStatus.WAITING_HUMAN
                        if (this.humanCallback) {
                            const humanData = {
                                type: "human_intervention",
                                question: result.data?.question,
                                context: this.state.context,
                                agent: this.state.currentAgent
                            }

                            if (typeof this.humanCallback === 'function') {
                                await this.humanCallback(humanData)
                            }
                        }
                        break

                    case AgentStatus.COMPLETE:
                        this.state.status = RuntimeStatus.COMPLETED
                        break

                    case AgentStatus.FAILURE:
                        this.state.status = RuntimeStatus.FAILED
                        this.state.errorMessage = result.message
                        break

                    case AgentStatus.NEEDS_RETRY:
                        // For retry, we keep the same agent and input
                        console.info(`Retrying agent: ${this.state.currentAgent}`)
                        break
                }

                // Update process file if planning data exists
                if (result.metadata?.plan && this.state.context.completed_tasks) {
                    this.updateProcessFile(result.metadata.plan, this.state.context.completed_tasks)
                }

                // Save state after each iteration
                await this.saveState()

            } catch (error) {
                this.state.status = RuntimeStatus.FAILED
                this.state.errorMessage = `Agent execution failed: ${error}`
                console.error(`Agent execution failed:`, error)
                break
            }
        }

        return this.state
    }

    private logExecution(agent: BaseAgent, inputData: any, result: AgentResult): void {
        console.info(
            `Agent: ${agent.constructor.name} | Status: ${result.status} | ` +
            `Next: ${result.next_agent || 'None'} | Message: ${result.message}`
        )

        if (result.metadata) {
            console.debug(`  Metadata: ${JSON.stringify(result.metadata)}`)
        }

        if (result.data) {
            const dataPreview = String(result.data).length > 300
                ? String(result.data).substring(0, 300) + "..."
                : String(result.data)
            console.debug(`  Data: ${dataPreview}`)
        }
    }
}
