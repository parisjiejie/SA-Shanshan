package com.aftersales.service;

import com.aftersales.config.ThirdPartyApiConfig;
import com.aftersales.dto.SmsDTO;
import com.aftersales.entity.ApiCallLog;
import com.aftersales.repository.ApiCallLogRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;

/**
 * 短信服务
 * 支持阿里云短信和模拟发送（开发测试用）
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SmsService {

    private final ThirdPartyApiConfig thirdPartyApiConfig;
    private final ApiCallLogRepository apiCallLogRepository;
    private final ObjectMapper objectMapper;

    // 验证码缓存（生产环境应使用Redis）
    private final Map<String, SmsDTO.SmsRecord> verifyCodeCache = new ConcurrentHashMap<>();

    /**
     * 发送验证码
     */
    public SmsDTO.SendResponse sendVerifyCode(SmsDTO.SendVerifyCodeRequest request) {
        String phone = request.getPhone();
        String type = request.getType();

        // 检查发送频率
        if (!checkSendInterval(phone)) {
            return createErrorResponse("发送过于频繁，请稍后再试");
        }

        // 生成验证码
        String verifyCode = generateVerifyCode();

        // 构建短信内容
        String templateParam = "{\"code\":\"" + verifyCode + "\"}";

        // 发送短信
        SmsDTO.SendRequest sendRequest = new SmsDTO.SendRequest();
        sendRequest.setPhone(phone);
        sendRequest.setTemplateParam(templateParam);

        SmsDTO.SendResponse response;
        if (thirdPartyApiConfig.getSms().isEnabled()) {
            response = sendSms(sendRequest);
        } else {
            // 模拟发送（开发测试用）
            response = mockSendSms(phone, verifyCode);
        }

        // 如果发送成功，保存验证码到缓存
        if (response.getSuccess()) {
            SmsDTO.SmsRecord record = new SmsDTO.SmsRecord();
            record.setPhone(phone);
            record.setVerifyCode(verifyCode);
            record.setSendTime(LocalDateTime.now());
            record.setExpireTime(LocalDateTime.now().plusMinutes(
                    thirdPartyApiConfig.getSms().getVerifyCodeExpireMinutes()));
            verifyCodeCache.put(getCacheKey(phone, type), record);

            log.info("验证码已发送到 {}: {}", phone, verifyCode);
        }

        return response;
    }

    /**
     * 验证验证码
     */
    public SmsDTO.VerifyCodeResponse verifyCode(SmsDTO.VerifyCodeRequest request) {
        String phone = request.getPhone();
        String code = request.getCode();
        String type = request.getType();

        String cacheKey = getCacheKey(phone, type);
        SmsDTO.SmsRecord record = verifyCodeCache.get(cacheKey);

        SmsDTO.VerifyCodeResponse response = new SmsDTO.VerifyCodeResponse();
        response.setVerifyTime(LocalDateTime.now());

        if (record == null) {
            response.setSuccess(false);
            response.setCode("CODE_NOT_FOUND");
            response.setMessage("验证码不存在或已过期");
            return response;
        }

        // 检查是否过期
        if (record.getExpireTime().isBefore(LocalDateTime.now())) {
            verifyCodeCache.remove(cacheKey);
            response.setSuccess(false);
            response.setCode("CODE_EXPIRED");
            response.setMessage("验证码已过期");
            return response;
        }

        // 验证验证码
        if (!record.getVerifyCode().equals(code)) {
            response.setSuccess(false);
            response.setCode("CODE_INVALID");
            response.setMessage("验证码错误");
            return response;
        }

        // 验证成功，删除缓存
        verifyCodeCache.remove(cacheKey);
        record.setVerifyTime(LocalDateTime.now());

        response.setSuccess(true);
        response.setCode("SUCCESS");
        response.setMessage("验证成功");

        return response;
    }

    /**
     * 发送短信（实际调用阿里云或腾讯云）
     */
    private SmsDTO.SendResponse sendSms(SmsDTO.SendRequest request) {
        String provider = thirdPartyApiConfig.getSms().getProvider();

        if ("aliyun".equals(provider)) {
            return sendAliyunSms(request);
        } else if ("tencent".equals(provider)) {
            return sendTencentSms(request);
        } else {
            return createErrorResponse("不支持的短信服务商");
        }
    }

    /**
     * 发送阿里云短信
     */
    private SmsDTO.SendResponse sendAliyunSms(SmsDTO.SendRequest request) {
        // TODO: 集成阿里云短信SDK
        // 需要添加依赖: com.aliyun:dysmsapi20170525
        log.info("发送阿里云短信到: {}", request.getPhone());
        return mockSendSms(request.getPhone(), "123456");
    }

    /**
     * 发送腾讯云短信
     */
    private SmsDTO.SendResponse sendTencentSms(SmsDTO.SendRequest request) {
        // TODO: 集成腾讯云短信SDK
        // 需要添加依赖: com.tencentcloudapi:tencentcloud-sdk-java
        log.info("发送腾讯云短信到: {}", request.getPhone());
        return mockSendSms(request.getPhone(), "123456");
    }

    /**
     * 模拟发送短信（开发测试用）
     */
    private SmsDTO.SendResponse mockSendSms(String phone, String code) {
        SmsDTO.SendResponse response = new SmsDTO.SendResponse();
        response.setSuccess(true);
        response.setCode("SUCCESS");
        response.setMessage("短信发送成功");
        response.setSendTime(LocalDateTime.now());

        log.info("【模拟短信】发送到 {}: 验证码 {}", phone, code);

        return response;
    }

    /**
     * 生成验证码
     */
    private String generateVerifyCode() {
        int length = thirdPartyApiConfig.getSms().getVerifyCodeLength();
        StringBuilder code = new StringBuilder();
        Random random = new Random();
        for (int i = 0; i < length; i++) {
            code.append(random.nextInt(10));
        }
        return code.toString();
    }

    /**
     * 检查发送频率
     */
    private boolean checkSendInterval(String phone) {
        // TODO: 实现发送频率检查（使用Redis记录发送时间）
        return true;
    }

    /**
     * 获取缓存key
     */
    private String getCacheKey(String phone, String type) {
        return phone + ":" + type;
    }

    /**
     * 创建错误响应
     */
    private SmsDTO.SendResponse createErrorResponse(String message) {
        SmsDTO.SendResponse response = new SmsDTO.SendResponse();
        response.setSuccess(false);
        response.setCode("ERROR");
        response.setMessage(message);
        return response;
    }

    /**
     * 保存API调用日志
     */
    private void saveApiLog(String apiType, String apiName, String requestParams,
                           String responseData, int status, String errorMsg, int costTime) {
        try {
            ApiCallLog log = new ApiCallLog();
            log.setApiType(apiType);
            log.setApiName(apiName);
            log.setRequestParams(requestParams);
            log.setResponseData(responseData);
            log.setStatus(status);
            log.setErrorMsg(errorMsg);
            log.setCostTime(costTime);
            log.setCreateTime(LocalDateTime.now());
            apiCallLogRepository.save(log);
        } catch (Exception e) {
            log.error("保存API调用日志失败", e);
        }
    }
}
