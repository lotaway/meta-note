export interface NotificationOptions {
  title: string
  body: string
  icon?: string
  tag?: string
  requireInteraction?: boolean
  silent?: boolean
  onClick?: () => void
}

export class NotificationService {
  private permission: NotificationPermission = 'default'
  private audioContext: AudioContext | null = null

  constructor() {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      this.permission = Notification.permission
    }
  }

  async requestPermission(): Promise<boolean> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return false
    }
    if (this.permission === 'granted') {
      return true
    }
    const result = await Notification.requestPermission()
    this.permission = result
    return result === 'granted'
  }

  async show(options: NotificationOptions): Promise<Notification | null> {
    if (this.permission !== 'granted') {
      const granted = await this.requestPermission()
      if (!granted) return null
    }

    const instance = new Notification(options.title, {
      body: options.body,
      icon: options.icon || '/favicon.ico',
      tag: options.tag,
      requireInteraction: options.requireInteraction,
      silent: options.silent,
    })

    // Electron 42 switched macOS notifications to UNNotification, which only
    // displays them for code-signed applications. An unsigned dev build now
    // fails at display time instead of silently succeeding, so surface it.
    instance.onerror = () => {
      console.warn('Notification could not be displayed (unsigned app on macOS?)')
    }
    if (options.onClick) {
      instance.onclick = options.onClick
    }

    return instance
  }

  async playAlertSound(level: 'info' | 'warning' | 'error' | 'critical' = 'warning'): Promise<void> {
    try {
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      }

      const ctx = this.audioContext
      if (ctx.state === 'suspended') {
        await ctx.resume()
      }

      const oscillator = ctx.createOscillator()
      const gainNode = ctx.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(ctx.destination)

      const config = {
        info: { frequency: 440, duration: 0.2, type: 'sine' as OscillatorType },
        warning: { frequency: 660, duration: 0.3, type: 'sine' as OscillatorType },
        error: { frequency: 880, duration: 0.4, type: 'square' as OscillatorType },
        critical: { frequency: 1200, duration: 0.5, type: 'sawtooth' as OscillatorType },
      }

      const { frequency, duration, type } = config[level]
      const now = ctx.currentTime

      oscillator.frequency.setValueAtTime(frequency, now)
      oscillator.type = type

      gainNode.gain.setValueAtTime(0.3, now)
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration)

      oscillator.start(now)
      oscillator.stop(now + duration)

      if (level === 'critical') {
        const osc2 = ctx.createOscillator()
        const gain2 = ctx.createGain()
        osc2.connect(gain2)
        gain2.connect(ctx.destination)
        osc2.frequency.setValueAtTime(frequency * 1.5, now)
        osc2.type = 'sawtooth'
        gain2.gain.setValueAtTime(0.2, now)
        gain2.gain.exponentialRampToValueAtTime(0.01, now + duration * 1.5)
        osc2.start(now + 0.1)
        osc2.stop(now + duration * 1.5)
      }
    } catch (error) {
      console.error('Failed to play alert sound:', error)
    }
  }

  isSupported(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window
  }

  isGranted(): boolean {
    return this.permission === 'granted'
  }

  getPermission(): NotificationPermission {
    return this.permission
  }
}

export const notificationService = new NotificationService()