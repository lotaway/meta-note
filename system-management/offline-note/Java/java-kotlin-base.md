@[TOC](Java-Kotlin-一次性掌握两门语言)

# 简介

本文主要是通过介绍Java和Kotlin的基础语法达成极速入门。
Kotlin本质是适合带有一定Java基础或者偏现代语法例如Typescript会更容易上手。

## Java特点

* 提供了字节码与虚拟机组合的方式让跨操作系统运行非常轻松简单，在运行时才转成系统所使用的机器码
* 源于C++，极致的面向对象，一个文件就是一个类，类继承于对象，万物皆对象，没有C++的头文件概念，而使用interface接口抽象化各种参数与约束实现类
* 没有命名空间，只有包+类+方法，不可使用函数式编程，或者说只能在类里定义静态方法
* 通过类与接口的继承、组合、实现既严格又灵活的语法特点，缺点是一个函数调用可以完成的工作变成三行代码加三四个分布在不同文件中的类与接口
* 通过IOC、AOP的特性搭配注解提供了简化依赖、无侵入式编程特性
* 不支持运算符重载，导致封装类型需要调用内部方法传参进行运算

## Kotlin特点

* 与Java代码可互转，并且同样是编译为字节码，使用JVM执行，各种库包可以无缝互相调用
* 遵循现代化开发语言特点，将类型后置，甚至可不用定义类型，由值自动推断类型
* 大量使用Java中后期才提供的Lambda表达式，配合花括号{}把类方法变成简化的函数体
* 防止null值出现
* 行末无须分号结束
* 无自动隐形转换，例如整型1加字符串"1"在Java等语言中会自动转成字符串，但在Kotlin里会报错，要求必须手动将整型1转换成字符串才行
* 支持运算符重载，因此封装类型可以直接运算
* 大量Coroutine协程与Flow流的高并发多任务异步特性

# 类型

## 原始类型

Java可用而Kotlin隐藏了的原始类型，这些类型源于C++，性能最好，但缺少细节处理和无法当作类来调用其中的方法。

包括（注意首字母小写）：

* boolean 布尔型，可选值为true，false
* byte 字节型，即存放文本，只允许1个字节，意味着特殊语言如中文需要占据2~4个字节是无法用它存储的
* char 字符型，即存放文本，允许2/4个字节，根据编译器32/64位而定，因此可以用于存放1个中文文本
* int 整型，属于数字，只允许整数，4个字节（byte）
* short 短整型，属于数字，只允许整数，2个字节
* long 长整型，相当于long int，属于数字，只允许整数，8个字节
* float 浮动型，属于数字，允许小数位存在，4个字节
* double 双精度浮动型，属于数字，允许小数位存在，8个字节

### 关于不同类型存储值的计算方式

例如int整型为4个字节，而1个字节等于8个比特，即整型为4x8=32个比特。
而1个比特可存放0或1这两种值，含有32个比特相当于2的32次方的取值。
而整型是可以存放包含负数在内的整数，因此需要保留1比特位作为正负符号位，剩下31比特，因此实际整型的取值范围为-2^31 ~ 2^31-1。
这里正整数的上限减1是留了1个值来表示0。例如2的2次方取值应当是[0,1,2,3]，2^2-1=3才是代表了正整数上限。

## 封装类型

Java和Kotlin都具有的封装类型，实际是个类。
这些类型是将原始类型值放到类属性里，使用时直接使用类，性能相比原始类型只有可忽略的损耗，实例化时有对内存和数据溢出或null的细节处理，也可作为类调用内部各种方法。
实际Java也更鼓励使用封装类型而不是原始类型，不过基于兼容性原因还是保留了原始类型给人使用。
而Kotlin没有这样的历史烦恼，于是直接全面使用封装类型，不给显式创建原始类型

包括（注意首字母大写）：

* Boolean
* Byte
* String
* Short
* Int
* Long
* Float
* Double

```java
class Zava {
    //  整型常量，不可修改
    final int const1 = 2;
    //  整型变量，可修改
    int variable1 = 1;
    //  封装整型变量，原始类型强化
    Int variable2 = Int.valueOf(1);
}
```

