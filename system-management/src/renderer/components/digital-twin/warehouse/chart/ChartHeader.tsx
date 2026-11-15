import { Spacing, FontSizes } from '../styles/constants'

interface ChartHeaderProps { title: string; legend: React.ReactNode }

export function ChartHeader({ title, legend }: ChartHeaderProps) {
  return (
    <div role="banner" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.xl }}>
      <span style={{ fontWeight: 600, fontSize: FontSizes.xl }}>{title}</span>
      {legend}
    </div>
  )
}
