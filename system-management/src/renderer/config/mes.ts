import { FACTORY_SERVICE_BASE_URL } from './gateway'

// MES / SCADA / traceability endpoints are exposed by the same factory-service
// and must use the same gateway route as the digital-twin endpoints.
export const MES_API_BASE_URL = FACTORY_SERVICE_BASE_URL
