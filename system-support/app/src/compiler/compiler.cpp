#include "../include/stdafx.h"
#include "./compile_process.h"
int compile_file(const std::string filename, const std::string out_filename, int flags) {
	compile_process* process = compile_process_create(filename, out_filename, flags);
	if (!process)
		return COMPILE_PROCESS_FAILED;



	return COMPILE_PROCESS_SUCCESS;
}