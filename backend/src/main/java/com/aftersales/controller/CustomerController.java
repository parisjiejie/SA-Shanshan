package com.aftersales.controller;

import com.aftersales.dto.ApiResponse;
import com.aftersales.dto.CustomerDTO;
import com.aftersales.dto.PageResult;
import com.aftersales.entity.Customer;
import com.aftersales.service.CustomerService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * 客户管理控制器
 */
@RestController
@RequestMapping("/customers")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class CustomerController {

    private final CustomerService customerService;

    /**
     * 获取客户列表
     */
    @GetMapping
    public ApiResponse<PageResult<CustomerDTO>> getList(
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "10") Integer pageSize,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Customer.CustomerLevel level,
            @RequestParam(required = false) Customer.CustomerStatus status) {
        PageResult<CustomerDTO> result = customerService.getList(page, pageSize, keyword, level, status);
        return ApiResponse.success(result);
    }

    /**
     * 获取客户详情
     */
    @GetMapping("/{id}")
    public ApiResponse<CustomerDTO> getById(@PathVariable Long id) {
        CustomerDTO customer = customerService.getById(id);
        return ApiResponse.success(customer);
    }

    /**
     * 创建客户
     */
    @PostMapping
    public ApiResponse<CustomerDTO> create(@RequestBody CustomerDTO.CreateRequest request) {
        CustomerDTO newCustomer = customerService.create(request);
        return ApiResponse.success("创建成功", newCustomer);
    }

    /**
     * 更新客户
     */
    @PutMapping("/{id}")
    public ApiResponse<CustomerDTO> update(@PathVariable Long id, @RequestBody CustomerDTO.UpdateRequest request) {
        CustomerDTO updatedCustomer = customerService.update(id, request);
        return ApiResponse.success("更新成功", updatedCustomer);
    }

    /**
     * 删除客户
     */
    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        customerService.delete(id);
        return ApiResponse.success("删除成功", null);
    }

    /**
     * 批量删除客户
     */
    @DeleteMapping("/batch")
    public ApiResponse<Void> batchDelete(@RequestBody Map<String, List<Long>> request) {
        List<Long> ids = request.get("ids");
        customerService.batchDelete(ids);
        return ApiResponse.success("批量删除成功", null);
    }

    /**
     * 获取客户统计
     */
    @GetMapping("/statistics")
    public ApiResponse<CustomerService.CustomerStatistics> getStatistics() {
        CustomerService.CustomerStatistics stats = customerService.getStatistics();
        return ApiResponse.success(stats);
    }

    /**
     * 获取所有客户（简要信息）
     */
    @GetMapping("/simple")
    public ApiResponse<List<CustomerDTO.SimpleDTO>> getAllSimple() {
        List<CustomerDTO.SimpleDTO> customers = customerService.getAllSimple();
        return ApiResponse.success(customers);
    }
}
