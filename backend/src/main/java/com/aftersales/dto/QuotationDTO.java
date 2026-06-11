package com.aftersales.dto;

import com.aftersales.entity.Quotation;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 报价单数据传输对象
 */
@Data
public class QuotationDTO {

    private Long id;
    private String quotationNo;
    private Long customerId;
    private String customerName;
    private Long contactId;
    private String contactName;
    private Quotation.QuotationStatus status;
    private BigDecimal totalAmount;
    private Integer validDays;
    private LocalDate expireDate;
    private String pdfUrl;
    private Long createdBy;
    private String createdByName;
    private Long approvedBy;
    private String approvedByName;
    private LocalDateTime approvedTime;
    private String remark;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<QuotationItemDTO> items;

    /**
     * 创建请求DTO
     */
    @Data
    public static class CreateRequest {
        private Long customerId;
        private Long contactId;
        private Integer validDays;
        private String remark;
        private List<QuotationItemDTO.CreateRequest> items;
    }

    /**
     * 更新请求DTO
     */
    @Data
    public static class UpdateRequest {
        private Long customerId;
        private Long contactId;
        private Integer validDays;
        private String remark;
        private List<QuotationItemDTO.UpdateRequest> items;
    }

    /**
     * 提交审核请求DTO
     */
    @Data
    public static class SubmitRequest {
        private String remark;
    }

    /**
     * 审核请求DTO
     */
    @Data
    public static class ApproveRequest {
        private Boolean approved;
        private String remark;
    }

    /**
     * 简要信息DTO（用于下拉选择等场景）
     */
    @Data
    public static class SimpleDTO {
        private Long id;
        private String quotationNo;
        private Long customerId;
        private String customerName;
        private Long contactId;
        private String contactName;
        private Quotation.QuotationStatus status;
        private BigDecimal totalAmount;
        private Integer validDays;
        private LocalDate expireDate;
    }
}
