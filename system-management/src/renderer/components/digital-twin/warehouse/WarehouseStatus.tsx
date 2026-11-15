import { useMemo } from 'react'
import { Card } from './components/Card'
import { ErrorBoundary } from './components/ErrorBoundary'
import { Colors, Spacing, FontSizes, BorderRadius, Transitions } from './styles/constants'
import { Warehouse, Shelf } from './Warehouse3DView'

// ============ 常量提取 ============
const STATUS_CONFIG = {
  compact: {
    statusDotSize: '10px',
    progressWidth: '60px',
    progressHeight: '6px'
  },
  full: {
    statusDotSize: '12px',
    progressHeight: '10px'
  },
  statCardFontSize: '16px'
} as const

const STATUS_COLORS = {
  active: Colors.success,
  maintenance: Colors.warning,
  inactive: Colors.textMuted,
  backgrounds: {
    active: 'rgba(34, 197, 94, 0.2)',
    maintenance: 'rgba(251, 191, 36, 0.2)',
    inactive: 'rgba(100, 116, 139, 0.2)'
  }
} as const

const UTIL_COLORS = [
  { threshold: 90, color: Colors.danger },
  { threshold: 70, color: Colors.warning },
  { threshold: 50, color: Colors.success },
  { threshold: 0, color: Colors.info }
] as const

const STATUS_LABELS = {
  active: '占用',
  full: '满载',
  empty: '空闲',
  maintenance: '维护'
} as const

const STATUS_VALUE_COLORS = {
  active: Colors.success,
  full: Colors.danger,
  empty: Colors.textMuted,
  maintenance: Colors.warning
} as const

export interface WarehouseStatusProps {
  warehouse?: Warehouse
  shelves?: Shelf[]
  data?: { warehouse: unknown; options: unknown }
  compact?: boolean
}

// ============ 辅助函数 ============
function getStatusColor(status: string): string {
  type StatusColorKey = 'active' | 'maintenance' | 'inactive'
  const colorKey = status as StatusColorKey
  return STATUS_COLORS[colorKey] || Colors.textSecondary
}

function getUtilizationColor(rate: number): string {
  for (const { threshold, color } of UTIL_COLORS) {
    if (rate >= threshold) return color
  }
  return Colors.info
}

function getStatusLabel(status: string): string {
  return STATUS_LABELS[status as keyof typeof STATUS_LABELS] || status
}

function getStatusValueColor(status: string): string {
  return STATUS_VALUE_COLORS[status as keyof typeof STATUS_VALUE_COLORS] || Colors.text
}

// ============ 子组件：进度条 ============
function ProgressBar({ value, max = 100, color }: { value: number; max?: number; color: string }) {
  const percent = Math.min((value / max) * 100, 100)

  return (
    <div
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      style={{
        height: STATUS_CONFIG.full.progressHeight,
        background: Colors.borderLight,
        borderRadius: BorderRadius.md,
        overflow: 'hidden'
      }}
    >
      <div
        style={{
          width: `${percent}%`,
          height: '100%',
          background: color,
          borderRadius: BorderRadius.md,
          transition: Transitions.slow
        }}
      />
    </div>
  )
}

// ============ 子组件：紧凑进度条 ============
function CompactProgressBar({ value, color }: { value: number; color: string }) {
  return (
    <div
      style={{
        width: STATUS_CONFIG.compact.progressWidth,
        height: STATUS_CONFIG.compact.progressHeight,
        background: Colors.borderLight,
        borderRadius: BorderRadius.sm,
        overflow: 'hidden'
      }}
    >
      <div
        style={{
          width: `${value}%`,
          height: '100%',
          background: color,
          borderRadius: BorderRadius.sm,
          transition: Transitions.normal
        }}
      />
    </div>
  )
}

// ============ 子组件：统计卡片 ============
interface StatCardProps {
  label: string
  value: string | number
  color?: string
}

function StatCard({ label, value, color = Colors.text }: StatCardProps) {
  return (
    <div
      role="status"
      aria-label={`${label}: ${value}`}
      style={{
        background: Colors.backgroundSecondary,
        borderRadius: BorderRadius.lg,
        padding: Spacing.lg,
        textAlign: 'center'
      }}
    >
      <div
        style={{
          color: Colors.textSecondary,
          fontSize: FontSizes.sm,
          marginBottom: Spacing.xs,
          textTransform: 'uppercase'
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: FontSizes.title, fontWeight: 700, color }}>
        {value}
      </div>
    </div>
  )
}

