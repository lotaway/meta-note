# ONNX Runtime 集成指南

## 概述

本项目已成功集成 ONNX Runtime，用于加载和推理本地 ONNX 模型。ONNX 模型可以与现有的 llama 模型放在同一目录结构中，确保兼容性。

## 目录结构

模型文件应放置在以下目录中（与 llama 模型位置兼容）：

```
extraResources/
└── models/
    ├── model.gguf          # llama 模型文件
    └── model.onnx          # ONNX 模型文件
```

## 构建要求

### 系统依赖

- CMake 3.16.3 或更高版本
- C++17 兼容编译器
- ONNX Runtime 库

### 安装 ONNX Runtime

#### Windows
```bash
# 使用 vcpkg 安装
vcpkg install onnxruntime

# 或者下载预编译库
# 从 https://github.com/microsoft/onnxruntime/releases 下载
```

#### Linux
```bash
# Ubuntu/Debian
sudo apt-get install libonnxruntime-dev

# 或者使用 vcpkg
vcpkg install onnxruntime
```

#### macOS
```bash
# 使用 Homebrew
brew install onnxruntime

# 或者使用 vcpkg
vcpkg install onnxruntime
```

## 构建项目

```bash
# 创建构建目录
mkdir build
cd build

# 配置项目（确保 ONNX Runtime 库路径正确）
cmake .. -DCMAKE_TOOLCHAIN_FILE=[vcpkg根目录]/scripts/buildsystems/vcpkg.cmake

# 构建项目
cmake --build .
```

## 使用说明

### 模型放置

将 ONNX 模型文件命名为 `model.onnx` 并放置在以下任一位置：

1. `extraResources/models/model.onnx`（当前目录）
2. `../extraResources/models/model.onnx`（上级目录）
3. `../../system-management/extraResources/models/model.onnx`（system-management 项目目录）

### 代码集成

ONNX 模型处理类 `ONNXModel` 提供以下接口：

```cpp
// 创建模型实例
ONNXModel model;

// 加载模型
if (model.loadModel("path/to/model.onnx")) {
    // 模型加载成功
    std::cout << model.getModelInfo() << std::endl;
    
    // 运行推理
    std::vector<float> input = {1.0f, 2.0f, 3.0f, 4.0f};
    auto result = model.inference(input);
}
```

### 主要功能

1. **模型加载**：自动检测模型文件并加载
2. **输入输出信息**：获取模型的输入输出形状和名称
3. **推理执行**：支持浮点数张量输入
4. **错误处理**：完善的异常处理机制

## 与 Electron 集成

ONNX 模型处理可以作为 C++ 原生模块与 Electron 应用集成：

1. 将编译后的可执行文件放置在 Electron 的 `extraResources` 目录
2. 通过 Node.js 的 `child_process` 模块调用
3. 使用 IPC 进行进程间通信

## 示例代码

```cpp
#include "onnx_model.h"
#include <iostream>

int main() {
    ONNXModel model;
    
    if (model.loadModel("extraResources/models/model.onnx")) {
        std::cout << "模型信息:\n" << model.getModelInfo() << std::endl;
        
        // 示例推理
        std::vector<float> test_input = {1.0f, 2.0f, 3.0f, 4.0f};
        auto output = model.inference(test_input);
        
        std::cout << "推理结果大小: " << output.size() << std::endl;
    }
    
    return 0;
}
```

## 故障排除

### 常见问题

1. **模型文件未找到**
   - 检查模型文件路径是否正确
   - 确保文件名为 `model.onnx`

2. **ONNX Runtime 库未找到**
   - 检查 ONNX Runtime 安装是否正确
   - 确认 CMake 能找到 ONNX Runtime 库

3. **构建失败**
   - 检查 CMake 版本是否符合要求
   - 确认编译器支持 C++17

### 调试信息

启用详细日志输出：

```cpp
// 在 ONNXModel 构造函数中修改日志级别
env_(ORT_LOGGING_LEVEL_VERBOSE, "ONNXModel")
```

## 性能优化建议

1. **线程配置**：根据硬件调整线程数
2. **内存优化**：合理设置批处理大小
3. **模型优化**：使用 ONNX Runtime 的图优化功能

## 许可证

本项目使用 MIT 许可证。ONNX Runtime 使用 MIT 许可证。
