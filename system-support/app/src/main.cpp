#include "./include/EM_PORT_API.h"
#include "./include/stdafx.h"
#include "logger.h"
#include "utils.h"
#include "hazel.h"
#include "./platform/usb.h"

extern "C"
{
#include "hello.h"
}

void test_val() {
	//	常量指针，星号左侧有const，表示是指向常量的指针
	utils::Tree_node const* num1;
	num1 = new utils::Tree_node{ 1 }; // 修改指针，可行
	//*num1 = utils::Tree_node{ 1 };	//	修改变量，不可行
	// 指针常量，星号右侧有const。表示指针是常量
	utils::Tree_node* const num2 = new utils::Tree_node{ 2 };
	*num2 = utils::Tree_node{ 2 };	//	修改变量，可行
	//num2 = new utils::Tree_node{ 2 }; // 修改指针，不行
	// 常量指针常量，表示指向常量的常量指针，无论是指针还是变量都不可修改
	const utils::Tree_node* const num3 = new utils::Tree_node{ 3 };
}

int main() {
	get_usb_devices();
	int in;
	std::cin >> in;
}
