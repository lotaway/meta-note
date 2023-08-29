/*
* 八大设计原则让设计模式变成必要性，主要是让程序可以保持稳定与变化的平衡，编译时是稳定的，变化是通过运行时传递不同而变化。
* 1. 高层实现不能依赖于底层实现，而只能依赖底层抽象；
* 2. 抽象不能依赖于实现，而是实现依赖抽象；
*/

// 模板方法 Template Method，通过抽象了过程，提供切入方法，完成晚绑定的调用方式（即框架类自动调用应用程序开发者所继承实现的方法）。
#include <stack>
#include "logger.h"
#include "utils.h"

class Library {
protected:
	Library() {
		init();
	}
	~Library() {
		on_destroy();
	}
	virtual void run() {
		on_create();
	}
	virtual void init() {

	}
	virtual void on_create() = 0;
	virtual void on_destroy() {

	}
};

//	策略模式 Strategy Mode，主要用于减少if else/switch对大量不同情况的处理，通过抽象、分离这部分工作，让流程变得更加模板化
struct IStrategy {
public:
	virtual bool deal(const char& order_number) = 0;
};

class ChinaStrategy : public IStrategy {
public:
	bool deal(const char& order_number) override {
		return true;
	}
};

class EnglandStrategy : public IStrategy {
public:
	bool deal(const char& order_number) override {
		return false;
	}
};

class OrderController {
private:
	IStrategy* strategy;
	const char *order_number;
public:
	OrderController(IStrategy*_strategy, const char* _order_number) : strategy(_strategy), order_number(_order_number) {

	}
	~OrderController() {
		delete strategy;
	}
	void deal() {
		bool result = strategy->deal(*order_number);
	}
};

void application() {
	IStrategy*cs = new ChinaStrategy();
	OrderController oc1(cs, "123");
	IStrategy* es = new EnglandStrategy();
	OrderController oc2(es, "456");
}

//	观察者模式 Obverser Mode，用于处理两个无直接关联的类之间的特定机制的实现，例如通知、进度更新等，它可能是需要体现在命令行，也可能是需要体现在某个具体的界面，也可能是在通知栏，这不可能让所有有关的类都去直接继承，而是使用接口在需要时去实现

class Activity {
	virtual void on_create() = 0;
	virtual void on_destroy() {

	}
};

class IProgress {
public:
	virtual void update_progress(float present) = 0;
};

class NotificationBar {
public:
	void doUpdate() {

	}
};

//	主界面，触发文件下载之后要通过实现接口来接收下载进度并更新通知栏
class MainActivity: public Activity, public IProgress {
	NotificationBar* nBar;
	MainActivity(NotificationBar* _nBar): nBar(_nBar) {

	}
	~MainActivity() {
		delete nBar;
	}
	void on_create() override {

	}
	// 实现观察处理
	void update_progress(float present) override {
		//	根据反馈百分比更新通知栏
		nBar->doUpdate();
	}
};

//	下载列表界面，监听文件下载进度并更新界面
class DownloadListActivity : public Activity, public IProgress {
	void on_create() override {

	}
	//	实现观察处理
	void update_progress(float present) override {
		// 根据反馈百分比更新界面
		//this->update_view();
	}
};

//	基础任务
class Task {
private:
	const char* name;
protected:
	Task(const char* _name) : name(_name) {

	}
	virtual void start() = 0;
	//virtual void pause() = 0;
	//virtual void resume() = 0;
	virtual void stop() = 0;
	virtual void onProgress() {
	}
};

//	文件下载任务
class DownloadFileTask: public Task {
private:
	const char* file_path;
	IProgress* iProgress;
	float present;
public:
	DownloadFileTask(const char* _file_path, IProgress* _iProgress) : Task(_file_path), file_path(_file_path), iProgress(_iProgress) {
		present = 0;
	}
	~DownloadFileTask() {
		delete file_path;
		delete iProgress;
	}
	void start() override {

	}
	void stop() override {

	}
	//	下载任务进度更新时，也通知附加的观察者
	void onProgress() {
		iProgress->update_progress(present);
	}
};


// 装饰模式 Decorator Mode，主要是通过继承对象后对起原有方法进行扩充或者包裹更多命令同时执行。

class IVehicle {
public:
	virtual void move() = 0;
	virtual void stop() = 0;
};

