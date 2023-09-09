@[TOC](Nodejs学习笔记 - 基础模块快速入门)

# 介绍

Nodejs相当于在特化的服务端环境下运行javascript。
失去了客户端特有的window、document等对象，换来了包括global对象和核心模块等各种服务端特化功能。
核心模块由一些Nodejs内置的库组成，为nodejs提供了众多功能，如：

* HTTP服务器
* 文件管理
* 进程管理
* 事件机制
* 常用工具

# 使用核心模块

虽然Nodejs提供了特化功能，但不同于js可以直接调用，Nodejs提供的功能都需要通过导入模块才能使用，可以理解为像java、.net导入包的概念一样。

```javascript
const http = require("http")
```

## 也可以用es6方式导入

```javascript
import http from "http"
```

以上方式将从node_modules文件夹里查找符合条件的第三方库（类似SDK概念），若找不到才会去查找Nodejs核心模块，若还是找不到将从当前文件相对位置查找符合要求的文件。

# 创建HTTP服务

可以当做创建一个持续运行的网站服务实例，用户可以通过访问网址（HTTP协议）访问到这个服务，而服务可以通过请求和响应进行交互。

## 显式创建

直接实例方式创建，一般不用

```javascript
const http = require("http")
const server = new http.Server()
server.on('request', (req, res) => {
    //  处理请求和响应，详见下一种写法
});
```

## 封装创建

通过生产器内部创建，纯nodejs的常用写法。

```javascript
const http = require("http")
const qs = require('querystring')
const server = http.createServer((req, res) => {
    let data = ''
    //  每次接收到数据就会触发，要注意数据并不是一次性传输完成的
    request.on('data', chunk => {
        data += chunk
    })
    //  数据传输完成后触发
    request.on('end', () => {
        data = qs.parse(data)
    })
    //  请求结束时，无论是数据传输完成还是强制中止都会触发
    request.on("close", () => {

    })
    response.writeHead(200, {'Content-Type': 'text/html'});
    response.write('<span class="response">This is the response content.</span>');
    response.end('<p class="end">It\'s end.</p>');   //结束发送
});
server.listen(3000)
console.log("HTTP服务正在3000端口监听请求")
```

以上创建的默认是http1.1协议，要使用http2.0的话需要用http2模块：

# 创建HTTP2服务

```javascript
const http2 = require("http2")
const fs = require('fs')
//  拿到本地秘钥和证书，关于fs文件模块后面再讲，这里知道是本地文件即可
var options = {
    key: fs.readFileSync('ssh_key.pem'),    //  密钥
    cert: fs.readFileSync('ssh_cert.pem')   //  证书
}
const server = http2.createServer(options)
server.listen(3000)
console.log("HTTP2服务正在3000端口监听请求")
```

可以看到HTTP2服务相比HTTP（1.1）需要提供相应的证书和秘钥，一般不会使用，而是直接使用HTTPS服务。

# 创建HTTPS服务

使用https模块创建安全的网络响应，需提供SSL证书和秘钥，这一般需要通过受信任的第三方机构生成。

```javascript
const https = require('https')
const fs = require('fs')
var options = {
    key: fs.readFileSync('ssh_key.pem'),    //  密钥
    cert: fs.readFileSync('ssh_cert.pem')   //  证书
}
https.createServer(options, (request, response) => {
    //  处理请求
})
```

## GET简易请求

GET请求可以用于获取页面或者调用GET方法的接口，作为服务端也是有可能需要调用第三方的页面或接口的，此时可以很方便地用http.get函数完成：

```javascript
const http = require('http')
http.get({host: 'www.lotaway.com'}, function (res) {
    res.setEncoding('utf8');
    res.on('data', function (data) {
        console.log(data);
    });
})
```

# 发送POST请求

类似于js的fetch方法，但Nodejs里没有fetch，只能通过http或者request模块发送请求。