```kotlin
//  常量
val con1 = 1
//  相当于
val con1: Int = 1
//  常量不可修改值
//con1 = 2
//  变量
var con2 = 1
//  同样相当于
var con2: Int = 1
//  变量可修改值
con2 = 2
//con2 = "1"  //  No allow, type are Int
//  字符串，可拼接变量
var cont3 = "this is string with value: ${con1}"
//  相当于
var cont3: String = "this is string with value: " + con1
//  多行字符串和Java一样使用```包裹即可
/*var cont4 = ```
    multiply
    line
    string
```*/
//  不可变数组
var arr = arrayOf(1, 2, 3)
//  可变列表
var arr = mutableListof(1, 2, 3)
```

# 判断

Java与其他语言一样使用if、else、switch：

```java
class Zava {
    init() {
        int i = 2;
        int j;
        String k;
        if (i) {
            j = 20;
        } else {
            k = "20";
        }
        switch (i) {
            case 20:
                j = 20;
                break;
            default:
                k = "20";
                break;
        }
    }
}
```

Kotlin鼓励用when、is、else代替if、else和switch，更具有可读性，并可以直接根据判断赋值或返回值给外部使用：
if判断：

```kotlin
var i = 2
var j = when (i) {
    is Int -> 20
    else -> "20"
}
```

switch判断：

```kotlin
var i = 2
var j = when (i) {
    1 -> 10
    2 -> 20
    3 -> 30
    else -> "as default"
}
```

# 循环

Java有普通的for循环、增强for、数组类型的迭代器、while，而Kotlin没有普通的for循环，只有范围for、增强for、数组类型的迭代器，普通for循环只能用while代替。

## 普通for与while

java有普通or和while循环：

```java
class Zava {
    init() {
        //  普通for
        for (int i = 0; i < 10; i++) {
            System.out.println(i);
        }
        //  while
        int i = 0;
        int length = 10;
        while (i < length) {
            System.out.println(i++);
        }
    }
}
```

kotlin有while循环：

```kotlin
var i = 0
var length = 10
while (i < length) {
    println(i++)
}
```

## 范围for

kotlin独有的范围for：

```kotlin
//  范围循环：从某个数到另外一个数，默认步进值为1，每次循环自增1
for (i in 0 until 10) {
    println(i)  //  输出 0,1,2,3,4,5,6,7,8,9,10
}
//  范围循环：从某个数到另外一个数，并指定步进值，每次循环按步进值自增
for (i in 0 until 10 step 2) {
    println(i)  //  输出 0,2,4,6,8,10
}
//  范围循环，但是自减
for (i in 10 downTo 0) {
    println(i)  //  输出 10,9,8,7,6,5,4,3,2,1,0
}
//  范围循环，使用自动判断增减的省略号..
for (i in 0..10) {
    println(i)  //  输出 0,1,2,3,4,5,6,7,8,9,10
}
```

## 增强for

Java使用冒号:来输出增强for：

```java
class Zava {
    init() {
        int[] arr = new int[]{1, 2, 3};
        for (int value : arr) {
            System.out.println(value);
        }
    }
}
```

Kotlin用in关键字来输出增强for：

```kotlin
var arr = arrayOf(1, 2, 3)
for (value in arr) {
    println(value)
}
```

Kotlin还可输出索引

```kotlin
var arr = arrayOf(1, 2, 3)
for (index in arr.indices) {
    println(index)
}
```

Kotlin也可同时输出索引和值

```kotlin
var arr = arrayOf(1, 2, 3)
for (it in arr.valueWithIndex()) {
    println("${it.index}:${it.value}")
}
```

## 迭代器

Java输出值，注意传统方式是需要实现接口再作为参数传入，后来增加了lambda方式（类似匿名函数）：

```java
import java.util.ArrayList;
import java.util.function.Consumer;

class Zava {
    init() {
        ArrayList<String> arr = new ArrayList<>("hello", "world", "please");
        //  传统Java实现接口的方式
        arr.forEach(new Consumer() {
            void accept(String str) {
                println(str);
            }
        });
        //  后续推荐更简洁的Lambda表达式，类似匿名方法
        arr.forEach((str) -> {
            println(str);
        });
        //  如果已有相同参数与返回值的方法，也能用【包.类::方法名】引用，同属于Lambda语法
        arr.forEach(Zava::println);
    }
    
