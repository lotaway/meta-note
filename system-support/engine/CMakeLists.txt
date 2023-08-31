# 搜索当前目录下的所有.cpp文件
aux_source_directory(./src SOURCES)
# 作为库
add_library(engine ${SOURCES})
# 将目录添加到本库的公共头文件搜索路径中，其他项目才能引入本库头文件
target_include_directories(engine PUBLIC ${CMAKE_CURRENT_SOURCE_DIR}/src)