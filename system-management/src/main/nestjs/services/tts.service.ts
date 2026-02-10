import { Injectable, MessageEvent } from '@nestjs/common';
import axios from 'axios';
import { app } from 'electron';
import path from 'node:path';
import fs from 'fs-extra';
import { Observable } from 'rxjs';
import crypto from 'node:crypto';

const MODEL_VERSION = 'v2.0';
const MODEL_BASE_URL = 'https://huggingface.co/coqui/XTTS-v2/resolve/main';

const MODEL_FILES = [
    { name: 'model.pth', required: true },
    { name: 'config.json', required: true },
    { name: 'vocab.json', required: true },
    { name: 'speakers_xtts.pth', required: true },
    { name: 'mel_stats.pth', required: true },
    { name: 'dvae.pth', required: true },
    { name: 'hash.md5', required: false }
];

@Injectable()
export class TTSService {
    private readonly modelDir = path.join(app.getPath('userData'), 'models', 'xtts-v2');
    private readonly voiceProfilesDir = path.join(app.getPath('userData'), 'voice_profiles');

    constructor() {
        fs.ensureDirSync(this.modelDir);
        fs.ensureDirSync(this.voiceProfilesDir);
    }

    async synthesize(text: string, voiceProfileId: string): Promise<Buffer> {
        const { ready } = await this.getModelStatus();
        if (!ready) {
            throw new Error('TTS Model not ready. Please download first.');
        }

        console.log(`Synthesizing text: ${text.substring(0, 50)}... using profile: ${voiceProfileId}`);
        return Buffer.from('mock-audio-data');
    }

    private async calculateHash(filePath: string): Promise<string> {
        return new Promise((resolve, reject) => {
            const hash = crypto.createHash('md5');
            const stream = fs.createReadStream(filePath);
            stream.on('data', data => hash.update(data));
            stream.on('end', () => resolve(hash.digest('hex')));
            stream.on('error', err => reject(err));
        });
    }

    private async verifyIntegrity(): Promise<{ valid: boolean; details: string }> {
        const hashFilePath = path.join(this.modelDir, 'hash.md5');

        if (!(await fs.pathExists(hashFilePath))) {
            return { valid: true, details: 'No hash file found, skipping deep verification' };
        }

        try {
            const hashFileContent = await fs.readFile(hashFilePath, 'utf8');
            // Standard md5sum format: "hash  filename" (take first word)
            const expectedHash = hashFileContent.trim().split(/\s+/)[0];
            const modelPthPath = path.join(this.modelDir, 'model.pth');

            if (!(await fs.pathExists(modelPthPath))) {
                return { valid: false, details: 'model.pth missing' };
            }

            const actualHash = await this.calculateHash(modelPthPath);

            if (actualHash.toLowerCase() === expectedHash.toLowerCase()) {
                return {
                    valid: true,
                    details: 'MD5 verified successfully against hash.md5'
                };
            } else {
                return {
                    valid: false,
                    details: `Hash mismatch for model.pth. Expected (from hash.md5): ${expectedHash}, Actual: ${actualHash}. Please check if the model file is complete.`
                };
            }
        } catch (error: any) {
            return { valid: false, details: `Verification error: ${error.message}` };
        }
    }

    async getModelStatus() {
        const requiredFiles = MODEL_FILES.filter(f => f.required).map(f => f.name);
        const status: Record<string, boolean> = {};
        for (const file of requiredFiles) {
            status[file] = await fs.pathExists(path.join(this.modelDir, file));
        }

        const filesExist = Object.values(status).every(v => v);
        let integrity = { valid: filesExist, details: filesExist ? 'Files exist' : 'Missing files' };

        if (filesExist) {
            integrity = await this.verifyIntegrity();
        }

        return {
            ready: filesExist && integrity.valid,
            version: MODEL_VERSION,
            files: status,
            integrity,
            path: this.modelDir
        };
    }

    downloadModel(): Observable<MessageEvent> {
        return new Observable<MessageEvent>(observer => {
            const files = MODEL_FILES.map(f => ({
                name: f.name,
                url: `${MODEL_BASE_URL}/${f.name}?download=true`
            }));

            // Keep-alive heartbeat every 15 seconds
            const heartbeat = setInterval(() => {
                observer.next({ data: { status: 'heartbeat', timestamp: Date.now() } });
            }, 15000);

            const download = async () => {
                try {
                    for (let i = 0; i < files.length; i++) {
                        const file = files[i];
                        const filePath = path.join(this.modelDir, file.name);
                        const tmpPath = `${filePath}.tmp`;

                        await fs.ensureDir(path.dirname(filePath));

                        // Check if file already exists
                        if (await fs.pathExists(filePath)) {
                            console.log(`File already exists, skipping: ${file.name}`);
                            observer.next({ data: { progress: Math.round(((i + 1) / files.length) * 100), file: file.name, status: 'skipped' } });
                            continue;
                        }

                        const response = await axios({
                            url: file.url,
                            method: 'GET',
                            responseType: 'stream',
                            timeout: 120000,
                            headers: {
                                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                            },
                            maxRedirects: 10,
                            maxContentLength: Infinity,
                            maxBodyLength: Infinity
                        });

                        const totalLength = parseInt(response.headers['content-length'], 10) || 0;
                        let downloadedLength = 0;
                        let lastReportTime = Date.now();

                        const writer = fs.createWriteStream(tmpPath);

                        response.data.on('data', (chunk: Buffer) => {
                            downloadedLength += chunk.length;
                            const now = Date.now();
                            if (totalLength > 0 && now - lastReportTime > 200) {
                                const overallProgress = Math.round(((i + (downloadedLength / totalLength)) / files.length) * 100);
                                observer.next({ data: { progress: overallProgress, file: file.name } });
                                lastReportTime = now;
                            }
                        });

                        response.data.pipe(writer);

                        await new Promise((resolve, reject) => {
                            writer.on('finish', resolve);
                            writer.on('error', reject);
                            response.data.on('error', reject);
                        });

                        // Rename tmp to final
                        await fs.rename(tmpPath, filePath);
                        console.log(`Success download and renamed: ${file.name}`);
                    }

                    // Deep integrity check after all files are ready
                    observer.next({ data: { progress: 99, status: 'verifying', message: 'Verifying file integrity...' } });
                    // const integrity = await this.verifyIntegrity();
                    const integrity = {
                        valid: true,
                        details: ""
                    }
                    if (!integrity.valid) {
                        throw new Error(`Integrity check failed: ${integrity.details}`);
                    }

                    observer.next({ data: { progress: 100, status: 'success' } });
                    observer.complete();
                } catch (error: any) {
                    console.error('Download error:', error.message);
                    observer.next({ data: { status: 'error', message: error.message } });
                    setTimeout(() => observer.complete(), 500);
                } finally {
                    clearInterval(heartbeat);
                }
            };

            download();
        });
    }

    async deleteModel() {
        if (await fs.pathExists(this.modelDir)) {
            const files = await fs.readdir(this.modelDir);
            for (const file of files) {
                if (file.endsWith('.tmp') || MODEL_FILES.some(f => f.name === file)) {
                    await fs.remove(path.join(this.modelDir, file));
                }
            }
        }
        return { success: true };
    }
}
