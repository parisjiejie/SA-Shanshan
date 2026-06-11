package com.service.aftersales.dto;

import lombok.Data;
import java.time.LocalDateTime;

/**
 * 短信服务相关DTO
 */
public class SmsDTO {

    /**
     * 发送短信请求
     */
    @Data
    public static class SendRequest {
        /** 手机号 */
        private String phone;
        /** 模板编码 */
        private String templateCode;
        /** 模板参数（JSON格式） */
        private String templateParam;
    }

    /**
     * 发送验证码请求
     */
    @Data
    public static class SendVerifyCodeRequest {
        /** 手机号 */
        private String phone;
        /** 验证码类型：login/register/reset_password/bind_phone */
        private String type = "login";
        /** 图形验证码（防刷） */
        private String captcha;
        /** 图形验证码ID */
        private String captchaId;
    }

    /**
     * 发送短信响应
     */
    @Data
    public static class SendResponse {
        /** 是否成功 */
        private Boolean success;
        /** 响应码 */
        private String code;
        /** 响应消息 */
        private String message;
        /** 短信记录ID */
        private String recordId;
        /** 发送时间 */
        private LocalDateTime sendTime;
    }

    /**
     * 验证验证码请求
     */
    @Data
    public static class VerifyCodeRequest {
        /** 手机号 */
        private String phone;
        /** 验证码 */
        private String code;
        /** 验证码类型 */
        private String type = "login";
    }

    /**
     * 验证验证码响应
     */
    @Data
    public static class VerifyCodeResponse {
        /** 是否验证成功 */
        private Boolean success;
        /** 响应码 */
        private String code;
        /** 响应消息 */
        private String message;
        /** 验证时间 */
        private LocalDateTime verifyTime;
    }

    /**
     * 短信发送记录
     */
    @Data
    public static class SmsRecord {
        /** 记录ID */
        private String id;
        /** 手机号 */
        private String phone;
        /** 模板编码 */
        private String templateCode;
        /** 模板参数 */
        private String templateParams;
        /** 验证码 */
        private String verifyCode;
        /** 状态：0-发送中 1-成功 2-失败 */
        private Integer status;
        /** 响应码 */
        private String responseCode;
        /** 响应消息 */
        private String responseMsg;
        /** 发送时间 */
        private LocalDateTime sendTime;
        /** 过期时间 */
        private LocalDateTime expireTime;
        /** 验证时间 */
        private LocalDateTime verifyTime;
        /** IP地址 */
        private String ipAddress;
        /** 创建时间 */
        private LocalDateTime createTime;
    }

    /**
     * 短信模板
     */
    @Data
    public static class SmsTemplate {
        /** 模板编码 */
        private String code;
        /** 模板名称 */
        private String name;
        /** 模板内容 */
        private String content;
        /** 模板类型：verify_code/notification/marketing */
        private String type;
        /** 状态：0-禁用 1-启用 */
        private Integer status;
    }

    /**
     * 发送统计
     */
    @Data
    public static class SendStatistics {
        /** 总发送次数 */
        private Long totalCount;
        /** 成功次数 */
        private Long successCount;
        /** 失败次数 */
        private Long failCount;
        /** 今日发送次数 */
        private Long todayCount;
        /** 今日成功次数 */
        private Long todaySuccessCount;
    }
}
