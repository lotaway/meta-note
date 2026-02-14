// @ts-ignore
import { startCaptureService } from '../../system-support/index';

export function initializeMediaCapture() {
    const result = startCaptureService({
        sourceType: 'desktop',
        width: 1920,
        height: 1080,
        fps: 60
    });
    console.log(result);
}