// ============ 子组件：状态指示器 ============
function StatusIndicator({ status, size = 'full' }: { status: string; size?: 'compact' | 'full' }) {
  const color = getStatusColor(status)
  const dotSize = size === 'compact'
    ? STATUS_CONFIG.compact.statusDotSize
    : STATUS_CONFIG.full.statusDotSize

  return (
    <div
      style={{
        width: dotSize,
        height: dotSize,
        borderRadius: '50%',
        background: color,
        boxShadow: `0 0 8px ${color}`
      }}
    />
  )
}

// ============ 子组件：状态徽章 ============
function StatusBadge({ status }: { status: string }) {
  const color = getStatusColor(status)
  const backgroundColor = status === 'active'
    ? STATUS_COLORS.backgrounds.active
    : status === 'maintenance'
      ? STATUS_COLORS.backgrounds.maintenance
      : STATUS_COLORS.backgrounds.inactive

  return (
    <span
      style={{
        fontSize: FontSizes.sm,
        padding: `${Spacing.xs} ${Spacing.md}`,
        borderRadius: BorderRadius.md,
        background: backgroundColor,
        color: color,
        fontWeight: 500,
        textTransform: 'uppercase'
      }}
    >
      {status}
    </span>
  )
}

// ============ 子组件：容量进度区域 ============
function CapacityProgress({
  usedCap,
  totalCap,
  rate,
  utilColor
}: {
  usedCap: number
  totalCap: number
  rate: number
  utilColor: string
}) {
  return (
    <div style={{ marginBottom: Spacing.xl }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: Spacing.xs,
          fontSize: FontSizes.md
        }}
      >
        <span style={{ color: Colors.textSecondary }}>容量进度</span>
        <span style={{ color: Colors.text }}>{usedCap} / {totalCap}</span>
      </div>
      <ProgressBar value={rate} max={100} color={utilColor} />
    </div>
  )
}

// ============ 子组件：库位状态网格 ============
function ShelfStatusGrid({ stats }: { stats: { occupied: number; full: number; empty: number; maintenance: number } }) {
  const items = [
    { label: '占用', value: stats.occupied, color: Colors.success },
    { label: '满载', value: stats.full, color: Colors.danger },
    { label: '空闲', value: stats.empty, color: Colors.textMuted },
    { label: '维护', value: stats.maintenance, color: Colors.warning }
  ]

  return (
    <div
      role="list"
      aria-label="库位状态统计"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: Spacing.md
      }}
    >
      {items.map(item => (
        <div
          key={item.label}
          role="listitem"
          style={{
            background: Colors.backgroundTertiary,
            borderRadius: BorderRadius.md,
            padding: Spacing.md,
            textAlign: 'center'
          }}
        >
          <div
            style={{
              color: item.color,
              fontWeight: 600,
              fontSize: STATUS_CONFIG.statCardFontSize
            }}
          >
            {item.value}
          </div>
          <div style={{ color: Colors.textMuted, fontSize: FontSizes.xs }}>
            {item.label}
          </div>
        </div>
      ))}
    </div>
  )
}

// ============ 子组件：底部统计信息 ============
function FooterStats({ warehouse }: { warehouse: Warehouse }) {
  return (
    <div
      role="contentinfo"
      style={{
        marginTop: Spacing.xl,
        paddingTop: Spacing.lg,
        borderTop: `1px solid ${Colors.border}`,
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: FontSizes.md
      }}
    >
      <div>
        <span style={{ color: Colors.textMuted }}>总面积: </span>
        <span style={{ color: Colors.text }}>{warehouse.totalArea} m²</span>
      </div>
      <div>
        <span style={{ color: Colors.textMuted }}>使用面积: </span>
        <span style={{ color: Colors.success }}>{warehouse.usedArea} m²</span>
      </div>
      <div>
        <span style={{ color: Colors.textMuted }}>容量: </span>
        <span style={{ color: Colors.primary }}>{warehouse.capacity}</span>
      </div>
    </div>
  )
}

