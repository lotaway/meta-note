import { t } from '../../../i18n'
import { useState } from 'react'
import { mesApi, type TraceRecord, type TraceChain } from '../../../services/mes-api'

const containerStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 12 }

const cardStyle: React.CSSProperties = {
  background: '#1e293b',
  borderRadius: 8,
  padding: 12,
  border: '1px solid #334155',
}

const inputStyle: React.CSSProperties = {
  flex: 1,
  padding: '6px 8px',
  background: '#0f172a',
  border: '1px solid #334155',
  borderRadius: 4,
  color: '#e2e8f0',
  fontSize: 12,
}

const buttonBase: React.CSSProperties = {
  padding: '6px 12px',
  border: 'none',
  borderRadius: 4,
  color: '#fff',
  fontSize: 12,
  cursor: 'pointer',
}

const tagMap: Record<string, { bg: string; color: string }> = {
  PRODUCT: { bg: '#065f46', color: '#6ee7b7' },
  BATCH: { bg: '#1e40af', color: '#93c5fd' },
  MATERIAL: { bg: '#78350f', color: '#fde68a' },
  SN: { bg: '#5b21b6', color: '#c4b5fd' },
  WORK_ORDER: { bg: '#0f766e', color: '#99f6e4' },
  PROCESS: { bg: '#3730a3', color: '#a5b4fc' },
  QC: { bg: '#9d174d', color: '#f9a8d4' },
  EQUIPMENT: { bg: '#92400e', color: '#fdba74' },
  OPERATOR: { bg: '#1e3a5f', color: '#93c5fd' },
}

