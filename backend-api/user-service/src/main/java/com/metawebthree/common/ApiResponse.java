package com.metawebthree.common;


import lombok.Data;

import java.util.Objects;

@Data
public class ApiResponse<DataType> {
    private int status;
    private String message;
    private DataType data;

    public ApiResponse() {

    }

    public ApiResponse(int status, String message) {
        this.status = status;
        this.message = message;
    }

    public ApiResponse(int status, String message, DataType data) {
        this.status = status;
        this.message = message;
        this.data = data;
    }

    public int getStatus() {
        return status;
    }

    public String getMessage() {
        return message;
    }

    public Object getData() {
        return data;
    }

    public static <DataType> ApiResponse<DataType> success() {
        return new ApiResponse<>(200, "success");
    }

    public static <DataType> ApiResponse<DataType> success(DataType data) {
        return new ApiResponse<>(200, "success", data);
    }

    public static ApiResponse<Exception> error() {
        return new ApiResponse<>(201, "error");
    }

    public static ApiResponse<Exception> error(String errMessage) {
        return new ApiResponse<>(201, errMessage);
    }

    public static ApiResponse<Exception> error(Exception e) {
        return new ApiResponse<>(201, "error", e);
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        ApiResponse<DataType> that = (ApiResponse<DataType>) o;
        return status == that.status && message.equals(that.message) && data.equals(that.data);
    }

    @Override
    public int hashCode() {
        return Objects.hash(status, message, data);
    }

    @Override
    public String toString() {
        return "{'status':" + status + ",'message':'" + message + ", 'data':" + data + '}';
    }
}
