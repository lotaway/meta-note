import { describe, expect, it } from 'vitest'
import { buildMessageResponse } from './websocket.service'

describe('buildMessageResponse', () => {
  it('acknowledges hello with status ok', () => {
    const response = buildMessageResponse({ type: 'hello' })

    expect(response.type).toBe('hello_ack')
    expect(response.status).toBe('ok')
    expect(response.code).toBe(200)
  })

  it('answers ping with pong', () => {
    expect(buildMessageResponse({ type: 'ping' }).type).toBe('pong')
  })

  it('echoes channels on subscribe and unsubscribe', () => {
    const channels = ['alert', 'telemetry']
    expect(buildMessageResponse({ type: 'subscribe', channels }).channels).toEqual(channels)
    expect(buildMessageResponse({ type: 'unsubscribe', channels }).channels).toEqual(channels)
  })

  it('returns an error response for unknown types', () => {
    const response = buildMessageResponse({ type: 'bogus' })

    expect(response.type).toBe('error')
    expect(response.code).toBe(4001)
    expect(response.error).toContain('bogus')
  })

  it('defaults channels to an empty array', () => {
    expect(buildMessageResponse({ type: 'subscribe' }).channels).toEqual([])
  })
})
