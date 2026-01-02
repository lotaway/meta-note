import { RouteController } from './route-controller.interface'
import { AuthTokenController } from './auth-token.controller'
import { ChatCompletionsController } from './chat-completions.controller'

export const controllers: Set<RouteController> = new Set([
    new AuthTokenController(),
    new ChatCompletionsController(),
])

export { AuthTokenController, ChatCompletionsController }