@[TOC](基础架构开发-操作系统、编译器、云原生、嵌入式、ic)

# 操作系统

以C和Rust为主。
开发上一般是基于Linux开源版本进行重构或者二次开发，也有为了学习或者科研的目的从头开始构建，但依旧会借鉴Linux系统。

在操作系统之下有几种软件架构开发是比较重要的——编译器、云原生容器、数据库等。

# 编译器

编译器算是一种基于操作系统的软件开发，任何高级开发语言都是基于编译器才能编译成机器码或者汇编给操作系统执行。

## 词法分析

先分类，例如关键字、数值、字符、变量名/函数名、符号、运算符（符号和运算符可能有重叠）等，再进行语法分析，得出变量/函数/类/结构体的声明与定义、指针、赋值、判断、循环、函数。
之后对其上下文和指针在栈进行处理。
这个解析过程是使用正则进行大部分判断，可以把输入都当作一个个单词来考虑，例如`int`关键字正则就是`int\s`
，函数式的判断例如`void add(int a, int b) {}`使用正则是`void\s[^(_|[a-b]){1}a-bA-Z_0-9]*\([^\)]*\)\{[^\}]*\}`
而数值要注意可以根据开头或者结尾区分二进制、四进制、八进制、十进制、十六进制等，也要根据符号位区分正数、负数，根据小数点区分整数、浮点数。
词法和语法分析其实与AST语法树生成有紧密联系，只不过同时这种分析也要用于编辑器ide本身的即时提示和纠错。

## AST语法树生成

一般是先中间后两边的树结构，例如a=1的赋值语法，父节点就是=，左节点是a，右节点是1，同理扩展到函数定义，void main(int num) {/
*函数体*/}，中间是函数名，左边是参数值，右边是函数体，且挂靠孙子节点为返回值类型。

## 语法优化

## 生成机器码

要点：

* 寄存器的分配，通过变量-图的着色算法RCG（Register Conflict
  Graph）来整理适用范围、冲突从而决定寄存器的分配，高级点的系统有16~32个寄存器，低级系统只有8个寄存器。
* 指令码的生成（查CPU手册）
* 特殊处理，如循环需要考虑具体的机器码生成，由于同一条指令最多只能使用3个寄存器，因此会出现对寄存器的预分配导致循环体内的代码顺序与实际处理后的顺序不一致的情况（会出现例如代码赋值是在真假判断里，而生成后是在判断外面，内存失去控制）。

# 云原生容器开发

以C++、Rust和Golang较为常见。

## 一般遇到的岗位描述

基础架构小组，致力于研发资源架构技术，跟进最前沿的云原生网络场景，参与云原生开源社区最前沿的技术
工作职责：

1. 负责云计算网络转发面架构与研发，包括、容器网络、虚拟化、软硬件结合等云网络和云原生技术；
2. 负责云网络数据化、网络优化以及线上运维等工作；
   任职要求
1. 精通C/C++/Go中的一种或者多种高级语言，熟悉一种或者多种脚本语言，如shell、python等；
2. 深刻理解路由交换原理，及二三层网络协议栈实现；
3. 深刻理解操作系统原理，有较好的系统架构和设计能力；
4. 有多核平台下开发及性能调优经验，如RDMA、DPDK等；或有丰富的高性能服务器网络编程经验；
5. 喜欢挑战性的工作，饱满的工作激情，能承受工作压力，有较强的自我驱动能力；
   有以下经验者优先：
1. 有Kubernetes/Cilium/Calico/eBPF/CNI 等开源社区贡献者优先；
2. 有 NFV和VNF 经验者优先；

## RDMA、DPDK是什么东西

RDMA（Remote Direct Memory Access）和DPDK（Data Plane Development Kit）是在多核平台下进行开发和性能调优的两个重要技术。

1.
RDMA：RDMA是一种网络通信技术，它允许在不经过CPU的情况下，直接在内存之间进行数据传输。RDMA技术通过绕过操作系统内核，将数据传输的负载从CPU转移到网络适配器上，从而提高了网络传输的效率和性能。RDMA常用于高性能计算、云计算和大数据等领域，可以显著提升数据传输的速度和降低延迟。

2.
DPDK：DPDK是一个用于数据平面开发的软件开发工具包。它提供了一组优化的用户态库和驱动程序，用于加速数据包处理和网络应用的性能。DPDK通过绕过操作系统内核，直接在用户态进行数据包处理，从而减少了系统调用和上下文切换的开销，提高了网络应用的吞吐量和响应速度。DPDK常用于网络功能虚拟化（NFV）、软件定义网络（SDN）和高性能网络应用等领域。

这些技术在多核平台下的开发和性能调优中发挥了重要作用。它们可以提高系统的吞吐量、降低延迟，并充分利用多核处理器的计算能力。然而，使用这些技术需要深入理解底层硬件和网络协议，并进行相应的编程和配置。在实际应用中，需要根据具体的场景和需求，选择合适的技术和优化策略，以达到最佳的性能和效果。

## NFV和VNF是什么

