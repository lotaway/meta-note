import { FACTORY_SERVICE_BASE_URL } from './gateway'

// The digital-twin REST API is reached through gateway:10081/factory-service,
// never through factory-service:10101 directly.
export const DIGITAL_TWIN_API_BASE_URL = FACTORY_SERVICE_BASE_URL
