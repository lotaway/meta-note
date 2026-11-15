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
      setError(err instanceof Error ? err.message : '加载失败')
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
      setError(err instanceof Error ? err.message : '操作失败')
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这条告警规则吗？')) return
    try {
      await alertRuleApi.delete(id)
      loadRules()
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除失败')
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
    return <div style={{ color: '#94a3b8', textAlign: 'center', padding: '40px' }}>加载中...</div>
  }

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <h3 style={{ margin: 0, color: '#e2e8f0' }}>告警规则配置</h3>
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
            <option value="all">全部</option>
            <option value="enabled">已启用</option>
            <option value="disabled">已禁用</option>
          </select>
          <button style={buttonStyle} onClick={() => { setEditingRule(null); setShowForm(true) }}>
            + 创建规则
          </button>
        </div>
      </div>

      {error && (
        <div style={{ padding: '12px', background: '#7f1d1d', borderRadius: '6px', color: '#fecaca', marginBottom: '16px' }}>
          {error}
        </div>
      )}

      {filteredRules.length === 0 ? (
        <div style={{ color: '#94a3b8', textAlign: 'center', padding: '40px' }}>暂无告警规则</div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #334155' }}>
              <th style={{ textAlign: 'left', padding: '12px 8px', color: '#94a3b8', fontSize: '13px' }}>规则编码</th>
              <th style={{ textAlign: 'left', padding: '12px 8px', color: '#94a3b8', fontSize: '13px' }}>规则名称</th>
              <th style={{ textAlign: 'left', padding: '12px 8px', color: '#94a3b8', fontSize: '13px' }}>指标</th>
              <th style={{ textAlign: 'left', padding: '12px 8px', color: '#94a3b8', fontSize: '13px' }}>条件</th>
              <th style={{ textAlign: 'left', padding: '12px 8px', color: '#94a3b8', fontSize: '13px' }}>级别</th>
              <th style={{ textAlign: 'center', padding: '12px 8px', color: '#94a3b8', fontSize: '13px' }}>状态</th>
              <th style={{ textAlign: 'center', padding: '12px 8px', color: '#94a3b8', fontSize: '13px' }}>操作</th>
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
                    {rule.enabled ? '启用' : '禁用'}
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
                  >
                    编辑
                  </button>
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
                  >
                    删除
                  </button>
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