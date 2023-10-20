@[TOC](C++-Rust-一次性掌握两门语言)

# 简介

本文主要是通过介绍C++和Rust的基础语法达成极速入门两门开发语言。

## 关于C++

C++是在C语言的基础之上添加了面向对象的类、重载、模板等特性和大量标准库以达到让使用者更高效地进行开发工作的系统级语言，应用场景主要是游戏应用、游戏引擎、数据库等底层架构开发（而C更适合于系统内核、云搜索等算法和内存管理要求极高的程序）。

## 关于Rust

Rust则是吸取了Typescript、Python、C++、Go等各类前辈的语法特色创建出来的现代化系统级语言，目前常见于后端程序开发、Wasm、内核重写等。
最重要的特点就是所有权与借用的特性，使之让很多内存问题在编译阶段甚至在编写代码时就能实时告知开发者，避免了众多运行时问题。

# 特色

C++最大的特点就是使用*星号指针和&引用来自由地操作内存地址与值，但开发者使用不当也很容易造成内存泄漏。

```cpp
void main() {
    //  直接在栈上创建实例，好处是随着作用域结束而自动销毁，无需手动管理
    User user;
    //  在堆上创建实例并拿到指针，好处是将随着程序一直存在，当不使用后需要手动进行销毁
    User *user = new User("拉克丝");
    // 修改指针指向的变量的内容，此时指针不变
    *user.name = "伊利斯"; // 等同于user->name = "伊利斯";
    // 修改指针本身，此时指针改变，且变量也为新的，注意这种方式会导致原本变量占用的内存没有被释放
    user = new User("伊利斯");
    //  手动销毁堆实例释放内存，否则若程序保持运行时，该内存块则一直被占据
    delete user;  
}
```

Rust最大的特点是所有权与借用的概念，Rust中大部分变量要不通过引用来指向同个地址，要不是直接移动而非复杂变量，通过严格控制来减少内存泄漏的可能性。

```rust
fn main() {
    ///  直接在栈上创建实例，mut表示这是一个变量，好处是随着作用域结束而自动销毁，无需手动管理
    let mut user = User {};
    ///  执行移动赋值，没有mut表示这是一个常量，user2获取到user的值，并让user变得不可用
    let user2 = user;
    /// 作用域结束时自动执行销毁实例释放内存，以下代码无需手动调用
    // Drop[user2];
    //  创建一直存在的堆实例，好处是将随着程序一直存在，当不使用后需要手动进行销毁
    let user3 = Box::new(User {});
    //  手动销毁堆实例释放内存，否则若程序保持运行时，该内存块则一直被占据
    std::mem::drop(user3)
}
```

可以简单地理解为Rust做的各种赋值操作背后都是采用C++的`std::move()`函数将右值放入左值，或者将左值移动到左值。
而C++如果不使用`std::move()`函数的话，赋值都是直接复制（浅拷贝）一个新的，类似Rust实现Copy特征，这样在释放内存时可能因为多次释放导致空悬指针，进而报错，因此C++不成文的规定就是类的定义需要完成5个构造方法：构造、复制、移动、双重引用移动、析构。

Rust还有另一特点是没有Null值。
其使用了枚举`Option`来指代变量可能为空，用枚举`Result`来指代输出值正常或异常的情况，类似于C++的`std::optional<T>`可选值和`throw/try/catch`的捕获错误方式。
这种做法相当于强制要求开发者进行变量的Null值判断，最大程度防止程序运行时异常停止。

以下函数展示一个函数中，第二个参数可能为空，返回值可能异常的情况，注意传参和返回都会进行枚举处理：

```rust
use std::error::Error;

fn plus_val(value: i32, plus: Option<i32>) -> Result<i32, Error> {
    match plus { 
        Option::Some(v) => {
            if v == 1 {
                return Error("plus can't be 1.")
            }
            value * v
        },
        Option::None => value * 2,
    }
}

fn test() {
    let result1 = plus_val(2, Option::None);    // 2 * 2 = 4
    let result2 = plus_val(2, Option::Some(4)); //  2 * 4 = 8
    //  可以用match语法搭配枚举值处理
    match result1 {
        Ok(r1) => println!("{}", r1),
        Err(error) => panic!("r1 error!")
    }
    //  也可以直接链式处理（此处只处理成功情况）
    result2.and_then(|r2| println!("{}", r2));
}
```

