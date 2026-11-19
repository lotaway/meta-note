import { t } from '../../../i18n'
import { useState, useEffect } from 'react'
import { alertRuleApi, type AlertRule } from '../../../services/api/alertRule'
import { AlertRuleForm } from './AlertRuleForm'

const LEVEL_COLORS: Record<string, string> = {
  INFO: '#3b82f6',
  WARNING: '#f59e0b',
  ERROR: '#ef4444',
  CRITICAL: '#dc2626',
}

export function AlertRuleList() {
  const [rules, setRules] = useState<AlertRule[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingRule, setEditingRule] = useState<AlertRule | null>(null)
  const [filter, setFilter] = useState<'all' | 'enabled' | 'disabled'>('all')

  const loadRules = async () => {
    setLoading(true)
    try {
      const data = await alertRuleApi.list()
      setRules(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.loadFailed'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRules()
  }, [])

  const handleEnable = async (id: number, enabled: boolean) => {
    try {
      if (enabled) {
        await alertRuleApi.disable(id)
      } else {
        await alertRuleApi.enable(id)
      }
      loadRules()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.operationFailed'))
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm(t('alertRule.confirmDelete'))) return
    try {
      await alertRuleApi.delete(id)
      loadRules()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.deleteFailed'))
    }
  }

  const filteredRules = rules.filter(r => {
    if (filter === 'enabled') return r.enabled
    if (filter === 'disabled') return !r.enabled
    return true
  })

  const containerStyle: React.CSSProperties = {
    background: '#1e293b',
    borderRadius: '8px',
    padding: '16px',
    marginTop: '16px',
  }

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  }

  const buttonStyle: React.CSSProperties = {
    padding: '8px 16px',
    background: '#3b82f6',
    border: 'none',
    borderRadius: '6px',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '14px',
  }

  if (loading) {
    return <div style={{ color: '#94a3b8', textAlign: 'center', padding: '40px' }}>{t('common.loading')}</div>
  }

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <h3 style={{ margin: 0, color: '#e2e8f0' }}>{t('alertRule.listTitle')}</h3>
        <div style={{ display: 'flex', gap: '8px' }}>
          <select
            value={filter}
            onChange={e => setFilter(e.target.value as any)}
            style={{
              padding: '6px 12px',
              background: '#0f172a',
              border: '1px solid #334155',
              borderRadius: '6px',
              color: '#e2e8f0',
            }}
          >
            <option value="all">{t('common.all')}</option>
            <option value="enabled">{t('alertRule.filter.enabled')}</option>
            <option value="disabled">{t('alertRule.filter.disabled')}</option>
          </select>
          <button style={buttonStyle} onClick={() => { setEditingRule(null); setShowForm(true) }}>
            {t('alertRule.createRule')}
          </button>
        </div>
      </div>

      {error && (
        <div style={{ padding: '12px', background: '#7f1d1d', borderRadius: '6px', color: '#fecaca', marginBottom: '16px' }}>
          {error}
        </div>
      )}

      {filteredRules.length === 0 ? (
        <div style={{ color: '#94a3b8', textAlign: 'center', padding: '40px' }}>{t('alertRule.listEmpty')}</div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #334155' }}>
              <th style={{ textAlign: 'left', padding: '12px 8px', color: '#94a3b8', fontSize: '13px' }}>{t('alertRule.column.ruleCode')}</th>
              <th style={{ textAlign: 'left', padding: '12px 8px', color: '#94a3b8', fontSize: '13px' }}>{t('alertRule.column.ruleName')}</th>
              <th style={{ textAlign: 'left', padding: '12px 8px', color: '#94a3b8', fontSize: '13px' }}>{t('alertRule.column.metric')}</th>
              <th style={{ textAlign: 'left', padding: '12px 8px', color: '#94a3b8', fontSize: '13px' }}>{t('alertRule.column.condition')}</th>
              <th style={{ textAlign: 'left', padding: '12px 8px', color: '#94a3b8', fontSize: '13px' }}>{t('alertRule.column.level')}</th>
              <th style={{ textAlign: 'center', padding: '12px 8px', color: '#94a3b8', fontSize: '13px' }}>{t('alertRule.column.status')}</th>
              <th style={{ textAlign: 'center', padding: '12px 8px', color: '#94a3b8', fontSize: '13px' }}>{t('alertRule.column.action')}</th>
            </tr>
          </thead>
          <tbody>
            {filteredRules.map(rule => (
              <tr key={rule.id} style={{ borderBottom: '1px solid #334155' }}>
                <td style={{ padding: '12px 8px', color: '#e2e8f0', fontSize: '13px' }}>{rule.ruleCode}</td>
                <td style={{ padding: '12px 8px', color: '#e2e8f0', fontSize: '13px' }}>{rule.ruleName}</td>
                <td style={{ padding: '12px 8px', color: '#94a3b8', fontSize: '13px' }}>
                  {rule.metricType}/{rule.operator}
                </td>
                <td style={{ padding: '12px 8px', color: '#94a3b8', fontSize: '13px' }}>{rule.thresholdValue}</td>
                <td style={{ padding: '12px 8px' }}>
                  <span style={{
                    display: 'inline-block',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    background: LEVEL_COLORS[rule.level] + '20',
                    color: LEVEL_COLORS[rule.level],
                  }}>
                    {rule.level}
                  </span>
                </td>
                <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                  <button
                    onClick={() => handleEnable(rule.id, rule.enabled)}
                    style={{
                      padding: '4px 12px',
                      background: rule.enabled ? '#10b981' : '#64748b',
                      border: 'none',
                      borderRadius: '4px',
                      color: '#fff',
                      cursor: 'pointer',
                      fontSize: '12px',
                    }}
                  >
                    {rule.enabled ? t('alertRule.enabled') : t('alertRule.disabled')}
                  </button>
                </td>
                <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                  <button
                    onClick={() => { setEditingRule(rule); setShowForm(true) }}
                    style={{
                      padding: '4px 12px',
                      background: '#3b82f6',
                      border: 'none',
                      borderRadius: '4px',
                      color: '#fff',
                      cursor: 'pointer',
                      fontSize: '12px',
                      marginRight: '8px',
                    }}
                  >{t('common.edit')}</button>
                  <button
                    onClick={() => handleDelete(rule.id)}
                    style={{
                      padding: '4px 12px',
                      background: '#ef4444',
                      border: 'none',
                      borderRadius: '4px',
                      color: '#fff',
                      cursor: 'pointer',
                      fontSize: '12px',
                    }}
                  >{t('common.delete')}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {showForm && (
        <AlertRuleForm
          rule={editingRule}
          onSave={() => { setShowForm(false); setEditingRule(null); loadRules() }}
          onCancel={() => { setShowForm(false); setEditingRule(null) }}
        />
      )}
    </div>
  )
}