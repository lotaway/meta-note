# 梗概

这篇文章主要是收录如何学习Web 3D中的WebGPU和用途。
网页中的3D一般是通过操作Canvas相关API完成的，但由于性能有限，在众多需求中往往只能充当一个食之无味弃之可惜的角色，作为编程从业人员也有许多人像我一样不懂这方面的内容。
3D最大的用途往往是用于制作游戏，而制作游戏则往往是制作端游或者手游，网页游戏似乎等同于”差劲“的代名词，无论是玩家、开发者眼中都是垫底的选择。
不过未来情况可能将要改变，因为云主机游戏的兴起、浏览器的更新换代、更现代的WebGPU技术的发展，势必让网页游戏或者浏览器玩云游戏迎来大改革。

# 快问快答

## 兼容性

截止2023年9月19号目前只有Google Chrome浏览器支持，而微软Edge浏览器因为使用了Chrome内核所以也支持，而火狐Firefox等暂时还不支持。

## WebGL和WebGPU之间的区别

- WebGL是一种基于JavaScript的Web 3D图形API，它允许在Web浏览器中渲染3D图形。它使用OpenGL ES标准作为底层图形库，并通过JavaScript API提供了对图形功能的访问。
- WebGPU是Web 3D图形的新一代标准，它提供了更底层的访问和更高的性能。WebGPU是基于现代图形API（如Vulkan和Metal）的设计，它提供了更多的控制权和更好的性能优化。

总的来说，WebGL适用于较简单的Web 3D应用程序，而WebGPU适用于更复杂和要求更高性能的Web 3D应用程序。但需要注意的是，WebGPU目前仍处于实验阶段，并且在所有浏览器中的支持程度有限。

# Web 3D中处理不同领域需求的流程：

1. 游戏开发：游戏开发通常涉及创建游戏场景、角色和动画。您可以使用建模软件（如Blender、Maya或3ds Max）创建游戏中的3D模型和动画。然后，您可以使用编程语言（如JavaScript）和Web 3D框架（如Three.js）将这些模型和动画集成到Web游戏中。
2. 房地产和室内装修：在房地产和室内装修领域，您可以使用建模软件（如SketchUp）创建建筑模型和室内布局。然后，您可以使用Web 3D技术将这些模型嵌入到网站或应用程序中，以便用户可以在虚拟环境中浏览和交互。
3. 元宇宙和虚拟现实：元宇宙是一个虚拟的、可交互的世界，用户可以在其中进行各种活动。在元宇宙中，您可以使用建模软件创建虚拟环境、角色和物体。然后，使用Web 3D技术和虚拟现实设备（如头戴式显示器）将这些模型和环境呈现给用户。
4. 三维地图：在Web 3D中，您可以使用建模软件创建地理信息系统（GIS）数据的三维模型。然后，使用Web 3D技术将这些模型嵌入到地图应用程序中，以提供更丰富的地理信息可视化和交互体验。

## 3D模型有哪些建模软件可以处理和获取

在WebGPU中获取模型的方法有多种。以下是一些常见的方法：
1. 使用现有的模型库：您可以从现有的模型库中获取模型，这些模型库通常提供各种类型的模型，包括3D模型、动画模型等。一些常见的模型库包括Sketchfab、TurboSquid和CGTrader等。
2. 使用建模软件创建模型：您可以使用各种建模软件来创建自己的模型。一些常见的建模软件包括Blender、Maya、3ds Max和SketchUp等。这些软件提供了丰富的工具和功能，可以帮助您创建各种类型的模型。
3. 使用在线建模工具：除了传统的建模软件，还有一些在线建模工具可供使用。这些工具通常具有简单易用的界面和基本的建模功能，适用于初学者或快速原型开发。一些常见的在线建模工具包括Tinkercad、Sculptris和Clara.io等。

无论您选择哪种方法，都需要确保您的模型格式与WebGPU兼容。常见的模型格式包括glTF和OBJ等。您可以使用相应的导出选项将模型导出为这些格式，以便在WebGPU中使用。

