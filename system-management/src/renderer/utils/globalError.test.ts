import { describe, expect, it, vi } from 'vitest'
import { formatErrorReport, onGlobalError, type ErrorReport } from './globalError'

describe('formatErrorReport', () => {
  it('extracts message and stack from an Error', () => {
    const error = new Error('boom')
    const report = formatErrorReport('runtime', error)

    expect(report.source).toBe('runtime')
    expect(report.message).toBe('boom')
    expect(report.stack).toContain('boom')
  })

  it('stringifies a non-Error rejection reason', () => {
    const report = formatErrorReport('rejection', 'plain failure')

    expect(report.source).toBe('rejection')
    expect(report.message).toBe('plain failure')
    expect(report.stack).toBeUndefined()
  })
})

describe('onGlobalError', () => {
  it('returns an unsubscribe handle', () => {
    const sink = vi.fn<(report: ErrorReport) => void>()
    const unsubscribe = onGlobalError(sink)

    expect(typeof unsubscribe).toBe('function')
    expect(() => unsubscribe()).not.toThrow()
  })
})
