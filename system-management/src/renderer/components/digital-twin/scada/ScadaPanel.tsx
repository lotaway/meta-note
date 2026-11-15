import { useEffect, useState } from 'react'
import { mesApi, type TelemetryRecord, type DeviceCommand } from '../../../services/mes-api'

const containerStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 12 }

const cardStyle: React.CSSProperties = {
  background: '#1e293b',
  borderRadius: 8,
  padding: 12,
  border: '1px solid #334155',
}

const headerStyle: React.CSSProperties = {
  fontSize: 13,
  color: '#94a3b8',
  marginBottom: 8,
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
}

const metricGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, 1fr)',
  gap: 8,
}

const metricCardStyle: React.CSSProperties = {
  background: '#0f172a',
  borderRadius: 6,
  padding: '8px 10px',
  textAlign: 'center',
  border: '1px solid #334155',
}

const metricNameStyle: React.CSSProperties = { fontSize: 11, color: '#64748b', marginBottom: 2 }
const metricValueStyle: React.CSSProperties = { fontSize: 20, fontWeight: 'bold', color: '#e2e8f0' }
const metricUnitStyle: React.CSSProperties = { fontSize: 11, color: '#64748b', marginLeft: 2 }
const metricRangeStyle: React.CSSProperties = { fontSize: 10, color: '#475569', marginTop: 1 }

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '6px 8px',
  background: '#0f172a',
  border: '1px solid #334155',
  borderRadius: 4,
  color: '#e2e8f0',
  fontSize: 12,
  boxSizing: 'border-box',
}

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  cursor: 'pointer',
}

const buttonStyle: React.CSSProperties = {
  width: '100%',
  padding: '6px 12px',
  background: '#3b82f6',
  border: 'none',
  borderRadius: 4,
  color: '#fff',
  fontSize: 12,
  cursor: 'pointer',
}

const commandItemStyle: React.CSSProperties = {
  padding: '6px 0',
  borderBottom: '1px solid #334155',
  fontSize: 12,
}

const tagStyle: React.CSSProperties = {
  display: 'inline-block',
  padding: '2px 6px',
  borderRadius: 4,
  fontSize: 10,
  marginRight: 4,
}

const statusTagMap: Record<string, React.CSSProperties> = {
  PENDING: { ...tagStyle, background: '#334155', color: '#94a3b8' },
  SENT: { ...tagStyle, background: '#1e40af', color: '#93c5fd' },
  DELIVERED: { ...tagStyle, background: '#78350f', color: '#fde68a' },
  EXECUTED: { ...tagStyle, background: '#065f46', color: '#6ee7b7' },
  FAILED: { ...tagStyle, background: '#7f1d1d', color: '#fca5a5' },
  TIMEOUT: { ...tagStyle, background: '#7f1d1d', color: '#fca5a5' },
}

interface ScadaPanelProps {
  equipmentCode?: string
  equipmentName?: string
}

