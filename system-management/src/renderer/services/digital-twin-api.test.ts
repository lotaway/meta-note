import { describe, it, expect, vi, beforeEach } from 'vitest'
import axios from 'axios'
import { digitalTwinApi, mapApiDevice, mapApiAlert, parseWsEventData, type ChartPoint } from '../services/digital-twin-api'

const { mockGet, mockPost } = vi.hoisted(() => ({
  mockGet: vi.fn(),
  mockPost: vi.fn(),
}))

vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => ({
      get: mockGet,
      post: mockPost,
    })),
  },
}))

describe('digitalTwinApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('fetchDevices', () => {
    it('should call GET /api/digital-twin/devices and return mapped devices', async () => {
      const mockApiDevices = [
        {
          id: 1,
          deviceCode: 'DEVICE-001',
          deviceName: '设备1',
          deviceType: 'CNC',
          status: 'RUNNING',
          positionX: 0,
          positionY: 0.25,
          positionZ: 0,
          rotationY: 0,
        },
        {
          id: 2,
          deviceCode: 'DEVICE-002',
          deviceName: '设备2',
          deviceType: 'ROBOT',
          status: 'IDLE',
          positionX: 10,
          positionY: 0.25,
          positionZ: 0,
          rotationY: 180,
        },
      ]

      mockGet.mockResolvedValue({ data: mockApiDevices })

      const result = await digitalTwinApi.fetchDevices()

      expect(mockGet).toHaveBeenCalledWith('/api/digital-twin/devices')
      expect(result).toHaveLength(2)
      expect(result[0]).toEqual({
        id: '1',
        code: 'DEVICE-001',
        name: '设备1',
        type: 'CNC',
        status: 'running',
        position: [0, 0.25, 0],
        rotation: 0,
      })
      expect(result[1]).toEqual({
        id: '2',
        code: 'DEVICE-002',
        name: '设备2',
        type: 'ROBOT',
        status: 'idle',
        position: [10, 0.25, 0],
        rotation: 180,
      })
    })

    it('should handle empty response', async () => {
      mockGet.mockResolvedValue({ data: null })

      const result = await digitalTwinApi.fetchDevices()

      expect(result).toEqual([])
    })
  })

  describe('fetchActiveAlerts', () => {
    it('should call GET /api/digital-twin/alerts/active and return mapped alerts', async () => {
      const mockDevices = [
        { id: '1', code: 'DEVICE-001', name: '设备1', type: 'sensor', status: 'online' as const, position: [0, 0, 0] as [number, number, number], rotation: 0 },
        { id: '2', code: 'DEVICE-002', name: '设备2', type: 'sensor', status: 'online' as const, position: [1, 0, 0] as [number, number, number], rotation: 90 },
      ]

      const mockApiAlerts = [
        {
          id: 1,
          alertCode: 'ALT-001',
          deviceCode: 'DEVICE-001',
          level: 'ERROR',
          type: '设备异常',
          title: '温度过高',
          description: '设备温度超过阈值',
          status: 'TRIGGERED',
          occurredAt: '2026-05-26T10:00:00Z',
        },
        {
          id: 2,
          alertCode: 'ALT-002',
          deviceCode: 'DEVICE-002',
          level: 'WARNING',
          type: '设备预警',
          title: '设备振动异常',
          description: '振动幅度超过正常范围',
          status: 'ACKNOWLEDGED',
          occurredAt: '2026-05-26T09:30:00Z',
        },
      ]

      mockGet.mockResolvedValue({ data: mockApiAlerts })

      const result = await digitalTwinApi.fetchActiveAlerts(mockDevices)

      expect(mockGet).toHaveBeenCalledWith('/api/digital-twin/alerts/active')
      expect(result).toHaveLength(2)
      expect(result[0]).toEqual({
        id: '1',
        code: 'ALT-001',
        deviceCode: 'DEVICE-001',
        deviceName: '设备1',
        level: 'error',
        type: '设备异常',
        title: '温度过高',
        description: '设备温度超过阈值',
        status: 'triggered',
        occurredAt: '2026-05-26T10:00:00Z',
      })
      expect(result[1]).toEqual({
        id: '2',
        code: 'ALT-002',
        deviceCode: 'DEVICE-002',
        deviceName: '设备2',
        level: 'warning',
        type: '设备预警',
        title: '设备振动异常',
        description: '振动幅度超过正常范围',
        status: 'acknowledged',
        occurredAt: '2026-05-26T09:30:00Z',
      })
    })

    it('should handle empty response', async () => {
      mockGet.mockResolvedValue({ data: null })

      const result = await digitalTwinApi.fetchActiveAlerts([])

      expect(result).toEqual([])
    })
  })

  describe('fetchStatsSummary', () => {
    it('should call GET /api/digital-twin/stats/summary and return stats', async () => {
      const mockStats = {
        onlineDeviceCount: 85,
        activeAlertCount: 12,
        averageEfficiency: 87.5,
      }

      mockGet.mockResolvedValue({ data: mockStats })

      const result = await digitalTwinApi.fetchStatsSummary()

      expect(mockGet).toHaveBeenCalledWith('/api/digital-twin/stats/summary')
      expect(result).toEqual(mockStats)
      expect(result.onlineDeviceCount).toBe(85)
      expect(result.activeAlertCount).toBe(12)
      expect(result.averageEfficiency).toBe(87.5)
    })
  })

  describe('acknowledgeAlert', () => {
    it('should call POST /api/digital-twin/alert/{id}/acknowledge', async () => {
      mockPost.mockResolvedValue({})

      await digitalTwinApi.acknowledgeAlert('1', 'operator')

      expect(mockPost).toHaveBeenCalledWith('/api/digital-twin/alert/1/acknowledge', {
        acknowledgedBy: 'operator',
      })
    })
  })

  describe('resolveAlert', () => {
    it('should call POST /api/digital-twin/alert/{id}/resolve', async () => {
      mockPost.mockResolvedValue({})

      await digitalTwinApi.resolveAlert('1', 'operator', '已更换冷却液')

      expect(mockPost).toHaveBeenCalledWith('/api/digital-twin/alert/1/resolve', {
        resolvedBy: 'operator',
        solution: '已更换冷却液',
      })
    })
  })
})

describe('parseWsEventData', () => {
  it('should parse valid JSON string', () => {
    const input = '{"deviceCode": "DEVICE-001", "status": "running"}'
    const result = parseWsEventData(input)
    expect(result).toEqual({ deviceCode: 'DEVICE-001', status: 'running' })
  })

  it('should return empty object for invalid JSON', () => {
    const input = 'invalid json'
    const result = parseWsEventData(input)
    expect(result).toEqual({})
  })

  it('should return empty object for null input', () => {
    const input = null
    const result = parseWsEventData(input)
    expect(result).toEqual({})
  })

  it('should return empty object for undefined input', () => {
    const input = undefined
    const result = parseWsEventData(input)
    expect(result).toEqual({})
  })
})

describe('ChartPoint type', () => {
  it('should accept valid chart point object', () => {
    const point: ChartPoint = { timestamp: Date.now(), value: 85.5 }
    expect(point.timestamp).toBeDefined()
    expect(point.value).toBe(85.5)
  })
})