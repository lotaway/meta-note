#ifndef ONNX_MODEL_H
#define ONNX_MODEL_H

#include <string>
#include <vector>
#include <memory>
#include <onnxruntime_cxx_api.h>

class ONNXModel
{
public:
    ONNXModel();
    ~ONNXModel();

    bool loadModel(const std::string &modelPath);

    std::vector<float> inference(const std::vector<float> &input);

    std::string getModelInfo() const;

    bool isLoaded() const;

private:
    Ort::Env env_;
    Ort::Session session_{nullptr};
    std::unique_ptr<Ort::SessionOptions> session_options_;
    std::string model_path_;
    bool is_loaded_ = false;

    // 输入输出信息
    std::vector<const char *> input_names_;
    std::vector<const char *> output_names_;
    std::vector<std::vector<int64_t>> input_shapes_;
    std::vector<std::vector<int64_t>> output_shapes_;

    void setupSession();
    void getInputOutputInfo();
};

#endif // ONNX_MODEL_H
