package com.aftersales.aspect;

import com.aftersales.annotation.OperationLog;
import com.aftersales.entity.OperationLogEntity;
import com.aftersales.repository.OperationLogRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Pointcut;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.lang.reflect.Method;
import java.time.LocalDateTime;

/**
 * 操作日志AOP切面
 */
@Slf4j
@Aspect
@Component
@RequiredArgsConstructor
public class OperationLogAspect {

    private final OperationLogRepository operationLogRepository;
    private final ObjectMapper objectMapper;

    /**
     * 定义切点 - 所有带有@OperationLog注解的方法
     */
    @Pointcut("@annotation(com.aftersales.annotation.OperationLog)")
    public void operationLogPointcut() {
    }

    /**
     * 环绕通知
     */
    @Around("operationLogPointcut()")
    public Object around(ProceedingJoinPoint joinPoint) throws Throwable {
        // 获取方法签名
        MethodSignature signature = (MethodSignature) joinPoint.getSignature();
        Method method = signature.getMethod();
        OperationLog operationLog = method.getAnnotation(OperationLog.class);

        // 获取请求信息
        HttpServletRequest request = getRequest();
        String ipAddress = getIpAddress(request);
        String userAgent = request.getHeader("User-Agent");

        // 获取当前用户
        String operatorName = getCurrentUsername();
        Long operatorId = getCurrentUserId();

        // 记录开始时间
        long startTime = System.currentTimeMillis();

        // 构建日志实体
        OperationLogEntity logEntity = new OperationLogEntity();
        logEntity.setOperationType(operationLog.operationType());
        logEntity.setOperationDesc(operationLog.operationDesc());
        logEntity.setOperatorId(operatorId);
        logEntity.setOperatorName(operatorName);
        logEntity.setIpAddress(ipAddress);
        logEntity.setUserAgent(userAgent);
        logEntity.setOperationTime(LocalDateTime.now());

        // 记录请求参数
        if (operationLog.logRequest()) {
            try {
                Object[] args = joinPoint.getArgs();
                String requestData = objectMapper.writeValueAsString(args);
                // 限制长度
                if (requestData.length() > 4000) {
                    requestData = requestData.substring(0, 4000) + "...";
                }
                logEntity.setRequestData(requestData);
            } catch (Exception e) {
                logEntity.setRequestData("参数序列化失败: " + e.getMessage());
            }
        }

        Object result = null;
        try {
            // 执行目标方法
            result = joinPoint.proceed();

            // 设置成功状态
            logEntity.setStatus(1);

            // 记录响应结果
            if (operationLog.logResponse() && result != null) {
                try {
                    String responseData = objectMapper.writeValueAsString(result);
                    // 限制长度
                    if (responseData.length() > 4000) {
                        responseData = responseData.substring(0, 4000) + "...";
                    }
                    logEntity.setResponseData(responseData);
                } catch (Exception e) {
                    logEntity.setResponseData("响应序列化失败: " + e.getMessage());
                }
            }

            return result;
        } catch (Exception e) {
            // 设置失败状态
            logEntity.setStatus(0);
            logEntity.setErrorMsg(e.getMessage());
            throw e;
        } finally {
            // 计算耗时
            long costTime = System.currentTimeMillis() - startTime;
            logEntity.setCostTime((int) costTime);

            // 保存日志
            try {
                operationLogRepository.save(logEntity);
            } catch (Exception e) {
                log.error("保存操作日志失败", e);
            }
        }
    }

    /**
     * 获取当前请求
     */
    private HttpServletRequest getRequest() {
        ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        if (attributes != null) {
            return attributes.getRequest();
        }
        return null;
    }

    /**
     * 获取客户端IP地址
     */
    private String getIpAddress(HttpServletRequest request) {
        if (request == null) {
            return "";
        }
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("Proxy-Client-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("WL-Proxy-Client-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("HTTP_CLIENT_IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("HTTP_X_FORWARDED_FOR");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddr();
        }
        // 多个代理情况，取第一个IP
        if (ip != null && ip.contains(",")) {
            ip = ip.split(",")[0].trim();
        }
        return ip;
    }

    /**
     * 获取当前用户名
     */
    private String getCurrentUsername() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated()) {
            return authentication.getName();
        }
        return "anonymous";
    }

    /**
     * 获取当前用户ID
     */
    private Long getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated() && authentication.getPrincipal() != null) {
            // 这里假设Principal中存储了用户ID，根据实际情况调整
            try {
                return Long.valueOf(authentication.getPrincipal().toString());
            } catch (Exception e) {
                return null;
            }
        }
        return null;
    }
}
