@[TOC](CSS伪类-网页CSS样式知识)

# :before

帮当前元素内部增加一个放置在最前面的子元素，一般用于在列表前面增加装饰条或圆点之类。

```html

<ul>
    <li>内容1</li>
    <li>内容2</li>
</ul>
<style>
    li:before {
        content: "";
        display: inline-block;
        width: 8px;
        height: 8px;
        border-radius: 50%;
    }
</style>
```

# :after

类似before，帮当前元素内部增加一个放置在最后面的子元素，一般用于清除浮动样式导致的错位。

```html

<ul>
    <li>内容1</li>
    <li>内容2</li>
</ul>
<span>后续内容不会重叠</span>
<style>
    li {
        float: left;
        width: 50%;
    }

    ul:after {
        content: "";
        display: block;
        clear: both;
    }
</style>
```

# :hover

若鼠标悬停在当前元素上则样式生效，一般用于按钮，链接，自动下拉菜单或者其他扩展显示内容的用途。
要注意触发方式在手机上体现的效果变成了只要点击过就会保持生效，直到你点击其他元素。

```html

<button>鼠标悬停在按钮上将改变样式</button>
<style>
    button {
        background: black;
    }

    button:hover {
        background: red;
    }
</style>
```

# :focus

若当前元素被聚焦，则样式生效，例如点击了按钮或者输入框，则当前元素被视为聚焦状态，直到点击其他元素或者网页外的内容。

一般用于点击搜索栏后，将输入框扩大使之显眼、显示历史热词提示等。

```html
<input type="text"/>
<style>
    input[type=text]:focus {
        border: 2px solid black;
    }
</style>
```

# :active

若当前元素被点击则样式在点击期间生效，用于例如按钮被点击后临时的变色或发光等，效果类似:hover的点击版：

```html

<button>点击按钮时将改变样式</button>
<style>
    button {
        background: black;
    }

    button:hover {
        background: yellow;
    }
</style>
```

# :visited

只对a标签有作用，若a标签上的href属性定义的网址已经被客户端访问过、有历史记录或缓存时，样式生效。

现在用途一般是将效果设置为与通常样式一致即可（不设置的话浏览器会自动修改颜色导致正常状态与浏览过的链接颜色不一致），例如：

```css
a, a:visited {
    color: red;
}
```

# :root

该伪类会作用于根元素（html中根元素即是<html>标签），以下示例将根节点文字颜色改为红色：

```css
:root {
    color: red;
}
```

但一般不会直接设置样式，而是配合`--variable`和`var(--variable)`语法用于提供全局作用域定义变量给其他样式值调用：

```css
:root {
    --theme-color: red;
}

.main-theme-color {
    color: var(--theme-color);
}

.main-bg-color {
    background: var(--theme-color);
}
```

# :not()

不存在括号里的条件时，样式生效，例如：

```html

<div class="container">
    <p class="content"></p>
</div>
<style>
    .container :not(.title) {
        border-top: 1px solid #000
    }
</style>
```

由于.container所在的元素里没有被.title样式装饰的元素，因此:not样式会作用于.container元素

# :is()

与not相反，当前元素满足括号里的选择条件时，样式生效：

```css
.container:is(.loading, .waiting, .error, .tip) {
    background: yellow;
}
```

要注意用逗号隔开是[OR或者]的意思，即只要满足一个选择器要求即可。
注意此伪类优先级比一般写法要高，例如以下这种写法的样式即使放在:is()之后也无法覆盖掉原有的样式。

```css
.container.loading,
.container.waiting,
.container.error,
.container.tip {
    background: red;
}
```

# :where()

当前元素满足括号里的选择条件时，样式生效，一般用于作为父元素条件来定义子元素样式，例如判断当元素是否存在括号里任意一个父元素：

```html

<div class="container">
    <h1 class="title">这是大标题</h1>
    <ul class="wrapper">
        <li class="title">这是小标题</li>
        <li class="item">这是内容</li>
    </ul>
</div>
<div class="contain">
    <h1 class="title">这是大标题</h1>
</div>
<style>
    :where(.container, .contain, .wrapper) .title {
        color: red;
    }
</style>
```

# :has()

当前元素的子元素满足括号里的选择条件时，样式生效，一般用于子元素可能不存在的情况，例如判断元素是否存在标题子元素：

```html

<div class="container">
    <h1 class="title">拥有此样式名将使样式生效</h1>
</div>
<style>
    .container:has(.title) {
        background: grey
    }
</style>
```

伪元素的作用是解决简单的CSS键值结构难以定义的各种动态关联，但是滥用伪元素也很容易造成修改困难，需要按照抽象思维的方式仔细考虑方可使用。