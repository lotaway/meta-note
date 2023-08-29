# 搜索当前目录下的所有.cpp文件
aux_source_directory(./src SOURCES)
# 作为库
add_library(engine ${SOURCES})