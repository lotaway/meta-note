import path from 'path';

import type * as NativeTypes from '../../native/index';

// Native interface
type NativeModule = typeof NativeTypes;

// Dynamically require the native module
// In development, it points to the local build
// In production, it might need adjustment based on where the file is unpacked
let native: NativeModule;

try {
    // Try to require from the native directory
    // This path is relative to the bundled main process file (dist-electron/main/desktop-main.js)
    // resolving to project-root/native/index.node
    native = require('../../native/index.node');
} catch (error) {
    console.error('Failed to load native module:', error);
    // Fallback or mock if needed
    native = {
        startCaptureService: () => "Native module not loaded",
        stopCaptureService: () => false,
        init: () => console.log("Native module not loaded - init skipped")
    }
}

export function initializeMediaCapture() {
    if (!native) return;
    try {
        const result = native.startCaptureService({
            sourceType: 'desktop',
            width: 1920,
            height: 1080,
            fps: 60
        });
        console.log("Capture service started:", result);
    } catch (e) {
        console.error("Error starting capture service:", e);
    }
}

export function initializeSupport() {
    if (!native) return;
    try {
        native.init();
    } catch (e) {
        console.error("Error initializing support:", e);
    }
}
