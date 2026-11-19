import { t } from '../../../../i18n'
import { Colors, Spacing, FontSizes, BorderRadius, Transitions } from '../styles/constants'

type FilterType = 'all' | 'pending' | 'approved' | 'ordered'

interface FilterTabsProps {
  activeFilter: FilterType
  onChange: (filter: FilterType) => void
  count: number
}

const FILTER_LABELS: Record<FilterType, string> = {
  all: t('common.all'),
  pending: t('warehouse.filter.pending'),
  approved: t('warehouse.filter.approved'),
  ordered: t('warehouse.filter.ordered')
}

export function FilterTabs({ activeFilter, onChange, count }: FilterTabsProps) {
  const filters: FilterType[] = ['all', 'pending', 'approved', 'ordered']
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: Spacing.lg }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: Spacing.sm }}>
        <span style={{ fontWeight: 600, fontSize: FontSizes.xl }}>{t('warehouse.restockSuggestions')}</span>
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