```javascript
const http = require('http')
const querystring = require('querystring')
//  使用querystring将对象数据转成接口所需的请求格式：如输入{a:1,b:"哈哈"}会输出a=1&b=哈哈
const content = querystring.stringify({
    //发送的内容
    name: 'lotaway',
    email: '576696294@qq.com',
    address: 'shantou,China'
})
const reqOpt = {
    //  请求的选项
    //host: 'www.lotaway.com',    //请求网站的域名或IP地址
    path: '/api/post/test?keyword=1', //请求的相对路径和数据参数
    method: 'POST', //请求方法，默认为GET
    headers: {  //请求头
        'Content-Type': 'application/json',
        'Content-Length': content.length
    }
}
var req = http.request(reqOpt, res => {
        //  接收数据的回调函数
        res.setEncoding('utf8')
        res.on('data', data => {
            console.log(data)
        })
    }
)
req.write(content)
req.end()  //   结束请求
```

# 创建TCP服务

大多用于长连接类，借助net模块可以轻松创建tcp服务。

```javascript
const net = require('net')
const port = "10101"
const tcpServer = net.createServer(clientSocket => {
    console.log("有客户端连接，clientSocket对应连接的客户端实例")
    clientSocket.on('data', data => {
        console.log(`服务端获取到来自连接的客户端${clientSocket.remoteAddress}:${clientSocket.remotePort}传输的数据流：${data}`)
    })
    clientSocket.on('close', () => {
        console.log('服务关闭')
    })
    clientSocket.write("你好客户端，你已经连接成功~")
})
tcpServer.listen(port, '127.0.0.1')
```

以上开启了一个tcp服务端，也可以用来创建tcp客户端并连接到tcp服务端上。
创建客户端连接方法1：

```javascript
const net = require('net')
const tcpClient = new net.Socket()

tcpClient.connect({
    port: '10101',
    host: '127.0.0.1'
}, () => {
    console.log('连接服务成功')
    tcpClient.write('客户端发送内容给服务端')
})
tcpClient.on('data', data => {
    //  接收的data是Buffer，可以直接用toString转化为字符串
    console.log(`客户端接收到数据：${data}`)
})
```

创建客户端连接方法2：

```javascript
const net = require("net")
const tcpClient = net.createConnection({
    port: "10101",
    host: "127.0.0.1"
})
tcpClient.on("connect", () => {
    console.log("连接服务成功")
    tcpClient.write('客户端发送内容给服务端')
})
tcpClient.on("data", data => {
    console.log(`客户端接收到数据：${data}`)
})
```

# UDP 用户数据报协议

UDP协议与TCP协议一样用于处理数据包，常见于各种需要高速而不太依赖质量的通讯，例如直播，这是和TCP两者的对比：

|      | UDP     | TCP    |
|------|---------|--------|
| 连接   | 无连接     | 三次握手连接 |
| 速度   | 较快      | 较慢     |
| 目的   | 一对一，一对多 | 一对一    |
| 消息边界 | 有       | 无      |
| 消息顺序 | 网络拥挤时无序 | 有序     |
| 可靠性  | 低       | 高      |

## UPD传播方式

* 单播，一对一，若目的地有多个则需要发送多次
* 广播，局域网内一对多，由于所有设备都会收到导致不必要的消耗，在IPv6中已经取消
* 组播，公网一对多，加入特定组的成员就可收到消息

## 创建UDP单播

```javascript
const dgram = require("dgram")
const udpServer = dgram.createSocket("udp4")
udpServer.on("listening", () => {
    const serverAddress = udpServer.address()
    console.log(`服务端${serverAddress.address}:${serverAddress.port}已开启监听`)
})
udpServer.on("message", (msg, remoteInfo) => {
    console.log(`服务端收到来自${remoteInfo.address}:${remoteInfo.port}的信息：${msg}`)
})
udpServer.on("error", err => {
    console.log("服务端出错：" + err)
})
udpServer.bind(41234)
```

客户端的创建与服务端完全相同，两者可以无区别，只不过若客户端不需要接收消息的情况下，不用绑定和监听，而是直接对目标发送消息即可：

```javascript
const dgram = require("dgram")
//  与服务端相同的创建方式
const udpClient = dgram.createSocket("udp4")
//  可以不添加服务端的监听，直接发送信息
udpClient.send("这就是我要发送的内容啊", 41234, "localhost", err => {
    console.log("已成功发送")
    udpClient.close()
})
```

## 创建UDP广播

广播与单播的差别只是一个模式的开关，在监听事件中进行开启，其他一样。
以下创建广播端：

