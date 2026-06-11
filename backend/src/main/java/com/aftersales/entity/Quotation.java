package com.aftersales.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 报价单实体类
 */
@Data
@Entity
@Table(name = "quotations")
@EqualsAndHashCode(callSuper = false)
public class Quotation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "quotation_no", unique = true, nullable = false, length = 20)
    private String quotationNo;

    @Column(name = "customer_id", nullable = false)
    private Long customerId;

    @Column(name = "contact_id")
    private Long contactId;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 20)
    private QuotationStatus status = QuotationStatus.DRAFT;

    @Column(name = "total_amount", precision = 12, scale = 2)
    private BigDecimal totalAmount;

    @Column(name = "valid_days")
    private Integer validDays = 30;

    @Column(name = "expire_date")
    private LocalDate expireDate;

    @Column(name = "pdf_url", length = 255)
    private String pdfUrl;

    @Column(name = "created_by")
    private Long createdBy;

    @Column(name = "approved_by")
    private Long approvedBy;

    @Column(name = "approved_time")
    private LocalDateTime approvedTime;

    @Column(name = "remark", columnDefinition = "TEXT")
    private String remark;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    /**
     * 报价单状态枚举
     */
    public enum QuotationStatus {
        DRAFT,           // 草稿
        PENDING_APPROVAL, // 待审核
        APPROVED,        // 已审核
        SENT,            // 已发送
        CUSTOMER_CONFIRMED, // 客户已确认
        CUSTOMER_REJECTED,  // 客户已拒绝
        EXPIRED          // 已过期
    }
}
