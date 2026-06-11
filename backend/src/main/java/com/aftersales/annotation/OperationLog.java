package com.aftersales.annotation;

import java.lang.annotation.*;

/**
 * 操作日志注解
 * 用于标记需要记录操作日志的方法
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface OperationLog {

    /**
     * 操作类型
     */
    String operationType();

    /**
     * 操作描述
     */
    String operationDesc() default "";

    /**
     * 是否记录请求参数
     */
    boolean logRequest() default true;

    /**
     * 是否记录响应结果
     */
    boolean logResponse() default false;
}
