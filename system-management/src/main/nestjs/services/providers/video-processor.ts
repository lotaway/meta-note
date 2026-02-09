import { Injectable } from '@nestjs/common';
import ffmpeg from 'fluent-ffmpeg';
import path from 'node:path';
import fs from 'fs-extra';

@Injectable()
export class VideoProcessor {
    /**
     * 在指定时间点截取一帧
     */
    async captureScreenshot(videoPath: string, timestamp: number, outputPath: string): Promise<string> {
        return new Promise((resolve, reject) => {
            ffmpeg(videoPath)
                .screenshots({
                    timestamps: [timestamp],
                    folder: path.dirname(outputPath),
                    filename: path.basename(outputPath),
                    size: '1280x720'
                })
                .on('end', () => resolve(outputPath))
                .on('error', (err) => reject(err));
        });
    }

    /**
     * 生成视频理解所需的网格图 (Video Understanding Mode)
     * 按照 BiliNoteDetail.md 原理：每隔 interval 秒截取一帧，拼成 gridConfig[0] * gridConfig[1] 的网格
     */
    async generateGridImage(
        videoPath: string,
        outputDir: string,
        interval: number = 10,
        gridConfig: [number, number] = [3, 3]
    ): Promise<string[]> {
        await fs.ensureDir(outputDir);
        const duration = await this.getVideoDuration(videoPath);
        const gridImages: string[] = [];

        const frameCount = Math.floor(duration / interval);
        const groupSize = gridConfig[0] * gridConfig[1];

        // 只有满足完整网格的才处理，丢弃不足的组 (对齐 BiliNoteDetail.md)
        for (let i = 0; i < Math.floor(frameCount / groupSize); i++) {
            const tempFrames: string[] = [];
            for (let j = 0; j < groupSize; j++) {
                const ts = (i * groupSize + j) * interval;
                const framePath = path.join(outputDir, `frame_${i}_${j}.jpg`);
                await this.captureScreenshot(videoPath, ts, framePath);
                tempFrames.push(framePath);
            }

            const gridPath = path.join(outputDir, `grid_${i}.jpg`);
            await this.combineToGrid(tempFrames, gridPath, gridConfig);
            gridImages.push(gridPath);

            // 清理临时单帧
            for (const f of tempFrames) await fs.remove(f);
        }

        return gridImages;
    }

    private async getVideoDuration(videoPath: string): Promise<number> {
        return new Promise((resolve, reject) => {
            ffmpeg.ffprobe(videoPath, (err, metadata) => {
                if (err) return reject(err);
                resolve(metadata.format.duration || 0);
            });
        });
    }

    /**
     * 将多张图拼成网格
     * 注意：由于 JS 库限制，这里使用 ffmpeg filter complex 实现拼接
     */
    private async combineToGrid(images: string[], outputPath: string, grid: [number, number]): Promise<void> {
        const cols = grid[0];
        const rows = grid[1];

        return new Promise((resolve, reject) => {
            let command = ffmpeg();
            images.forEach(img => command = command.input(img));

            command
                .complexFilter([
                    `xstack=inputs=${images.length}:layout=${this.generateStackLayout(cols, rows)}`
                ])
                .on('end', () => resolve())
                .on('error', (err) => reject(err))
                .save(outputPath);
        });
    }

    private generateStackLayout(cols: number, rows: number): string {
        let layout = "";
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const x = c === 0 ? "0" : Array.from({ length: c }, (_, i) => `w${i}`).join("+");
                const y = r === 0 ? "0" : Array.from({ length: r }, (_, i) => `h${i * cols}`).join("+");
                layout += `${x}_${y}|`;
            }
        }
        return layout.slice(0, -1);
    }
}
