package com.aftersales.dto;

import com.aftersales.entity.Customer;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 客户数据传输对象
 */
@Data
public class CustomerDTO {

    private Long id;
    private String name;
    private String creditCode;
    private String legalPerson;
    private String address;
    private String phone;
    private String email;
    private Customer.CustomerLevel level;
    private Customer.CustomerStatus status;
    private String remark;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    /**
     * 创建请求DTO
     */
    @Data
    public static class CreateRequest {
        private String name;
        private String creditCode;
        private String legalPerson;
        private String address;
        private String phone;
        private String email;
        private Customer.CustomerLevel level;
        private String remark;
    }

    /**
     * 更新请求DTO
     */
    @Data
    public static class UpdateRequest {
        private String name;
        private String creditCode;
        private String legalPerson;
        private String address;
        private String phone;
        private String email;
        private Customer.CustomerLevel level;
        private Customer.CustomerStatus status;
        private String remark;
    }

    /**
     * 列表查询请求DTO
     */
    @Data
    public static class ListRequest {
        private Integer page = 1;
        private Integer pageSize = 10;
        private String keyword;
        private Customer.CustomerLevel level;
        private Customer.CustomerStatus status;
    }

    /**
     * 简要信息DTO（用于下拉选择等场景）
     */
    @Data
    public static class SimpleDTO {
        private Long id;
        private String name;
        private String creditCode;
        private String legalPerson;
        private String address;
        private String phone;
        private String email;
        private Customer.CustomerLevel level;
        private Customer.CustomerStatus status;
    }
}
