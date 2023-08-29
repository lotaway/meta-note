#include <fstream>
#include "compile_process.h"
compile_process* compile_process_create(const std::string& filename, const std::string& out_filename, int flags) {
	std::ifstream* file = new std::ifstream{ filename };
	if (!file->good()) {
		return NULL;
	}
	/*while (!file->eof()) {

	}*/
	compile_process* process = (struct compile_process*)calloc(1, sizeof(struct compile_process));
	process->flags = flags;
	process->cfile.i_file = file;
	if (out_filename != "") {
		std::ofstream* out_file = new std::ofstream{ out_filename };
		if (out_file->good())
			process->o_file = out_file;
	}
}