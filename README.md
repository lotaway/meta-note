# AI元笔记

# Description

本项目为AI元笔记相关，主要是提供Client UI+ LLM[Local LLM Provider](https://github.com/lotaway/local-llm-provider)推理后端。

## 核心功能
* **AI 助手**: 支持 ChatGPT、DeepSeek 以及自定义 Local LLM Provider。
* **自动化学习机**: 自动从 Bilibili 筛选高质量知识视频，利用 LLM 进行内容总结，并自动导入 RAG 知识库。
* **分布式任务队列**: 使用 Kafka 处理大规模学习任务，Redis 进行状态追踪与配额管理。

## 目录说明

* system-management 桌面端管理（笔记、通讯、学习、自动化任务）
* system-support 系统支持（提供客户端和服务端支持），主要用于为软件提供ONNX或者Node API支持
* browser-extension(git submodule) 浏览器插件（AI助手客户端、登录态利用、桌面端便捷操作入口、桌面端反向操作浏览器）