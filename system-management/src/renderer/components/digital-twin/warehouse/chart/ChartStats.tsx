import { Colors, Spacing, FontSizes } from '../styles/constants'

export interface DemandForecastPoint { date: string; actual?: number; forecast: number; lowerBound?: number; upperBound?: number }
interface ChartStatsProps { data: DemandForecastPoint[] }

export function ChartStats({ data }: ChartStatsProps) {
  if (data.length === 0) return null
  const latest = data[data.length - 1].forecast
  const avg = Math.round(data.reduce((s, d) => s + d.forecast, 0) / data.length)
  const trend = data.length > 1 ? data[data.length - 1].forecast > data[0].forecast : false
  const labelStyle = { color: Colors.textMuted, fontSize: FontSizes.xs, marginBottom: '2px' }

  return (
    <div role="region" aria-label="统计信息" style={{ marginTop: Spacing.xl, paddingTop: Spacing.lg, borderTop: `1px solid ${Colors.border}`, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: Spacing.lg, textAlign: 'center' }}>
      <div><div style={labelStyle}>最新预测</div><div style={{ fontSize: FontSizes.xxl, fontWeight: 600, color: Colors.primary }}>{Math.round(latest)}</div></div>
      <div><div style={labelStyle}>平均预测</div><div style={{ fontSize: FontSizes.xxl, fontWeight: 600, color: Colors.text }}>{avg}</div></div>
      <div><div style={labelStyle}>趋势</div><div style={{ fontSize: FontSizes.xxl, fontWeight: 600, color: trend ? Colors.success : Colors.danger }}>{trend ? '↑ 上升' : '↓ 下降'}</div></div>
    </div>
  )
}
