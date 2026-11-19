import { useState, useMemo } from 'react'
import { Card } from './components/Card'
import { ErrorBoundary } from './components/ErrorBoundary'
import { FilterTabs } from './components/FilterTabs'
import { SuggestionCard } from './components/SuggestionCard'
import { Colors, Spacing, FontSizes } from './styles/constants'

const SUGGESTION_CONFIG = {
  maxHeight: '500px',
  urgencyIndicatorSize: '8px',
  emptyStatePadding: '40px'
} as const

const URGENCY_ORDER = ['critical', 'high', 'medium', 'low'] as const

const URGENCY_LABELS: Record<string, string> = {
  critical: '紧急',
  high: '高优先级',
  medium: '中等',
  low: '低优先级'
}

const URGENCY_COLORS: Record<string, string> = {
  critical: Colors.danger,
  high: Colors.warning,
  medium: Colors.info,
  low: Colors.textMuted
}

export interface RestockSuggestion {
  id: string
  itemId: string
  itemSku: string
  itemName: string
  category: string
  currentStock: number
  suggestedQuantity: number
  urgency: 'critical' | 'high' | 'medium' | 'low'
  reason: string
  estimatedArrival?: string
  confidence: number
  createdAt: string
  status: 'pending' | 'approved' | 'ordered' | 'rejected'
  approver?: string
  approvedAt?: string
}

export interface RestockSuggestionsProps {
  suggestions?: RestockSuggestion[]
  items?: RestockSuggestion[]
  filterUrgency?: string
  onApprove?: (suggestionId: string) => void
  onReject?: (suggestionId: string, reason?: string) => void
  onOrder?: (suggestionId: string) => void
  onDismiss?: (suggestionId: string) => void
  onDetailsClick?: (suggestion: RestockSuggestion) => void
  groupByUrgency?: boolean
}

function getUrgencyLabel(urgency: string): string {
  return URGENCY_LABELS[urgency] || urgency
}

function getUrgencyColor(urgency: string): string {
  return URGENCY_COLORS[urgency] || Colors.textMuted
}

function UrgencyGroupHeader({ urgency, count }: { urgency: string; count: number }) {
  const color = getUrgencyColor(urgency)
  const label = getUrgencyLabel(urgency)

  return (
    <div
      role="group"
      aria-label={`${label} 级别补货建议`}
      style={{ marginBottom: Spacing.xl }}
    >
      <div
        style={{
          fontSize: FontSizes.xs,
          color,
          marginBottom: Spacing.md,
          display: 'flex',
          alignItems: 'center',
          gap: Spacing.xs
        }}
      >
        <span
          style={{
            width: SUGGESTION_CONFIG.urgencyIndicatorSize,
            height: SUGGESTION_CONFIG.urgencyIndicatorSize,
            borderRadius: '50%',
            background: color
          }}
        />
        {label} ({count})
      </div>
    </div>
  )
}

function SuggestionList({
  suggestions,
  expandedId,
  onToggle,
  onApprove,
  onReject,
  onOrder,
  onDetailsClick
}: {
  suggestions: RestockSuggestion[]
  expandedId: string | null
  onToggle: (id: string) => void
  onApprove?: (id: string) => void
  onReject?: (id: string, reason?: string) => void
  onOrder?: (id: string) => void
  onDetailsClick?: (suggestion: RestockSuggestion) => void
}) {
  return (
    <>
      {suggestions.map(s => (
        <SuggestionCard
          key={s.id}
          suggestion={s}
          isExpanded={expandedId === s.id}
          onToggle={() => onToggle(s.id)}
          onApprove={onApprove}
          onReject={onReject}
          onOrder={onOrder}
          onDetailsClick={onDetailsClick}
        />
      ))}
    </>
  )
}