export function TraceabilityPanel() {
  const [traceCode, setTraceCode] = useState('')
  const [chain, setChain] = useState<TraceChain | null>(null)
  const [records, setRecords] = useState<TraceRecord[]>([])
  const [mode, setMode] = useState<'chain' | 'forward' | 'backward' | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const getTagStyle = (type: string): React.CSSProperties => {
    const t = tagMap[type] || { bg: '#334155', color: '#94a3b8' }
    return {
      display: 'inline-block',
      padding: '2px 6px',
      borderRadius: 4,
      fontSize: 10,
      background: t.bg,
      color: t.color,
      marginRight: 4,
    }
  }

  const handleFullChain = async () => {
    if (!traceCode.trim()) { setError(t('trace.enterCode')); return }
    setLoading(true); setError('')
    try {
      const result = await mesApi.getTraceChain(traceCode)
      if (result) { setChain(result); setMode('chain'); setRecords([]) }
      else { setError(t('trace.notFound')) }
    } catch (e) { console.error(t('trace.queryFailed'), e); setError(t('trace.queryFailed')) }
    setLoading(false)
  }

  const handleForward = async () => {
    if (!traceCode.trim()) { setError(t('trace.enterCode')); return }
    setLoading(true); setError('')
    try {
      const list = await mesApi.forwardTrace(traceCode)
      setRecords(list); setMode('forward'); setChain(null)
    } catch (e) { console.error(t('trace.forwardQueryFailed'), e); setError(t('trace.forwardQueryFailed')) }
    setLoading(false)
  }

  const handleBackward = async () => {
    if (!traceCode.trim()) { setError(t('trace.enterCode')); return }
    setLoading(true); setError('')
    try {
      const list = await mesApi.backwardTrace(traceCode)
      setRecords(list); setMode('backward'); setChain(null)
    } catch (e) { console.error(t('trace.backwardQueryFailed'), e); setError(t('trace.backwardQueryFailed')) }
    setLoading(false)
  }

  return (
    <div style={containerStyle}>
      {/* Search bar */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <input
            style={inputStyle}
            placeholder={t('trace.codePlaceholder')}
            value={traceCode}
            onChange={(e) => setTraceCode(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleFullChain()}
          />
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button style={{ ...buttonBase, background: '#3b82f6' }} onClick={handleFullChain}>{t('trace.mode.full')}</button>
          <button style={{ ...buttonBase, background: '#10b981' }} onClick={handleForward}>{t('trace.mode.forward')}</button>
          <button style={{ ...buttonBase, background: '#f59e0b' }} onClick={handleBackward}>{t('trace.mode.backward')}</button>
        </div>
        {error && (
          <div style={{ marginTop: 8, fontSize: 12, color: '#ef4444' }}>{error}</div>
        )}
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: 24, color: '#64748b', fontSize: 12 }}>{t('trace.querying')}</div>
      )}

      {/* Full chain display */}
      {!loading && chain && (
        <>
          {/* Root node */}
          <div style={cardStyle}>
            <div style={{ fontSize: 13, color: '#3b82f6', fontWeight: 'bold', marginBottom: 8 }}>
              {t('trace.rootNode')}
            </div>
            <RecordRow record={chain.root} getTagStyle={getTagStyle} />
          </div>

          {/* Forward path */}
          {chain.forwardPath && chain.forwardPath.length > 0 && (
            <div style={cardStyle}>
              <div style={{ fontSize: 13, color: '#10b981', fontWeight: 'bold', marginBottom: 8 }}>
                {t('trace.forwardPath', { count: chain.forwardPath.length })}
              </div>
              {chain.forwardPath.map((r, i) => (
                <div key={i} style={{ marginBottom: 6 }}>
                  <div style={{ fontSize: 10, color: '#475569', marginBottom: 2 }}>#{i + 1}</div>
                  <RecordRow record={r} getTagStyle={getTagStyle} />
                </div>
              ))}
            </div>
          )}

          {/* Backward path */}
          {chain.backwardPath && chain.backwardPath.length > 0 && (
            <div style={cardStyle}>
              <div style={{ fontSize: 13, color: '#f59e0b', fontWeight: 'bold', marginBottom: 8 }}>
                {t('trace.backwardPath', { count: chain.backwardPath.length })}
              </div>
              {chain.backwardPath.map((r, i) => (
                <div key={i} style={{ marginBottom: 6 }}>
                  <div style={{ fontSize: 10, color: '#475569', marginBottom: 2 }}>#{i + 1}</div>
                  <RecordRow record={r} getTagStyle={getTagStyle} />
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Forward/Backward list */}
      {!loading && !chain && mode && records.length > 0 && (
        <div style={cardStyle}>
          <div style={{ fontSize: 13, fontWeight: 'bold', marginBottom: 8, color: '#e2e8f0' }}>
            {mode === 'forward' ? t('trace.forwardResult') : t('trace.backwardResult')}
            <span style={{ fontSize: 11, color: '#64748b', marginLeft: 8 }}>
              {t('trace.recordCount', { count: records.length })}
            </span>
          </div>
          {records.map((r, i) => (
            <div key={i} style={{ marginBottom: 6 }}>
              <RecordRow record={r} getTagStyle={getTagStyle} />
            </div>
          ))}
        </div>
      )}

      {!loading && !chain && mode && records.length === 0 && !error && (
        <div style={{ textAlign: 'center', padding: 24, color: '#64748b', fontSize: 12 }}>{t('trace.noResults')}</div>
      )}
    </div>
  )
}

function RecordRow({ record, getTagStyle }: {
  record: TraceRecord
  getTagStyle: (type: string) => React.CSSProperties
}) {
  return (
    <div style={{
      background: '#0f172a',
      borderRadius: 6,
      padding: '8px 10px',
      border: '1px solid #334155',
    }}>
      <div style={{ display: 'flex', gap: 4, alignItems: 'center', marginBottom: 4, flexWrap: 'wrap' }}>
        <span style={getTagStyle(record.traceType)}>{record.traceType}</span>
        <span style={{ fontSize: 12, color: '#e2e8f0', fontWeight: 'bold' }}>{record.traceCode}</span>
        {record.source && (
          <span style={{ fontSize: 10, color: '#64748b' }}>{t('trace.source')} {record.source}</span>
        )}
      </div>
      <div style={{ display: 'flex', gap: 12, fontSize: 11, color: '#94a3b8', flexWrap: 'wrap' }}>
        {record.batchNo && <span>{t('trace.batch')} {record.batchNo}</span>}
        {record.productCode && <span>{t('trace.product')} {record.productCode}</span>}
        {record.sn && <span>SN: {record.sn}</span>}
        {record.createdAt && <span>{new Date(record.createdAt).toLocaleString()}</span>}
      </div>
      {record.relations && record.relations.length > 0 && (
        <div style={{ marginTop: 6, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {record.relations.slice(0, 4).map((rel, i) => (
            <span key={i} style={{
              fontSize: 10, color: '#475569',
              background: '#1e293b', borderRadius: 4, padding: '2px 6px',
            }}>
              {rel.relationType}: {rel.relatedCode}
            </span>
          ))}
          {record.relations.length > 4 && (
            <span style={{ fontSize: 10, color: '#475569' }}>
              +{record.relations.length - 4}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
