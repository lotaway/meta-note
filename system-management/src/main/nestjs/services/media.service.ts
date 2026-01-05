import { Injectable } from '@nestjs/common'
import fs from 'node:fs'
import path from 'node:path'
import ffmpeg from 'fluent-ffmpeg'

@Injectable()
export class MediaService {
    getIncludeFiles(dirPath: string) {
        const dirents = fs.readdirSync(dirPath, {
            withFileTypes: true
        })
        if (dirents.length === 0) return []
        return dirents.filter(item => item.isFile()).map(item => item.name)
    }

    filename2path(filenames: string[], prevFix: string): string[] {
        return filenames.map(filename => path.join(prevFix, filename))
    }

    readFileInDirectory(directory: string) {
        const names = this.getIncludeFiles(directory)
        const paths = this.filename2path(names, directory)
        return {
            names,
            paths
        }
    }

    async mergeVideo(filePaths: string[], outputPath: string): Promise<any> {
        const ffmpegProcess = ffmpeg()
        filePaths.forEach(videoPath => {
            ffmpegProcess.addInput(videoPath)
        })
        ffmpegProcess.mergeToFile(path.join(outputPath, 'generate.mp4'), outputPath)
        ffmpegProcess.on('progress', (progress: any) => {
            console.log("Merging... : " + progress.percent + "%")
        })
        return await new Promise((resolve, reject) => {
            ffmpegProcess.on('end', () => {
                console.info('Merging finished !')
                resolve({
                    statusMsg: 'Merging finished !',
                    outputPath
                })
            })
            ffmpegProcess.on('error', (error: Error, stdout: string | null, stderr: string | null) => {
                console.error('An error occurred: ' + error.message)
                reject({
                    error,
                    stdout,
                    stderr
                })
            })
        })
    }
}
