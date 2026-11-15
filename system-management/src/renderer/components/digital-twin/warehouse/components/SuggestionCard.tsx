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
import { UrgencyBadge } from './UrgencyBadge'
import { StatusBadge } from './StatusBadge'
import { Button } from './Button'
import { Colors, Spacing, FontSizes, BorderRadius, Transitions } from '../styles/constants'
import { formatDateTime } from '../utils/format'

interface SuggestionCardProps {
  suggestion: RestockSuggestion
  isExpanded: boolean
  onToggle: () => void
  onApprove?: (id: string) => void
  onReject?: (id: string, reason?: string) => void
  onOrder?: (id: string) => void
  onDetailsClick?: (s: RestockSuggestion) => void
}

export function SuggestionCard({
  suggestion,
  isExpanded,
  onToggle,
  onApprove,
  onReject,
  onOrder,
  onDetailsClick
}: SuggestionCardProps) {
  const confidenceColor = suggestion.confidence >= 80 ? Colors.success : 
                          suggestion.confidence >= 60 ? Colors.warning : Colors.danger

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onToggle}
      onKeyDown={(e) => e.key === 'Enter' && onToggle()}
      style={{
        background: isExpanded ? 'rgba(30, 41, 59, 0.9)' : Colors.background,
        borderRadius: BorderRadius.lg,
        border: `1px solid ${isExpanded ? Colors.primary : Colors.border}`,
        marginBottom: Spacing.md,
        overflow: 'hidden',
        transition: Transitions.normal,
        cursor: 'pointer'
      }}
      aria-expanded={isExpanded}
    >
      <div style={{ padding: `${Spacing.lg} ${Spacing.xl}`, display: 'flex', alignItems: 'center', gap: Spacing.lg }}>
        <div style={{ width: '4px', height: '40px', background: Colors.primary, borderRadius: '2px' }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.xs }}>
            <span style={{ fontWeight: 500, fontSize: FontSizes.lg, color: Colors.text }}>{suggestion.itemName}</span>
            <UrgencyBadge urgency={suggestion.urgency} />
            <StatusBadge status={suggestion.status} />
          </div>
          <div style={{ fontSize: FontSizes.xs, color: Colors.textMuted }}>
            <span style={{ color: Colors.primary }}>{suggestion.itemSku}</span>
            <span style={{ margin: `0 ${Spacing.sm}` }}>•</span>
            <span>{suggestion.category}</span>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: FontSizes.xxl, fontWeight: 600, color: Colors.text }}>+{suggestion.suggestedQuantity}</div>
          <div style={{ fontSize: FontSizes.xs, color: Colors.textMuted }}>当前: {suggestion.currentStock}</div>
        </div>
        <div style={{ color: Colors.textMuted, fontSize: FontSizes.xs, transform: isExpanded ? 'rotate(180deg)' : 'none', transition: Transitions.normal }}>
          ▼
        </div>
      </div>
      {isExpanded && (
        <div style={{ padding: `${Spacing.lg} ${Spacing.xl}`, borderTop: `1px solid ${Colors.border}`, background: 'rgba(15, 23, 42, 0.8)' }}>
          <div style={{ fontSize: FontSizes.md, color: Colors.textSecondary, marginBottom: Spacing.lg }}>{suggestion.reason}</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: Spacing.md, fontSize: FontSizes.sm, marginBottom: Spacing.lg }}>
            <div><span style={{ color: Colors.textMuted }}>置信度: </span><span style={{ color: confidenceColor }}>{suggestion.confidence}%</span></div>
            {suggestion.estimatedArrival && <div><span style={{ color: Colors.textMuted }}>预计到货: </span><span style={{ color: Colors.text }}>{suggestion.estimatedArrival}</span></div>}
            <div><span style={{ color: Colors.textMuted }}>创建时间: </span><span style={{ color: Colors.textSecondary }}>{formatDateTime(suggestion.createdAt)}</span></div>
          </div>
          <div style={{ display: 'flex', gap: Spacing.md, flexWrap: 'wrap' }}>
            {suggestion.status === 'pending' && onApprove && <Button variant="primary" onClick={(e) => { e.stopPropagation(); onApprove(suggestion.id) }}>审批通过</Button>}
            {suggestion.status === 'pending' && onReject && <Button onClick={(e) => { e.stopPropagation(); onReject(suggestion.id) }}>拒绝</Button>}
            {suggestion.status === 'approved' && onOrder && <Button variant="primary" onClick={(e) => { e.stopPropagation(); onOrder(suggestion.id) }}>下单</Button>}
            {onDetailsClick && <Button onClick={(e) => { e.stopPropagation(); onDetailsClick(suggestion) }}>查看详情</Button>}
          </div>
        </div>
      )}
    </div>
  )
}