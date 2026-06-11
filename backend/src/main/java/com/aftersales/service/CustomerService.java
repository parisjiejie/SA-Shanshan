package com.aftersales.service;

import com.aftersales.dto.CustomerDTO;
import com.aftersales.dto.PageResult;
import com.aftersales.entity.Customer;
import com.aftersales.mapper.CustomerMapper;
import com.aftersales.repository.CustomerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * 客户服务层
 */
@Service
@RequiredArgsConstructor
public class CustomerService {

    private final CustomerRepository customerRepository;
    private final CustomerMapper customerMapper;

    /**
     * 获取客户列表（分页）
     */
    public PageResult<CustomerDTO> getList(Integer page, Integer pageSize, String keyword,
                                           Customer.CustomerLevel level, Customer.CustomerStatus status) {
        Pageable pageable = PageRequest.of(page - 1, pageSize, Sort.by("createdAt").descending());
        Page<Customer> customerPage = customerRepository.searchCustomers(keyword, level, status, pageable);
        
        // 转换为DTO
        List<CustomerDTO> dtoList = customerPage.getContent().stream()
                .map(customerMapper::toDTO)
                .collect(Collectors.toList());
        
        return PageResult.of(dtoList, customerPage.getTotalElements(), page, pageSize);
    }

    /**
     * 获取客户详情
     */
    public CustomerDTO getById(Long id) {
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("客户不存在"));
        return customerMapper.toDTO(customer);
    }

    /**
     * 创建客户
     */
    @Transactional
    public CustomerDTO create(CustomerDTO.CreateRequest request) {
        // 检查手机号是否已存在
        if (request.getPhone() != null && customerRepository.existsByPhone(request.getPhone())) {
            throw new RuntimeException("手机号已存在");
        }
        // 检查统一社会信用代码是否已存在
        if (request.getCreditCode() != null && customerRepository.existsByCreditCode(request.getCreditCode())) {
            throw new RuntimeException("统一社会信用代码已存在");
        }
        
        Customer customer = customerMapper.toEntity(request);
        Customer savedCustomer = customerRepository.save(customer);
        return customerMapper.toDTO(savedCustomer);
    }

    /**
     * 更新客户
     */
    @Transactional
    public CustomerDTO update(Long id, CustomerDTO.UpdateRequest request) {
        Customer existingCustomer = customerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("客户不存在"));
        
        // 检查手机号是否被其他客户使用
        if (request.getPhone() != null && !request.getPhone().equals(existingCustomer.getPhone())) {
            if (customerRepository.existsByPhone(request.getPhone())) {
                throw new RuntimeException("手机号已存在");
            }
        }
        
        // 使用MapStruct更新实体
        customerMapper.updateEntityFromRequest(request, existingCustomer);
        Customer updatedCustomer = customerRepository.save(existingCustomer);
        return customerMapper.toDTO(updatedCustomer);
    }

    /**
     * 删除客户
     */
    @Transactional
    public void delete(Long id) {
        if (!customerRepository.existsById(id)) {
            throw new RuntimeException("客户不存在");
        }
        customerRepository.deleteById(id);
    }

    /**
     * 批量删除客户
     */
    @Transactional
    public void batchDelete(List<Long> ids) {
        customerRepository.deleteAllById(ids);
    }

    /**
     * 根据手机号查找客户
     */
    public CustomerDTO findByPhone(String phone) {
        Customer customer = customerRepository.findByPhone(phone)
                .orElseThrow(() -> new RuntimeException("客户不存在"));
        return customerMapper.toDTO(customer);
    }

    /**
     * 获取所有客户（简要信息）
     */
    public List<CustomerDTO.SimpleDTO> getAllSimple() {
        return customerRepository.findAll().stream()
                .map(customerMapper::toSimpleDTO)
                .collect(Collectors.toList());
    }

    /**
     * 获取客户统计
     */
    public CustomerStatistics getStatistics() {
        long total = customerRepository.count();
        long active = customerRepository.count((root, query, cb) -> 
            cb.equal(root.get("status"), Customer.CustomerStatus.ACTIVE));
        long inactive = total - active;
        
        CustomerStatistics stats = new CustomerStatistics();
        stats.setTotal(total);
        stats.setActive(active);
        stats.setInactive(inactive);
        return stats;
    }

    /**
     * 客户统计DTO
     */
    public static class CustomerStatistics {
        private long total;
        private long active;
        private long inactive;
        private long newThisMonth;

        // Getters and Setters
        public long getTotal() { return total; }
        public void setTotal(long total) { this.total = total; }
        public long getActive() { return active; }
        public void setActive(long active) { this.active = active; }
        public long getInactive() { return inactive; }
        public void setInactive(long inactive) { this.inactive = inactive; }
        public long getNewThisMonth() { return newThisMonth; }
        public void setNewThisMonth(long newThisMonth) { this.newThisMonth = newThisMonth; }
    }
}
