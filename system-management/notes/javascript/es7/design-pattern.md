@[TOC](设计模式)

# Singleton Pattern 单例模式

生成唯一实例，如创建一个唯一的遮罩层，给所有弹窗方法共用

```javascript
const getModelWindow = (() => {
    let single
    return () => {
        if (single) {
            return single
        }
        single = document.createElement('div')
        document.body.appendChild(single)
        return single
    }
})()
```

示例里用一个变量保存函数返回值，这样除了第一次调用函数`getModelWindow`
会创建实例以外，后续调用将返回第一次存储的结果`single`;

# Decorator Pattern 装饰器模式/外观模式

内部调用多个不同的方法去实现功能，而自身作为一个整体供给外部使用。要注意和装饰器`@Controller`
这种是不一样的，一个是设计模式，一个是类似寄生模式的新特性。

```javascript
const stopEvent = event => {
    event.stopPropagation()
    event.preventDefault()
}
const logger = str => console.log(str)
const errorHandler = err => console.error(err)
const ClickListener = function (id, callback = () => {
}) {
    //  完成监听、阻止默认事件、日志、错误处理等
    document.getElementById(id).addEventListener("click", event => {
        stopEvent(event)
        logger("calling event")
        try {
            callback(event)
        } catch (err) {
            errorHandler(err)
        }
    });
}
ClickListener("button", event => {
    //  go on do something...
})
```

# HOC Pattern 高阶组件模式

相比装饰器模式更注重包裹众多方法处理，HOC模式更注重包裹传入的对象，帮其实现通用行为：

```jsx
//  定义Container.jsx
export default function Container({Component}) {
    const injectProps = {
        mainColor: "#000000"
    }
    return (
        <div className="contain fullscreen">
            <Component {...injectProps} />
        </div>
    )
}

//  子组件将能享受到父容器的包裹
function Child(props) {
    return (
        <p>Output: {props.mainColor}</p>
    )
}

import Container from "Container"
//  使用
ReactDom.render(<Container Component={Child}/>)
```

# Provider Pattern 生产者模式

HOC模式结合单例模式的具体应用，面对像React/Vue框架里相邻和嵌套的多个组件之间的共享相同的状态数据和方法，为了避免层层传递而使用`context`
解决的模式

定义上下文，数据和相关方法都在里面：

```jsx
//  ThemeContext.jsx
import {useState, createContext} from "react"

export const ThemeContext = createContext({})
export default function ThemeProvider({children}) {
    const [theme, setTheme] = useState(false);
    return (
        <ThemeContext.Provider value={{theme, setTheme}}>
            {children}
        </ThemeContext>
    )
}
```

设定上下文作用范围，这里用在`ListPage`组件上，这样内部的子组件`Filter`和`Info`都能使用该上下文内容：

```jsx
//  ListPage.jsx
import ThemeProvider from "@/context/ThemeContext"
import Filter from "@/component/Filter"
import Info from "@/component/Info"

export default function ListPage({listData}) {
    return (
        <ThemeProvider>
            <Filter/>
            {listData.map(item => <Info data={item}/>)}
        </ThemeProvider>
    )
}
```

在Filter组件中使用上下文，调用方法修改状态数据：

```jsx
//  Filter.jsx
import {useContext} from "react"
import {ThemeContext} from "@/context/ThemeContext"

export default function Filter() {
    const {theme, setTheme} = useContext(ThemeContext)
    return (
        <button type="button" onClick={() => setTheme(!theme)}>Switch</button>
    )
}
```

在Info组件中使用上下文，调用状态数据：

```jsx
//  Info.jsx
import {useContext} from "react"
import {ThemeContext} from "@/context/ThemeContext"

export default function Info({data}) {
    const {theme, setTheme} = useContext(ThemeContext)
    return (
        <div className={theme ? "bg-light" : "bg-dark"}>
            <h3>{data.title}</h3>
            <p>{data.desc}</p>
        </div>
    )
}
```

# Proxy Pattern 代理模式

通过附加额外方法属性完成不属于原对象的功能，一般用来写赋值验证或者输出日志。

```javascript
const formData = {
    name: "defaultName",
    age: 0
};
const superFormData = new Proxy(formData, {
    get: (obj, prop) => {
        console.log(`the ${prop} value is : ${obj[prop]}`);
        return Reflect.get(obj, prop);
    },
    set: (obj, prop, value) => {
        if (prop === "age") {
            if (typeof value !== "number" || value <= 0 || value > 150) {
                return false;
            }
            Reflect.set(obj, prop, value);
        }
    }
});
superFormData.name //  会同时输出到命令行
superFormData.age = "18"   //  不满足条件，赋值失败
superFormData.age = 18 //  满足条件才能赋值成功
```

