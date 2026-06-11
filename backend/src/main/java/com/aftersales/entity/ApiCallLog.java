package com.aftersales.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * API调用日志实体
 */
@Data
@Entity
@Table(name = "api_call_logs")
public class ApiCallLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * API类型：TIANYANCHA/AMAP/SMS
     */
    @Column(name = "api_type", length = 20)
    private String apiType;

    /**
     * 接口名称
     */
    @Column(name = "api_name", length = 50)
    private String apiName;

    /**
     * 请求参数
     */
    @Column(name = "request_params", length = 2000)
    private String requestParams;

    /**
     * 响应数据
     */
    @Column(name = "response_data", length = 4000)
    private String responseData;

    /**
     * 状态：0-失败 1-成功
     */
    @Column(name = "status")
    private Integer status;

    /**
     * 错误信息
     */
    @Column(name = "error_msg", length = 1000)
    private String errorMsg;

    /**
     * 耗时（毫秒）
     */
    @Column(name = "cost_time")
    private Integer costTime;

    /**
     * 创建时间
     */
    @CreationTimestamp
    @Column(name = "create_time", updatable = false)
    private LocalDateTime createTime;
}
