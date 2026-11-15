export const Colors = {
  background: 'rgba(15, 23, 42, 0.9)',
  backgroundSecondary: 'rgba(30, 41, 59, 0.8)',
  backgroundTertiary: 'rgba(30, 41, 59, 0.6)',
  border: '#334155',
  borderLight: '#1e293b',
  text: '#f1f5f9',
  textSecondary: '#94a3b8',
  textMuted: '#64748b',
  primary: '#38bdf8',
  success: '#22c55e',
  warning: '#fbbf24',
  danger: '#ef4444',
  info: '#3b82f6',
  urgent: {
    critical: '#ef4444',
    high: '#fbbf24',
    medium: '#3b82f6',
    low: '#64748b'
  },
  status: {
    active: '#22c55e',
    maintenance: '#fbbf24',
    inactive: '#64748b'
  },
  heatmap: {
    cold: '#1d4ed8',
    cool: '#0ea5e9',
    normal: '#22c55e',
    warm: '#eab308',
    hot: '#ef4444'
  }
} as const

export const Spacing = {
  xs: '4px',
  sm: '6px',
  md: '8px',
  lg: '12px',
  xl: '16px',
  xxl: '20px'
} as const

export const FontSizes = {
  xs: '10px',
  sm: '11px',
  md: '12px',
  lg: '13px',
  xl: '15px',
  xxl: '18px',
  title: '28px'
} as const

export const BorderRadius = {
  sm: '3px',
  md: '4px',
  lg: '8px',
  xl: '12px'
} as const

export const Transitions = {
  fast: '0.15s',
  normal: '0.2s',
  slow: '0.3s'
} as const

export const Shadows = {
  glow: (color: string) => `0 0 8px ${color}`,
  glowLarge: (color: string) => `0 0 10px ${color}`
} as const