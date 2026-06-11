package com.aftersales.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 报价单项数据传输对象
 */
@Data
public class QuotationItemDTO {

    private Long id;
    private Long quotationId;
    private Long partId;
    private String partCode;
    private String partName;
    private String partModel;
    private String specification;
    private String unit;
    private Integer quantity;
    private BigDecimal unitPrice;
    private BigDecimal discount;
    private BigDecimal amount;
    private String remark;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    /**
     * 创建请求DTO
     */
    @Data
    public static class CreateRequest {
        private Long partId;
        private String specification;
        private Integer quantity;
        private BigDecimal unitPrice;
        private BigDecimal discount;
        private String remark;
    }

    /**
     * 更新请求DTO
     */
    @Data
    public static class UpdateRequest {
        private Long id;
        private Long partId;
        private String specification;
        private Integer quantity;
        private BigDecimal unitPrice;
        private BigDecimal discount;
        private String remark;
    }
}
