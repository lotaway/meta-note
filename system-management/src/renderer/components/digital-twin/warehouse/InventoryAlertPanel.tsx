import { useState, useMemo } from 'react'
import { Card } from './components/Card'
import { ErrorBoundary } from './components/ErrorBoundary'
import { Button } from './components/Button'
import { Colors, Spacing, FontSizes, BorderRadius, Transitions } from './styles/constants'
import { AlertCard, type InventoryAlert } from './alert'

const ALERT_CONFIG = {
  maxHeight: '400px',
  badgePadding: '2px 8px',
  badgeRadius: '10px',
  buttonPadding: `${Spacing.xs} 10px`
} as const

export interface InventoryAlertPanelProps {
  alerts: InventoryAlert[]
  onAlertClick?: (alert: InventoryAlert) => void
  onAcknowledge?: (alertId: string) => void
  onDismiss?: (alertId: string) => void
  autoRefresh?: boolean
  refreshInterval?: number
  maxVisible?: number
  filterLevel?: 'all' | 'critical' | 'warning' | 'info'
  sortBy?: 'severity' | 'occurredAt' | 'priority'
}

// ============ 子组件：摘要统计 ============
function AlertSummary({ summary }: { summary: { critical: number; warning: number; info: number; total: number } }) {
  return (
    <div style={{ display: 'flex', gap: Spacing.lg, fontSize: FontSizes.md }}>
      <span style={{ color: Colors.danger }}>🔴 {summary.critical}</span>
      <span style={{ color: Colors.warning }}>🟡 {summary.warning}</span>
      <span style={{ color: Colors.info }}>🔵 {summary.info}</span>
    </div>
  )
}

// ============ 子组件：过滤器按钮组 ============
interface FilterButtonProps {
  label: string
  isActive: boolean
  onClick: () => void
}

function FilterButton({ label, isActive, onClick }: FilterButtonProps) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: `${Spacing.xs} 10px`,
        borderRadius: BorderRadius.md,
        border: 'none',
        background: isActive ? Colors.border : 'transparent',
        color: isActive ? Colors.text : Colors.textMuted,
        fontSize: FontSizes.sm,
        cursor: 'pointer',
        transition: Transitions.normal
      }}
    >
      {label}
    </button>
  )
}

interface FilterBarProps {
  filter: 'all' | 'unacknowledged' | 'acknowledged'
  setFilter: (f: 'all' | 'unacknowledged' | 'acknowledged') => void
  severityFilter: 'all' | 'critical' | 'warning' | 'info'
  setSeverityFilter: (s: 'all' | 'critical' | 'warning' | 'info') => void
}

function FilterBar({ filter, setFilter, severityFilter, setSeverityFilter }: FilterBarProps) {
  const getSeverityButtonStyle = (s: string) => {
    if (severityFilter !== s) return { background: 'transparent' }
    switch (s) {
      case 'critical': return { background: 'rgba(239, 68, 68, 0.2)' }
      case 'warning': return { background: 'rgba(251, 191, 36, 0.2)' }
      case 'info': return { background: 'rgba(59, 130, 246, 0.2)' }
      default: return { background: Colors.border }
    }
  }

  const getSeverityTextColor = (s: string) => {
    if (severityFilter !== s) return Colors.textMuted
    switch (s) {
      case 'critical': return Colors.danger
      case 'warning': return Colors.warning
      case 'info': return Colors.info
      default: return Colors.text
    }
  }

  return (
    <div style={{ padding: `${Spacing.lg} ${Spacing.xl}`, borderBottom: `1px solid ${Colors.border}`, display: 'flex', gap: Spacing.md }}>
      <FilterButton label="全部" isActive={filter === 'all'} onClick={() => setFilter('all')} />
      <FilterButton label="未处理" isActive={filter === 'unacknowledged'} onClick={() => setFilter('unacknowledged')} />
      <FilterButton label="已处理" isActive={filter === 'acknowledged'} onClick={() => setFilter('acknowledged')} />
      <div style={{ width: '1px', background: Colors.border }} />
      <FilterButton label="全部级别" isActive={severityFilter === 'all'} onClick={() => setSeverityFilter('all')} />
      <button onClick={() => setSeverityFilter('critical')} style={{ padding: `${Spacing.xs} 10px`, borderRadius: BorderRadius.md, border: 'none', ...getSeverityButtonStyle('critical'), color: getSeverityTextColor('critical'), fontSize: FontSizes.sm, cursor: 'pointer', transition: Transitions.normal }}>紧急</button>
      <button onClick={() => setSeverityFilter('warning')} style={{ padding: `${Spacing.xs} 10px`, borderRadius: BorderRadius.md, border: 'none', ...getSeverityButtonStyle('warning'), color: getSeverityTextColor('warning'), fontSize: FontSizes.sm, cursor: 'pointer', transition: Transitions.normal }}>警告</button>
      <button onClick={() => setSeverityFilter('info')} style={{ padding: `${Spacing.xs} 10px`, borderRadius: BorderRadius.md, border: 'none', ...getSeverityButtonStyle('info'), color: getSeverityTextColor('info'), fontSize: FontSizes.sm, cursor: 'pointer', transition: Transitions.normal }}>提示</button>
    </div>
  )
}

