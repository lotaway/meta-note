package com.config;

import java.util.concurrent.locks.Lock;
import java.util.concurrent.locks.ReentrantLock;

public class ExtractConfigThread extends Thread {

//    public final static Object lock = new Object();

    @Override
    public void run() {
//        extends Thread directly
//        implements Runnable, have to add a lot of methods
//        using Thread, Callable and FutureTask to add a class as thread, will enable get the thread result
        synchronized (ExtractConfigThread.class) {
            System.out.println("ExtractConfig thread running...");

            System.out.println("ExtractConfig thread end");
        }
        try {
            Thread.sleep(10);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
        /*
        Lock lock = new ReentrantLock();
        lock.lock();
        boolean isLock = lock.tryLock();
        if (isLock) {

        }
        lock.unlock();
        */
    }
}