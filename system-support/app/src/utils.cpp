#include "utils.h"

#define debugger(msg) std::cout << "main::debugger:" + msg << std::endl

extern int g_variable;	//	将从外部所有文件里找到这个全局值，目前定义在log.cpp里

namespace utils {
	//	来源于静态库或动态库的方法
	void use_library() {
		//int a = glfwInit();
		//std::cout << a << std::endl;
		engine::print_message();
	}

	void variable_and_log() {
		logger::out("hello world");
		const char* name = "c++";
		std::string s = "This's string";
		//std::wstring s = "这就是字符串了";
		logger::out("welcome", name);
		int value = -1;
		unsigned int u_val = 2;
		float f_val = 5.5f;
		double d_val = 5.5;
		short s_val = 1;
		long l_val = 2;
		long int li_val = 3;
		bool need_more_info = value < 0;
		//logger.out("going end", value);
		std::cin.get();

		if (need_more_info) {
			logger::out("need more info");
			for (int i = 0;i < 10;i++) {
				value--;
				logger::out("value", value);
			}
		}
		std::cin.get();

		int var = 8;
		void* ptr = &var;
		//*ptr = 10;	//	错误，void指针无法明白10是什么类型则不能写入
		int* ptr1 = &var;
		*ptr1 = 10;	//	正确，int指针明白10应当是整型类型，可以写入
		double* ptr2 = (double*)&var;
		//log((char*)&ptr2);
		std::cin.get();

		char* buffer = new char[8];	//	请求8字节内存
		memset(buffer, 0, 8);	//	用数据填充内存
		//	执行一些操作
		char** ptr3 = &buffer;
		//	执行一些操作之后。。。
		delete[] buffer;	//	删除指针，因为填充了内存
		std::cin.get();
	}

	//	强大：传递指针进行修改
	void increment_with_pointer(int* value) {
		(*value)++;
	}

	//	简化：传递引用进行修改，推荐使用这种方式
	void increment_with_reference(int& value) {
		value++;
	}

	void pointer_and_reference() {
		int a = 5;
		int* b = &a;
		int c = 8;
		*b = 6;
		increment_with_pointer(b);
		logger::out("incrementWithPointer b", *b);
		logger::out("what about a", a);
		increment_with_pointer(&a);
		logger::out("incrementWithPointer a", a);
		logger::out("what about b", *b);
		increment_with_reference(a);
		logger::out("incrementWithReference a", a);
		std::cin.get();

		int& ref = a;
		//	ref是对a的引用，将c这个值赋值给ref和a，即a=8，ref=8，并且c=8，两者互不干扰
		ref = c;
		logger::out("ref", ref);
		//	指针可以被修改指向到新的地址，但引用不可以，只能赋值
		b = &c;
		c = 10;
		logger::out("b change", *b);
	}

	void local_static_var() {
		//	局部静态变量实际上是持续存在的静态变量，第一次调用会初始化（值为1），之后保持增长（2、3、4...）
		static int variable = 1;
		variable++;
		std::cout << "local static variable " + std::to_string(variable) << std::endl;
	}

	void init_static() {
		logger::out("extern global variable", g_variable);
		//	调用多次函数内将输出不同的局部静态变量
		local_static_var();	//	2
		local_static_var();	//	3
		local_static_var();	//	4
	}

	//	传统枚举，枚举名只是作为类型而非命令空间存在，会自动将内部属性名称作为当前作用域变量使用
	enum player_level {
		PLAYER_LEVER_ENTRY_LEVEL,
		PLAYER_LEVEL_INTERMEDIATE,
		PLAYER_LEVEL_EXPERT
	};

	//	枚举类，枚举名同时作为类型和命名空间存在，需在前缀加上类名才能调用
	enum class player_status {
		ENABLED,
		DISABLED
	};

	player::player(player_level level = PLAYER_LEVER_ENTRY_LEVEL) : m_level(level), m_status(player_status::ENABLED), m_positionX(0), m_positionY(0), m_speed(15) {
	}

	player::~player() {
		std::cout << "go out" << std::endl;
	}

	void player::move(int new_x, int new_y) {
		m_positionX += new_x * m_speed;
		m_positionY += new_y * m_speed;
	}

	void fast_move(player& self, int new_x, int new_y) {
		self.m_positionX += new_x * self.m_speed * 2;
		self.m_positionY += new_y * self.m_speed * 2;
	}

	void normal_person::move(int new_x, int new_y) {
		m_positionX += new_x * m_speed;
		m_positionY += new_y * m_speed;
	}
	void normal_person::follow(player& _player) {
		m_like = &_player;
	}

	trainer::trainer(int run_number, int age, int sex) {
		m_runLevel = 0;
		m_runNumber = run_number;
		m_age = age;
		m_sex = sex;
	}

	void runner::run() {};

	racer::racer(const char& cup, int rank) : m_cup(cup), m_rank(rank) {}

	void racer::run() {
		std::cout << "run" << std::endl;
	}

	std::string winner::get_news() {
		return "He win.";
	}

	//	初始化静态变量只能在类外的全局方式完成
	//	方式1：通过类名设置
	int init_static::s_maxSpeed = 3;
	//	方式2：类实例里也能像设置成员变量一样设置静态变量
	//InitStatic initState;
	//int initState.s_maxSpeed = 3

	void init_class() {
		//	在栈上实例化，只在作用域内存在，离开作用域后自动释放内存，且栈只有1~2MB大小
		player* p1;
		{
			player pl;
			pl.m_positionX = 0;
			pl.m_positionY = 0;
			pl.m_speed = 10;
			pl.move(1, 1);
			fast_move(pl, 1, 1);
			p1 = &pl;
		}
		//	p1指向为空的Player类，因为原本的player已经销毁
		std::cout << p1 << std::endl;
		//	在堆上实例化，可以在作用域以外的地方存在，不使用时需要手动释放内存
		player* p2;
		{
			player* player2 = new player();
			player2->m_positionX = 1;
			p2 = player2;
		}
		//	*p2指向的player2依旧存在
		std::cout << p2 << std::endl;

		// 通过对象方式直接初始化成员变量，只适用于没有自定义构造函数的情况
		normal_person np = { 0, 0, 10 };

		//	new符号初始化时只会返回指针，需要用*存储
		player* player3 = new player();
		player3->m_positionX = 0;

		normal_person* np2 = new normal_person();
		//	由于是指针，可以通过使用星号调用或设置成员变量
		(*np2).m_speed = 4;
		//	也可以通过箭头->调用或设置成员变量
		np2->m_speed = 5;
		//	如果不是独立的函数等作用域，例如main中分配了内存空间，不使用了要进行删除
		delete np2;

		std::cin.get();

	}

	void init_array() {
		const int arr_size = 5;
		//	定义定长整型数组，必须再通过循环进行初始化
		int arr[arr_size];
		std::cout << arr << std::endl;
		//	实例化定义，实例必须是指针，必须通过循环进行初始化
		int* iarr = new int[arr_size];
		//	不建议使用：获取整型数组长度（没有可以直接获取长度的属性或方法，sizeof获取的是字节长度）
		//int arrSize = sizeof(iarr) / sizeof(int);
		for (int i = 0;i < arr_size;i++) {
			iarr[i] = i;
		}
		std::cout << *iarr << std::endl;
		//	因为在堆上分配了内存，使用完需要删除
		delete[] iarr;
		//	新式数组
		std::array<int, arr_size> std_array;
		std::cout << std_array[0] << std::endl;
		delete& std_array;
	}

	//	通过函数传递字符串时最好通过引用传递，否则会变成复制（分配新内存）
	void print_string(const std::string& str) {
		std::cout << str << std::endl;
	}

