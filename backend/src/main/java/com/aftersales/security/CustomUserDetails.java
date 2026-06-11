package com.aftersales.security;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.User;

import java.util.Collection;

public class CustomUserDetails extends User {

    private final Long employeeId;
    private final String role;
    private final String department;

    public CustomUserDetails(String username, String password,
                             Collection<? extends GrantedAuthority> authorities,
                             Long employeeId, String role, String department) {
        super(username, password, authorities);
        this.employeeId = employeeId;
        this.role = role;
        this.department = department;
    }

    public Long getEmployeeId() {
        return employeeId;
    }

    public String getRole() {
        return role;
    }

    public String getDepartment() {
        return department;
    }
}
