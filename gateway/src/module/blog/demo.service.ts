import * as path from "path";
import * as fs from "fs";
import * as nest from "@nestjs/common";
import {prismaClientProvider} from "../../utils/connect-prisma";
import {redisClientProvider} from "../../utils/connect-redis";
import settings from "../../config/settings";

@nest.Injectable()
export class DemoService {

    private readonly prismaClient = prismaClientProvider()
    private readonly redisClient = redisClientProvider()

    async getAllUsers() {
        const allUsers = await this.prismaClient.user.findMany()
        console.log(allUsers)
        return allUsers
    }

    async getFileByName(fileName: string) {
        //  todo 抓取多个网站新闻内容并显示在这里，缓存相应的数据，之后应当使用mysql规则存储每日抓取的数据
        try {
            const keyName = `file:${fileName}`
            const redisFile = await this.redisClient.get(keyName)
            if (redisFile) return redisFile
            const readStream = fs.createReadStream(path.join(settings.PROJECT_DIR, "assets/files", fileName))
            const fileData = await new Promise((resolve, reject) => {
                let fileChunkArr = []
                readStream
                    .on("error", err => {
                        console.log("read file error: " + JSON.stringify(err))
                        reject(err)
                    })
                    .on("data", chunk => {
                        fileChunkArr.push(chunk)
                        const fileBuffer = fileChunkArr.join("")
                        this.redisClient.set(keyName, fileBuffer.toString(), {
                            EX: 60
                        })
                    })
                    .on("end", () => {
                        resolve(fileChunkArr.join(""))
                    })
            })
            if (!fileData) return "file no content"
            return fileData
        } catch (err) {
            return "demo file error: " + JSON.stringify(err)
        }
    }

}
