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

int main() {
	get_usb_devices();
	int in;
	std::cin >> in;
}
