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
    transform: translateX(100px);
}

.box:hover .description {
    opacity: 1;
    transform: translateX(0);
}
```

以上对box元素的描述文字设定了过渡效果`transition: 1s ease`，
1s表示持续1秒，
ease表示在过渡开始和结束时都减缓变化速度。
至于transform这里要结合hover一起看待，首先常态下是`translateX(100px)`，指代让元素在x轴（即水平方向）向右偏移100像素，如果是`-100px`则是向左偏移。

注意此时无论是opacity、transform加上transitio并没有让元素实现变换过程，因为目前这个定义只能被当作元素的初始状态，还缺少一个最终状态和触发时机。
这里我们选择使用`:hover`伪类作为触发时机，并设定最终状态为`opacity: 1`和`transform: translateX(0)`，
呈现的效果将是鼠标移动到box元素上时，描述文字将花费1秒逐渐加速从初始样式变成最终样式，看起来是从右到左移动，并逐渐从透明恢复到原样，结束前会减缓速度直到完成。

## 其他动画效果

让菜单从折叠状态变为展开状态：

```css
.menu .child-menu {
    transition: height 0.3s linear;
    height: 0;
}

.menu:active .child-menu {
    height: calc-size(auto);
}
```

对于一些我们希望从完全不可见变成可见的状态：

```css
.box .menu {
    display: block;
    opacity: 1;

    @start-styles {
        display: none;
        opacity: 0;
    }
}
```

## Animation 动画

```css

```

## SVG Animation 矢量图动画

## Canvas 画布