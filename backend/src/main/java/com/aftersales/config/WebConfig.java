package com.aftersales.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Path;
import java.nio.file.Paths;

/**
 * Web配置类
 * 配置静态资源映射
 */
@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Autowired
    private FileStorageConfig fileStorageConfig;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // 获取绝对路径
        Path uploadPath = Paths.get(fileStorageConfig.getUploadPath()).toAbsolutePath().normalize();
        String uploadPathStr = uploadPath.toUri().toString();

        // 配置上传文件访问路径
        registry.addResourceHandler(fileStorageConfig.getAccessUrl() + "/**")
                .addResourceLocations(uploadPathStr);
    }
}
