@[TOC](Typescript的进阶学习笔记-讲解三划线指令、内置方法类型、infer、协变、逆变和交叉类型)

# 三划线指令

三划线指令可以让命令空间无须导出即可引用，类似C/C++中引用头文件#include <someFileName.h>

## 定义命名空间

在*system.ts*文件定义命令空间（注意`namespace`不需要`export`导出）：

```typescript
namespace system {
    export declare type IP = string

    export function getIP() {
        return "It's ip";
    }
}
```

## 引用文件

在*main.ts*文件中使用三划线指令标签引入即可调用该命令空间内的变量和方法：

```typescript
/// <reference path="./system.ts"/>
const ip: system.IP = system.getIP();
```

# 类参数自动转成成员变量

在类的构造器可以用`private`修饰形参，该形参会自动升级为成员变量，当实例化时，实参也将自动赋值给成员变量

```typescript
class ClassRoom {
    manualName: string;

    //  注意_classNumber使用了private修饰符
    constructor(private readonly _classNumber: number, className?: string) {
        //  这里的第一个形参`_classNumber`添加了`private`修饰，已自动赋值给`this._classNumber`，无需手动赋值。
        //  this._classNumber
        //  而第二个形参`className`没有`private`修饰，实例化后无法用`this.className`获取，若需要可以手动赋值。
        this.manualName = className;
    }

    showClassInfo() {
        console.log(`已自动定义'this._classNumber'：${this._classNumber}`);
        console.log(`未定义‘this.className’：${this.className}`);  // 若没有手动赋值，将不存在
        console.log(`手动定义'this.name'：${this.manualName}`);
    }
}
```

# 关于内置的泛型讲解

## NonNullable 不可为空

`NonNullable`输出的类型将排除赋值`null`和`undefined`的可能性：

```typescript
type OriginData = {
    id: number
    title: string
}
//  可以将变量初始化为null，之后再赋值为正确类型
let inputData: OriginData = null;
inputData = {
    id: 1,
    title: "二次赋值"
};
type SQLData = NonNullable<OriginData>
//  被NonNullable输出的类型将不可为null，以下初始化会报错
let fullData: SQLData = null;
```

## Partial 可选

`Partial`会将传入参数内含全部键类型从必选变为可选

```tepescript
type NecessaryData = {
    id: number
    title: string
}
type OptionalData = Partial<NecessaryData>
```

上面的代码将id和title都变为可选，相当于：

```typescript
type OptionalData = {
    id?: number
    title?: string
}
```

实际使用：

```typescript
let finalData: NecessaryData = {
    id: 1,
    title: "必须定义所有属性"
}
let inputData1: OptionalData = {
    // id可以不需要定义
    title: "可以只定义部分属性"
}
```

## Required 必须

`Required`与`Partial`相反，会将传入的类型内含键全部从可选变为必选

```typescript
type OptionalData = {
    id?: number
    title?: string
}
type NecessaryData = Required<OptionalData>
```

上面的代码将id和title变为可选，相当于：

```typescript
type NecessaryData = {
    id: number
    title: string
}
```

## Pick 挑选键

`Pick`从指定的类型中挑选你指定的若干键作为新类：

```typescript
type FullData = {
    id: number
    title: string
    image?: string[]
    updateTime: Date
}
type InitData = Pick<FullData, "title" | "image">
```

以上代码相当于：

```typescript
type InitData = {
    title: string
    image?: string[]    //  从原类型继承的可选
}
```

实际使用：

```typescript
let inputData2: InitData = {
    title: "初始化数据只需要title和image，其中image继承原类型的可选"
}
```

## Omit 排除键

`Omit`与`Pick`相反，从指定类型中排除键

```typescript
type NecessaryData = {
    id: number
    title: string
    image?: string[]
    desc: string
}
type ShowData = Omit<NecessaryData, "id">
```

以上代码相当于：

```typescript
type ShowData = {
    title: string
    image?: string[]
    desc: string
}
```

实际使用：

```typescript
let showData: ShowData = {
    // id: "",  //  被排除的键，填入会报错
    title: "",
    image: [],
    desc: ""
}
```

## Extract 已包含

`Extract`判断类型中是否继承了指定的键，否则返回`Never`

```typescript
interface IData {
    id: number
}

interface IBlog {
    id: number
    title: string
}

//  判断IBlog中是否继承IData，检查通过（已继承），则InsertData = IBlog，否则InsertData = Never
type InsertData = Extract<IBlog, IData>;
let inputData3: InsertData = {
    id: 3,
    title: "检查通过（已继承），否则此处赋值会报错"
};
```

