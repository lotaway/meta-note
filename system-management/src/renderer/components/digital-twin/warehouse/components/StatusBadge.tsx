import { Colors, FontSizes, BorderRadius, Spacing } from '../styles/constants'

const STATUS_STYLES = {
  pending: { bg: 'rgba(251, 191, 36, 0.2)', text: Colors.warning },
  approved: { bg: 'rgba(34, 197, 94, 0.2)', text: Colors.success },
  ordered: { bg: 'rgba(59, 130, 246, 0.2)', text: Colors.info },
  rejected: { bg: 'rgba(239, 68, 68, 0.2)', text: Colors.danger }
} as const

const STATUS_LABELS = {
  pending: '待审批',
  approved: '已审批',
  ordered: '已下单',
  rejected: '已拒绝'
} as const

interface StatusBadgeProps {
  status: string
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const style = STATUS_STYLES[status as keyof typeof STATUS_STYLES] || { bg: 'rgba(100, 116, 139, 0.2)', text: Colors.textMuted }
  const label = STATUS_LABELS[status as keyof typeof STATUS_LABELS] || status
  return (
    <span style={{
      fontSize: FontSizes.xs,
      padding: `${Spacing.xs} 6px`,
      borderRadius: BorderRadius.sm,
      background: style.bg,
      color: style.text,
      fontWeight: 500
    }}>
      {label}
    </span>
  )
}