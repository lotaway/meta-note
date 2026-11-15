import { Colors, Spacing, FontSizes } from '../styles/constants'

interface ChartLegendProps { showActual: boolean; showConfidenceInterval: boolean }

export function ChartLegend({ showActual, showConfidenceInterval }: ChartLegendProps) {
  const items = []
  if (showActual) items.push({ c: Colors.success, l: '实际值' })
  items.push({ c: Colors.primary, l: '预测值' })
  if (showConfidenceInterval) items.push({ c: 'rgba(56, 189, 248, 0.3)', l: '置信区间' })

  return (
    <div role="list" aria-label="图例" style={{ display: 'flex', gap: Spacing.xl, fontSize: FontSizes.sm }}>
      {items.map(i => (
        <span key={i.l} role="listitem" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '12px', height: '3px', background: i.c, borderRadius: '2px' }} />{i.l}
        </span>
      ))}
    </div>
  )
}
