package com.config;

import java.util.concurrent.Callable;

public class ExtractConfigCallable implements Callable<String> {

    @Override
    public String call() throws Exception {
        return "ExtractConfig thread running...";
    }
}
