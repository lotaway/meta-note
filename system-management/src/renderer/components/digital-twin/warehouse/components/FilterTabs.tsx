import { Colors, Spacing, FontSizes, BorderRadius, Transitions } from '../styles/constants'

type FilterType = 'all' | 'pending' | 'approved' | 'ordered'

interface FilterTabsProps {
  activeFilter: FilterType
  onChange: (filter: FilterType) => void
  count: number
}

const FILTER_LABELS: Record<FilterType, string> = {
  all: '全部',
  pending: '待审批',
  approved: '已审批',
  ordered: '已下单'
}

export function FilterTabs({ activeFilter, onChange, count }: FilterTabsProps) {
  const filters: FilterType[] = ['all', 'pending', 'approved', 'ordered']
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: Spacing.lg }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: Spacing.sm }}>
        <span style={{ fontWeight: 600, fontSize: FontSizes.xl }}>补货建议</span>
        <span style={{ background: 'rgba(239, 68, 68, 0.2)', color: Colors.danger, fontSize: FontSizes.xs, fontWeight: 600, padding: '2px 8px', borderRadius: '10px' }}>{count}</span>
      </div>
      <div style={{ display: 'flex', gap: Spacing.xs }}>
        {filters.map(f => (
          <button
            key={f}
            onClick={() => onChange(f)}
            style={{
              padding: `${Spacing.xs} 10px`,
              borderRadius: BorderRadius.md,
              border: 'none',
              background: activeFilter === f ? Colors.border : 'transparent',
              color: activeFilter === f ? Colors.text : Colors.textMuted,
              fontSize: FontSizes.sm,
              cursor: 'pointer',
              transition: Transitions.normal
            }}
          >
            {FILTER_LABELS[f]}
          </button>
        ))}
      </div>
    </div>
  )
}