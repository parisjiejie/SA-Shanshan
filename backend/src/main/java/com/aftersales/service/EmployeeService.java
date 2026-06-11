package com.aftersales.service;

import com.aftersales.dto.EmployeeDTO;
import com.aftersales.dto.PageResult;
import com.aftersales.entity.Employee;
import com.aftersales.mapper.EmployeeMapper;
import com.aftersales.repository.EmployeeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * 员工服务层
 */
@Service
@RequiredArgsConstructor
public class EmployeeService {

    private final EmployeeRepository employeeRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmployeeMapper employeeMapper;

    /**
     * 获取员工列表（分页）
     */
    public PageResult<EmployeeDTO> getList(Integer page, Integer pageSize, String keyword,
                                           String department, Employee.EmployeeRole role,
                                           Employee.EmployeeStatus status) {
        Pageable pageable = PageRequest.of(page - 1, pageSize, Sort.by("createdAt").descending());
        Page<Employee> employeePage = employeeRepository.searchEmployees(keyword, department, role, status, pageable);
        
        List<EmployeeDTO> dtoList = employeePage.getContent().stream()
                .map(employeeMapper::toDTO)
                .collect(Collectors.toList());
        
        return PageResult.of(dtoList, employeePage.getTotalElements(), page, pageSize);
    }

    /**
     * 获取员工详情
     */
    public EmployeeDTO getById(Long id) {
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("员工不存在"));
        return employeeMapper.toDTO(employee);
    }

    /**
     * 根据用户名查找员工
     */
    public EmployeeDTO findByUsername(String username) {
        Employee employee = employeeRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("员工不存在"));
        return employeeMapper.toDTO(employee);
    }

    /**
     * 根据用户名查找员工（内部使用，返回实体）
     */
    public Employee findEntityByUsername(String username) {
        return employeeRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("员工不存在"));
    }

    /**
     * 创建员工
     */
    @Transactional
    public EmployeeDTO create(EmployeeDTO.CreateRequest request) {
        // 检查用户名是否已存在
        if (employeeRepository.existsByUsername(request.getUsername())) {
            throw new RuntimeException("用户名已存在");
        }
        // 检查手机号是否已存在
        if (request.getPhone() != null && employeeRepository.existsByPhone(request.getPhone())) {
            throw new RuntimeException("手机号已存在");
        }
        
        Employee employee = employeeMapper.toEntity(request);
        // 加密密码
        employee.setPassword(passwordEncoder.encode(request.getPassword()));
        Employee savedEmployee = employeeRepository.save(employee);
        return employeeMapper.toDTO(savedEmployee);
    }

    /**
     * 更新员工
     */
    @Transactional
    public EmployeeDTO update(Long id, EmployeeDTO.UpdateRequest request) {
        Employee existingEmployee = employeeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("员工不存在"));

        // 检查手机号是否被其他员工使用
        if (request.getPhone() != null && !request.getPhone().equals(existingEmployee.getPhone())) {
            if (employeeRepository.existsByPhone(request.getPhone())) {
                throw new RuntimeException("手机号已存在");
            }
        }

        // 使用MapStruct更新实体
        employeeMapper.updateEntityFromRequest(request, existingEmployee);
        Employee updatedEmployee = employeeRepository.save(existingEmployee);
        return employeeMapper.toDTO(updatedEmployee);
    }

    /**
     * 删除员工
     */
    @Transactional
    public void delete(Long id) {
        if (!employeeRepository.existsById(id)) {
            throw new RuntimeException("员工不存在");
        }
        employeeRepository.deleteById(id);
    }

    /**
     * 批量删除员工
     */
    @Transactional
    public void batchDelete(List<Long> ids) {
        employeeRepository.deleteAllById(ids);
    }

    /**
     * 修改密码
     */
    @Transactional
    public void changePassword(Long id, String oldPassword, String newPassword) {
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("员工不存在"));

        // 验证旧密码
        if (!passwordEncoder.matches(oldPassword, employee.getPassword())) {
            throw new RuntimeException("旧密码错误");
        }

        // 更新密码
        employee.setPassword(passwordEncoder.encode(newPassword));
        employeeRepository.save(employee);
    }

    /**
     * 重置密码
     */
    @Transactional
    public String resetPassword(Long id) {
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("员工不存在"));
        String newPassword = "123456"; // 默认密码
        employee.setPassword(passwordEncoder.encode(newPassword));
        employeeRepository.save(employee);
        return newPassword;
    }

    /**
     * 更新最后登录时间
     */
    @Transactional
    public void updateLastLoginTime(Long id) {
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("员工不存在"));
        employee.setLastLoginTime(java.time.LocalDateTime.now());
        employeeRepository.save(employee);
    }

    /**
     * 更新头像
     */
    @Transactional
    public EmployeeDTO updateAvatar(Long id, String avatarUrl) {
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("员工不存在"));
        employee.setAvatarUrl(avatarUrl);
        Employee updatedEmployee = employeeRepository.save(employee);
        return employeeMapper.toDTO(updatedEmployee);
    }
}
