#pragma once
#include "./include/stdafx.h"
namespace logger
{

#define PROFILING 1
#if PROFILING
#define PROFILE_SCOPE(name) logger::timer timer##__LINE__(name);
#define PROFILE_FUNCTION() PROFILE_SCOPE(__FUNCTION__)
#else
#define PROFILE_SCOPE(name)
#define PROFILE_FUNCTION()
#endif

	//	基准测试，通过调用计时器/输出到第三方工具/自行收集记录分析/，利用生命周期在构造函数和析构函数完成持续时间计算
	struct timer
	{
		const char *name;
		std::chrono::high_resolution_clock::time_point start, end;
		std::chrono::duration<float> duration;
		timer(const char *);
		~timer();
	};
	struct log_info
	{
		char *name;
		char *message;
		unsigned int result;
	};
	class info
	{
		void test();
	};
	void out(const int);
	void out(const char *);
	void out(const char *, const char *);
	void out(const char *, int);
	void out(const std::string &);
	void out(const std::string &, int);
	void out(log_info);
};