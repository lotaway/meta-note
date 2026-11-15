import path from 'node:path'
import { describe, it, expect, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  handlers: new Map<string, (...args: any[]) => any>(),
  listeners: new Map<string, (...args: any[]) => any>(),
  showOpenDialog: vi.fn(),
  openExternal: vi.fn(async (_url: string) => undefined),
}))

vi.mock('electron', () => ({
  ipcMain: {
    handle: (channel: string, handler: (...args: any[]) => any) => mocks.handlers.set(channel, handler),
    on: (channel: string, listener: (...args: any[]) => any) => mocks.listeners.set(channel, listener),
  },
  desktopCapturer: { getSources: vi.fn(async () => []) },
  dialog: { showOpenDialog: mocks.showOpenDialog },
  shell: { openExternal: mocks.openExternal },
}))
vi.mock('@nestjs/common', () => ({}))
vi.mock('./nestjs/services/media.service', () => ({ MediaService: class MediaService {} }))
vi.mock('./nestjs/services/llm.service', () => ({ LLMService: class LLMService {} }))
vi.mock('./rust-bridge', () => ({ getAudioManager: () => null }))

import { IpcRegistry } from './ipc-registry'
import { IPC_CHANNELS, EXTERNAL_TARGETS } from './constants'

const root = path.resolve('granted-root')

function createRegistry() {
  mocks.handlers.clear()
  mocks.listeners.clear()
  mocks.openExternal.mockClear()
  mocks.showOpenDialog.mockReset()

  const services = {
    readFileInDirectory: vi.fn((directory: string) => ({ names: [], paths: [directory] })),
    mergeVideo: vi.fn(async () => ({ statusMsg: 'done' })),
    completion: vi.fn(async () => 'answer'),
  }
  const registry = new IpcRegistry(
    () => ({ get: () => services } as any),
    () => ({ getSubtitlesWindow: () => null })
  )
  registry.register()
  return { services, handler: (channel: string) => mocks.handlers.get(channel)! }
}

async function grantDirectory(handler: (...args: any[]) => any, directory: string) {
  mocks.showOpenDialog.mockResolvedValueOnce({ canceled: false, filePaths: [directory] })
  return await handler(IPC_CHANNELS.SELECT_DIRECTORY)({}, { title: 'Pick' })
}

describe('IpcRegistry directory boundary', () => {
  it('denies file reads before any directory is granted', async () => {
    const { handler } = createRegistry()
    await expect(handler(IPC_CHANNELS.READ_FILE_IN_DIRECTORY)({}, root))
      .rejects.toThrow(/outside the granted directories/)
  })

  it('grants a directory through the native dialog and allows reads inside it', async () => {
    const { handler, services } = createRegistry()
    expect(await grantDirectory(handler, root)).toBe(root)
    const nested = path.join(root, 'clips')
    await handler(IPC_CHANNELS.READ_FILE_IN_DIRECTORY)({}, nested)
    expect(services.readFileInDirectory).toHaveBeenCalledWith(nested)
  })

  it('rejects parent traversal outside the granted root', async () => {
    const { handler } = createRegistry()
    await grantDirectory(handler, root)
    await expect(handler(IPC_CHANNELS.READ_FILE_IN_DIRECTORY)({}, path.join(root, '..', 'private')))
      .rejects.toThrow(/outside the granted directories/)
  })

  it('rejects a sibling directory sharing the granted prefix', async () => {
    const { handler } = createRegistry()
    await grantDirectory(handler, root)
    await expect(handler(IPC_CHANNELS.READ_FILE_IN_DIRECTORY)({}, `${root}-evil`))
      .rejects.toThrow(/outside the granted directories/)
  })

  it('rejects a merge when any video is outside the granted root', async () => {
    const { handler, services } = createRegistry()
    await grantDirectory(handler, root)
    const videos = [path.join(root, 'a.mp4'), path.resolve('outside-evil.mp4')]
    await expect(handler(IPC_CHANNELS.MERGE_VIDEO)({}, videos, root))
      .rejects.toThrow(/outside the granted directories/)
    expect(services.mergeVideo).not.toHaveBeenCalled()
  })

  it('allows a merge when every path is inside the granted root', async () => {
    const { handler, services } = createRegistry()
    await grantDirectory(handler, root)
    const videos = [path.join(root, 'a.mp4')]
    await handler(IPC_CHANNELS.MERGE_VIDEO)({}, videos, root)
    expect(services.mergeVideo).toHaveBeenCalledWith(videos, root)
  })
})

describe('IpcRegistry input validation', () => {
  it('rejects a non-string LLM prompt', async () => {
    const { handler } = createRegistry()
    await expect(handler(IPC_CHANNELS.LLM_COMPLETION)({}, { text: 'x' }))
      .rejects.toThrow(/non-empty string/)
  })

  it('rejects invalid audio capture parameters', async () => {
    const { handler } = createRegistry()
    await expect(handler(IPC_CHANNELS.AUDIO_START_CAPTURE)({}, -1, 0))
      .rejects.toThrow(/non-negative integer/)
    await expect(handler(IPC_CHANNELS.AUDIO_START_CAPTURE)({}, 0, 'fast'))
      .rejects.toThrow(/non-negative number/)
  })

  it('rejects unknown and prototype-chain external targets', async () => {
    const { handler } = createRegistry()
    await expect(handler(IPC_CHANNELS.OPEN_EXTERNAL)({}, 'toString'))
      .rejects.toThrow(/Unknown external target/)
    await expect(handler(IPC_CHANNELS.OPEN_EXTERNAL)({}, 'file:///etc/passwd'))
      .rejects.toThrow(/Unknown external target/)
  })

  it('opens only approved https targets', async () => {
    const { handler } = createRegistry()
    await handler(IPC_CHANNELS.OPEN_EXTERNAL)({}, 'chatgpt')
    expect(mocks.openExternal).toHaveBeenCalledWith(EXTERNAL_TARGETS.chatgpt)
    expect(mocks.openExternal.mock.calls[0][0]).toMatch(/^https:\/\//)
  })

  it('declares unique channels and https-only external targets', () => {
    const channels = Object.values(IPC_CHANNELS)
    expect(new Set(channels).size).toBe(channels.length)
    expect(Object.values(EXTERNAL_TARGETS).every(url => url.startsWith('https://'))).toBe(true)
  })
})
