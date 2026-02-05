# Meta Note - Electron Application

这是一个基于 Electron + React + TypeScript + Vite 构建的桌面应用。

## 环境配置

应用使用环境变量进行配置管理。请按照以下步骤配置：

### 1. 复制环境变量模板

```bash
cp .env.example .env
```

### 2. 编辑环境变量

编辑 `.env` 文件配置选项

````

## 运行应用

### 开发模式
```bash
yarn dev
````

### 构建应用

```bash
yarn build
```

### 启动 Electron 应用

```bash
yarn start
```

## 技术栈

- Electron
- React
- TypeScript
- Vite
- Yarn（依赖管理）

## 语音转录功能

### 简介
支持实时将麦克风或系统音频（程序/浏览器标签页）转换为文字，并悬浮显示在屏幕顶部。

### 环境配置

编辑 `.env` 文件配置语音服务地址：

```bash
# 语音服务 API 地址
VITE_VOICE_API_URL=http://localhost:8000
```

### 使用方法

1. **启动应用**
   ```bash
   yarn dev
   ```

2. **选择音频来源**
   - 🎤 **麦克风**：直接录制当前环境声音
   - 🔊 **系统音频**：从下拉菜单选择正在播放音频的窗口或标签页

3. **开始转录**
   - 点击 **"开始转录"** 按钮
   - 音频数据将实时传输到后端处理

4. **悬浮字幕**
   - 点击 **"打开字幕"** 在屏幕顶部显示悬浮窗口
   - 点击字幕窗口右上角 ⚙️ 可调节：
     - 字体大小
     - 字体颜色
     - 描边颜色与宽度

5. **本地文件转录**
   - 支持上传 MP3/MP4 文件进行转录

### 后端接口要求

需配合支持以下接口的 Python 后端使用：
- `POST /voice/to/text` (支持流式 SSE 与分块上传)
