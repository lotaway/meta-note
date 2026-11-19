import { beforeEach, describe, expect, it, vi } from 'vitest'

const { mockGet, mockPost, mockInstallGatewayAuth } = vi.hoisted(() => ({
  mockGet: vi.fn(),
  mockPost: vi.fn(),
  mockInstallGatewayAuth: vi.fn(),
}))

vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => ({
      get: mockGet,
      post: mockPost,
      interceptors: {
        request: { use: vi.fn() },
        response: { use: vi.fn() },
      },
    })),
  },
}))

vi.mock('../../gateway-client', () => ({
  installGatewayAuth: mockInstallGatewayAuth,
}))

import { digitalTwinApi } from './api'

const device = {
  id: 1,
  deviceCode: 'DEVICE-001',
  deviceName: 'Device One',
  deviceType: 'CNC',
  status: 'RUNNING',
  positionX: 0,
  positionY: 0.25,
  positionZ: 0,
  rotationY: 0,
}

const alert = {
  id: 7,
  alertCode: 'ALERT-007',
  deviceCode: 'DEVICE-001',
  level: 'CRITICAL',
  type: 'TEMPERATURE',
  title: 'High temperature',
  description: 'Temperature above threshold',
  status: 'TRIGGERED',
}

const stats = { onlineDeviceCount: 12, activeAlertCount: 3, averageEfficiency: 0.87 }

describe('digitalTwinApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches devices from the digital-twin devices path', async () => {
    mockGet.mockResolvedValue({ data: [device] })

    const result = await digitalTwinApi.fetchDevices()

    expect(mockGet).toHaveBeenCalledWith('/api/digital-twin/devices')
    expect(result).toEqual([device])
  })

  it('returns an empty device list when the response has no data', async () => {
    mockGet.mockResolvedValue({ data: null })

    await expect(digitalTwinApi.fetchDevices()).resolves.toEqual([])
  })

  it('fetches active alerts from the digital-twin alerts path', async () => {
    mockGet.mockResolvedValue({ data: [alert] })

    const result = await digitalTwinApi.fetchActiveAlerts()

    expect(mockGet).toHaveBeenCalledWith('/api/digital-twin/alerts/active')
    expect(result).toEqual([alert])
  })

  it('returns an empty alert list when the response has no data', async () => {
    mockGet.mockResolvedValue({ data: undefined })

    await expect(digitalTwinApi.fetchActiveAlerts()).resolves.toEqual([])
  })

  it('fetches the stats summary without a null fallback', async () => {
    mockGet.mockResolvedValue({ data: stats })

    await expect(digitalTwinApi.fetchStatsSummary()).resolves.toEqual(stats)
    expect(mockGet).toHaveBeenCalledWith('/api/digital-twin/stats/summary')
  })

  it('acknowledges an alert with the default operator', async () => {
    await digitalTwinApi.acknowledgeAlert('ALERT-007')

    expect(mockPost).toHaveBeenCalledWith('/api/digital-twin/alert/ALERT-007/acknowledge', {
      acknowledgedBy: 'operator',
    })
  })

  it('acknowledges an alert with an explicit operator', async () => {
    await digitalTwinApi.acknowledgeAlert('ALERT-008', 'supervisor')

    expect(mockPost).toHaveBeenCalledWith('/api/digital-twin/alert/ALERT-008/acknowledge', {
      acknowledgedBy: 'supervisor',
    })
  })

  it('resolves an alert with default resolution fields', async () => {
    await digitalTwinApi.resolveAlert('ALERT-007')

    expect(mockPost).toHaveBeenCalledWith('/api/digital-twin/alert/ALERT-007/resolve', {
      resolvedBy: 'operator',
      solution: '',
    })
  })

  it('resolves an alert with an explicit solution', async () => {
    await digitalTwinApi.resolveAlert('ALERT-009', 'engineer', 'Temperature normalized')

    expect(mockPost).toHaveBeenCalledWith('/api/digital-twin/alert/ALERT-009/resolve', {
      resolvedBy: 'engineer',
      solution: 'Temperature normalized',
    })
  })

  it('reports reachable when the summary request succeeds', async () => {
    mockGet.mockResolvedValue({ data: stats })

    await expect(digitalTwinApi.isReachable()).resolves.toBe(true)
  })

  it('reports unreachable when the summary request fails', async () => {
    mockGet.mockRejectedValue(new Error('gateway offline'))

    await expect(digitalTwinApi.isReachable()).resolves.toBe(false)
  })
})
