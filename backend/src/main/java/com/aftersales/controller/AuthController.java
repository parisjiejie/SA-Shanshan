package com.aftersales.controller;

import com.aftersales.dto.ApiResponse;
import com.aftersales.dto.EmployeeDTO;
import com.aftersales.service.EmployeeService;
import com.aftersales.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * 认证控制器
 */
@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider jwtTokenProvider;
    private final EmployeeService employeeService;

    /**
     * 用户登录
     */
    @PostMapping("/login")
    public ApiResponse<Map<String, Object>> login(@RequestBody Map<String, String> credentials) {
        String username = credentials.get("username");
        String password = credentials.get("password");

        // 认证
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(username, password)
        );

        // 生成JWT token
        String token = jwtTokenProvider.generateToken(authentication);

        // 获取用户信息
        EmployeeDTO employee = employeeService.findByUsername(username);
        employeeService.updateLastLoginTime(employee.getId());

        // 返回结果
        Map<String, Object> result = new HashMap<>();
        result.put("token", token);
        result.put("user", employee);

        return ApiResponse.success("登录成功", result);
    }

    /**
     * 刷新token
     */
    @PostMapping("/refresh")
    public ApiResponse<Map<String, String>> refresh(@RequestHeader("Authorization") String token) {
        String newToken = jwtTokenProvider.refreshToken(token.replace("Bearer ", ""));
        Map<String, String> result = new HashMap<>();
        result.put("token", newToken);
        return ApiResponse.success("刷新成功", result);
    }
}
