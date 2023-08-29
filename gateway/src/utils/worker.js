import cluster from "node:cluster";

if (cluster.isWorker) {
    process.on("message", message => {
        console.log("Worker收到信息了：" + message);
        process.send("我收到啦！！！");
    });
}

//  也可以创建另外的监听端口，方便外界通过多个网址端口直接调用
// const http = require("node:http");
// http.createServer((req, res) => {
//     res.end("worker success");
// }).listen();
