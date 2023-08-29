# 递归获取当前目录下的所有源文件
file(GLOB_RECURSE SOURCES "*.cpp" "*.h")
# 添加可执行文件
# add_executable(app ./app/src/main.cpp)
add_executable(app ${SOURCES})
# 链接库
target_link_libraries(app PUBLIC engine)