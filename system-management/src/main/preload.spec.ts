import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest'

const mocks = vi.hoisted(() => ({
  invoke: vi.fn(async (..._args: unknown[]) => undefined),
  send: vi.fn(),
  on: vi.fn(),
  removeListener: vi.fn(),
  exposed: {} as Record<string, unknown>,
}))

vi.mock('electron', () => ({
  contextBridge: {
    exposeInMainWorld: (_key: string, api: Record<string, unknown>) => {
      Object.assign(mocks.exposed, api)
    },
  },
  ipcRenderer: {
    invoke: mocks.invoke,
    send: mocks.send,
    on: mocks.on,
    removeListener: mocks.removeListener,
  },
}))

vi.mock('./browser-fingerprint', () => ({ applyFingerprintCorrection: vi.fn() }))

import { IPC_CHANNELS } from './constants'

const EXPECTED_METHODS = [
  'selectDirectory', 'readFileInDirectory', 'mergeVideo', 'llmCompletion',
  'openSubtitles', 'closeSubtitles', 'updateSubtitles', 'sendSubtitlesText',
  'onSubtitlesText', 'offSubtitlesText', 'onSubtitlesStyle', 'offSubtitlesStyle',
  'getAudioSources', 'listAudioDevices', 'startAudioCapture', 'stopAudioCapture',
  'getAudioData', 'getOSNetworkInterfaces', 'openExternal',
  'getLocalApiToken', 'getGatewayToken', 'invalidateGatewayToken', 'openMonitor', 'openExternalLogin',
]

const api = () => mocks.exposed as Record<string, (...args: any[]) => any>

beforeAll(async () => {
  await import('./preload')
})

beforeEach(() => {
  mocks.invoke.mockClear()
  mocks.send.mockClear()
  mocks.on.mockClear()
  mocks.removeListener.mockClear()
  mocks.invoke.mockResolvedValue(undefined)
})

describe('preload bridge', () => {
  it('exposes only named methods, never a generic channel bridge', () => {
    expect(Object.keys(mocks.exposed).sort()).toEqual([...EXPECTED_METHODS].sort())
    for (const forbidden of ['send', 'receive', 'ipcSend', 'ipcSendSync', 'ipcSendTo', 'ipcOn', 'ipcRemoveAllListeners']) {
      expect(mocks.exposed).not.toHaveProperty(forbidden)
    }
  })

  it('routes every invoke through a declared IPC channel', async () => {
    await api().selectDirectory({})
    await api().readFileInDirectory('/tmp/x')
    await api().mergeVideo(['/tmp/a.mp4'], '/tmp')
    await api().llmCompletion('hello')
    await api().openSubtitles()
    await api().closeSubtitles()
    await api().updateSubtitles('hi')
    await api().getAudioSources()
    await api().listAudioDevices()
    await api().startAudioCapture(0, 44100)
    await api().stopAudioCapture()
    await api().getAudioData()
    await api().getOSNetworkInterfaces()
    await api().openExternal('chatgpt')
    await api().getLocalApiToken()
    await api().getGatewayToken()
    await api().invalidateGatewayToken()
    await api().openMonitor('chatgpt')
    await api().openExternalLogin('deepseek')

    const declared = new Set<string>(Object.values(IPC_CHANNELS))
    const channels = mocks.invoke.mock.calls.map(call => String(call[0]))
    expect(channels).toHaveLength(19)
    expect(channels.every(channel => declared.has(channel))).toBe(true)
  })

  it('uses send only for the subtitle text channel', () => {
    api().sendSubtitlesText('hello')
    expect(mocks.send).toHaveBeenCalledWith(IPC_CHANNELS.SUBTITLES_TEXT, 'hello')
    expect(mocks.invoke).not.toHaveBeenCalled()
  })

  it('propagates invoke failures instead of swallowing them', async () => {
    mocks.invoke.mockRejectedValueOnce(new Error('main process failed'))
    await expect(api().readFileInDirectory('/tmp/x')).rejects.toThrow('main process failed')
  })

  it('forwards subscription payloads without the IPC event object', () => {
    const listener = vi.fn()
    api().onSubtitlesText(listener)
    const [channel, wrapper] = mocks.on.mock.calls[0]
    expect(channel).toBe(IPC_CHANNELS.SUBTITLES_TEXT)
    wrapper({}, 'hello')
    expect(listener).toHaveBeenCalledWith('hello')

    api().offSubtitlesText(listener)
    expect(mocks.removeListener).toHaveBeenCalledWith(IPC_CHANNELS.SUBTITLES_TEXT, wrapper)
  })
})
