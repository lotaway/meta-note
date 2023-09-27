package com.config;

public class ExtractConfigRunner implements Runnable {

    public void run() {
        synchronized (ExtractConfigThread.class) {
            System.out.println("ExtractConfig thread running...");

            System.out.println("ExtractConfig thread end");
        }
        try {
            Thread.sleep(10);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
    }
}
