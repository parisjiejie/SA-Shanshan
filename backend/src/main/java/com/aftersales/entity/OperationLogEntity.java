package com.aftersales.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * 操作日志实体
 */
@Data
@Entity
@Table(name = "operation_logs")
public class OperationLogEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * 操作类型
     */
    @Column(name = "operation_type", length = 50)
    private String operationType;

    /**
     * 操作描述
     */
    @Column(name = "operation_desc", length = 255)
    private String operationDesc;

    /**
     * 操作人ID
     */
    @Column(name = "operator_id")
    private Long operatorId;

    /**
     * 操作人姓名
     */
    @Column(name = "operator_name", length = 50)
    private String operatorName;

    /**
     * 请求数据
     */
    @Column(name = "request_data", length = 4000)
    private String requestData;

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
     * IP地址
     */
    @Column(name = "ip_address", length = 50)
    private String ipAddress;

    /**
     * 用户代理
     */
    @Column(name = "user_agent", length = 500)
    private String userAgent;

    /**
     * 操作时间
     */
    @Column(name = "operation_time")
    private LocalDateTime operationTime;

    /**
     * 创建时间
     */
    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