class Car : public IVehicle {
public:
	void move() override {
		utils::print_string("car run");
	}
	void stop() override {
		utils::print_string("car stop");
	}
};

class Airplane : public IVehicle {
public:
	void move() override {
		utils::print_string("airplane run");
	}
	void stop() override {
		utils::print_string("airplane stop");
	}
};

class IRobot {
public:
	virtual void move() = 0;
	virtual void speak(std::string sentence) {
		utils::print_string(sentence);
	}
};

//	第一个装饰器，扩展了机器人的能力
class ITransformer : public IRobot {
protected:
	IVehicle* vehicle;
	const char* name;
	int state = 0;
public:
	ITransformer(const char* nam) : name(nam) {

	}
	ITransformer(const char* nam, IVehicle* ve) : name(nam), vehicle(ve) {

	}
	~ITransformer() {
		delete vehicle;
		delete name;
	}
	//	重新包装了行为
	virtual void move() override {
		vehicle->move();
		this->speak("transformer moving");
	}
	//	扩充能力，让其拥有更多功能
	virtual void transform() {
		if (state == 0) {
			utils::print_string("transform to vehicle");
			state = 1;
		}
		else {
			utils::print_string("transform to robot");
			state = 0;
		}
	}
};

//	第二个装饰器，扩展了变形金刚的能力
class ITrichanger : public ITransformer {
	IVehicle* sec_vehicle;
	~ITrichanger() {
		ITransformer::~ITransformer();
		delete sec_vehicle;
	}
	//	扩充能力，让其拥有更多功能
	void transform(int st) {
		switch (st) {
		case 0:
			transform_to_first_vehicle();
			break;
		case 1:
			transform_to_second_vehicle();
			break;
		case 2:
			transform_to_robot();
			break;
		default:
			break;
		}
	}
	void transform_to_first_vehicle() {
		utils::print_string("transform_to_first_vehicle");
		state = 0;
	}
	void transform_to_second_vehicle() {
		utils::print_string("transform_to_second_vehicle");
		state = 1;
	}
	void transform_to_robot() {
		utils::print_string("transform_to_robot");
		state = 2;
	}
};

class Autobot : ITransformer {
public:
	Autobot(const char* name): ITransformer(name) {}
};

class Decepticon : ITransformer {

};



// 桥模式 Bridge Mode，与装饰器模式非常相似，区别是桥接意味着是在内部调用其他类完成所需功能

class IChange {
public:
	virtual void change() = 0;
};

class Transformer {
	IChange* iChange;
public:
	Transformer(IChange* ic): iChange(ic) {

	}
	~Transformer() {
		delete iChange;
	}
	//	注意实现方式是借助其他类完成，而装饰器一般是对自身方法进行增强或者扩充
	void transform() {
		return iChange->change();
	}
};

// 工厂模式 Factory Mode，包含几种类型，工厂方法、抽象工厂、原型、构建器

class IFactoryMethod {
public:
	virtual void config(const std::string, const std::string) = 0;
	virtual IVehicle* create() = 0;
};

//	工厂方法, Factory Method，目标是帮助生成指定类
class FactoryMethod: public IFactoryMethod {
public:
	void config(const std::string key, const std::string value) override {

	}
	IVehicle* create() override {
		return new Car();
	}
};

void testFactoryMethod() {
	FactoryMethod fm;
	IVehicle* vehicle = fm.create();
}

//	抽象工厂, Abstract Factory，目标是生成有关联的一连串类的包装类
class IHouse {
protected:
	std::string* address;
	IVehicle* vehicle;
	ITransformer* transformer;
public:
	IHouse(std::string* addr, IVehicle* veh, ITransformer* tf): address(addr), vehicle(veh), transformer(tf) {}
	IHouse(const IHouse& other) {

	}
	~IHouse() {
		delete address;
		delete vehicle;
		delete transformer;
	}
	virtual void come_back() = 0;
	virtual void go_out() = 0;
	virtual void interactive() = 0;
};

//	实际使用时对抽象工厂要求的各种抽象类子类化
class MyHouse : public IHouse {
public:
	MyHouse(std::string* address, Car* vehicle, ITrichanger* transform): IHouse(address, vehicle, transform) {

	}
	void come_back() override {
		this->vehicle->move();
	}
	void go_out() override {
		this->vehicle->move();
	}
	void interactive() override {
		this->transformer->speak("hello");
	}
};

