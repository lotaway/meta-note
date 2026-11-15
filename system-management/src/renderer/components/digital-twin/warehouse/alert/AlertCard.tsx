import { Button } from '../components/Button'
import { Colors, Spacing, FontSizes, BorderRadius, Transitions } from '../styles/constants'
import { formatDateTime } from '../utils/format'

const ALERT_CONFIG = {
  iconMarginLeft: '24px',
  buttonPadding: `${Spacing.xs} 10px`
} as const

const SEVERITY_STYLES = {
  critical: { bg: 'rgba(239, 68, 68, 0.15)', border: Colors.danger, text: Colors.danger, icon: '🔴' },
  warning: { bg: 'rgba(251, 191, 36, 0.15)', border: Colors.warning, text: Colors.warning, icon: '🟡' },
  info: { bg: 'rgba(59, 130, 246, 0.15)', border: Colors.info, text: Colors.info, icon: '🔵' }
} as const

const TYPE_LABELS: Record<string, string> = {
  low_stock: '库存偏低', critical_stock: '库存紧急', overstock: '库存超储',
  expiring: '即将过期', expired: '已过期', anomaly: '数据异常'
}

export interface InventoryAlert {
  id: string
  type: 'low_stock' | 'critical_stock' | 'overstock' | 'expiring' | 'expired' | 'anomaly'
  severity: 'info' | 'warning' | 'critical'
  title: string
  message: string
  itemId: string
  itemSku: string
  itemName: string
  currentValue?: number
  thresholdValue?: number
  createdAt: string
  acknowledged: boolean
  acknowledgedBy?: string
  acknowledgedAt?: string
}

interface AlertCardProps {
  alert: InventoryAlert
  onClick?: () => void
  onAcknowledge?: (id: string) => void
  onDismiss?: (id: string) => void
}

function getSeverityStyle(severity: 'info' | 'warning' | 'critical') {
  return SEVERITY_STYLES[severity] || SEVERITY_STYLES.info
}

function getTypeLabel(type: string): string {
  return TYPE_LABELS[type] || type
}

export function AlertCard({ alert, onClick, onAcknowledge, onDismiss }: AlertCardProps) {
  const style = getSeverityStyle(alert.severity)

  const handleAck = (e: React.MouseEvent) => {
    e.stopPropagation()
    onAcknowledge?.(alert.id)
  }

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation()
    onDismiss?.(alert.id)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') onClick?.()
  }

  const cardStyle = alert.acknowledged
    ? { background: 'transparent' }
    : { background: style.bg }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      style={{
        padding: `${Spacing.lg} ${Spacing.xl}`,
        borderBottom: `1px solid ${Colors.borderLight}`,
        borderLeft: `3px solid ${style.border}`,
        cursor: 'pointer',
        transition: Transitions.normal,
        ...cardStyle
      }}
      aria-label={`${alert.title} - ${alert.severity}`}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.sm }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: Spacing.md }}>
          <span>{style.icon}</span>
          <span style={{ fontWeight: 500, fontSize: FontSizes.lg }}>{alert.title}</span>
          <span style={{ fontSize: FontSizes.xs, padding: `${Spacing.xs} 6px`, borderRadius: BorderRadius.sm, background: style.bg, color: style.text }}>
            {getTypeLabel(alert.type)}
          </span>
        </div>
        <span style={{ fontSize: FontSizes.sm, color: Colors.textMuted }}>{formatDateTime(alert.createdAt)}</span>
      </div>
      <div style={{ fontSize: FontSizes.md, color: Colors.textSecondary, marginBottom: Spacing.md, marginLeft: ALERT_CONFIG.iconMarginLeft }}>
        {alert.message}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginLeft: ALERT_CONFIG.iconMarginLeft }}>
        <div style={{ fontSize: FontSizes.sm, color: Colors.textMuted }}>
          <span style={{ color: Colors.primary }}>{alert.itemSku}</span>
          <span style={{ margin: `0 ${Spacing.sm}` }}>•</span>
          <span>{alert.itemName}</span>
          {alert.currentValue !== undefined && alert.thresholdValue !== undefined && (
            <span style={{ marginLeft: Spacing.md, color: style.text }}>{alert.currentValue} / {alert.thresholdValue}</span>
          )}
        </div>
        <div style={{ display: 'flex', gap: Spacing.md }}>
          {!alert.acknowledged && onAcknowledge && (
            <Button onClick={handleAck} style={{ padding: ALERT_CONFIG.buttonPadding }}>标记已读</Button>
          )}
          {onDismiss && (
            <Button variant="ghost" onClick={handleDismiss} style={{ padding: ALERT_CONFIG.buttonPadding }}>✕</Button>
          )}
        </div>
      </div>
    </div>
  )
}
