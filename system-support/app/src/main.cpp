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
	//	����ָ�룬�Ǻ������const����ʾ��ָ������ָ��
	utils::Tree_node const* num1;
	num1 = new utils::Tree_node{ 1 }; // �޸�ָ�룬����
	//*num1 = utils::Tree_node{ 1 };	//	�޸ı�����������
	// ָ�볣�����Ǻ��Ҳ���const����ʾָ���ǳ���
	utils::Tree_node* const num2 = new utils::Tree_node{ 2 };
	*num2 = utils::Tree_node{ 2 };	//	�޸ı���������
	//num2 = new utils::Tree_node{ 2 }; // �޸�ָ�룬����
	// ����ָ�볣������ʾָ�����ĳ���ָ�룬������ָ�뻹�Ǳ����������޸�
	const utils::Tree_node* const num3 = new utils::Tree_node{ 3 };
}

int main() {
	get_usb_devices();
	int in;
	std::cin >> in;
}