```javascript
const dgram = require("dgram")
const udpServer = dgram.createSocket("udp4")
udpServer.on("listening", () => {
    //  唯一区别：开启广播模式
    udpServer.setBroadcast(true)
    setInterval(() => {
        //  255.255.255.255是受限地址，代表在局域网内广播，若使用直接地址例如192.168.10.255则可以跨网段广播
        udpServer.send("heartbest", 41234, "255.255.255.255", err => {
            console.log("心跳包已成功发送")
        }, 2000)
    })
})
udpServer.on("message", (msg, remoteInfo) => {
    console.log(`服务端收到来自${remoteInfo.address}:${remoteInfo.port}的信息：${msg}`)
})
udpServer.on("error", err => {
    console.log("服务端出错：" + err)
})
udpServer.bind(41234)
```

接着创建接收端，实际两者一样：

```javascript
const dgram = require("dgram")
const udpClient = dgram.createSocket("udp4")
//  实际上也可以开启广播来发送消息
/*udpClient.on("listening", () => {
    udpClient.setBroadcast(true)
})*/
udpClient.on("message", (msg, remoteInfo) => {
    console.log(`收到来自${remoteInfo.address}:${remoteInfo.port}的信息：${msg}`)
})
// udpClient.bind(55555)
```

## UDP组播

组播与单播、广播差别只在是否指定和接收频道地址消息。
创建发送端：

```javascript
const dgram = require("dgram")
const udpServer = dgram.createSocket("udp4")
udpServer.on("listening", () => {
    setInterval(() => {
        //  指定频道地址如"224.0.1.100"即可发送组播消息
        udpServer.send("heartbest", 41234, "224.0.1.100", err => {
            console.log("心跳包已成功发送")
        }, 2000)
    })
})
udpServer.on("message", (msg, remoteInfo) => {
    console.log(`服务端收到来自${remoteInfo.address}:${remoteInfo.port}的信息：${msg}`)
})
udpServer.on("error", err => {
    console.log("服务端出错：" + err)
})
udpServer.bind(41234)
```

接着创建接收端：

```javascript
const dgram = require("dgram")
const udpClient = dgram.createSocket("udp4")
udpClient.on("listening", () => {
    //  加入指定频道地址如"224.0.1.100"才能接收到组播消息
    udpClient.addMembership("224.0.1.100")
})
udpClient.on("message", (msg, remoteInfo) => {
    console.log(`收到来自${remoteInfo.address}:${remoteInfo.port}的信息：${msg}`)
})
udpClient.bind(55555)
```

以上是Nodejs自带的HTTP、HTTPS、TCP、WebSocket、UDP四种协议，包含服务端和客户端所需请求和响应方式，接下来介绍其他使用模块。

# events 事件

事件模块被很多别的模块集成，例如HTTP服务、文件读入输出流等，而事件模块本身也能用于创建自定义事件。

```javascript
const EventEmitter = require('events')

class MyEventEmitter extends EventEmitter {
}

const myEventEmitter = new MyEventEmitter()
//  注册事件监听器，设置自定义事件和回调
myEventEmitter.on('myEventName', function (arg1, arg2) {
    console.log("事件触发：" + arg1 + " and " + arg2)
})
myEventEmitter.once('only-trigger-once', function () {
    console.log("只触发一次的事件，用于一些第三方异步回调监听")
});
myEventEmitter.on('error', function () {
    console.log("into the error event")
//    一般都要设置错误回调，否则错误时会退出程序并打印调用栈
})
setTimeout(() => {
    //  模拟在某个回调中触发事件
    myEventEmitter.emit('myEventName', 'A1', 'A2')
}, 10 * 1000)
```

要注意多次注册同个事件会按顺序调用，可以使用Nextick或者定时器延时。

# Buffer 流

`Buffer`既一种二进制的流，大部分数据传输时实际就是作为`Buffer`存在，包括但不限于HTTP上传下载文件、TCP（Websocket）、视音频播放、文件读写等。
Buffer在Nodejs里作为全局类存在，不需要通过require引入。

## 字符串转换成Buffer

通过`Buffer.from(string)`的方式可以将内容变成Buffer格式
参数：源Buf（必须），偏移量，长度，编码（默认utf8）

```javascript
const strBuffer = Buffer.from("这是要转换成二进制的字符串")
console.log(strBuffer.length)   //  和数组一样通过length获取长度
```