上述是对一个接口或对象类型进行检查，另一种用法是对两个联合类型进行并集操作，输出同时存在于两个类型中的类型：

```typescript
type ALevel = number | string | (() => number);
type BLevel = number | Function
type TargetLevel = Extract<ALevel, BLevel>;
```

以上相当于：

```typescript
// 排除了ALevel里的string类型，因为string类型无法同时满足ALevel和BLevel要求的类型类型
type TargetLevel = number | (() => number);
```

## Exclude 未包含

`Exclude`与`Extract`相反，判断指定类型中是否没继承要求的键，若继承了则返回`Never`

```typescript
interface SaveData {
    id: number
    updateTime: Date
}

interface InputData {
    title: string
    image: string[]
    desc: string
}

//  判断InputData中是否没继承SaveData，检查通过（没继承），则ShowData = InputData，否则InsertData = Never
type ShowData = Exclude<InputData, SaveData>;
let inputData: ShowData = {
    title: "检查通过（没继承），否则此处赋值报错",
    image: [],
    desc: ""
}
```

上述是对接口或对象类型的检查，另一种用法是对两个联合类型进行并集再取反集操作，输出没有同时存在于两个类型的类型：

```typescript
type ALevel = number | string | (() => number);
type BLevel = number | Function
type TargetLevel = Exclude<ALevel, BLevel>;
```

以上相当于：

```typescript
//  返回了ALevel里的string类型，因为string类型无法同时满足ALevel和BLevel要求的类型
type TargetLevel = string;
```

## Record 键名键值挂钩

`Record`将指定的类型A中所有的键值的类型变成类型B传入的类型，一般适用于将对象类型或接口套入枚举：

```typescript
enum PayStatus {
    Pending,
    Success,
    Error
}

interface StatusInfo {
    value: number
    title: string
}

type PayStateInfo = Record<PayStatus, StatusInfo>;
//  注意payStateInfo的键名是来源枚举PayStatus，键值类型来源于接口StatusInfo
let payStateInfo: PayStateInfo = {
    [TargetRecord.Pending]: {
        value: 0,
        title: "处理中"
    },
    [TargetRecord.Success]: {
        value: 1,
        title: "支付成功"
    },
    [TargetRecord.Error]: {
        value: -1,
        title: "支付失败"
    }
}
```

## ReturnType 返回值类型

`ReturnType`传入函数类型，获取该函数的返回值类型

```typescript
type HasReturnFn = (a: number, b: number, format: string) => number;
type Result1 = ReturnType<HasReturnFn>;
const hasReturnFn: HasReturnFn = (a, b) => {
    return a + b;
};
type Result2 = ReturnType<typeof hasReturnFn>;
// Result1, Result2为相同类型
const arr = [1, "ss", {id: 1}];
```

## InstanceType

`InstanceType`类似`ReturnType`，相比获取函数返回值，这里传入的是类类型，获取的是类实例类型

```typescript
type ClassInstance = InstanceType<typeof ClassRoom>;
const instance: ClassInstance = new ClassRoom(512, "the second room");
```

## Parameters 函数形参类型

`Parameters`传入函数类型，获取该函数的形参类型并转成数组类型输出

```typescript
type FnParamsArr = Parameters<HasReturnFn>;
const fnParamsArr: FnParamsArr = [1, 2, "number"];
```

## ConstructorParameter

`ConstructorParameter`类似`Parameters`，传入类类型，获取类构造器的形参类型并转成数组输出

```typescript
type ClassParamsArr = ConstructorParameters<typeof ClassRoom>;
const classParamArr: ClassParamsArr = [511, "the first one"];
```

# infer 类型推断

只能在条件类型的`extends`子句中使用，`infer`得到的类型只能在`true`语句中使用, 即`X ? Y : Z`中的`X`中推断，在`Y`位置引用

## 推断数组项的类型

```typescript
//  定义，Array<infer U>或者(infer U)[]推断数组项的类型为U，判断是否继承数组类型，若是的话返回数组项类型U
// type ArrayItem<T> = T extends Array<infer U> ? U : never
type ArrayItem<T> = T extends (infer U)[] ? U : never
//  调用推断
type I1 = ArrayItem<number[]>
// 推断是数组，type I1 = number
type I2 = ArrayItem<number>
// 推断不是数组，type I2 = never
const arr = [1, "2", 3]
type I0 = ArrayItem<typeof arr>
// 推断是数组<number | string>[]，type I0 = string | number
const i0: I0 = arr[0]
//  arr[0] = 1，类型为number，符合I0类型，成功通过类型判断
```

## 推断单个数组项的类型

