package com.metawebthree.job;

import java.util.concurrent.ExecutionException;
import java.util.concurrent.Future;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.ThreadPoolExecutor;
import java.util.concurrent.TimeUnit;

import org.quartz.Job;
import org.quartz.JobExecutionContext;
import org.quartz.JobExecutionException;

public class SyncRecentNotificationJob implements Job {
    public static Boolean start() throws InterruptedException, ExecutionException {
        try (ThreadPoolExecutor executor = new ThreadPoolExecutor(
            1, // core pool size
            8, // maximum pool size
            60L, // keep-alive time for idle threads
            TimeUnit.SECONDS, // time unit for keep-alive
            new LinkedBlockingQueue<Runnable>(1000) // work queue
        )) {
            // @todo for test
            Future<Boolean> task = executor.submit(() -> {
                try {
                    new SyncRecentNotificationJob().execute(null);
                    return true;
                } catch (JobExecutionException e) {
                    e.printStackTrace();
                    return false;
                }
            });
            return task.get();
        }
    }

    @Override
    public void execute(JobExecutionContext context) throws JobExecutionException {
        // @todo reach notifi
    }
}