## 创建固定长度的Buffer

可以通过`Buffer.alloc(size)`创建全新固定长度的Buffer，初始化内容为0并分配好内存空间，当写入字符串内容过多时会丢弃多余字符，写入长度不够则会保留原有的内容0。

```javascript
const buf = Buffer.alloc(8)
buf.write('这是一个固定长度的内容')
console.log(buf)
//  字符需要占据两个字节，所以打印内容为：“这是一个”，之后的内容“固定长度的内容”被抛弃
```

也可以通过`Buffer.allocUnsafe(size)`从原有的内存中创建固定长度的Buffer，此时内容不会初始化，意味着可能含有之前内存地址存储的内容，需要通过fill等语法写入内容后才能正常使用：

```javascript
const buf = Buffer.allocUnsafe(8)
console.log(buf)
//  可能里面是之前存储的内容
```

## 数组转换成Buffer

更常用的是写入数组`Buffer.from(array)`，可以直接通过下标调用或者使用for...of进行迭代：

```javascript
var buf = Buffer.from([0, 1, 2, 3])
console.log(buf[0])
//  获取到的内容为原数组索引0位置的内容：0
for (const b of buf) {
    console.log(b)
}
// 迭代三次分别打印出1、2、3
```

## 复制Buffer

复制是指从一个buffer实例复制到另外一个实例，需要的参数是：源buffer（必须），目标写入开始位置，源读取开始位置，源结束位置

```javascript
let originBuffer = Buffer.from("这就是要复制的内容")
let targetBuffer = Buffer.allocUnsafe(originBuffer.length)
targetBuffer.copy(originBuffer, 0, 0, originBuffer.length)
```

这种复制适合两个Buffer实例在不同位置创建的

## 更直接的复制方式

这种适合在同个位置或函数内进行复制

```javascript
let originBuffer = Buffer.from("这就是要复制的内容")
let targetBuffer = Buffer.from(originBuffer)
```

## typedArray

typedArray是为了解决js里没有像其他开发语言一样的Int8、Uint32、Float64等整型和浮点型而提供的多个全局类。

实际上Buffer实例即是Unit8Array的实例，两者之间可以互相复制数据或者共享数据（指向同一内存地址）：

```javascript
const uint16Arr = new Uint16Array(2)
uint16Arr[0] = "Hello"
uint16Arr[1] = "Teacher"
//  复制数据
const copyBuf = Buffer.from(uint16Arr)
//  共享数据
const shareBuf = Buffer.from(uint16Arr.buffer)
```

## 更多Buffer方法

```javascript
Buffer.toString(buffer, encoding, start = 0, end = buffer.length)
buffer.slice(start, end)
Buffer.compare(oneBuffer, otherBuffer)
buffer.equal(otherBuffer)
buffer.fill(value, offset, end)
```

# 文件操作 fs

fs模块是文件操作的封装，提供了文件读取、写入、更名、删除、遍历目录、链接等POSIX操作，并且都有同步和异步方法。

## 异步读取文件

```javascript
const fs = require('fs')
//  读取文件
fs.readFile('./logo.png', {
    // encoding: "utf-8"    //  如果想要读出的内容是正常的字符串而不是Buffer，需要添加编码
}, (err, fileBuffer) => {
    //  没有添加编码，读出的内容将是Buffer类型
    console.log(Buffer.isBuffer(fileBuffer))
    //  写入文件
    fs.writeFile('logo-2.png', fileBuffer, err => {
        if (err) {
            //  没有错误时err为nll或undefined，有错误发生时为Error对象实例
            console.error(err)
            return
        }
        console.log("写入完成")
    })

    //  将`Buffer`转换成常人看的字符串内容
    var fileStr = fileBuffer.toString('base64')
    console.log(fileStr)

    //  将字符串转回为`Buffer`，内容和原本的Buffer是一致的
    var fileBuffer2 = Buffer.from(fileStr, 'base64')
    console.log(Buffer.compare(fileBuffer, fileBuffer2))
    fs.writeFile('logo-decoded.png', fileBuffer2, err => {
        if (err) console.log(err)
        else console.log("文件写入完成")
    })
});
```

## 同步读取文件

