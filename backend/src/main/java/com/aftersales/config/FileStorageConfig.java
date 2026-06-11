package com.aftersales.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * 文件存储配置类
 */
@Data
@Configuration
@ConfigurationProperties(prefix = "file.storage")
public class FileStorageConfig {

    /**
     * 上传路径
     */
    private String uploadPath = "uploads";

    /**
     * 访问URL前缀
     */
    private String accessUrl = "/uploads";

    /**
     * 允许的文件类型
     */
    private String allowedTypes = "image/*,application/pdf";

    /**
     * 最大文件大小（MB）
     */
    private Integer maxSize = 10;

    /**
     * 头像存储路径
     */
    private String avatarPath = "avatars";

    /**
     * PDF存储路径
     */
    private String pdfPath = "pdfs";

    /**
     * 临时文件存储路径
     */
    private String tempPath = "temp";
}
