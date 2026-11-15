import { Colors, FontSizes } from '../styles/constants'

interface YAxisLabelsProps { maxVal: number }

export function YAxisLabels({ maxVal }: YAxisLabelsProps) {
  const labels = [Math.round(maxVal), Math.round(maxVal * 0.75), Math.round(maxVal * 0.5), Math.round(maxVal * 0.25), 0]
  return (
    <div role="list" aria-label="Y轴标签" style={{ position: 'absolute', left: '-32px', top: 0, bottom: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', fontSize: FontSizes.xs, color: Colors.textMuted }}>
      {labels.map((l, i) => <span key={i} role="listitem">{l}</span>)}
    </div>
  )
}
