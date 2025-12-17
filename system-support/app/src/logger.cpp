#include <iostream>
#include "./include/stdafx.h"
#include "logger.h"
using namespace std;

int g_variable = 5; //	全局变量，将可以被extern装饰的同名变量所引用

namespace logger
{

	timer::timer(const char *_name) : name(_name)
	{
		start = end = std::chrono::high_resolution_clock::now();
		duration = end - start;
	};

	timer::~timer()
	{
		end = std::chrono::high_resolution_clock::now();
		duration = end - start;
		//	使用\n也会比<< std::endl更快（快5-8ms）
		std::cout << name + ':' << +duration.count() * 1000.0f << std::endl;
		//	调试时自动触发断点
		__debugbreak();
	};

	void info::test()
	{
	}

	void out(const int value)
	{
		cout << value << endl;
	}

	void into_file(const char *message)
	{
		//	record into file
	}

// 通过条件判断决定最后调用LOG的代码会被替换成命令行输出或者空白，而判断的条件同样通过修改宏的值决定，也可以在项目属性》C / C++》预处理器》预处理器定义里，通过设置Debug和Release不同配置，并添加MODE＝1;来指定Debug配置下使用的值。这样调试Debug模式时就能输出，而调试Release或者发布程序时就不用自行修改代码里的MODE值。
// #define MODE 1
#if MODE == 1
#define modeOut(message) cout << message << endl;
#else
#define modeOut(message) into_file(message)
#endif

	void into_file(std::string message)
	{
		//	write log into file
	}

	void out(const char *message)
	{
		modeOut(message);
	}

	void out(const char *message, const char *name)
	{
		out(name);
		out(message);
	}

	void out(const char *message, const int value)
	{
		out(message);
		out(value);
	}

	void out(const std::string &message)
	{
		modeOut(message);
	}

	void out(const std::string &message, const int value)
	{
		out(message);
		out(value);
	}

	void out(log_info l_info)
	{
		out(l_info.message);
		out(l_info.name);
	}
}