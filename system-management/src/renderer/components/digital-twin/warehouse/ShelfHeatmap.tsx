import { t } from '../../../i18n'
import { useMemo } from 'react'
import { Card } from './components/Card'
import { ErrorBoundary } from './components/ErrorBoundary'
import { Colors, Spacing, FontSizes, BorderRadius, Transitions } from './styles/constants'
import { Shelf, WarehouseHeatmapData } from './Warehouse3DView'

const HEATMAP_CONFIG = {
  cellSize: '38px',
  gridColumnWidth: '40px',
  headerColumnWidth: '30px',
  gap: '2px',
  gridGap: '2px',
  labelBoxSize: '12px',
  shadowThreshold: 60,
  shadowBlur: '8px',
  opacityEmpty: 0.3,
  cellFontSize: '9px'
} as const

const LOAD_THRESHOLDS = {
  low: 20,
  medium: 40,
  high: 60,
  critical: 80
} as const

const LOAD_RATIO = {
  empty: 0,
  low: 0.3,
  high: 0.7
} as const

export interface ShelfHeatmapProps {
  shelves?: Shelf[]
  heatmapData?: WarehouseHeatmapData[]
  data?: { shelfId?: string; level?: number; column?: number; row?: number; col?: number; value: number; label?: string }[]
  title?: string
  onCellClick?: (shelfId: string, level: number, column: number) => void
  selectedCell?: { shelfId: string; level: number; column: number } | null
  showLabels?: boolean
}

function getHeatmapColor(value: number, hasShelf: boolean): string {
  if (!hasShelf) return 'transparent'

  if (value === 0) return Colors.borderLight
  if (value < LOAD_THRESHOLDS.low) return Colors.heatmap.cold
  if (value < LOAD_THRESHOLDS.medium) return Colors.heatmap.cool
  if (value < LOAD_THRESHOLDS.high) return Colors.heatmap.normal
  if (value < LOAD_THRESHOLDS.critical) return Colors.heatmap.warm
  return Colors.heatmap.hot
}

function getLoadColor(load: number, capacity: number): string {
  const ratio = capacity > 0 ? load / capacity : 0

  if (ratio === LOAD_RATIO.empty) return Colors.textMuted
  if (ratio < LOAD_RATIO.low) return Colors.success
  if (ratio < LOAD_RATIO.high) return Colors.warning
  return Colors.danger
}

interface HeatmapCellProps {
  shelf: Shelf | null
  heatmapValue: number
  isSelected: boolean
  onClick?: () => void
}

