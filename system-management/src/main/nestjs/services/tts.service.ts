import { Injectable, MessageEvent } from '@nestjs/common';
import axios from 'axios';
import { app } from 'electron';
import path from 'node:path';
import fs from 'fs-extra';
import { Observable, Observer } from 'rxjs';
import crypto from 'node:crypto';
import { TTS_CONSTANTS, TTS_MODEL_FILES } from '../../constants';

interface ModelIntegrity {
    isValid: boolean;
    details: string;
}

interface ModelStatus {
    ready: boolean;
    version: string;
    files: Record<string, boolean>;
    integrity: ModelIntegrity;
    path: string;
}

@Injectable()
export class TTSService {
    private readonly modelDir = path.join(app.getPath('userData'), 'models', 'xtts-v2');
    private readonly voiceProfilesDir = path.join(app.getPath('userData'), 'voice_profiles');

    constructor() {
        fs.ensureDirSync(this.modelDir);
        fs.ensureDirSync(this.voiceProfilesDir);
    }

    async synthesize(text: string, voiceProfileId: string): Promise<Buffer> {
        const status = await this.getModelStatus();
        if (!status.ready) {
            throw new Error('TTS Model not ready');
        }
        return Buffer.from('mock-audio-data');
    }

    private async calculateHash(filePath: string): Promise<string> {
        return new Promise((resolve, reject) => {
            const hash = crypto.createHash('md5');
            const stream = fs.createReadStream(filePath);
            stream.on('data', data => hash.update(data));
            stream.on('end', () => resolve(hash.digest('hex').toLowerCase()));
            stream.on('error', err => reject(err));
        });
    }

    private async verifyIntegrity(): Promise<ModelIntegrity> {
        const hashFilePath = path.join(this.modelDir, 'hash.md5');
        const modelPthPath = path.join(this.modelDir, 'model.pth');

        if (!(await fs.pathExists(hashFilePath))) {
            return { isValid: true, details: 'Verified (existence only)' };
        }

        try {
            const hashFileContent = await fs.readFile(hashFilePath, 'utf8');
            const expectedHash = hashFileContent.trim().split(/\s+/)[0].toLowerCase();

            if (!(await fs.pathExists(modelPthPath))) {
                return { isValid: false, details: 'model.pth missing' };
            }

            const actualHash = await this.calculateHash(modelPthPath);
            const isValid = actualHash === expectedHash;

            return {
                isValid,
                details: isValid ? 'MD5 verified' : `Hash mismatch. Expected: ${expectedHash}, Actual: ${actualHash}`
            };
        } catch (error: any) {
            return { isValid: false, details: error.message };
        }
    }

    async getModelStatus(): Promise<ModelStatus> {
        const requiredFiles = TTS_MODEL_FILES.filter(f => f.required).map(f => f.name);
        const filePresence: Record<string, boolean> = {};

        for (const name of requiredFiles) {
            filePresence[name] = await fs.pathExists(path.join(this.modelDir, name));
        }

        const allFilesExist = Object.values(filePresence).every(v => v);
        const integrity = allFilesExist
            ? await this.verifyIntegrity()
            : { isValid: false, details: 'Files missing' };

        return {
            ready: allFilesExist,
            version: TTS_CONSTANTS.MODEL_VERSION,
            files: filePresence,
            integrity,
            path: this.modelDir
        };
    }

    downloadModel(): Observable<MessageEvent> {
        return new Observable<MessageEvent>(observer => {
            const heartbeat = setInterval(() => {
                observer.next({ data: { status: 'heartbeat', timestamp: Date.now() } });
            }, 15000);

            this.runDownload(observer)
                .finally(() => {
                    clearInterval(heartbeat);
                });
        });
    }

    private async runDownload(observer: Observer<MessageEvent>) {
        try {
            for (let i = 0; i < TTS_MODEL_FILES.length; i++) {
                await this.downloadStep(TTS_MODEL_FILES[i].name, i, observer);
            }

            observer.next({ data: { progress: 100, status: 'success' } });
            observer.complete();
        } catch (error: any) {
            observer.next({ data: { status: 'error', message: error.message } });
            setTimeout(() => observer.complete(), 500);
        }
    }

    private async downloadStep(name: string, index: number, observer: Observer<MessageEvent>) {
        const filePath = path.join(this.modelDir, name);
        const tmpPath = `${filePath}.tmp`;

        if (await fs.pathExists(filePath)) {
            const progress = Math.round(((index + 1) / TTS_MODEL_FILES.length) * 100);
            observer.next({ data: { progress, file: name, status: 'skipped' } });
            return;
        }

        await fs.ensureDir(path.dirname(filePath));
        await this.streamToFile(`${TTS_CONSTANTS.MODEL_BASE_URL}/${name}?download=true`, tmpPath, (downloaded, total) => {
            const progress = Math.round(((index + (downloaded / total)) / TTS_MODEL_FILES.length) * 100);
            observer.next({ data: { progress, file: name } });
        });

        await fs.rename(tmpPath, filePath);
    }

    private async streamToFile(url: string, dest: string, onProgress: (d: number, t: number) => void): Promise<void> {
        const response = await axios({
            url,
            method: 'GET',
            responseType: 'stream',
            timeout: 120000,
            headers: { 'User-Agent': 'Mozilla/5.0' },
            maxRedirects: 10
        });

        const total = parseInt(response.headers['content-length'], 10) || 0;
        let downloaded = 0;
        let lastReport = Date.now();

        const writer = fs.createWriteStream(dest);
        response.data.on('data', (chunk: Buffer) => {
            downloaded += chunk.length;
            const now = Date.now();
            if (total > 0 && now - lastReport > 200) {
                onProgress(downloaded, total);
                lastReport = now;
            }
        });

        response.data.pipe(writer);

        return new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
            response.data.on('error', reject);
        });
    }

    async deleteModel() {
        if (!(await fs.pathExists(this.modelDir))) {
            return { success: true };
        }

        const files = await fs.readdir(this.modelDir);
        for (const file of files) {
            if (this.isModelFile(file)) {
                await fs.remove(path.join(this.modelDir, file));
            }
        }
        return { success: true };
    }

    private isModelFile(name: string): boolean {
        return name.endsWith('.tmp') || TTS_MODEL_FILES.some(f => f.name === name);
    }
}
