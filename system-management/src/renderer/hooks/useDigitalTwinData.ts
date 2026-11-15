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
    const deviceCode = payload.deviceCode as string | undefined
    if (!deviceCode) return

    setDevices((prev) =>
      prev.map((d) => {
        if (d.code !== deviceCode) return d
        const updated = { ...d }
        if (payload.status) {
          const status = String(payload.status).toLowerCase()
          if (
            ['online', 'offline', 'running', 'idle', 'warning', 'error'].includes(status)
          ) {
            updated.status = status as Device['status']
          }
        }
        const position = payload.position as { x?: number; y?: number; z?: number } | undefined
        if (position) {
          updated.position = [
            position.x ?? d.position[0],
            position.y ?? d.position[1],
            position.z ?? d.position[2],
          ]
        }
        if (payload.rotation !== undefined) {
          updated.rotation = Number(payload.rotation)
        }
        return updated
      }),
    )
  }, [])

  useEffect(() => {
    void refreshAll()
  }, [refreshAll])

  useEffect(() => {
    let disposed = false
    let ws: DigitalTwinWebSocket | null = null

    const handleMessage = (message: { type: string; data: unknown }) => {
      const payload = parseWsEventData(message.data)

      switch (message.type) {
        case 'DEVICE_STATUS_CHANGED':
        case 'AGV_POSITION_UPDATED':
        case 'DEVICE_POSITION_UPDATED':
          patchDeviceFromEvent(payload)
          break
        case 'ALERT_CREATED':
          void refreshAlerts()
          break
        case 'PRODUCTION_OUTPUT_UPDATED': {
          const output = Number(payload.output)
          if (!Number.isNaN(output)) {
            setChartData((prev) => appendChartPoint(prev, output))
          }
          void refreshStats()
          break
        }
        default:
          break
      }
    }

    // The WS handshake carries the JWT as ?token=; it must be resolved from
    // the main process before the connection is created.
    void (async () => {
      let url: string
      try {
        url = await buildGatewayWsUrl()
      } catch (err) {
        if (!disposed) markFailure(err)
        return
      }
      if (disposed) return

      ws = new DigitalTwinWebSocket({
        url,
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
        reconnectAttempts: 10,
      })
      ws.subscribe('*', handleMessage)
      ws.connect()
      wsRef.current = ws
    })()

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
