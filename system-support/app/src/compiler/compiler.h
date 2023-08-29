#pragma once
#include "../include/stdafx.h"
#ifndef META_COMPILE_H
#define META_COMPILE_H
/*
Kyeword: unsigned, signed, char, short, int, float, double, long, void, struct, union, static, __ignore_typecheck__, return ,include, sizeof, if, else, while, for, do, break, continue, switch, case, default, goto, typedef, const, exterun, restrict
Operator: +, -, *, >, <, ^, %, !, =, ~, |, &, (, [, ',', ., ?(We also allow some to join i.e >>, <<, ***)
Number: if (c >= '0' && c <= '9')
Symbol: {, }, :, ;, #, \, ), ]
Identifier: A-Z, a-z, followed by 0-9 and "_" underscrolls (Think of variable names, function names, structure names)
*/
struct token {
	int type;
	int flags;
	union {
		char cval;
		const char* sval;
		unsigned int inum;
		unsigned long lnum;
		unsigned long long llnum;
		void* any;
	};
	// 为真时代表两个token之间有空格，例如* a作为token *意味着有空格应该被作为token "a"
	bool whitespcae;
	const char* between_brackets;
};

struct buffer {};

struct lex_process_function {
};

struct lex_process {
	struct pos {
	};
	struct std::vector<token>* token_vec;
	struct compile_process* compiler;
	int current_expression_count;
	struct buffer* parentheses_uffer;
	struct lex_process_function* function;
	void* m_private;
};

enum compile_process_result {
	COMPILE_PROCESS_SUCCESS,
	COMPILE_PROCESS_FAILED
};

struct compile_process {
	int flags;
	struct compile_process_input_file {
		std::ifstream* i_file;
		const std::string* abs_path;
	} cfile;

	std::ofstream* o_file;
};
int compile_file(const std::string, const std::string, int);
#endif