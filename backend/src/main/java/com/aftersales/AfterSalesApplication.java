package com.aftersales;

import com.aftersales.config.ThirdPartyApiConfig;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

/**
 * 售后管理系统后端启动类
 */
@SpringBootApplication
@EnableConfigurationProperties(ThirdPartyApiConfig.class)
public class AfterSalesApplication {

    public static void main(String[] args) {
        SpringApplication.run(AfterSalesApplication.class, args);
    }
}