cmake_minimum_required(VERSION 3.16.3)
project(system_support)

# 设置编译版本
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# 添加子项目
add_subdirectory(app)
add_subdirectory(engine)