import { Colors, FontSizes } from '../styles/constants'
import { formatDate } from '../utils/format'

export interface DemandForecastPoint { date: string; actual?: number; forecast: number; lowerBound?: number; upperBound?: number }

interface XAxisLabelsProps { data: DemandForecastPoint[] }

export function XAxisLabels({ data }: XAxisLabelsProps) {
  if (data.length === 0) return null
  const positions = [data[0]?.date || '', data[Math.floor(data.length / 2)]?.date || '', data[data.length - 1]?.date || '']
  return (
    <div role="list" aria-label="X轴标签" style={{ position: 'absolute', bottom: '-24px', left: 0, right: 0, display: 'flex', justifyContent: 'space-between', fontSize: FontSizes.xs, color: Colors.textMuted }}>
      {positions.map((d, i) => <span key={i} role="listitem">{formatDate(d)}</span>)}
    </div>
  )
}