function GroupedView({
  groupedSuggestions,
  expandedId,
  onToggle,
  onApprove,
  onReject,
  onOrder,
  onDetailsClick
}: {
  groupedSuggestions: Record<string, RestockSuggestion[]>
  expandedId: string | null
  onToggle: (id: string) => void
  onApprove?: (id: string) => void
  onReject?: (id: string, reason?: string) => void
  onOrder?: (id: string) => void
  onDetailsClick?: (suggestion: RestockSuggestion) => void
}) {
  return (
    <>
      {URGENCY_ORDER.map(urgency => {
        const items = groupedSuggestions[urgency] || []
        if (items.length === 0) return null

        return (
          <div key={urgency}>
            <UrgencyGroupHeader urgency={urgency} count={items.length} />
            <SuggestionList
              suggestions={items}
              expandedId={expandedId}
              onToggle={onToggle}
              onApprove={onApprove}
              onReject={onReject}
              onOrder={onOrder}
              onDetailsClick={onDetailsClick}
            />
          </div>
        )
      })}
    </>
  )
}

function EmptyState() {
  return (
    <div
      style={{
        padding: SUGGESTION_CONFIG.emptyStatePadding,
        textAlign: 'center',
        color: Colors.textMuted,
        fontSize: FontSizes.lg
      }}
    >
      暂无补货建议
    </div>
  )
}

function FilterHeader({
  filter,
  count,
  setFilter
}: {
  filter: 'all' | 'pending' | 'approved' | 'ordered'
  count: number
  setFilter: (f: 'all' | 'pending' | 'approved' | 'ordered') => void
}) {
  return (
    <div
      style={{
        paddingBottom: Spacing.lg,
        borderBottom: `1px solid ${Colors.border}`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}
    >
      <FilterTabs activeFilter={filter} onChange={setFilter} count={count} />
    </div>
  )
}

export function RestockSuggestions({
  suggestions,
  items,
  onApprove,
  onReject,
  onOrder,
  onDismiss,
  onDetailsClick,
  groupByUrgency = true
}: RestockSuggestionsProps) {
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'ordered'>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // Use items as alias for suggestions
  const data = suggestions || items || []

  const filteredSuggestions = useMemo(() => {
    return data.filter(s => filter === 'all' || s.status === filter)
  }, [data, filter])

  const groupedSuggestions = useMemo(() => {
    if (!groupByUrgency) return { all: filteredSuggestions }

    const groups = {
      critical: [] as RestockSuggestion[],
      high: [] as RestockSuggestion[],
      medium: [] as RestockSuggestion[],
      low: [] as RestockSuggestion[]
    }

    filteredSuggestions.forEach(s => {
      if (s.urgency === 'critical') groups.critical.push(s)
      else if (s.urgency === 'high') groups.high.push(s)
      else if (s.urgency === 'medium') groups.medium.push(s)
      else groups.low.push(s)
    })

    return groups
  }, [filteredSuggestions, groupByUrgency])

  const handleToggle = (id: string) => {
    setExpandedId(prev => prev === id ? null : id)
  }

  const hasContent = filteredSuggestions.length > 0

  return (
    <ErrorBoundary>
      <Card style={{ padding: Spacing.xl }}>
        <FilterHeader filter={filter} count={filteredSuggestions.length} setFilter={setFilter} />

        <div
          role="list"
          aria-label="补货建议列表"
          style={{
            maxHeight: SUGGESTION_CONFIG.maxHeight,
            overflowY: 'auto',
            padding: Spacing.xl
          }}
        >
          {!hasContent ? (
            <EmptyState />
          ) : groupByUrgency ? (
            <GroupedView
              groupedSuggestions={groupedSuggestions}
              expandedId={expandedId}
              onToggle={handleToggle}
              onApprove={onApprove}
              onReject={onReject}
              onOrder={onOrder}
              onDetailsClick={onDetailsClick}
            />
          ) : (
            <SuggestionList
              suggestions={filteredSuggestions}
              expandedId={expandedId}
              onToggle={handleToggle}
              onApprove={onApprove}
              onReject={onReject}
              onOrder={onOrder}
              onDetailsClick={onDetailsClick}
            />
          )}
        </div>
      </Card>
    </ErrorBoundary>
  )
}