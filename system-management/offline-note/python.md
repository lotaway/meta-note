@[TOC](Python学习-基础介绍)

# Python基本语法介绍

## 变量

Python中的变量不需要声明，直接赋值即可。变量的类型会根据赋值自动确定。

```python
a = 1
b = "hello"
c = True
```

## 数据类型

Python中数据类型：

* int 整型
* float 浮点型
* str 字符串
* bool 布尔型
* list 列表
* tuple 元组
* dictionary 字典
* set 集合

还有通过numpy库引入的类array数组类型。
类型会根据初始值自动推断而无须手动声明，反之若是没有初始值则需要手动声明。

```python
num = 1  # 整型
_num: int = 1  # 以上等同
type(num) # 获取数据类型
flo = 1.0  # 浮点型
_flo: float = 1.0  # 以上等同
str = "hello"  # 字符串
_str: str = "hello"  # 以上等同
is_true = True  # 布尔型
_is_true: bool = True  # 以上等同
the_tuple = (1, 2, 3)  # 元组，与列表的区别在于元组是只读类型，长度固定，元素不可修改，常用于函数多返回值和将静态资源缓存在内存中使用
_the_tuple: tuple[int, ...] = (1, 2, 3)  # 以上等同
the_dictionary = {"name": "Tom", "age": 18}  # 字典
_the_dictionary: dictionary = {"name": "Tom", "age": 18}  # 以上等同
```

## 列表 list

列表不是数组，列表每一项都可以是不同类型的值，而数组是都为同类项，且需要另外导入库才能使用的。

### 添加

添加3到末尾：

```python
list = [1]
list.append(3)
```

添加可迭代对象到末尾，方便一次性添加多个元素：

```python
list = [1]
list.extend([4, False])
```

插入字符串元素"10"到索引1位置：

```python
list = [1, 2, 3]
list.insert(1, "10")
```

### 删除

从列表删除指定字符串元素"10"：

```python
list = [1, "10", 2, 3]
del list["10"]
```

从列表删除指定索引1位置的元素，若不指定索引值则默认删除最后一个：

```python
list = [1, 2, 3]
list.pop(1)
```

从列表删除第一个出现的元素3：

```python
list = [1, 2, 3, 3]
list.remove(3)
```

### 统计分析

返回列表长度：

```python
list = [1, 2, 3]
len(list)
```

统计元素3出现次数：

```python
list = [1, 2, 3, 3]
list.count(3)
```

以下是数值型列表可用：
```python
list = [1, 2, 3, 3]
min(list) # 求最小值
max(list) # 求最大值
sum(list) # 求和
```

### 切片器

切片器语法方便对列表/元组/数组进行索引与数量的筛选返回新切片列表。
语法是`list[startindex:endindex:sort]`，可以只加冒号而不填具体数值。
多维则使用逗号区分行列`list[r_startindex,c_startindex:r_endindex,c_endindex:sort]`
返回列表索引1开始，到3之前的元素列表（包头不包尾，索引1所在的元素会被包含在切片里，而索引3所在的元素不会被放入切片）：

```python
list = [1, 2, 3, 5, 7, 10, 30]
sub_list = list[1:3]
```

返回最后三个元素的列表切片：

```python
list = [1, 2, 3, 5, 7, 10, 30]
sub_list_last = list[-3:]
```

返回反转整个列表的切片：

```python
list = [1, 2, 3, 5, 7, 10, 30]
sub_list_reverse = list[::-1]
```

## set 集合

set集合代表是不可重复的变量集合，例如不能同时存储两个1，但集合不一定有序。

```python
the_set = {"joker", "king", "queen"} # set 无重复集合
_the_set: set = {"joker", "king", "queen"} # 以上等同
```

#### 添加

添加新数据，可以是单个元素或者元组

```python
the_set = {}
the_set.add("kiva")
```

添加一组数据，可以是元组、列表、字典等，如果添加字符串会自动拆分成多个单独字符

```python
the_set = {}
list1 = [1, 2, 3]
the_set.update(list1)
```

# 判断是否存在

```python
if "king" in the_set:
    print("it's in.")
```

# 删除

删除数据，若数据不存在则报错

```python
the_set = {}
the_set.remove("joker")
```

删除数据，但即使数据不存在也不报错

```python
the_set = {}
the_set.discard("joker")
```

删除最后添加的数据

```python
the_set = {"joker", "queen"}
the_set.add("king")
the_set.pop()
```

清空数据

```python
the_set = {"joker", "queen", "king"}
the_set.clear()
```

## 数组 array

python本身没有数组类型，需要借助第三方库numpy使用，学习python一般就是用于人工智能数据分析，而数据分析就需要使用numpy库中的众多方法。
其中array方法非常像其他开发语言所使用的数组，也支持索引index、索引值index_key、多维特性，也能与list列表、tuple元组、diconary字典互相转化等