class Me {
	IHouse* house;
	void go_home() {
		house->come_back();
	}
	void go_work() {
		house->go_out();
	}
	void interactive() {
		utils::print_string("what?");
		house->interactive();
	}
};

//	原型，Prototype Mode，主要是将工厂创建类时，通过先创建一次，保留下所需的参数、属性，之后可以重复进行复制创建新实例
class IFactoryPrototype {
	IFactoryMethod* factoryMethod;
public:
	IFactoryPrototype(IFactoryMethod* fm) : factoryMethod(fm) {};
	~IFactoryPrototype() {
		delete factoryMethod;
	}
	virtual IFactoryMethod* clone() = 0;
};

//	构建器，builder，主要用于将某个类的创建过程进行封装，让其更方便进行使用，并且需要修改时无需动到原本的类（合并的方式就是直接在原本的类里添加init方法）
class IFactoryBuilder {
	IFactoryMethod* factoryMethod;
public:
	IFactoryBuilder(IFactoryMethod* fm) : factoryMethod(fm) {

	}
	~IFactoryBuilder() {
		delete factoryMethod;
	}
	IFactoryMethod* build() {
		factoryMethod->config("do", "something");
		factoryMethod->create();
		return factoryMethod;
	}
};

// 单例模式，Singleton，方便全局化的系统对象，因为在整个应用中只需要唯一一个该对象，否则会出错，而不同类中又不方便保存该对象实例或者需要延迟保存，因此采用单例模式来确保不同地方的调用都能拿到唯一一个实例。

class Singleton {
	//	私有化构造函数禁止创建实例
	Singleton();
	//	私有化复制构造函数禁止复制
	Singleton(const Singleton& other);
public:
	static Singleton* instance;
	//	指定在没有实例时才进行创建，否则直接返回原有实例即可
	static Singleton* getInstance() {
		if (instance == nullptr)
			instance = new Singleton;
		return instance;
	}
};

//	享元模式，Flyweight Mode，主要是完成共享对象资源，维持一个有限的池塘，当需要创建对象时则在此创建，并且优化判断原有不使用的对象进行删除或者内存移动，以确保资源不被浪费。
class AutobotFactory {
private:
	std::unordered_map<const char*, Autobot*> autobotPool;
public:
	Autobot* getAutobot(const char* name) {
		std::unordered_map<const char*, Autobot*>::iterator it = autobotPool.find(name);
		if (it == autobotPool.end()) {
			autobotPool[name] = new Autobot(name);
		}
		return autobotPool[name];
	}
};

//	门面模式，与其说是设计模式，不如说是设计原则，主要是用于解决接口之间的耦合问题，例如一开始都是直接按钮对应电路板硬件功能，之后变成软件操作硬件，再之后开始有驱动、协议、固件、操作系统、虚拟机、平台层等，这些就是通过分离和聚合约束接口之间的通讯方式，使之解耦。
// 常见的门面模式有 Facade、Proxy、Adapter、Mediator，设计方式只要满足解耦要求即可。

// Facade，从架构层次看待系统，内部包裹了一系列关联性强的类与组件并提供出有限的相应接口方法等给外部使用。

class IConnect {
public:
	virtual bool connect() = 0;
	virtual bool disconnect() = 0;
};

class ICommand {
protected:
	IConnect* connect;
public:
	virtual void exec(const std::string) = 0;
	virtual std::string version() = 0;
};

class ISql {
protected:
	IConnect* connect;
public:
	virtual void query(const std::string) = 0;
};

class DBClient {
	ICommand* cmd;
	IConnect* connect;
	ISql* sql;
public:
	virtual void init() {
		connect->connect();
		utils::print_string(cmd->version());
	}
};

// Proxy，尽可能保持对原有对象不变，但又进一步做了优化或高权限的隔离操作，来确保使用不被打扰，例如分布式需要采用rpc远程调用，但通过代理来把这种方式变回普通的代码类调用，这就是一种代理。

class IRpc {
public:
	virtual bool auth(const std::string) = 0;
	virtual std::string invoke() = 0;
};

template <typename ResponseData>
class IService {
public:
	virtual ResponseData request() = 0;
};