	void init_string() {
		//	字符指针，实际是数组，可当做字符串使用，实际字符是分开存储为['l','o','t','a','w','a','y']
		const char* cname = "lotaway";
		//	字符数组，utf8，注意长度是7，比实际字符多1位，因为在最后会自动添加\0作为结束字符
		const char aname[7] = "lotawa";
		//	更长的字符数组
		const wchar_t* cname2 = L"lotaway";
		//	utf16，每个字符2字节
		const char16_t* ccname = u"lotaway";
		//	utf32，每个字符4字节
		const char32_t* cccname = U"lotaway";
		//	获取字符数组长度
		std::cout << strlen(cname) << std::endl;
		//	复制字符数组
		char* cp_name = new char[5];
		//strcpy_s(cpyName, strlen(cpyName - 1), cname);

		//	字符串
		std::string sname = "lotaway";
		std::cout << sname << std::endl;
		//	获取字符串长度
		std::cout << sname.size() << std::endl;
		//	字符串拼接，而不能在定义时直接添加
		sname += "'s name!";
		//	或者在定义时定义多个字符串
		std::string ssname = std::string("lotaway") + "'s name";
		//	判断字符串中是否存在某些子字符串
		bool contains = ssname.find("name") != std::string::npos;

		//	语法糖拼接，需要引入库
		using namespace std::string_literals;
		std::string uname = "lotaway"s + "'s name";
		std::u32string uuname = U"lotaway"s + U"'s name";
		//	可换行字符数组
		const char* change = R"(line1
		line2
		line3
		line4
)";
	}

	only_read_fn::only_read_fn() : m_x(0), getCount(0) {

	}

	const int only_read_fn::get_x() const {
		//	不可用赋值，因为已经标记为const
		//m_x = 2;
		//	但对mutable依旧可以修改,mutable>const>variable
		getCount += 1;
		return m_x;
	}

	void init_const() {
		//	常量，只读
		const int MAX_AGE = 140;
		//	编译期常量
		constexpr int MAX_COUNT = 1;
		//	常量指针，即指向常量的指针。可修改指针，但不可修改指针指向的内容
		const int* a = new int(2);
		std::cout << *a << std::endl;
		//	不允许修改a指向的内容
		//*a = 2;
		//	允许修改指针本身
		a = &MAX_AGE;
		std::cout << *a << std::endl;
		//	指针常量，即指针是常量。不可修改指针，但可修改指针指向的内容
		int* const b = new int;
		std::cout << b << std::endl;
		//	允许修改b指针本身
		*b = MAX_AGE;
		std::cout << b << std::endl;
		//	不允许修改b指针指向的内容
		//b = &MAX_AGE;
		//	常量指针常量？既不可以修改指针，也不可以修改指针指向的内容
		const int* const c = new int(3);
		std::cout << *c << std::endl;
		//*c = MAX_AGE:
		//c = &MAX_AGE;
		only_read_fn onlyReadFn;
		std::cout << onlyReadFn.get_x() << std::endl;
	}

	vec2::vec2(float x, float y): m_x(x || 0.0f), m_y(y || 0.0f) {}

	vec2 vec2::add(const vec2& _vec) const {
		return vec2(m_x + _vec.m_x, m_y + _vec.m_y);
	}

	vec2 vec2::operator+(const vec2& _vec) const {
		return this->add(_vec);
	}

	vec2 vec2::multiply(const vec2& _vec) const {
		return vec2(m_x * _vec.m_x, m_y * _vec.m_y);
	}

	vec2 vec2::operator*(const vec2& _vec) const {
		return this->multiply(_vec);
	}

	bool vec2::is_equal(const vec2& _vec) const {
		return m_x == _vec.m_x && m_y == _vec.m_y;
	}

	bool vec2::operator==(const vec2& _vec) const {
		return this->is_equal(_vec);
	}

	//	输出流的<<操作符也可以重载
	std::ostream& operator<<(std::ostream& stream, const vec2& _vec) {
		stream << _vec.m_x << ',' << _vec.m_y;
		return stream;
	}

	vec2& vec4::get_vec2() {
		return vec;
	}

	void init_calculate() {
		vec2 vec(0.0f, 0.0f);
		vec2 walkSpeed(1.0f, 1.0f);
		vec2 powerUp(2.0f, 2.0f);
		//	调用方法完成计算
		vec2 mulRes = vec.add(walkSpeed).multiply(powerUp);
		//	调用操作符完成计算
		vec2 mulRes2 = (vec + vec2(walkSpeed)) * powerUp;
		std::cout << (mulRes == mulRes2) << std::endl;
		//	std::ostream << Vec类型的操作符重载了，可以输出Vec类型
		std::cout << mulRes2 << std::endl;
	};

	int* create_array() {
		//	栈上分配，返回后就会销毁变量，返回值没有意义
		//int arr[50];
		//	堆上分配，会一直保留直到手动摧毁
		int* arr = new int[50];
		return arr;
	}

	void entity::dododo() {}

	void init_stack_class() {
		//	此处有自动隐性转换，相当于ScopeEntity(new Entity())
		{
			scope_entity se = new entity();
		}
		//	离开作用域后，栈上的se自动销毁，而传入的堆上的entity实例也会因为调用折构函数而被删除
	}

	//	智能指针，自动管理new和delete
	void init_intelligence_pointer() {
		//	unique_ptr用于创建唯一指针，不可复制
		{
			//	创建唯一指针，离开作用域后自动删除堆上的实例变量
			std::unique_ptr<entity> uniqueEntity(new entity());
			//	或者
			std::unique_ptr<entity> uniqueEntity2 = std::make_unique<entity>();
			uniqueEntity->dododo();
		}
		//	shared_ptr用于创建共享指针，可复制，当引用归零则自动销毁
		std::shared_ptr<entity> shareEntity;
		{
			std::shared_ptr<entity> shareEntity2(new entity());
			shareEntity = shareEntity2;
		}
		//	依旧可以调用，因为entity0还有引用
		std::cout << shareEntity << std::endl;
		//	weak_ptr用于创建弱共享指针，不会被记入引用中
		std::weak_ptr<entity> weakEntity;
		{
			std::shared_ptr<entity> shareEntity3(new entity());
			weakEntity = shareEntity3;
		}
		//	已经被删除，因为不计入引用
		std::cout << weakEntity.lock() << std::endl;
		std::cin.get();
	}
	//  现代C++《生产环境都使用智能指针而非原始指针，单纯只是学习和积累经验则使用原始指针，甚至自己定制智能指针。

	ss::ss(const char* content) {
		m_size = (unsigned int)strlen(content) + 1;
		m_buffer = new char[m_size];
		fri(*this, content);
	}

	ss::ss(const ss& ss) : m_size(ss.m_size) {
		m_buffer = new char[m_size];
		//memcpy(m_buffer, ss.m_buffer, ss.m_size);
		fri(*this, ss.m_buffer);
	}

	ss::~ss() {
		delete[] m_buffer;
	}

	void fri(ss& other, const char* content) {
		memcpy(other.m_buffer, content, other.m_size);
	}

	void string_copy() {
		ss s1("lotaway");
		//	浅拷贝，对char* m_buffer只会拷贝指针，最终导致在折构方法中清理内存时报错，因为无法删除两次
		ss sp = s1;
		sp[1] = 'i';
		s1.print();
		sp.print();
		std::cin.get();
	}

	void origin::print() const {
		std::cout << "haha" << std::endl;
	}

	spec_pointer::spec_pointer(origin* _origin) : m_origin(_origin) {

	}

	const origin* spec_pointer::operator->() const {
		return m_origin;
	}

	void arrow_point() {
		spec_pointer sp = new origin();
		sp->print();
		std::cin.get();
	}

	vex2::vex2(float _x, float _y) : x(_x), y(_y) {
	};

	void init_union() {
		using namespace std;
		vex4 v4 = { 1.0f, 2.0f, 3.0f, 4.0f };
		//	可以当作2个Vex类型输出，也可以当作4个浮点类型输出，灵活且共享内存
		cout << v4.a.x << ',' << v4.a.y << ',' << v4.b.x << ',' << v4.b.y << endl;
		cout << v4.p1 << ',' << v4.p2 << ',' << v4.p3 << ',' << v4.p4 << endl;
	}

	//	重载输出，方便输出Vex类
	std::ostream& operator<<(std::ostream& stream, const vex2& vex) {
		stream << vex.x << ',' << vex.y;
		return stream;
	}

	template<typename _vector>
	void print_vector(const std::vector<_vector>& vexs) {
		//	循环读取项
		for (const _vector& vex : vexs) {
			std::cout << vex;
		}
		std::cout << std::endl;
	}

	//	动态数组
	void init_vector() {
		//	传入项类型来创建动态数组
		std::vector<vex2> vexs;
		//	随时放入新数据，数组会自动根据长度所需去重新创建新数组（并删除旧数组）
		//	push_back会在当前环境创建一个Vex实例，之后才复制进vector类
		vexs.push_back({ 0.0f, 0.0f });
		vexs.push_back({ 1.0f, 4.0f });
		print_vector<vex2>(vexs);
		//	清除所有数据
		vexs.clear();
		//	emplace_back会直接在vector内部创建，就不会有先创建再复制导致的效率问题
		vexs.emplace_back(1.0f, 1.0f);
		vexs.emplace_back(2.0f, 7.0f);
		print_vector<vex2>(vexs);
		//	删除指定索引的值，无法直接用number类型，.begin()相当于开始的0，即删除索引值为1的第二个值
		vexs.erase(vexs.begin() + 1);
		print_vector(vexs);
	}

	return_struct return_mutiply_struct() {
		return { "hello", "lotaway", 1 };
	}

	void return_params(std::string& str1, std::string& str2, int& z) {
		str1 = "hello";
		str2 = "lotaway";
		z = 1;
	}

	std::array<std::string, 2> return_array() {
		std::array<std::string, 2> arr;
		arr[0] = "hello";
		arr[1] = "lotaway";
		return arr;
	}

	std::tuple<std::string, std::string, int> return_tuple() {
		return std::make_tuple("hello", "lotaway", 1);
	}

	void init_return() {
		auto return1 = return_mutiply_struct();
		std::cout << return1.x + ',' + return1.y + ',' + std::to_string(return1.z) << std::endl;
		std::string str1, str2;
		int z;
		return_params(str1, str2, z);
		std::cout << str1 + ',' + str2 + ',' + std::to_string(z) << std::endl;
		//returnParams(nullptr, nullptr, z);
		auto array = return_array();
		std::cout << array[0] + ',' + array[1] << std::endl;
		std::tie(str1, str2, z) = return_tuple();
		auto [str3, str4, z1] = return_tuple();
		std::cout << str1 + ',' + str2 + ',' + std::to_string(z) << std::endl;
	}

	template<typename first_param>
	void template1(first_param param) {
		std::cout << param << std::endl;
	};

	template<typename _arr, int size>
	int sarray<_arr, size>::getSize() const {
		return sizeof(arr);
	}

	//	template类似一种元编程，即代码本身不是在编译时确定，而是在运行期才确定
	void initTemplate() {
		template1("hahah");	//	可以自动根据输入值推断类型，或者手动限制template1<std::string>("hahah");
		sarray<int, 5> sa;
		std::cout << sa.getSize() << std::endl;
	}

	template<typename _value>
	//	如果形参里定义的回调函数是匿名类型会导致lambda无法使用[]捕获作用域变量，会报错参数不符合
	//void each(const std::vector<Value>& values, void(*handler)(_value)) {
	//	形参里用标准库方法模板定义回调函数类型，lambda才能使用[]捕获作用域变量
	void each(const std::vector<_value>& values, const std::function<void(_value)>& handler) {
		for (_value value : values) {
			handler(value);
		}
	}

	void init_auto() {
		std::vector<int> vec = { 1, 2, 3 };
		auto it = std::find_if(vec.begin(), vec.end(), [](int val) { return val > 2; });
		logger::out(*it);
	}

	bool is_finish = false;

	void do_work() {
		std::cout << std::this_thread::get_id() << std::endl;
		using namespace std::literals::chrono_literals;
		while (!is_finish) {
			logger::out("pending");
			std::this_thread::sleep_for(1s);
		}
	}

	void init_thread() {
		PROFILE_FUNCTION();
		std::cout << std::this_thread::get_id() << std::endl;
		std::thread worker(do_work);
		is_finish = true;
		worker.join();
		logger::out("线程结束");
	}

	void init_sort() {
		std::vector<int> vec_int = { 1, 5, 7, 3 , 2 };
		//  内置排序方法，默认按照从小到大排序，如果没有传递判断方法的话
		std::sort(vec_int.begin(), vec_int.end(), [](int a, int b) {
			return a < b;
			});
		utils::print_vector<int>(vec_int);
	}

	//	类型转换依赖于RTTI(Runing Time Type Info，运行时类型信息），启用该配置和使用C++函数风格类型转转
	void init_type_convertion_check() {
		double a = 5.25;
		int b1 = a;	//	隐式转换，C风格
		int b2 = (double)a;	//	显式转换，C风格
		//	以下是C++风格的类型转换，实际上是一个函数，有额外开销：
		//	静态类型转换，方便编译器在编译和运行阶段确定错误哦，并且有利于后续维护查找哪里进行了类型转换
		int b = static_cast<int>(a);
		//	类型双关的转换
		logger::timer timer("initTypeConvertionCheck repinterpret_cast");
		double* t = (double*)reinterpret_cast<logger::timer*>(&timer);
		//	动态类型转换，适用于确认继承关系下的类型
		racer* r1 = new racer(*"worker", 1);
		runner* runner = r1;
		racer* new_racer = dynamic_cast<racer*>(runner);
		//	将子类指针赋值给父类指针变量后，可通过动态类型转换确认是否为某特定子类类型，转换后若有值则是该子类类型，失败Null则不是
		if (new_racer) {

		}

		//	常量与变量的转换
		const char* cc = "hello";
		char* dd = const_cast<char*>(cc);
	}

	//	读取可能不存在的文件，并设置为可选返回值
	std::optional<std::string> read_file_as_string(const std::string filePath) {
		std::fstream fstream(filePath);
		if (fstream) {
			//	read file(no done)
			std::string line;
			std::string result;
			while (std::getline(fstream, line)) {
				result += line;
			}
			fstream.close();
			return result;
		}
		return {};
	}

	void init_get_file() {
		auto file = read_file_as_string("file.json");
		//	method 1, check data if exist
		if (file.has_value()) {
			logger::out(file.value());
		}
		else {
			logger::out("File No Found!");
		}
		//	method 2, if data not exist, return value_or value;
		std::string data = file.value_or("File No Found!");
		logger::out(data);
	}

	//	指定多类型的单一变量variant，相比union更注重类型安全，但union更具效率和更少内存占用
	void single_variant_multi_type() {
		std::variant<std::string, int> data;
		//	可能是字符串
		data = "lotaway";
		//	需要指定获取的类型
		logger::out(std::get<std::string>(data));
		//	也可能是数值
		data = 30;
		logger::out(std::get<int>(data));
		//	无法确定最终类型的情况下，最好是通过判断获取
		logger::out(*std::get_if<std::string>(&data));
	}

	//	std::any 任意类型的单一变量（不推荐用），相比variant无需事先声明所有可能的类型，相同的点是在取值时需要指定类型，缺点是需要动态分配内存导致性能问题
	void any_value() {
		std::any data;
		data = "lotaway";
		data = 30;
		logger::out(std::any_cast<int>(data));
	}

	//	字符串优化：最好是减少使用string而用char，子字符串用string_view
	void initStringOptimization() {
		//	bad, 4 times memory allocate,
		std::string str = "Way Luk";
		logger::out(str);
		std::string first = str.substr(0, 3);
		logger::out(first);
		std::string last = str.substr(3, 7);
		logger::out(last);
		//	good, but still need string, 1 time memory allocate
		std::string_view firstName1(str.c_str(), 3);
		std::cout << firstName1 << std::endl;
		std::string_view lastName1(str.c_str() + 4, 3);
		std::cout << lastName1 << std::endl;
		//	actually good, only need char,
		const char* name = "Way Luk";
		logger::out(name);
		std::string_view firstName2(name, 3);
		std::cout << firstName2 << std::endl;
		std::string_view lastName2(name + 4, 3);
		std::cout << lastName2 << std::endl;
	}
	//	实际上Release环境编译时会有SSO小字符串优化，会自动将字符不多的字符串用栈缓冲区而非堆去分配内存，只有比较长的字符才会正常用堆分配内存，在VS2019中，触发这种机制的长度是15个字符。

	//	设计模式：单例模式
	class Random {
	public:
		static Random& get() {
			return s_instance;
		}
		static float Float() {
			return get()._Float();
		}
		//	ban copy instance
		Random(const Random&) = delete;
	private:
		static Random s_instance;
		float s_randomGenerator = 0.5f;
		float _Float() {
			return s_randomGenerator;
		}
		Random() {}
	};

	Random Random::s_instance;

	//	左值和右值，有具体位置的是左值，只是临时值的是右值，右值没有位置，所以不能被赋值
	int getValue() {
		return 10;
	}
	void setValue(int val) {
	}
	//	引用时，只能传递左值，不能传递右值
	void setValue(std::string& name) {

	}
	//	常量引用时，可以传递左值和右值
	void setValue2(const std::string& name) {

	}
	//	双重引用时，只能传递右值，不能传递左值
	void setValue3(std::string&& name) {

	}
	void initLValueAndRValue() {
		//	这里a是左值，1是右值
		int a = 1;
		//	这里a和b都是左值
		int b = a;
		//	这里c是左值，getValue()返回一个右值
		int c = getValue();
		//	不能堆getValue()赋值，因为它返回一个右值
		//getValue() = a;
		//	这里a是左值
		setValue(a);
		//	这里2是右值
		setValue(2);

		//	firstName是左值，"Way"是右值
		std::string firstName = "Way";
		//	lastName是右值，"Luk"是右值
		std::string lastName = "Luk";
		//	这里右边是两个左值firstName和lastName，但firstName + lastName加起来生成了一个临时值，所以是右值
		std::string fullName = firstName + lastName;

		//	引用时，只能传递左值
		setValue(fullName);
		//	引用时，不能传递右值，此处是常量字面量右值
		//setValue("lotaway");
		//
		//	常量引用时，既能传递左值
		setValue2(fullName);
		//	常量引用时，也能传递右值
		setValue2("Way Luk");

		//	双重引用时，只能传递右值
		setValue3("Way Luk");
		//	双重引用时，不能传递左值
		//serValue3(fullName);

		//	可以利用这种传递特性写重载方法，完成移动语义，当传递的是右值时，可以放心进行使用甚至修改，因为只是临时使用而不会复制或者影响其他内容。
	}

	//	移动语义
	class String {
	public:
		String() = default;
		String(const char* data) {
			printf("Created!\n");
			m_size = strlen(data);
			m_data = new char[m_size];
			memcpy(m_data, data, m_size);
		}
		String(const String& other) {
			printf("Copyed!\n");
			m_size = other.m_size;
			m_data = new char[m_size];
			memcpy(m_data, other.m_data, m_size);
		}
		String(String&& other) noexcept {
			printf("Moved!\n");
			m_size = other.m_size;
			//	在双重引用下能拿到右值，并简单地移动指针，之后删除原指针
			m_data = other.m_data;
			other.m_data = nullptr;
		}
		~String() {
			delete m_data;
		}
	private:
		size_t m_size;
		char* m_data;
	};

	class Enstring {
	public:
		Enstring(const String& name) : m_name(name) {}
		//	形参里name是右值，但放到初始化列表里的实参name将作为左值传入，需要使用std;:move无条件再次强制变成右值
		Enstring(String&& name): m_name(std::move(name)) {}
	private:
		String m_name;
	};

	void initStringAndMove() {
		//	如果不使用双重引用&&重载String构造方法，这个创建方式会先在堆上分配创建String("lotaway")，之后在Enstring通过m_name初始化列表又重新在堆上分配创建（即使使用的是引用&，但String的构造创建与复制方法决定了会分配成两个堆）
		Enstring enstring("lotaway");
	}

	// iteralor迭代器，使用指针进行循环迭代取值
	void initIteralor() {

		//	vector iterator
		std::vector<int> values = { 1, 2, 3, 4, 5 };
		//	method 1: using trandition for
		for (int i = 0;i < values.size(); i++) {
			logger::out(values[i]);
		}
		//	method 2: using for :
		for (int value : values) {
			logger::out(value);
		}
		// method 3: vector inset iterator
		for (std::vector<int>::iterator iterator = values.begin(); iterator != values.end(); iterator++) {
			logger::out(*iterator);
		}


		//	map iterator
		using ScoreMap = std::unordered_map<std::string, int>;
		using SMConstIter = ScoreMap::const_iterator;
		ScoreMap map;
		map["lotaway"] = 30;
		map["C Plus Plus"] = 100;
		//	method 1: using unordered_map::const_iterator
		for (ScoreMap::const_iterator it = map.begin(); it != map.end(); it++) {
			//	it is a vector:pair
			auto& key = it->first;
			auto& value = it->second;
			logger::out(key, value);
		}
		//	method 2: using for :
		for (auto& it : map) {
			auto& key = it.first;
			auto& value = it.second;
		}
		//	method 3: using for : with 结构解构
		for (auto [key, value] : map) {
			logger::out(key, value);
		}
	}

	//	双重检查锁？

	// hash map 官方实现：unordered_map，无序且键名唯一，随机桶分配方式
	void initHashMap() {
		//	需要提供键名类型和键值类型才能创建hashmap
		std::unordered_map<std::string, int> umap;

		//	添加数据（若原本的键已经存在则覆盖）
		umap.emplace("wayluk", 30);
		umap.emplace("lotaway", 18);

		//	获取数据
		std::unordered_map<std::string, int>::const_iterator it = umap.find("wayluk");
		if (it == umap.end())
			std::cout << "找不到数据" << std::endl;
		else
			std::cout << "找到了！！：" << it->second << std::endl;

		//	删除数据，此处为单条删除，也可以迭代器范围性删除
		umap.erase("wayluk");

		//	插入新数据（只会插入新键不会覆盖已有，且允许批量插入多个值或其他map）
		//	方式1：传递pair
		std::pair<std::string, int> newGuy("wayluk", 31);
		umap.insert(newGuy);
		//	方式2：传入另一个map（一部分或者全部）
		std::unordered_map<std::string, int> other_map{ { "mimi", 27 }, {"haha", 37} };
		umap.insert(other_map.begin(), other_map.end());
		//	方式3：直接字面量初始化
		umap.insert({ { "shutup", 30 }, { "hate", 30 }, {"eatshit", 30} });

		//	迭代器范围性删除
		if (!umap.empty())
			umap.erase(other_map.begin(), other_map.end());

		//	循环输出
		for (auto& m : umap)
			std::cout << m.first << ":" << m.second << std::endl;
	}

	//	用hashmap完成在数组里找到指定结果的两数相加，如提供数组[30,40,60,80]和总值100，其中40+60=100，要求找到40和60并返回它们的索引值
	std::vector<int> getSumTwoBySum(const std::vector<int>& arr, const int sum) {
		std::unordered_map<int, int> requireUMap;
		for (int i = 0, l = arr.size(); i < l; i++) {
			//	当找到和所需的数值一致时，则代表当前这个数值和已在map的索引所在的数值能作为一对，得到结果。
			std::unordered_map<int, int>::const_iterator it = requireUMap.find(sum - arr[i]);
			if (it != requireUMap.end())
				return { it->second, i };
			//	将当前所需要的数值和索引值记录下来
			requireUMap.emplace(arr[i], i);
		}
		return { 0, 0 };
	}

	//	判断输入的数字是否为回文格式，如121，12321就是回文，从高位到低位反过来也是相等，注意不要使用字符串方式
	bool isPalindrome(int x) {
		if (x < 0)
			return false;
		if (x == 0)
			return true;
		const size_t size = static_cast<size_t>(std::log10(x)) + 1;
		if (size == 1)
			return true;
		//int arr[size];
		std::vector<int> arr(size);
		int index = 0;
		size_t max = size;
		while (max > 1) {
			int pos = static_cast<int>(pow(10, --max));
			arr[index++] = x / pos;
			// arr.push_back(x / pos);
			x %= pos;
		}
		arr[index] = x;
		// arr.push_back(x);
		double l = (size - 1) * 0.5;
		for (int i = 0; i < l; i++) {
			if (arr[i] != arr[size - 1 - i])
				return false;
		}
		return true;
	}

	void reverseString(std::string x) {
		std::string originStr = "12321";

		//	反转字符串，方式1，需要创建另外一个字符串
		std::string reStr(originStr.rbegin(), originStr.rend());

		//	反转字符串，方式2，直接修改原有的字符串
		std::reverse(originStr.begin(), originStr.end());

		//	反转字符串，方式3，复制一个字符串进行反转
		std::string cpStr;
		std::reverse_copy(std::begin(originStr), std::end(originStr), std::begin(cpStr));
	}

	struct ListNode {
		int val;
		ListNode* next;
		ListNode() : val(0), next(nullptr) {}
		ListNode(int x) : val(x), next(nullptr) {}
		ListNode(int x, ListNode* next) : val(x), next(next) {}
	};

	ListNode* addTwoNumbers(ListNode* l1, ListNode* l2) {
		int up = 0;
		int sum = l1->val + l2->val + up;
		ListNode* ln = new ListNode{ sum % 10 };
		ListNode* tempLn = ln;
		up = sum / 10;
		while (l1->next != nullptr || l2->next != nullptr || up > 0) {
			l1 = l1->next == nullptr ? new ListNode() : l1->next;
			l2 = l2->next == nullptr ? new ListNode() : l2->next;
			sum = l1->val + l2->val + up;
			up = sum / 10;
			tempLn->next = new ListNode(sum % 10);
			tempLn = tempLn->next;
		}
		return ln;
	}

	template<size_t size>
	ListNode* createListNodeWithArray(int i_arr[size]) {
		ListNode* ln = new ListNode{ i_arr[0] };
		ListNode* tempLn = ln;
		for (int i = 1; i < size; i++) {
			tempLn->next = new ListNode{ i_arr[i] };
			tempLn = tempLn->next;
		}
		return ln;
	}

	void initListNumberAdd() {
		int i1[1]{ 9 };
		int i2[10]{ 1,9,9,9,9,9,9,9,9,9 };
		ListNode* l1 = createListNodeWithArray<1>(i1);
		ListNode* l2 = createListNodeWithArray<10>(i2);
		ListNode* ln = addTwoNumbers(l1, l2);
		std::cout << ln << std::endl;
	}

	//	获取字符串里梅没有重复字符的子字符串长度，如abcacd中，abc是最长的无重复字符的子字符串，长度为3
	int lengthOfLongestSubstring(std::string s) {
		size_t size = s.size();
		size_t longestCount = 0;
		int startIndex = 0;
		std::unordered_map<char, int> char2Index;
		for (size_t i = startIndex; i < size; i++) {
			char letter = s[i];
			auto it = char2Index.find(letter);
			bool isLast = i == size - 1;
			bool isRepeat = it != char2Index.end() && it->second >= startIndex;
			//  if already have a repeat char inside the child string, just count get the longest count and reset the child start index
			if (isLast || isRepeat) {
				longestCount = std::max(i - startIndex + (isRepeat ? 0 : 1), longestCount);
				startIndex = it->second + 1;
				if (size - startIndex <= longestCount)
					break;
			}
			char2Index[letter] = i;
		}
		return longestCount;
	}

	//	判断当前密码是强密码还是弱密码，返回strong或weak，规则1：不可以有连续重复相同字符3次；规则2：必须是8~22个字符之间；规则3：必须包含至少1个数字、1个小写字母和1个大写字母
	std::string checkPassword(std::string password) {
		std::string Strong = "strong", Weak = "weak";
		size_t size = password.size();
		if (size < 8 || size > 22)
			return Weak;
		bool hasLowcase = false, hasUppercase = false, hasNum = false;
		char prevCh = '\0';
		size_t repeatCount = 0;
		for (std::string::const_iterator it = password.begin(); it != password.end(); it++)
		{
			char ch = *it;
			if (ch == prevCh)
			{
				repeatCount++;
				if (repeatCount >= 3)
					return Weak;
			}
			else
			{
				prevCh = ch;
				repeatCount = 1;
			}
			if ('a' <= ch && ch <= 'z')
				hasLowcase = true;
			if ('A' <= ch && ch <= 'Z')
				hasUppercase = true;
			if ('0' <= ch && ch <= '9')
				hasNum = true;
		}
		return hasLowcase && hasUppercase && hasNum ? Strong : Weak;
	}

	void testCheckPassword(std::string password = "") {
		while (true) {
			if (password == "") {
				std::cout << "Please input your password:" << std::endl;
				std::cin >> password;
			}
			std::string result = utils::checkPassword(password);
			std::cout << result << std::endl;
			password = "";
		}
	}

	//	根据排序好的B-树输出成数组形式
	struct BMinTree {
		int m_value;
		BMinTree* m_left = nullptr,*m_right = nullptr;
		BMinTree(int value) : m_value(value) {}
		BMinTree(int value, BMinTree* left)
			: m_value(value), m_left(left) {}
		BMinTree(int value, BMinTree* left, BMinTree* right)
			: m_value(value), m_left(left),m_right(right) {}
		BMinTree(int value, int left_value, int right_value) : m_value(value) {
			m_left = new BMinTree(left_value);
			m_right = new BMinTree(right_value);
		}
		BMinTree* build() {

		}
	};

	std::vector<int> tree2Array(BMinTree& root) {
		std::vector<int> result;

		return result;
	}

	void testTree2Array() {
		BMinTree* _root = new BMinTree{ 7, 5, 8 };
	}

	void setValByLevel(std::vector<std::vector<int>>& matrix, Tree_node* child, size_t level = 0) {
		if (matrix.size() < level)
			matrix[level + 1] = { child->val };
		else
			matrix[level].emplace_back(child->val);
		for (Tree_node* ch : child->children) {
			setValByLevel(matrix, ch, level + 1);
		}
	}

	std::vector<int> tree_node_to_array(Tree_node* root) {
		std::vector<std::vector<int>> matrix;
		setValByLevel(matrix, root);
		std::vector<int> result;
		for (const std::vector<int>& vec : matrix) {
			for (const int val : vec) {
				result.push_back(val);
			}
		}
		return result;
	}

	void test_tree_node2array() {
		std::vector<Tree_node*> vec = { new Tree_node(2), new Tree_node(3)};
		Tree_node* root = new Tree_node(1, vec);
		std::vector<int> result = tree_node_to_array(root);
		for (int val : result)
			std::cout << val << std::endl;
	}

	void quickSort(int arr[], int start, int end) {
		if (start >= end) return;
		int keyVal = arr[start];
		int _start = start;
		int _end = end;
		while (_start < _end) {
			while (_start < _end) {
				if (arr[_end] < keyVal) {
					break;
				}
				_end--;
			}
			while (_start < _end) {
				if (arr[_start] > keyVal) {
					int temp = arr[_start];
					arr[_start] = arr[_end];
					arr[_end] = temp;
					break;
				}
				_start++;
			}
		}
		if (_start == _end)
			arr[_start] = keyVal;
		quickSort(arr, start, _start - 1);
		quickSort(arr, _start + 1, end);
	}

	void testQuickSort() {
		int arr[11] = { 5,6,3,2,7,8,9,1,4,0,0 };
		quickSort(arr, 0, 10);
		for (int x : arr) {
			std::cout << x << " ";
		}
	}

	double getMid(double prevNum, double nextNum, bool isQ = false) {
		if (isQ)
			return nextNum;
		return (prevNum + nextNum) / 2.0f;
	}

	double findMedianSortedArrays(std::vector<int>& nums1, std::vector<int>& nums2) {
		int sumSize = nums1.size() + nums2.size(), neededSize = sumSize / 2 + 1, isQ = sumSize % 2 == 1, index = 0;
		double mid = 0.0;
		std::vector<int>::const_iterator ptr1 = nums1.begin(), ptr2 = nums2.begin();
		while (true) {
			if (ptr1 == nums1.end()) {
				if (index == neededSize - 1) {
					if (!isQ) {
						mid = (mid + *ptr2) / 2.0f;
					}
					else {
						mid = *ptr2;
					}
				}
				else {
					mid = getMid(*(ptr2 + neededSize - 2 - index), *(ptr2 + neededSize - 1 - index), isQ);
				}
				break;
			}
			if (ptr2 == nums2.end()) {
				if (index == neededSize - 1) {
					if (!isQ) {
						mid = (mid + *ptr1) / 2.0f;
					}
					else {
						mid = *ptr1;
					}
				}
				else {
					mid = getMid(*(ptr1 + neededSize - 2 - index), *(ptr1 + neededSize - 1 - index), isQ);
				}
				break;
			}
			if (*ptr1 < *ptr2) {
				if (index == neededSize - 1) {
					mid = getMid(mid, *ptr1, isQ);
					break;
				}
				mid = *ptr1;
				ptr1++;
			}
			else {
				if (index == neededSize - 1) {
					mid = getMid(mid, *ptr2, isQ);
					break;
				}
				mid = *ptr2;
				ptr2++;
			}
			index++;
		}
		return mid;
	}

	void initFindMedianSortedArrays() {
		std::set<std::vector<int>*> uset;
		std::vector<int> f1[]{ {1,2},{3,4} }, f2[]{ {1,3},{2} }, f3[]{ {}, { 1,2,3,4,5 } };
		uset.insert(f1);
		uset.insert(f2);
		uset.insert(f3);
		//std::vector<int> nums1{ 1, 2 }, nums2{ 3, 4 };
		//std::vector<int> nums1{ 1,3 }, nums2{ 2 };
		//std::vector<int> nums1, nums2 = { 1,2,3,4,5 };
		//	output as fixed float 0.000000
		std::cout.setf(std::ios_base::fixed, std::ios_base::floatfield);
		for (std::vector<int>* it : uset) {
			double mid = findMedianSortedArrays(it[0], it[1]);
			for (int i = 0; i < it->size(); i++) {
				std::cout << '{';
				for (int integer : it[i]) {
					std::cout << integer << ',';
				}
				std::cout << '}';
			}
			std::cout << ':' << mid << std::endl;
		}
		//std::cout.unsetf(std::ios::hex);
	}

	struct Money {
		int m_type;
		int m_value = 0;
	};

	Money* countMoney() {
		int input;
		const size_t size = 6;
		//int types[]{ 100, 50, 20, 10, 5, 1 };
		Money* moneys = new Money[size]{ {100,0},{50,0},{20,0},{10,0},{5,0},{1,0} };
		//Money* moneys = new Money[size];
		std::cout << "Please input your money:" << std::endl;
		std::cin >> input;

		for (int i = 0; i < size; i++) {
			moneys[i].m_value = input / moneys[i].m_type;
			//moneys[i] = { types[i] ,input / types[i] };
			input %= moneys[i].m_type;
		}
		return moneys;
	}

	void initCountMoney() {
		Money* moneys = countMoney();
		for (int i = 0; i < 6; i++) {
			Money m = moneys[i];
			std::cout << m.m_type << "元的张数是：" << m.m_value << std::endl;
		}
	}

	void testOutput() {
		std::cout.setf(std::ios::hex, std::ios::basefield);
		std::cout << 100 << " ";
		std::cout.unsetf(std::ios::hex);
		std::cout << 100 << " ";
	}

	// get the longest palindrome, input `abase`, return `aba`
	std::string longestPalindrome(std::string s) {
		std::string palindrome = "";
		int targetIndex = 0;
		int longest = 0;
		for (int i = 0, l = s.size();i < l;i++) {
			if ((l - i) * 2 - 1 <= longest) {
				break;
			}
			int prevIndex = i, nextIndex = i;
			bool isOdd = true, isEven = true;
			while (isOdd || isEven) {
				if (isOdd) {
					if (prevIndex < 0 || nextIndex >= l || s[prevIndex] != s[nextIndex]) {
						isOdd = false;
						int length = nextIndex - prevIndex - 1;
						if (length > longest) {
							targetIndex = i;
							longest = length;
						}
					}
				}
				if (isEven) {
					int evenNextIndex = nextIndex + 1;
					if (prevIndex < 0 || evenNextIndex >= l || s[prevIndex] != s[evenNextIndex]) {
						isEven = false;
						int length = evenNextIndex - prevIndex - 1;
						if (length > longest) {
							targetIndex = i;
							longest = length;
						}
					}
				}
				prevIndex--;
				nextIndex++;
			}
		}
		palindrome = s.substr(targetIndex - longest / 2 + (longest % 2 == 0 ? 1 : 0), longest);
		return palindrome;
	}

	//	try get the best team with highest score sum, the only rule is not allow a younger teamate have a higher score than the older one.
	int bestTeamScore(std::vector<int>& scores, std::vector<int>& ages) {
		int sum = 0;
		int size = scores.size();
		std::vector<std::pair<int, int>> interview(size);
		std::vector<int> dp(size, 0);
		for (int i = 0; i < size; i++) {
			interview[i] = { scores[i], ages[i]};
		}
		std::sort(interview.begin(), interview.end());
		for (int i = 0; i < size; i++) {
			int j = i - 1;
			while (j >= 0) {
				if (interview[i].second <= interview[j].second) {
					dp[i] = std::max(dp[i], dp[j]);
				}
				j--;
			}
			dp[i] += interview[i].first;
			sum = std::max(sum, dp[i]);
		}
		return sum;
	}

