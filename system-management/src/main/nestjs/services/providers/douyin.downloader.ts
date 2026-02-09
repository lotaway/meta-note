import { Injectable } from '@nestjs/common';
import youtubedl from 'youtube-dl-exec';
import path from 'node:path';
import fs from 'fs-extra';
import { Downloader, AudioDownloadResult } from './downloader.interface';

@Injectable()
export class DouyinDownloader implements Downloader {
    supports(url: string): boolean {
        return url.includes('douyin.com') || url.includes('v.double.com');
    }

    private getHeaders(): any {
        return {
            'referer': 'https://www.douyin.com/',
            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        };
    }

    async downloadAudio(url: string, outputDir: string): Promise<AudioDownloadResult> {
        await fs.ensureDir(outputDir);
        const outputPath = path.join(outputDir, '%(id)s.%(ext)s');

        const info = await youtubedl(url, {
            extractAudio: true,
            audioFormat: 'mp3',
            output: outputPath,
            noCheckCertificates: true,
            noWarnings: true,
            addHeader: Object.entries(this.getHeaders()).map(([k, v]) => `${k}:${v}`),
            dumpSingleJson: true,
        }) as any;

        const audioPath = path.join(outputDir, `${info.id}.mp3`);
        return {
            filePath: audioPath,
            title: info.title,
            duration: info.duration,
            platform: 'douyin',
            videoId: info.id
        };
    }

    async getSubtitles(url: string, outputDir: string): Promise<string | null> {
        // Douyin often doesn't have standard yt-dlp subtitles
        return null;
    }

    async downloadVideo(url: string, outputDir: string): Promise<string> {
        await fs.ensureDir(outputDir);
        const outputPath = path.join(outputDir, 'video.%(ext)s');

        await youtubedl(url, {
            format: 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
            output: outputPath,
            noCheckCertificates: true,
            noWarnings: true,
            addHeader: Object.entries(this.getHeaders()).map(([k, v]) => `${k}:${v}`),
        });

        const files = await fs.readdir(outputDir);
        const videoFile = files.find(f => f.startsWith('video.') && !f.includes('subtitles'));
        if (!videoFile) throw new Error('Douyin video download failed');
        return path.join(outputDir, videoFile);
    }
}
