import { t } from '../../../i18n'
import { useState } from 'react'

export interface Alert {
  id: string
  code: string
  deviceCode: string
  deviceName: string
  level: 'info' | 'warning' | 'error' | 'critical'
  type: string
  title: string
  description: string
  status: 'triggered' | 'acknowledged' | 'in_progress' | 'resolved'
  occurredAt: string
}

interface AlertPanelProps {
  alerts: Alert[]
  onAcknowledge?: (alertId: string) => void
  onResolve?: (alertId: string) => void
  onAlertClick?: (alert: Alert) => void
}

const levelColors: Record<string, string> = {
  info: '#3b82f6',
  warning: '#f59e0b',
  error: '#ef4444',
  critical: '#dc2626'
}

const levelLabels: Record<string, string> = {
  info: t('common.level.info'),
  warning: t('common.level.warning'),
  error: t('common.level.error'),
  critical: t('common.level.critical')
}

const statusLabels: Record<string, string> = {
  triggered: t('alert.status.triggered'),
  acknowledged: t('alert.status.acknowledged'),
  in_progress: t('alert.status.in_progress'),
  resolved: t('alert.status.resolved')
}

export function AlertPanel({ alerts, onAcknowledge, onResolve, onAlertClick }: AlertPanelProps) {
  const [filter, setFilter] = useState<string>('all')
  const [levelFilter, setLevelFilter] = useState<string>('all')

  const filteredAlerts = alerts.filter(alert => {
    if (filter !== 'all' && alert.status !== filter) return false
    if (levelFilter !== 'all' && alert.level !== levelFilter) return false
    return true
  })

  const unreadCount = alerts.filter(a => a.status === 'triggered').length
  const criticalCount = alerts.filter(a => a.level === 'critical' && a.status === 'triggered').length

  return (
    <div style={{
      background: '#1e293b',
      borderRadius: '8px',
      padding: '16px',
      color: '#e2e8f0'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ margin: 0, fontSize: '18px' }}>{t('alert.title')}</h3>
        <div style={{ display: 'flex', gap: '8px' }}>
          {unreadCount > 0 && (
            <span style={{
              background: '#ef4444',
              color: 'white',
              padding: '2px 8px',
              borderRadius: '10px',
              fontSize: '12px'
            }}>
              {t('alert.unreadCount', { count: unreadCount })}
            </span>
          )}
          {criticalCount > 0 && (
            <span style={{
              background: '#dc2626',
              color: 'white',
              padding: '2px 8px',
              borderRadius: '10px',
              fontSize: '12px',
              animation: 'pulse 2s infinite'
            }}>
              {t('alert.criticalCount', { count: criticalCount })}
            </span>
          )}
        </div>
      </div>

      {/* Filters */}
      <div style={{ marginBottom: '12px' }}>
        <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
          <FilterChip active={levelFilter === 'all'} onClick={() => setLevelFilter('all')}>{t('alert.filterAllLevels')}</FilterChip>
          <FilterChip active={levelFilter === 'critical'} onClick={() => setLevelFilter('critical')} color="#dc2626">{t('common.level.critical')}</FilterChip>
          <FilterChip active={levelFilter === 'error'} onClick={() => setLevelFilter('error')} color="#ef4444">{t('common.level.error')}</FilterChip>
          <FilterChip active={levelFilter === 'warning'} onClick={() => setLevelFilter('warning')} color="#f59e0b">{t('common.level.warning')}</FilterChip>
        </div>
        <div style={{ display: 'flex', gap: '4px' }}>
          <FilterChip active={filter === 'all'} onClick={() => setFilter('all')}>{t('common.all')}</FilterChip>
          <FilterChip active={filter === 'triggered'} onClick={() => setFilter('triggered')}>{t('alert.status.triggered')}</FilterChip>
          <FilterChip active={filter === 'acknowledged'} onClick={() => setFilter('acknowledged')}>{t('alert.status.acknowledged')}</FilterChip>
          <FilterChip active={filter === 'resolved'} onClick={() => setFilter('resolved')}>{t('alert.status.resolved')}</FilterChip>
        </div>
      </div>

      {/* Alert List */}
      <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
        {filteredAlerts.map(alert => (
          <div
            key={alert.id}
            onClick={() => onAlertClick?.(alert)}
            style={{
              padding: '12px',
              marginBottom: '8px',
              background: '#334155',
              borderRadius: '6px',
              borderLeft: `4px solid ${levelColors[alert.level]}`,
              cursor: 'pointer'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{
                    background: levelColors[alert.level],
                    color: 'white',
                    padding: '2px 6px',
                    borderRadius: '3px',
                    fontSize: '10px'
                  }}>
                    {levelLabels[alert.level]}
                  </span>
                  <span style={{ fontWeight: 'bold' }}>{alert.title}</span>
                </div>
                <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                  {alert.deviceName} - {alert.description}
                </div>
                <div style={{ fontSize: '10px', color: '#64748b', marginTop: '4px' }}>
                  {new Date(alert.occurredAt).toLocaleString()}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {alert.status === 'triggered' && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onAcknowledge?.(alert.id) }}
                    style={{
                      padding: '4px 8px',
                      background: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '11px'
                    }}
                  >{t('common.confirm')}</button>
                )}
                {alert.status === 'acknowledged' && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onResolve?.(alert.id) }}
                    style={{
                      padding: '4px 8px',
                      background: '#10b981',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '11px'
                    }}
                  >{t('common.resolve')}</button>
                )}
              </div>
            </div>
          </div>
        ))}
        {filteredAlerts.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>{t('alert.noAlerts')}</div>
        )}
      </div>
    </div>
  )
}

function FilterChip({ active, onClick, children, color }: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  color?: string;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '4px 10px',
        borderRadius: '12px',
        border: 'none',
        cursor: 'pointer',
        background: active ? (color || '#3b82f6') : '#475569',
        color: 'white',
        fontSize: '11px',
        transition: 'all 0.2s'
      }}
    >
      {children}
    </button>
  )
}