# 数据类型

两者的数据类型相差不多，甚至可以说大部分开发语言的数据类型都是这些。

| 类型\语言    | C++                         | Rust           | 说明                                                                             |
|:---------|:----------------------------|:---------------|:-------------------------------------------------------------------------------|
| 布尔型      | bool                        | bool           | 可取值只有true和false，用于指代一些状态开关                                                     |
| 有符号短整型   | short int                   | i32            | Rust使用字母i加上比特位数来表示有符号的整数类型，整型变量的默认类型                                           |
| 更短的有符号整型 |                             | i8,i16         |                                                                                |
| 有符号整型    | int                         | i64            | C++最常使用的整型变量类型                                                                 |
| 有符号长整型   | long int                    | i128           |                                                                                |
| 无符号整型    | unsigned int                | u64            |                                                                                |
| 无符号短整型   | unsigned short int          | u32            |                                                                                |
| 无符号长整型   | unsigned long int           | u128           |                                                                                |
| 更短的无符号整型 |                             | u8, u16        |                                                                                |
| 字符       | char                        | char           | 注意C++的字符是1~2个字节，而Rust的字符是1~4个字节，占据更大空间也意味着嫩表示更广的字符集或者更多字符                      |
| 字符串（不可变） | const char*                 | &str           | C++的不可变是通过指定一个常量字符指针指向字面量所在地址，而Rust的定义类似，是定义一个引用指向字面量地址，只不过依旧可以修改引用指向的地址，即重新赋值 |
| 字符串      | std::string                 | String         | 可变字符串，可随时对内部字符进行增删改，注意Rust的String实际是对vec<u8>的封装                                |
| 空值       | void                        | unit           | 表示没有值、空值、无值的情况，常用于函数的返回值                                                       |
| 定长数组     | int[4] 或者 std::array<int,4> | [i32;4]        | 用于存放固定数量的相同类型值，这里都定义了固定数量4，类型为整型。由于长度在编译期就能确定，意味着可以预先分配好                       |
| 元组       | std::tuple<T1,T2,...,Tn>    | (T1,T2,...,Tn) | 用于存放若干个不同类型但相同用途的值，类似于数组版的结构体                                                  |

其他比较常用的内置类型：
* 可变长度数组：C++为std::vector<ValueType>，Rust为vec<ValueType>，这是这类开发语言中更常用的数组类型，可变长度意味着更适用于实际场景根据输入进行长度变动。
* 哈希表：C++为std::unordered_map<KeyType, ValueType>，Rust为HashMap<KeyType, ValueType>，大部分算法或者要求唯一键名的用途都会大量使用哈希表。


# 声明常量、变量

C++属于传统的强类型编程语言，由于认为类型是必须在编译前就定好（静态类型），因此类型都是先于变量名/函数名之前指定。

以下示例声明常量、变量、赋值、复制：

```cpp
//  声明常量，需要在类型前面加上const关键字，类型为int
const int num1 = 1;
//  声明变量，没有初始值，延后进行赋值
int num2;
//  对声明好的变量进行赋值
num2 = 1;
//  声明变量，类型为int，并赋予初始值
int num3 = 2;
//  赋值修改变量值，类型被限制为int，不可赋值为其他类型值
num3 = 3;
//  复制值，浅拷贝，（对于基础类型的值如int）两者将无关联，但对于指针或引用类型将会保持关联
int num4 = num3;
//  修改num4的值，不影响num3
num4 = 4;
//  引用，两者保持关联，num4的修改将会反映到num3上，反过来也如此，但不可修改指针指向（指针会在之后对象进行解释）
int num5 = &num4;
// 修改num5的值，num4跟着变为5
num5 = 5;
// 常量指针，看星号前面有const，表示指向一个常量的指针，指向的常量不可变，但指针本身可修改
const int* num6 = 6;
// 或者int const* num6 = 6;
*num6 = 7; // 修改指向的常量，不可行
num6 = &7; // 修改指针，可行
// 指针常量，看星号后面有const，表示指针是常量，指针不可变，但指向的变量可以修改
int* const num7 = 7;
*num7 = 8;  // 修改指向的变量，可行
num7 = &8;  // 修改指针，不可行
//  指向常量的指针常量，表示指针和指向的常量都是不可变的
const int* const ptr = &num7;
```

