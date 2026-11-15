interface ConfidenceIntervalProps { upper: string; lower: string; maxX: number }

export function ConfidenceInterval({ upper, lower, maxX }: ConfidenceIntervalProps) {
  if (!upper || !lower) return null
  const path = `${upper} L ${maxX} 10 L 0 10 Z`
  return <path d={path} fill="rgba(56, 189, 248, 0.15)" stroke="none" />
}