/*
0        8          16
1     7  9       15 17
2   6   10    14    18
3 5     11 13       19
4       12          20

0   4    8	  12
1 3 5 7  9 11 13
2   6   10
=>
0	 1	  2	   3
4 5  6 7  8 9 10
11  12	 13

P     I     N
A   L S   I G
Y A   H R
P     I

*/
	std::string convert(std::string s, int numRows) {
		int size = s.size();
		if (numRows == 1 || numRows >= size || size <= 2)
			return s;
		int loopSize = (numRows - 1) * 2;
		int c = (size + loopSize - 1) / loopSize * (numRows - 1);
		std::vector<std::string> mat(numRows, std::string(c, 0));
		for (int i = 0, x = 0, y = 0; i < size; ++i) {
			mat[x][y] = s[i];
			if (i % loopSize < numRows - 1)
				++x;
			else {
				--x;
				++y;
			}
		}
		std::string result;
		for (std::string& row : mat) {
			for (char c : row) {
				if (c)
					result += c;
			}
		}
		return result;
	}

	/*
	由至少 6 个，至多 20 个字符组成。
包含至少 一个小写 字母，至少 一个大写 字母，和至少 一个数字 。
不包含连续三个重复字符 (比如 "Baaabb0" 是弱密码, 但是 "Baaba0" 是强密码)。
给你一个字符串 password ，返回 将 password 修改到满足强密码条件需要的最少修改步数。如果 password 已经是强密码，则返回 0
*/
	int strongPasswordChecker(std::string password) {
		short need_insert = 0, need_delete = 0, need_replace = 0, require_letter = 0, fixed = 0;
		size_t size = password.size();
		if (6 > size)
			need_insert = 6 - size;
		if (size > 20)
			need_delete = size - 20;
		std::vector<int> vec_repeat;

		bool has_upper = false, has_lower = false, has_digit = false;
		short repeat_size = 3, repeat_count = 0;
		std::string::const_iterator prevIt = password.end();
		for (std::string::const_iterator it = password.begin(); it != password.end(); it++) {
			char ch = *it;
			if (prevIt != password.end() && *prevIt == *it)
				repeat_count++;
			else {
				if (repeat_count >= repeat_size)
					vec_repeat.push_back(repeat_count);
				repeat_count = 1;
			}
			if (!has_upper && std::isupper(ch))
				has_upper = true;
			if (!has_lower && std::islower(ch))
				has_lower = true;
			if (!has_digit && std::isdigit(ch))
				has_digit = true;
			prevIt = it;
		}
		require_letter = has_upper + has_lower + has_digit;

		for (std::vector<int>::iterator it = vec_repeat.begin(); it != vec_repeat.end(); it++) {
			int repeat_count = *it;
			while (repeat_count >= repeat_size) {
				int loop = repeat_count / repeat_size;
				int left = repeat_count % repeat_size;
				if (need_delete > 0 && left > 0 && left <= need_delete) {
					need_delete -= left;
					fixed += left;
					repeat_count -= left;
				}
				else if (need_insert > 0) {
					if (require_letter > 0) {

					}
					else {
						repeat_count -= std::min(repeat_count / 2, (int)need_insert) * 2;
					}
				}
				else {
					need_replace++;
					repeat_count -= repeat_size;
				}
			}
		}

		while (require_letter-- > 0)
			if (need_insert > 0) {
				need_insert--;
				fixed++;
			}
			else if (need_replace > 0) {
				need_replace--;
				fixed++;
			}
			else
				fixed++;
		return fixed + need_insert + need_delete + need_replace;
	}

	void testStrongPasswordChecker() {
		//	bbaaAaaAaaAaaAaaccAcc
		int result = strongPasswordChecker("bbaaaaaaaaaaaaaaacccccc");
		std::cout << result << std::endl;
	}

		bool strongPasswordCheckerII(std::string password) {
			size_t size = password.size();
			if (size < 8)
				return false;
			bool hasUp = false, hasLow = false, hasNum = false, hasSch = false;
			char prevCh = '\0';
			std::set<char> sch{ '!','@','#','$','%','^','&','*','(',')','-','+' };
			for (auto it = password.begin();it != password.end();it++) {
				char ch = *it;
				if (ch == prevCh)
					return false;
				prevCh = ch;
				if (!hasUp && 'A' <= ch && ch <= 'Z')
					hasUp = true;
				if (!hasLow && 'a' <= ch && ch <= 'z')
					hasLow = true;
				if (!hasNum && '0' <= ch && ch <= '9')
					hasNum = true;
				auto sch_it = sch.find(ch);
				if (!hasSch && sch_it != sch.end())
					hasSch = true;
			}
			return hasUp && hasLow && hasNum && hasSch;
		}

		//	abc(def(gh)i)jkl => abc(i(gh)fed)jkl => abcighfedjkl
		std::string reverseParentheses(std::string input_string) {
			std::stack<std::string> stk;
			std::string str;
			for (char& ch : input_string) {
				if (ch == '(') {
					stk.push(str);
					str = "";
				}
				else if (ch == ')') {
					std::reverse(str.begin(), str.end());
					str = stk.top() + str;
					stk.pop();
				}
				else {
					str.push_back(ch);
				}
			}
			return str;
		}

		void testReverseParentheses() {
			//	没有考虑多个子括号并联时需要先交换位置
			std::string input_string{ "n(ev(t)((()lfevf))yd)cb()" };
			std::cout << "input: " << input_string << std::endl;
			std::string result = reverseParentheses(input_string);
			std::cout << "output: " << result << std::endl;
		}

		template<typename T>
		void refence(T &&t, T v) {
			t = v;
		}

		int getRightValue() {
			int k = 3;
			return k;
		}

		void testRefence() {
			int i = 1;
			const int j = 2;
			//refence(i, 1);	//	错误，第一个参数T推断为int&整型左值引用，而第二个参数推断为int左值或者右值，两者冲突
			//refence(j, 1);	//	错误，第一个参数T推断为const int&整型常量左值引用，而第二个参数推断为int左值或者右值，两者冲突
			refence(getRightValue(), 1);	//	正确，第一个参数T推断为int&&右值引用，而第二个参数推断为int左值或者右值，两者没有冲突
		}

		//	lambda表达式，一次性函数，&代表引用，=代表值传递
		void initLambda() {
			const char* name = "extra";
			using Value = int;
			std::vector<Value> vec = { 1, 2, 3 };
			// 匿名函数里没有当前作用域的变量
			each<Value>(vec, [](Value val) { logger::out("name", val); });
			// 匿名函数里需要有当前作用域的所有变量
			each<Value>(vec, [=](Value val) { logger::out(name, val); });
			// 匿名函数里需要有当前作用域的某个变量
			each<Value>(vec, [&name](Value val) { logger::out(name, val); });
		}

		int reverse_num(int x) {
			int result = 0;
			while (x != 0) {
				int v = 0;
				if (std::abs(x) >= 10)
					v = x % 10;
				else
					v = x;
				if (v != 0 || x != 0) {
					if (result > INT_MAX / 10 || result < INT_MIN / 10)
						return 0;
					if (result != 0)
						result *= 10;
					result += v;
				}
				x /= 10;
			}
			return result;
		}

		void test_reverse_num() {
			int result = reverse_num(1534236469);
			std::cout << result << std::endl;
		}

		int reverse_number_position(int x) {
			int result = 0;
			while (x != 0) {
				int v = 0;
				if (std::abs(x) >= 10)
					v = x % 10;
				else
					v = x;
				if (v != 0 || x != 0) {
					if (result > INT_MAX / 10 || result < INT_MIN / 10)
						return 0;
					if (result != 0)
						result *= 10;
					result += v;
				}
				x /= 10;
			}
			return result;
		}

		void test_reverse_number_position() {
			int result = reverse_number_position(-123);
			std::cout << result << std::endl;
		}

		int atoi(std::string s) {
			std::unordered_map<char, int> c2num{ {'0', 0}, {'1', 1}, {'2', 2}, {'3', 3}, {'4', 4}, {'5', 5}, {'6', 6}, {'7', 7}, {'8', 8}, {'9', 9} };
			bool has_num = false;
			int result = 0;
			short is_positive = 0;
			for (const char& c : s) {
				auto it = c2num.find(c);
				if (it != c2num.end()) {
					has_num = true;
					if (is_positive != -1)
						if (result >= (INT_MAX - it->second) / 10)
							return INT_MAX;
						else
							result = result * 10 + it->second;
					if (is_positive == -1)
						if (result >= -(INT_MIN + it->second) / 10)
							return INT_MIN;
						else
							result = result * 10 - it->second;
				}
				else if (has_num == false) {
					if (c == ' ')
						continue;
					if ((c == '-' || c == '+') && is_positive == 0)
						is_positive = c == '-' ? -1 : 1;
					else
						return 0;
				}
				else {
					break;
				}
			}
			return (is_positive == -1 ? -1 : 1) * result;
		}

		void test_atoi() {
			int result = atoi("-000000000000001");
			std::cout << result << std::endl;
		}


		/*给你一个长度为 5 的字符串 time ，表示一个电子时钟当前的时间，格式为 "hh:mm" 。最早 可能的时间是 "00:00" ，最晚 可能的时间是 "23:59" 。
			在字符串 time 中，被字符  ? 替换掉的数位是 未知的 ，被替换的数字可能是 0 到 9 中的任何一个。
			请你返回一个整数 answer ，将每一个 ? 都用 0 到 9 中一个数字替换后，可以得到的有效时间的数目。

			示例 1：
			输入：time = "?5:00"
			输出：2
			解释：我们可以将 ? 替换成 0 或 1 ，得到 "05:00" 或者 "15:00" 。注意我们不能替换成 2 ，因为时间 "25:00" 是无效时间。所以我们有两个选择。

			示例 2：
			输入：time = "0?:0?"
			输出：100
			解释：两个 ? 都可以被 0 到 9 之间的任意数字替换，所以我们总共有 100 种选择。

			示例 3：
			输入：time = "??:??"
			输出：1440
			解释：小时总共有 24 种选择，分钟总共有 60 种选择。所以总共有 24 * 60 = 1440 种选择。

			提示：
			time 是一个长度为 5 的有效字符串，格式为 "hh:mm" 。
			"00" <= hh <= "23"
			"00" <= mm <= "59"
			字符串中有的数位是 '?' ，需要用 0 到 9 之间的数字替换。*/
		int count_time(std::string time) {
			int m10 = time[3] == '?' ? 6 : 1, m1 = time[4] == '?' ? 10 : 1, hh;
			if (time[0] == '?' && time[1] == '?')
				hh = 24;
			else if (time[0] == '?')
				hh = time[1] < '4' ? 3 : 2;
			else if (time[1] == '?')
				hh = time[0] == '2' ? 4 : 10;
			else
				hh = 1;
			return hh * m10 * m1;
		}

		void test_count_time() {
			int result = count_time("?5:00");
			std::cout << result << std::endl;
		}

		std::vector<int> add_negabinary(std::vector<int>& arr1, std::vector<int>& arr2) {
			int offset = 0;
			std::vector<int> sum;
			for (int i = arr1.size() - 1, j = arr2.size() - 1; i >= 0 || j >= 0 || offset != 0; i--, j--) {
				int _sum = (i >= 0 ? arr1[i] : 0) + (j >= 0 ? arr2[j] : 0) + offset;
				//	相邻的每一位都是正负正负，但存储的值是正值，因此有进位时相当于对下一位是减1，当为负数时相当于进位加1
				if (_sum >= 2) {
					_sum -= 2;
					offset = -1;
				}
				else if (_sum >= 0) {
					offset = 0;
				}
				else {
					_sum = 1;
					offset = 1;
				}
				sum.push_back(_sum);
			}
			while (sum.size() > 1 && sum.back() == 0) {
				sum.pop_back();
			}
			std::reverse(sum.begin(), sum.end());
			return sum;
		}

		void test_add_negabinary() {
			std::vector<int> nums1 = { 1 }, nums2 = { 1 };
			std::vector<int> sum = utils::add_negabinary(nums1, nums2);
			print_vector(sum);
		}

		bool regex_match(const std::string &str, const std::string &regex) {
			std::regex mobilephone_regex{ regex };
			std::cmatch matches;
			return std::regex_search(str.c_str(), matches, mobilephone_regex);
		}

		void test_regex_match() {
			bool result = regex_match("+8615999948166", "[+]?\\d{7,14}");
			std::cout << result << std::endl;
		}


		//给定一个由n个整数组成的数组arr，将数组划分为k个连续非重子数组，使得每个元素属于且仅属于一个子数组，并且每个子数组至少包含一个元素。划分数组以使其美丽度最小。返回最小可能的美丽度。
		//注意 : 子数组是数组的连续子段
		//示例
		//考虑n = 4, arr = [1, 2, 3, 4]和k = 2
		//使用基于1的索引，展示了每种可能的分割的美丽程度
		//[1和[2, 3, 4]:分数分别为 1 * 1 = 1 和34 = 12。数组的美丽程度为max(1.12) = 12。
		//[1, 2和[3, 4]:: 分数分别为 2 * 2 = 4 和24 = 8。美丽程度为 max(4, 8) = 8。
		//[1, 2, 3和[4]::分数分别为 3 * 3 = 9 和14 = 4。美丽程度为max(9, 4) = 9.
		//所以，数组的最小可能美丽程度为8.

		int GetMinimumBeauty(std::vector<int>& arr, int k, int left, int right, std::unordered_map<std::string, int>& beauties)
		{
			std::stringstream b_key_stream;
			b_key_stream << k << "," << left << "," << right;
			std::string b_key = b_key_stream.str();
			if (beauties.contains(b_key))
			{
				return beauties.at(b_key);
			}
			auto result_handle = [&](int beauty) -> int {
				beauties.emplace(b_key, beauty);
				return beauty;
				};
			if (left == right)
				return result_handle(arr[left]);
			if (k == 1) {
				int val = 0;
				for (int i = left; i <= right; ++i)
					val = std::max(val, arr[i]);
				return result_handle(val * (right - left + 1));
			}
			int beauty = INT_MAX;
			for (int i = left; i <= right - k + 1; ++i)
			{
				beauty = std::min(beauty, std::max(GetMinimumBeauty(arr, 1, left, i, beauties), GetMinimumBeauty(arr, k - 1, i + 1, right, beauties)));
			}
			return result_handle(beauty);
		}
		int GetMinimumBeauty(std::vector<int>& arr, int k, int left, int right) {
			std::unordered_map<std::string, int> beatuies{};
			return GetMinimumBeauty(arr, k, left, right, beatuies);
		}
		int GetMinimumBeauty(std::vector<int>& arr, int k)
		{
			return GetMinimumBeauty(arr, k, 0, arr.size() - 1);
		}

		void TestGetMinimumBeauty()
		{
			std::vector<int> arr{ 1,2,3,4 };
			std::clock_t start_time = clock();
			int result = GetMinimumBeauty(arr, 2);
			std::clock_t end_time = clock();
			std::cout << result << ", time: " << end_time - start_time << std::endl;
		}
}
