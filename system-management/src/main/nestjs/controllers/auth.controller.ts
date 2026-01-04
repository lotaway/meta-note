export class AuthController {
    async handleToken(
        payload: { token: string; model?: string },
        setSessionToken: (token: string) => void,
        setDeepSeekSessionToken: (token: string) => void
    ): Promise<any> {
        const { token, model = 'chatgpt' } = payload

        if (!token) {
            return { status: 400, error: 'Missing token' }
        }

        if (model === 'chatgpt') {
            setSessionToken(token)
        } else if (model === 'deepseek') {
            setDeepSeekSessionToken(token)
        } else {
            return { status: 400, error: 'Unsupported model' }
        }

        console.log(`[API] Received session token for ${model} from external source`)
        return { status: 'success', model }
    }
}