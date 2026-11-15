import { useState, useEffect, useCallback } from 'react'

export interface ToastNotification {
  id: string
  type: 'info' | 'success' | 'warning' | 'error' | 'critical'
  title: string
  message: string
  duration?: number
  timestamp: number
}

interface ToastContextValue {
  notifications: ToastNotification[]
  addNotification: (notification: Omit<ToastNotification, 'id' | 'timestamp'>) => void
  removeNotification: (id: string) => void
  clearAll: () => void
}

const toastListeners: Set<ToastContextValue['addNotification']> = new Set()

export function addToast(notification: Omit<ToastNotification, 'id' | 'timestamp'>) {
  toastListeners.forEach(listener => listener(notification))
}

export function useToast() {
  const [notifications, setNotifications] = useState<ToastNotification[]>([])

  const addNotification = useCallback((notification: Omit<ToastNotification, 'id' | 'timestamp'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const newNotification: ToastNotification = {
      ...notification,
      id,
      timestamp: Date.now(),
    }
    setNotifications(prev => [...prev, newNotification])
  }, [])

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }, [])

  const clearAll = useCallback(() => {
    setNotifications([])
  }, [])

  useEffect(() => {
    toastListeners.add(addNotification)
    return () => { toastListeners.delete(addNotification) }
  }, [addNotification])

  return { notifications, addNotification, removeNotification, clearAll }
}

const TYPE_STYLES: Record<string, { bg: string; border: string; icon: string }> = {
  info: { bg: '#1e3a5f', border: '#3b82f6', icon: 'ℹ️' },
  success: { bg: '#14532d', border: '#10b981', icon: '✅' },
  warning: { bg: '#451a03', border: '#f59e0b', icon: '⚠️' },
  error: { bg: '#450a0a', border: '#ef4444', icon: '❌' },
  critical: { bg: '#450a0a', border: '#dc2626', icon: '🔴' },
}

export function ToastContainer() {
  const { notifications, removeNotification } = useToast()

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      maxWidth: '400px',
    }}>
      {notifications.map(notification => (
        <ToastItem
          key={notification.id}
          notification={notification}
          onClose={() => removeNotification(notification.id)}
        />
      ))}
    </div>
  )
}

function ToastItem({ notification, onClose }: { notification: ToastNotification; onClose: () => void }) {
  const style = TYPE_STYLES[notification.type] || TYPE_STYLES.info

  useEffect(() => {
    const duration = notification.duration ?? 5000
    if (duration > 0) {
      const timer = setTimeout(onClose, duration)
      return () => clearTimeout(timer)
    }
  }, [notification.duration, onClose])

  return (
    <div style={{
      background: style.bg,
      border: `1px solid ${style.border}`,
      borderRadius: '8px',
      padding: '12px 16px',
      display: 'flex',
      alignItems: 'flex-start',
      gap: '12px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
      animation: 'slideIn 0.2s ease-out',
    }}>
      <span style={{ fontSize: '18px' }}>{style.icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ color: '#e2e8f0', fontWeight: 'bold', fontSize: '14px', marginBottom: '4px' }}>
          {notification.title}
        </div>
        <div style={{ color: '#94a3b8', fontSize: '13px', wordBreak: 'break-word' }}>
          {notification.message}
        </div>
      </div>
      <button
        onClick={onClose}
        style={{
          background: 'transparent',
          border: 'none',
          color: '#64748b',
          cursor: 'pointer',
          padding: '4px',
          fontSize: '16px',
          lineHeight: 1,
        }}
      >
        ✕
      </button>
    </div>
  )
}