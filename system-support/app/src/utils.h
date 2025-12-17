#pragma once
#include "./include/stdafx.h"
//	std::mutex 互斥锁
#include <mutex>
//	std::async 异步任务
#include <future>
//	stack 栈所需要
#include <stack>
//	静态库，需要打包到exe文件中，效率更好，但单文件更大
//	动态库，一般是放置到exe文件旁边
//	引入依赖库
// #include <GLFW/glfw3.h>
//	引入解决方案中的其他项目
// emsdk无法识别，只能使用引号加相对路径"../../engine/src/engine.h"，除了cpp和标准库以外的文件都没有被编译进去wasm
#include <engine.h>
#include "logger.h"

namespace utils
{
	void use_library();
	void variable_and_log();
	void increment_with_pointer(int *);
	void increment_with_reference(int &);
	void pointer_and_reference();
	void local_static_var();
	void init_static();
	enum player_level;
	enum class player_status;
	class player
	{
	private:
		player_level m_level;
		player_status m_status;

	public:
		int m_positionX, m_positionY;
		int m_speed;
		//	构造函数，实例化时调用的方法，名称和类名一样，需要初始化所有的实例变量
		//	explicit关键字禁止隐性转换，如Player player = PlayerLevel_EntryLevel;
		explicit player(player_level);
		//	摧毁类实例时调用的方法，名称为【~类名】
		virtual ~player();
		void move(int, int);
	};
	//	重载操作符
	class vec2
	{
	public:
		float m_x, m_y;
		vec2(float, float);
		vec2 add(const vec2 &) const;
		//	重载操作符加号
		vec2 operator+(const vec2 &) const;
		vec2 multiply(const vec2 &) const;
		//	重载操作符乘号
		vec2 operator*(const vec2 &) const;
		bool is_equal(const vec2 &) const;
		//	重载相等操作符
		bool operator==(const vec2 &) const;
	};

	class vec4
	{
	public:
		//	使用花括号初始化引用的类
		vec2 vec{2.0f, 2.0f};
		vec2 &get_vec2();
	};
	void fastMove(player &, int, int);
	//	struct 是为了兼容c语法，与class的区别只有struct内的值默认是public，而class默认都是private
	struct normal_person
	{
		int m_positionX, m_positionY;
		int m_speed;
		player *m_like;
		void move(int, int);
		void follow(player &);
	};
	//	访问修饰符
	class trainer
	{
		//	只能此类调用
	private:
		int m_runLevel;
		int m_runNumber;
		//	可被此类和继承类调用
	protected:
		int m_age;
		int m_sex;
		//	所有代码都可调用
	public:
		trainer(int, int, int);
	};

	//	通过虚函数实现抽象类/接口
	class runner
	{
	public:
		virtual void run() = 0;
	};

	//	继承
	class racer : public runner
	{
	public:
		char m_cup;
		int m_rank;
		//	初始化列表形式的构造函数
		racer(const char &, int);
		void run() override;
	};

	class winner : public racer
	{
	public:
		std::string get_news();
	};

	class init_static
	{
	public:
		static const int s_defaultSpeed = 2;
		static int s_maxSpeed;
	};

	void init_class();

	void init_array();

	void print_string(const std::string &);

	void init_string();

	class only_read_fn
	{
	private:
		int m_x;
		mutable int getCount;

	public:
		only_read_fn();
		//	使用const在尾部将函数标记为不会修改类
		const int get_x() const;
	};

	void init_const();

	void init_calculate();

	int *createArray();

	//	利用栈类来摧毁堆类
	class entity
	{
	public:
		void dododo();
	};

	class scope_entity
	{
	private:
		entity *m_entity;

	public:
		//	构造函数，传入堆上的实例entity
		scope_entity(entity *e) : m_entity(e) {
								  };
		//	析构函数，删除堆上的实例entity
		virtual ~scope_entity()
		{
			delete m_entity;
		}
		//	复制构造函数，用于处理复制时的情况，需要重新创建一个堆实例entity
		scope_entity(const scope_entity &other) : scope_entity(other.m_entity)
		{
		}
		//	移动构造函数
		scope_entity(scope_entity &&other) noexcept : m_entity(std::exchange(other.m_entity, nullptr))
		{
		}
		//	复制赋值，赋值时需要进行原地址的析构和对新地址复制构造
		scope_entity &operator=(const scope_entity &other)
		{
			return *this = scope_entity(other);
		}
		scope_entity &operator=(scope_entity &&other) noexcept
		{
			std::swap(m_entity, other.m_entity);
			return *this;
		}
	};

