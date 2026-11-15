import { useState, useEffect } from 'react'
import { alertRuleApi, type AlertRule, type CreateAlertRuleRequest, type UpdateAlertRuleRequest } from '../../../services/api/alertRule'

interface AlertRuleFormProps {
  rule?: AlertRule | null
  onSave: () => void
  onCancel: () => void
}

const METRIC_TYPES = [
  { value: 'TEMPERATURE', label: '温度' },
  { value: 'HUMIDITY', label: '湿度' },
  { value: 'PRESSURE', label: '压力' },
  { value: 'VIBRATION', label: '振动' },
  { value: 'POWER', label: '功率' },
  { value: 'RPM', label: '转速' },
  { value: 'PRODUCTION_RATE', label: '生产率' },
  { value: 'DEFECT_RATE', label: '缺陷率' },
  { value: 'RESPONSE_TIME', label: '响应时间' },
]

const OPERATORS = [
  { value: 'GREATER_THAN', label: '大于' },
  { value: 'LESS_THAN', label: '小于' },
  { value: 'GREATER_OR_EQUAL', label: '大于等于' },
  { value: 'LESS_OR_EQUAL', label: '小于等于' },
  { value: 'EQUAL', label: '等于' },
  { value: 'NOT_EQUAL', label: '不等于' },
  { value: 'BETWEEN', label: '介于' },
  { value: 'OUTSIDE', label: '超出范围' },
]

const LEVELS = [
  { value: 'INFO', label: '信息', color: '#3b82f6' },
  { value: 'WARNING', label: '警告', color: '#f59e0b' },
  { value: 'ERROR', label: '错误', color: '#ef4444' },
  { value: 'CRITICAL', label: '严重', color: '#dc2626' },
]

const ALERT_TYPES = [
  { value: 'DEVICE_OFFLINE', label: '设备离线' },
  { value: 'DEVICE_ERROR', label: '设备错误' },
  { value: 'TEMPERATURE_HIGH', label: '温度过高' },
  { value: 'PRESSURE_ABNORMAL', label: '压力异常' },
  { value: 'VIBRATION_ABNORMAL', label: '振动异常' },
  { value: 'PRODUCTION_STOP', label: '生产停止' },
  { value: 'QUALITY_ISSUE', label: '质量问题' },
  { value: 'MAINTENANCE_DUE', label: '维护到期' },
  { value: 'NETWORK_ERROR', label: '网络错误' },
  { value: 'POWER_FAILURE', label: '电源故障' },
  { value: 'SAFETY_ISSUE', label: '安全问题' },
]

