@[TOC](Java-原理源码解析-JVM、GC、JNI、C++实现)

# JVM原理

JVM即Java虚拟机（Java Virtual Machine），虽然名称带有Java，但实际上只要能编译成.class字节码文件的话，任意代码都能运行在JVM上，例如Java、Kotlin，甚至Javascript等。
不过以下只讨论Java的情况。

需要掌握：

* 加载字节码（.class文件）的过程
* 类加载器
* 双亲委派机制的加载方式
* 虚拟机运行时数据区：Java栈（虚拟机栈）、方法区、堆、常量池、程序计数器、本地方法栈（native）
* GC，垃圾回收机制
* 简单的调优

具体参考：[JVM原理-超详细总结](https://blog.csdn.net/weixin_45105261/article/details/110311485)

### 类加载器

* Boostrap ClassLoader 启动类，支撑JVM的核心类库，位于本地jdk/jre/lib目录下
* Extension ClassLoader 扩展类，支撑JVM的扩展类包，位于本地jdk/jre/ext目录下
* Application ClassLoader 应用程序类，加载ClassPath路径下的包，既开发项目打包成的应用程序包
* User ClassLoader 用户自定义类，主要是用户本地自定义路径的类加载

具体参考：[类加载、链接和初始化 C++源码解析](https://www.jianshu.com/p/de2a1c641bd0)

# GC垃圾回收机制原理

需要掌握分代、垃圾判断、回收算法

[GC的基本原理](https://www.jianshu.com/p/5ee8efee6738)

## 对象创建内容

当在堆中创建对象时，如类实例、字符串、数组等，实际上会创建包含一系列内容存储：

* 对象头，包含锁、GC标记、分代年龄等
* 实例数据
* 对齐填充，让对象强制变成占用8字节倍数的内存

## 指针碰撞与内存空闲列表

指针碰撞和内存空闲列表都是为了满足对象内存分配使用的。

* 指针碰撞：适用于内存比较完整的情况。在内存空间中维护一个指针，确保指针左侧内存都是已经被分配的，指针右侧内存都是未被分配的，这样每次创建对象时就只需要根据所需内存大小移动指针即可。
* 空闲列表：适用于内存碎片化的情况。由于每块可用的连续内存不一定能满足对象创建所需，所以需要将每块连续内存的大小存储为一个列表，当需要分配内存给对象时即会在空闲列表里查找合适的内存块进行分配。
  以上两种方式都会因为多线程并发导致重复使用同一块内存的情况，因此一般需要使用CAS和TLAB方式处理。
* CAS，指针比较移动（Compose And Swap）,既当需要分配指针时，会再次将指针与实际内存中的指针进行比较，确定指针位置无误再进行分配。
* TLAB，线程本地方法缓冲区（Thread Location Application Buffer），即在应用程序启动时就给不同的线程预先分配内存，这样就不会因为线程并发导致内存分配冲突。

## 判断是否垃圾

最开始使用的是对象引用计数，即保留一个count计数器计算对象被引用次数，每多一个引用对象就加1，当引用对象被销毁时就减1，当引用次数为0时则标记为垃圾。
然而这种方式在AB对象互相引用时两者的count都为1，导致不可回收，但实际两个对象可能根本没使用。
现在是采用可达性计算，指定若干类型根节点（GC Root），被根节点引用的对象视为可达（非垃圾），没有被根节点引用的视为不可达（垃圾），打上标记后在执行分代清理时被回收。
满足以下类型即被视为根节点：

* Java栈/本地变量
* 本地方法栈中的JNI，即Native方法，由C++实现，使用时Java开辟内存动态链接这些方法并一直保留
* 方法区的类静态属性和常量
* 被老一代引用的年轻代（为了免去在回收年轻代时还得去遍历老年代是否有用，直接视为有用）

## 垃圾回收算法

* 标记算法，单纯对对象进行标记，当需要回收时直接清除。缺点是容易产生碎片。
* 复制算法，内存分区，保留一片空白区，只使用另一片，当需要回收时将存活的对象复制到另一片，之后清空当前片。之后每次回收重复以上过程。缺点是需要保留大片空白，内存利用率不高。
* 标记整理算法，类似标记算法，但释放垃圾后会对内存进行整理，减少碎片。
* 分代收集，即JVM一直在使用的新生代Eden、S0、S1和老年代，根据对象存活时长分配到不同区域，并采用不同的垃圾回收算法。

# 多线程同步-synchronized和Lock

简单讲synchronized是关键字，实现的是阻塞非公平锁，可指定存锁对象，支持方法和代码块，自动加锁解锁，由ObjectMonitor实现。
Lock是interface接口，实现的是非阻塞可中断锁，支持非公平锁和公平锁，只能用于代码块，可自定义实现，需手动加锁解锁，由AQS实现。

[synchronized和lock的区别](https://baijiahao.baidu.com/s?id=1745216085045248658)

# ObjectMonitor

ObjectMonitor对象内置锁是synchronized关键字的底层实现。
[Java多线程-对象内置锁（ObjectMonitor）](https://www.cnblogs.com/myf008/p/16396915.html)