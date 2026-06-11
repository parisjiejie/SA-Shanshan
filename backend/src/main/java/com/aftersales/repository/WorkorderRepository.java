package com.aftersales.repository;

import com.aftersales.entity.Workorder;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * 工单数据访问层
 */
@Repository
public interface WorkorderRepository extends JpaRepository<Workorder, Long> {

    Optional<Workorder> findByWorkorderNo(String workorderNo);

    List<Workorder> findByCustomerId(Long customerId);

    List<Workorder> findByEmployeeId(Long employeeId);

    @Query("SELECT w FROM Workorder w WHERE " +
           "(:keyword IS NULL OR w.problemDescription LIKE %:keyword% OR w.workorderNo LIKE %:keyword%) AND " +
           "(:customerId IS NULL OR w.customerId = :customerId) AND " +
           "(:employeeId IS NULL OR w.employeeId = :employeeId) AND " +
           "(:createdBy IS NULL OR w.createdBy = :createdBy) AND " +
           "(:creatorIdIn IS NULL OR w.createdBy IN :creatorIdIn) AND " +
           "(:employeeIdIn IS NULL OR w.employeeId IN :employeeIdIn) AND " +
           "(:status IS NULL OR w.status = :status) AND " +
           "(:type IS NULL OR w.type = :type) AND " +
           "(:includeStatuses IS NULL OR w.status IN :includeStatuses)")
    Page<Workorder> searchWorkorders(@Param("keyword") String keyword,
                                     @Param("customerId") Long customerId,
                                     @Param("employeeId") Long employeeId,
                                     @Param("createdBy") Long createdBy,
                                     @Param("creatorIdIn") List<Long> creatorIdIn,
                                     @Param("employeeIdIn") List<Long> employeeIdIn,
                                     @Param("status") Workorder.WorkorderStatus status,
                                     @Param("type") Workorder.WorkorderType type,
                                     @Param("includeStatuses") List<Workorder.WorkorderStatus> includeStatuses,
                                     Pageable pageable);

    long countByStatus(Workorder.WorkorderStatus status);
}