class ServiceProxy : IService<bool> {
	IRpc* rpc;
public:
	virtual bool request() {
		if (rpc->auth("access_key")) {
			std::string result = rpc->invoke();
			if (result != "")
				return true;
		}
		return false;
	}
};

class CommpilerApplication : public Library {
public:
	void run() {
		ServiceProxy* serviceProxy = new ServiceProxy;
		bool result = serviceProxy->request();
	}
protected:
	/*void run() override {

	}*/
	void on_create() {

	}
};

// Adapter，适配器也是非常常见的设计方式，主要是让多个类对应多个类之间能更好地、简单地对接上去，而不需要对这些类本身进行改造。

class IFile {
public:
	std::string name;
	std::string path;
};

class ISystem {
public:
	virtual IFile* readFile(const std::string) = 0;
	virtual bool writeFile(const std::string) = 0;
	virtual IFile* createFile(const std::string) = 0;
};

class ICore {
public:
	virtual IFile* file(const std::string) = 0;
};

class Adapter : ICore {
	ISystem* system;
public:
	IFile* file(const std::string path) override {
		IFile* file = system->readFile(path);
		if (file == nullptr) {
			return system->createFile(path);
		}
		return file;
	}
};

//	Mediator，中介者，主要是分离两个类的强耦合关系，例如前面例子大量使用的ISystem、ICore也是一种中介者，分离了真正的System、Core的耦合关系，当然大部分中介者会有更加独立的功能特性，方便完成各种协调、缓冲功能。

struct IMessage {
	std::string key;
	std::string data;
};

//	消息队列就是一种中介者，进一步可以添加各种削峰、熔断、限流等措施
class IMessageQueue {
	std::stack<IMessage> messages;
public:
	virtual void add(const std::string key, const std::string data) = 0;
	virtual void del(const std::string key) = 0;
};

class IServiceA {
	IMessageQueue* mq;
public:
	virtual void run() {
		mq->add("ServiceA", "active");
	}
};

class IServiceB {
	IMessageQueue* mq;
public:
	virtual void run() {
		mq->add("ServiceB", "active");
	}
};

//	状态模式，State Mode， 通过将状态改变变成了不同子类实例的变化，屏蔽了状态修改时的具体情况

class IStatus {
protected:
	IStatus();
	IStatus(IStatus& other);
	static IStatus* m_instance;
public:
	IStatus* nextStatus;
	virtual void settle() = 0;
	virtual void cancel() = 0;
	virtual void done() = 0;
};

class CancelStatus : public IStatus {
	static CancelStatus* m_instance;
public:
	static CancelStatus* getInstance() {
		if (m_instance == nullptr)
			m_instance = new CancelStatus;
		return m_instance;
	}
	void settle() override;
	void cancel() override;
	void done() override;
};

class DoneStatus : public IStatus {
	static DoneStatus* m_instance;
public:
	static DoneStatus* getInstance() {
		if (m_instance == nullptr)
			m_instance = new DoneStatus;
		return m_instance;
	}
	void settle() override;
	void cancel() override;
	void done() override;
};

class SettleStatus : public IStatus {
	static SettleStatus* m_instance;
public:
	static SettleStatus* getInstance() {
		if (m_instance == nullptr)
			m_instance = new SettleStatus;
		return m_instance;
	}
	void settle() override;
	void cancel() override {
		nextStatus = CancelStatus::getInstance();
	}
	void done() override {
		nextStatus = DoneStatus::getInstance();
	}
};

//	所有订单状态变更和改变状态所需的判断都是交给状态类管理，本身订单类只负责调用，不做任何如判断赋值的额外处理
class IOrderInfo {
	IStatus* status;
public:
	IOrderInfo() {
		status = SettleStatus::getInstance();
	}
	~IOrderInfo() {
		delete status;
	}
	void cancel() {
		status->cancel();
		status = status->nextStatus;
	}
	void confirmReceviced() {
		status->done();
		status = status->nextStatus;
	}
};

// 备忘录，Memento Mode，主要是用于将实例对象的状态进行一次备份保存，之后经过一系列的变化后可以进行恢复，现代语言一般自带有对象序列化的能力，即使需要自定义也有更方便的方式可供定义，不需要单独制作该功能。
template <class T>
class IMemento {
public:
	virtual T* load() {
	}
	virtual void save(T * obj) {
	}
};

