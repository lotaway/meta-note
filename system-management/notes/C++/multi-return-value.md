@[TOC](C++基础-多个返回值的方式)
基本上想要获取到多个返回值有4种方式：

* 结构体，需要另外定义一个结构体，但结构自由灵活，非常推荐使用
* 数组，只能容纳一种类型值，有利有弊
* 引用参数，通过传入引用参数并赋值的方式达成
* tuple，通过C++提供的自定义数据内容

## 结构体

```shell
#include <iostream>
#include <string>
//	定义多个返回值的结构
struct ReturnValue {
	std::string x;
	std::string y;
	int z;
};
//  想要返回多个值的方法
ReturnValue someFunction() {
	return { "hello", "lotaway", 1 };
}
int main() {
    //  调用方法获取到多个返回值
	auto result = someFunction();
	//  输出返回值
	std::cout << result.x + ',' + result.y + ',' + std::to_string(result.z) << std::endl;
}
```

## 引用参数

```shell
#include <iostream>
#include <string>
// 想要返回多个值的方法
void someFunction(std::string& str1, std::string& str2, int& z) {
	str1 = "hello";
	str2 = "lotaway";
	z = 1;
}
int main() {
    // 需要先定义接受返回值的变量
    std::string str1, str2;
	int z;
	//  调用方法获取到多个返回值
	someFunction(str1, str2, z);
	//  输出返回值
	std::cout << str1 + ',' + str2 + ',' + std::to_string(z) << std::endl;
}
```

## 数组

```shell
#include <iostream>
//	用于数组多返回值
std::array<std::string, 2> someFunction() {
	std::array<std::string, 2> arr;
	arr[0] = "hello";
	arr[1] = "lotaway";
	return arr;
}

int main() {
	//  调用方法获取到多个返回值
	auto array = someFunction();
	//  可放弃不需要的返回值
	//  auto array = someFunction(nullptr, nullptr, z);
	//  输出返回值
	std::cout << array[0] + ',' + array[1] << std::endl;
}
```

# tuple

```shell
#include <iostream>
#include <string>
#include <tuple>
//	想要返回多个值的方法
std::tuple<std::string, std::string, int> someFunction() {
	return std::make_tuple("hello", "lotaway", 1);
}

int main() {
	//  调用方法获取到多个返回值
	std::tie(str1, str2, z) = someFunction();
	//  输出返回值
	std::cout << str1 + ',' + str2 + ',' + std::to_string(z) << std::endl;
}
```
