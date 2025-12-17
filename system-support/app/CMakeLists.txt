# 递归获取当前目录下的所有cpp和h文件作为源文件
file(GLOB_RECURSE SOURCES "*.cpp" "*.h")
# 将所有源文件添加为可执行文件
# add_executable(app ./app/src/main.cpp)
add_executable(app ${SOURCES})
# 查找ONNX Runtime库
find_package(ONNXRuntime REQUIRED)
# 链接库
target_link_libraries(app PUBLIC engine Setupapi onnxruntime)