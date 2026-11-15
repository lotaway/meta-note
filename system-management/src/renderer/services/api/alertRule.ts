import { gatewayFetch } from '../gateway-client'

export interface AlertRule {
  id: number
  ruleCode: string
  ruleName: string
  description: string
  deviceType: string
  metricType: string
  operator: string
  thresholdValue: number
  durationSeconds: number
  level: string
  alertType: string
  titleTemplate: string
  descriptionTemplate: string
  enabled: boolean
  cooldownSeconds: number
  maxAlertsPerHour: number
  notificationChannels: string
  createdBy: string
  createdAt: string
  updatedBy: string
  updatedAt: string
}

export interface CreateAlertRuleRequest {
  ruleCode: string
  ruleName: string
  description: string
  deviceType: string
  metricType: string
  operator: string
  thresholdValue: number
  level: string
  alertType: string
  titleTemplate: string
  descriptionTemplate: string
}

export interface UpdateAlertRuleRequest {
  ruleName: string
  description: string
  deviceType: string
  metricType: string
  operator: string
  thresholdValue: number
  durationSeconds: number
  level: string
  alertType: string
  titleTemplate: string
  descriptionTemplate: string
  cooldownSeconds: number
  maxAlertsPerHour: number
  notificationChannels: string
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await gatewayFetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })
  if (!response.ok) {
    const error = await response.text()
    throw new Error(error || `HTTP ${response.status}`)
  }
  return response.json()
}

export const alertRuleApi = {
  list: (params?: { enabled?: boolean; deviceType?: string }) => {
    const query = new URLSearchParams()
    if (params?.enabled !== undefined) query.set('enabled', String(params.enabled))
    if (params?.deviceType) query.set('deviceType', params.deviceType)
    const queryStr = query.toString()
    return request<AlertRule[]>(`/api/alert-rules${queryStr ? '?' + queryStr : ''}`)
  },

  get: (id: number) => request<AlertRule>(`/api/alert-rules/${id}`),

  create: (data: CreateAlertRuleRequest) =>
    request<AlertRule>('/api/alert-rules', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: number, data: UpdateAlertRuleRequest) =>
    request<AlertRule>(`/api/alert-rules/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  enable: (id: number) =>
    request<{ success: boolean }>(`/api/alert-rules/${id}/enable`, { method: 'PUT' }),

  disable: (id: number) =>
    request<{ success: boolean }>(`/api/alert-rules/${id}/disable`, { method: 'PUT' }),

  delete: (id: number) =>
    request<{ success: boolean }>(`/api/alert-rules/${id}`, { method: 'DELETE' }),

  checkUnique: (field: string, value: string, excludeId?: number) => {
    const query = new URLSearchParams({ field, value })
    if (excludeId) query.set('excludeId', String(excludeId))
    return request<{ unique: boolean }>(`/api/alert-rules/check-unique?${query}`)
  },
}