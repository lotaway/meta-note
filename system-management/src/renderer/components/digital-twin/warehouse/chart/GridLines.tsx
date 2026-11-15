import { Colors } from '../styles/constants'

export function GridLines() {
  return (<>{[0, 25, 50, 75, 100].map(y => <line key={y} x1="0" y1={y} x2="100" y2={y} stroke={Colors.border} strokeWidth={0.2} />)}</>)
}
