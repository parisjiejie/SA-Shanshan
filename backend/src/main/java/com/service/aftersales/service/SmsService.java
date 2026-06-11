package com.service.aftersales.service;

import com.service.aftersales.dto.SmsDTO;

/**
 * 短信服务接口
 */
public interface SmsService {

    /**
     * 发送短信
     *
     * @param phone         手机号
     * @param templateCode  模板编码
     * @param templateParam 模板参数（JSON格式）
     * @return 发送结果
     */
    SmsDTO.SendResponse sendSms(String phone, String templateCode, String templateParam);

    /**
     * 发送验证码
     *
     * @param request 发送验证码请求
     * @return 发送结果
     */
    SmsDTO.SendResponse sendVerifyCode(SmsDTO.SendVerifyCodeRequest request);

    /**
     * 验证验证码
     *
     * @param request 验证请求
     * @return 验证结果
     */
    SmsDTO.VerifyCodeResponse verifyCode(SmsDTO.VerifyCodeRequest request);

    /**
     * 获取发送统计
     *
     * @return 发送统计
     */
    SmsDTO.SendStatistics getStatistics();

    /**
     * 检查是否可以发送（防刷）
     *
     * @param phone 手机号
     * @return 是否可以发送
     */
    boolean canSend(String phone);
}
