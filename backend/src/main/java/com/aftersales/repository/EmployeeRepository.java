package com.aftersales.repository;

import com.aftersales.entity.Employee;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * 员工数据访问层
 */
@Repository
public interface EmployeeRepository extends JpaRepository<Employee, Long> {

    /**
     * 根据用户名查找
     */
    Optional<Employee> findByUsername(String username);

    /**
     * 根据手机号查找
     */
    Optional<Employee> findByPhone(String phone);

    /**
     * 分页搜索员工
     */
    @Query("SELECT e FROM Employee e WHERE " +
           "(:keyword IS NULL OR e.name LIKE %:keyword% OR " +
           "e.username LIKE %:keyword% OR e.phone LIKE %:keyword%) AND " +
           "(:department IS NULL OR e.department = :department) AND " +
           "(:role IS NULL OR e.role = :role) AND " +
           "(:status IS NULL OR e.status = :status)")
    Page<Employee> searchEmployees(@Param("keyword") String keyword,
                                   @Param("department") String department,
                                   @Param("role") Employee.EmployeeRole role,
                                   @Param("status") Employee.EmployeeStatus status,
                                   Pageable pageable);

    /**
     * 检查用户名是否存在
     */
    boolean existsByUsername(String username);

    /**
     * 检查手机号是否存在
     */
    boolean existsByPhone(String phone);

    /**
     * 根据部门查找员工
     */
    List<Employee> findByDepartment(String department);
}