Rust吸收了现代语言的特性，虽然依旧认为类型是必须的，但也尽可能通过自动推断减少开发者多余的类型定义工作。
还强制必须赋予变量初始值，否则编译时会直接报异常，但容许延后进行赋值。

以下示例声明常量、变量、赋值、移动（转移所有权）：

```rust
fn variable() {
    /// 声明常量，使用let关键字，此处自动推断类型为i32
    let num1 = 1;
    /// 上面例子等同于
    let num1: i32 = 1;
    /// 声明变量，在let关键字后添加mut关键字，没有初始值，延后进行赋值，类型自动推断为i32
    let mut num2;
    num2 = 1;
    /// 声明变量，并赋予初始值
    let mut num2 = 1;
    /// 转移所有权，此时num3获得num2的值，并让num2变得不可用
    let mut num4 = num3;
    /// 只读借用，此处num5引用了num4的值，此时num4和num5都是可用，但num5不可对值进行修改，而对num4进行修改会反映到num5上
    let num5 = &num4;
    num5 = 2;   //  报错！不可修改！
    /// 可写借用，此时num6可以修改num4的值，但同一生命周期内只能存在一个可写借用
    let num6 = &mut num4;
    //  使用星号*操作指针指向的变量，修改num6，连num4的值也会跟着变为3
    *num6 = 3;
    // 裸指针，这里创建了一个指向i32变量的常量指针
    let raw_ptr: *const i32 = &num5;
}
```

总结：
* C++里将一个变量赋值给另一个或者传参时，都是采用浅拷贝复制的操作，而Rust采用的是移动操作
* C++里引用`&val`即可建立可变引用关联，相当于Rust里的`&mut val`，而Rust里的引用`&val`相当于C++对指针常量`const int* val`的使用
* C++的指针变量`*val`可对地址或值进行修改，也可被引用，修改值将让相同地址的多个指针变量值都被修改，而修改地址本身将会让当前变量指向新的地址，从而失去关联性，而引用`&val`就是弱化版的指针，因为其不可修改地址，而只能修改值。Rust的指针`*mut val`也是如此
* C++为了减少指针需手动释放带来的问题，提供了智能指针`std::unique_ptr/std::shared_ptr/std::weak_ptr`达成自动释放，Rust也提供了`Box`达成相似目标。

# 判断与循环

C++使用传统的if、else、switch作为判断，使用for、while作为循环：

```cpp
void handler(std::vector<unsigned int>& list) {
    unsigned int max = 0;
    for (auto *it = list.begin(); p != list.end(); p++) {
        unsigned int temp = *it;
        switch (temp) {
            case 1:
                temp = 2;
                break;
            case 3:
                temp = 4;
                break;
            default:
                break;
        }
        if (temp > max)
            max = temp;
    }
}
```

Rust除了有if、else、while、for之外，将switch换成了match减少了多余的语法，还有永久循环loop，并且都可以直接获取到返回值：

```rust
fn handler(list: &[u32]) {
    let max = 0;
    for &item in list {
        //  注意temp可以直接拿到返回值
        let temp = match item { 
            1 => 2,
            3 => 4,
            _ => item
        };
        max = if temp > max { temp } else { max };
    }
}
```

# 函数

C++定义函数是返回值类型在前，函数名称在后：

```cpp
void main() {
    // 函数体
}
```

Rust遵从现代语言方式，用关键字表示这是一个函数声明，并将类型放在后面：

```rust
fn main() -> unit {
    // 函数体
}
```

# 抽象化的对象：类与接口

C++拥有struct结构体和class类，但没有interface接口，且这两者实际上除了一个默认声明为public公开，一个为private隐藏之外，并无其他区别。
C++一般是在.h头文件中声明结构体和类作为抽象化的用途。

头文件中定义结构体和类声明：

