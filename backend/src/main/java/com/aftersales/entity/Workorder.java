package com.aftersales.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * 工单实体类
 */
@Data
@Entity
@Table(name = "workorders")
@EqualsAndHashCode(callSuper = false)
public class Workorder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "workorder_no", unique = true, nullable = false, length = 20)
    private String workorderNo;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false, length = 20)
    private WorkorderType type;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 20)
    private WorkorderStatus status = WorkorderStatus.PENDING;

    @Enumerated(EnumType.STRING)
    @Column(name = "priority", length = 10)
    private Priority priority = Priority.MEDIUM;

    @Column(name = "customer_id", nullable = false)
    private Long customerId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", insertable = false, updatable = false)
    private Customer customer;

    @Column(name = "asset_id")
    private Long assetId;

    @Column(name = "contact_id")
    private Long contactId;

    @Column(name = "problem_description", columnDefinition = "TEXT")
    private String problemDescription;

    @Column(name = "solution", columnDefinition = "TEXT")
    private String solution;

    @Column(name = "employee_id")
    private Long employeeId;

    @Column(name = "create_time")
    private LocalDateTime createTime;

    @Column(name = "accept_time")
    private LocalDateTime acceptTime;

    @Column(name = "start_time")
    private LocalDateTime startTime;

    @Column(name = "complete_time")
    private LocalDateTime completeTime;

    @Column(name = "expect_time")
    private LocalDateTime expectTime;

    @Column(name = "customer_sign", columnDefinition = "TEXT")
    private String customerSign;

    @Column(name = "evaluation_score")
    private Integer evaluationScore;

    @Column(name = "evaluation_content", columnDefinition = "TEXT")
    private String evaluationContent;

    @Column(name = "created_by")
    private Long createdBy;

    @Column(name = "remark", columnDefinition = "TEXT")
    private String remark;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    /**
     * 工单类型枚举
     */
    public enum WorkorderType {
        REPAIR,      // 维修
        MAINTENANCE, // 保养
        INSTALL,     // 安装
        INSPECTION,  // 巡检
        PARTS_REPLACE // 配件更换
    }

    /**
     * 工单状态枚举
     */
    public enum WorkorderStatus {
        PENDING,     // 待处理
        ACCEPTED,    // 已接单
        PROCESSING,  // 处理中
        WAITING_CONFIRM, // 待确认
        COMPLETED,   // 已完成
        CANCELLED    // 已取消
    }

    /**
     * 优先级枚举
     */
    public enum Priority {
        URGENT,      // 紧急
        HIGH,        // 高
        MEDIUM,      // 中
        LOW          // 低
    }
}
