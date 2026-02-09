export interface AudioDownloadResult {
    filePath: string;
    title: string;
    duration: number;
    platform: string;
    videoId: string;
}

export interface Downloader {
    downloadAudio(url: string, outputDir: string): Promise<AudioDownloadResult>;
    downloadVideo(url: string, outputDir: string): Promise<string>;
    getSubtitles(url: string, outputDir: string): Promise<string | null>;
    supports(url: string): boolean;
}

export const DOWNLOADER_INTERFACE = Symbol('DOWNLOADER_INTERFACE');