```h
struct User {
    std::string name;
    bool enable;
    unsigned int level;
};
//  定义接口
struct IUserController {
private:
    User* user;
public:
    virtual void init();
    virtual User& getInfo();
};
```

cpp文件中实现类方法和使用结构体：

```cpp
// 实现接口，在类里如果没有说明，默认都是隐藏
class UserController: public IUserController {
    User* user;
public:
    void init() override {

        delete user;
        user = new User{ "Way",true, 1 };
    }
    
    User& getInfo() override {
        return *user;
    };
}
```

cpp文件中使用类：

```cpp
void main() {
    UserController uCtrler;
    uCtrler.init();
    std::cout << uCtrler.getInfo() << std::endl;
}
```

Rust中虽然有结构体，但并没有类，结构体是同时作为结构体和类来使用的，同时提供了trait特征作为类似接口的存在提供各种抽象化。由于没有头文件的概念，需要自己分隔声明、实现、调用的文件结构。

定义结构体和类声明：

```rust
// 声明结构体
struct User {
    name: String,
    enable: bool,
    level: u64,
}

//  定义接口

pub trait GetInfo {
    fn get_info() -> &User;
}

//  声明类
struct UserController {
    user: User,
}

//  实现接口
impl GetInfo for UserController {
    fn get_info(&self) -> &User {
        &self.user
    }
}

// 定义类方法
impl UserController {
    fn init_user_info(&mut self) {
        self.user = User { name: String::from("Way"), enable: true, level: 1 };
    }
}
```

使用类：

```rust
fn main() {
    let u_ctrler = UserController { user: User { name: "Way", enable: true, level: 1 } };
    u_ctrler.init();
    println!("{}", u_ctrler.getInfo());
}
```

要注意特征和接口有不一样的地方，就是特征只能定义方法，不能定义属性/状态，即变量，是因为Rust更期望做好内存管理，如果这么定义那每个实现特征时都有大量额外内存开辟，不符合Rust对内存的严格管理。
而C++更自由地让开发者直接操作内存，主要也和C++的接口实际是通过抽象类与头文件声明来间接实现的，只要开发者知道自己在做什么C++就允许。

# 枚举

两者差别不大，不过C++的枚举是忽略枚举名称的，使用时是直接使用属性名：

```cpp
enum PlayerStatus {
    PLAYER_MOVE,
    PLAYER_STOP
}

void check_status(PlayerStatus status) {
    std::cout << status == PLAYER_MOVE << std::endl;
}
```

Rust除了遵循枚举名::属性名的使用方式之外，还允许在内部继续定义结构体，类似Kotlin的密封类，这样可以让枚举完成更多更复杂的功能，方便封装状态操作等。

```rust
enum PlayerStatus {
    MOVE,
    STOP,
    OTHER {
        name: String,
        value: i8
    }
}

impl PlayerStatus::OTHER {
    fn equal(&self, &value: i8) -> bool {
        self.value == value
    }
}

fn check_status(status: PlayerStatus) {
    println!("{}", status == PlayerStatus::MOVE);
}
```

# 重载操作符

C++重载操作符是通过对类型的`operator+/operator-`等规定好的方法进行重载，即可改变或增加变量`val1 + val2`之间的运算符处理方式，连索引`list[index]`这种方式也能重载。

```bash
class Vec {
public:
  float x, y;
  void Vec(float _x, float _y): x(_x), y(_y) {}
  Vec operator+(const Vec &other) override {
    Vec _new;
    _new.x = x + other.x;
    _new.y = y + other.y;
    return _new;
  }
}

void use_it() {
  Vec v1{1.0, 2.0}, v2{3.1, 4.5};
  Vec v3 = v1 + v2;
}
```

Rust是通过规定好的特征，实现特征所要求的方法即可重载变量运算符的处理：

```rust
use std::ops::Add;

struct Vec {
    x: f32,
    y: f32
}

impl Add for Vec {
    type Output = Vec;
    
    fn add(self, rhs: Self) -> Self::Output {
        Vec {
            x: self.x,
            y: self.y
        }
    }
}

fn use_it() {
    let v1 = Vec {x: 1.0, y: 2.0};
    let v2 = Vec {x: 3.1, y: 4.5};
    let v3 = v1 + v2;
}
```