// ============ 子组件：告警列表 ============
function AlertList({
  alerts,
  onAlertClick,
  onAcknowledge,
  onDismiss,
  onHandleDismiss
}: {
  alerts: InventoryAlert[]
  onAlertClick?: (alert: InventoryAlert) => void
  onAcknowledge?: (alertId: string) => void
  onDismiss?: (alertId: string) => void
  onHandleDismiss: (id: string) => void
}) {
  if (alerts.length === 0) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: Colors.textMuted, fontSize: FontSizes.lg }}>
        ✓ 暂无告警
      </div>
    )
  }

  return (
    <>
      {alerts.map(alert => (
        <AlertCard
          key={alert.id}
          alert={alert}
          onClick={() => onAlertClick?.(alert)}
          onAcknowledge={onAcknowledge}
          onDismiss={onHandleDismiss}
        />
      ))}
    </>
  )
}

// ============ 主组件 ============
export function InventoryAlertPanel({
  alerts,
  onAlertClick,
  onAcknowledge,
  onDismiss,
  autoRefresh = false,
  refreshInterval = 30000,
  maxVisible = 10
}: InventoryAlertPanelProps) {
  const [filter, setFilter] = useState<'all' | 'unacknowledged' | 'acknowledged'>('all')
  const [severityFilter, setSeverityFilter] = useState<'all' | 'critical' | 'warning' | 'info'>('all')
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set())

  const filteredAlerts = useMemo(() => {
    return alerts.filter(alert => {
      if (dismissedIds.has(alert.id)) return false
      if (filter === 'unacknowledged' && alert.acknowledged) return false
      if (filter === 'acknowledged' && !alert.acknowledged) return false
      if (severityFilter !== 'all' && alert.severity !== severityFilter) return false
      return true
    }).slice(0, maxVisible)
  }, [alerts, dismissedIds, filter, severityFilter, maxVisible])

  const summary = useMemo(() => ({
    critical: alerts.filter(a => a.severity === 'critical' && !a.acknowledged).length,
    warning: alerts.filter(a => a.severity === 'warning' && !a.acknowledged).length,
    info: alerts.filter(a => a.severity === 'info' && !a.acknowledged).length,
    total: alerts.filter(a => !a.acknowledged).length
  }), [alerts])

  const handleDismiss = (id: string) => {
    setDismissedIds(prev => new Set([...prev, id]))
    onDismiss?.(id)
  }

  const header = (
    <div style={{ padding: Spacing.xl, borderBottom: `1px solid ${Colors.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: Spacing.lg }}>
        <span style={{ fontWeight: 600, fontSize: FontSizes.xl }}>库存告警</span>
        {summary.total > 0 && (
          <span style={{ background: Colors.danger, color: '#fff', fontSize: FontSizes.xs, fontWeight: 600, padding: ALERT_CONFIG.badgePadding, borderRadius: ALERT_CONFIG.badgeRadius }}>
            {summary.total}
          </span>
        )}
      </div>
      <AlertSummary summary={summary} />
    </div>
  )

  return (
    <ErrorBoundary>
      <Card>
        {header}
        <FilterBar filter={filter} setFilter={setFilter} severityFilter={severityFilter} setSeverityFilter={setSeverityFilter} />
        <div style={{ maxHeight: ALERT_CONFIG.maxHeight, overflowY: 'auto' }}>
          <AlertList alerts={filteredAlerts} onAlertClick={onAlertClick} onAcknowledge={onAcknowledge} onDismiss={onDismiss} onHandleDismiss={handleDismiss} />
        </div>
      </Card>
    </ErrorBoundary>
  )
}
