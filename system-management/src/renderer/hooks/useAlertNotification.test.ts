import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useAlertNotification, type AlertEvent } from './useAlertNotification'

vi.mock('../components/Toast', () => ({
  notificationService: {
    playAlertSound: vi.fn().mockResolvedValue(undefined),
    show: vi.fn().mockResolvedValue(undefined),
    isSupported: vi.fn().mockReturnValue(true),
    requestPermission: vi.fn().mockResolvedValue('granted'),
  },
  addToast: vi.fn(),
}))

vi.mock('../services/api/alertRule', () => ({
  alertRuleApi: {
    fetchRules: vi.fn().mockResolvedValue([]),
  },
}))

describe('useAlertNotification', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  it('should not connect when enabled is false', () => {
    const { result } = renderHook(() =>
      useAlertNotification({ wsUrl: 'ws://localhost:8080', enabled: false }),
    )

    expect(result.current.isAlertSoundEnabled()).toBe(true)
    expect(result.current.isBrowserNotificationEnabled()).toBe(true)
  })

  it('should toggle alert sound enabled state', () => {
    const { result } = renderHook(() =>
      useAlertNotification({ wsUrl: 'ws://localhost:8080', enabled: false }),
    )

    expect(result.current.isAlertSoundEnabled()).toBe(true)

    act(() => {
      result.current.setAlertSoundEnabled(false)
    })

    expect(result.current.isAlertSoundEnabled()).toBe(false)
  })

  it('should toggle browser notification enabled state', async () => {
    const { result } = renderHook(() =>
      useAlertNotification({ wsUrl: 'ws://localhost:8080', enabled: false }),
    )

    expect(result.current.isBrowserNotificationEnabled()).toBe(true)

    await act(async () => {
      await result.current.setBrowserNotificationEnabled(false)
    })

    expect(result.current.isBrowserNotificationEnabled()).toBe(false)
  })

  it('should generate test alert with correct structure', async () => {
    const onAlert = vi.fn()
    const { result } = renderHook(() =>
      useAlertNotification({ wsUrl: 'ws://localhost:8080', onAlert, enabled: false }),
    )

    await act(async () => {
      await result.current.testAlert('WARNING')
    })

    expect(onAlert).toHaveBeenCalled()
    const testAlert = onAlert.mock.calls[0][0] as AlertEvent
    expect(testAlert.level).toBe('WARNING')
    expect(testAlert.title).toBe('测试告警')
    expect(testAlert.type).toBe('TEST')
  })

  it('should generate CRITICAL level test alert', async () => {
    const onAlert = vi.fn()
    const { result } = renderHook(() =>
      useAlertNotification({ wsUrl: 'ws://localhost:8080', onAlert, enabled: false }),
    )

    await act(async () => {
      await result.current.testAlert('CRITICAL')
    })

    const testAlert = onAlert.mock.calls[0][0] as AlertEvent
    expect(testAlert.level).toBe('CRITICAL')
  })
})