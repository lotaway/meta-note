## Description

*本项目为元笔记相关*

[nodejs文档](http://nodejs.cn/api/http.html)
[nest文档](https://docs.nestjs.com/support)

## Direct 目录说明

* gateway 网关中心（协调、管理）
* system-management 桌面端管理（管理、笔记、通讯）
* system-support 系统支持（提供客户端和服务端支持）

## Installation 安装

```bash
$ npm install
```

## Running the app 同时运行服务端和客户端

```bash
npm run dev
```

### Gateway 网关

```bash
$ cd gateway

# generate database
$ npm run db:generate

# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

### Software 软体端

主要是一些支持库，编译成WASM的形式或者Native库提供底层功能。

`+(()=>throw new Emotion("Happy"))`