## 建模软件的区别

Blender、Maya、3ds Max和SketchUp是广泛应用于不同领域的建模软件，但它们的主要用途略有不同：
- Blender：Blender是一款功能强大的开源建模软件，适用于游戏开发、动画制作、视觉效果等多个领域。
- Maya：Maya是一款专业的建模、动画和渲染软件，广泛应用于电影、电视、游戏和动画制作等领域。
- 3ds Max：3ds Max是一款专业的建模、动画和渲染软件，主要用于游戏开发、建筑可视化、产品设计等领域。
- SketchUp：SketchUp是一款易于学习和使用的建模软件，主要用于建筑设计、室内装修和景观设计等领域。

# 学习WebGPU

建议是先大概看一遍文档，大致知道如何创建三角形和矩形：

[API文档](https://doc.babylonjs.com/setup/support/webGPU)
[视频版学习文档](https://www.bilibili.com/video/BV11M41137UH)

通读文档后或者对WebGL等3D有大概了解后可以继续看orillusion出的实例版，将会讲解如何创建立方体、着色、动画、添加材质、光线、阴影等：

[视频版本](https://space.bilibili.com/1006136755/channel/collectiondetail?sid=385157)
[实例展示](https://orillusion.github.io/orillusion-webgpu-samples)
[图文版本](https://blog.csdn.net/m0_51146371/category_12015550.html)

# 收获

WSGL中：

* @vertex_index u32 顶点着色器内置变量，当前顶点索引值
* @instance_index u32 顶点着色器内置变量，当前物体的索引值
* @position vec4<i32> 顶点着色器的输出变量，片元着色器的输入变量，指代当前的像素点包含相机视角的4维坐标
* @local_invocation_id vec2<u32> 计算着色器内置变量，指代当前像素点在对应workgroup中的相对坐标
* @global_invocation_id vec2<u32> 计算着色器内置变量，指代当前像素点的全局坐标（不受设定的workgroup影响）

GPUBuffer中分为几种用途：
* VERTEX 顶点数据
* INDEX 顶点索引值数据，与顶点数据不同在于可自定义绘制的规则/顺序
* UNIFORM 日常用于添加变形位移矩阵等用途，但大小只有64kb，且在着色器中是只读，即只能从js中创建赋值后在着色器中读取，可以利用顶点着色器计算后作为返回值顺序递给片元着色器
* STORAGE 非常大，根据情况灵活使用，如添加大量原始顶点数据，且在WGSL中是可写，配合bindGroup跨越多个着色器或者回传到js里使用，例如A着色器中计算，B着色器中使用计算结果。
* MAP_READ 用于将GPU缓冲区的数据共享给另外一个缓冲区，需要配合`commandEncoder.copyBufferToBuffer`，之后使用`Buffer.mapAsync`可以给CPU（js）读取甚至写入，相当于`device.writeBuffer`的反转版本。

## CPU与GPU之间的数据共享

WebGPU里所谓的CPU操作指的其实就是js上的操作，而GPU操作则是commandEncoder里和wsgl着色器代码。
CPU写入到GPU使用的`device.writeBuffer`，而GPU中可以使用bindGroup在不同着色器之间共享数据。
GPU返回数据给GPU使用就比较麻烦，需要执行多个步骤：

```javascript
//  创建数据
const dataArray = new Float32Array()
// 创建数据缓冲区
const originBuffer = device.originBuffer(
    size: dataArray.byteLength,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
)
//  写入到GPU中
device.writeBuffer(originBuffer, 0, dataArray.byteLength)
const commandEncoder = device.createCommandEncoder()
const computePass = commandEncoder.beginCommputePass()
// ...使用commandEncoderh和pass配置各种GPU操作命令
computePass.end()
//  创建可映射共享GPU数据缓冲区的另一个缓冲区
const readBuffer = device.createBuffer({
    size: dataArray.byteLength,
    usage； GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST
})
// 复制对象缓冲区
device.copyBuffer(originBuffer, 0, readBuffer, 0, dataArray.byteLength)
//  提交前面配置的各种GPU操作命令和这次最重要的复制缓冲区命令
device.queue.submit([commandEncoder.finish()])
//  映射GPU缓冲区，使之变成CPU操作的内存片段，这里只要读取，因此为GPUMapMode.READ，注意这一步性能开销较大，是最关键的GPU映射到CPU的通讯操作
await readBuffer.mapAsync(GPUMapMode.READ)
//  操作内存片段共享给CPU缓冲区，这里是js环境因此呈现出来的是ArrayBuffer对象
const copyBuffer = readBuffer.getMappedRange()
// 映射成js可以执行操作的类型，这里使用了TypeArray，得到了最终的结果
const result = new Float32Array(copyBuffer)
console.log(result)
//  不使用时要显式释放，否则GPU无法操作这个缓冲区，获得的ArrayBuffer和映射的result也同样会被释放掉，想要保留result可以使用result.slice复制一份切片
buffer.unmap()
```

这种方法并不常用，因为性能高的情况就是CPU和GPU各做各的事情，建立数据通讯都会严重拖慢速度。
最常用就是利用`computePipeline`和`bindGroup`计算数据，其中可能有数十个computePipeline配合storageBuffer在不同管线之间共享数据执行计算，之后提供给着色器使用，全程除了一开始由CPU（js）提供必要的数据，执行调用流程外，其他动作都在GPU内部完成。

## 阴影

在物品上留下阴影，包括：
* 没被光线照射到的物体背面
* 光线照射到的物体在另外的物体上的投影

3D绘图中没有真实世界的所谓“阴影”，只能通过计算将对应片元设置为黑色。
这可以借助一个巧妙的方式进行，那就是先行使用一个渲染管线将灯光作为视角进行深度测试，找到灯光与一众物体的第一交点作为被照射点，在第一交点之外的点则应当属于阴影范围内，这个管线可以称为阴影管线，只需要计算顶点无需片元和色彩等，速度快。
之后再使用另一个渲染管线进行真实视角渲染顶点和片元，前面阴影计算出来的结果通过存入bindGroup的阴影贴图进行传递。
渲染管线中的顶点渲染要计算出三种坐标：
* 世界坐标，相当于物品在canvas世界中的真实坐标，除非物品本身移动变形否则不会变化。
* 相机视角下的坐标，相当于摄像机看到的物品世界坐标，会出现近大远小的效果，用于GPU绘制画面，根据摄像机位置和物品而变。
* 灯光视角下的坐标，用于查找灯光贴图的深度信息，阴影坐标。
注意贴图UV的坐标范围为[0, 1]，而MVP转换的坐标范围为[-1, 1]，因此可以通过 * vec2(0.5, -0.5) + vec2(0.5, 0.5)来完成从MVP到贴图的坐标映射。
之后在片元渲染中使用内置的textureSampleCompare函数对比灯光坐标和深度贴图计算出结果。
结果为两种：
* 0表示坐标z值比贴图的z值大，不是第一交点，应当覆盖阴影。
* 1表示坐标z值比贴图的z值小或者相等，是第一交点，应当用灯光照亮。
当然也可以用内置的textureSample函数获取z值手动对比。

关于优化：
* 灯光入射角度与贴图有倾斜角，加上贴图像素点可能有重叠导致判断误差，最终造成画面有黑白波纹条，可以让坐标z值在对比时稍微下沉-0.005来去除这种现象。
* 阴影边缘锯齿化，可以采用均值滤波器，即对坐标周围进行多点采样取均值，来柔和模糊阴影边缘，使其显得更加真实，但可能造成性能负担。
* 利用`device.createComputePipeline`和`commandEncoder.beginComputePass`,`computePass.dispatchWorkGroups`搭配storageBuffer和uniformBuffer传递数据来创建专门用于计算的管线。