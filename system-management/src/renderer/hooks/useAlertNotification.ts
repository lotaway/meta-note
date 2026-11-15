import { useEffect, useRef, useCallback } from 'react'
import { addToast, type ToastNotification } from '../components/Toast'
import { notificationService } from '../services/notification'
import { alertRuleApi } from '../services/api/alertRule'
import { buildGatewayWsUrl } from '../services/gateway-client'

export interface AlertEvent {
  id: string
  alertCode: string
  deviceCode: string
  workshopId: string
  level: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL'
  type: string
  title: string
  description: string
  occurredAt: string
}

const LEVEL_TO_TYPE: Record<string, ToastNotification['type']> = {
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
  CRITICAL: 'critical',
}

interface UseAlertNotificationOptions {
  /** Test injection only. Leave empty in production so the URL is built from the gateway config. */
  wsUrl?: string
  onAlert?: (alert: AlertEvent) => void
  enabled?: boolean
}

export function useAlertNotification(options: UseAlertNotificationOptions = {}) {
  const { wsUrl, onAlert, enabled = true } = options
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimerRef = useRef<number | null>(null)
  const alertSoundRef = useRef<boolean>(true)
  const browserNotificationRef = useRef<boolean>(true)

  const handleAlert = useCallback(async (alert: AlertEvent) => {
    onAlert?.(alert)

    const toastType = LEVEL_TO_TYPE[alert.level] || 'info'
    addToast({
      type: toastType,
      title: alert.title,
      message: alert.description,
      duration: alert.level === 'CRITICAL' ? 0 : 5000,
    })

    if (alertSoundRef.current) {
      const soundLevel = alert.level === 'CRITICAL' ? 'critical' :
                         alert.level === 'ERROR' ? 'error' :
                         alert.level === 'WARNING' ? 'warning' : 'info'
      await notificationService.playAlertSound(soundLevel)
    }

    if (browserNotificationRef.current && notificationService.isSupported()) {
      await notificationService.show({
        title: alert.title,
        body: alert.description,
        tag: alert.alertCode,
        requireInteraction: alert.level === 'CRITICAL',
      })
    }
  }, [onAlert])

  const connect = useCallback(async () => {
    if (!enabled) return

    try {
      const url = wsUrl ?? await buildGatewayWsUrl()
      const ws = new WebSocket(url)

      ws.onopen = () => {
        console.log('[AlertNotification] WebSocket connected')
        ws.send(JSON.stringify({ type: 'subscribe', channels: ['alert'] }))
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          if (data.type === 'alert' && data.payload) {
            handleAlert(data.payload)
          }
        } catch (e) {
          console.error('[AlertNotification] Failed to parse message:', e)
        }
      }

      ws.onerror = (error) => {
        console.error('[AlertNotification] WebSocket error:', error)
      }

      ws.onclose = () => {
        console.log('[AlertNotification] WebSocket closed, reconnecting...')
        reconnectTimerRef.current = window.setTimeout(connect, 3000)
      }

      wsRef.current = ws
    } catch (error) {
      console.error('[AlertNotification] Failed to connect:', error)
      reconnectTimerRef.current = window.setTimeout(connect, 5000)
    }
  }, [wsUrl, enabled, handleAlert])

  useEffect(() => {
    connect()
    return () => {
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current)
      }
      wsRef.current?.close()
    }
  }, [connect])

  const setAlertSoundEnabled = useCallback((enabled: boolean) => {
    alertSoundRef.current = enabled
  }, [])

  const setBrowserNotificationEnabled = useCallback(async (enabled: boolean) => {
    browserNotificationRef.current = enabled
    if (enabled) {
      await notificationService.requestPermission()
    }
  }, [])

  const testAlert = useCallback(async (level: string = 'WARNING') => {
    const testAlert: AlertEvent = {
      id: `test-${Date.now()}`,
      alertCode: 'TEST-001',
      deviceCode: 'TEST-DEVICE-001',
      workshopId: 'WS001',
      level: level as AlertEvent['level'],
      type: 'TEST',
      title: '测试告警',
      description: '这是一条测试告警消息',
      occurredAt: new Date().toISOString(),
    }
    await handleAlert(testAlert)
  }, [handleAlert])

  return {
    setAlertSoundEnabled,
    setBrowserNotificationEnabled,
    testAlert,
    isAlertSoundEnabled: () => alertSoundRef.current,
    isBrowserNotificationEnabled: () => browserNotificationRef.current,
  }
}