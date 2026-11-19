import { beforeEach, describe, expect, it, vi } from 'vitest'

const { mockGatewayFetch } = vi.hoisted(() => ({ mockGatewayFetch: vi.fn() }))

vi.mock('../gateway-client', () => ({ gatewayFetch: mockGatewayFetch }))

import { alertRuleApi, type AlertRule, type CreateAlertRuleRequest, type UpdateAlertRuleRequest } from './alertRule'

function okResponse(body: unknown): Response {
  return {
    ok: true,
    status: 200,
    json: async () => body,
    text: async () => '',
  } as Response
}

function errorResponse(status: number, text: string): Response {
  return { ok: false, status, text: async () => text } as Response
}

const rule: AlertRule = {
  id: 3,
  ruleCode: 'RULE-003',
  ruleName: 'High temperature',
  description: 'Alert when temperature is high',
  deviceType: 'CNC',
  metricType: 'TEMPERATURE',
  operator: 'GREATER_THAN',
  thresholdValue: 80,
  durationSeconds: 30,
  level: 'CRITICAL',
  alertType: 'threshold',
  titleTemplate: 'High temperature on {device}',
  descriptionTemplate: 'Value {value}',
  enabled: true,
  cooldownSeconds: 60,
  maxAlertsPerHour: 10,
  notificationChannels: 'IN_APP',
  createdBy: 'admin',
  createdAt: '2026-01-01T00:00:00Z',
  updatedBy: 'admin',
  updatedAt: '2026-01-01T00:00:00Z',
}

const createPayload: CreateAlertRuleRequest = {
  ruleCode: 'RULE-004',
  ruleName: 'Low pressure',
  description: 'Alert when pressure is low',
  deviceType: 'PRESS',
  metricType: 'PRESSURE',
  operator: 'LESS_THAN',
  thresholdValue: 10,
  level: 'WARNING',
  alertType: 'threshold',
  titleTemplate: 'Low pressure on {device}',
  descriptionTemplate: 'Value {value}',
}

const updatePayload: UpdateAlertRuleRequest = {
  ruleName: 'Low pressure updated',
  description: 'Updated description',
  deviceType: 'PRESS',
  metricType: 'PRESSURE',
  operator: 'LESS_THAN',
  thresholdValue: 12,
  durationSeconds: 45,
  level: 'ERROR',
  alertType: 'threshold',
  titleTemplate: 'Low pressure on {device}',
  descriptionTemplate: 'Value {value}',
  cooldownSeconds: 90,
  maxAlertsPerHour: 5,
  notificationChannels: 'IN_APP',
}

describe('alertRuleApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('lists all rules without a query when no filter is given', async () => {
    mockGatewayFetch.mockResolvedValue(okResponse([rule]))

    await expect(alertRuleApi.list()).resolves.toEqual([rule])
    expect(mockGatewayFetch).toHaveBeenCalledWith('/api/alert-rules', {
      headers: { 'Content-Type': 'application/json' },
    })
  })

  it('encodes enabled and device type filters in the list query', async () => {
    mockGatewayFetch.mockResolvedValue(okResponse([]))

    await alertRuleApi.list({ enabled: true, deviceType: 'CNC' })

    expect(mockGatewayFetch).toHaveBeenCalledWith('/api/alert-rules?enabled=true&deviceType=CNC', {
      headers: { 'Content-Type': 'application/json' },
    })
  })

  it('reads one rule by id', async () => {
    mockGatewayFetch.mockResolvedValue(okResponse(rule))

    await expect(alertRuleApi.get(3)).resolves.toEqual(rule)
    expect(mockGatewayFetch).toHaveBeenCalledWith('/api/alert-rules/3', {
      headers: { 'Content-Type': 'application/json' },
    })
  })

  it('creates a rule with a serialized JSON body', async () => {
    mockGatewayFetch.mockResolvedValue(okResponse(rule))

    await alertRuleApi.create(createPayload)

    expect(mockGatewayFetch).toHaveBeenCalledWith('/api/alert-rules', {
      method: 'POST',
      body: JSON.stringify(createPayload),
      headers: { 'Content-Type': 'application/json' },
    })
  })

  it('updates a rule with a serialized JSON body', async () => {
    mockGatewayFetch.mockResolvedValue(okResponse(rule))

    await alertRuleApi.update(3, updatePayload)

    expect(mockGatewayFetch).toHaveBeenCalledWith('/api/alert-rules/3', {
      method: 'PUT',
      body: JSON.stringify(updatePayload),
      headers: { 'Content-Type': 'application/json' },
    })
  })

  it('enables a rule with a PUT request', async () => {
    mockGatewayFetch.mockResolvedValue(okResponse({ success: true }))

    await expect(alertRuleApi.enable(3)).resolves.toEqual({ success: true })
    expect(mockGatewayFetch).toHaveBeenCalledWith('/api/alert-rules/3/enable', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
    })
  })

  it('disables a rule with a PUT request', async () => {
    mockGatewayFetch.mockResolvedValue(okResponse({ success: true }))

    await alertRuleApi.disable(3)

    expect(mockGatewayFetch).toHaveBeenCalledWith('/api/alert-rules/3/disable', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
    })
  })

  it('deletes a rule with a DELETE request', async () => {
    mockGatewayFetch.mockResolvedValue(okResponse({ success: true }))

    await alertRuleApi.delete(3)

    expect(mockGatewayFetch).toHaveBeenCalledWith('/api/alert-rules/3', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    })
  })

  it('checks uniqueness with field, value and excluded id', async () => {
    mockGatewayFetch.mockResolvedValue(okResponse({ unique: false }))

    await expect(alertRuleApi.checkUnique('ruleCode', 'RULE-003', 3)).resolves.toEqual({ unique: false })
    expect(mockGatewayFetch).toHaveBeenCalledWith('/api/alert-rules/check-unique?field=ruleCode&value=RULE-003&excludeId=3', {
      headers: { 'Content-Type': 'application/json' },
    })
  })

  it('throws the response body text when the server rejects a request', async () => {
    mockGatewayFetch.mockResolvedValue(errorResponse(400, 'Duplicate rule code'))

    await expect(alertRuleApi.get(9)).rejects.toThrow('Duplicate rule code')
  })

  it('falls back to an HTTP status message when the error body is empty', async () => {
    mockGatewayFetch.mockResolvedValue(errorResponse(503, ''))

    await expect(alertRuleApi.get(9)).rejects.toThrow('HTTP 503')
  })
})
