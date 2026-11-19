import { t } from '../../../i18n'
import { useState, useEffect } from 'react'
import type { Device } from '../scene/FactoryScene'

interface DeviceStatusProps {
  devices: Device[]
  onDeviceSelect?: (device: Device) => void
}

const statusColors: Record<string, string> = {
  running: 'bg-green-500',
  idle: 'bg-gray-400',
  warning: 'bg-yellow-500',
  error: 'bg-red-500',
  offline: 'bg-gray-600',
  online: 'bg-blue-500'
}

const statusLabels: Record<string, string> = {
  running: t('device.status.running'),
  idle: t('device.status.idle'),
  warning: t('device.status.warning'),
  error: t('device.status.error'),
  offline: t('device.status.offline'),
  online: t('device.status.online')
}

export function DeviceStatus({ devices, onDeviceSelect }: DeviceStatusProps) {
  const [filter, setFilter] = useState<string>('all')

  const filteredDevices = filter === 'all'
    ? devices
    : devices.filter(d => d.status === filter)

  const stats = {
    total: devices.length,
    running: devices.filter(d => d.status === 'running').length,
    idle: devices.filter(d => d.status === 'idle').length,
    warning: devices.filter(d => d.status === 'warning').length,
    error: devices.filter(d => d.status === 'error').length,
    offline: devices.filter(d => d.status === 'offline').length
  }

  return (
    <div style={{
      background: '#1e293b',
      borderRadius: '8px',
      padding: '16px',
      color: '#e2e8f0'
    }}>
      {/* Stats Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '16px' }}>
        <StatCard label={t('device.stat.total')} value={stats.total} color="#3b82f6" />
        <StatCard label={t('device.stat.running')} value={stats.running} color="#4ade80" />
        <StatCard label={t('device.status.warning')} value={stats.warning + stats.error} color="#ef4444" />
      </div>

      {/* Filter */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
        <FilterButton active={filter === 'all'} onClick={() => setFilter('all')}>{t('common.all')}</FilterButton>
        <FilterButton active={filter === 'running'} onClick={() => setFilter('running')}>{t('device.status.running')}</FilterButton>
        <FilterButton active={filter === 'idle'} onClick={() => setFilter('idle')}>{t('device.status.idle')}</FilterButton>
        <FilterButton active={filter === 'warning'} onClick={() => setFilter('warning')}>{t('device.status.warning')}</FilterButton>
        <FilterButton active={filter === 'error'} onClick={() => setFilter('error')}>{t('device.status.error')}</FilterButton>
      </div>

      {/* Device List */}
      <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
        {filteredDevices.map(device => (
          <div
            key={device.id}
            onClick={() => onDeviceSelect?.(device)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px',
              marginBottom: '4px',
              background: '#334155',
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'background 0.2s'
            }}
          >
            <div>
              <div style={{ fontWeight: 'bold' }}>{device.name}</div>
              <div style={{ fontSize: '12px', color: '#94a3b8' }}>{device.code}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12px', color: '#94a3b8' }}>{device.type}</span>
              <span className={statusColors[device.status]} style={{
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '12px',
                color: 'white'
              }}>
                {statusLabels[device.status]}
              </span>
            </div>
          </div>
        ))}
        {filteredDevices.length === 0 && (
          <div style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>{t('device.noDevices')}</div>
        )}
      </div>
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{
      background: '#334155',
      borderRadius: '6px',
      padding: '12px',
      textAlign: 'center'
    }}>
      <div style={{ fontSize: '24px', fontWeight: 'bold', color }}>{value}</div>
      <div style={{ fontSize: '12px', color: '#94a3b8' }}>{label}</div>
    </div>
  )
}

function FilterButton({ active, onClick, children }: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '6px 12px',
        borderRadius: '4px',
        border: 'none',
        cursor: 'pointer',
        background: active ? '#3b82f6' : '#475569',
        color: 'white',
        fontSize: '12px'
      }}
    >
      {children}
    </button>
  )
}