# 模板与泛型

C++中只有一种类似于泛型但更加强大的特性：template模板，其不仅可以装填类型，还能附加常量值，使之能用于创建多个不同版本的类或函数。

以下例子使用模板创建一个包含长度为7的整形数组的类，并传递名称：

```cpp
template<T, Size>
class TheTemplate {
  T *arr[Size];
  std::string name;
public:
  TheTemplate(std::string *_name, T *_arr[Size]): name(*_name), arr(_arr) {};
}

void create() {
  TheTemplate week<int, 7>{"星期", new int[7]{1,2,3,4,5,6,7}};
  TheTemplate month<int, 12>{"月份", new int[7]{1,2,3,4,5,6,7,8,9,10,11,12}};
}
```

注意该类是在编译期就根据已确定的模板创建多个副本类，抹除模板的存在，类似这样：

```cpp
class TheTemplate1 {
  int *arr[7];
  std::string name;
public:
  TheTemplate1(std::string *_name, int *_arr[7]): name(*_name), arr(_arr) {};
}

class TheTemplate2 {
  int *arr[12];
  std::string name;
public:
  TheTemplate1(std::string *_name, int *_arr[12]): name(*_name), arr(_arr) {};
}

void create() {
  TheTemplate1 week{"星期"};
  TheTemplate2 month{"月份"};
}
```

而Rust中泛型除了用于装载类型外，还能用于装载生命周期注解，并广泛用于创建不同类型的类与函数。
生命周期注解是Rust特有的具象化生命周期概念，其用单引号加小写字母的形式表示如'a，'b。生命周期注解并不会直接改变变量、参数、返回值本身的生命周期，而是类似类型一样对其本身的生命周期进行要求和约束。
以下同样是创建一个与上述例子相同的泛型结构体，并使用生命周期'a来约束入参与返回值应该具有的生命周期：

```rust
struct TheGenerator<T> {
    arr: [T],
    name: String,
}

impl<T> TheGenerator<T> {
    fn get_welcome<'a>(&self, word: &'a str) -> &'a String {
        self.name + word
    }
}

fn create() {
    //  注意这里的泛型也可以不用填写，Rust可以根据初始值自动推断
    let week = TheGenerator::<i8> {
        arr: [1, 2, 3, 4, 5, 6, 7],
        name: "星期",
    };
    let month = TheGenerator {
        arr: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
        name: "月份",
    };
    //  符合规则时不需要显示传递生命周期注解
    let result = month.get_welcome("hello");
    println!("{}", result);
}
```

以上的getWelcome方法中约束了出参的生命周期必须达到与入参一样长，要注意出参的生命周期并没有被缩短，还是按照原本的规则（这里的规则是出参使用了结构体的name属性，因此出参与结构体实例化后的生命周期一致，是直到超出结构体实例所在作用域才结束。

Rust的泛型也是和C++的模板一样会在编译期就生成多个结构体副本，抹除泛型的存在。
Rust还有一个简化版的泛型约束，先看看原本约束方式：

```rust
fn see_me<T: Add>(a: T, b: &T) -> T {
    a + b
}

fn use_me() {
    SeeMe(1, 2);
}
```

以上实现了对函数参数类型约束，要求两个参数都为T类型并且实现了Add相加的特征，也可以简写为以下方式：

```rust
fn see_me(a: impl Add) -> impl Add {
    a + 1
}

fn use_me() {
    SeeMe(2);
}
```

要求泛型同时具有多种类型，除了直接使用加号`<T: Add + Copy>`的方式外，还可以使用where从句：

```rust
use std::fmt::Display;

fn some_fn<T, U>(a: &T, b: &U) -> i32 where T: Add + Copy, U: Add + Display + PartialEq {
    if a > b {
        println!("{}", *b);
    }
    a + b
}
```

Rust还可以通过添加过程宏`#[derive(泛型名称)]`在结构体上自动实现内置的泛型功能，如以下代码让结构体ListNode自动实现PartialEq泛型要求的eq、ne等比较方法：

```rust
#[derive(PartialEq)]
struct ListNode {}

fn use_it() {
    let l1 = ListNode{};
    let l2 = ListNode{};
    println!("{}", l1.eq(l2));
}
```

