# 进程、线程、协程

* 进程：计算机分配的最小资源单位，一般一个程序启动后就有一个进程，包含了计算机分配给它的一片独立的内存空间，而CPU会在时间叶片中分配给进程一段执行时间，时间到了就会进行切换，由于这种进程切换非常快，让进程显示出并发性。而多核让并行成为可能。
* 线程：CPU分配的任务最小任务单位，一般一个进程会至少附带一个线程，程序可以通过开启多个线程来并发执行不同的子任务。线程就相当于更小粒度的进程，线程的资源依旧来源于进程本身，栈帧独立。
* 协程：开关线程会有一定消耗，因此频繁开关或者大量创建线程就会有严重性能问题，这对于原本想通过多线程提速的程序显得弄巧成拙。协程就是更进一步通过定义挂起阻塞的操作，把实际线程开关交给程序处理（也可手动指定），保证独立有栈的前提下让这种并发执行任务的过程变得顺畅，相当于一种更小粒度的虚拟线程。

## 事件轮询机制与多线程

[Javascript事件轮询机制与多线程解析](https://juejin.cn/post/6844904047271477255)
[Nodejs事件轮询机制解析与多线程解析](https://www.cnblogs.com/freephp/p/14640156.html)

## child_process

子进程模块是为了弥补js本身只支持单线程的问题，最常见的用途是用子进程调用命令行完成相关操作。

### 调用命令行

通过child_process.exec方法可在当前环境的命令行下执行命令。
例如查看文件一般使用`fs`模块，但我们也可以在命令行调用`dir`或`ls`命令完成，示例：

```javascript
const {exec} = require("child_process")
const childProcess = exec("dir", {
    cmd: "./log"  //  在上一级路径执行命令
}, (err, stdout, stderr) => {
    //  执行命令出错
    if (err) throw err
    //  执行命令后的获取到的命令行输出
    console.log(`stdout: ${stdout}`)
    //  执行命令后的错误输出
    console.error(`stderr: ${stderr}`)
})
//  每次命令行有输出就会触发
childProcess.stdout.on("data", chunk => {
    console.log(chunk)
})
//  命令行输出结束
childProcess.stdout.on("end", () => {
    console.log("输出结束")
})
```

要注意通过on监听输出流事件能获取到命令行持续输出的内容，适合耗时长或者保持运行不会结束的命令，如压缩、调试等。
而exec中的callback回调只在命令结束后才会调用，适合快速或只需要拿到结果的命令。
还有，查看文件一般使用`fs`模块进行处理，这里只是做个简单示范。

### 创建子进程

在主进程中执行：

```javascript
const child_process = require("node:child_process");

function startChild() {
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

startChild();
```

在子进程child.js中开启监听：

```javascript
process.on("message", message => {
    console.log("子进程收到信息：" + message);
    process.send("我是子进程，我收到了！！");
});

```

# cluster

一般是通过cluster而非child_process来开启子进程：

```javascript
const cluster = require("node:cluster");
const worker = cluster.fork("worker.js");
worker.on("message", message => {

})
```

在子进程worker.js中开启监听：

```javascript
import cluster from "node:cluster";

if (cluster.isWorker) {
    process.on("message", message => {
        console.log("Worker收到信息了：" + message);
        process.send("我收到啦！！！");
    });
}
//  也可以创建另外的监听端口，方便外界通过多个网址端口直接调用
const http = require("node:http");
http.createServer((req, res) => {
    res.end("worker success");
}).listen();
```

## agent 代理

egg.js框架特有的，可以了解一下概念。

* 将主进程与子进程的业务性质代码剥离出来放到一个单独的子进程中
* 主进程只提供管理、转发子进程通讯，从而提升代码纯粹性，减少主进程阻塞和报错挂掉的可能性。
* 因CPU核数固定，代理占用了一个子进程，意味着原本的worker需要减少一个，如果同时有多个站点/多个主进程则进一步减半。
* 考虑到agent代理本身也容易挂掉和过于依赖主进程通讯，可以增加添加socket服务让agent和worker之间直接通讯并且降低挂掉的可能性