class TargetClass {
protected:
	int count = 0;
public:
	void requestFresh() {
		IMemento<TargetClass> memento;
		memento.save(this);
		// ...do something change this class status
		count++;
		//	reverse change
		TargetClass* origin = memento.load();
		count = origin->count;
	}
};

// 组合模式，Composite Mode，通过将复杂且重复的结构分离成多个类进行组合递归使用，有利于保持类的专注
class LeafComponent {
protected:
	std::string value;
public:
	LeafComponent(const std::string& val) : value(val) {}
};
class TreeNodeComponent {
public:
	LeafComponent* leaf;
	TreeNodeComponent* left;
	TreeNodeComponent* right;
	TreeNodeComponent(const std::string& value) : leaf(new LeafComponent{ value }) {}
	TreeNodeComponent(LeafComponent* l): leaf(l) {}
	TreeNodeComponent(LeafComponent* l, TreeNodeComponent* lef): leaf(l), left(lef) {}
	TreeNodeComponent(LeafComponent* l, TreeNodeComponent* lef, TreeNodeComponent* rig) : leaf(l), left(lef), right(rig) {}
	~TreeNodeComponent() {
		delete leaf;
		delete left;
		delete right;
	}
};

void testTreeNode() {
	TreeNodeComponent root{ "1"};
	root.left = new TreeNodeComponent{ "2" };
	root.right = new TreeNodeComponent{ "2" };
}

// 迭代器模式，Iterator Mode，非常常见的容器列表方式，方便隐藏隔离内部数据的优化算法读取，当外界需要遍历时可直接使用迭代器来获取值、索引等，而不需要关心应当如何读取和读取哪个值。

	//	make you own vector iterator
template<typename _Vector>
class MyVectorIterator {
public:
	using Iterator = MyVectorIterator;
	using ValueType = typename _Vector::ValueType;
	using PointerType = ValueType*;
	using ReferenceType = ValueType&;
	MyVectorIterator(PointerType ptr) : m_ptr(ptr) {

	}
	Iterator& operator++() {
		m_ptr++;
		return *this;
	}
	Iterator operator++(int) {
		Iterator iterator = *this;
		++(*this);
		return iterator;
	}
	Iterator operator--() {
		m_ptr--;
		return *this;
	}
	Iterator operator--(int) {
		Iterator iterator = *this;
		--(*this);
		return iterator;
	}
	ReferenceType operator[](int index) {
		return *(m_ptr + index);
	}
	PointerType operator->() {
		return m_ptr;
	}
	PointerType operator*() {
		return *m_ptr;
	}
	bool operator==(const Iterator& other) const {
		return m_ptr == other.m_ptr;
	}
private:
	PointerType m_ptr;
};

template<typename T, size_t S = 2>
class MyVector {
public:
	using ValueType = T;
	using Iterator = MyVectorIterator<MyVector>;
	MyVector() {
		logger::out("MyVector created");
		static_assert(S > 0, "size_t S should not be 0");
		reAlloc(S);
	}
	~MyVector() {
		logger::out("MyVector destroyed");
		clear();
		::operator delete(m_data, m_capacity * sizeof(T));
	}
	size_t size() const {
		return m_size;
	}
	void push_back(const T& value) {
		if (m_size >= m_capacity)
			reAlloc(m_capacity + m_capacity / 2);
		m_data[m_size++] = value;
	}
	void push_back(T&& value) {
		if (m_size >= m_capacity)
			reAlloc(m_capacity + m_capacity / 2);
		m_data[m_size] = std::move(value);
		m_size++;
		//value = nullptr;
	}
	template<typename... Args>
	T& emplace_back(Args&... args) {
		if (m_size >= m_capacity)
			reAlloc(m_capacity + m_capacity / 2);
		new (&m_data[m_size]) T(std::forward<Args>(args)...);
		return m_data[m_size++];
	}
	void pop_back() {
		if (m_size > 0) {
			m_size--;
			m_data[m_size].~T();
		}
	}
	void clear() {
		for (size_t i = 0; i < m_size; i++)
			m_data[i].~T();
		m_size = 0;
	}
	T& operator[](size_t index) {
		return m_data[index];
	}
	const T& operator[](size_t index) const {
		return m_data[index];
	}
	Iterator begin() {
		return Iterator(m_data);
	}
	Iterator end() {
		return Iterator(m_data + m_size);
	}
private:
	T* m_data = nullptr;
	size_t m_capacity = 0;
	size_t m_size = 0;
	void reAlloc(size_t newCapacity) {
		T* newBlock = (T*)::operator new(newCapacity * sizeof(T));
		if (newCapacity < m_size)
			m_size = newCapacity;
		for (size_t i = 0; i < m_size; i++)
			new (&newBlock[i]) T(std::move(m_data[i]));
		for (size_t i = 0; i < m_size; i++)
			m_data[i].~T();
		::operator delete(m_data, m_capacity * sizeof(T));
		m_data = newBlock;
		m_capacity = newCapacity;
	}
};