# 宏

宏的概念其实可以视为将一连串操作都定义为一个名称，之后任意位置该名称即可调用定义好的操作。

C++的宏大多是继承自C，以#号开头，内置宏包括但不限于：
* include 用于导入库，其后使用尖括号<>或双引号""可导入相对路径的头文件，如#include <iostream>，#include "states.h"
* if/ifdef/else/endif，与代码使用的if/else是一样的作用，但额外提供了ifdef用于判断是否存在某个宏名称，搭配调试与发布不同的运行环境可让其生成不同的代码
* define 用于定义变量或函数，名称与内容隔开，如:
```cpp
# 定义一个宏变量
#define DEBUG 1
# 定义一个宏函数ADD
#define ADD(a, b) a+b，
```
使用时只需要：
```cpp
# 判断是否存在该宏变量，若存在则保留内部代码块，即执行宏函数ADD
#ifdef DEBUG
#ADD(2, 3)
#endif
```

Rust的宏以!号加任意一种括号如{},(),[]包裹入参结尾，使用方式类似函数/结构体，其后需使用任意括号跟上参数，可根据输入参数数量与类型（采用规则匹配）来决定内部处理方式，内置宏包括但不限于：
* print!/println! 最常使用的命令行输出宏函数，其后需跟输出内容如`println!("Hello")`
* panic! 抛出异常并结束程序，除了调试外，正常程序不应当使用该宏命令
* assert!/assert_eq!/assert_ne!/debug_assert!/debug_assert_eq!/debug_assert_ne! 断言，主要用于测试程序是否正常，如判断函数返回值是否与要求一致，不正确则抛出错误并终止程序
* vec! 创建Vec结构体的宏
* local_thread! 创建线程本地变量，在不同线程中引用时会单独初始化一次，让不同线程中可以拥有自己的副本变量

#[derive(名称)] 过程宏，需要在Cargo.toml文件中引入库[lib] proc-macro = true后，通过#[proc_macro_derive/proc_macro_attribute(名称)]+符合输入输出类型的函数定义即可使用：

```rust
#[proc_macro_derive(HelloMacro)]
pub fn hello_macro(stream: TokenStream) -> TokenStream {
    let tokens = stream.into_iter().map(|token| {
        match &token {
            TokenTree::Ident(ident) => {
                //  判断并修改结构体名称
                if ident.to_string() == "UseMacro" {
                    return TokenTree::Ident(Ident::new(string: "JustNew", Span::call_site()));
                }
                token
            },
            _ => token
        }
    }).collect();
    TokenStream::from_iter(tokens.into_iter())
}

#[derive(HelloMacro)]
struct UseMacro {}

fn use_it() {
    let um = JustNew{};
}
```

以上定义了一个过程宏，将结构体UseMacro名称变成了JustNew并可正常实例化。
原理是编译器会将附加了过程宏的结构体解析成多个标记树（Token Trees，介于Token与AST之间）TokenStream传给宏函数，开发者可以根据需要修改后返回全新的TokenStream给编译器，从而达成类似装饰器、注解的效果。
不过示例的原始TokenStream搭配枚举处理非常繁杂，可以引入syn、quote库来更好地解析、定义新内容：

```rust
#[proc_macro_derive(HelloMacro)]
pub fn hello_macro(stream: TokenStream) -> TokenStream {
    let input = syn::parse_mocro_input!(stream as DeriveInput);
    let name: Ident = input.ident;
    quote!{
        impl #name {
            fn show_me() {
                println!("Hello, I'm new method define by macro");
            }
        }
    }.into()
}

#[derive(HelloMacro)]
struct UseMacro {}

fn use_it() {
    let um = UseMacro{};
    //  使用过程宏附加的实例方法
    um.show_me();
}
```

# Lambda匿名函数表达式

C++版，采用，类型可以使用std::function<ParamType,ReturnType>或者直接用auto表示：

```cpp
void lambda(int value) {
    auto func = [](int)=>{ std::cout << x << std::endl; };
    func(value);
}
```

Rust版，采用竖线开始并用于分隔参数列表和函数体：

