import axios from 'axios'
import { MES_API_BASE_URL } from '../../../config/mes'
import { installGatewayAuth } from '../../gateway-client'
import type { TelemetryRecord, DeviceCommand, TraceRecord, TraceChain } from './types'

const _client = axios.create({
  baseURL: MES_API_BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
})

installGatewayAuth(_client)

export const mesApi = {
  async fetchTelemetry(equipmentCode: string, limit = 10): Promise<TelemetryRecord[]> {
    const { data } = await _client.get<TelemetryRecord[]>(`/api/mes/scada/telemetry/${equipmentCode}`, {
      params: { limit },
    })
    return data ?? []
  },

  async dispatchCommand(equipmentCode: string, commandType: string, payload: string, createdBy = 'operator') {
    const { data } = await _client.post<DeviceCommand>('/api/mes/scada/commands', {
      equipmentCode, commandType, payload, createdBy,
    })
    return data
  },

  async fetchCommands(equipmentCode: string): Promise<DeviceCommand[]> {
    const { data } = await _client.get<DeviceCommand[]>(`/api/mes/scada/commands/${equipmentCode}`)
    return data ?? []
  },

  async forwardTrace(traceCode: string): Promise<TraceRecord[]> {
    const { data } = await _client.get<TraceRecord[]>('/api/mes/trace/records/forward', {
      params: { traceCode },
    })
    return data ?? []
  },

  async backwardTrace(traceCode: string): Promise<TraceRecord[]> {
    const { data } = await _client.get<TraceRecord[]>('/api/mes/trace/records/backward', {
      params: { traceCode },
    })
    return data ?? []
  },

  async getTraceChain(traceCode: string): Promise<TraceChain | null> {
    try {
      const { data } = await _client.get<TraceChain>('/api/mes/trace/records/trace-chain', {
        params: { traceCode },
      })
      return data
    } catch (e) {
      console.error('Failed to fetch trace chain:', e)
      return null
    }
  },

  async fetchTraceRecords(params?: {
    productCode?: string
    batchNo?: string
    sn?: string
  }): Promise<TraceRecord[]> {
    const { data } = await _client.get<TraceRecord[]>('/api/mes/trace/records', { params })
    return data ?? []
  },
}
