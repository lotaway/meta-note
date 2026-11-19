import { t } from '../../../../i18n'
import { Colors, FontSizes, BorderRadius, Spacing } from '../styles/constants'

const URGENCY_STYLES = {
  critical: { bg: 'rgba(239, 68, 68, 0.15)', border: Colors.danger, label: t('warehouse.urgency.critical'), labelColor: Colors.danger },
  high: { bg: 'rgba(251, 191, 36, 0.15)', border: Colors.warning, label: t('warehouse.urgency.high'), labelColor: Colors.warning },
  medium: { bg: 'rgba(59, 130, 246, 0.15)', border: Colors.info, label: t('warehouse.urgency.medium'), labelColor: Colors.info },
  low: { bg: 'rgba(100, 116, 139, 0.15)', border: Colors.textMuted, label: t('warehouse.urgency.low'), labelColor: Colors.textMuted }
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