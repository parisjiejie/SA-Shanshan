package com.aftersales.repository;

import com.aftersales.entity.Quotation;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * 报价单数据访问层
 */
@Repository
public interface QuotationRepository extends JpaRepository<Quotation, Long> {

    Optional<Quotation> findByQuotationNo(String quotationNo);

    @Query("SELECT q FROM Quotation q WHERE " +
           "(:keyword IS NULL OR q.quotationNo LIKE %:keyword%) AND " +
           "(:customerId IS NULL OR q.customerId = :customerId) AND " +
           "(:status IS NULL OR q.status = :status)")
    Page<Quotation> searchQuotations(@Param("keyword") String keyword,
                                     @Param("customerId") Long customerId,
                                     @Param("status") Quotation.QuotationStatus status,
                                     Pageable pageable);

    boolean existsByQuotationNo(String quotationNo);

    long countByStatus(Quotation.QuotationStatus status);
}