	void init_stack_class();

	void init_intelligence_pointer();

	class ss
	{
	private:
		char *m_buffer;
		unsigned int m_size;

	public:
		ss(const char *);
		//	拷贝时会调用的构造函数
		ss(const ss &);
		virtual ~ss();
		void print() const
		{
			std::cout << m_buffer << std::endl;
		}
		char &operator[](unsigned int index)
		{
			return m_buffer[index];
		}
		//	友元方法声明，可让私有变量也被外部函数调用
		friend void fri(ss &, const char *);
	};

	//	友元方法定义，可以调用声明处的实例私有属性
	void fri(ss &, const char *);

	void string_copy();

	class origin
	{
	public:
		void print() const;
	};

	class spec_pointer
	{
	private:
		origin *m_origin;

	public:
		spec_pointer(origin *);
		const origin *operator->() const;
	};

	void arrow_point();

	struct vex2
	{
		float x, y;
		vex2(float, float);
	};

	template <typename _vector>
	void print_vector(const std::vector<_vector> &);

	void init_vector();

	//	通过联合体设置共享内存地址的双关类型，例如下面的4个浮动类型可以替换成2个Vex类型（因为Vex是2个浮动类型）
	union vex4
	{
		struct
		{
			float p1, p2, p3, p4;
		};
		struct
		{
			vex2 a, b;
		};
	};

	void init_union();

	//	整型和双重精度浮动型也是双关类型，可设置为联合体
	union number_value
	{
		int nvi;
		double nvd;
	};
	//	实践中会使用类似xyz空间坐标同时代表rgb颜色使用

	//	用于多返回值的struct
	struct return_struct
	{
		std::string x;
		std::string y;
		int z;
	};

	//	利用struct多返回值
	return_struct return_mutiply_struct();

	//	用于传递多个引用参数并多返回值
	void return_params(std::string &, std::string &, int &);

	//	用于数组多返回值
	std::array<std::string, 2> return_array();

	//	返回自定义的多返回值
	std::tuple<std::string, std::string, int> return_tuple();

	//	多返回值方法：1、struct；2、传递引用参数再赋值；3、返回数组；4、tuple定义多个不同类型值。
	void init_return();

	//	template可以通过指定泛型来减少无谓的函数重载定义
	template <typename first_param>
	void template1(first_param param);

	//	template定义类里的变量类型和数组大小
	template <typename _arr, int size>
	class sarray
	{
	private:
		_arr arr[size];

	public:
		int getSize() const;
	};

	void initTemplate();

	template <typename _value>
	//	如果形参里定义的回调函数是匿名类型会导致lambda无法使用[]捕获作用域变量，会报错参数不符合
	// void each(const std::vector<Value>& values, void(*handler)(Value));
	//	形参里用标准库方法模板定义回调函数类型，lambda才能使用[]捕获作用域变量
	void each(const std::vector<_value> &, const std::function<void(_value)> &);

	void init_auto();

	void do_work();

	void init_thread();

	void init_sort();

	void init_get_file();

	void initStringOptimization();

	bool isPalindrome(int);

	void initListNumberAdd();

	int lengthOfLongestSubstring(std::string);

	std::string checkPassword(std::string);

	void testCheckPassword();

	struct Tree_node
	{
		int val;
		std::vector<Tree_node *> children;
		Tree_node(int val)
			: val(val) {}
		Tree_node(int val, std::vector<Tree_node *> &children)
			: val(val), children(children) {}
	};

	std::vector<int> tree_node_to_array(Tree_node *);

	void test_tree_node2array();

	void testQuickSort();

	double findMedianSortedArrays(std::vector<int> &, std::vector<int> &);

	void initFindMedianSortedArrays();

	void initCountMoney();

	std::string longestPalindrome(std::string);

	std::string convert(std::string, int);

	int strongPasswordChecker(std::string);

	void testStrongPasswordChecker();

	std::string reverseParentheses(std::string);

	void testReverseParentheses();

	void initLambda();

	void reverse_num();

	void test_reverse_num();

	int reverse_number_position();

	void test_reverse_number_position();

	int atoi(std::string);

	void test_atoi();

	int count_time(std::string);

	void test_count_time();

	std::vector<int> add_negabinary(std::vector<int> &, std::vector<int> &);

	void test_add_negabinary();

	bool regex_match(const std::string &, const std::string &);

	void test_regex_match();

	int GetMinimumBeauty(std::vector<int> &, int);

	void TestGetMinimumBeauty();
}