```python
import numpy as np

list = [4, 5, 6]
arr = np.array(list) # 列表转数组
list2 = arr.tolist() # 数组转列表
arr.append(3)  # 采用append添加新数据
arr.count(3)  # 获取元素3出现的次数
arr.extend([4, 5])  # 添加可迭代对象到数组
arr.index(2)  # 获取元素2所在的首个索引
arr.insert(1, 10)  # 插入元素10到索引1位置
arr.pop(1)  # 删除指定索引的元素
arr.remove(3)  # 删除首个出现的指定元素
arr.reverse()  # 反转数组
```

## 运算符

Python中常见的运算符有算术运算符、比较运算符、逻辑运算符等。

```python
a = 1 + 2  # 加法运算
b = 3 - 2  # 减法运算
c = 2 * 3  # 乘法运算
d = 4 / 2  # 除法运算
e = 5 % 2  # 取模运算
f = 2 ** 3  # 幂运算
g = 3 > 2  # 大于运算
h = 3 == 2  # 等于运算
i = not True  # 非运算
j = True and False  # 与运算
k = True or False  # 或运算
```

## 控制语句

Python中常见的控制语句有if语句、for循环、while循环等。

### if/else

```python
# if语句
if a > b:
    print("a > b")
elif a == b:
    print("a == b")
else:
    print("a < b")
```

### for循环

```python
e = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
for i in e:
    print(i)
```

range是范围数值递增器，可以填入开始和结束的两个数值让其逐步递增，如果只填入一个值则默认作为结束值，并从0开始递增

```python
e = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
# 获取数组长度并赋值为
e_last = len(e) - 1
for i in range(0, e_last):
    e[i] += 1
print(a)
```
注意内部块无法直接修改外部块变量的值，因为会被当作是定义新值，因为for循环里的对外部变量进行赋值操作时，由于语法关系会被视为声明内部变量并赋值。
解决方式是使用类属性、数组等具有地址引用的变量，或使用自加运算。

### while

```python
condition = True
while condition:
# do something
```

Python中使用def关键字定义函数，函数可以接受参数，也可以返回值。

```python
def add(a, b):
    return a + b


result = add(1, 2)
print(result)
```

# 类

class关键字用于定义类，类可以包含独有的属性和方法，并根据参数生成不同的实例来使用。
其中类构造器使用指定方法名__init__进行定义，成员方法直接定义，静态方法则需要加上装饰器staticmethod声明

```python
class Person:
    def __init__(self, name, age):
        self.name = name
        self.age = age


    def say_hello(self):
        print("Hello, my name is", self.name)


    @staticmethod
    def print():
        print("hello, this is class Person.")


p = Person("Tom", 18)
Person.print()
p.say_hello()
```

# 异常处理

Python中可以使用try...except...finally语句来处理异常。

```python
try:
# do something
except Exception as e:
# handle exception
finally:
# do something finally
```

# 文件操作

Python中可以使用open函数来打开文件，使用with语句在内部块执行文件操作，可以自动关闭文件。

```python
with open("file.txt", "r") as f:
    content = f.read()
    print(content)
```

# 模块

Python中可以使用import语句来导入模块，也可以使用from...import语句来导入模块中的指定内容。

```python
import math
from cmd import Cmd

result = math.sqrt(2)
print(result)

from datetime import datetime

now = datetime.now()
print(now)
cmd = Cmd(now)
```


# 剩余参数/参数元组/参数字典

用星号加变量名*args和双星号加变量名**kwargs可以创建位置参数元组和关键字参数字典
```python
# 此处的星号*表示将所有参数收入args作为元组
def sayhello(*args):
    # 可以不展开直接使用，类型将是元组，参数数量只有一位
    print(args)
    # 此处的星号*表示将所有参数展开填入作为实参，参数数量根据实际而定，
    print(*args)


# 此处的双星号**表示将所有参数收入kwargs作为字典，带有变量名和变量值
def saybai(**kwargs):
    for key in kwargs:
        print(key, kwargs[key])


def main():
    list = ["mimi", "jiji", "kuuga", "mandala"]
    sayhello(*list)
    sayhello("mimi", "jiji", "kuuga", "mandala")
    saybai(mimi="再见", jiji="See you", kunga="Sa yo na la", mandala="hen")
```

```python

```


# 装饰器

装饰器的用法与大部分开发语言一样，是作为一个寄生方式尝试去接管被装饰的对象（类、函数）的前后状态。

```python
def decorater(func):
    print("define decorate!!!")

    def wrap(*args):
        print("prev decorating!!!")
        result = func(*args)
        print("next decorating:" + result)
        return result

    return wrap


@decorater
def handler(a, b) -> int:
    return a * 2 + b
```

# 使用Python做数据分析

参考来源：
* [数据分析之工具库numpy和pandas](https://zhuanlan.zhihu.com/p/260966111)
* [数据分析之可视化库matplotlib](https://blog.csdn.net/qq_53763141/article/details/128432522)
* [数据分析案例实践](https://zhuanlan.zhihu.com/p/261091670)