package com.config;

public interface ConfigScanner {
    public static void log() {

    }

//     public static abstract void search();

    public abstract void scan();

    public default void stop() {

    }
}