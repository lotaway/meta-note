#include "./include/EM_PORT_API.h"
#include "./include/stdafx.h"
#include "logger.h"
#include "utils.h"
#include "./platform/usb.h"
#include "onnx_model.h"
#include <iostream>
#include <filesystem>

extern "C"
{
#include "hello_c.h"
}

void test_val()
{
	//	常量指针，星号左侧有const，表示是指向常量的指针
	utils::Tree_node const *num1;
	num1 = new utils::Tree_node{1}; // 修改指针，可行
	//*num1 = utils::Tree_node{ 1 };	//	修改变量，不可行
	// 指针常量，星号右侧有const。表示指针是常量
	utils::Tree_node *const num2 = new utils::Tree_node{2};
	*num2 = utils::Tree_node{2}; //	修改变量，可行
	// num2 = new utils::Tree_node{ 2 }; // 修改指针，不行
	//  常量指针常量，表示指向常量的常量指针，无论是指针还是变量都不可修改
	const utils::Tree_node *const num3 = new utils::Tree_node{3};
}

// 测试ONNX模型功能
void test_onnx_model() {
    std::cout << "Testing ONNX model..." << std::endl;
    
    // 模型路径 - 与llama模型位置兼容
    std::string model_path;
    
    // 检查当前目录下的模型
    if (std::filesystem::exists("extraResources/models/model.onnx")) {
        model_path = "extraResources/models/model.onnx";
    } 
    // 检查上级目录（Electron项目结构）
    else if (std::filesystem::exists("../extraResources/models/model.onnx")) {
        model_path = "../extraResources/models/model.onnx";
    }
    // 检查system-management目录结构
    else if (std::filesystem::exists("../../system-management/extraResources/models/model.onnx")) {
        model_path = "../../system-management/extraResources/models/model.onnx";
    }
    else {
        std::cout << "ONNX model not found. Please place model.onnx in extraResources/models/ directory." << std::endl;
        return;
    }
    
    ONNXModel model;
    if (model.loadModel(model_path)) {
        std::cout << "ONNX model loaded successfully!" << std::endl;
        std::cout << model.getModelInfo() << std::endl;
        
        // 简单的测试推理
        try {
            std::vector<float> test_input = {1.0f, 2.0f, 3.0f, 4.0f};
            auto result = model.inference(test_input);
            std::cout << "Inference result size: " << result.size() << std::endl;
            if (!result.empty()) {
                std::cout << "First few values: ";
                for (size_t i = 0; i < std::min(result.size(), size_t(5)); ++i) {
                    std::cout << result[i] << " ";
                }
                std::cout << std::endl;
            }
        } catch (const std::exception& e) {
            std::cout << "Inference test failed: " << e.what() << std::endl;
        }
    } else {
        std::cout << "Failed to load ONNX model." << std::endl;
    }
}

int main()
{
    std::cout << "Starting application..." << std::endl;
    
    // 测试ONNX模型功能
    test_onnx_model();
    
    // 原有的测试函数
    utils::TestGetMinimumBeauty();
    
    return 0;
}
