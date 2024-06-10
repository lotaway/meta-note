@[TOC](WebAssembly学习-编写一个WebAssembly方法并放到网站上调用)

# 介绍

WebAssembly是一种可以将程序代码编译成二进制文件供js或Nodejs调用，以便在安全的前提下完成耗时的运算。
WebAssembly于2015年首次发布，第一次演示是在Firefox、Chrome和Edge上执行Unity的Angry
Bots游戏，是继HTML、CSS和JavaScript之后的第四种Web语言。到目前为止，94%的浏览器已经支持WebAssembly。
它能够在浏览器中实现接近本机的执行速度，使得我们有可能将桌面应用(如AutoCAD)甚至电子游戏(如《Doom 3》)移植到 Web。
应用领域包括游戏、音视频解编码、数据压缩、3D模型渲染、加密运算、AR/VR合成与识别等，对速度有要求的网页后端程序（为减少网络带来的延迟）也可移植到前台直接使用。
[第三方文档](https://www.wasm.com.cn)

# 为什么要学习

目前ServerLess和云服务、微服务的趋势越来越明显，后端程序被切割成了众多不同难度级别的服务。
有纯操作系统可放置完整应用程序的，类似自己搭建服务器。
有单单只有数据库或者Docker容器、或Nginx网站服务的。
也有更简化的只有云函数调用的。
目前外出就业，全栈开发甚至是前端开发岗位都要求对亚马逊AWS、阿里云或腾讯云有使用经验，对Window或Linux的操作要求变成了满足基础使用即可。
加上元宇宙的到来，3D模型、人工智能、区块链都将下放到前端完成，前端的比重越来越离谱，任务越来越复杂，如果有WebAssembly负责前端js不擅长的高效运算那将是强而有力的补足。
甚至一小部分企业已经开始招聘懂C/Rust+WebAssembly的前端/全栈开发工程师了，现在先行了解也无妨。

# 开发

虽然理论上可以使用任意语言如C/C++/Rust/Go编写wasm代码，但还必须编译工具支持，目前已知的工具：

* [Emsdk](https://emscripten.quchafen.com)，可编译C/C++
* [Web Assembly Explorer](https://mbebenita.github.io/WasmExplorer/)，可编译C/C++
* [Wasm Fiddle](https://wasdk.github.io/WasmFiddle/)，可编译C
* [Rust Wasm-Pack](https://rustwasm.github.io/wasm-pack)
* [WebAssembly.studio](https://webassembly.studio)，可编译C/Rust/Wat
* [Wat2Wasm](https://webassembly.github.io/wabt/demo/wat2wasm/)，可编译Wat
* [Go](https://golang.google.cn/dl)，Go官方从1.1版本就开始支持编译成wasm
* [Kotlin Wasm](https://book.kotlincn.net/text/wasm-overview.html), Kotlin也有Multi platform提供stdlib-js库+task的方式打包成wasm供js里调用

接下来用C++语言实现一个斐波数列的计算：

```bash
int fib(int n) {
   if (n <= 1) {
      return n;
   }
   return fib(n-1) + fib(n-2);
}
```

函数本身非常简单，如果是C++的程序，只需要直接调用即可，但为了配合emsdk让js能方便调用，还需要一些额外工作。
由于emsdk为了优化体积默认只导出main方法，其他方法想要保留需要加上EMSCRIPTEN_KEEPALIVE，例如：

```bash
EMSCRIPTEN_KEEPALIVE
void example(const char& str) {
  std::cout << str << std::endl;
}
```

其次是C++里会因为重载特性编译后会把函数名称都重命名，不利于调用，需要使用extern "C"指定导出为C方法，
因此结合上述情况写成一个头文件方便调用。
先引入emscripten.h并定义一个导出方法。
写一个EM_PORT_API.h文件：

```bash
#pragma once
#ifndef EM_PORT_API
#	if defined(__EMSCRIPTEN__)
#		include <emscripten.h>
#		if defined(__cplusplus)
#			define EM_PORT_API(rettype) extern "C" rettype EMSCRIPTEN_KEEPALIVE
#		else
#			define EM_PORT_API(rettype) rettype EMSCRIPTEN_KEEPALIVE
#		endif
#	else
#		if defined(__cplusplus)
#			define EM_PORT_API(rettype) extern "C" rettype
#		else
#			define EM_PORT_API(rettype) rettype
#		endif
#	endif
#endif
```

引入上面的头文件，并导出斐波序列函数：

```bash
#include "EM_PORT_API.h"
EM_PORT_API(int) fib(int n) {
   if (n <= 1) {
      return n;
   }
   return fib(n-1) + fib(n-2);
}
```

# 编译

使用程序完成编译，编译后将生成一个.wasm后缀的文件，例如`math.wasm`，以下使用emsdk做示例。
先下载emsdk：

```cmd
git clone https://github.com/emscripten-core/emsdk.git
```

参考下载下来的readme.md说明文件进行安装，先进入emsdk：

```cmd
cd emsdk
```

执行说明文件的安装命令：

```cmd
./emsdk install latest
```

之后是是激活指定sdk版本的命令（实测我该命令每次重新开启命令行时需要重新执行，但按官方和别人的说法是只在修改版本时才需要）：

```cmd
./emsdk activate latest
```

执行一次即可的环境命令（实测第一次执行永久有效，但按官方和别人的说法是每次重新开启命令行时需要重新执行）：
linux：

```cmd
source ./emsdk_env.sh
```

window：

```cmd
./emsdk_env.bat
```

完成后就可以使用编译命令了，如果只是单文件可以用emcc/em++命令，需要指定编译的文件路径和输出的文件类型

生成纯粹的wasm：

```cmd
emcc ./main.cpp -o main.wasm
```

生成带有辅助的js+wasm：

```cmd
emcc ./main.cpp -o main.js
```

可以生成带有示例的html+js+wasm文件：

```cmd
emcc ./main.cpp -o main.html
```

# 加载

## 使用带有辅助的js+wasm

emsdk生成了带有辅助的js，已经默认加载到全局变量Model，在网页中通过RuningTimeInitial回调方法中即可调用wasm中的方法：

```javascript
var Model = {};
Model.onRuntimeInitialized = function () {
    Model._fibi(45);
}
```

## 纯wasm用于Js

若是在前端使用，可以创建一个scripts.js文件，用于加载.wasm文件：

```javascript
// 写一个通用方法用于加载不同的WebAssembly模块
function loadWebAssembly(fileName) {
    return fetch(fileName)
        .then(response => response.arrayBuffer())
        .then(buffer => WebAssembly.instantiate(buffer))
        // .then(buffer => WebAssembly.compile(buffer)).then(module => new WebAssembly.Instance(module))
        ;
}

//We call the function for math.wasm for the given Instance. 
const Model = {}
loadWebAssembly('main.wasm')
    .then(instance => {
        //  这里加载进来的函数名称是根据编译步骤决定的`_Z3fibi`或`_fib`，而非开发步骤中你所定义的函数名`fib`
        Model.fibc = instance.exports._Z3fibi;

    });
```

## 纯wasm用于Nodejs

Nodejs可以直接从本地加载文件，而不需要通过接口获取：

```javascript
const fs = require('fs')
const Model = {}
const buf = fs.readFileSync('./main.wasm')
const loadWebAssembly = WebAssembly.instantiate(new Uint8Array(buf)).then(res => {
    Model.fibc = res.instance.exports._Z3fibi
})
```

## 纯wasm调用

```javascript
Model.fibc(45)
```

以上方法将花费9秒左右完成计算并输出结果，如果用纯js编写类似的函数，调用后将花费13秒左右方可输出结果。

# dwarf调试

除了sourcemap能处理源码和编译后的代码的映射关系外，dwarf也是一种比较通用的调试数据格式(debugging data format)
,其广泛运用于c|c++等system programing language上。其为调试提供了代码位置映射，变量名映射等功能。
emscripten目前已经可以为生成的wasm代码带上dwarf信息。

```bash
$ emcc hello.cc -o hello.wasm -g // 带上dwarf信息 我们使用lldb和wasmtime进行调试     
$ lldb -- wasmtime -g hello.wasm
```

# 生成完整的CPP项目

不过Nodejs里本身也可以通过addon方式加载C++库，不过wasm则可以一次编译给前后端使用。

# 数据管理

emsdk还在wasm里提供了三种管理数据/文件FS的方式：

* 虚拟文件管理，实际放在内存里，无法持久化存储
* NODERAWFS，类Nodejs物理文件管理，可持久化，只能在Nodejs环境才能使用
* IndexDB数据库，Web前端的应该知道，类似本地数据库，可持久化，只能在浏览器环境里使用
* WORKER文件系统，适用于单个blob大文件

具体可以看这篇文件[emsdk-wasm文件管理](https://emscripten.quchafen.com/fileSystem/MEMFS/)

# WASI

全称Web-Assembly-Interface，即帮WebAssembly搭建一层中间层，用于让WebAssembly不单单可以跑在浏览器和Nodejs服务器上，而是可以直接在Window、Linux、Mac系统或者各种手机和设备上运行，并且有对应的系统功能接口。
其中WasmEdge提供了可以在命令行直接运行.wasm文件中的方法，或者将.wasm编译成其他适用于不同系统的原生库文件，如适用于Window的.dll，适用于Linux的.so，具体可看官方：[WasmEdge-为云原生而生](https://wasmedge.org)

# 参考文章

[C++程序转WASM](https://zhuanlan.zhihu.com/p/158586853)