# Bridge Pattern/Command Pattern 桥接模式/命令行模式

通过传递处理方法，解耦拆分原函数，完成独立变化。如把单例模式拆分成一个抽象函数和实现函数，有点类似代理模式的另类实现，IoC控制反转也是类似操作

```javascript
const Controller = dependence => {
    let result
    return () => {
        return result || (result = dependence.apply(this, arguments))
    }
}
const injecter = () => document.body.appendChild(document.createElement('div'))
const bridgeDone = Controller(injecter);
```

# Extend Pattern 继承模式/模版方法模式

在父类中声明原型方法，在子类中可以重载或者定义新功能

```javascript
class Human {
    constructor(name) {
        this.name = name
    }

    walk() {
        console.log("Walking~~")
    }

    move() {
        return this.walk()
    }
}

class Superman extends Human {
    constructor(name = "Clack") {
        super(name)
    }

    //  定义新方法，强化原本的类
    fly() {
        console.log("Flying~~")
    }

    //  重载类方法
    move() {
        return this.fly()
    }
}

const superman = new Superman()
superman.move() //  flying~~
```

继承模式适用于固定且统一的类，例如上面的`Superman`继承`Human`，而一个`Transformers`变形金刚或者`Car`
汽车肯定不会继承`Human`，因此如果需要定义不属于原类的方法，但该类又需要使用，例如定义`Car`相关方法，应该适用代理模式或者Ioc思维去实现。

# Mediator Pattern 中间件模式/中介者模式/调节者模式，依赖注入/IoC思维

```javascript
class Human {
    constructor(name, vehicle, equitment) {
        this.name = name
        this.vehicle = vehicle
        this.equitment = equitment
    }

    walk() {
        console.log("Walking~~")
    }

    move() {
        vehicle?.move() ?? this.walk()
    }

    support(event) {
        this.vehicle[event] ?? this.vehicle[event]()
        this.equitment[event] ?? this.equitment[event]()
    }
}

class Car {
    fire() {
        console.log("Missile fire~~")
    }

    move() {
        console.log("Car moving~~")
    }
}

class Gun {
    fire() {
        console.log("Gun fire~~")
    }
}

const batman = new Human("batman", new Car(), new Gun())
batman.move()   //  Car moving~~
batman.support("fire")    //  Missile fire~~，Gun fire~~
```

中间件还有另一种借助观察者模式实现的多重包裹，类似Koa中间件和父子组件事件：

```javascript
class App {
    _callback(params) {
        console.log("无论多少中间件，此乃内部最终返回")
    }

    watch(callback) {
        const _origin = this._callback
        this._callback = params => callback(params, () => _origin(params))
    }

    invoke(...params) {
        return this._callback(params)
    }
}

const app = new App()
app.watch((params, next) => {
    console.log("先定义，但是后触发，相当于最后防线：1")
    next()
})
app.watch((params, next) => {
    console.log("后定义，但是先触发，相当于预处理：2")
    next()
})
app.invoke("some")
```

# Mixed Pattern 混合模式

用来增强对象或者类的功能，关键在于通过混合器方法创建新对象或新类达成目标

```javascript
class Human {

}

const Mixer = Class => class extends Class {
    callHelp() {
        console.log("Help!!!")
    }
}
const humanWithSuperman = new (Mixer(Human))()
humanWithSuperman.callHelp()
```

# Obverse Pattern 观察者模式/订阅模式

抽象化一个函数，当相关动作发生时，通过调用其他函数完成后续动作，最常见的是事件监听。

网页内置的事件订阅

```javascript
document.getElementById("button").addEventListener("click", event => {
    console.log("这就是订阅模式")
})
```

自定义订阅

```javascript
const target = {
    _callback: [],
    subscribe(callback) {
        _callback.push(callback)
    },
    dispatch() {
        _callback.reduce((prev, item) => item(), "")
    }
};
target.subscribe(() => console.log("1, do this..."))
target.subscribe(() => console.log("2, do that..."))
target.dispatch()
```

# Factory Pattern 工厂模式

封装了对输入的处理和输出统一格式内容，内部可以新建不同类实例，或者是完成内容组装等

```javascript
const MovingSuit = function (destination) {
    const distance = getDistance(destination)
    const human = new Human()
    return distance > 100 ? {
        driver: human,
        name: `${human.name} drive to ${destination}`,
        vihicle: new Car()
    } : {
        rider: human,
        name: `${human.name} ride to ${destination}`,
        vihicle: new Bicycle()
    }
};
const shopping = MovingSuit("成华大道")    //  in bicycle
const traveller = MovingSuit("北京")    //  in car
```

# Adapter Pattern 适配器模式

