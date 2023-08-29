#include "./include/stdafx.h"

namespace allocate_metrics {
	static uint32_t s_allocCount = 0;
}

//  重写new操作符让所有堆内存分配都能进行记录，以便进行程序优化
//void* operator new (size_t size) {
//    allocate_metrics::s_allocCount++;
//    std::cout << "allocating " << size << " bytes\n";
//    return malloc(size);
//}

//void operator delete(void* memory, size_t size) {
//    allocate_metrics::s_allocCount--;
//    std::cout << "Freeing " << size << " bytes\n";
//    free(memory);
//}