NFV（Network Functions Virtualization）和VNF（Virtualized Network Function）是与网络功能虚拟化相关的两个概念。

1. NFV（Network Functions
   Virtualization）：NFV是一种网络架构和技术范式，旨在将传统的专用网络设备（如路由器、防火墙、负载均衡器等）转变为基于通用服务器和虚拟化技术的软件实现。NFV的目标是通过将网络功能从专用硬件中解耦，将其作为虚拟化的软件实例在通用服务器上运行，从而提高网络的灵活性、可扩展性和成本效益。

2. VNF（Virtualized Network
   Function）：VNF是在NFV架构中运行的虚拟化网络功能。它代表了传统网络设备的虚拟化实例，可以在通用服务器上以软件的形式运行。VNF可以包括各种网络功能，如路由、防火墙、负载均衡、加密解密等。通过将这些网络功能虚拟化为软件实例，VNF可以根据需要进行动态部署、配置和管理，从而提供更高的灵活性和可定制性。

NFV和VNF的引入使得网络的部署和管理更加灵活和高效。它们可以帮助提供商在网络中快速部署和调整各种网络功能，同时降低了硬件成本和维护成本。这些概念在网络领域中得到广泛应用，特别是在云计算、软件定义网络（SDN）和网络运营商等领域。

## Rust示例实现

想要作为操作系统，则几乎所有标准库的代码都需要自行实现，例如输入输出流、打印日志、错误抛出等。

