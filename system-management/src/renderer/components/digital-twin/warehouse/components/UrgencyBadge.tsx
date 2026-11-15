import { Colors, FontSizes, BorderRadius, Spacing } from '../styles/constants'

const URGENCY_STYLES = {
  critical: { bg: 'rgba(239, 68, 68, 0.15)', border: Colors.danger, label: '紧急', labelColor: Colors.danger },
  high: { bg: 'rgba(251, 191, 36, 0.15)', border: Colors.warning, label: '高', labelColor: Colors.warning },
  medium: { bg: 'rgba(59, 130, 246, 0.15)', border: Colors.info, label: '中', labelColor: Colors.info },
  low: { bg: 'rgba(100, 116, 139, 0.15)', border: Colors.textMuted, label: '低', labelColor: Colors.textMuted }
} as const

interface UrgencyBadgeProps {
  urgency: string
}

export function UrgencyBadge({ urgency }: UrgencyBadgeProps) {
  const style = URGENCY_STYLES[urgency as keyof typeof URGENCY_STYLES] || URGENCY_STYLES.low
  return (
    <span style={{
      fontSize: FontSizes.xs,
      padding: `${Spacing.xs} 6px`,
      borderRadius: BorderRadius.sm,
      background: style.bg,
      color: style.labelColor,
      fontWeight: 500
    }}>
      {style.label}
    </span>
  )
}