# SVG基础

## 概述

由于这里涉及的其实是设计师负责的部分，如果要研究请结合Adobe illstrator或者其他SVG图形设计工具进行理解，
这里暂时不做太多解释，只需要知道SVG是利用点、线、面的方式来制作图形即可。
相比开发传统使用的画布来说，明显画布虽然同样使用点线面绘制，但呈现是位图形式，即实际的画布大小会影响画面精致度。
相比之下SVG直接使用矢量图的方式呈现，所以就算直接将其以更大的尺寸呈现也不会导致马赛克化。
当然代码里直接绘制的SVG是无法利用CSS属性的width和height进行放大的，只有使用资源引入才可以。
代码里直接绘制的SVG最大的优势就是可以应用各类CSS动画和JS操作变化。

## 几种图形

* rect 矩形，通过起点(x1,y1)坐标和终点坐标(x2,y2)组成一个矩形
* circle 圆形，通过圆点坐标(x,y)和半径radis组成的一个圆形
* ellipse 椭圆形，通过圆点坐标(x,y)和两个半径(radis_x,radis_y)组成的一个椭圆形，即radis_x和radis_y必须不相等才是椭圆，相等则为圆形
* line 线段，通过起点(x1,y1)坐标和终点坐标(x2,y2)组成的一个线段
* polygon 多段的闭合线段，通过若干组(x,y)坐标组成的闭合多边形
* polyline 多段的开放线段，通过若干组(x,y)坐标组成的开放多边形
* path 路径，通过若干组(x,y)坐标和一些抛物线组成的多段线段，也是设计师和开发中最常用的，因为大部分图形就是不规则的，只能使用路径来创建和呈现
* text 文本
* image 嵌入的位图

## 通用的属性

* xmlns 是svg容器特有的，用于表示使用的标准规范，常见于xml、html等为主的格式文本开头
* viewBox 是svg容器特有的，指代可视窗口，即透过这个窗口位置来看svg内部的图形，可以达成简单剪切
* width 宽度，单位支持px、rem、%、vw、vh、cqi等，通过在svg进行定义可以完成自适应或者按要求拉伸
* height 高度，单位支持同上
* stroke-width 描边宽度
* stroke 描边颜色，支持hex和rgb，也直接引入一个def定义的id（一般是渐变或滤镜）
* fill 填充颜色，支持同上

## 几种常用特效

* linearGradient 线性渐变
* radialGradient 径向渐变
* mask 遮罩
* clip-path 裁剪
* filter 滤镜，包括模糊、颜色、位置矩阵变化等约九种特性
* animateMotion 定义一个路径运动动画

以下是一个路径跟随动画示例：

```html
<svg viewBox="0 0 200 100" xmlns="http://www.w3.org/2000/svg">
  <path
    fill="none"
    stroke="lightgrey"
    d="M20,50 C20,-50 180,150 180,50 C180-50 20,150 20,50 z" />

  <circle r="5" fill="red">
    <animateMotion
      dur="10s"
      repeatCount="indefinite"
      path="M20,50 C20,-50 180,150 180,50 C180-50 20,150 20,50 z" />
  </circle>
</svg>
```

在图形内部使用animationMotion标签定义运动路径，外部的图形就会自动按照该路径运动，通过添加更多如渐变、遮罩可以轻松达成简易图形动画。


## 代码视角下的svg

设计软件中虽然也需要调整一些参数，但svg是直接以图形形式呈现和操作的，除了透明度、颜色、描边粗细等，其他属性参数一般都是被忽略不看也不会去修改。
而在代码里，由于svg是直接采用类似html标签的形式呈现，如果不进行预览，开发工程师所能看到的就是一堆属性参数，操作也是直接操作这些参数，因此了解这些参数的意义是很重要的。

以下是一个例子：

在html中，svg是采用xml形式展示的，如果你从外部引入一个svg资源，那将是这样的：

```html
<img src="/path/to/logo.svg" />
```

如果你在任何文本编辑器中打开这个svg文件，那内部的结构将以下这样：

```html
<svg version="1.1"
     baseProfile="full"
     viewBox="0 0 300 200"
     width="300" height="200"
     xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="red" />
  <circle cx="150" cy="100" r="80" fill="green" />
  <text x="150" y="125" font-size="60" text-anchor="middle" fill="white">SVG</text>
</svg>
```

而html中也可以直接将以上的svg的xml形式直接嵌入到html文件里，你将得到和外部引入一样的图形和效果。
因此在html中修改和操作svg其实做的事情和在设计软件中是一致的，
只不过设计软件可以直接操作图形，
而在html、css和js中更多是通过修改参数数值达成目标。

再次观看上述svg文件内容，可以看到这个svg是由一个容器标签svg和内部分别代表矩形、圆形、文字三种标签组成。

## 总结

* 代码绘制SVG更适合定制的、带有一定互动操作特性的矢量图。
* 直接引入SVG资源更适合按照设计师做好后就不再变化的图形，相比JPG和PNG的特点是可以不受限制地随意放大。
* 画布更适合有大量贴图素材的情况，其强大更多体现在制作地图、建筑模型、游戏画面等复杂场景呈现。

# SVG动画

[SVG实例入门与动画实战](https://zhuanlan.zhihu.com/p/485719434?utm_id=0)
[如何制作SVG颜色渐变动画效果](http://www.htmleaf.com/ziliaoku/qianduanjiaocheng/201504141680.html)