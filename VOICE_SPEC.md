# VOICE_SPEC.md

## 1. 目标（Goals）

- 在 Electron 桌面端实现完整语音闭环：语音输入（ASR）→ 文本 → 语音输出（TTS）
- 以 **XTTS-v2** 为唯一 TTS 基础模型，支持多说话人与语音克隆
- 支持 **服务器侧语音克隆训练（embedding + adapter）**，客户端仅负责推理
- 客户端可离线完成 TTS，不依赖服务器推理能力
- 面向 Agent / 多角色场景，支持在运行期快速切换 voice profile
- 语音资产可持久化、可迁移、可复用

---

## 2. 非目标（Non-Goals）

- 不支持客户端进行任何形式的 TTS 微调或训练
- 不支持 Bark / VITS / 其他 TTS 模型并存
- 不追求音乐级、歌唱级语音生成
- 不提供语音情绪自动识别
- 不解决用户授权、法律合规层面的责任归属问题

---

## 3. 总体架构（Overview）

```
[Electron Desktop]
  - Mic Input
  - TTS Inference (XTTS-v2)
  - Voice Profile Manager
  - Agent Runtime
        ↑
        │ text
        │
[Python ASR Service]
  - Streaming / Batch ASR
  - VAD
  - Text Normalization
```

- ASR：服务端 Python 进程
- TTS：客户端本地推理
- 语音克隆训练：服务器侧独立流程

---

## 4. 模型管理

### 4.1 动态下载行为

- TTS 引擎不随项目源码包含任何模型文件
- 第一次触发 TTS 或用户主动点击预下载，客户端从指定模型仓库自动拉取模型权重与配置
- 下载完成后写到本地模型缓存目录

建议缓存路径示例：

```
~/Library/Application Support/MyApp/models/xtts-v2/{version}/
```

文件必须包含：

```
checkpoint.pt
config.json
tokenizer.json
```

### 4.2 下载规则

- 用户手动触发：进入下载队列
- 自动触发：调用 TTS 接口时若模型缺失先下载再推理
- 每次模型更新应伴随 `model_id` 和 `model_hash`

---

## 5. TTS 模型下载 API

```
GET /models/xtts-v2/{version}
```

响应格式：

```json
{
  "version": "2026-01-15",
  "hash": "sha256:abcdef123456...",
  "url": "https://your-model-host/xtts-v2/2026-01-15.zip",
  "size_bytes": 123456789
}
```

客户端行为：

- 检查本地是否存在对应版本
- 若无则提示下载
- 显示进度与可取消操作

错误状态：

- 400 系列通信错误
- 500 系列服务端不可用

---

## 6. 客户端模型状态机

```
Idle
  ↓ 触发下载
Downloading
  ↓ 下载成功
Downloaded
  ↓ 校验失败
Invalid → 清理缓存
Downloaded
  ↓ 适配 profile
Ready
```

---

## 7. ASR 接口约定

基于现有 `voice_controller.py`：

#### POST /voice/to/text

请求：

- 支持音频上传（字段名：audio）
- 支持分块 + session_id + stream

响应：

```json
{
  "text": "识别结果",
  "segments": [
    {"start": 0.0, "end": 0.5, "text": "识别"}
  ],
  "session_id": "xxx"
}
```

---

## 8. TTS 接口设计（客户端）

#### POST /tts/synthesize

请求：

```json
{
  "text": "需要合成的文本",
  "voice_profile_id": "abc123",
  "stream": false
}
```

响应：

- 非流式：一次性返回音频数据（base64 或二进制）
- 流式：通过 SSE 分段输出 raw PCM

错误码：

- 400 缺参数/无文本
- 404 voice profile 不存在
- 409 模型未下载
- 500 推理失败

---

## 9. voice_profile 结构

```
voice_profile/
  ├── speaker_embedding.pt
  ├── speaker_adapter.safetensors
  └── voice.json
```

voice.json 示例 schema：

```json
{
  "profile_id": "uuid",
  "base_model_id": "xtts-v2",
  "base_model_hash": "sha256:abcdef",
  "adapter_hash": "sha256:adapter123",
  "language": "zh-CN",
  "created_at": "2026-02-01T12:34:56Z"
}
```

客户端校验：

- profile.base_model_hash 与本地模型 hash 一致
- 不匹配时提示重新下载或更新

---

## 10. 用户体验及 UI 规范

- 提供模型下载/取消按钮
- 显示下载进度
- 下载失败自动重试（最多 3 次）
- 下载成功后通知用户

---

## 11. 验收标准

### 功能：

- 自动下载 TTS 模型并成功推理
- 用户可手动触发预下载
- ASR 字幕实时显示

### 兼容性：

- voice profile hash 校验成功
- 不匹配时提示可操作

### 稳定性：

- 30 分钟连续运行不崩溃
- 模型加载不影响主 UI

---

## 12. 质量要求

- TTS 无明显金属音
- 语速/音量一致
- 多语种兼容

---

## 13. 禁忌

- 客户端私自训练
- 混用不同 base model 的 adapter
- 未授权音频训练
