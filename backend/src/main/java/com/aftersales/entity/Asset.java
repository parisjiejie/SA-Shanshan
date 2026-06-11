package com.aftersales.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 设备实体类
 */
@Data
@Entity
@Table(name = "assets")
@EqualsAndHashCode(callSuper = false)
public class Asset {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "serial_number", unique = true, nullable = false, length = 50)
    private String serialNumber;

    @Column(name = "model", nullable = false, length = 100)
    private String model;

    @Column(name = "name", length = 100)
    private String name;

    @Column(name = "customer_id", nullable = false)
    private Long customerId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", insertable = false, updatable = false)
    private Customer customer;

    @Column(name = "type", length = 50)
    private String type;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 20)
    private AssetStatus status = AssetStatus.RUNNING;

    @Column(name = "manufacture_date")
    private LocalDate manufactureDate;

    @Column(name = "sales_date")
    private LocalDate salesDate;

    @Column(name = "install_date")
    private LocalDate installDate;

    @Column(name = "warranty_end_date")
    private LocalDate warrantyEndDate;

    @Column(name = "is_el")
    private Boolean isEl = false;

    @Column(name = "install_address", length = 255)
    private String installAddress;

    @Column(name = "qr_code", length = 255)
    private String qrCode;

    @Column(name = "remark", columnDefinition = "TEXT")
    private String remark;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    /**
     * 设备状态枚举
     */
    public enum AssetStatus {
        RUNNING,    // 运行中
        STOPPED,    // 停机
        MAINTAINING, // 维修中
        SCRAPPED    // 报废
    }
}
