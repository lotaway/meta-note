import http from "node:http";
import cluster, {Worker} from "node:cluster";
import * as path from "node:path";
import setting from "../config/settings";

interface CurrentProcess {
    worker: Worker
}

const currentProcess: CurrentProcess[] = [];

function logger(...args: any[]) {
    console.log(JSON.stringify(args));
}

function createWorker(): Worker {
    return cluster.fork("./worker.js");
}

function startWorker() {
    if (cluster.isMaster) {
        const maxProcess = setting.PROCESS_MAX_COUNT;
        for (let i = currentProcess.length; i < maxProcess; i++)
            currentProcess.push({
                worker: createWorker()
            });
        currentProcess.forEach((item, index) => {
            item.worker.on("disconnect", () => {
                logger(item.worker.id + "子进程连接意外中断，即将重启");
                currentProcess.splice(index, 1);
                currentProcess.push({
                    worker: createWorker()
                });
            });
        });
        cluster.on("exit", () => {
            console.log("cluster exit");
        });
    }
}

function startChild() {
    const child_process = require("child_process")
//  通过指定一个要运行的脚本来开启进程
    const childProcess = child_process.fork(path.join(__dirname, "./child.js"));
    childProcess.send("你好啊，我的子进程！");
    childProcess.on("message", message => {
        console.log("主进程收到信息:" + message);
    });
    process.on("message", message => {
        console.log("主进程收到信息了：" + message);
    });
}

startWorker();

process.on("uncaughtException", err => {
    // process.cwd()
    logger("uncaught exception error: ", err);
});
