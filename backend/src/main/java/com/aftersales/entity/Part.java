package com.aftersales.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 配件实体类
 */
@Data
@Entity
@Table(name = "parts")
@EqualsAndHashCode(callSuper = false)
public class Part {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "code", unique = true, nullable = false, length = 50)
    private String code;

    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @Column(name = "model", length = 100)
    private String model;

    @Column(name = "category", length = 50)
    private String category;

    @Column(name = "specification", columnDefinition = "TEXT")
    private String specification;

    @Column(name = "unit", length = 20)
    private String unit = "个";

    @Column(name = "stock")
    private Integer stock = 0;

    @Column(name = "min_stock")
    private Integer minStock = 10;

    @Column(name = "max_stock")
    private Integer maxStock = 100;

    @Column(name = "price", precision = 10, scale = 2)
    private BigDecimal price;

    @Column(name = "supplier", length = 100)
    private String supplier;

    @Column(name = "location", length = 100)
    private String location;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 20)
    private PartStatus status = PartStatus.SUFFICIENT;

    @Column(name = "remark", columnDefinition = "TEXT")
    private String remark;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    /**
     * 配件状态枚举
     */
    public enum PartStatus {
        SUFFICIENT,  // 充足
        TIGHT,       // 紧张
        OUT_OF_STOCK // 缺货
    }
}
