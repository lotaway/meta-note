@[TOC](C++基础－宏·auto·指针函数·lambda)

# 预处理宏

宏是一种预处理方法，预处理即＃号所在的行，例如＃prama once，＃include，＃ifdef，而宏使用的是＃define。
程序在编译前会查找所有文件先完成预处理，并且通常只是一种文本替换，完成后才会正式开始编译。

* 模板和宏很像，但模板属于元编程，实际发生在编译阶段，因此宏比模板更早进行处理。
* 宏和模板一样，过度使用会造成代码很难阅读，适量即可。

```bash
#include <iostream>
#define MODE 1
#if MODE=1
＃define LOG(str) std::cout << str << std::endl;
#else
#define LOG(str)
#end
int main() {
	LOG("running main...");
}
```

以上代码通过条件判断决定最后调用LOG的代码会被替换成命令行输出或者空白，而判断的条件同样通过修改宏的值决定，也可以在项目属性》C/C++》预处理器》预处理器定义里，通过设置Debug和Release不同配置，并添加MODE＝1;来指定Debug配置下使用的值。
这样调试Debug模式时就能输出，而调试Release或者发布程序时就不用自行修改代码里的MODE值。

## 多行宏

通过在宏定义行尾放置反斜杠符号\可以达成换行：

```bash
#include <iostream>
#define SPEC_MAIN int spec_main() {\
  std::cout << "spec main running..." << std::endl;\
}
SPEC_MAIN
int main() {
	spec_main();
}
```

各种内置的宏：
* #include 将一个头文件引入，可以是来源于当前项目或另外一个项目或者程序库
* #if/#else/#end 类似代码的if/else，只不过宏是直接根据编译条件满足与否替换掉if或else里的代码，而不是依旧编译为二进制
* #ifdef/#else/#endif 即if define，判断是否已经定义了某个变量或函数从而决定是否替换掉ifdef或else里的代码

# auto类型

auto就是根据右值推断出的要定义的变量类型，类似其他语言里的let关键字定义。

```bash
#include <iostream>
int main() {
	auto v1 = "1"; //  推断v1为char
	auto v2 = 1;  //  推断v2为int
	std::cout << v1 + v2 << std::endl;
}
```

对于auto的使用场景理论上可以用在任何地方，实际遵循几点：

* 需要强制检查或需要代码易读性的地方，最好还是使用类型定义而非auto
* 在临近位置可知晓类型或类型名称太长，不希望重复填写类型可以用auto
* 使用了模板导致返回类型无法确定，因此不得不使用auto，但最好的解决方法是减少模板的使用
* 对函数进行指针引用，如auto fn = someFunctionName

# 函数指针

函数也可以被指针引用，之后可以被调用

```bash
#include <iostream>
#include <string>
#include <vector>
void handler(int val) {
 	std::cout << val << std::endl;
}
void each(const std::vector& values, auto& handler) {
  for (int value : values) {
    handler(value);
  }
}
int main() {
  std::vector<std::string> vec = {1, 2, 3};
  //  方法1：使用匿名类型引用
  void(*fn1)(int) = handler;
  each(vec, fn1);
  //  方法2：用typedef定义类型后引用
  typedef void(*Fn2)(int);
  Fn2 fn2 = handler;
  each(vec, fn2);
  //  方法3：用using定义类型后引用（比较新的方式）
  using Fn3 = typename int(*)(int);
  Fn3 fn3 = &fib;
  each(vec, fn3);
  //  方法4：用auto引用
  auto fn4 = handler;
  each(vec, fn4);
}
```

# lambda 匿名函数

匿名函数，用于一次性或单个方法回调用途，因为只在一个位置调用，所以不使用显式定义函数而是直接匿名定义更方便，如这么写回调：

```bash
#include <iostream>
#include <string>
#include <vector>
#include <functional>
template<typename Value>
//	如果形参里定义的回调函数是匿名类型会导致lambda无法使用[]捕获作用域变量，会报错参数不符合
//void each(const std::vector<Value>& values, void(*handler)(Value)) {
//	形参里用标准库方法模板定义回调函数类型，lambda才能使用[]捕获作用域变量
void each(const std::vector<Value>& values, const std::function<void(Value)>& handler) {
	for (Value value : values) {
		handler(value);
	}
}

int main() {
	const char* name = "extra";
	using Value = int;
	std::vector<Value> vec = { 1, 2, 3 };
	// 匿名函数里没有当前作用域的变量
	each<Value>(vec, [](Value val) { logger::out("name", val); });
	// 匿名函数里需要有当前作用域的所有变量
	each<Value>(vec, [=](Value val) { logger::out(name, val); });
	// 匿名函数里需要有当前作用域的某个变量
	each<Value>(vec, [&name](Value val) { logger::out(name, val); });
}
```