export function AlertRuleForm({ rule, onSave, onCancel }: AlertRuleFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState<CreateAlertRuleRequest>({
    ruleCode: rule?.ruleCode || `RULE-${Date.now()}`,
    ruleName: rule?.ruleName || '',
    description: rule?.description || '',
    deviceType: rule?.deviceType || 'SENSOR',
    metricType: rule?.metricType || 'TEMPERATURE',
    operator: rule?.operator || 'GREATER_THAN',
    thresholdValue: rule?.thresholdValue || 80,
    level: rule?.level || 'WARNING',
    alertType: rule?.alertType || 'TEMPERATURE_HIGH',
    titleTemplate: rule?.titleTemplate || '设备 {device} 告警',
    descriptionTemplate: rule?.descriptionTemplate || '当前值 {value} 超过阈值 {threshold}',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      if (rule) {
        const updateData = {
          ruleName: formData.ruleName,
          description: formData.description,
          deviceType: formData.deviceType,
          metricType: formData.metricType,
          operator: formData.operator,
          thresholdValue: formData.thresholdValue,
          durationSeconds: 300,
          level: formData.level,
          alertType: formData.alertType,
          titleTemplate: formData.titleTemplate,
          descriptionTemplate: formData.descriptionTemplate,
          cooldownSeconds: 60,
          maxAlertsPerHour: 10,
          notificationChannels: 'system'
        }
        await alertRuleApi.update(rule.id, updateData)
      } else {
        await alertRuleApi.create(formData)
      }
      onSave()
    } catch (err) {
      setError(err instanceof Error ? err.message : '操作失败')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px 12px',
    background: '#0f172a',
    border: '1px solid #334155',
    borderRadius: '6px',
    color: '#e2e8f0',
    fontSize: '14px',
    outline: 'none',
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    marginBottom: '6px',
    color: '#94a3b8',
    fontSize: '13px',
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    }} onClick={onCancel}>
      <div style={{
        background: '#1e293b',
        borderRadius: '12px',
        padding: '24px',
        width: '90%',
        maxWidth: '600px',
        maxHeight: '90vh',
        overflow: 'auto',
      }} onClick={e => e.stopPropagation()}>
        <h2 style={{ margin: '0 0 20px', color: '#e2e8f0', fontSize: '18px' }}>
          {rule ? '编辑告警规则' : '创建告警规则'}
        </h2>

        {error && (
          <div style={{
            padding: '12px',
            background: '#7f1d1d',
            borderRadius: '6px',
            color: '#fecaca',
            marginBottom: '16px',
          }}>{error}</div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={labelStyle}>规则编码 *</label>
              <input
                type="text"
                value={formData.ruleCode}
                onChange={e => setFormData({ ...formData, ruleCode: e.target.value })}
                style={inputStyle}
                required
                disabled={!!rule}
              />
            </div>

            <div>
              <label style={labelStyle}>规则名称 *</label>
              <input
                type="text"
                value={formData.ruleName}
                onChange={e => setFormData({ ...formData, ruleName: e.target.value })}
                style={inputStyle}
                required
              />
            </div>

            <div>
              <label style={labelStyle}>设备类型</label>
              <input
                type="text"
                value={formData.deviceType}
                onChange={e => setFormData({ ...formData, deviceType: e.target.value })}
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>指标类型 *</label>
              <select
                value={formData.metricType}
                onChange={e => setFormData({ ...formData, metricType: e.target.value })}
                style={inputStyle}
              >
                {METRIC_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={labelStyle}>比较操作符 *</label>
              <select
                value={formData.operator}
                onChange={e => setFormData({ ...formData, operator: e.target.value })}
                style={inputStyle}
              >
                {OPERATORS.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={labelStyle}>阈值 *</label>
              <input
                type="number"
                step="0.1"
                value={formData.thresholdValue}
                onChange={e => setFormData({ ...formData, thresholdValue: parseFloat(e.target.value) })}
                style={inputStyle}
                required
              />
            </div>

            <div>
              <label style={labelStyle}>告警级别 *</label>
              <select
                value={formData.level}
                onChange={e => setFormData({ ...formData, level: e.target.value })}
                style={inputStyle}
              >
                {LEVELS.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={labelStyle}>告警类型 *</label>
              <select
                value={formData.alertType}
                onChange={e => setFormData({ ...formData, alertType: e.target.value })}
                style={inputStyle}
              >
                {ALERT_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ marginTop: '16px' }}>
            <label style={labelStyle}>描述</label>
            <textarea
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              style={{ ...inputStyle, minHeight: '60px', resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' }}>
            <div>
              <label style={labelStyle}>标题模板</label>
              <input
                type="text"
                value={formData.titleTemplate}
                onChange={e => setFormData({ ...formData, titleTemplate: e.target.value })}
                style={inputStyle}
                placeholder="使用 {device}, {value} 占位符"
              />
            </div>

            <div>
              <label style={labelStyle}>描述模板</label>
              <input
                type="text"
                value={formData.descriptionTemplate}
                onChange={e => setFormData({ ...formData, descriptionTemplate: e.target.value })}
                style={inputStyle}
                placeholder="使用 {value}, {threshold} 占位符"
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onCancel}
              style={{
                padding: '10px 20px',
                background: '#334155',
                border: 'none',
                borderRadius: '6px',
                color: '#e2e8f0',
                cursor: 'pointer',
              }}
            >
              取消
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '10px 20px',
                background: loading ? '#475569' : '#3b82f6',
                border: 'none',
                borderRadius: '6px',
                color: '#fff',
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? '保存中...' : '保存'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}