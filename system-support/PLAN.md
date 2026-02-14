# 音视频捕获与传输整体架构规划

## 1. 目标

实现以下完整链路：

1. 桌面/摄像头/麦克风音视频采集
2. 实时预览（Electron 前端）
3. 实时推送至后端服务
4. 可扩展为录制、转码、分发
5. 保持低延迟与低 CPU / 内存占用

系统核心原则：

* 不向 JS 暴露原始帧
* 所有编码在 Rust 层完成
* JS 仅负责控制与展示
* 优先使用硬件编码

---

## 2. 总体架构

```
采集层 (Rust)
    ↓
编码层 (Rust 硬件编码 H264/AAC)
    ↓
传输层
    ├── WebRTC → Electron
    └── WebRTC / RTP → 后端
```

Electron 只做：

* 信令
* 播放
* UI

不参与像素处理。

---

## 3. 采集层设计

### 3.1 视频来源

支持：

* 桌面捕获
* 摄像头
* 指定窗口

输出格式：

* 原始 YUV
* 分辨率可调
* 帧率可调

设计要求：

* 采集线程独立
* 不阻塞主线程
* 可动态切换分辨率

---

### 3.2 音频来源

* 系统音频
* 麦克风

输出格式：

* PCM
* 固定采样率（例如 48kHz）

---

## 4. 编码层设计

### 4.1 视频编码

使用硬件编码：

* H264

要求：

* 支持实时模式
* 低延迟
* GOP 可配置
* 可设置码率

编码输出：

* Annex B 格式
* NAL 单元流

---

### 4.2 音频编码

* AAC 或 Opus

实时编码输出 RTP 包。

---

## 5. 传输层设计

推荐统一使用 WebRTC。

原因：

* 浏览器原生支持
* 内建 NAT 穿透
* 内建拥塞控制
* SRTP 加密

---

### 5.1 与 Electron 通信

架构：

```
Rust WebRTC Peer
    ↔
Electron WebRTC Peer
```

信令通过：

* 本地 WebSocket
* 或 IPC

Electron 侧：

* 使用 RTCPeerConnection
* video.srcObject 直接播放

不处理帧数据。

---

### 5.2 与后端通信

两种模式：

#### 模式 A：WebRTC 直连后端

Rust 作为 publisher
后端作为 SFU / 接收端

优点：

* 低延迟
* 统一协议栈

#### 模式 B：转为 RTP/RTMP

Rust 编码后：

* 封装 RTP
* 或推 RTMP

适用于传统流媒体服务器。

---

## 6. 内存与性能控制

禁止行为：

* 将原始帧通过 N-API 传给 JS
* 使用 JS 处理 Uint8Array 视频帧
* 在 JS 中做编码

性能策略：

* 采集与编码线程隔离
* 使用环形缓冲区
* 启用零拷贝队列
* 使用硬件编码

目标：

* 1080p60 CPU 占用 < 20%
* 内存稳定
* 延迟 < 300ms

---

## 7. Electron 侧职责

只负责：

* 建立 PeerConnection
* 展示视频
* UI 控制
* 向 Rust 发送控制命令

控制命令示例：

* start_capture
* stop_capture
* change_resolution
* mute_audio

---

## 8. 后端接口规划

后端需提供：

1. 信令接口
2. WebRTC 接入能力
3. 可选录制能力
4. 可选转码能力

可扩展方向：

* 多人房间
* CDN 分发
* 录制存储

---

## 9. 模块拆分

Rust 模块：

* capture
* encoder
* webrtc_transport
* signaling
* control_api

Electron 模块：

* signaling_client
* rtc_manager
* ui

---

## 10. 未来扩展

* 支持 AV1
* 支持多路流
* 支持屏幕 + 摄像头合成
* 支持服务端转推

---

# 结论

核心设计思想：

* Rust 负责媒体数据
* JS 负责控制与展示
* 使用 WebRTC 统一前端与后端传输
* 永远不要跨语言传递原始帧

该架构可以支持：

* 实时互动
* 监控推流
* 低延迟传输
* 可扩展服务端处理

# Electron调用Rust-NAPI的方式

一、推荐结构
root/
  ├── electron-app/
  │     ├── package.json
  │     └── ...
  └── rust-native/
        ├── Cargo.toml
        └── src/lib.rs


Rust 目录里：

不需要 package.json

不需要 node_modules

不需要 npm

只需要：

Cargo.toml

二、在 Electron 里安装 CLI

进入 electron 目录：

npm install -D @napi-rs/cli

三、从 Electron 目录编译 Rust

可以这样：

npx napi build ../rust-native --release


或者在 package.json 里：

"scripts": {
  "build:native": "napi build ../rust-native --release"
}


默认情况下：

它会进入那个目录

调用 cargo build

在 Rust 目录生成 .node

四、如何把生成文件放到 Electron 目录？

可以用 --output-dir

例如：

napi build ../rust-native --release --output-dir ./native


这样生成：

electron-app/native/index.js
electron-app/native/xxx.node


然后在 Electron 里：

const native = require('./native')

五、Rust 目录需要满足什么？

只需要：

[lib]
crate-type = ["cdylib"]

[dependencies]
napi = "2"
napi-derive = "2"


就够了。

六、重要说明

你说的：

避免在 rust 目录里初始化和安装 npm

是完全正确的工程思路。

Rust 目录应该是：

纯 Rust

可独立 cargo build

不依赖 Node

npm 只在 Electron 侧。

七、完整推荐脚本

在 electron/package.json：

{
  "scripts": {
    "build:native": "napi build ../rust-native --release --output-dir ./native"
  }
}


然后：

npm run build:native

八、打包时

确保 electron-builder：

asarUnpack: ["native/*.node"]


否则运行时会加载失败。

九、总结

是的，可以：

CLI 只安装在 Electron

Rust 目录保持纯 cargo

从 Electron 目录调用 napi build ../rust_dir

指定输出到 Electron 目录

这是比较干净、专业的结构。