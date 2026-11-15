import { ButtonHTMLAttributes } from 'react'
import { Colors, Spacing, FontSizes, BorderRadius, Transitions } from '../styles/constants'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md'
}

export function Button({ 
  variant = 'secondary', 
  size = 'sm',
  style,
  ...props 
}: ButtonProps) {
  const baseStyle: React.CSSProperties = {
    padding: size === 'sm' ? `${Spacing.sm} ${Spacing.lg}` : `${Spacing.md} ${Spacing.xl}`,
    borderRadius: BorderRadius.md,
    border: 'none',
    fontSize: size === 'sm' ? FontSizes.sm : FontSizes.md,
    cursor: 'pointer',
    transition: Transitions.normal,
    ...style
  }

  const variantStyles: Record<string, React.CSSProperties> = {
    primary: { background: Colors.success, color: '#fff' },
    secondary: { background: 'transparent', border: `1px solid ${Colors.border}`, color: Colors.textSecondary },
    danger: { background: Colors.danger, color: '#fff' },
    ghost: { background: 'transparent', color: Colors.textMuted }
  }

  return (
    <button 
      {...props} 
      style={{ ...baseStyle, ...variantStyles[variant] }}
    />
  )
}