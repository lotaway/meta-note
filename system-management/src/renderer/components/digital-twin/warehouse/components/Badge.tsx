import { Colors, Spacing, FontSizes, BorderRadius } from '../styles/constants'

interface BadgeProps {
  label: string
  bgColor: string
  textColor: string
}

export function Badge({ label, bgColor, textColor }: BadgeProps) {
  return (
    <span style={{
      fontSize: FontSizes.xs,
      padding: `${Spacing.xs} 6px`,
      borderRadius: BorderRadius.sm,
      background: bgColor,
      color: textColor,
      fontWeight: 500
    }}>
      {label}
    </span>
  )
}