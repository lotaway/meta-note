package com.metawebthree.common.utils;

import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Pointcut;
import org.springframework.stereotype.Component;

import java.util.Arrays;

@Slf4j
@Component
@Aspect
public class LoggerAop {

    @Pointcut("execution(* com.metawebthree.*Service.*(..))")
    private void pt() {}

    @Around("pt()")
    public Object record(ProceedingJoinPoint proceedingJoinPoint) throws Throwable {
        long startTime = System.currentTimeMillis();
        Class<?> clazz = proceedingJoinPoint.getSignature().getClass();
        String methodName = proceedingJoinPoint.getSignature().getName();
        Object[] args = proceedingJoinPoint.getArgs();
        Object result = proceedingJoinPoint.proceed();
        log.info("Method invoke: {}: {}, args: {}, time cost: {}", clazz.getName(), methodName, Arrays.toString(args), System.currentTimeMillis() - startTime);
        return result;
    }
}