电脑启动过程[参考](https://os.phil-opp.com/zh-CN/minimal-rust-kernel/)：
1. 启动烧录在主板上的固件，即老旧的BIOS或者现代的UEFI，用于自检和初始化其他硬件；
2. 固件会查找到可引导的存储介质中的内核程序，找到后交给引导程序（bootloader，512bytes）控制；
3. 引导程序会负责完成（BIOS启动的）16位系统兼容模式切换到32位保护模式，最终到64位长模式，之后所有寄存器和主内存可用；
4. 内核被引导程序启动后可以收到从BIOS到引导程序传递过来的信息。

以下是最简的一个操作系统，需要指定不使用标准库和main函数（作为操作系统需要_start函数来启动，而无法认main函数），并且借助简单的C库来实现一个不断循环的主函数和一个错误抛出函数。

```rust
#![no_std]
#![no_main]

use core::panic::PanicInfo;

#[panic_handler]
fn panic(_info: &PanicInfo) -> ! {
    loop {}
}

#[no_mangle]
pub extern "C" fn _start() -> ! {
    loop {}
}
```

以上就是一个可以正常运行的“操作系统”，当然这个所谓操作系统没有做任何事情，也无法真正运行。
按照编程惯例将它改成可以在运行后输出Hello World的操作系统：

```rust
#![no_std]
#![no_main]

use core::panic::PanicInfo;

#[panic_handler]
fn panic(_info: &PanicInfo) -> ! {
    loop {}
}

static HELLO_WORLD: &[u8] = b"Hello World!";

#[no_mangle]
pub extern "C" fn _start() -> ! {
    let vag_buffer = 0xb8000 as *mut u8;
    for (i, &byte) in HELLO_WORLD.iter().enumerate() {
        unsafe {
            //  填入字符
            *vga_buffer.offset(i as isize * 2) = byte;
            // 设定颜色
            *vga_buffer.offset(i as isize * 2 + 1) = 0xb;
        }
    }
    loop {}
}
```

接着需要先创建一个用于程序构建到目标系统运行的JSON配置文件如x86_64-blog_os.json，并填入以下内容：

```json
{
    "llvm-target": "x86_64-unknown-none",
    "data-layout": "e-m:e-i64:64-f80:128-n8:16:32:64-S128",
    "arch": "x86_64",
    "target-endian": "little",
    "target-pointer-width": "64",
    "target-c-int-width": "32",
    "os": "none",
    "executables": true,
    "linker-flavor": "ld.lld",
    "linker": "rust-lld",
    "panic-strategy": "abort",
    "disable-redzone": true,
    "features": "-mmx,-sse,+soft-float"
}
```

在.cargo/config.toml文件中指定core库，这个库因为现在用了自定义的目标系统而无效，需要手动指定进行重新编译：

```toml
[build]
# 不想每次执行cargo build都需要添加 --target参数的话可以固定填在这里
target = "x86_64-blog_os.json"

[unstable]
build-std-features = ["compiler-builtins-mem"]
build-std = ["core", "compiler_builtins"]
```

接着需要实现bios所需的引导程序，而这需要使用汇编语言，可以选择内联ASM汇编，这里取巧使用已经写好的引导加载程序GNU GRUB，这是一个极受欢迎的程序。
直接在cargo.toml中引入bootloader库：
```toml
[dependencies]
bootloader = "0.9.23"
```

接着执行以下命令来将写好的程序代码生成为可引导镜像：
```bash
cargo install bootimage
cargo bootimage
```

到这里完成后就成功生成了可在虚拟机中执行的系统内核文件.bin了！
可以尝试在[QEMU](https://www.qemu.org/)中使用以下命令启动内核：
```bash
qemu-system-x86_64 -drive format=raw,file=target/x86_64-blog_os/debug/bootimage-blog_os.bin
```
运行成功即可弹窗显示Hello World!
![运行成功弹窗](https://os.phil-opp.com/zh-CN/minimal-rust-kernel/qemu.png)

这是一个简单的示例，实际上远远没有达到一个完整操作系统的要求，需要可以看一个更加完整的源码示例自行研究：
[Redox-OS in GitLab](https://gitlab.redox-os.org/redox-os/redox/)

## RisingWave云原生存储引擎开发实践[try数字输入.java](..%2F..%2F..%2F..%2F%B4%F3%D1%A7%2F%BF%CE%B3%CC%2FJava%B3%CC%D0%F2%C9%E8%BC%C6%2Ftry%CA%FD%D7%D6%CA%E4%C8%EB.java)

云原生流式数据库，特点是数据通过流的方式不断写入，难点在于保留数据库特性，例如一致性和持久化。
假设现在有以下表结构：

```sql
# 出价表
CREATE TABLE Bid
(
    auction BIGINT COMMENT ‘拍品’,
    price   BIGINT COMMENT ‘单次出价价格’
);
# 拍品表
CREATE TABLE Auction
(
    id        BIGINT COMMENT ‘标识’,
    item_name VARCHAR COMMENT ‘拍品名称’
);
```

执行关联查询拿到拍品的一些信息和均价：

```sql
SELECT A.id                            AS auction_id,
       A.item_name                     AS auction_item_name,
       COUNT(B.auction)                as bid_count,
       SUM(B.price) / COUNT(B.auction) as bid_avg_price
FROM Auction A
         JOIN Bid B
              ON A.id == B.auction
GROUP BY A.id, A.item_name;
```

若每张表都有几百万数据，这么计算可能延迟性比较大，更常见的是做成VIEW视图查询。
云原生中会将两个源数据（这里是两张表）进行雾化成视图的形式，再进行聚合操作，过程中视图会使用流式传输持续加入新的数据，从而对下游形成新的聚合结果。
这个过程中会利用Hash对数据更新进行一个判断，并且状态会使用一些key-value的抽象化存储模型。

需要完成状态一致性：
* source无界数据流（实际是有界的，利用这点是可以计算出是否一致）
* source从开头到任意范围内的数据位有界数据子集
* 流式计算中所有的状态和source对应的范围是一致的
* 系统初始化后则达到一致性的状态
* 集群出错后可以恢复到一致性的状态
* 查询和实际的source必须保持一致，而不是source增加了新数据后查询依旧是旧的状态

这种状态流更新是利用Inject Barrier的方式，将source切片计算Hash等值确认后再进行传输处理。
利用分布式模型分别处理这些切片，这里再次利用Hash计算source主键来确保各自处理的切片段数据只被处理了一次而不会重复。
以上过程利用key-value将这些抽象化存储模型按照一定大小存储为本地持久化不可变的索引文件，而为满足要求大小的新数据则继续保持创建为新的barrier。
这种方式就是可以依靠barrier作为边界来来维护一致性，也可以从错误中快速恢复和完成异步检查，也可以并行完成各种操作。

整体是分享+分布式集群方式，嫁接在多个数据源之上，统一调度完成计算而不需要用户关心多个数据源或者拆分的数据库如何聚合统计的问题。

# 单片机、嵌入式

一般是汇编、C/C++和Android的领地，会涉及少量硬件知识，充斥各种大小型家电设备、电动玩具、无人机、车载系统、柜台、LED展板等。
嵌入式设备一般内存有限，还可能是定制电路板有自己一套编程规则，但大体都是用汇编或者基础C语言，车载设备和柜台、电视盒子等智能家电则是Android制霸。
工作中需要大量与各种蓝牙/USB协议、串口、雷达/摄像头等传感器打交道。
也有特化赛道就是智能机器人等。

## 雷达

机器人是通过各种感应器持续反馈进行雷达式检测周围环境，从而完成2D乃至3D建模地图，从而可以执行后续的路线规划和行进动作。

具体可以参考：
[扫地机器人的两种测距方式：TOF激光雷达和三角测距](http://news.sohu.com/a/602542429_121430561)

## 路线规划

如果不是完全动态的线路而是先建立好了地图，则机器人需要通过gps等定位自己当前的位置，从而按照预规划好的路线行进。
而一般机器人会搭载一个基础操作系统，完成大部分与硬件交互和基础工作。如[Autolabor的ROS系统](http://www.autolabor.com.cn/)
就可以完成“雷达-导航-地盘”的系统操作。

[ROS编程教程](https://blog.csdn.net/ArtoriaLili/article/details/125162278)

[用ROS程序发布导航目标点](https://zhuanlan.zhihu.com/p/413587126)

# ic开发

ic即集成系统，ic开发一般是指ic芯片开发，也会分为前后端，需要掌握大量底层软硬件知识，是混合了电路设计和硬件编程的开发岗位。