    public void println(String str) {
        System.out.println(str);
    }
}
```

Kotlin的输出值，注意若是函数参数最后一个为函数式接口，则可以在函数调用后面用花括号和代码块作为lambda匿名函数参数传入，且传递给该函数参数的第一个参数会自动命名为it传入，若函数调用没有其他参数，可以省略小括号：

```kotlin
var arr = arrayOf("hello", "world", "please")
//  直接输出值
arr.forEach {
    println(it)
}
//  上面方式与以下相同，区别在于上述方式简化并将第一个传入的形参视为it
arr.forEach({ index -> {
        println(index)
    }
})
```

Kotlin输出值和索引：

```kotlin
//  输出索引和值，使用匿名方法
arr.forEachIndexed { index, value ->
    println(index, value)
}
//  输出索引和值，定义方法并引入使用
fun iteratorInt(index: Int, value: Int) {
    println(index, value)
}
arr.forEachIndexed(::iteratorInt)
```

## 跳出外层循环

Java通过`名称: for`命名for循环，通过`break 名称`指定要跳出的循环体：

```java
class M {
    init() {
        int sum = 0;
        out:
        for (int i = 1; i < 10; i++) {
            for (int j = 1; j < 4; j++) {
                sum *= (i + j);
                if (sum > 100) {
                    break out;
                }
            }
        }
    }
}
```

Kotlin通过`名称@ for`命名for循环，通过`break@名称`指定要跳出的循环体：

```kotlin
var sum = 0
out@ for (i in range(1, 10)) {
    for (j in range(1, 4)) {
        sum *= (i + j)
        when {
            sum > 100 -> break@out
        }
    }
}
println("跳出后到了这里")
```

# 函数

Java里没有所谓namespace命名空间和函数function，只有定义在类里的方法method，也有人将Java里类当作命名空间，而静态方法当作函数来调用。

```java
class M {
    static int handle(int value) {
        return value * value * 2;
    }

    public static void main(String[] args) {
        System.out.println(handle(2));
    }
}
```

Kotlin相比Java而言重新体现函数的重要性，使用函数代替大部分Java里的类定义和接口实现，其中就包括了main函数（Java里只能定义成类里的main方法）

```kotlin
fun handle(value: Int): Int {
    //  最后一行可以不用return即可将表达式结果作为返回值
    value * value * 2
}
fun main() {
    println(handle(2))
}
```

# 类与接口

Java的类与接口是最为重要的一环，通过接口抽象定义约束，然后交给类具体实现。
Java所有的类默认都是继承自Object对象，Object对象自带有对比、哈希签名等，可以将其视为最简版本的struct，js里也经常使用Object定义参数和各种相关数据集结。
其中实现接口使用implements关键字，语法[class 类名 implements 接口名]。
继承类使用extends关键字，语法[class 类名 extends 父类名]，父类即要被继承的类，继承了父类的类则称为子类。
定义构造方法只需要定义与类型相同的方法即可：

```java
interface Live {
    String info();
}

abstract class Person {
    private final String name = "human";
}

class Man extends Person implements Live {
    private String name;
    private int age;

    //  定义一个无参的构造方法
    Man() {

    }

    //  定义一个多惨的构造方法
    Man(String name, int age) {
        this.name = name;
        this.age = age;
    }

    //  定义一个获取私有属性的方法
    getName() {
        return name;
    }

    //  定义一个设置私有属性的方法
    setName(String _name) {
        name = _name;
    }

    // 实现接口要求的方法
    String info() {
        return "This is " + name;
    }
}
```

Kotlin的类无须new即可创建实例，注意这只是语法糖，内部依旧是使用new，与C++无new则是栈上分配不一样，而是保持与Java等自动指针管理的开发语言一样。
在类名后添加括号可填写默认构造函数的形参列表，需要重构方法则在内部使用constructor关键字即可

采用冒号形式表示继承（类）和实现（接口），其中继承类需要加上小括号表示执行构造函数，并且要注意，默认所有类都是不可被继承的，所有方法都是不可被重写的，类和方法会自动添加final关键字，需要在被继承的类和被重写的方法前用open关键字修饰，而重写的新方法则用override关键字修饰

```kotlin
interface Live {
    fun info(): String
}
open class Person {
    private val name: String = "human"
}
class Man : Person(), Live {
    fun info(): String = "This is $name"
}
```

Kotlin的构造方法使用constructor关键字，可添加不同参数重写为多个构造方法，如果只有一个默认构造方法，可以定义在类名后。

```kotlin
interface Live {
    fun info(): String
}
class Person(var name: String, var age: Int) : Live {
    private var name
        get() {
            return "The name is : $name"
        }
        set(value) {
            name = value
        }
    private var age

