import { llmService } from './llm'
import { AgentStatus, AgentResult } from './agent_runtime'

export abstract class BaseAgent {
    protected name: string
    protected llm: any

    constructor(llmModel: any, name?: string) {
        this.llm = llmModel
        this.name = name || this.constructor.name
    }

    abstract execute(inputData: any, context: any, streamCallback?: (chunk: string) => void): Promise<AgentResult>

    protected async callLLM(messages: any[], streamCallback?: (chunk: string) => void, options: any = {}): Promise<string> {
        console.debug(`LLM call started with ${messages.length} messages`)
        const MAX_LENGTH = 200

        for (let i = 0; i < messages.length; i++) {
            const msg = messages[i]
            const contentPreview = msg.content?.length > MAX_LENGTH
                ? msg.content.substring(0, MAX_LENGTH) + "..."
                : msg.content
            console.debug(`  Message ${i} [${msg.role}]: ${contentPreview}`)
        }

        try {
            let prompt = ""
            for (const msg of messages) {
                prompt += `<|im_start|>${msg.role}\n${msg.content}<|im_end|>\n`
            }
            prompt += "<|im_start|>assistant\n"

            const response = await llmService.completion(prompt)
            const responseText = response.content

            const responsePreview = responseText.length > MAX_LENGTH
                ? responseText.substring(0, MAX_LENGTH) + "..."
                : responseText
            console.debug(`LLM call completed, response length: ${responseText.length} chars`)
            console.debug(`  Response preview: ${responsePreview}`)

            return this.extractAfterThink(responseText)
        } catch (error) {
            console.error(`LLM call failed: ${error}`)
            throw error
        }
    }

    protected extractAfterThink(text: string): string {
        const thinkMatch = text.match(/<\|im_start\|>think\n([\s\S]*?)<\|im_end\|>\s*<\|im_start\|>assistant\n([\s\S]*?)<\|im_end\|>/)
        if (thinkMatch && thinkMatch[2]) {
            return thinkMatch[2].trim()
        }
        return text.trim()
    }

