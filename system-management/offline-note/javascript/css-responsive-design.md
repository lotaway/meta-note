@[TOC](响应式设计-网页CSS样式知识)

# 百分比布局

简单的讲就是将元素按照百分比去划分宽度，配合行内元素属性或者浮动达成响应式，如：

```html

<style>
    .item {
        float: left;
        width: 49%;
        padding: calc(1% - 10px)
    }
</style>
<ul class="container">
    <li class="item">1</li>
    <li class="item">2</li>
    <li class="item">3</li>
    <li class="item">4</li>
    <li class="item">5</li>
    <li class="item">6</li>
    <li class="item">7</li>
    <li class="item">8</li>
</ul>
```

# 弹性布局

弹性布局既使用flex属性对所有子元素指定统一水平或垂直的布局方式，让子元素根据设定自动完成宽度或高度的适应。
由于特性决定更适合单行或者单列展示内容，例如快捷功能入口、Tab选项卡栏等。
如：

```html

<style>
    /*指定横向显示，并且内容分布方式为间隔相等（无论不同内容之间是否相同宽度）*/
    .container {
        display: flex;
        flex-direction: row;
        justify-content: space-around;
    }

    .item {
        width: 300px;
        max-width: 25%;
    }
</style>
<ul class="container">
    <li class="item">1</li>
    <li class="item">2</li>
    <li class="item">3</li>
    <li class="item">4</li>
</ul>
<ul class="container">
    <li class="item">1</li>
    <li class="item">2</li>
    <li class="item">3</li>
    <li class="item">4</li>
</ul>
```

# 网格布局

网格布局就是通过grid属性完成网格形式的布局，和flex一样有很多配套的额外属性，相比flex布局好处在于适合多行重复的相同内容，例如产品列表、视频列表。

```html

<style>
    /*指定每行显示4个，宽度自动，网格间距通过gap指定*/
    .container {
        display: grid;
        gap: 1vw; /*使用视口宽度单位*/
        grid-template-columns: repeat(4, auto)
    }
</style>
<ul class="container">
    <li class="item">1</li>
    <li class="item">2</li>
    <li class="item">3</li>
    <li class="item">4</li>
    <li class="item">5</li>
    <li class="item">6</li>
    <li class="item">7</li>
    <li class="item">8</li>
</ul>
```

# 最大最小宽度

通过设定最大最小宽度来限制类似百分比设定的元素，达成有限制的响应式变化：

```css
.item {
    width: 70%;
    min-width: 300px;
    max-width: 600px;
}
```

也可以通过最新的clamp(min, normal, max)属性达成类似目标，如：

```css
.item {
    width: clamp(1rem, 1.2vw, 2rem)
}
```

上述两种方式要注意除了最大最小值外，指定的单位必须是百分比或者vw、flex:1这种会根据窗口或父元素大小自动变化数值的，否则最大最小值的限制将失去意义。

# 视图窗口

网页本身是作为一个视窗存在，它是可以按照需要变成和窗口大小不一样的，导致一般针对PC端设计的页面，在手机上是必须通过双指缩放来调整视窗的大小，从而看清楚要浏览的内容。
一般通过meta:viewport指定宽度为当前所用设备的宽度，并且禁止缩放功能来完成手机端适配工作：

```html

<meta name="viewport"
      content="width=device-width,user-scalable=no,initial-scale=1.0,maximum-scale=1.0,minimum-scale=1.0"/>
```

当然也有将通过指定宽度和缩放比来完成设配的方式：

```html

<meta name="viewport" content=""/>
<script>
    function scaleMatch() {
        //  方式1：直接通过占比像素点（1x/2x/3x）执行缩放，每个位置像素点越高，缩放就越厉害，更注重保持图片的高质量，但使用像素单位的其他元素也会受影响导致缩小
        // document.querySelector("meta[name=viewport]").content = 'width=device-width, initial-scale=' + (1 / window.devicePixelRatio) + ', user-scalable=no';

        //  方式2：通过一开始固定宽度来决定最后的缩放比例，能确保像素单位元素能自动配合屏幕缩放，相比质量更更注重按照像素设计稿一比一还原。
        const width = 750
        document.querySelector("meta[name=viewport]").content = "width=" + width + "px,user-scalable=no;initial-scale=" + 750 / window.width
    }

    window.addEventListener("DOMContentLoaded", function () {
        scaleMatch()
    })
    window.addEventListener("resize", function () {
        scaleMatch()
    })
</script>
<h1 style="font-size: 1.5rem">标题根据屏幕尺寸变化</h1>
```

