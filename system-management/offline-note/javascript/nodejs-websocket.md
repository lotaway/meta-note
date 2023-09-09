@[TOC](用Nodejs Web Socket创建群聊和私聊频道)

要注意虽然Nodejs的net模块也可以创建TCP/WebSocket服务，但一般都是通过封装更好的第三方模块完成实际业务。
本例子选用nodejs-websocket模块，也可以选择像是ws、socket.io等第三方包。
下面将让用户可以登录和创建频道，频道里可以进行群聊，也能发起私聊。

以MySQL为例建表结构，需要用户表、群聊表、群聊成员表、群聊消息、私聊消息表。
要注意此结构中并没有实现好友列表，而是群聊里可以直接对组员发起私聊。

```shell
# 用户表
create table if not exists User (
  Id Integer unique default auto_increment(),
  CreateTime Datetime default current_timestamp,
  UpdateTime Datetime default current_timestamp,
  Username Var.Char(10) unique not null,
  Password Var.Char(50),
  Nickname Var.Char(10) comment '用户昵称',
  LastOnlineTime Datetime comment '最后登录时间'
);
# 群聊表
create table if not exists GroupChat (
  Id Integer unique default auto_increment(),
  CreateTime Datetime default current_timestamp,
  GroupName Var.Char(20) not null '群名称',
  GroupNumer Tinyint(20) unique default auto_increment() comment '唯一群号',
  state Tinyint(2) not null default 0 comment '群聊状态：【0：正常，1：解散，2：全体禁言，3：全体禁言仅管理员可发言】'
);
# 群聊成员表
create table if not exists GroupChatMember (
  Id Integer unique default auto_increment(),
  CreateTime Datetime default current_timestamp,
  UserId Integer not null comment '用户标识',
  constraint `GroupChatMember_UserId_UserId` foreign key UserId on User(Id)
  GroupChatId Integer comment '所属群聊标识',
  constraint `GroupChatMember_GroupChatId_GroupChatId` foreign key GroupChatId on GroupChat(Id),
  rights Tinyint(2) default 0 comment '用户权限，【0：普通成员，1：群主，2：管理员】'
);
# 群聊消息
create table if not exists GroupMessage (
  Id Integer default uuid(),
  CreateTime Datetime default current_timestamp,
  Type Tinyint(2) default 0 comment '消息类型，【0：普通消息，1：通知消息】',
  Content Var.Char(255) not null comment '消息内容',
  From Integer comment '发送消息的用户标识',
  constraint `GroupMessage_From_UserId` foreign key `From` on User(Id),
  GroupChatId Integer comment '所属群聊标识'
);
# 私聊消息
create table if not exists PrivateMessage (
  Id Var.Char(50) default uuid(),
  CreateTime Datetime default current_timestamp,
  Type Tinyint(2) default 0 comment '消息类型，【0：普通消息，1：通知消息】',
  Content Var.Char(255) not null comment '消息内容',
  From Integer comment '发送消息的用户标识',
  constraint `PrivateMessage_From_UserId` foreign key `From` on User(Id),
  To Integer comment '接收消息的用户标识',
  constraint `PrivateMessage_To_UserId` foreign key `To` on User(Id)
)
```

## 服务端

先在后端程序里创建一个WebSocket服务端监听：