    protected parseJSON(text: string): any {
        try {
            // Try to extract JSON from code blocks first
            const jsonMatch = text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/)
            if (jsonMatch) {
                return JSON.parse(jsonMatch[1])
            }

            // Try to find JSON object
            const objectMatch = text.match(/\{[\s\S]*\}/)
            if (objectMatch) {
                return JSON.parse(objectMatch[0])
            }

            // Try to parse directly
            return JSON.parse(text)
        } catch (error) {
            console.error("JSON Parse Error", error)
            throw error
        }
    }

    protected logExecution(inputData: any, result: AgentResult): void {
        console.info(
            `Agent: ${this.name} | Status: ${result.status} | ` +
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

/** Q&A Agent - Handles user interaction and query understanding */
export class QAAgent extends BaseAgent {
    private SYSTEM_PROMPT = `你是一个问答理解助手。你的任务是：
1. 解析用户输入，提取核心意图
2. 识别问题类型（事实查询、操作请求、分析任务等）
3. 提取关键实体和参数
4. 如果问题模糊，识别需要澄清的点

输出JSON格式：
{
    "intent": "用户意图描述",
    "query_type": "fact_query|operation|analysis|clarification_needed",
    "entities": ["实体1", "实体2"],
    "parameters": {"参数名": "参数值"},
    "clarification": "如果需要澄清，说明需要澄清什么",
    "processed_query": "处理后的清晰问题"
}`;

    constructor(llmModel: any) {
        super(llmModel, "QAAgent")
    }

    async execute(inputData: any, context: any, streamCallback?: (chunk: string) => void): Promise<AgentResult> {
        const query = String(inputData)

        // Store original query in context
        context.original_query = query

        let messages: any[]

        // Check for session files and append to query
        if (context.session_files) {
            let filesContent = "\n\n用户提供了以下文件作为上下文：\n"
            for (const fileInfo of context.session_files) {
                filesContent += `文件: ${fileInfo.name}\n内容:\n${fileInfo.content}\n\n`
            }

            messages = [
                { role: "system", content: this.SYSTEM_PROMPT },
                { role: "user", content: `用户问题：${query}${filesContent}` },
            ]
        } else {
            messages = [
                { role: "system", content: this.SYSTEM_PROMPT },
                { role: "user", content: `用户问题：${query}` },
            ]
        }

        try {
            const response = await this.callLLM(messages, streamCallback, {
                temperature: 0.1,
                max_new_tokens: 1000
            })

            const parsed = this.parseJSON(response)

            // Check if clarification needed
            if (parsed.query_type === "clarification_needed") {
                return {
                    status: AgentStatus.NEEDS_HUMAN,
                    data: {
                        question: parsed.clarification || "请提供更多信息",
                        original_query: query,
                    },
                    message: "需要用户澄清问题",
                    next_agent: "qa",
                }
            }

            // Store parsed query in context
            context.parsed_query = parsed

            return {
                status: AgentStatus.SUCCESS,
                data: parsed,
                message: `成功解析查询: ${parsed.intent || 'unknown'}`,
                next_agent: "planning",
            }

        } catch (error) {
            console.error(`Query parsing failed: ${error}`)
            return {
                status: AgentStatus.FAILURE,
                data: null,
                message: `查询解析失败: ${error}`
            }
        }
    }
}

/** Planning Agent - Decomposes complex queries into executable subtasks */
export class PlanningAgent extends BaseAgent {
    private SYSTEM_PROMPT = `你是一个任务规划助手。你的任务是：
1. 将复杂查询分解为可执行的子任务
2. 确定每个子任务所需的工具/Agent（LLM、RAG、MCP）
3. 创建带有依赖关系的执行计划
4. 检查任务完成状态

可用任务类型：
- llm: 直接LLM回答
- rag: 检索知识（尚未实现）
- mcp: 调用外部工具

输出JSON格式：
{
    "plan": [
        {
            "task_id": "task_1",
            "description": "任务描述",
            "agent_type": "llm|rag|mcp",
            "tool_name": "tool_name if mcp",
            "dependencies": ["dependency_task_id"],
            "priority": 1
        }
    ],
    "reasoning": "规划推理"
}

如果完成：
{
    "completed": true,
    "final_answer": "最终答案",
    "reasoning": "完成推理"
}`;

    constructor(llmModel: any) {
        super(llmModel, "PlanningAgent")
    }

    async execute(inputData: any, context: any, streamCallback?: (chunk: string) => void): Promise<AgentResult> {
        const parsedQuery = context.parsed_query || {}
        const taskResults = context.task_results || []
        const mcpTools = context.mcp_tools || []
        const sessionFiles = context.session_files || []

        let messages: any[]

        if (inputData.suggestion) {
            // Re-planning after failure
            messages = [
                { role: "system", content: this.SYSTEM_PROMPT },
                {
                    role: "user", content: `
原始问题：${context.original_query || ''}
之前尝试的任务：${inputData.original_task || ''}
失败原因：${inputData.suggestion || ''}

${this.formatMCPToolsInfo(mcpTools)}
${this.formatFilesInfo(sessionFiles)}

请重新规划任务，只使用可用的工具（LLM、RAG或已注册的MCP工具）。
`},
            ]
        } else if (taskResults.length > 0) {
            // Evaluate if task is complete
            messages = [
                { role: "system", content: this.SYSTEM_PROMPT },
                {
                    role: "user", content: `
原始问题：${context.original_query || ''}
已完成的任务结果：
${this.formatTaskResults(taskResults)}

${this.formatMCPToolsInfo(mcpTools)}
${this.formatFilesInfo(sessionFiles)}

请判断是否已经完成用户的问题，如果完成则输出final_answer，否则规划下一步任务。
`},
            ]
        } else {
            // Initial planning
            messages = [
                { role: "system", content: this.SYSTEM_PROMPT },
                {
                    role: "user", content: `
用户问题：${context.original_query || ''}
问题意图：${parsedQuery.intent || ''}
问题类型：${parsedQuery.query_type || ''}

${this.formatMCPToolsInfo(mcpTools)}
${this.formatFilesInfo(sessionFiles)}

请为这个问题创建执行计划。
`},
            ]
        }

        try {
            const response = await this.callLLM(messages, streamCallback, {
                temperature: 0.2,
                max_new_tokens: 2000
            })

            const planData = this.parseJSON(response)

            // Check if completed
            if (planData.completed) {
                return {
                    status: AgentStatus.COMPLETE,
                    data: planData.final_answer || "",
                    message: "任务已完成",
                    metadata: { reasoning: planData.reasoning || "" },
                }
            }

            // Store plan in context
            context.current_plan = planData.plan || []
            context.plan_reasoning = planData.reasoning || ""

            // Get first task to execute
            const plan = planData.plan || []
            console.info(`Generated plan with ${plan.length} tasks`)

            if (plan.length === 0) {
                console.error("Planning failed: LLM returned empty plan")

                // Fallback: create a simple LLM task
                console.warn("Falling back to simple LLM task")
                const fallbackTask = {
                    task_id: "fallback_llm_1",
                    description: `使用LLM直接回答: ${context.original_query || inputData}`,
                    agent_type: "llm",
                    dependencies: [],
                    priority: 1,
                }

                return {
                    status: AgentStatus.SUCCESS,
                    data: fallbackTask,
                    message: "使用备用方案: LLM直接回答",
                    next_agent: "router",
                    metadata: { plan: [fallbackTask], fallback: true },
                }
            }

            // Find first task with no dependencies or satisfied dependencies
            const nextTask = this.getNextTask(plan, context.completed_tasks || [])

            if (!nextTask) {
                const completedTasks = context.completed_tasks || []
                console.error("Planning failed: No executable task found")

                if (completedTasks.length === 0) {
                    console.warn("No tasks completed yet, falling back to simple LLM task")
                    const fallbackTask = {
                        task_id: "fallback_llm_1",
                        description: `使用LLM直接回答: ${context.original_query || inputData}`,
                        agent_type: "llm",
                        dependencies: [],
                        priority: 1,
                    }

                    return {
                        status: AgentStatus.SUCCESS,
                        data: fallbackTask,
                        message: "使用备用方案: LLM直接回答",
                        next_agent: "router",
                        metadata: { plan: [fallbackTask], fallback: true },
                    }
                }

                return {
                    status: AgentStatus.FAILURE,
                    data: null,
                    message: "规划失败：无法找到可执行的任务",
                }
            }

            console.info(`Next task selected: ${nextTask.task_id} - ${nextTask.description}`)

            return {
                status: AgentStatus.SUCCESS,
                data: nextTask,
                message: `规划完成，下一步: ${nextTask.description}`,
                next_agent: "router",
                metadata: { plan },
            }

        } catch (error) {
            console.error(`Planning failed with exception: ${error}`)
            return {
                status: AgentStatus.FAILURE,
                data: null,
                message: `规划失败: ${error}`
            }
        }
    }

    private formatTaskResults(results: any[]): string {
        return results.map((result, i) =>
            `${i + 1}. ${result.description || 'Unknown'}: ${result.result || 'No result'}`
        ).join("\n")
    }

    private formatMCPToolsInfo(tools: any[]): string {
        if (tools.length === 0) return "没有可用的MCP工具。"
        return `可用的MCP工具：\n${tools.map(tool => `- ${tool.name}: ${tool.description || 'No description'}`).join("\n")}`
    }

    private formatFilesInfo(files: any[]): string {
        if (files.length === 0) return "没有提供文件。"
        return `提供的文件：\n${files.map(file => `- ${file.name}`).join("\n")}`
    }

    private getNextTask(plan: any[], completedTasks: string[]): any {
        for (const task of plan) {
            const taskId = task.task_id || ""
            if (completedTasks.includes(taskId)) {
                continue
            }

            // Check dependencies
            const dependencies = task.dependencies || []
            if (dependencies.every((dep: string) => completedTasks.includes(dep))) {
                return task
            }
        }
        return null
    }
}

/** Router Agent - Routes tasks to appropriate task agents */
export class RouterAgent extends BaseAgent {
    constructor(llmModel: any) {
        super(llmModel, "RouterAgent")
    }

    async execute(inputData: any, context: any, streamCallback?: (chunk: string) => void): Promise<AgentResult> {
        const task = inputData

        if (!task.agent_type) {
            return {
                status: AgentStatus.FAILURE,
                data: null,
                message: "任务缺少agent_type字段"
            }
        }

        // Route based on agent_type
        let nextAgent: string
        switch (task.agent_type) {
            case "llm":
                nextAgent = "llm"
                break
            case "rag":
                nextAgent = "rag"
                break
            case "mcp":
                nextAgent = "mcp"
                break
            default:
                return {
                    status: AgentStatus.FAILURE,
                    data: null,
                    message: `未知的agent类型: ${task.agent_type}`
                }
        }

        return {
            status: AgentStatus.SUCCESS,
            data: task,
            message: `路由到 ${nextAgent} agent`,
            next_agent: nextAgent
        }
    }
}

/** Risk Assessment Agent */
export class RiskAgent extends BaseAgent {
    private SYSTEM_PROMPT = `你是一个风险评估助手。你的任务是评估即将执行的操作的风险级别。`;

    constructor(llmModel: any) {
        super(llmModel, "RiskAgent")
    }

    async execute(inputData: any, context: any, streamCallback?: (chunk: string) => void): Promise<AgentResult> {
        // Simplified risk assessment - always approve for now
        return {
            status: AgentStatus.SUCCESS,
            data: { approved: true, risk_level: "low" },
            message: "风险评估完成，风险级别：低",
            next_agent: "verification"
        }
    }
}

/** Verification Agent */
export class VerificationAgent extends BaseAgent {
    constructor(llmModel: any) {
        super(llmModel, "VerificationAgent")
    }

    async execute(inputData: any, context: any, streamCallback?: (chunk: string) => void): Promise<AgentResult> {
        // Simplified verification - always approve for now
        return {
            status: AgentStatus.SUCCESS,
            data: { verified: true },
            message: "验证完成",
            next_agent: "planning"
        }
    }
}

/** LLM Task Agent */
export class LLMAgent extends BaseAgent {
    constructor(llmModel: any) {
        super(llmModel, "LLMAgent")
    }

    async execute(inputData: any, context: any, streamCallback?: (chunk: string) => void): Promise<AgentResult> {
        const task = inputData
        const query = context.original_query || task.description

        const messages = [
            { role: "system", content: "你是一个有帮助的AI助手。请根据用户的问题提供准确、有用的回答。" },
            { role: "user", content: query }
        ]

        try {
            const response = await this.callLLM(messages, streamCallback)

            // Mark task as completed
            if (!context.completed_tasks) {
                context.completed_tasks = []
            }
            context.completed_tasks.push(task.task_id)

            return {
                status: AgentStatus.SUCCESS,
                data: { result: response, task_id: task.task_id },
                message: "LLM任务完成",
                next_agent: "planning"
            }

        } catch (error) {
            return {
                status: AgentStatus.FAILURE,
                data: null,
                message: `LLM任务失败: ${error}`
            }
        }
    }
}

/** RAG Task Agent (Placeholder) */
export class RAGAgent extends BaseAgent {
    constructor(llmModel: any) {
        super(llmModel, "RAGAgent")
    }

    async execute(inputData: any, context: any, streamCallback?: (chunk: string) => void): Promise<AgentResult> {
        // Placeholder implementation
        return {
            status: AgentStatus.SUCCESS,
            data: { result: "RAG功能尚未实现", task_id: inputData.task_id },
            message: "RAG任务完成（占位符）",
            next_agent: "planning"
        }
    }
}

/** MCP Task Agent (Placeholder) */
export class MCPAgent extends BaseAgent {
    constructor(llmModel: any) {
        super(llmModel, "MCPAgent")
    }

    async execute(inputData: any, context: any, streamCallback?: (chunk: string) => void): Promise<AgentResult> {
        // Placeholder implementation
        return {
            status: AgentStatus.SUCCESS,
            data: { result: "MCP功能尚未实现", task_id: inputData.task_id },
            message: "MCP任务完成（占位符）",
            next_agent: "planning"
        }
    }
}

/** Main Agent Service */
export class AgentService {
    private runtime: any // Will be AgentRuntime instance
    private llmModel: any

    constructor() {
        this.llmModel = llmService // Use existing LLM service
        this.initializeRuntime()
    }

    private initializeRuntime(): void {
        // This will be implemented once we import AgentRuntime
        // For now, we'll keep the existing simple implementation
    }

    async run(query: string): Promise<any> {
        console.log("Agent System Started with query:", query)
        const context = { original_query: query, task_results: [] }

        // Simple implementation for now - will be replaced with full runtime
        const qaAgent = new QAAgent(this.llmModel)
        const planningAgent = new PlanningAgent(this.llmModel)

        try {
            // Parse query
            const qaResult = await qaAgent.execute(query, context)
            if (qaResult.status === AgentStatus.FAILURE) {
                throw new Error(qaResult.message)
            }

            // Create plan
            const planResult = await planningAgent.execute(qaResult.data, context)

            if (planResult.status === AgentStatus.COMPLETE) {
                return planResult.data
            }

            return "Task processing requires full runtime implementation"

        } catch (error) {
            throw new Error(`Agent execution failed: ${error}`)
        }
    }
}

export const agentService = new AgentService()