将一个函数或类实例输出的内容转变成另外一个函数或类实例可使用的结构，常用于将接口返回的数据变成页面所需显示内容

```javascript
const adapter = data => {
    return {
        ...data,
        name: data.nickname || "匿名",
        image: data.images.length ? data.images[0] : "",
        date: (new Date(data.createTime)).toLocaleDateString()
    }
};
```

# Visitor Pattern 访问者模式

抽象一个函数作为访问者，符合条件的人都可以作为被访问者调用它，这种方法原生js已实现，那就是apply()和call()方法

```javascript
//  访问者
var Visitor = {};
Visitor.push = function () {
    return Array.prototype.push.apply(arguments);
};
//  被访问者
var obj = {};
obj.push = Visitor.push;
obj.push('haha');
console.log(obj.length);
```

# Strategy Pattern 策略模式

为减少大量的if/else语法，通过类型或事件区分为不同独立方法完成处理返回，如提交表单前，对有非空、长度、禁用词验证等。

```javascript
const validata = function (checkOpt) {
    const handler = {
        notNull(value) {
            return value !== ''
        },
        dirtyWords(value, words) {
            return !words.length || words.reduce((prev, item) => prev && value.indexOf(item) === -1, true)
        },
        maxLength(value, maxLen) {
            return value.length <= maxLen
        }
    }
    let result = true
    for (let type in checkOpt) {
        if (result && typeof handler[type] === 'function') {
            if (!handler[type](this.value, checkOpt[type])) {
                console.log(type)
                result = false
            }
        }
    }
    return result
};
const inputElement = {
    value: "is it true?"
}
validata.call(inputElement, {
    notNull: true,
    dirtyWords: ['fuck', 'shit'],
    maxLength: 30
})
```

# Iterator Pattern 迭代器模式

封装好一些迭代方法用于事务场合

```javascript
const ObjForEach = (obj, fn) => {
    for (let i in obj) {
        const c = obj[i];
        if (fn.call(c, i, c) === false) {
            return false;
        }
    }
};
//  使用
ObjForEach({"a": 1, "b": 2}, (i, n) => {
    console.log(i + ' is ' + n);
});
```

# Composite Pattern 组合模式/部分-整体模式

好处是用户不用确定对象是简单还是复杂结构、是单个还是多个的情况下，函数都可完成所有工作，如jQuery的Dom选择器中不会关注有一个还是多个Dom对象，调用方法时都会自动完成，例子略

# 备忘录模式

实际上就是利用了查找变量时，若函数内没有该变量，会自动查找上一级函数的变量，此时上一级函数的变量仍存储有内容可供使用，常见于匿名回调函数调用上一级函数的变量

```javascript
const getPageData = function () {
    let cacheData = {},
        result;
    return (pageIndex = 1) =>
        new Promise(resolve => {
            if (cacheData[pageIndex]) {
                result = cacheData[pageIndex];
                resolve(result);
            } else {
                fetch('cgi.xx.com/xxx').then(data => {
                    cacheData[pageIndex] = data
                    resolve(data)
                })
            }
        })
}()
```

# Chain of Responsibility Pattern 职责链模式

对象A向对象B发起请求，如果B不处理，可以把请求转给C，如果C不处理，又可以把请求转给D。一直到有一个对象愿意处理这个请求为止。
Dom事件的冒泡捕获机制就是类似方式，点击事件发生时，会在当前节点触发，并依次向最高父节点传递。
Koa中间件对请求和响应处理也是类似方式。

# Flyweight Pattern 享元模式

通过共享一部分数据，达到减少程序所需的内存。例如无限下拉列表中，通过确定出现在可视区域中的实际行数，加载时无需创建更多li标签，而是利用已经’消失‘在可视区域外的li标签重复利用。

# State Pattern 状态模式

主要可以用于这种场景：1、一个对象的行为取决于它的状态；2、一个操作中含有庞大的条件分支语句，为了集中管理这些状态和代码，引入一个状态类，内部记录当前状态和完成修改状态，外部可以获取当前状态和修改状态。

```javascript
enum State {
    JUMP,
    STOP,
    ATTACK,
    FORWARD,
    BACKWARD,
    DEFENSE
}

class StateManager {
    currState: State.STOP

    get actions() {
        return {
            jump(state) {
                currState = State.JUMP
            },
            wait(state) {
                currState = State.STOP
            },
            attack(state) {
                //  增加攻击间隔
                if (currState === State.ATTACK)
                    wait(300)
                currState = State.ATTACK
            },
            defense(state) {
                //  跳跃的时候不能防御
                if (currState === State.JUMP)
                    return false;
                currState = State.DEFENSE;
            }
        }
    }
};
var character = StateManager()
character.actions.defense()
```