function HeatmapCell({ shelf, heatmapValue, isSelected, onClick }: HeatmapCellProps) {
  const hasShelf = !!shelf

  const backgroundColor = heatmapValue > 0
    ? getHeatmapColor(heatmapValue, hasShelf)
    : (shelf ? getLoadColor(shelf.currentLoad, shelf.capacity) : Colors.background)

  const hasHeatmapShadow = heatmapValue > HEATMAP_CONFIG.shadowThreshold
  const boxShadow = hasHeatmapShadow
    ? `inset 0 0 ${HEATMAP_CONFIG.shadowBlur} rgba(239, 68, 68, 0.5)`
    : 'none'

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onClick?.()
    }
  }

  return (
    <div
      role="gridcell"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      style={{
        width: HEATMAP_CONFIG.cellSize,
        height: HEATMAP_CONFIG.cellSize,
        background: backgroundColor,
        borderRadius: BorderRadius.md,
        cursor: hasShelf ? 'pointer' : 'default',
        border: isSelected
          ? `2px solid ${Colors.primary}`
          : `1px solid ${Colors.border}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: FontSizes.xs,
        color: Colors.text,
        transition: Transitions.normal,
        opacity: hasShelf ? 1 : HEATMAP_CONFIG.opacityEmpty,
        boxShadow
      }}
      title={shelf
        ? t('warehouse.shelfTooltip', { code: shelf.code, load: shelf.currentLoad, capacity: shelf.capacity, status: shelf.status })
        : t('warehouse.emptySlot')
      }
    >
      {shelf && (
        <span
          style={{
            fontWeight: 600,
            fontSize: HEATMAP_CONFIG.cellFontSize,
            textShadow: '0 1px 2px rgba(0,0,0,0.5)'
          }}
        >
          {shelf.currentLoad}
        </span>
      )}
    </div>
  )
}

function YAxisLabels({ maxLevel }: { maxLevel: number }) {
  return (
    <>
      {Array.from({ length: maxLevel }).map((_, levelIdx) => (
        <div
          key={levelIdx}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: FontSizes.xs,
            color: Colors.textMuted,
            background: Colors.backgroundSecondary,
            borderRadius: BorderRadius.md
          }}
        >
          {levelIdx + 1}
        </div>
      ))}
    </>
  )
}

function XAxisLabels({ maxColumn }: { maxColumn: number }) {
  return (
    <>
      {Array.from({ length: maxColumn }).map((_, colIdx) => (
        <div
          key={colIdx}
          style={{
            textAlign: 'center',
            fontSize: FontSizes.xs,
            color: Colors.textMuted,
            padding: `${Spacing.xs} 0`
          }}
        >
          {colIdx + 1}
        </div>
      ))}
    </>
  )
}

function HeatmapLegend() {
  return (
    <div style={{ display: 'flex', gap: Spacing.lg, fontSize: FontSizes.sm }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: Spacing.xs }}>
        <span
          style={{
            width: HEATMAP_CONFIG.labelBoxSize,
            height: HEATMAP_CONFIG.labelBoxSize,
            background: Colors.heatmap.cold,
            borderRadius: BorderRadius.sm
          }}
        />{t('warehouse.urgency.low')}</span>
      <span style={{ display: 'flex', alignItems: 'center', gap: Spacing.xs }}>
        <span
          style={{
            width: HEATMAP_CONFIG.labelBoxSize,
            height: HEATMAP_CONFIG.labelBoxSize,
            background: Colors.heatmap.normal,
            borderRadius: BorderRadius.sm
          }}
        />{t('warehouse.urgency.medium')}</span>
      <span style={{ display: 'flex', alignItems: 'center', gap: Spacing.xs }}>
        <span
          style={{
            width: HEATMAP_CONFIG.labelBoxSize,
            height: HEATMAP_CONFIG.labelBoxSize,
            background: Colors.heatmap.hot,
            borderRadius: BorderRadius.sm
          }}
        />{t('warehouse.urgency.high')}</span>
    </div>
  )
}

function ChartHeader({ showLabels }: { showLabels: boolean }) {
  if (!showLabels) return null

  return (
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
      <span style={{ fontWeight: 600, fontSize: FontSizes.xl }}>{t('warehouse.heatmapTitle')}</span>
      <HeatmapLegend />
    </div>
  )
}

function SummaryStats({ summary }: { summary: { total: number; active: number; hot: number } }) {
  return (
    <div
      role="status"
      aria-label={t('warehouse.summaryAria')}
      style={{
        marginTop: Spacing.xl,
        paddingTop: Spacing.lg,
        borderTop: `1px solid ${Colors.border}`,
        display: 'flex',
        justifyContent: 'space-around',
        fontSize: FontSizes.md
      }}
    >
      <div>
        <span style={{ color: Colors.textMuted }}>{t('warehouse.totalSlots')}</span>
        <span style={{ color: Colors.text }}>{summary.total}</span>
      </div>
      <div>
        <span style={{ color: Colors.textMuted }}>{t('warehouse.active')}</span>
        <span style={{ color: Colors.success }}>{summary.active}</span>
      </div>
      <div>
        <span style={{ color: Colors.textMuted }}>{t('warehouse.highHeat')}</span>
        <span style={{ color: Colors.danger }}>{summary.hot}</span>
      </div>
    </div>
  )
}

function HeatmapGrid({
  gridData,
  selectedCell,
  onCellClick
}: {
  gridData: {
    matrix: Array<Array<{ shelf: Shelf | null; heatmapValue: number }>>
    maxLevel: number
    maxColumn: number
  }
  selectedCell?: { shelfId: string; level: number; column: number } | null
  onCellClick?: (shelfId: string, level: number, column: number) => void
}) {
  const { matrix, maxLevel, maxColumn } = gridData

  return (
    <div style={{ overflowX: 'auto' }}>
      <div
        role="grid"
        aria-label={t('warehouse.heatmapGridAria')}
        style={{
          display: 'grid',
          gridTemplateColumns: `${HEATMAP_CONFIG.headerColumnWidth} repeat(${maxColumn}, ${HEATMAP_CONFIG.gridColumnWidth})`,
          gap: HEATMAP_CONFIG.gap,
          minWidth: 'fit-content'
        }}
      >
        <div />
        <XAxisLabels maxColumn={maxColumn} />

        {matrix.map((row, levelIdx) => (
          <div key={levelIdx} style={{ display: 'contents' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: FontSizes.xs,
                color: Colors.textMuted,
                background: Colors.backgroundSecondary,
                borderRadius: BorderRadius.md
              }}
            >
              {levelIdx + 1}
            </div>

            {row.map((cell, colIdx) => {
              const isSelected = !!(
                cell.shelf &&
                selectedCell?.shelfId === cell.shelf.id &&
                selectedCell?.level === levelIdx &&
                selectedCell?.column === colIdx
              )

              return (
                <HeatmapCell
                  key={`${levelIdx}-${colIdx}`}
                  shelf={cell.shelf}
                  heatmapValue={cell.heatmapValue}
                  isSelected={isSelected}
                  onClick={() => {
                    if (cell.shelf) {
                      onCellClick?.(cell.shelf.id, levelIdx, colIdx)
                    }
                  }}
                />
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

export function ShelfHeatmap({
  shelves,
  heatmapData,
  onCellClick,
  selectedCell,
  showLabels = true
}: ShelfHeatmapProps) {
  const gridData = useMemo(() => {
    const shelvesData = shelves || []
    const heatmapDataVal = heatmapData || []
    const maxLevel = Math.max(...shelvesData.map(s => s.level), 0) + 1
    const maxColumn = Math.max(...shelvesData.map(s => s.column), 0) + 1

    const matrix: Array<Array<{ shelf: Shelf | null; heatmapValue: number }>> = []

    for (let level = 0; level < maxLevel; level++) {
      const row: Array<{ shelf: Shelf | null; heatmapValue: number }> = []

      for (let column = 0; column < maxColumn; column++) {
        const shelf = shelvesData.find(s => s.level === level && s.column === column) || null
        const heatmap = heatmapDataVal.find(
          d => d.shelfId === shelf?.id && d.level === level && d.column === column
        )

        row.push({
          shelf,
          heatmapValue: heatmap?.value || 0
        })
      }

      matrix.push(row)
    }

    return { matrix, maxLevel, maxColumn }
  }, [shelves, heatmapData])

  const summary = useMemo(() => {
    const shelvesData = shelves || []
    const heatmapDataVal = heatmapData || []
    return {
      total: shelvesData.length,
      active: shelvesData.filter(s => s.status === 'occupied').length,
      hot: heatmapDataVal.filter(d => d.value >= LOAD_THRESHOLDS.critical).length
    }
  }, [shelves, heatmapData])

  return (
    <ErrorBoundary>
      <Card style={{ padding: Spacing.xl }}>
        <ChartHeader showLabels={showLabels} />

        <HeatmapGrid
          gridData={gridData}
          selectedCell={selectedCell}
          onCellClick={onCellClick}
        />

        <SummaryStats summary={summary} />
      </Card>
    </ErrorBoundary>
  )
}