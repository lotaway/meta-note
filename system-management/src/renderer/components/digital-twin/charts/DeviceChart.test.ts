import { describe, it, expect, vi, beforeEach } from 'vitest'

function normalizeHex(c: string): string {
  if (!c.startsWith('#')) return c
  let hex = c.slice(1)
  if (hex.length === 3) {
    hex = hex.split('').map(char => char + char).join('')
  }
  return hex
}

function hexToRgba(hex: string): string | null {
  if (!/^[0-9a-fA-F]{6}$/.test(hex)) return null
  const r = parseInt(hex.slice(0, 2), 16)
  const g = parseInt(hex.slice(2, 4), 16)
  const b = parseInt(hex.slice(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, 0.3)`
}

function rgbToRgba(c: string): string {
  const match = c.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
  if (match) {
    return `rgba(${match[1]}, ${match[2]}, ${match[3]}, 0.3)`
  }
  return c.replace('rgb', 'rgba').replace(')', ', 0.3)')
}

function toFillColor(c: string): string {
  const hex = normalizeHex(c)
  if (c.startsWith('#')) {
    const rgba = hexToRgba(hex)
    if (rgba) return rgba
  }
  if (c.startsWith('rgb')) {
    return rgbToRgba(c)
  }
  return c
}

describe('DeviceChart utility functions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('normalizeHex', () => {
    it('should return same string if not starting with #', () => {
      expect(normalizeHex('abc')).toBe('abc')
    })

    it('should expand 3-digit hex to 6-digit', () => {
      expect(normalizeHex('#fff')).toBe('ffffff')
    })

    it('should keep 6-digit hex as is', () => {
      expect(normalizeHex('#aabbcc')).toBe('aabbcc')
    })

    it('should handle # prefix', () => {
      expect(normalizeHex('#abc')).toBe('aabbcc')
    })
  })

  describe('hexToRgba', () => {
    it('should convert valid hex to rgba', () => {
      expect(hexToRgba('ff0000')).toBe('rgba(255, 0, 0, 0.3)')
    })

    it('should convert green hex to rgba', () => {
      expect(hexToRgba('00ff00')).toBe('rgba(0, 255, 0, 0.3)')
    })

    it('should convert blue hex to rgba', () => {
      expect(hexToRgba('0000ff')).toBe('rgba(0, 0, 255, 0.3)')
    })

    it('should return null for invalid hex', () => {
      expect(hexToRgba('invalid')).toBeNull()
      expect(hexToRgba('12345')).toBeNull()
      expect(hexToRgba('')).toBeNull()
    })
  })

  describe('rgbToRgba', () => {
    it('should convert rgb to rgba', () => {
      expect(rgbToRgba('rgb(255, 0, 0)')).toBe('rgba(255, 0, 0, 0.3)')
    })

    it('should handle rgba input', () => {
      expect(rgbToRgba('rgba(255, 0, 0, 1)')).toBe('rgba(255, 0, 0, 0.3)')
    })
  })

  describe('toFillColor', () => {
    it('should handle hex color', () => {
      expect(toFillColor('#ff0000')).toBe('rgba(255, 0, 0, 0.3)')
    })

    it('should handle 3-digit hex color', () => {
      expect(toFillColor('#f00')).toBe('rgba(255, 0, 0, 0.3)')
    })

    it('should handle rgb color', () => {
      expect(toFillColor('rgb(0, 255, 0)')).toBe('rgba(0, 255, 0, 0.3)')
    })

    it('should return unknown colors as is', () => {
      expect(toFillColor('unknown')).toBe('unknown')
      expect(toFillColor('blue')).toBe('blue')
    })
  })
})