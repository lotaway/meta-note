export interface TelemetryMetric {
  metricCode: string
  metricName: string
  value: number
  unit: string
  upperLimit?: number
  lowerLimit?: number
}

export interface TelemetryRecord {
  id: number
  equipmentCode: string
  topic: string
  collectTime: string
  metrics: TelemetryMetric[]
  createdAt: string
}

export interface DeviceCommand {
  id: number
  commandCode: string
  equipmentCode: string
  commandType: string
  payload: string
  status: string
  createdBy: string
  createdAt: string
  executedAt?: string
  resultMessage?: string
}

export interface TraceRelation {
  relatedCode: string
  relatedType: string
  relationType: string
  quantity?: number
}

export interface TraceRecord {
  id?: number
  traceCode: string
  traceType: string
  productCode?: string
  batchNo?: string
  sn?: string
  source?: string
  relations: TraceRelation[]
  createdAt?: string
}

export interface TraceChain {
  root: TraceRecord
  forwardPath: TraceRecord[]
  backwardPath: TraceRecord[]
}