# 多媒体查询

多媒体查询可以通过指定当设备满足条件时，展示不同的样式。

## 最大最小宽度

以下例子通过判断在大屏时一行显示三个元素，当屏幕中等大小时一行显示两个元素，当小屏幕时，一行显示一个元素：

```css
.item {
    float: left;
    width: 33.3%;
}

/* 指定宽度小于1000像素时的样式 */
@media (max-width: 1000px) {
    .item {
        width: 50%;
    }
}

/* 指定宽度小于300像素时的样式 */
@media (max-width: 300px) {
    .item {
        width: 100%;
    }
}
```

另一种指定最大最小宽度的方式：

```
.item {
   float: left;
   width: 33.3%;
}
/* 指定当宽度介于300像素和1000像素之间时的样式 */
@media (300px < width <= 1000px) {
   .item {
        width: 50%;
   } 
}
```

## 竖屏横屏

媒体查询还可以直接指定横屏和竖屏时的样式，不过这实际查询的不是横屏竖屏，而单纯是宽度和高度比，如果宽度更长则视为横屏，如果高度更长则视为竖屏：

```css
/* 横屏 */
@media (orientation: landscape) {
    .item {
        width: 25%;
    }
}

/* 竖屏 */
@media (orientation: portrait) {
    .item {
        width: 50%;
    }
}
```

## 尺寸比

通过指定宽高比例来展示不同样式，很明显适合对尺寸比有精确要求的类型，例如画作、聚集元素大小不一致的情况：

```css
/* 当宽度和高度比例大于16：9时时 */
@media (min-aspect-ratio: 16/9) {

}

/* 当宽度和高度比例为小于4：3时 */
@media (max-aspect-ratio: 4/3) {

}
```

# 容器属性

目前推行情况只有谷歌、微软和苹果浏览器支持，作为一个未来时属性提前了解一下。
容器属性可以让父元素符合要求时展示不同样式：

```html

<style>
    /* 定义容器条件和样式 */
    .card-item {
        width: 100%;
    }

    @container card (width >= 600px) {
        .card-item {
            width: 50%;
        }
    }
    /* 调用时在作为容器的父元素上里指定容器类型和名称即可 */
    .card-container {
        container-type: inline-size;
        container-name: card;
    }
</style>
<ul class="card-container">
    <li class="card-item">1</li>
    <li class="card-item">2</li>
    <li class="card-item">3</li>
    <li class="card-item">4</li>
</ul>
```

# 容器查询单位

可用的单位有：

* cqw: Container Query Width 容器查询宽度
* cqh: Container Query Height 容器查询宽度
* cqmin: 容器中取宽高最小的一个作为标准，即容器查询最小边
* cqmax: 容器中取宽高最大的一个作为标准，即容器查询最大边

取值方式和vw、vh、vmin、vmax相似，1=1%，只不过vw是相对于设备宽高，而cq是相对于作为容器的父元素，例如1cqw即相对于容器的1%宽度，如果容器宽度是1000px，1cqw则是1000x0.1=100px。
注意直接使用vw和vh等也是可以自动根据容器宽高来决定。

```html

<style>
    .info {
        font-size: clamp(12px, calc(100cqw / 20), 60px);
    }
</style>
<div class="contain">
    <p class="info">
        这些内容将会根据容器div大小变化而变化，通过自动变化文字大小，完成固定每行显示20个文字，并且设定最小和最大像素值 </p>
</div>
```

[CSS Container Queries属性](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Container_Queries)

# 伪类has

用来判断是否存在子元素，若存在则样式生效，下面是若存在标题则为容器添加边框：

```html

<style>
    /*判断当存在标题子元素时就显示*/
    .container:has(.title) {
        border: 1px solid #000;
    }
</style>
<div class="container">
    <h5 class="title">这就是标题</h5>
    <p class="content">这就是详细内容</p>
</div>
```

若将title元素去除，边框样式将失效。