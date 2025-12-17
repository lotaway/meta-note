#include "onnx_model.h"
#include <iostream>
#include <fstream>
#include <sstream>

ONNXModel::ONNXModel() 
    : env_(ORT_LOGGING_LEVEL_WARNING, "ONNXModel") {
    session_options_ = std::make_unique<Ort::SessionOptions>();
    session_options_->SetIntraOpNumThreads(1);
    session_options_->SetGraphOptimizationLevel(GraphOptimizationLevel::ORT_ENABLE_ALL);
}

ONNXModel::~ONNXModel() {
    // Ort库会自动清理资源
}

bool ONNXModel::loadModel(const std::string& modelPath) {
    try {
        // 检查模型文件是否存在
        std::ifstream file(modelPath);
        if (!file.good()) {
            std::cerr << "ONNX model file not found: " << modelPath << std::endl;
            return false;
        }
        
        model_path_ = modelPath;
        
        // 创建会话
        session_ = Ort::Session(env_, modelPath.c_str(), *session_options_);
        
        // 获取输入输出信息
        getInputOutputInfo();
        
        is_loaded_ = true;
        std::cout << "ONNX model loaded successfully: " << modelPath << std::endl;
        return true;
        
    } catch (const Ort::Exception& e) {
        std::cerr << "Failed to load ONNX model: " << e.what() << std::endl;
        is_loaded_ = false;
        return false;
    }
}

std::vector<float> ONNXModel::inference(const std::vector<float>& input) {
    if (!is_loaded_) {
        throw std::runtime_error("ONNX model is not loaded");
    }
    
    try {
        // 准备输入张量
        auto memory_info = Ort::MemoryInfo::CreateCpu(OrtDeviceAllocator, OrtMemTypeCPU);
        
        // 假设输入形状为 [1, sequence_length]
        std::vector<int64_t> input_shape = {1, static_cast<int64_t>(input.size())};
        Ort::Value input_tensor = Ort::Value::CreateTensor<float>(
            memory_info, 
            const_cast<float*>(input.data()), 
            input.size(), 
            input_shape.data(), 
            input_shape.size()
        );
        
        // 运行推理
        auto output_tensors = session_.Run(
            Ort::RunOptions{nullptr}, 
            input_names_.data(), 
            &input_tensor, 
            1, 
            output_names_.data(), 
            output_names_.size()
        );
        
        // 提取输出
        if (output_tensors.size() > 0 && output_tensors[0].IsTensor()) {
            float* floatarr = output_tensors[0].GetTensorMutableData<float>();
            size_t output_size = output_tensors[0].GetTensorTypeAndShapeInfo().GetElementCount();
            
            std::vector<float> result(floatarr, floatarr + output_size);
            return result;
        }
        
        return {};
        
    } catch (const Ort::Exception& e) {
        std::cerr << "ONNX inference failed: " << e.what() << std::endl;
        throw;
    }
}

std::string ONNXModel::getModelInfo() const {
    if (!is_loaded_) {
        return "ONNX model is not loaded";
    }
    
    std::stringstream info;
    info << "ONNX Model Info:\n";
    info << "  Model Path: " << model_path_ << "\n";
    info << "  Inputs: " << input_names_.size() << "\n";
    info << "  Outputs: " << output_names_.size() << "\n";
    
    for (size_t i = 0; i < input_names_.size(); ++i) {
        info << "  Input " << i << ": " << input_names_[i] << " [";
        for (size_t j = 0; j < input_shapes_[i].size(); ++j) {
            if (j > 0) info << ", ";
            info << input_shapes_[i][j];
        }
        info << "]\n";
    }
    
    for (size_t i = 0; i < output_names_.size(); ++i) {
        info << "  Output " << i << ": " << output_names_[i] << " [";
        for (size_t j = 0; j < output_shapes_[i].size(); ++j) {
            if (j > 0) info << ", ";
            info << output_shapes_[i][j];
        }
        info << "]\n";
    }
    
    return info.str();
}

bool ONNXModel::isLoaded() const {
    return is_loaded_;
}

void ONNXModel::setupSession() {
    // 可以在这里添加更多的会话配置
    session_options_->SetIntraOpNumThreads(1);
    session_options_->SetGraphOptimizationLevel(GraphOptimizationLevel::ORT_ENABLE_ALL);
}

void ONNXModel::getInputOutputInfo() {
    // 获取输入信息
    size_t num_input_nodes = session_.GetInputCount();
    input_names_.resize(num_input_nodes);
    input_shapes_.resize(num_input_nodes);
    
    for (size_t i = 0; i < num_input_nodes; i++) {
        auto input_name = session_.GetInputNameAllocated(i, Ort::AllocatorWithDefaultOptions());
        input_names_[i] = input_name.get();
        
        auto type_shape_info = session_.GetInputTypeInfo(i);
        auto tensor_info = type_shape_info.GetTensorTypeAndShapeInfo();
        input_shapes_[i] = tensor_info.GetShape();
    }
    
    // 获取输出信息
    size_t num_output_nodes = session_.GetOutputCount();
    output_names_.resize(num_output_nodes);
    output_shapes_.resize(num_output_nodes);
    
    for (size_t i = 0; i < num_output_nodes; i++) {
        auto output_name = session_.GetOutputNameAllocated(i, Ort::AllocatorWithDefaultOptions());
        output_names_[i] = output_name.get();
        
        auto type_shape_info = session_.GetOutputTypeInfo(i);
        auto tensor_info = type_shape_info.GetTensorTypeAndShapeInfo();
        output_shapes_[i] = tensor_info.GetShape();
    }
}
