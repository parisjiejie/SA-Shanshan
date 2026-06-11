package com.aftersales.repository;

import com.aftersales.entity.Asset;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * 设备数据访问层
 */
@Repository
public interface AssetRepository extends JpaRepository<Asset, Long>, JpaSpecificationExecutor<Asset> {

    Optional<Asset> findBySerialNumber(String serialNumber);

    List<Asset> findByCustomerId(Long customerId);

    @Query("SELECT a FROM Asset a WHERE " +
           "(:keyword IS NULL OR a.name LIKE %:keyword% OR a.model LIKE %:keyword% OR a.serialNumber LIKE %:keyword%) AND " +
           "(:customerId IS NULL OR a.customerId = :customerId) AND " +
           "(:status IS NULL OR a.status = :status)")
    Page<Asset> searchAssets(@Param("keyword") String keyword,
                             @Param("customerId") Long customerId,
                             @Param("status") Asset.AssetStatus status,
                             Pageable pageable);

    boolean existsBySerialNumber(String serialNumber);
}
