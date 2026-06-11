package com.aftersales.dto;

import com.aftersales.entity.Workorder;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 工单数据传输对象
 */
@Data
public class WorkorderDTO {

    private Long id;
    private String workorderNo;
    private Workorder.WorkorderType type;
    private Workorder.WorkorderStatus status;
    private Workorder.Priority priority;
    private Long customerId;
    private String customerName;
    private Long assetId;
    private String assetName;
    private Long contactId;
    private String contactName;
    private String problemDescription;
    private String solution;
    private Long employeeId;
    private String employeeName;
    private LocalDateTime createTime;
    private LocalDateTime acceptTime;
    private LocalDateTime startTime;
    private LocalDateTime completeTime;
    private LocalDateTime expectTime;
    private String customerSign;
    private Integer evaluationScore;
    private String evaluationContent;
    private Long createdBy;
    private String remark;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    /**
     * 创建请求DTO
     */
    @Data
    public static class CreateRequest {
        private Workorder.WorkorderType type;
        private Workorder.Priority priority;
        private Long customerId;
        private Long assetId;
        private Long contactId;
        private String problemDescription;
        private LocalDateTime expectTime;
        private String remark;
    }

    /**
     * 更新请求DTO
     */
    @Data
    public static class UpdateRequest {
        private Workorder.WorkorderType type;
        private Workorder.WorkorderStatus status;
        private Workorder.Priority priority;
        private Long customerId;
        private Long assetId;
        private Long contactId;
        private String problemDescription;
        private String solution;
        private Long employeeId;
        private LocalDateTime expectTime;
        private String customerSign;
        private Integer evaluationScore;
        private String evaluationContent;
        private String remark;
    }

    /**
     * 接单请求DTO
     */
    @Data
    public static class AcceptRequest {
        private Long employeeId;
    }

    /**
     * 完成请求DTO
     */
    @Data
    public static class CompleteRequest {
        private String solution;
        private String customerSign;
        private Integer evaluationScore;
        private String evaluationContent;
    }

    /**
     * 简要信息DTO（用于下拉选择等场景）
     */
    @Data
    public static class SimpleDTO {
        private Long id;
        private String workorderNo;
        private Workorder.WorkorderType type;
        private Workorder.WorkorderStatus status;
    }
}