    //  定义构造方法
    constructor(name: String) : this(name, 1)
    constructor() : this("无名氏")

    fun info(): String {
        return this.toString()
    }
}
```

Java中类class默认是继承于对象Object，对象会自带有转字符串方法toString(), 对比方法composeTo, 哈希值hashCode()
，但不一定适用于开发，再加上大量私有属性需要添加get和set方法，往往一个UserPojo类只添加4个私有属性id,email,gender,typeId后看起来是这样的：

```java
public class UserPojo implements Comparable<UserPojo> {
    private Integer id;
    private String email;
    private String password;
    private Integer authorId;
    private Short typeId;

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        UserPojo userPojo = (UserPojo) o;
        if (!Objects.equals(id, userPojo.id)) return false;
        if (!Objects.equals(email, userPojo.email)) return false;
        if (!Objects.equals(password, userPojo.password)) return false;
        if (!Objects.equals(authorId, userPojo.authorId)) return false;
        return Objects.equals(typeId, userPojo.typeId);
    }

    @Override
    public int hashCode() {
        int result = id != null ? id.hashCode() : 0;
        result = 31 * result + (email != null ? email.hashCode() : 0);
        result = 31 * result + (password != null ? password.hashCode() : 0);
        result = 31 * result + (authorId != null ? authorId.hashCode() : 0);
        result = 31 * result + (typeId != null ? typeId.hashCode() : 0);
        return result;
    }

    @Override
    public int compareTo(@NotNull UserPojo o) {
        return 0;
    }
}
```

后来有第三方库lombok包提供的@Data注解后看起来终于干爽点：

```java

@Data
public class UserPojo {
    private Integer id;
    private String email;
    private String password;
    private Integer authorId;
    private Short typeId;
}
```

Kotlin可以通过在类前添加data关键字修饰符可以让类自动完成get/set和重写copy，toString，composeTo，hashCode等方法。
也可以通过添加by可以使用委托的形式让其他类完成所需的事情，例如此处让必须实现的方法info委托给Person处理，Man自身可以不实现：

```kotlin
data class Man : Live by Person {
    fun work() {
        println("Go to work")
    }
}
```

Kotlin还有另一种通过by方式实现属性值的委托，包含了[重载运算符](https://blog.csdn.net/qq_32677531/article/details/127336188)
特性重载了赋值和获取值的行为

```kotlin
class FamilyChoose {
    var version = 1
    operator fun getValue(thisReference: Any, property: KProperty<*>): String {
        return v
    }
    operator fun setValue(thisReference: Any, property: KProperty<*>, i: String) {
        version++
        v = i
    }
}
class Woman : Person {
    var workType by FamilyChoose()
}
```

以上代码相当于将变量workType的取值和赋值都委托给类FamilyChoose处理，方便在受类约束的情况下，完成复杂与动态的处理。

# 枚举类

通过枚举类可以完成罗列所需的有限集合，例如罗列用户的职业身份，方柏霓使用带有语义的身份名称进行各种判断。
属性值实际是继承自一个object类的实例，所以可以进行各种类操作，例如用于比较、输出字符串等。
由于属性值都是实例，所以在任何地方引入使用都是相同值，但实例也造成了必须长时间占用堆内存无法回收。

在Java中，虽然叫枚举类，但使用的关键字是enum而没有class，注意可以通过括号指定实际值，否则就是按照0,1,2,3的顺序定义实际值：

```java
public enum Type {
    //  定义语义化名称，实际只是定义语义化的类实例，内部还是整型值
    TEACHER, WORKER, ENGINEER(10), DESIGNER;
    //  可以像类一样定义属性和方法
    private final int _default = ENGINEER;

    Type getDefault() {
        return _default;
    }
}