该读取会持续等待直到文件内容返回

```javascript
const fs = require("fs")
const fileBuffer = fs.readFileSync('aFile.txt', 'utf-8')
console.log(`文件读出的内容：${fileBuffer}`);
```

## 异步写入文件

可选覆盖 / 追加、自动创建路径文件夹等

```javascript
const fs = require("fs")
var writeData = "要写入的新内容";
fs.writeFile("./path/to/newFile.txt", writeData, {
    encoding: "utf8",
    flag: "w+"  //  文件不存在则自动创建
}, err => {
    if (err) {
        console.error(err)
        return
    }
    console.log("写入文件成功")
})
```

## 直接打开文件

直接打开文件，就像你用鼠标双击打开文件一样，此时将通过手动管理所有读写权限请求、缓冲区、文件指针等（readFile/writeFile是封装好的方法）
接受两个必选参数，path 为文件的路径，flags可以是以下值。

* r ：以读取模式打开文件。
* r+ ：以读写模式打开文件。
* w ：以写入模式打开文件，如果文件不存在则创建。
* w+ ：以读写模式打开文件，如果文件不存在则创建。
* a ：以追加模式打开文件，如果文件不存在则创建。
* a+ ：以读取追加模式打开文件，如果文件不存在则创建。
* mode 参数用于创建文件时给文件指定权限，默认是0666。
* 回调函数将会传递一个文件描述符fd。
* 1、文件权限指的是POSIX操作系统中对文件读取和访问权限的规范，通常用一个八进制数来表示。例如0754表示文件所有者的权限是7（读、写、执行），同组的用户权限是5（读、执行），其他用户的权限是4（读），写成字符表示就是
  -rwxr-xr--。
* 2、文件描述符是一个非负整数，表示操作系统内核为当前进程所维护的打开文件的记录表索引。

```javascript
const fs = require("fs")
fs.open('aFile.txt', 'r', (err, fd) => {
    if (err) {
        console.error(err);
        return;
    }
    var buf = Buffer.alloc(8);
    fs.read(fd, buf, 0, 8, null, (err, bytesRead, buffer) => {
        if (err) {
            console.error(err)
            return
        }
        console.log('bytesRead:' + bytesRead);
        console.log(buffer);
        /*运行结果则是：
         bytesRead: 8
         <Buffer 54 65 78 74 20 e6 96 87>*/
        //  完成后（对于打开文件的操作）需要关闭文件
        fs.close(fd, err => {
            if (err) {
                console.error(err)
            } else {
                console.log("关闭文件成功")
            }
        })
    })
})
```

## 同步读取和写入

上述读写文件都是异步执行，实际上还有更直观的同步执行，差距不大，不过要理解在读取完成之前都不会执行下一步，最好不要尝试在大文件上使用。

```javascript
const fs = require('fs')
const fileBuffer = fs.readFileSync('./logo.png')
console.log(fileBuffer + "," + +new Date())
fs.writeFileSync("./logo-copy.png", fileBuffer)
console.log("写入成功" + +new Date())
```

## 输入输出流

这种方式没有区分是读取文件还是直接读取Buffer，都统一处理成流，因此读取文件时不是直接获取到整个文件内容，而是分段读取。
写入流也是相同情况，写入文件时并不是一次性全部写入，但是按照分段流一段一段写入。

```javascript
const fs = require("fs")
var audioReadStream = fs.createReadStream('./audio/1.mp4')
var targetWriteStream = fs.createWriteStream('./audio/1-copy.mp4')
// readStream.setEncoding("utf8")   //  文件类需要定好编码
audioReadStream.on('data', chunk => {
    // 执行写入
    if (targetWriteStream.write(chunk) === false) {
        console.log('输入流未完成缓存，需等待drain事件')
        audioReadStream.pause()
    }
    // targetWriteStream.write(chunk, "utf8")   //  文件类需要加编码
})
    .on('end', () => {
        console.log("输出流结束时把输入流也关闭掉")
        targetWriteStream.end()
    })
targetWriteStream
    .on('drain', () => {
        console.log('输入流完成缓存写入后触发事件，恢复输出流')
        audioReadStream.resume()
    })
    .on("finish", () => {
        console.log("写入完成回调")
    })
    .on("error", err => {
        console.log(er.stack)
    })
```

