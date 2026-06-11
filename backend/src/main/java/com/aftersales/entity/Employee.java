package com.aftersales.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 员工实体类
 */
@Data
@Entity
@Table(name = "employees")
@EqualsAndHashCode(callSuper = false)
public class Employee {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "employee_no", unique = true, length = 50)
    private String employeeNo;

    @Column(name = "username", unique = true, nullable = false, length = 50)
    private String username;

    @Column(name = "password", nullable = false, length = 255)
    private String password;

    @Column(name = "name", nullable = false, length = 50)
    private String name;

    @Column(name = "phone", length = 20)
    private String phone;

    @Column(name = "email", length = 100)
    private String email;

    @Column(name = "department", length = 50)
    private String department;

    @Column(name = "position", length = 50)
    private String position;

    @Column(name = "id_card", length = 18)
    private String idCard;

    @Enumerated(EnumType.STRING)
    @Column(name = "role", length = 20)
    private EmployeeRole role = EmployeeRole.ENGINEER;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 20)
    private EmployeeStatus status = EmployeeStatus.ACTIVE;

    @Column(name = "avatar_url", length = 500)
    private String avatarUrl;

    @Column(name = "entry_date")
    private LocalDate entryDate;

    @Column(name = "remark", length = 500)
    private String remark;

    @Column(name = "last_login_time")
    private LocalDateTime lastLoginTime;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    /**
     * 员工角色枚举
     */
    public enum EmployeeRole {
        ADMIN, MANAGER, TECH_LEAD, ENGINEER, SALES, SERVICE
    }

    /**
     * 员工状态枚举
     */
    public enum EmployeeStatus {
        ACTIVE, RESIGNED, ON_LEAVE
    }
}
