import { Colors } from '../styles/constants'

interface ForecastPathProps {
  d: string
}

export function ForecastPath({ d }: ForecastPathProps) {
  if (!d) return null
  return (
    <path
      d={d}
      fill="none"
      stroke={Colors.primary}
      strokeWidth={0.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  )
}
