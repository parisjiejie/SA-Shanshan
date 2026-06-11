package com.aftersales.repository;

import com.aftersales.entity.Part;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * 配件数据访问层
 */
@Repository
public interface PartRepository extends JpaRepository<Part, Long>, JpaSpecificationExecutor<Part> {

    Optional<Part> findByCode(String code);

    @Query("SELECT p FROM Part p WHERE " +
           "(:keyword IS NULL OR p.name LIKE %:keyword% OR p.code LIKE %:keyword% OR p.model LIKE %:keyword%) AND " +
           "(:category IS NULL OR p.category = :category) AND " +
           "(:status IS NULL OR p.status = :status)")
    Page<Part> searchParts(@Param("keyword") String keyword,
                           @Param("category") String category,
                           @Param("status") Part.PartStatus status,
                           Pageable pageable);

    @Query("SELECT p FROM Part p WHERE p.stock <= p.minStock")
    Page<Part> findLowStockParts(Pageable pageable);

    boolean existsByCode(String code);
}
