package com.aftersales.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * 第三方API配置类
 * 包含天眼查、高德地图、短信服务的配置
 */
@Data
@Configuration
@ConfigurationProperties(prefix = "third-party")
public class ThirdPartyApiConfig {

    /**
     * 天眼查配置
     */
    private TianyanchaConfig tianyancha = new TianyanchaConfig();

    /**
     * 高德地图配置
     */
    private AmapConfig amap = new AmapConfig();

    /**
     * 短信服务配置
     */
    private SmsConfig sms = new SmsConfig();

    @Data
    public static class TianyanchaConfig {
        /** API Key */
        private String apiKey;
        /** API Secret */
        private String apiSecret;
        /** 基础URL */
        private String baseUrl = "https://open.api.tianyancha.com/services/v4";
        /** 连接超时（毫秒） */
        private int connectTimeout = 10000;
        /** 读取超时（毫秒） */
        private int readTimeout = 30000;
        /** 是否启用 */
        private boolean enabled = false;
    }

    @Data
    public static class AmapConfig {
        /** Web服务API Key */
        private String key;
        /** Web端JS API安全密钥 */
        private String securityConfig;
        /** 基础URL */
        private String baseUrl = "https://restapi.amap.com/v3";
        /** 连接超时（毫秒） */
        private int connectTimeout = 10000;
        /** 读取超时（毫秒） */
        private int readTimeout = 15000;
        /** 是否启用 */
        private boolean enabled = false;
    }

    @Data
    public static class SmsConfig {
        /** 短信服务商：aliyun/tencent */
        private String provider = "aliyun";
        /** 阿里云配置 */
        private AliyunSmsConfig aliyun = new AliyunSmsConfig();
        /** 腾讯云配置 */
        private TencentSmsConfig tencent = new TencentSmsConfig();
        /** 验证码长度 */
        private int verifyCodeLength = 6;
        /** 验证码有效期（分钟） */
        private int verifyCodeExpireMinutes = 5;
        /** 发送间隔（秒） */
        private int sendInterval = 60;
        /** 每日最大发送次数 */
        private int maxSendPerDay = 10;
        /** 是否启用 */
        private boolean enabled = false;
    }

    @Data
    public static class AliyunSmsConfig {
        /** AccessKey ID */
        private String accessKeyId;
        /** AccessKey Secret */
        private String accessKeySecret;
        /** 短信签名 */
        private String signName;
        /** 验证码模板CODE */
        private String verifyCodeTemplateCode;
        /** 通知类模板CODE */
        private String notificationTemplateCode;
        /** 地域 */
        private String region = "-cn-hangzhou";
    }

    @Data
    public static class TencentSmsConfig {
        /** SecretId */
        private String secretId;
        /** SecretKey */
        private String secretKey;
        /** 应用ID */
        private String appId;
        /** 短信签名 */
        private String signName;
        /** 验证码模板ID */
        private String verifyCodeTemplateId;
        /** 通知类模板ID */
        private String notificationTemplateId;
        /** 地域 */
        private String region = "ap-guangzhou";
    }
}
