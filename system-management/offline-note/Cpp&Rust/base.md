@[TOC](C++基础-介绍·数据结构·排序·算法)

# 特点

C++是一门风格严谨又不失自由的开发语言，提供了完整的内存管理、支持函数式编程和面向对象编程，支持模板、多继承、多实现、重载、重写等多态特性。
优势在于目前90%的操作系统、数据库、应用基础架构、硬件嵌入式等都是使用C/C++制作的，而C++是对C的标准扩展，掌握C++的过程中也能比较好地掌握C本身。
缺点也比较鲜明，由于原始指针需要操作内存，并且有各种引用、双重引用、移动语义非常容易让新手望而生畏，即使后来有智能指针后也由于带有额外的资源消耗而被诟病。
最大的缺点在于对中国国内流行的互联网环境支持性不好，在大量Java、Go、Python流行作为服务后端开发语言时，C++却在这方面并没有易于使用的框架或者基础辅助快速构建后端服务。

# 使用方向

* 底层、基础架构、数据库开发，如RPC协议、Redis、Nginx、RocketMQ中间件
* 音视频
* 游戏引擎
* 网络安全、sdn
* 结合mfc/qt做软件
* linux嵌入式、芯片
* 虚拟化、操作系统

# RPC

RPC即远程调用（Remote-Procedure-Call），指的是在分布式应用程序中，由于不同的服务程序处于不同的进程甚至不同服务器中，需要通过各种协议进行调用，例如网站之间可以通过HTTP协议调用彼此的接口，或者通过TCP/UDP协议完成即时传输，而使用RPC是程序之间高效传输的最佳选择。
其中有谷歌通用框架gRPC
SDK，包含了在不同开发语言中的RPC实现，还有[protobuf（Google Protocol Buffer）](https://blog.csdn.net/weixin_42905141/article/details/125272803)
实现了一种自定义数据格式用于消息传输，相比xml、json体积更小，解析速度更快。

# Data Struct 数据结构

## 栈 Stack

连续存储空间，出入口为同一个，只能先进后出，后进先出。

### 内存分配中的栈

栈即指一种数据结构，也是操作系统分配给程序的内存空间，也采用了类似数据结构栈的分配方式，程序中定义变量和函数调用时是分配到空间栈里。
在程序中，栈的分配与删除处理都很快，相当于移动指针，几乎只是一条CPU指令就能完成。
栈会所在作用域结束时会自动删除来释放内存，例如在方法里创建栈变量会在方法结束后删除，甚至可以在方法内部添加花括号来加速栈变量删除。

## 队列 List

出口和入口各独立一个，先进先出，后进后出。

## 数组 Array

连续存储空间，有序，带有索引，可重复。可以高效率根据索引查找，但增删时涉及移动其他项导致效率慢。

## 链表 LinkTable

节点存储有数据和指向下一个节点的地址，多个节点串联起来，因为这种特性让增删节点比数组高效，但查询需要从头到尾遍历导致效率比数组低。
双向链表：让表的链接从头到尾，从尾到头两个方向都有地址指向，让头尾都可进行增删改，因此对头尾元素的处理更方便。
大部分Collection和List都是用数组混合链表，可以比较好地确保存入顺序和高效的增删改查。

## 树 Tree

从一个根节点出发，每个节点带有若干个子节点，并且这些子节点同样可以带有自己若干个孙子节点，这样就叫树结构。其中主要是二叉树。
大部分Map，Set底层就是链表混合树结构，具体看是否需求有序和排序等。

### （普通）二叉树

每个节点上所包含的子节点不超过2个即称为二叉树，没有按照一定规律存储数据的二叉树没有任何搜索查找优化，不值得使用。

### 二叉查找树 Tree Search

将普通二叉树的数据按照一定规律存储即称为二叉查找树，一般规律是所有父节点都比左子节点大而比右节点小。
这样搜索时，可以通过从父节点开始比对，从而快速决定在左子树还是右子树继续查找，类似二分查找。

### 平衡二叉树

所有父节点的左右子节点高度差不超过1的二叉查找树就称为平衡二叉树。
在增删数据时，为了保持平衡，二叉树需要进行旋转操作，常见有：

* 左左，在根节点的左子节点中的左子节点添加数据时，需要进行一次右旋达成平衡。
* 左右，在根节点的左子节点中的右子节点添加数据时，可能需要进行一次局部左旋后再进行整体右旋。
* 右右，在根节点的右子节点中的右子节点添加数据时，需要进行一次左旋达成平衡。
* 右左，在根节点的右子节点中的左子节点添加数据时，可能需要进行一次局部右旋后再进行整体左旋。

### 红黑树

含有颜色标记的非平衡二叉树，规则：

* 节点都为红色或者黑色
* 根节点和Nil叶节点必须为黑色
* 若是没有子节点或者没有父节点，则将该链接点标记为Nil叶节点
* 红色节点之间不能互相连接
* 从同个节点到后代所有Nil叶节点的路径上，每条路径所包含的黑色节点数量都是相同的（通过变红处理）

插入数据时一般默认为红色，根据情况才需要处理为黑色。

### B-Tree和B+Tree B树和B+树

B/B+树是一种多路平衡树。每个父节点拥有1~
3个子节点。区别在于B树每个节点都同时存储索引和值，而B+树只在叶子节点存储值并用双向链表链接，而所有非叶子节点存储索引，B+树的优势在于范围遍历数据时只需要找到两端叶子节点后进行同层级遍历，而B树无法如此做，在纯查找时B树会稍快一点。

## 堆 Heap

堆是完全二叉树，用数组存储，堆中某个节点的值总是都不大于父节点，或者都不小于其父节点的值。
其中特殊的有：

* 最大堆：根节点的键值是所有堆节点键值中最大者，且每个父节点的值都比其子节点的值大。
* 最小堆：根节点的键值是所有堆节点键值中最小者，且每个父节点的值都比其子节点的值小。

### 存储方式

由于堆存储在一维数组中，对数组长度为n，索引为i的结点适用的公式：
* 父节点：i为0时该节点为根结点，无父节点；否则父结点为`(i-1)/2`（向下取整）；
* 左子节点：如果`2*i+1>n-1`，则该节点无左子女；否则左子节点为`2*i+1`；
* 右子节点：如果`2*i+2>n-1`，则该节点无右子女；否则右子节点为`2*i+2`。

### 内存分配中的堆

数据结构的堆是数组存储的完全二叉树，而内存空间中的堆与之毫无关系，存储方式通过读写空闲内存列表进行，结构类似链表。
操作系统分配内存空间给程序，除了自动管理的栈分配外，就是这种需要手动管理的堆分配。
在操作系统分配内存空间中，栈与堆都是存放在内存里的，只是位于不同地方，通常栈使用一级缓存，堆使用二级缓存。
程序专门开辟使用的内存存储空间，采用类似树结构储存，如果开发语言没有设定垃圾收集机制的话，需要程序员手动操作释放或者等程序结束才会回收。
堆的分配和删除很慢，程序需要维护、查找内存空闲列表也有消耗，一般通过new和delete关键字使用，两者都需要好几条指令完成，因此也造成大量资源消耗。
程序需要维护、查找内存空闲列表也有消耗。
new相当于自动调用malloc（memory allocate）分配堆内存。

# Sort 排序

## 冒泡排序

通过不断对比临近索引的值，经过多次循环完成排序。

```bash
int arr[7] = {5,1,9,11,3,2,7};
for (int i = 0; i < 7; i++) {
  
}
```

## 选择排序

通过先将指定索引的值与所有其他数进行对比交换，之后经过多次循环完成所有指定索引的值的对比。

## Insert Sort 插入排序

先找到前面有序的部分，和后面无序的分开，之后通过类似冒泡排序的方式完成将后面无序的部分插入到前面有序的部分。

## Quick Sort 快速排序

先找到基准值，如索引0的数值，之后让所有大于基准值的数放置到基准值右边，让所有小于基准值的数放置到基准值左边，之后分别对左右两个子数组再次执行上述操作，直到最后两个数完成校准，即完成排序。
由于这种基准值对比方式大部分情况下时间复杂度低，因此称为快速排序，但如果使用的基准值恰好一直是最小/最大值（如取索引0但数组本身就是排序好的），这种效率会非常低，因此有随机取出基准值进行排序的方式，称为
**随机快速排序**。

## Merge Sort 归并排序

通过递归的方式合并成一个有序数列，我们称之为"归并排序"。
一般是将无序的数组铜鼓两两对比重新排序，并逐步扩大4个数对比、8个数对标，最终让整个数组变成有序数组。

### 从下往上的归并排序

1. 将待排序的数列分成若干个长度为1的子数列，然后将这些数列两两合并；
2. 得到若干个长度为2的有序数列，再将这些数列两两合并；
3. 得到若干个长度为4的有序数列，再将它们两两合并；
4. 重复以上步骤直到合并成一个数列为止，这样就得到了我们想要的排序结果。

### 从上往下的归并排序

它与"从下往上"在排序上是反方向的，包括3步：

1. 分解：将当前区间一分为二，即求分裂点 mid = (low + high)/2；
2. 求解：递归地对两个子区间a[low...mid] 和 a[mid+1...high]进行归并排序。递归的终结条件是子区间长度为1；
3. 合并：将已排序的两个子区间a[low...mid]和 a[mid+1...high]归并为一个有序的区间a[low...high]。

## Bucket Sort 桶排序

先将元素分别放到若干个桶里，之后分别对每个桶中的元素进行排序，都完成后再重新合起来进行排序。
适合原本就有一定顺序的数组，可以直接按索引进行多段拆分，这样分桶时只是拆分了原本就处于不同顺序的部分，能加快排序速度，且实际最终合并几乎不需要再次排序。

## Counting Sort/Hash Sort 计数排序/哈希排序

计数排序是桶排序的变种，原理是先定义一个索引从0~
9且每个值都为0的计数数组，之后遍历原有数组，将值与计数数组索引对应，对其进行计数，如值为1就对数组索引为1的值进行加1，值为3就对索引为3的值加1。
最后根据计数数组按顺序即可重新还原为有序数组。
这也是哈希表的基础支撑，存储值经过算法可与索引值对应上，通过此基础完成数组/桶+链表结构下的哈希键与实际值的存储。

## Radix Sort 基数排序

基数排序也是桶排序的变种，原理是先顶一个一个索引从0~9的二维数组用于存储值，之后遍历原有数组，根据相应位数的值进行多次排序最终变成有序数组。
第一次遍历对应个位数的值将其存储到二维数组相应位置，完成后再按照二维数组顺序还原到原有数组中；
第二次遍历对应十位数的值将其存储到二维数组相应位置，完成后再按照二维数组顺序还原到原有数组中；
第三次遍历对应百位数；
第四次遍历对应千位数；
第n次遍历后完成最终的有序数组。

## Shell‘s Sort/Diminishing Increment Sort 希尔排序/缩小增量排序

改进的插入排序，通过先根据增量分组，之后对不同分组执行跳跃式的插入排序，之后重复此行为直到增量为1，通常初次增量为数组长度n的一半，即n/2，之后减半再次执行插入排序，重复行为直到为1。

## Heap Sort 堆排序

堆排序即通过将一个存储在数组中的堆通过交换节点，并把最大值、次大值...直到最小值依次交换到数组尾部中，完成有序排序则称为堆排序。

# Algorithm 算法

## Binary Search 二分查找/折半查找

（前提：数据必须是有序的）先拿到中间索引的值进行对比，得到想要的值在左半边还是右半边，之后对所在的半边再次执行拿到中间索引的值进行对比后分半的操作，重复循环直到找到目标。
此方法适合数据量巨大但已经排序好，且分布比较规律的。
如果只是分布不规律可以采用黄金分割或者根据情况判断采用三分之二而非二分之一。

```bash
int arr[15] = {1,2,3,6,8,11,19,22,29,48,51,54,62,88,110};
```

## Block Search 分块查找

（前提：先完成数据分块，块内可以无序，但块之间必须有序。）根据需要在对应的数据块再进行查找，减少循环所需次数。

## Tree Search 树查找

树一般是二叉树或红黑树等已经有序的树结构，可以根据树特性借助递归轻松完成查找。

## Secure Hash Algorithm 哈希算法

通过使用哈希表记录的方式，尽可能减少循环次数。

## Floyd's Tortoise and Hare/Circle Detection 龟兔赛跑算法

通过使用索引先求链表的方式，尽可能减少带有规律的数组的时间复杂度。

```javascript
/**
 * 判圈算法找到数组里的重复项（判圈算法又称龟兔赛跑算法）
 * @param {Array<number>} nums 需要找出重复项的数组
 */
function findDuplicate(nums) {
    let tortoise = 0, hare = 0;
    while (tortoise !== hare && hare !== undefined) {
        tortoise = nums[tortoise];
        hare = nums[hare];
        if (hare !== undefined) {
            hare = nums[hare];
        }
    }
    if (hare === undefined) return hare;
    tortoise = 0;
    while (tortoise !== hare) {
        tortoise = nums[tortoise];
        hare = nums[hare];
    }
    return hare;
}
```

## 递归算法

通过拆分出重复的规律作为函数并自己调用自己大幅减少内存占用。

# 计算机网络

[计算机网络的七层结构、五层结构和四层结构](https://blog.csdn.net/sinat_40770656/article/details/113787888)

## 不同语言互相调用框架

* 用于C++与Java构建成同个项目：[jni](https://blog.csdn.net/huangxiaominglipeng/article/details/41447557)
* gRPC 谷歌的远程调用框架
* protobuf 远程调用消息格式与框架