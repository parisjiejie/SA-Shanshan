package com.aftersales.dto;

import com.aftersales.entity.Part;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 配件数据传输对象
 */
@Data
public class PartDTO {

    private Long id;
    private String code;
    private String name;
    private String model;
    private String category;
    private String specification;
    private String unit;
    private Integer stock;
    private Integer minStock;
    private Integer maxStock;
    private BigDecimal price;
    private String supplier;
    private String location;
    private Part.PartStatus status;
    private String remark;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    /**
     * 创建请求DTO
     */
    @Data
    public static class CreateRequest {
        private String code;
        private String name;
        private String model;
        private String category;
        private String specification;
        private String unit;
        private Integer stock;
        private Integer minStock;
        private Integer maxStock;
        private BigDecimal price;
        private String supplier;
        private String location;
        private String remark;
    }

    /**
     * 更新请求DTO
     */
    @Data
    public static class UpdateRequest {
        private String code;
        private String name;
        private String model;
        private String category;
        private String specification;
        private String unit;
        private Integer stock;
        private Integer minStock;
        private Integer maxStock;
        private BigDecimal price;
        private String supplier;
        private String location;
        private Part.PartStatus status;
        private String remark;
    }

    /**
     * 库存调整请求DTO
     */
    @Data
    public static class StockAdjustRequest {
        private Integer quantity;
        private String reason;
    }

    /**
     * 简要信息DTO（用于下拉选择等场景）
     */
    @Data
    public static class SimpleDTO {
        private Long id;
        private String code;
        private String name;
        private String model;
        private String category;
        private String unit;
        private Integer stock;
        private BigDecimal price;
        private Part.PartStatus status;
    }
}
