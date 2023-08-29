#include "hazel.h"
//	通过异步（多线程）并行处理任务，提升性能
namespace hazel {

	class Mesh {
	public:
		Mesh(const std::string& _file_path) : file_path(_file_path) {}
		static std::unique_ptr<Mesh> load(const std::string& filepath) {
			//	 do something...
			auto mesh = std::make_unique<Mesh>(filepath);
			return mesh;
		}
		const std::string& get_file_path() const {
			return file_path;
		}
	private:
		const std::string& file_path;
	};

	template<class T>
	struct Ref {
	public:
		using _TargetType = T;
		Ref(_TargetType* _t) : t(_t) {}
		~Ref() {
			delete t;
		}
	private:
		_TargetType* t;
	};
	//	互斥锁
	static std::mutex s_meshes_mutex;

	class EditorLayer {
	public:

		static std::future<bool> load_wrapper_with_task(std::function<bool(std::vector<std::unique_ptr<Mesh>>*, std::string)> fn, std::vector<std::unique_ptr<Mesh>>& meshes, std::string file_path) {
			std::packaged_task<bool(std::vector<std::unique_ptr<Mesh>>*, std::string)> task(fn);
			std::future<bool> fut = task.get_future();
			std::thread(std::move(task), &meshes, file_path).detach();
			//th_task.join();
			return fut;
		}

		static std::promise<bool> load_wrapper_with_promise(std::function<bool(std::vector<std::unique_ptr<Mesh>>*, std::string)> fn, std::vector<std::unique_ptr<Mesh>>& meshes, std::string file_path) {
			std::promise<bool> prom;
			prom.set_value_at_thread_exit(fn(&meshes, file_path));
			return prom;
		}

		static bool load_mesh(std::vector<std::unique_ptr<Mesh>>* meshes, std::string file_path) {
			auto mesh = Mesh::load(file_path);
			std::lock_guard<std::mutex> lock(s_meshes_mutex);
			meshes->push_back(std::move(mesh));
			return true;
		}

		void load_meshes() {
			std::ifstream stream("src/Models.txt");
			std::string line;
			std::vector<std::string> mesh_filepaths;
			while (std::getline(stream, line))
				mesh_filepaths.push_back(line);
#define ASYNC 1
#if ASYNC
			for (const auto& file_path : mesh_filepaths) {
				//m_futures.push_back(load_wrapper_with_task(load_mesh, m_meshes, file_path));
				//m_futures.push_back(load_wrapper_with_promise(load_mesh, m_meshes, file_path).get_future());
				m_futures.push_back(std::async(std::launch::async, load_mesh, &m_meshes, file_path));
			}
#else
			for (const auto& file_path : mesh_filepaths)
				m_meshes.push_back(Mesh::load(file_path));
#endif
		}

		bool is_meshes_loaded() {
			std::vector<std::future<bool>>::iterator it = m_futures.begin();
			while (it != m_futures.end()) {
				std::cout << it->get() << std::endl;;
				it++;
			}
		}

	private:
		std::vector<std::unique_ptr<Mesh>> m_meshes;
		std::vector<std::future<bool>> m_futures;
	};

	void init_lock_and_async() {
		EditorLayer editorLayer;
		editorLayer.load_meshes();
	}
};

namespace std {

	template<>
	struct hash<hazel::Mesh> {
		size_t operator()(const hazel::Mesh& key) {
			return hash<std::string>()(static_cast<std::string>(key.get_file_path()));
		}
	};

};