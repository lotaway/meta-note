import { useEffect, useRef, useState, useCallback } from 'react'
import mqtt from 'mqtt'
import type { MqttClient, IClientOptions } from 'mqtt'

type MessageHandler = (topic: string, message: any) => void

interface MQTTServiceOptions {
  brokerUrl: string
  clientId?: string
  username?: string
  password?: string
  topics?: string[]
  onConnect?: () => void
  onDisconnect?: () => void
  onError?: (error: Error) => void
  cleanSession?: boolean
  reconnectPeriod?: number
}

class DigitalTwinMQTT {
  private client: MqttClient | null = null
  private brokerUrl: string
  private options: MQTTServiceOptions
  private handlers: Map<string, MessageHandler[]> = new Map()
  private topics: string[] = []

  constructor(options: MQTTServiceOptions) {
    this.options = options
    this.brokerUrl = options.brokerUrl
    this.topics = options.topics || []
  }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const opts: IClientOptions = {
          clientId:
            this.options.clientId ||
            `dt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          clean: this.options.cleanSession ?? true,
          reconnectPeriod: this.options.reconnectPeriod ?? 5000,
          forceNativeWebSocket: true,
        }
        if (this.options.username) opts.username = this.options.username
        if (this.options.password) opts.password = this.options.password

        this.client = mqtt.connect(this.brokerUrl, opts)

        this.client.on('connect', () => {
          console.log('[MQTT] Connected to broker:', this.brokerUrl)
          this.topics.forEach((topic) => this.client!.subscribe(topic))
          this.options.onConnect?.()
          resolve()
        })

        this.client.on('close', () => {
          console.log('[MQTT] Disconnected from broker')
          this.options.onDisconnect?.()
        })

        this.client.on('error', (err) => {
          console.error('[MQTT] Error:', err)
          this.options.onError?.(err)
          reject(err)
        })

        this.client.on('message', (topic, payload) => {
          try {
            const message = JSON.parse(payload.toString())
            this.dispatchMessage(topic, message)
          } catch (e) {
            console.error('[MQTT] Failed to parse message:', e)
          }
        })
      } catch (error) {
        console.error('[MQTT] Connection failed:', error)
        reject(error)
      }
    })
  }

  private dispatchMessage(topic: string, message: any) {
    const handlers = this.handlers.get(topic) || []
    handlers.forEach((handler) => handler(topic, message))

    const wildcardHandlers = this.handlers.get('#') || []
    wildcardHandlers.forEach((handler) => handler(topic, message))
  }

  disconnect() {
    if (this.client) {
      this.client.end(true)
      this.client = null
    }
  }

  subscribe(topic: string, handler?: MessageHandler) {
    if (!this.topics.includes(topic)) {
      this.topics.push(topic)
    }
    if (handler) {
      const handlers = this.handlers.get(topic) || []
      handlers.push(handler)
      this.handlers.set(topic, handlers)
    }
    if (this.client?.connected) {
      this.client.subscribe(topic)
    }
  }

  unsubscribe(topic: string, handler?: MessageHandler) {
    if (handler) {
      const handlers = this.handlers.get(topic) || []
      const index = handlers.indexOf(handler)
      if (index > -1) {
        handlers.splice(index, 1)
      }
    }
    if (this.client?.connected) {
      this.client.unsubscribe(topic)
    }
  }

  publish(topic: string, payload: any) {
    if (this.client?.connected) {
      this.client.publish(topic, JSON.stringify(payload))
    } else {
      console.warn('[MQTT] Cannot publish, not connected')
    }
  }

  getTopics() {
    return [...this.topics]
  }

  getConnectionStatus() {
    return this.client?.connected ?? false
  }
}

function useDigitalTwinMQTT(options: MQTTServiceOptions) {
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const mqttRef = useRef<DigitalTwinMQTT | null>(null)

  useEffect(() => {
    const mqtt = new DigitalTwinMQTT({
      ...options,
      onConnect: () => setIsConnected(true),
      onDisconnect: () => setIsConnected(false),
      onError: (err) => setError(err),
    })

    mqtt.connect()
      .then(() => setError(null))
      .catch((err) => {
        console.error('[MQTT] Connect error:', err)
        setError(err)
      })
    mqttRef.current = mqtt

    return () => {
      mqtt.disconnect()
    }
  }, [options.brokerUrl, options.topics, options.username, options.password])

  const subscribe = useCallback((topic: string, handler: MessageHandler) => {
    mqttRef.current?.subscribe(topic, handler)
    return () => mqttRef.current?.unsubscribe(topic, handler)
  }, [])

  const publish = useCallback((topic: string, payload: any) => {
    mqttRef.current?.publish(topic, payload)
  }, [])

  return { isConnected, error, subscribe, publish }
}

interface DeviceTelemetry {
  deviceCode: string
  timestamp: number
  metrics: {
    temperature?: number
    humidity?: number
    pressure?: number
    vibration?: number
    power?: number
    rpm?: number
  }
  location?: {
    x: number
    y: number
    z: number
  }
}

interface DeviceStatusMessage {
  deviceCode: string
  status: 'online' | 'offline' | 'running' | 'idle' | 'warning' | 'error'
  timestamp: number
}

const DT_TOPICS = {
  DEVICE_STATUS: 'device/+/status',
  DEVICE_TELEMETRY: 'device/+/telemetry',
  DEVICE_POSITION: 'device/+/position',
  ALERT_CREATED: 'alert/created',
  ALERT_UPDATED: 'alert/updated',
  PRODUCTION_OUTPUT: 'production/+/output',
  AGV_POSITION: 'agv/+/position',
}

export { DigitalTwinMQTT }
export { useDigitalTwinMQTT }
export type { MQTTServiceOptions, MessageHandler, DeviceTelemetry, DeviceStatusMessage }
export { DT_TOPICS }
