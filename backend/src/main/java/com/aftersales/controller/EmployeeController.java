package com.aftersales.controller;

import com.aftersales.dto.ApiResponse;
import com.aftersales.dto.EmployeeDTO;
import com.aftersales.dto.PageResult;
import com.aftersales.entity.Employee;
import com.aftersales.service.EmployeeService;
import com.aftersales.service.FileStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

/**
 * 员工管理控制器
 */
@RestController
@RequestMapping("/employees")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class EmployeeController {

    private final EmployeeService employeeService;
    private final FileStorageService fileStorageService;

    /**
     * 获取员工列表
     */
    @GetMapping
    public ApiResponse<PageResult<EmployeeDTO>> getList(
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "10") Integer pageSize,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String department,
            @RequestParam(required = false) Employee.EmployeeRole role,
            @RequestParam(required = false) Employee.EmployeeStatus status) {
        PageResult<EmployeeDTO> result = employeeService.getList(page, pageSize, keyword, department, role, status);
        return ApiResponse.success(result);
    }

    /**
     * 获取员工详情
     */
    @GetMapping("/{id}")
    public ApiResponse<EmployeeDTO> getById(@PathVariable Long id) {
        EmployeeDTO employee = employeeService.getById(id);
        return ApiResponse.success(employee);
    }

    /**
     * 创建员工
     */
    @PostMapping
    public ApiResponse<EmployeeDTO> create(@RequestBody EmployeeDTO.CreateRequest request) {
        EmployeeDTO newEmployee = employeeService.create(request);
        return ApiResponse.success("创建成功", newEmployee);
    }

    /**
     * 更新员工
     */
    @PutMapping("/{id}")
    public ApiResponse<EmployeeDTO> update(@PathVariable Long id, @RequestBody EmployeeDTO.UpdateRequest request) {
        EmployeeDTO updatedEmployee = employeeService.update(id, request);
        return ApiResponse.success("更新成功", updatedEmployee);
    }

    /**
     * 删除员工
     */
    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        employeeService.delete(id);
        return ApiResponse.success("删除成功", null);
    }

    /**
     * 批量删除员工
     */
    @DeleteMapping("/batch")
    public ApiResponse<Void> batchDelete(@RequestBody Map<String, List<Long>> request) {
        List<Long> ids = request.get("ids");
        employeeService.batchDelete(ids);
        return ApiResponse.success("批量删除成功", null);
    }

    /**
     * 修改密码
     */
    @PostMapping("/{id}/change-password")
    public ApiResponse<Void> changePassword(@PathVariable Long id, @RequestBody Map<String, String> request) {
        String oldPassword = request.get("oldPassword");
        String newPassword = request.get("newPassword");
        employeeService.changePassword(id, oldPassword, newPassword);
        return ApiResponse.success("密码修改成功", null);
    }

    /**
     * 重置密码
     */
    @PostMapping("/{id}/reset-password")
    public ApiResponse<String> resetPassword(@PathVariable Long id) {
        String newPassword = employeeService.resetPassword(id);
        return ApiResponse.success("密码重置成功", newPassword);
    }

    /**
     * 上传头像
     */
    @PostMapping("/{id}/avatar")
    public ApiResponse<EmployeeDTO> uploadAvatar(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file) {
        // 存储头像文件
        String filename = fileStorageService.storeAvatar(file, id);
        String avatarUrl = fileStorageService.getFileUrl(filename, "avatar");
        
        // 更新员工头像URL
        EmployeeDTO updatedEmployee = employeeService.updateAvatar(id, avatarUrl);
        return ApiResponse.success("头像上传成功", updatedEmployee);
    }
}
