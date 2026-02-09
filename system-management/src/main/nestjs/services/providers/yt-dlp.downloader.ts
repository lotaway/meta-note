import { Injectable } from '@nestjs/common';
import youtubedl from 'youtube-dl-exec';
import path from 'node:path';
import fs from 'fs-extra';

@Injectable()
export class YtDlpDownloader {
    async downloadAudio(url: string, outputDir: string): Promise<string> {
        await fs.ensureDir(outputDir);
        const outputPath = path.join(outputDir, '%(title)s.%(ext)s');

        await youtubedl(url, {
            extractAudio: true,
            audioFormat: 'mp3',
            output: outputPath,
            noCheckCertificates: true,
            noWarnings: true,
            preferFreeFormats: true,
            addHeader: [
                'referer:https://www.bilibili.com/',
                'user-agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            ]
        });

        const files = await fs.readdir(outputDir);
        const audioFile = files.find((f: string) => f.endsWith('.mp3'));
        if (!audioFile) {
            throw new Error('Audio download failed: File not found');
        }
        return path.join(outputDir, audioFile);
    }

    async getSubtitles(url: string, outputDir: string): Promise<string | null> {
        await fs.ensureDir(outputDir);
        const outputPath = path.join(outputDir, 'subtitles');

        try {
            await youtubedl(url, {
                writeSub: true,
                writeAutoSub: true,
                subLang: 'zh-Hans,zh,en',
                skipDownload: true,
                output: outputPath,
            });

            const files = await fs.readdir(outputDir);
            const subFile = files.find((f: string) => f.includes('subtitles') && (f.endsWith('.vtt') || f.endsWith('.srt') || f.endsWith('.json')));

            if (subFile) {
                return await fs.readFile(path.join(outputDir, subFile), 'utf-8');
            }
        } catch (error) {
            console.error('Failed to download subtitles:', error);
        }
        return null;
    }
}