// ============ 紧凑模式组件 ============
function CompactWarehouseStatus({
  warehouse,
  stats
}: {
  warehouse: Warehouse
  stats: {
    rate: number
  }
}) {
  const statusColor = getStatusColor(warehouse.status)
  const utilColor = getUtilizationColor(stats.rate)

  return (
    <div
      role="status"
      aria-label={`${warehouse.name} 状态`}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: Spacing.lg,
        padding: `${Spacing.sm} ${Spacing.lg}`,
        background: Colors.background,
        borderRadius: BorderRadius.lg,
        border: `1px solid ${Colors.border}`
      }}
    >
      <StatusIndicator status={warehouse.status} size="compact" />
      <div style={{ color: Colors.text, fontWeight: 500, fontSize: FontSizes.lg }}>
        {warehouse.name}
      </div>
      <div style={{ color: Colors.textSecondary, fontSize: FontSizes.md }}>
        {stats.rate.toFixed(0)}%
      </div>
      <CompactProgressBar value={stats.rate} color={utilColor} />
    </div>
  )
}

// ============ 完整模式组件 ============
function FullWarehouseStatus({
  warehouse,
  stats
}: {
  warehouse: Warehouse
  stats: {
    total: number
    occupied: number
    full: number
    empty: number
    maintenance: number
    totalCap: number
    usedCap: number
    rate: number
  }
}) {
  const statusColor = getStatusColor(warehouse.status)
  const utilColor = getUtilizationColor(stats.rate)

  return (
    <Card style={{ padding: Spacing.xl }}>
      {/* 头部 */}
      <div
        role="banner"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: Spacing.xl,
          paddingBottom: Spacing.lg,
          borderBottom: `1px solid ${Colors.border}`
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: Spacing.sm }}>
          <StatusIndicator status={warehouse.status} size="full" />
          <span style={{ fontWeight: 600, fontSize: FontSizes.xl }}>
            {warehouse.name}
          </span>
        </div>
        <StatusBadge status={warehouse.status} />
      </div>

      {/* 统计卡片 */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: Spacing.lg,
          marginBottom: Spacing.xl
        }}
      >
        <StatCard
          label="面积利用率"
          value={`${stats.rate.toFixed(1)}%`}
          color={utilColor}
        />
        <StatCard
          label="库位占用"
          value={`${stats.occupied}/${stats.total}`}
          color={Colors.primary}
        />
      </div>

      {/* 容量进度 */}
      <CapacityProgress
        usedCap={stats.usedCap}
        totalCap={stats.totalCap}
        rate={stats.rate}
        utilColor={utilColor}
      />

      {/* 库位状态网格 */}
      <ShelfStatusGrid stats={stats} />

      {/* 底部统计 */}
      <FooterStats warehouse={warehouse} />
    </Card>
  )
}

// ============ 主组件 ============
export function WarehouseStatus({
  warehouse,
  shelves,
  compact = false
}: WarehouseStatusProps) {
  // 计算统计数据
  const stats = useMemo(() => {
    const shelvesData = shelves || []
    const total = shelvesData.length
    const occupied = shelvesData.filter(s => s.status === 'occupied').length
    const full = shelvesData.filter(s => s.status === 'full').length
    const empty = shelvesData.filter(s => s.status === 'empty').length
    const maintenance = shelvesData.filter(s => s.status === 'maintenance').length
    const totalCap = shelvesData.reduce((sum, s) => sum + s.capacity, 0)
    const usedCap = shelvesData.reduce((sum, s) => sum + s.currentLoad, 0)

    return {
      total,
      occupied,
      full,
      empty,
      maintenance,
      totalCap,
      usedCap,
      rate: totalCap > 0 ? (usedCap / totalCap) * 100 : 0
    }
  }, [shelves])

  // 内容组件（根据 compact 模式选择不同的渲染）
  const content = compact
    ? <CompactWarehouseStatus warehouse={warehouse || {} as Warehouse} stats={stats} />
    : <FullWarehouseStatus warehouse={warehouse || {} as Warehouse} stats={stats} />

  // compact 模式也需要 ErrorBoundary 包裹
  return (
    <ErrorBoundary>
      {content}
    </ErrorBoundary>
  )
}