```rust
fn lambda(value: &i32) {
    let func = |x: &i32| println!("fn!{}", x);
    func(value)
}
```

# 引入库依赖

C++作为传统编程语言，依赖引入方式除了内置的标准库可以直接使用`#include <libraryName>`宏引入外，其他第三方或者自行开发的库都需要通过一套复杂流程才能引入使用。
* 如果是在开发工具中：将所需库文件放入项目/解决方案内，添加链接器指向的依赖文件路径，最后才能在代码里同样使用`#include`宏引入。
* 如果是使用make/cmake命令构建：需要配置MakeFile.txt、MakeLists.txt等文件，填写依赖来源和生成方式等，具体参考[CMake基础](https://blog.csdn.net/weixin_42703267/article/details/120339897)，这里不展开

Rust作为现代新语言，积极吸纳其他编程语言的优点，将依赖管理与引入都放到单个总配置文件Cargo.toml中进行配置，对于大部分第三方公开库只需要写入包名和版本号即可：

```toml
[dependencies]
syn = "1.0"
quote = "1.0"
```

以上配置引入了syn库和quote库的1.0版本，引入后需要运行重建项目命令`cargo build`来下载库依赖，像idea之类提供了按钮一键完成。
更多配置请看[官方文档](https://doc.rust-lang.org/cargo/reference/manifest.html)

# 异步与并发

大部分编程语言在处理耗时计算、网络请求之类都会采用另开线程或协程、子任务的方式让程序执行，这样不会阻塞主线程继续处理需要即时响应的事件，如界面显示与反馈、用户操作事件或者命令行、远程调用、监听所触发的事件。

C++中采用std::thread开启线程，而std::future实现这种类协程的异步处理，通过#include<future>即可导入使用，其中会有std::package_task，std::promise，std::async。
具体介绍看这个[C++的异步操作](https://blog.csdn.net/King_weng/article/details/100087867)
简单总结就是：

## packaged_task版

1. 通过std::packaged_task传入想要执行的函数生成task对象；
2. 使用task.get_future()获取到std::future对象；
3. 直接将task当做目标函数执行，或者通过std::thread指定线程执行task；
4. 任意地方通过future.get()获取结果。

## promise版

1. 通过std::promise直接生成一个promise对象；
2. 使用promise.get_future()获取到std::future对象；
3. 在任意地方执行目标函数，或者通过std::thread指定线程执行并通过promise.set_value(value)传递返回值；
4. 在任意地方通过future.get()获取结果。

## async版

1. 通过std::async传入想要执行的函数、参数和执行时机，获取到std::future对象；
2. 任意地方通过future.get()获取结果。

Rust使用std::thread来开启线程，使用impl future for StructName的方式来实现协程异步处理，其中需要对poll方法进行实现，内部可以通过weaker来唤醒和Poll::pending、Poll::Ready来表示处理中和完成两种状态。
具体介绍可以看这个[Rust异步之Future](https://www.cnblogs.com/s-lisheng/p/13072570.html)
简单总结就是：
1. 通过实现future的方式为结构体实现poll方法；
2. 在该方法中或者另外的地方开启线程、执行目标函数、提供Poll::Ready或Poll::Pending的枚举值变化；
3. 通过future对象获取到结果。

可以感受到大部分编程语言都是趋向于使用协程去承载各种子任务或者耗时任务，而把是否创建线程和如何管理线程池、任务调度方式都交给程序底层处理。
当然这是偏向于应用层面，如果更趋向于建设基础设施，如数据库、通用通讯框架等大多会选择自行处理这些逻辑。

# 总结

C++的地方比较尴尬，嵌入式方面往往都是C和汇编的领域，就算上一点到基础建设、框架、编译器之类，如果不是为了开发效率而更注重内存管理的话，也是用C解决问题，C++的存在更多是配合QT写软件，或者在游戏引擎、游戏开发上和C#竞争。
个人是很喜欢C++的，虽然它有很多乱七八糟的特性，但既贴紧底层又有各种的气息让我感觉很甜美。
而Rust算是小众语言，号称是用于取代C++的，虽然有小部分公司已经用上了，微软称已用其修改Window源码，Linux6似乎开始上Rust，Wasm和区块链开发也都用上了。