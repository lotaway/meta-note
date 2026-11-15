import axios from 'axios'
import { DIGITAL_TWIN_API_BASE_URL } from '../../../config/digital-twin'
import { installGatewayAuth } from '../../gateway-client'
import type { DigitalTwinDevice, DigitalTwinAlert, DigitalTwinStatsSummary } from './types'

const _client = axios.create({
  baseURL: DIGITAL_TWIN_API_BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
})

installGatewayAuth(_client)

export const digitalTwinApi = {
  async fetchDevices(): Promise<DigitalTwinDevice[]> {
    const { data } = await _client.get<DigitalTwinDevice[]>('/api/digital-twin/devices')
    return data ?? []
  },

  async fetchActiveAlerts(): Promise<DigitalTwinAlert[]> {
    const { data } = await _client.get<DigitalTwinAlert[]>('/api/digital-twin/alerts/active')
    return data ?? []
  },

  async fetchStatsSummary(): Promise<DigitalTwinStatsSummary> {
    const { data } = await _client.get<DigitalTwinStatsSummary>('/api/digital-twin/stats/summary')
    return data
  },

  async acknowledgeAlert(alertId: string, acknowledgedBy = 'operator'): Promise<void> {
    await _client.post(`/api/digital-twin/alert/${alertId}/acknowledge`, { acknowledgedBy })
  },

  async resolveAlert(alertId: string, resolvedBy = 'operator', solution = ''): Promise<void> {
    await _client.post(`/api/digital-twin/alert/${alertId}/resolve`, { resolvedBy, solution })
  },

  async isReachable(): Promise<boolean> {
    return _client
      .get('/api/digital-twin/stats/summary')
      .then(() => true)
      .catch(() => false)
  },
}