```javascript
const websocketModule = require("nodejs-websocket")
const md5 = require("md5")
const {nanoid} = require("nanoid")
const MySql = require("nodejs-mysql")
const mysqlClient = MySql.createClient()

//  第一次启动程序需要对数据库进行初始化
async function initData() {
    //  生成管理员账户和若干普通用户
    await mysqlClient.User.insertData({
        data: [
            {username: "admin"},
            {username: "player1"},
            {username: "player2"},
            {username: "player3"},
            {username: "player4"}
        ].map(item => {
            return {
                ...item,
                password: md5("123456"),
                isOnline: false
            }
        })
    })
    //  生成一个官方群
    mysqlClient.GroupChat.insertData({
        data: {
            groupName: "官方群",
            groupNumber: 10000,
            state: 0
        }
    })
    //  todo 配置普通用户群所能使用的群号例如：88888888开始
}
//  预设的群聊消息类型，例如普通消息、群通知，方便以后拓展
enum ChatMessageType {
    NORMAL,
    NOTICE
}

//  每次启动程序都需要进行状态初始化
async function createServer() {
    //  群连接列表
    let groupSocketList = new Map()
    const server = websocketModule.createServer(connect => {
        let userId = null
        const socketMessageHandler = async socketMessage => {
            const lastOnlineTime = +new Date()
            switch (socketMessage.type) {
                //  初始化，完成用户登录、登录时间更新、存储连接等
                case "init":
                    const matchUser = await mysqlClient.User.update({
                        where: {
                            username: socketMessage.username,
                            password: md5(socketMessage.password)
                        },
                        data: {
                            lastOnlineTime
                        }
                    })
                    if (!matchUser) return false
                    userId = metchUser.id
                    groupSocketList.add(userId, {
                        groupId: socketMessage.groupId ?? null,
                        lastOnlineTime,
                        connect
                    })
                    break
                //  心跳包，如果没有定时发送则将该人视为离线
                case "heartbeat":
                    const userInfo = groupSocketList.get(userId)
                    groupSocketList.set(socketMessage.userId, {
                        ...userInfo,
                        lastOnlineTime
                    })
                    break
                //  群聊消息，将消息存储起来并发送给其他人
                case "groupMessage":
                    mysqlClient.GroupChatMessage.insert({
                        data: {
                            id: nanoid(),
                            type: ChatMessageType.NORMAL,
                            content: socketMessage.content,
                            userId,
                            groupId: socketMessage.groupId
                        }
                    })
                    const matcherUsers = await mysqlClient.GroupChatMember.find({
                        where: {
                            groupId: socketMessage.groupId
                        },
                        select: {
                            id: true
                        }
                    })
                    const markLeaveTime = 2 * 60 * 1000 //  多久没有发送心跳包就视为离线
                    matcherUsers.forEach(user => {
                        const userInfo = groupSocketList.get(user.id)
                        if ((lastOnlineTime - userInfo?.lastOnlineTime < markLeaveTime) && user.connect !== connect)
                            user.connect.send(socketMessage)
                    })
                //  私聊消息
                case "privateMessage":
                    if (!socketMessage.to) return false
                    const targetUser = groupSocketList.get(socketMessage.to)
                    if (!targetUser) return false
                    mysqlClient.PrivateChatMessage.insert({
                        data: {
                            id: nanoid(),
                            type: ChatMessageType.NORMAL,
                            content: socketMessage.content,
                            from: socketMessage.from,
                            to: socketMessage.to
                        }
                    })
                    targetUser.connect.send(socketMessage)
                    break
                default:
                    break
            }
        }
        // 服务端收到的来自客户端的信息
        connect.on("text", msgStr => {
            socketMessageHandler(JSON.parse(msgStr))
        })
        connect.on("close", (code, reason) => {
            userId && groupSocketList.delete(userId)
            console.log("客户端关闭连接")
        })
        connect.on("error", (code, reason) => {
            userId && groupSocketList.delete(userId)
            console.log("连接出错")
        })
    })
    server.listen(8001)
}

createServer()
```
以上部分考虑服务可能挂掉的情况，需要额外拓展几个特性：
* 多线程，利用cluster创建多个子进程并同样开启websocket服务处理消息分发，减少主线程挂掉的可能
* 微服务，通过微服务减少单个服务拖垮其他所有服务的可能性，例如私聊是一个服务，群聊是另一个服务，这样私聊服务挂了不妨碍群聊，反过来也一样。
* 主从数据库，通过主从数据库减少存储的庞大数据可能带来的问题，主要用于读取的数据库只负责读写最近的聊天记录，确保速度，并且数据量或日期达到一定要求时就将旧数据剔除，而真正的主数据库存储有所有聊天记录，但无论读取和写入都比较慢，负荷也大，会采用异步消息队列牺牲速度来确保稳定性。

## 客户端脚本

```javascript
//  @web-socket-lib
let userId = null

export function createUserConnect(userInfo, receiver) {
    const webSocket = new WebSocket('ws://localhost:8001')
    const setTimeCounter = () => {
        //  定时两秒发一次心跳包
        timeCounter && clearInterval(timeCounter)
        timeCounter = setInterval(() => {
            webSocket.send({
                type: "heartbeat"
            })
        }, 2 * 1000)
    }
    let timeCounter = null
    webSocket.onopen = event => {
        console.log('服务已经成功连接')
        userId = userInfo.id
        //  发送初始化消息
        webSocket.send(JSON.stringify({
            username: "player1",
            password: "123456",
            type: "init",
            content: `${userInfo.nickname}已进入聊天室`
        }))
        // 关闭Socket....
        //socket.close()
    }
    webSocket.onmessage = message => {
        receiver(message)
    }
    webSocket.onclose = () => {
        console.log("连接关闭，请进行重连")
    }
    return {
        sendToGroup(message) {
            webSocket.send({
                type: "groupMessage",
                message
            })
            setTimeCounter()
        },
        sendToUser({to, message}) {
            webSocket.send({
                to,
                type: "privateMessage",
                message
            })
            setTimeCounter()
        }
    }
}
```

# 客户端调用脚本

在前端客户端，用户player1，player2访问时，调用脚本为他创建一个WebSocket连接到我们已经创建好的服务上。

## 客户端player1

```javascript
import {createUserConnect} from "web-socket-lib"

const webSocket = createUserConnect({
    username: "player1",
    password: "123456"
}, data => {
    console.log('客户端1接收到信息：', data)
})
```

## 客户端player2

```javascript
import {createUserConnect} from "web-socket-lib"

const webSocket = createUserConnect({
    username: "player2",
    password: "123456"
}, data => {
    console.log('客户端2接收到信息：', data)
})
//  调用群发消息，一般是用户在界面上输入来触发
webSocket.sendToGroup({
    content: "大家好"
})
//  调用私聊发消息
webSocket.sendToUser({
    to: 1,
    content: " 你好player1，我是player2"
})
```
