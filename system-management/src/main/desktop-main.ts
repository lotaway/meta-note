import { app, BrowserWindow, ipcMain } from "electron"
import * as remote from "@electron/remote/main"
import path from "node:path"
import fs from "node:fs"
import { WebSocketServer } from 'ws'
// import childProcess from "child_process"
import ffmpeg from "fluent-ffmpeg"
import chatGPTMonitor from "./desktop-chatgpt"
ffmpeg.setFfmpegPath(__dirname)

const isDev = process.env.NODE_ENV === "development"
const isLinux = process.platform === "linux"
const isWin = process.platform === "win32"
const isMac = process.platform === "darwin"
let mainWindow: InstanceType<typeof BrowserWindow> | null = null

async function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        resizable: true,
        webPreferences: {
            devTools: isDev,
            nodeIntegration: true,
            contextIsolation: false,
            preload: path.join(__dirname, "./preload.js")
        }
    })
    remote.initialize()
    remote.enable(mainWindow.webContents)
    // isDev && mainWindow.webContents.openDevTools()
    if (isDev) {
        await mainWindow.loadURL("http://localhost:30002")
    } else {
        await mainWindow.loadFile("dist/index.html")
    }
}

const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
    app.quit()
} else {
    app.on('second-instance', (event, argv) => {
        console.log('Re-launched args:', argv)
    })
}
app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0 || mainWindow === null) {
        void createWindow().catch(err => {
            console.log("重新创建窗口失败" + JSON.stringify(err))
        })
    }
})
// myapp://do/task?id=123
app.on('open-url', (event, url) => {
  event.preventDefault()
  console.log('Received URL:', url)
})
const args = process.argv
console.log('Args:', args)
// E.X. ["electron", ".", "myapp://do/task?id=123"]
const wss = new WebSocketServer({ port: 5050 })
console.log('WebSocketServer started on port 5050')
wss.on('connection', ws => {
  ws.on('message', (data: object) => {
    console.log('From extension:', data.toString())
  })
  ws.send('Hello from meta-note!')
})

app.on("window-all-closed", () => {
    !isMac && app.quit()
})

void app.whenReady().then(() => {
    function init() {
        app.setAsDefaultProtocolClient("meta-note")
        void createWindow().catch(err => {
            console.log("创建窗口失败：" + JSON.stringify(err))
        })
        chatGPTMonitor.setupChatGPTMonitor()
    }

    // 延迟解决莫名其妙的ready未完成问题：https://github.com/electron/electron/issues/16809
    isLinux ? setTimeout(init, 300) : init()
})

class Handler {
    static readFileInDirectory(directory: string) {
        const names = getIncludeFiles(directory)
        const paths = filename2path(names, directory)
        return {
            names,
            paths
        }
    }
}

function getIncludeFiles(path: string) {
    const dirents = fs.readdirSync(path, {
        withFileTypes: true
    }) as any[]
    if (dirents.length === 0) return []
    return dirents.filter(item => item.isFile()).map(item => item.name)
}

function filename2path(filenames: string[], prevFix: string): string[] {
    return filenames.map(filename => path.join(prevFix, filename))
}

async function mergeVideo(filePaths: string[], outputPath: string): Promise<any> {
    // const ffmpegPath = path.join(__dirname, "../lib/ffmpeg.exe")
    // childProcess.exec(`-f concat -safe 0 -i %s -c copy %s "${outputPath}/file.txt" "${outputPath}/output.mkv"`)
    const ffmpegProcess = ffmpeg()
    filePaths.forEach(videoPath => {
        ffmpegProcess.addInput(videoPath)
    })
    ffmpegProcess.mergeToFile(`${outputPath}/generate.mp4`, outputPath)
    ffmpegProcess.on('progress', (progress: any) => {
        console.log("Merging... : " + progress.percent + "%")
    })
    return await new Promise((resolve, reject) => {
        ffmpegProcess.on('end', (stdout: string | null, stderr: string | null) => {
            console.info('Merging finished !')
            resolve({
                statusMsg: 'Merging finished !',
                outputPath
            })
        })
        ffmpegProcess.on('error', (error: Error, stdout: string | null, stderr: string | null) => {
            console.error('An error occurred: ' + error.message)
            console.log("ffmpeg stdout:\n" + stdout)
            console.log("ffmpeg stderr:\n" + stderr)
            reject({
                error,
                stdout,
                stderr
            })
        })
    })
}

ipcMain.handle("readFileInDirectory", (event, filePath: string) => Handler.readFileInDirectory(filePath))
ipcMain.handle("mergeVideo", async (event, videos: string[], outputPath: string) => await mergeVideo(videos, outputPath))
export {}
