/** Agent System Demo - Test the complete agent implementation */

import { integratedAgentService, createAgentService, RuntimeStatus } from './agent_integration'

async function demoBasicQuery() {
    console.log("=== Agent System Demo - Basic Query ===")

    try {
        const result = await integratedAgentService.execute("什么是人工智能？")

        console.log("Execution completed with status:", result.status)
        console.log("Final result:", result)

        if (result.status === RuntimeStatus.COMPLETED) {
            console.log("✅ Success! Final answer:", result.context.final_answer)
        } else if (result.status === RuntimeStatus.FAILED) {
            console.log("❌ Failed:", result.errorMessage)
        }

    } catch (error) {
        console.error("Demo failed:", error)
    }
}

async function demoWithSession() {
    console.log("\n=== Agent System Demo - With Session ===")

    const sessionId = "demo_session_" + Date.now()
    const agentService = createAgentService(sessionId, 5)

    try {
        // First query
        console.log("First query: '帮我规划一个学习计划'")
        const result1 = await agentService.execute("帮我规划一个学习计划")
        console.log("First execution status:", result1.status)

        // Second query in same session
        console.log("Second query: '添加数学学习内容'")
        const result2 = await agentService.execute("添加数学学习内容")
        console.log("Second execution status:", result2.status)

        console.log("Session ID:", agentService.getSessionId())
        console.log("Current state:", agentService.getCurrentState())

    } catch (error) {
        console.error("Session demo failed:", error)
    }
}

async function demoHumanInteraction() {
    console.log("\n=== Agent System Demo - Human Interaction ===")

    const agentService = createAgentService()

    // Set up human callback
    agentService.setHumanCallback(async (data) => {
        console.log("🤖 Human intervention requested:", data)

        // Simulate human approval after 1 second
        setTimeout(async () => {
            console.log("👤 Human approving operation...")
            await agentService.resume({
                approved: true,
                feedback: "继续执行",
                data: "继续处理"
            })
        }, 1000)
    })

    try {
        // This query might trigger human intervention
        const result = await agentService.execute("我需要一个复杂的多步骤任务规划")
        console.log("Human interaction demo result:", result.status)

    } catch (error) {
        console.error("Human interaction demo failed:", error)
    }
}

// Run all demos
async function runAllDemos() {
    console.log("🚀 Starting Agent System Demos...\n")

    await demoBasicQuery()
    await demoWithSession()
    await demoHumanInteraction()

    console.log("\n🎉 All demos completed!")
}

// Export for use in other files
export { runAllDemos }

// Run if this file is executed directly
if (require.main === module) {
    runAllDemos().catch(console.error)
}
