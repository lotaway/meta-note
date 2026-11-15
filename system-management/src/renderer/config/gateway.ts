// All calls into server/ must go through the API gateway. Never address a
// service instance (10101 / 8082 / 8080) directly: the gateway resolves the
// service through zookeeper and is the only component that validates the JWT.
const host = import.meta.env.VITE_GATEWAY_HOST || 'localhost'
const port = import.meta.env.VITE_GATEWAY_PORT || '10081'

export const GATEWAY_BASE_URL = (
  import.meta.env.VITE_GATEWAY_URL || `http://${host}:${port}`
).replace(/\/$/, '')

// spring.cloud.gateway.discovery.locator creates /<service-id>/** routes and
// strips the service-id prefix before forwarding to the downstream service.
export const FACTORY_SERVICE_PATH = '/factory-service'
export const FACTORY_SERVICE_BASE_URL = `${GATEWAY_BASE_URL}${FACTORY_SERVICE_PATH}`

export const DIGITAL_TWIN_WS_PATH = `${FACTORY_SERVICE_PATH}/ws/digital-twin`
