# BiliNote 实现原理分析

> 基于项目源码分析，补充 [README.md](./BiliNote/README.md) 未详细说明的技术细节

## 1. 核心设计：传给 LLM 的是什么？

| 模式 | 传 LLM 的内容 | 需要下载视频？ |
|------|---------------|---------------|
| **默认** | 转写文本（纯文本） | ❌ 仅音频 |
| **screenshot** | 文本 + 截图 URL | ✅ 视频 |
| **video_understanding** | 文本 + 网格图 base64 | ✅ 视频 |

**关键点**：默认不会将音视频文件传给 LLM，只有转写文本。

**代码**: `backend/app/services/note.py:354-355`
```python
need_video = screenshot or video_understanding  # 仅当启用时下载视频
```

---

## 2. 字幕获取机制

### 2.1 各平台字幕获取情况

| 平台 | 字幕获取方式 | 代码位置 |
|------|-------------|---------|
| B站 | `yt-dlp --writesubtitles` | `bilibili_downloader.py:125-221` |
| YouTube | `yt-dlp --writesubtitles` | `youtube_downloader.py:101-167` |
| 抖音 | 无字幕（返回 None） | `douyin_downloader.py` |
| 快手 | 无字幕（返回 None） | `kuaishou_downloader.py` |

### 2.2 yt-dlp 获取字幕原理

**不是 YouTube Data API**，而是网页逆向抓取：

```
yt-dlp → 模拟浏览器请求 → 解析平台内部接口 → 直接获取字幕
         (无需 API Key，无需登录，无需付费)
```

**参考**: yt-dlp 官方文档 https://github.com/yt-dlp/yt-dlp#subtitle

```python
# youtube_downloader.py:122-130
ydl_opts = {
    'writesubtitles': True,
    'writeautomaticsub': True,  # 包括自动生成字幕
    'subtitleslangs': ['zh-Hans', 'zh', 'en'],
    'subtitlesformat': 'json3',
    'skip_download': True,
}
```

### 2.3 Fallback: Whisper 转写

当平台无字幕时，使用 Whisper 转写音频：

| 转写器 | 说明 |
|--------|------|
| faster-whisper | 本地 GPU 加速（默认） |
| mlx-whisper | Apple Silicon 优化 |
| groq | Groq API 云端转写 |
| bcut | B站云端转写 |

**转写结果格式** (`backend/app/models/transcriber_model.py:6-15`):
```python
@dataclass
class TranscriptSegment:
    start: float   # 开始时间（秒）
    end: float     # 结束时间（秒）
    text: str      # 该段文字
```

---

## 3. 视频图像处理（可选功能）

### 3.1 screenshot 模式

用户指定时间点，生成单张截图：

**代码**: `backend/app/services/note.py:587-607`

```python
def _insert_screenshots(self, markdown: str, video_path: Path) -> str:
    matches = self._extract_screenshot_timestamps(markdown)
    for idx, (marker, ts) in enumerate(matches):
        img_path = generate_screenshot(video_path, output_dir, ts, idx)
        markdown = markdown.replace(marker, f"![]({img_url})", 1)
```

### 3.2 video_understanding 模式

生成分帧缩略图网格，用于 LLM 理解视频内容。

**代码**: `backend/app/utils/video_reader.py:12-143`

#### 核心参数

| 参数 | 默认 | 说明 |
|------|------|------|
| `grid_size` | 用户传入 | 如 (3,3) = 3×3 = 9 张拼 1 张 |
| `frame_interval` | 用户传入 | 每隔多少秒截取一帧 |
| `unit_width` | 1280 | 单张图宽度 |
| `unit_height` | 720 | 单张图高度 |

#### 生成流程

**提取帧** (`video_reader.py:46-64`):
```python
duration = float(ffmpeg.probe(self.video_path)["format"]["duration"])
timestamps = [i for i in range(0, int(duration), self.frame_interval)]
```

**分组** (`video_reader.py:66-71`):
```python
group_size = self.grid_size[0] * self.grid_size[1]  # 9
groups = [images[i:i+group_size] for i in range(0, len(images), group_size)]
```

**拼接网格图** (`video_reader.py:73-96`):
```python
grid_img = Image.new("RGB", (unit_width*cols, unit_height*rows))
for i, img in enumerate(images):
    x = (i % cols) * unit_width
    y = (i // cols) * unit_height
    grid_img.paste(img, (x, y))
```

**丢弃不足组** (`video_reader.py:129-131`):
```python
if len(group) < group_size:
    continue  # 不足 9 张的整组被丢弃
```

#### 图片数量计算

示例（frame_interval=10秒, grid_size=(3,3)=9张/组）:

| 视频时长 | 截取帧数 | 生成图片数 | 说明 |
|----------|---------|-----------|------|
| 60 秒 | 6 帧 | 1 张 | 第 2 组仅 3 张，丢弃 |
| 120 秒 | 12 帧 | 1 张 | 第 2 组仅 3 张，丢弃 |
| 180 秒 | 18 帧 | 2 张 | 两组都满 9 张 |

#### 为什么要用网格图？

**历史原因 + Token 节省**:

| 方式 | API 调用次数 | Token 消耗 |
|------|-------------|-----------|
| 单独 9 张图 | 9 次 | 高 |
| 网格图 1 张 | 1 次 | 低 |

早期 LLM API（如 OpenAI GPT-4V）不支持一次传多图，网格图是变通方案。现在多数 API 已支持多图，但网格方式仍可节省 Token。

#### 为什么要丢弃不足的组？

1. **简化 LLM 处理** - 每张网格图固定 9 格，LLM 可预期总时长
2. **避免歧义** - 不完整网格可能导致 LLM 误判视频时长
3. **实现简单** - 无需处理可变尺寸布局

---

## 4. 传给 LLM 的内容

### 4.1 默认模式（纯文本）

**代码**: `backend/app/gpt/universal_gpt.py:66-85`

```python
# 只传文本 prompt，不传音视频文件
messages = [{
    "role": "user",
    "content": [{"type": "text", "text": prompt_text}]
}]
```

### 4.2 video_understanding 模式（文本 + 图像）

**代码**: `backend/app/gpt/universal_gpt.py:42-59`

```python
# 网格图 base64 编码后传给 LLM
content = [
    {"type": "text", "text": prompt_text},
    {"type": "image_url", "image_url": {"url": "data:image/jpeg;base64,..."}}
]
```

---

## 5. 文件索引

| 功能 | 文件路径 |
|------|---------|
| 主流程 | `backend/app/services/note.py` |
| API 端点 | `backend/app/routers/note.py` |
| 视频下载器 | `backend/app/downloaders/{bilibili,youtube,douyin,kuaishou}_downloader.py` |
| 字幕获取 | `backend/app/downloaders/*_downloader.py` 中的 `download_subtitles()` |
| Whisper 转写 | `backend/app/transcriber/whisper.py` |
| 转写器管理 | `backend/app/transcriber/transcriber_provider.py` |
| 视频截图 | `backend/app/utils/video_reader.py` |
| GPT 总结 | `backend/app/gpt/universal_gpt.py` |
| Prompt 模板 | `backend/app/gpt/prompt_builder.py` |
| 服务器入口 | `backend/main.py` |
