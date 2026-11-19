import { t } from '../../../i18n'
import { useState, useEffect } from 'react'
import { alertRuleApi, type AlertRule, type CreateAlertRuleRequest, type UpdateAlertRuleRequest } from '../../../services/api/alertRule'

interface AlertRuleFormProps {
  rule?: AlertRule | null
  onSave: () => void
  onCancel: () => void
}

const METRIC_TYPES = [
  { value: 'TEMPERATURE', label: t('alertRule.metric.TEMPERATURE') },
  { value: 'HUMIDITY', label: t('alertRule.metric.HUMIDITY') },
  { value: 'PRESSURE', label: t('alertRule.metric.PRESSURE') },
  { value: 'VIBRATION', label: t('alertRule.metric.VIBRATION') },
  { value: 'POWER', label: t('alertRule.metric.POWER') },
  { value: 'RPM', label: t('alertRule.metric.RPM') },
  { value: 'PRODUCTION_RATE', label: t('alertRule.metric.PRODUCTION_RATE') },
  { value: 'DEFECT_RATE', label: t('alertRule.metric.DEFECT_RATE') },
  { value: 'RESPONSE_TIME', label: t('alertRule.metric.RESPONSE_TIME') },
]

const OPERATORS = [
  { value: 'GREATER_THAN', label: t('alertRule.operator.GREATER_THAN') },
  { value: 'LESS_THAN', label: t('alertRule.operator.LESS_THAN') },
  { value: 'GREATER_OR_EQUAL', label: t('alertRule.operator.GREATER_OR_EQUAL') },
  { value: 'LESS_OR_EQUAL', label: t('alertRule.operator.LESS_OR_EQUAL') },
  { value: 'EQUAL', label: t('alertRule.operator.EQUAL') },
  { value: 'NOT_EQUAL', label: t('alertRule.operator.NOT_EQUAL') },
  { value: 'BETWEEN', label: t('alertRule.operator.BETWEEN') },
  { value: 'OUTSIDE', label: t('alertRule.operator.OUTSIDE') },
]

const LEVELS = [
  { value: 'INFO', label: t('common.level.info'), color: '#3b82f6' },
  { value: 'WARNING', label: t('common.level.warning'), color: '#f59e0b' },
  { value: 'ERROR', label: t('common.level.error'), color: '#ef4444' },
  { value: 'CRITICAL', label: t('common.level.critical'), color: '#dc2626' },
]

const ALERT_TYPES = [
  { value: 'DEVICE_OFFLINE', label: t('alertRule.type.DEVICE_OFFLINE') },
  { value: 'DEVICE_ERROR', label: t('alertRule.type.DEVICE_ERROR') },
  { value: 'TEMPERATURE_HIGH', label: t('alertRule.type.TEMPERATURE_HIGH') },
  { value: 'PRESSURE_ABNORMAL', label: t('alertRule.type.PRESSURE_ABNORMAL') },
  { value: 'VIBRATION_ABNORMAL', label: t('alertRule.type.VIBRATION_ABNORMAL') },
  { value: 'PRODUCTION_STOP', label: t('alertRule.type.PRODUCTION_STOP') },
  { value: 'QUALITY_ISSUE', label: t('alertRule.type.QUALITY_ISSUE') },
  { value: 'MAINTENANCE_DUE', label: t('alertRule.type.MAINTENANCE_DUE') },
  { value: 'NETWORK_ERROR', label: t('alertRule.type.NETWORK_ERROR') },
  { value: 'POWER_FAILURE', label: t('alertRule.type.POWER_FAILURE') },
  { value: 'SAFETY_ISSUE', label: t('alertRule.type.SAFETY_ISSUE') },
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
    titleTemplate: rule?.titleTemplate || t('alertRule.defaultTitleTemplate'),
    descriptionTemplate: rule?.descriptionTemplate || t('alertRule.defaultDescriptionTemplate'),
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
      setError(err instanceof Error ? err.message : t('common.operationFailed'))
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
          {rule ? t('alertRule.formEdit') : t('alertRule.formCreate')}
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
              <label style={labelStyle}>{t('alertRule.field.ruleCode')}</label>
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
              <label style={labelStyle}>{t('alertRule.field.ruleName')}</label>
              <input
                type="text"
                value={formData.ruleName}
                onChange={e => setFormData({ ...formData, ruleName: e.target.value })}
                style={inputStyle}
                required
              />
            </div>

            <div>
              <label style={labelStyle}>{t('alertRule.field.deviceType')}</label>
              <input
                type="text"
                value={formData.deviceType}
                onChange={e => setFormData({ ...formData, deviceType: e.target.value })}
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>{t('alertRule.field.metric')}</label>
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
              <label style={labelStyle}>{t('alertRule.field.operator')}</label>
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
              <label style={labelStyle}>{t('alertRule.field.threshold')}</label>
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
              <label style={labelStyle}>{t('alertRule.field.level')}</label>
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
              <label style={labelStyle}>{t('alertRule.field.type')}</label>
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
            <label style={labelStyle}>{t('alertRule.field.description')}</label>
            <textarea
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              style={{ ...inputStyle, minHeight: '60px', resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' }}>
            <div>
              <label style={labelStyle}>{t('alertRule.field.titleTemplate')}</label>
              <input
                type="text"
                value={formData.titleTemplate}
                onChange={e => setFormData({ ...formData, titleTemplate: e.target.value })}
                style={inputStyle}
                placeholder={t('alertRule.placeholder.titleTemplate')}
              />
            </div>

            <div>
              <label style={labelStyle}>{t('alertRule.field.descriptionTemplate')}</label>
              <input
                type="text"
                value={formData.descriptionTemplate}
                onChange={e => setFormData({ ...formData, descriptionTemplate: e.target.value })}
                style={inputStyle}
                placeholder={t('alertRule.placeholder.descriptionTemplate')}
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
            >{t('common.cancel')}</button>
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
              {loading ? t('common.saving') : t('common.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}