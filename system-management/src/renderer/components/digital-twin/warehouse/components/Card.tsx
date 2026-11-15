import { ReactNode } from 'react'
import { Colors, Spacing, BorderRadius } from '../styles/constants'

interface CardProps {
  children: ReactNode
  style?: React.CSSProperties
}

export function Card({ children, style }: CardProps) {
  return (
    <div style={{
      background: Colors.background,
      borderRadius: BorderRadius.xl,
      border: `1px solid ${Colors.border}`,
      color: Colors.text,
      fontFamily: 'system-ui, -apple-system, sans-serif',
      ...style
    }}>
      {children}
    </div>
  )
}