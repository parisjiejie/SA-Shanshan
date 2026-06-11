package com.aftersales.dto;

import com.aftersales.entity.Asset;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 设备数据传输对象
 */
@Data
public class AssetDTO {

    private Long id;
    private String serialNumber;
    private String model;
    private String name;
    private Long customerId;
    private String customerName;
    private String type;
    private Asset.AssetStatus status;
    private LocalDate manufactureDate;
    private LocalDate salesDate;
    private LocalDate installDate;
    private LocalDate warrantyEndDate;
    private Boolean isEl;
    private String installAddress;
    private String qrCode;
    private String remark;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    /**
     * 创建请求DTO
     */
    @Data
    public static class CreateRequest {
        private String serialNumber;
        private String model;
        private String name;
        private Long customerId;
        private String type;
        private Asset.AssetStatus status;
        private LocalDate manufactureDate;
        private LocalDate salesDate;
        private LocalDate installDate;
        private LocalDate warrantyEndDate;
        private Boolean isEl;
        private String installAddress;
        private String qrCode;
        private String remark;
    }

    /**
     * 更新请求DTO
     */
    @Data
    public static class UpdateRequest {
        private String serialNumber;
        private String model;
        private String name;
        private Long customerId;
        private String type;
        private Asset.AssetStatus status;
        private LocalDate manufactureDate;
        private LocalDate salesDate;
        private LocalDate installDate;
        private LocalDate warrantyEndDate;
        private Boolean isEl;
        private String installAddress;
        private String qrCode;
        private String remark;
    }

    /**
     * 简要信息DTO（用于下拉选择等场景）
     */
    @Data
    public static class SimpleDTO {
        private Long id;
        private String serialNumber;
        private String model;
        private String name;
        private Long customerId;
        private String customerName;
        private LocalDate salesDate;
        private LocalDate installDate;
        private LocalDate warrantyEndDate;
        private Boolean isEl;
        private String installAddress;
        private String qrCode;
        private String remark;
    }
}