class Zava {
    void init() {
        //  比较两个枚举值
        bool isSame = Type.TEACHER.equals(Type.WORKER);
    }
}
```

而Kotlin采用enum class关键字定义枚举类：

```kotlin
enum class Type {
    //  定义语义化名称，实际只是定义语义化的类实例，内部还是整型值
    TEACHER, WORKER, ENGINEER(10), DESIGNER;

    //  可以像类一样定义属性和方法
    private val _default = ENGINEER
    fun getDefault() = _default
}
//  比较两个枚举值
val isSame = Type.TEACHER.equals(Type.WORKER)
```

# 密封类

Kotlin特有的属于枚举类的扩展类，相比起来属性值直接使用了类本身而不再是实例，当在使用时才创建实例，所以可被回收，虽然每次创建的实例不同，但可以对比类类型来确认是否相同

```kotlin
interface Skill {
    val name: String
    val damage: Int
}

sealed class PartTimeJob {
    data class Driver(val name: String) : PartTimeJob()
    data class Batman(val skills: Array<Skill>) : PartTimeJob()
}
//  密封类可以很好地配合when完成分支判断并根据不同分支所拥有的不同参数进行额外处理
fun handle(partTimeJob: PartTimeJob) {
    when (partTimeJob) {
        is PartTimeJob.Batman(emptyList()) -> println("The batman:$partTimeJob.skills")
        else -> println("A driver: $partTimeJob.name")
    }
}

fun main(wantToByHero: Boolean) {
    val partTimeJob = if (wantToByHero) PartTimeJob.BATMAN() else PartTimeJob.DRIVER()
    handle(partTimeJob)
}
```

密封类最强大的地方在于额外封装众多实例方法用于处理各种情况，这是枚举类无法做到的

```kotlin

//  定义密封类的成员方法
inline fun PartTimeJob.isDriver(next: (String) -> Unit) {
    if (this is PartTimeJob.Driver)
        next(name)
}

inline fun PartTimeJob.isBatman(next: (Array<Skill>) -> Unit) {
    if (this is PartTimeJob.Batman)
        next(skills)
}

//  实例可以通过调用共用的成员方法轻松完成类似when的分支判断
fun handle2(partTimeJob: PartTimeJob) {
    partTimeJob.isDriver {
        println("A driver:$name")
    }
    partTimeJob.isBatman {
        println("The batman:$skills") 
    }
}

fun main(wantToByHero: Boolean) {
    val partTimeJob = if (wantToByHero) PartTimeJob.BATMAN() else PartTimeJob.DRIVER()
    handle2(partTimeJob)
}
```

# VirtualThread & Coroutine 虚拟线程与协程

开关线程会有一定消耗，因此频繁开关或者大量创建线程就会有严重性能问题，这对于原本想通过多线程提速的程序显得弄巧成拙。 
协程就是更进一步通过定义挂起阻塞的操作，把实际线程开关交给程序处理（也可手动指定），保证独立有栈的前提下让这种并发执行任务的过程变得顺畅，相当于一种更小粒度的虚拟线程。
Kotlin很早就支持了协程的特性，而Java在经历了众多版本迭代在21之后也开始支持类似协程的虚拟线程。
协程用法与线程非常类似，大抵都是调用、实现一个方法，在内部执行耗时或者异步（协程）操作，防止阻塞主线程，特别是客户端的UI更新或者后端接口响应。

Kotlin中的用法：

```kotlin
//  声明这是一个可挂起的函数
suspend fun main() {
    //  启动一个协程
    runBlock {
        //  再启动一个新的协程并指定在IO线程中执行
        launch(Dispatchers.IO) {
            //  阻塞当前上下文2秒后执行，模拟调用API与写入文件等耗时操作
            delay(2000)
            println("hello coroutine in IO")
        }
        //  阻塞当前上下文0.5秒后执行，模拟UI计算更新等操作
        delay(500)
        println("hello in coroutine block")
    }
}
```

以上两个父子协程是并行执行任务的，因此可以做到各种各自执行，即使阻塞也是只在协程自身的上下文环境内阻塞，而不会影响到外在的其他协程和主线程。
至于Java的例子，估计大部分线上环境还停留在Java8，没机会用上Java21的虚拟线程，但还是简单展示一下创建：

```java
public class TheThread {
    //  执行一个沉睡一秒的任务，将其重复十万次
    public static void start(Executor executor) {
        IntStream.range(0, 100_000).forEach(i -> {
            //  使用submit执行一次就会利用executor复制一个线程/虚拟线程
            executor.submit(() -> {
                Thread.sleep(Duration.offSeconds(1));
                return i;
            });
        });
    }
    