void printMyVector(const MyVector<std::string>& vector) {
	//logger::out(vector.size());
	for (int i = 0; i < vector.size(); i++)
		std::cout << "vector item: " + vector[i] << std::endl;
}

void initMyVector() {
	MyVector<std::string> myVector;
	myVector.emplace_back("heihei");
	myVector.push_back("haha");
	printMyVector(myVector);
	//myVector.push_back("way luk");
	myVector.emplace_back("lotaway");
	printMyVector(myVector);
	myVector.pop_back();
	printMyVector(myVector);
}

void initCustomIterator() {
	MyVector<int> mVector;
}

// 职责链，Chain Mode，通过在运行时动态串联事件处理器，处理器自身决定是否拦截和处理事件，这样发出事件者和处理事件者可以解耦，不需要有强依赖，或者多对一依赖的问题。
class IEventRequest {
public:
	const std::string name;
	IEventRequest(const std::string n): name(n) {}
};

class EventResponse {
protected:
	IEventRequest* event;
	EventResponse* next;
public:
	EventResponse(IEventRequest* request): event(request) {}
	EventResponse* setHandler(EventResponse* nex) {
		next = nex;
		return next;
	}
	virtual IEventRequest* handler(IEventRequest* request) {
		if (next != nullptr)
			return next->handler(request);
		return request;
	}
};

// 命令模式，Command Mode，将一个或一系列想要执行的行为用类对象进行封装，以便随时重复对对象进行调用执行行为
class ICommandMode {
public:
	std::vector<std::string> cmd;
	void addCmd(const std::string& c) {
		cmd.push_back(c);
	}
	void execute() {
		std::vector<std::string>::iterator it = cmd.begin();
		while (it != cmd.end()) {
			utils::print_string(*it);
			it++;
		}
	}
};

void testCommandMode() {
	ICommandMode cm;
	cm.addCmd("hello");
	cm.addCmd("is me.");
	cm.execute();
}

// 访问器模式，Visitor Mode，在不需要重复修改基类的情况下，让基类保留一个访问器配置方法，以便以后可以直接通过传递访问器的方式让该基类以及子类都能通过任意添加的访问器进行特化访问输出。

template <class T>
class IVisitor {
public:
	virtual void accept(T&) = 0;
};

class Target {
protected:
	IVisitor<Target>* visitor;
public:
	std::string name;
	void addVisitor(IVisitor<Target>* vis) {
		visitor = vis;
	}
	void show() {
		visitor->accept(*this);
	}
};

class VisitorA : public IVisitor<Target> {
public:
	void accept(Target& target) override {
		utils::print_string(target.name);
	}
};

class VisitorB : public IVisitor<Target> {
public:
	void accept(Target& target) override {
		std::cout << target.name << std::endl;
	}
};

// 解析器模式，非常常见于编译器、编辑器、硬件协议等项目，因为需要自定义独有的语法规则，同样也需要构建自己的解析器来分析、构建语法树，以便完成封装、解封、传输、优化等功能使用。

class IExpression {
public:
	const char* symbol;
	float value;
	IExpression* left;
	IExpression* right;
};

class AddExpression : public IExpression {
public:
	AddExpression(const std::string) {

	}
};

class MinusExpression : public IExpression {
public:
	MinusExpression(const std::string) {

	}
};

void analyse(std::string expStr) {
	if (expStr.find("+")) {
		AddExpression ast(expStr);
	}
	else if (expStr.find("-")) {
		MinusExpression ast(expStr);
	}
}