import type { Device } from '../components/digital-twin/scene/FactoryScene'
import type { Alert } from '../components/digital-twin/alert/AlertPanel'
import { digitalTwinApi as generatedApi } from './generated'
import type { DigitalTwinDevice, DigitalTwinAlert, DigitalTwinStatsSummary, ChartPoint } from './generated'

const statusMap: Record<string, Device['status']> = {
  ONLINE: 'online',
  OFFLINE: 'offline',
  RUNNING: 'running',
  IDLE: 'idle',
  WARNING: 'warning',
  ERROR: 'error',
  MAINTENANCE: 'idle',
}

const alertLevelMap: Record<string, Alert['level']> = {
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
  CRITICAL: 'critical',
}

const alertStatusMap: Record<string, Alert['status']> = {
  TRIGGERED: 'triggered',
  ACKNOWLEDGED: 'acknowledged',
  IN_PROGRESS: 'in_progress',
  RESOLVED: 'resolved',
  CLOSED: 'resolved',
}

export function mapApiDevice(d: DigitalTwinDevice): Device {
  const x = d.positionX ?? 0
  const y = d.positionY ?? 0.25
  const z = d.positionZ ?? 0
  return {
    id: String(d.id),
    code: d.deviceCode,
    name: d.deviceName,
    type: d.deviceType,
    status: statusMap[d.status] ?? 'offline',
    position: [x, y, z],
    rotation: d.rotationY ?? 0,
  }
}

export function mapApiAlert(a: DigitalTwinAlert, deviceNameByCode: Map<string, string>): Alert {
  return {
    id: String(a.id),
    code: a.alertCode,
    deviceCode: a.deviceCode,
    deviceName: deviceNameByCode.get(a.deviceCode) ?? a.deviceCode,
    level: alertLevelMap[a.level] ?? 'info',
    type: a.type,
    title: a.title,
    description: a.description,
    status: alertStatusMap[a.status] ?? 'triggered',
    occurredAt: a.occurredAt ?? new Date().toISOString(),
  }
}

export function parseWsEventData(data: unknown): Record<string, unknown> {
  if (typeof data === 'string') {
    try {
      return JSON.parse(data) as Record<string, unknown>
    } catch {
      return {}
    }
  }
  if (data && typeof data === 'object') {
    return data as Record<string, unknown>
  }
  return {}
}

export const digitalTwinApi = {
  async fetchDevices(): Promise<Device[]> {
    const list = await generatedApi.fetchDevices()
    return (list ?? []).map((d) => mapApiDevice(d))
  },

  async fetchActiveAlerts(devices: Device[]): Promise<Alert[]> {
    const nameByCode = new Map(devices.map((d) => [d.code, d.name]))
    const list = await generatedApi.fetchActiveAlerts()
    return (list ?? []).map((a) => mapApiAlert(a, nameByCode))
  },

  async fetchStatsSummary(): Promise<DigitalTwinStatsSummary> {
    return generatedApi.fetchStatsSummary()
  },

  async acknowledgeAlert(alertId: string, acknowledgedBy = 'operator'): Promise<void> {
    return generatedApi.acknowledgeAlert(alertId, acknowledgedBy)
  },

  async resolveAlert(alertId: string, resolvedBy = 'operator', solution = ''): Promise<void> {
    return generatedApi.resolveAlert(alertId, resolvedBy, solution)
  },

  isReachable(): Promise<boolean> {
    return generatedApi.isReachable()
  },
}

export type { DigitalTwinDevice, DigitalTwinAlert, DigitalTwinStatsSummary, ChartPoint }