export function ScadaPanel({ equipmentCode, equipmentName }: ScadaPanelProps) {
  const [telemetry, setTelemetry] = useState<TelemetryRecord[]>([])
  const [commands, setCommands] = useState<DeviceCommand[]>([])
  const [cmdType, setCmdType] = useState('CUSTOM')
  const [cmdPayload, setCmdPayload] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!equipmentCode) return
    setLoading(true)
    Promise.all([
      mesApi.fetchTelemetry(equipmentCode, 5),
      mesApi.fetchCommands(equipmentCode),
    ])
      .then(([t, c]) => { setTelemetry(t); setCommands(c) })
      .catch((e) => { console.error('Failed to fetch telemetry/commands:', e) })
      .finally(() => setLoading(false))
  }, [equipmentCode])

  const latestMetrics = telemetry.length > 0 ? telemetry[0].metrics ?? [] : []

  const handleSend = async () => {
    if (!equipmentCode) return
    setSending(true)
    try {
      await mesApi.dispatchCommand(equipmentCode, cmdType, cmdPayload)
      setCmdPayload('')
      const list = await mesApi.fetchCommands(equipmentCode)
      setCommands(list)
    } catch (e) {
      console.error('Failed to dispatch command:', e)
    }
    setSending(false)
  }

  return (
    <div style={containerStyle}>
      {/* Device header */}
      <div style={cardStyle}>
        <div style={{ fontSize: 14, color: '#3b82f6', fontWeight: 'bold', marginBottom: 4 }}>
          {equipmentName || equipmentCode || '未选择设备'}
        </div>
        {!equipmentCode && (
          <div style={{ fontSize: 12, color: '#64748b' }}>
            请在左侧设备列表中选择设备查看 SCADA 数据
          </div>
        )}
      </div>

      {equipmentCode && (
        <>
          {/* Real-time metrics */}
          <div style={cardStyle}>
            <div style={headerStyle}>
              <span>📊 实时遥测指标</span>
              <span style={{ fontSize: 11, color: '#475569' }}>
                {telemetry.length > 0 ? `更新: ${new Date(telemetry[0].collectTime).toLocaleTimeString()}` : ''}
              </span>
            </div>
            {loading ? (
              <div style={{ textAlign: 'center', padding: 16, color: '#64748b', fontSize: 12 }}>加载中...</div>
            ) : latestMetrics.length > 0 ? (
              <div style={metricGridStyle}>
                {latestMetrics.map((m) => {
                  const isAlert = (m.upperLimit != null && m.value > m.upperLimit) ||
                    (m.lowerLimit != null && m.value < m.lowerLimit)
                  return (
                    <div key={m.metricCode} style={{
                      ...metricCardStyle,
                      borderColor: isAlert ? '#ef4444' : '#334155',
                      background: isAlert ? '#1f1010' : '#0f172a',
                    }}>
                      <div style={metricNameStyle}>{m.metricName || m.metricCode}</div>
                      <div style={{ ...metricValueStyle, color: isAlert ? '#ef4444' : '#e2e8f0' }}>
                        {m.value}
                        <span style={metricUnitStyle}>{m.unit || ''}</span>
                      </div>
                      {m.upperLimit != null && (
                        <div style={metricRangeStyle}>
                          范围: {m.lowerLimit ?? '-'} ~ {m.upperLimit}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: 16, color: '#64748b', fontSize: 12 }}>
                暂无遥测数据
              </div>
            )}
          </div>

          {/* Command dispatch */}
          <div style={cardStyle}>
            <div style={headerStyle}><span>🎮 设备指令下发</span></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <select style={selectStyle} value={cmdType} onChange={(e) => setCmdType(e.target.value)}>
                <option value="START">启动</option>
                <option value="STOP">停止</option>
                <option value="RESET">复位</option>
                <option value="SET_PARAMETER">设参数</option>
                <option value="CALIBRATE">校准</option>
                <option value="SET_SPEED">设速度</option>
                <option value="SET_TEMPERATURE">设温度</option>
                <option value="CUSTOM">自定义</option>
              </select>
              <input
                style={inputStyle}
                placeholder="指令参数 (JSON)"
                value={cmdPayload}
                onChange={(e) => setCmdPayload(e.target.value)}
              />
              <button style={buttonStyle} onClick={handleSend} disabled={sending}>
                {sending ? '发送中...' : '发送指令'}
              </button>
            </div>
          </div>

          {/* Recent commands */}
          <div style={cardStyle}>
            <div style={headerStyle}><span>📜 最近指令</span></div>
            {commands.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 12, color: '#64748b', fontSize: 12 }}>
                暂无指令记录
              </div>
            ) : (
              commands.slice(0, 6).map((cmd) => (
                <div key={cmd.id} style={commandItemStyle}>
                  <div style={{ display: 'flex', gap: 4, alignItems: 'center', marginBottom: 2 }}>
                    <span style={statusTagMap[cmd.status] || tagStyle}>{cmd.commandType}</span>
                    <span style={statusTagMap[cmd.status] || tagStyle}>{cmd.status}</span>
                    <span style={{ fontSize: 10, color: '#475569', marginLeft: 'auto' }}>
                      {new Date(cmd.createdAt).toLocaleString()}
                    </span>
                  </div>
                  {cmd.payload && (
                    <div style={{ fontSize: 11, color: '#64748b', wordBreak: 'break-all' }}>
                      {cmd.payload}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  )
}