结合展开符`...`可推断单个数组项的类型。
推断第一个数组项的类型：

```typescript
//  定义
type InferFirst<T extends unknown[]> = T extends [infer FirstItem, ...infer Others] ? FirstItem : never
//  调用
type I3 = InferFirst<[number, string, boolean]>
//  推断为传入数组类型的第一项类型，type I3 = number
```

推断出`type I3 = number`
接着推断最后一个数组项的类型：

```typescript
//  定义
type InferLast<T extends unknown[]> = T extends [...infer Others, infer LastItem] ? LastItem : never
type I4 = InferLast<[3, 2, 1]>
```

推断出`type I4 = number`

## 推断方法参数类型

推断方法里的参数类型，类似Parameters<Function>：

```typescript
// 定义，...args代表的是函数参数组成的元组, infer FnParams代表的就是推断出来的这个函数参数组成的元组的类型
type InferParameters<T extends Function> = T extends (...args: infer FnParams) => any ? FnParams : never
//  调用
type I5 = InferParameters<((arg1: string, arg2: number) => void)>
```

推断出`type I5 = [string, number]`

## 推断返回值类型

推断方法的返回值类型，类型ReturnType<Function>:

```typesript
//  定义
type InferReturnType<T extends Function> = T extends (...args: any) => infer ReturnType ? ReturnType : never
//  调用
type I6 = InferReturnType<() => string>
```

推断出`type I6 = string`

推断出Promise中的返回值类型：

```typescript
//  定义
type InferPromise<T> = T extends Promise<infer U> ? U : never
//  要推断的Promise
type Fn = () => Promise<string>
//  调用推断
type Data = InferPromise<ReturnType<Fn>>
```

以上推断出`type Data = string`

## 推断字符串中的字符

推断字符串字面量类型的第一个字符对应的字面量类型：

```typescript
//  定义
type FirstString<T extends string> = T extends `${infer First}${infer _}` ? First : []
//  调用
type I8 = FirstString<"John">
```

以上推断出`type I8 = "J"`

# 协变

接口中继承的超集可以协变成父级类型：

```typescript
interface Person {
    name: string
}

interface Student extends Person {
    classname: string
}

let p1: Person = {
    name: "mimi"
}
let s1: Student = {
    name: "xixi",
    classname: "初一"
}
s1 = p1 //  不允许将父级赋值给超集，因为父级缺少超集的必须有的属性类型
p1 = s1 //  允许将超集赋值给父级，类型依旧是父级，无法调用超集的内容
p1.classname //  不允许调用超集属性，因为父级类型没有该属性，即使已经将超集赋值给父级也不行
```

类型中如果属性类型能对应上，则不需要接口继承关系也能自动完成协变：

```typescript
type Person = {
    name: string
}
type Student = {
    name: string
    classname: string
}
let p1: Person = {
    name: "mimi"
}
let s1: Student = {
    name: "xixi",
    classname: "初一"
}
p1 = s1 //  允许，理由同之前一样，即使没有两个类型没有继承关系也可以自动降级
```

# 逆变

与变量类型和接口相反，参数类型是逆变的，无论协变和逆变都是为了最终的代码安全。

```typescript
type PersonIntroFn = (args: Person) => string
type StudentIntroFn = (args: Student) => string
let personIntro: PersonIntroFn = args => `Hello, I'm ${args.name}`
let studentIntro: StudentIntroFn = args => `Hello, I'm ${args.classname} student ${args.name}`
personIntro = studentIntro  //  不允许，因为studentIntro实际代码有可能会调用超集参数中的超集属性，而赋值给[类型是父级参数的方法]却必定是不能调用的
studentIntro = personIntro //   允许，因为personIntro实际代码只会调用父级参数中的父级属性，而赋值给[类型是超集参数的方法]依旧能满足调用要求
```

# 交叉类型

通过&或|组合类型变成交叉类型

```typescript
interface Teacher {
    name: string
    teach: string
}

interface Student {
    name: string
    learn: string
}

type Mixer1 = Teacher & Student
//  等同于 type Mixer1 = { name: string, teach: string, learn: string }
type Mixer2 = Teacher | Student
//  等同于 type Mixer2 = { name: string}
```

另一种比较复杂的理解方式，强制组合泛型参数变成交叉类型：

```typescript
type UnionToIntersection<U> = (U extends U ? (a: U) => any : never) extends (a: infer R) => any ? R : never
type Copy<T> = {
    [K in keyof T]: T[K]
}
type res = Copy<UnionToIntersection<{ a: 1 } | { b: 3 }>>
//  等同于 type res = { a: 1, b: 3 }
```
