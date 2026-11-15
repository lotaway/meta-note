import { useState, useEffect, useRef, useCallback } from 'react'

interface AudioDevice {
  index: number
  name: string
}

interface AudioData {
  data: Uint8Array | number[]
  sample_rate: number
  channels: number
}

function computeRMS(bytes: Uint8Array | number[]): number {
  if (bytes.length < 2) return 0
  let sumSquares = 0
  const sampleCount = bytes.length / 2
  for (let i = 0; i < bytes.length; i += 2) {
    const sample = (bytes[i + 1] << 8) | bytes[i]
    sumSquares += (sample / 32768) ** 2
  }
  return Math.sqrt(sumSquares / sampleCount)
}

export function AudioMonitor() {
  const [devices, setDevices] = useState<AudioDevice[]>([])
  const [selectedIndex, setSelectedIndex] = useState<number>(-1)
  const [capturing, setCapturing] = useState(false)
  const [level, setLevel] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const loadDevices = useCallback(async () => {
    const list = await window.desktop.listAudioDevices() as AudioDevice[] | null
    setDevices(Array.isArray(list) ? list : [])
  }, [])

  useEffect(() => {
    loadDevices()
  }, [loadDevices])

  const pollLevel = useCallback(async () => {
    const data = await window.desktop.getAudioData() as AudioData | null
    if (data && data.data.length > 0) {
      setLevel(computeRMS(data.data))
    }
  }, [])

  const handleStart = useCallback(async () => {
    if (selectedIndex < 0) return
    const ok = await window.desktop.startAudioCapture(selectedIndex, 0)
    if (ok) {
      setCapturing(true)
      setLevel(0)
      intervalRef.current = setInterval(pollLevel, 200)
    }
  }, [selectedIndex, pollLevel])

  const handleStop = useCallback(async () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    await window.desktop.stopAudioCapture()
    setCapturing(false)
    setLevel(0)
  }, [])

  useEffect(() => {
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [])

  const db = level > 0 ? 20 * Math.log10(level) : -Infinity
  const barPercent = Math.min(level * 100, 100)

  return (
    <div style={{
      background: '#1e293b',
      borderRadius: '8px',
      padding: '16px',
      color: '#e2e8f0'
    }}>
      <h4 style={{ margin: '0 0 12px', color: '#3b82f6', fontSize: '14px' }}>
        系统音频采集
      </h4>

      <div style={{ marginBottom: '12px' }}>
        <select
          value={selectedIndex}
          onChange={e => setSelectedIndex(Number(e.target.value))}
          disabled={capturing}
          style={{
            width: '100%',
            padding: '8px',
            background: '#334155',
            border: '1px solid #475569',
            color: '#e2e8f0',
            borderRadius: '4px',
            fontSize: '12px',
            marginBottom: '8px'
          }}
        >
          <option value={-1}>选择音频输入设备...</option>
          {devices.map(d => (
            <option key={d.index} value={d.index}>{d.name}</option>
          ))}
        </select>
        <button
          onClick={capturing ? handleStop : handleStart}
          disabled={!capturing && selectedIndex < 0}
          style={{
            width: '100%',
            padding: '8px',
            borderRadius: '4px',
            border: 'none',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '12px',
            background: capturing ? '#ef4444' : '#3b82f6',
            color: 'white'
          }}
        >
          {capturing ? '停止采集' : '开始采集'}
        </button>
      </div>

      {/* Level meter */}
      <div style={{ marginTop: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>
          <span>电平</span>
          <span>{db === -Infinity ? '-∞' : db.toFixed(1)} dB</span>
        </div>
        <div style={{
          height: '8px',
          background: '#0f172a',
          borderRadius: '4px',
          overflow: 'hidden'
        }}>
          <div style={{
            height: '100%',
            width: `${barPercent}%`,
            background: level > 0.7 ? '#ef4444' : level > 0.4 ? '#f59e0b' : '#10b981',
            borderRadius: '4px',
            transition: 'width 0.1s ease'
          }} />
        </div>
      </div>
    </div>
  )
}
