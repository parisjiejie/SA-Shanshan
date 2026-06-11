package com.aftersales.dto;

import com.aftersales.entity.Contact;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 联系人数据传输对象
 */
@Data
public class ContactDTO {

    private Long id;
    private Long customerId;
    private String customerName;
    private String name;
    private String phone;
    private String email;
    private String position;
    private Boolean isPrimary;
    private Contact.ApprovalStatus approvalStatus;
    private LocalDateTime registerTime;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    /**
     * 创建请求DTO
     */
    @Data
    public static class CreateRequest {
        private Long customerId;
        private String name;
        private String phone;
        private String email;
        private String position;
        private Boolean isPrimary;
    }

    /**
     * 更新请求DTO
     */
    @Data
    public static class UpdateRequest {
        private Long customerId;
        private String name;
        private String phone;
        private String email;
        private String position;
        private Boolean isPrimary;
        private Contact.ApprovalStatus approvalStatus;
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
        private String name;
        private String phone;
        private String position;
    }
}
