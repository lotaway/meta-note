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

import { mesApi } from './api'

const telemetry = [
  {
    id: 1,
    equipmentCode: 'CNC-01',
    topic: 'telemetry/CNC-01',
    collectTime: '2026-01-01T00:00:00Z',
    metrics: [{ metricCode: 'TEMP', metricName: 'Temperature', value: 21, unit: 'C' }],
    createdAt: '2026-01-01T00:00:00Z',
  },
]

const command = {
  id: 2,
  commandCode: 'CMD-002',
  equipmentCode: 'CNC-01',
  commandType: 'START',
  payload: '{}',
  status: 'SENT',
  createdBy: 'operator',
  createdAt: '2026-01-01T00:00:00Z',
}

const traceChain = { root: { traceCode: 'TRACE-1', traceType: 'PRODUCT', relations: [] }, forwardPath: [], backwardPath: [] }

describe('mesApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches telemetry with the requested limit', async () => {
    mockGet.mockResolvedValue({ data: telemetry })

    const result = await mesApi.fetchTelemetry('CNC-01', 5)

    expect(mockGet).toHaveBeenCalledWith('/api/mes/scada/telemetry/CNC-01', { params: { limit: 5 } })
    expect(result).toEqual(telemetry)
  })

  it('uses a default limit of ten for telemetry', async () => {
    mockGet.mockResolvedValue({ data: [] })

    await mesApi.fetchTelemetry('CNC-02')

    expect(mockGet).toHaveBeenCalledWith('/api/mes/scada/telemetry/CNC-02', { params: { limit: 10 } })
  })

  it('dispatches a command with the default creator', async () => {
    mockPost.mockResolvedValue({ data: command })

    const result = await mesApi.dispatchCommand('CNC-01', 'START', '{}')

    expect(mockPost).toHaveBeenCalledWith('/api/mes/scada/commands', {
      equipmentCode: 'CNC-01',
      commandType: 'START',
      payload: '{}',
      createdBy: 'operator',
    })
    expect(result).toEqual(command)
  })

  it('fetches commands for one equipment', async () => {
    mockGet.mockResolvedValue({ data: [command] })

    const result = await mesApi.fetchCommands('CNC-01')

    expect(mockGet).toHaveBeenCalledWith('/api/mes/scada/commands/CNC-01')
    expect(result).toEqual([command])
  })

  it('forwards a trace with the trace code as a query param', async () => {
    mockGet.mockResolvedValue({ data: [] })

    await mesApi.forwardTrace('TRACE-1')

    expect(mockGet).toHaveBeenCalledWith('/api/mes/trace/records/forward', { params: { traceCode: 'TRACE-1' } })
  })

  it('traces backward with the trace code as a query param', async () => {
    mockGet.mockResolvedValue({ data: [] })

    await mesApi.backwardTrace('TRACE-2')

    expect(mockGet).toHaveBeenCalledWith('/api/mes/trace/records/backward', { params: { traceCode: 'TRACE-2' } })
  })

  it('returns the trace chain on success', async () => {
    mockGet.mockResolvedValue({ data: traceChain })

    await expect(mesApi.getTraceChain('TRACE-1')).resolves.toEqual(traceChain)
    expect(mockGet).toHaveBeenCalledWith('/api/mes/trace/records/trace-chain', { params: { traceCode: 'TRACE-1' } })
  })

  it('returns null when the trace chain request fails', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    mockGet.mockRejectedValue(new Error('not found'))

    await expect(mesApi.getTraceChain('MISSING')).resolves.toBeNull()
    expect(error).toHaveBeenCalledWith('Failed to fetch trace chain:', expect.any(Error))
    error.mockRestore()
  })

  it('fetches trace records with optional filters', async () => {
    mockGet.mockResolvedValue({ data: [] })
    const filters = { productCode: 'P1', batchNo: 'B1', sn: 'S1' }

    await mesApi.fetchTraceRecords(filters)

    expect(mockGet).toHaveBeenCalledWith('/api/mes/trace/records', { params: filters })
  })
})
