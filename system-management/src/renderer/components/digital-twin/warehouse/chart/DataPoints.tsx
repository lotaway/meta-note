import { Colors } from '../styles/constants'

interface DataPointsProps {
  points: Array<{ x: number; y: number; actual?: number; forecast: number }>
  showActual: boolean; maxVal: number
}

export function DataPoints({ points, showActual, maxVal }: DataPointsProps) {
  return (<>{points.map((p, i) => (
    <g key={i}>
      <circle cx={p.x} cy={p.y} r={1.2} fill="#0f172a" stroke={Colors.primary} strokeWidth={0.4} />
      {showActual && p.actual !== undefined && (
        <circle cx={p.x} cy={100 - (p.actual / maxVal) * 80 - 10} r={1} fill={Colors.success} stroke="#0f172a" strokeWidth={0.3} />
      )}
    </g>
  ))}</>)
}
