import type { NetworkInterfaceInfo } from 'node:os'
import type { ExternalTarget, MonitorProvider } from './main/constants'
import type { SubtitleStyle } from './renderer/types/Subtitle'

export type ReceiveFn = (...args: any[]) => void
export type SubtitleStyleListener = (style: Partial<SubtitleStyle>) => void
export type SubtitleTextListener = (text: string) => void

export interface DirectoryFileList {
  names: string[]
  paths: string[]
}

export interface AudioSourceInfo {
  id: string
  name: string
}

interface DesktopAPI {
  selectDirectory(options?: { title?: string; defaultPath?: string }): Promise<string | null>
  readFileInDirectory(directory: string): Promise<DirectoryFileList>
  mergeVideo(videos: string[], outputPath: string): Promise<unknown>
  llmCompletion(prompt: string): Promise<unknown>
  openSubtitles(): Promise<void>
  closeSubtitles(): Promise<void>
  updateSubtitles(text: string): Promise<void>
  sendSubtitlesText(text: string): void
  onSubtitlesText(listener: SubtitleTextListener): void
  offSubtitlesText(listener: SubtitleTextListener): void
  onSubtitlesStyle(listener: SubtitleStyleListener): void
  offSubtitlesStyle(listener: SubtitleStyleListener): void
  getAudioSources(): Promise<AudioSourceInfo[]>
  listAudioDevices(): Promise<unknown>
  startAudioCapture(deviceIndex: number, sampleRate?: number): Promise<boolean>
  stopAudioCapture(): Promise<boolean>
  getAudioData(): Promise<unknown>
  getOSNetworkInterfaces(): Promise<Partial<Record<string, NetworkInterfaceInfo[]>>>
  openExternal(target: ExternalTarget): Promise<void>
  getLocalApiToken(): Promise<string | null>
  getGatewayToken(): Promise<string | null>
  invalidateGatewayToken(): Promise<void>
  openMonitor(provider: MonitorProvider): Promise<void>
  openExternalLogin(provider: MonitorProvider): Promise<void>
}

declare global {
  interface Window {
    desktop: DesktopAPI
  }
}

export type { DesktopAPI }
