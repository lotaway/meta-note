import * as NativeTypes from '../../native/index'

let native: typeof NativeTypes | null = null

try {
    native = require('../../native/index.node')
} catch (error) {
    console.error('[NativeBridge] CRITICAL: Failed to load native module. All native features (camera, audio capture, system monitor) are UNAVAILABLE:', error)
    native = null
}

export function initializeSupport() {
    if (!native) return
    try {
        native.init()
    } catch (e) {
        console.error("Error initializing native support:", e)
    }
}

export function getSystemMonitor() {
    if (!native) return null
    return {
        getSystemInfo: () => native!.getSystemInfo(),
        getCpuInfo: () => native!.getCpuInfo(),
        getMemoryInfo: () => native!.getMemoryInfo(),
        getNetworkInfo: () => native!.getNetworkInfo(),
        getDiskInfo: () => native!.getDiskInfo(),
        getProcessList: () => native!.getProcessList(),
    }
}

export function getCameraManager() {
    if (!native) return null
    return {
        listCameras: () => native!.listCameras(),
        startCamera: (index: number, width: number, height: number, fps: number) =>
            native!.startCamera(index, width, height, fps),
        stopCamera: () => native!.stopCamera(),
        getLatestFrame: () => native!.getLatestFrame(),
    }
}

export function getAudioManager() {
    if (!native) return null
    return {
        listAudioDevices: () => native!.listAudioDevices(),
        startAudioCapture: (deviceIndex: number, sampleRate: number = 0) =>
            native!.startAudioCapture(deviceIndex, sampleRate),
        stopAudioCapture: () => native!.stopAudioCapture(),
        getAudioData: () => native!.getAudioData(),
    }
}

export function getTTSManager() {
    if (!native) return null
    return {
        listVoices: () => native!.listTtsVoices(),
        synthesize: (text: string, voice: string, outputPath: string) =>
            native!.synthesizeSpeech(text, voice, outputPath),
    }
}

export default native
