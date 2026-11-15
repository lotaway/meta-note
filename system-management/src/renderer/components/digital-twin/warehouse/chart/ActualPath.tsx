import { Colors } from '../styles/constants'

interface ActualPathProps {
  d: string
}

export function ActualPath({ d }: ActualPathProps) {
  if (!d) return null
  return (
    <path
      d={d}
      fill="none"
      stroke={Colors.success}
      strokeWidth={0.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeDasharray="2,1"
    />
  )
}
