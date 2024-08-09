@[TOC](动画和过渡-网页CSS样式知识)

自从CSS3标准出来后，大部分简单和易分解的动画效果已经可以轻松实现。
最常见的就是过渡

## Transform & Transition 变换和过渡

过渡一般只负责如何从一个状态过渡到另一个状态的时间、速度，而变换则是对元素进行位置、大小、旋转、缩放等操作。
例如：

```html
<div class="box">
    <p class="description">This is a box</div>
</div>
```

```css
.box .description {
    transition: 1s ease;
    opacity: 0;
    transform: scale(0.9);
}

.box:hover .description {
    opacity: 1;
    transform: scale(1);
}
```

以上对box元素的描述文字设定了过渡效果`transition: 1s ease`，
1s表示持续1秒，
ease表示在过渡开始和结束时都减缓变化速度。
至于transform这里要结合hover一起看待，首先常态下是`scale(100px)`，指代让元素整体缩小到二分之一。

注意此时无论是opacity、transform加上transitio并没有让元素实现变换过程，因为目前这个定义只能被当作元素的初始状态，还缺少一个最终状态和触发时机。
这里我们选择使用`:hover`伪类作为触发时机，并设定最终状态为`opacity: 1`和`transform: scale(1)`，
呈现的效果将是鼠标移动到box元素上时，描述文字将花费1秒逐渐加速从初始样式变成最终样式，看起来是从小变大一些，并逐渐从透明恢复到原样，结束前会减缓速度直到完成。

## 其他动画效果

让菜单从折叠状态变为展开状态：

```css
.menu .child-menu {
    transition: height 0.3s linear;
    height: 0;
}

.menu:active .child-menu {
    height: calc-size(auto);
    /* height: fit-content; // 也可以使用fit-content，效果一样，甚至可以用max-height: 0/auto代替height */
}
```

对于一些我们希望从完全不可见变成可见的状态：

```css
.box:hover .menu {
    transition: opactiy 1s linear;
    display: block;
    transform: translateY(0); // 甚至可以不写这个，因为默认为0
    transition-behaviour: allow-disscrete; // disscrete是离散的意思，指代元素消失时也要使用过渡效果

    // 指定起始样式
    @starting-style {
        display: none;
        transform: translateY(-10px);
    }
}
```

## Animation 动画

这里的动画指的是关键帧动画，如果做过Flash会比较了解，简单讲就是通过在指定时间戳若干位置设定当时的状态，让元素自动完成过程变换。
最简单的用法就是像过渡一样只设定起始和终点的值，
不过更多时候是设定不断重复的变化：

```css
.box:hover .menu {
    animation: Shine 1s linear forwards infinite;
}

@keyframes Shine {
    0%, 100% {
        opacity: 1;
        transform: rotate(0);
    }

    25%, 75% {
        opacity: 0;
    }

    50% {
        opacity: 0.5;
        transform: rotate(360deg);
    }
}
```

以上通过`@keyframes [animation-name]`的方式定义了动画，其中的百分比是指代对应动画时间的进度，
接着可以用`animation: [animation-name] [duration-time]`来使用，
这里的`forwards`表示动画结束后保持最后一帧，`infinite`表示动画循环播放。
要注意动画设定后名称是全局的，一旦设定太多动画很容易出现冲突，所以一般是会考虑只做很通用的动画。

## SVG Animation 矢量图动画

SVG是近些年来比较流行的网页图形，并且也有越来越多的动画效果支持，不过由于是矢量，除了类似CSS常见的变换和过渡外，主要是集中在跟随路径动画上。


## Canvas 画布

毫无疑问，最强的动画永远只有Canvas可以实现，而且也只有Canvas能做3D动画和各种可互动操作，并且Canvas在各种设备、编程语言中都存在，
做游戏也是基于这个，不过因为Canvas本身并没有提供动画预设，所谓实现动画都是基于开发者自己根据时间逐帧绘制全部全新的画面，否则就是静止的。