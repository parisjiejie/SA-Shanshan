package com.aftersales.repository;

import com.aftersales.entity.Customer;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * 客户数据访问层
 */
@Repository
public interface CustomerRepository extends JpaRepository<Customer, Long>, JpaSpecificationExecutor<Customer> {

    /**
     * 根据手机号查找客户
     */
    Optional<Customer> findByPhone(String phone);

    /**
     * 根据统一社会信用代码查找
     */
    Optional<Customer> findByCreditCode(String creditCode);

    /**
     * 分页搜索客户（按名称、公司名、手机号）
     */
    @Query("SELECT c FROM Customer c WHERE " +
           "(:keyword IS NULL OR c.name LIKE %:keyword% OR " +
           "c.phone LIKE %:keyword% OR c.email LIKE %:keyword%) AND " +
           "(:level IS NULL OR c.level = :level) AND " +
           "(:status IS NULL OR c.status = :status)")
    Page<Customer> searchCustomers(@Param("keyword") String keyword,
                                   @Param("level") Customer.CustomerLevel level,
                                   @Param("status") Customer.CustomerStatus status,
                                   Pageable pageable);

    /**
     * 检查手机号是否存在
     */
    boolean existsByPhone(String phone);

    /**
     * 检查统一社会信用代码是否存在
     */
    boolean existsByCreditCode(String creditCode);
}