也可以等待输出流将文件读取完毕后再一次性用输入流写入，但这样和直接写入文件没有区别

## 管道形式传输流信息

```javascript
var readerStream2 = fs.createReadStream("aFile.txt")
var writerStream2 = fs.createWriteStream("fileCopy.txt")
readerStream2.pipe(writerStream2)
console.log("管道读写操作执行完成")
```

## 压缩/解压也可使用管道流形式

```javascript
const fs = require("fs")
const zlib = require("zlib")
// 使用zlib库将文件压缩成gz格式
fs.createReadStream("aFile.txt").pipe(zlib.createGzip()).pipe(fs4.createWriteStream("aFile.txt.gz"))
// 使用zlib库解压文件
fs.createReadStream("aFile.txt.gz").pipe(zlib.createGunzip()).pipe(fs.createWriteStream("aFile.txt"))
```

## 实现大文件传输

[实现一个大文件上传和断点续传](https://www.jianshu.com/p/bd6c6948826b)

# 路径操作 path

path的模块，可以帮你标准化，连接，解析路径，从绝对路径转换到相对路径，从路径中提取各部分信息，检测文件是否存在。总的来说，path模块其实只是些字符串处理，而且也不会到文件系统去做验证（path.exists函数例外）。

## 路径标准化 normalize

将用户输入或者配置文件中获取到的路径进行一次标准化，可以将“..”、“.”、“//”等特定位置或错误的情况进行过滤重整后输出，如：

```javascript
const {normalize} = require('path')
normalize('/foo/bar//baz/asdf/quux/..'); // 将双划线和最后的..处理掉，变成：/foo/bar/baz/asdf
```

## 连接路径 join

串联多个路径成为一个完整路径输出，例如将基础路径和文件夹路径、文件名称合成一个完整的文件路径：

```javascript
const {join} = require('path')
join('/foo', 'bar', 'baz/asdf', 'quux', '..'); // /foo/bar/baz/asdf
```

## 解析路径 resolve

可以把多个路径解析为一个绝对路径。它的功能就像对这些路径挨个不断进行“cd”操作，不同的地方在于不会去确认路径是否存在，如：

```javascript
const {resolve} = require("path")
resolve('foo/bar', './baz'); // /foo/bar/baz
resolve('foo/bar', '/tmp/file/'); // /tmp/file
```

# 全局对象

相比js本身的全局对象是window，nodejs的全局对象是global，而全局对象意味着不需要导入模块就只能直接调用。

## process

* 用于描述当前nodejs进程状态
* process.argv是命令行参数数组，第一个元素是node，第二个是脚本文件名，第三个开始是运行参数。

```javascript
  console.log(process.argv)
//  ['node','/byvoid/argv.js','2016','==v','Carbo Kuo']
```

### stdout & stdin 命令行输出输入流

process.stdout是标准输出流，而process.stdin是标准输入流，可以获取用户在命令行输入的内容，但初始状态是暂停的，需要恢复输入流并添加监听方法即可获取到输入内容：

```javascript
process.stdin.resume()
//  监听命令行输入流，此时在命令行输入内容并回车后会在回调中获取到
process.stdin.on('data', data => {
    process.stdout.write('从命令行读取到的内容：' + data.toString())
})
```

## nextTick

为事件循环设置一项任务，把事件拆解成各小的部分，避免一个事件占用太多CPU时间，这比setTimeout(fn,0)的效率高得多

```javascript

function doSomething(next) {
    console.log("do something first")
    process.nextTick(next)
}

function somethingElse() {
    console.log("do something else")
}

doSomething(somethingElse)
```

还有precess.platform,process.pid,process.execPath,process.memoryUsage()等方法，以及POSIX进程信号响应机制

# 加密

加密最常见的就是将账户密码进行MD5加密存储，内置库提供了相应的方式：

```javascript
const crypto = require("crypto")
const md5 = crypto.createHash("md5")
md5.update("这里是要加密的字符串内容")
const cryptoContent = md5.digest("hex") //  加密好的内容，默认全小些
```

也有更简单的第三方模块（需要通过npm安装）：

```javascript
const md5 = require("md5")
const cryptoContent = md5("这里是要加密的字符串内容")   //  加密好的内容，默认全小写
```