    //  创建新线程，任务耗时21秒
    public static void real() {
        try (var executor = new Excutors.newThreadPerTaskExcutor(Thread::new)) {
            start(executor);
        }
    }

    //  创建虚拟线程，任务耗时3秒
    public static void virtual() {
        try (var executor = new Excutors.newVirtualThreadPerTaskExecutor()) {
            start(executor);
        }
    }
}
```

虚拟线程大部分是模仿协程的方式去实现的封装sleep、yield等。
注意虚拟线程和协程解决是IO密集的任务，可以解决效率问题，但对于CPU密集型，也就是大量计算的类型，依旧是开启一个线程去执行比较好，甚至如果不考虑阻塞问题，单线程计算肯定是最快的，因为不需要开关线程和切换上下文。
深入学习协程需要大量时间，网上也有各种优秀教程，这里就不展开述说。

# flow 流

流是Kotlin中也非常常用到的异步订阅发布数据的特性，简单讲就是利用一个订阅机制，使得数据发送者可以异步、多次、持续地发送数据，而订阅者也可以按照这种节奏来多次接收和处理数据，适用于分包的大捆数据、持续更新的响应式实时数据等情况。

流分为冷流和热流，简单讲冷流需要有订阅者（调用collect）的情况下才会执行发布者的方法，而热流不关心有没有订阅者，会直接执行发布者方法，持续地将数据发到缓冲区，之后订阅者（调用collect）会从缓冲区获取数据，热流这种情况由于缓冲区空间有限，可以无意或故意丢弃部分数据。

```kotlin
//  创建一个方法返回流，这里使用了flow函数来创建流
fun createFlow(): Flow<String> = flow<String> {
        //  执行一次提交，这会触发一次订阅者的处理
        emit("world")
        runBlock {
            //  使用循环和延时阻塞来模拟有间隔地多次提交数据
            (0..10).forEach {
                delay(1000)
                emit(it)
            }
        }
    }.filter {
        //  生成的流也可以使用流自带的filter、map等方法来操作数据，这些方法最后也是自动通过emit提交来输出新的数据，订阅者接收到的就是经过处理的数据
        it != ""
    }.map {
        "Hello, $it"
    }

fun main() {
    runBlocking {
        //  使用collect方法订阅流
        createFlow().collect {
            //  每次接收到新数据就会执行本方法体代码
            println(it)
        }
    }
}
```

大体讲完了，本文到此为止，以后有什么基础更新再补充。

# 花括号链式写法优势

Kotlin提供了强大的作用域函数（Scope Functions），通过花括号链式写法可以大大简化代码，提高可读性。这些函数包括：`apply`、`let`、`run`、`with`、`also`。

## HmacSHA加密对比

### Java写法

```java

public class Example {
    public static String validaty(String data, String key) throws NoSuchAlgorithmException, InvalidKeyException {
        Mac mac = Mac.getInstance("HmacSHA256");
        SecretKeySpec secretKeySpec = new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
        mac.init(secretKeySpec);
        byte[] hash = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
        String result = Base64.getEncoder().encodeToString(hash);
        return result;
    }
}
```

### Kotlin写法（花括号链式）

kotlin可以使用花括号加上let、apply、run等方式轻松达成链式调用和提供不同返回形式，让处理步骤更加符合大脑直觉理解。

```kotlin
import javax.crypto.Mac
import javax.crypto.spec.SecretKeySpec
import java.nio.charset.StandardCharsets
import java.util.Base64

fun validaty(data: String, key: String): String = Mac.getInstance("HmacSHA256").apply {
    init(SecretKeySpec(key.toByteArray(StandardCharsets.UTF_8), "HmacSHA256"))
}.doFinal(data.toByteArray(StandardCharsets.UTF_8)).let { hash ->
    Base64.getEncoder().encodeToString(hash)
}
```