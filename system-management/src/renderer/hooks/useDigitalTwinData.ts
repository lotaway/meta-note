import { useCallback, useEffect, useRef, useState } from 'react'
import type { Device } from '../components/digital-twin/scene/FactoryScene'
import type { Alert } from '../components/digital-twin/alert/AlertPanel'
import { buildGatewayWsUrl } from '../services/gateway-client'
import {
  digitalTwinApi,
  parseWsEventData,
  type ChartPoint,
  type DigitalTwinStatsSummary,
} from '../services/digital-twin-api'
import { DigitalTwinWebSocket } from '../services/websocket'

const MAX_CHART_POINTS = 40

function appendChartPoint(prev: ChartPoint[], value: number): ChartPoint[] {
  const next = [...prev, { timestamp: Date.now(), value }]
  return next.length > MAX_CHART_POINTS ? next.slice(-MAX_CHART_POINTS) : next
}

function patchDevice(device: Device, payload: Record<string, unknown>): Device {
  if (device.code !== payload.deviceCode) return device
  const updated = { ...device }
  if (payload.status) {
    const status = String(payload.status).toLowerCase()
    if (['online', 'offline', 'running', 'idle', 'warning', 'error'].includes(status)) {
      updated.status = status as Device['status']
    }
  }
  const position = payload.position as { x?: number; y?: number; z?: number } | undefined
  if (position) {
    updated.position = [
      position.x ?? device.position[0],
      position.y ?? device.position[1],
      position.z ?? device.position[2],
    ]
  }
  if (payload.rotation !== undefined) updated.rotation = Number(payload.rotation)
  return updated
}

interface EventCallbacks {
  onDevicePatch(payload: Record<string, unknown>): void
  onAlertCreated(): void
  onProductionOutput(value: number): void
  onStatsRefresh(): void
}

function createMessageHandler(callbacks: EventCallbacks) {
  return (message: { type: string; data: unknown }) => {
    const payload = parseWsEventData(message.data)
    switch (message.type) {
      case 'DEVICE_STATUS_CHANGED':
      case 'AGV_POSITION_UPDATED':
      case 'DEVICE_POSITION_UPDATED':
        callbacks.onDevicePatch(payload)
        break
      case 'ALERT_CREATED':
        callbacks.onAlertCreated()
        break
      case 'PRODUCTION_OUTPUT_UPDATED': {
        const output = Number(payload.output)
        if (!Number.isNaN(output)) callbacks.onProductionOutput(output)
        callbacks.onStatsRefresh()
        break
      }
    }
  }
}

async function connectGatewayWs(handlers: {
  onMessage: (message: { type: string; data: unknown }) => void
  onOpen: () => void
  onClose: () => void
}): Promise<DigitalTwinWebSocket> {
  const url = await buildGatewayWsUrl()
  const ws = new DigitalTwinWebSocket({
    url,
    onOpen: handlers.onOpen,
    onClose: handlers.onClose,
    reconnectAttempts: 10,
  })
  ws.subscribe('*', handlers.onMessage)
  ws.connect()
  return ws
}

export function useDigitalTwinData() {
  const [devices, setDevices] = useState<Device[]>([])
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [stats, setStats] = useState<DigitalTwinStatsSummary | null>(null)
  const [chartData, setChartData] = useState<ChartPoint[]>([])
  const [utilizationChartData, setUtilizationChartData] = useState<ChartPoint[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [apiAvailable, setApiAvailable] = useState<boolean | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const wsRef = useRef<DigitalTwinWebSocket | null>(null)
  const devicesRef = useRef<Device[]>([])
  const needsReconcileRef = useRef(false)

  useEffect(() => {
    devicesRef.current = devices
  }, [devices])

  const markFailure = useCallback((err: unknown) => {
    setApiAvailable(false)
    setLoadError(err instanceof Error ? err.message : 'Unable to reach the digital twin service')
  }, [])

  // Full reconciliation runs only on first load, reconnect and manual refresh; state changes are event-driven.
  const refreshAll = useCallback(async () => {
    try {
      const deviceList = await digitalTwinApi.fetchDevices()
      const [alertList, summary] = await Promise.all([
        digitalTwinApi.fetchActiveAlerts(deviceList),
        digitalTwinApi.fetchStatsSummary(),
      ])
      devicesRef.current = deviceList
      setDevices(deviceList)
      setAlerts(alertList)
      setStats(summary)
      setApiAvailable(true)
      setLoadError(null)
      if (summary.averageEfficiency > 0) {
        setUtilizationChartData((prev) =>
          appendChartPoint(prev, summary.averageEfficiency),
        )
      }
    } catch (err) {
      markFailure(err)
    }
  }, [markFailure])

  const refreshAlerts = useCallback(async () => {
    try {
      const alertList = await digitalTwinApi.fetchActiveAlerts(devicesRef.current)
      setAlerts(alertList)
      setApiAvailable(true)
      setLoadError(null)
    } catch (err) {
      markFailure(err)
    }
  }, [markFailure])

  const refreshStats = useCallback(async () => {
    try {
      const summary = await digitalTwinApi.fetchStatsSummary()
      setStats(summary)
      setApiAvailable(true)
      setLoadError(null)
    } catch (err) {
      markFailure(err)
    }
  }, [markFailure])

  const patchDeviceFromEvent = useCallback((payload: Record<string, unknown>) => {
    if (!payload.deviceCode) return
    setDevices((prev) => prev.map((device) => patchDevice(device, payload)))
  }, [])

  useEffect(() => {
    void refreshAll()
  }, [refreshAll])

  useEffect(() => {
    let disposed = false
    let ws: DigitalTwinWebSocket | null = null

    const handleMessage = createMessageHandler({
      onDevicePatch: patchDeviceFromEvent,
      onAlertCreated: () => void refreshAlerts(),
      onProductionOutput: (value) => setChartData((prev) => appendChartPoint(prev, value)),
      onStatsRefresh: () => void refreshStats(),
    })

    void connectGatewayWs({
      onMessage: handleMessage,
      onOpen: () => {
        setIsConnected(true)
        if (needsReconcileRef.current) {
          needsReconcileRef.current = false
          void refreshAll()
        }
      },
      onClose: () => {
        setIsConnected(false)
        needsReconcileRef.current = true
      },
    }).then((connected) => {
      if (disposed) {
        connected.disconnect()
        return
      }
      ws = connected
      wsRef.current = connected
    }).catch((err) => markFailure(err))

    return () => {
      disposed = true
      ws?.disconnect()
      wsRef.current = null
    }
  }, [patchDeviceFromEvent, refreshAlerts, refreshStats, refreshAll, markFailure])

  const acknowledgeAlert = useCallback(
    async (alertId: string) => {
      await digitalTwinApi.acknowledgeAlert(alertId)
      await refreshAlerts()
    },
    [refreshAlerts],
  )

  const resolveAlert = useCallback(
    async (alertId: string) => {
      await digitalTwinApi.resolveAlert(alertId)
      await refreshAlerts()
    },
    [refreshAlerts],
  )

  return {
    devices,
    alerts,
    stats,
    chartData,
    utilizationChartData,
    isConnected,
    apiAvailable,
    loadError,
    refreshAll,
    acknowledgeAlert,
    resolveAlert,
  }
}
