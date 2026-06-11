package com.aftersales.dto;

import com.aftersales.entity.Employee;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 员工数据传输对象
 */
@Data
public class EmployeeDTO {

    private Long id;
    private String employeeNo;
    private String username;
    private String name;
    private String phone;
    private String email;
    private String department;
    private String position;
    private String idCard;
    private Employee.EmployeeRole role;
    private Employee.EmployeeStatus status;
    private String avatarUrl;
    private LocalDate entryDate;
    private String remark;
    private LocalDateTime lastLoginTime;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    /**
     * 创建请求DTO
     */
    @Data
    public static class CreateRequest {
        private String employeeNo;
        private String username;
        private String password;
        private String name;
        private String phone;
        private String email;
        private String department;
        private String position;
        private Employee.EmployeeRole role;
        private LocalDate entryDate;
        private String remark;
    }

    /**
     * 更新请求DTO
     */
    @Data
    public static class UpdateRequest {
        private String name;
        private String phone;
        private String email;
        private String department;
        private String position;
        private Employee.EmployeeRole role;
        private Employee.EmployeeStatus status;
        private LocalDate entryDate;
        private String remark;
    }

    /**
     * 修改密码请求DTO
     */
    @Data
    public static class ChangePasswordRequest {
        private String oldPassword;
        private String newPassword;
    }

    /**
     * 登录请求DTO
     */
    @Data
    public static class LoginRequest {
        private String username;
        private String password;
    }

    /**
     * 登录响应DTO
     */
    @Data
    public static class LoginResponse {
        private String token;
        private String tokenType = "Bearer";
        private Long expiresIn;
        private EmployeeDTO employee;
    }

    /**
     * 列表查询请求DTO
     */
    @Data
    public static class ListRequest {
        private Integer page = 1;
        private Integer pageSize = 10;
        private String keyword;
        private String department;
        private Employee.EmployeeRole role;
        private Employee.EmployeeStatus status;
    }
}
