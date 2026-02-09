import { Injectable } from '@nestjs/common';
import { Downloader, AudioDownloadResult } from './downloader.interface';
import { BilibiliDownloader } from './bilibili.downloader';
import { YoutubeDownloader } from './youtube.downloader';
import { DouyinDownloader } from './douyin.downloader';
import { KuaishouDownloader } from './kuaishou.downloader';

@Injectable()
export class UniversalDownloader implements Downloader {
    private downloaders: Downloader[];

    constructor(
        private readonly bilibili: BilibiliDownloader,
        private readonly youtube: YoutubeDownloader,
        private readonly douyin: DouyinDownloader,
        private readonly kuaishou: KuaishouDownloader,
    ) {
        this.downloaders = [this.bilibili, this.youtube, this.douyin, this.kuaishou];
    }

    supports(url: string): boolean {
        return this.downloaders.some(d => d.supports(url));
    }

    private getDownloader(url: string): Downloader {
        const downloader = this.downloaders.find(d => d.supports(url));
        if (!downloader) {
            throw new Error(`Unsupported platform for URL: ${url}`);
        }
        return downloader;
    }

    async downloadAudio(url: string, outputDir: string): Promise<AudioDownloadResult> {
        return this.getDownloader(url).downloadAudio(url, outputDir);
    }

    async downloadVideo(url: string, outputDir: string): Promise<string> {
        return this.getDownloader(url).downloadVideo(url, outputDir);
    }

    async getSubtitles(url: string, outputDir: string): Promise<string | null> {
        return this.getDownloader(url).getSubtitles(url, outputDir);
    }
}
