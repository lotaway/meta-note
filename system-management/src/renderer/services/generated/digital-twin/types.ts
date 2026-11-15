export interface DigitalTwinDevice {
  id: number
  deviceCode: string
  deviceName: string
  deviceType: string
  status: string
  positionX?: number | null
  positionY?: number | null
  positionZ?: number | null
  rotationY?: number | null
}

export interface DigitalTwinAlert {
  id: number
  alertCode: string
  deviceCode: string
  level: string
  type: string
  title: string
  description: string
  status: string
  occurredAt?: string
}

export interface DigitalTwinStatsSummary {
  onlineDeviceCount: number
  activeAlertCount: number
  averageEfficiency: number
}

export interface ChartPoint {
  timestamp: number
  value: number
}
