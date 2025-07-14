package com.metawebthree.job;

import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.ThreadPoolExecutor;
import java.util.concurrent.TimeUnit;

import org.quartz.Job;
import org.quartz.JobExecutionContext;
import org.quartz.JobExecutionException;

public class SyncRecentNotificationJob implements Job {
    public static void create() {
        ThreadPoolExecutor executor = new ThreadPoolExecutor(
            1, // core pool size
            8, // maximum pool size
            60L, // keep-alive time for idle threads
            TimeUnit.SECONDS, // time unit for keep-alive
            new LinkedBlockingQueue<Runnable>(1000) // work queue
        );
        // @todo for test
    }

    @Override
    public void execute(JobExecutionContext context) throws JobExecutionException {
        // @todo reach notifi
    }
}
