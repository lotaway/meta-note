import { RouteController } from './route-controller.interface'
import { AuthTokenController } from './auth-token.controller'
import { ChatCompletionsController, HealthController, TagsController } from './llm.controller'

export const controllers: Set<RouteController> = new Set([
    new AuthTokenController(),
    new HealthController(),
    new TagsController(),
    new ChatCompletionsController(),
])

export { AuthTokenController, HealthController, TagsController, ChatCompletionsController }