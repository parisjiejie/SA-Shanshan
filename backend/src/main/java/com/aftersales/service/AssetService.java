package com.aftersales.service;

import com.aftersales.dto.AssetDTO;
import com.aftersales.dto.PageResult;
import com.aftersales.entity.Asset;
import com.aftersales.mapper.AssetMapper;
import com.aftersales.repository.AssetRepository;
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
 * 设备服务层
 */
@Service
@RequiredArgsConstructor
public class AssetService {

    private final AssetRepository assetRepository;
    private final AssetMapper assetMapper;
    private final CustomerRepository customerRepository;

    /**
     * 获取设备列表（分页）
     */
    public PageResult<AssetDTO> getList(Integer page, Integer pageSize, String keyword,
                                        Long customerId, Asset.AssetStatus status) {
        Pageable pageable = PageRequest.of(page - 1, pageSize, Sort.by("createdAt").descending());
        Page<Asset> assetPage = assetRepository.searchAssets(keyword, customerId, status, pageable);

        // 转换为DTO并填充客户名称
        List<AssetDTO> dtoList = assetPage.getContent().stream()
                .map(asset -> {
                    AssetDTO dto = assetMapper.toDTO(asset);
                    customerRepository.findById(asset.getCustomerId())
                            .ifPresent(customer -> dto.setCustomerName(customer.getName()));
                    return dto;
                })
                .collect(Collectors.toList());

        return PageResult.of(dtoList, assetPage.getTotalElements(), page, pageSize);
    }

    /**
     * 获取设备详情
     */
    public AssetDTO getById(Long id) {
        Asset asset = assetRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("设备不存在"));
        AssetDTO dto = assetMapper.toDTO(asset);
        customerRepository.findById(asset.getCustomerId())
                .ifPresent(customer -> dto.setCustomerName(customer.getName()));
        return dto;
    }

    /**
     * 根据序列号获取设备
     */
    public AssetDTO getBySerialNumber(String serialNumber) {
        Asset asset = assetRepository.findBySerialNumber(serialNumber)
                .orElseThrow(() -> new RuntimeException("设备不存在"));
        AssetDTO dto = assetMapper.toDTO(asset);
        customerRepository.findById(asset.getCustomerId())
                .ifPresent(customer -> dto.setCustomerName(customer.getName()));
        return dto;
    }

    /**
     * 创建设备
     */
    @Transactional
    public AssetDTO create(AssetDTO.CreateRequest request) {
        // 检查序列号是否已存在
        if (request.getSerialNumber() != null && assetRepository.existsBySerialNumber(request.getSerialNumber())) {
            throw new RuntimeException("设备序列号已存在");
        }

        // 检查客户是否存在
        if (request.getCustomerId() != null && !customerRepository.existsById(request.getCustomerId())) {
            throw new RuntimeException("客户不存在");
        }

        Asset asset = assetMapper.toEntity(request);
        Asset savedAsset = assetRepository.save(asset);
        return getById(savedAsset.getId());
    }

    /**
     * 更新设备
     */
    @Transactional
    public AssetDTO update(Long id, AssetDTO.UpdateRequest request) {
        Asset existingAsset = assetRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("设备不存在"));

        // 检查序列号是否被其他设备使用
        if (request.getSerialNumber() != null && !request.getSerialNumber().equals(existingAsset.getSerialNumber())) {
            if (assetRepository.existsBySerialNumber(request.getSerialNumber())) {
                throw new RuntimeException("设备序列号已存在");
            }
        }

        // 检查客户是否存在
        if (request.getCustomerId() != null && !customerRepository.existsById(request.getCustomerId())) {
            throw new RuntimeException("客户不存在");
        }

        // 使用MapStruct更新实体
        assetMapper.updateEntityFromRequest(request, existingAsset);
        Asset updatedAsset = assetRepository.save(existingAsset);
        return getById(updatedAsset.getId());
    }

    /**
     * 删除设备
     */
    @Transactional
    public void delete(Long id) {
        if (!assetRepository.existsById(id)) {
            throw new RuntimeException("设备不存在");
        }
        assetRepository.deleteById(id);
    }

    /**
     * 批量删除设备
     */
    @Transactional
    public void batchDelete(List<Long> ids) {
        assetRepository.deleteAllById(ids);
    }

    /**
     * 获取客户的所有设备
     */
    public List<AssetDTO> getByCustomerId(Long customerId) {
        List<Asset> assets = assetRepository.findByCustomerId(customerId);
        return assets.stream()
                .map(asset -> {
                    AssetDTO dto = assetMapper.toDTO(asset);
                    customerRepository.findById(asset.getCustomerId())
                            .ifPresent(customer -> dto.setCustomerName(customer.getName()));
                    return dto;
                })
                .collect(Collectors.toList());
    }

    /**
     * 获取所有设备（简要信息）
     */
    public List<AssetDTO.SimpleDTO> getAllSimple() {
        return assetRepository.findAll().stream()
                .map(assetMapper::toSimpleDTO)
                .collect(Collectors.toList());
    }

    /**
     * 获取设备统计
     */
    public AssetStatistics getStatistics() {
        long total = assetRepository.count();
        long running = assetRepository.count((root, query, cb) ->
                cb.equal(root.get("status"), Asset.AssetStatus.RUNNING));
        long maintaining = assetRepository.count((root, query, cb) ->
                cb.equal(root.get("status"), Asset.AssetStatus.MAINTAINING));
        long stopped = assetRepository.count((root, query, cb) ->
                cb.equal(root.get("status"), Asset.AssetStatus.STOPPED));
        long scrapped = assetRepository.count((root, query, cb) ->
                cb.equal(root.get("status"), Asset.AssetStatus.SCRAPPED));

        AssetStatistics stats = new AssetStatistics();
        stats.setTotal(total);
        stats.setRunning(running);
        stats.setMaintaining(maintaining);
        stats.setStopped(stopped);
        stats.setScrapped(scrapped);
        return stats;
    }

    /**
     * 设备统计DTO
     */
    public static class AssetStatistics {
        private long total;
        private long running;
        private long maintaining;
        private long stopped;
        private long scrapped;

        // Getters and Setters
        public long getTotal() { return total; }
        public void setTotal(long total) { this.total = total; }
        public long getRunning() { return running; }
        public void setRunning(long running) { this.running = running; }
        public long getMaintaining() { return maintaining; }
        public void setMaintaining(long maintaining) { this.maintaining = maintaining; }
        public long getStopped() { return stopped; }
        public void setStopped(long stopped) { this.stopped = stopped; }
        public long getScrapped() { return scrapped; }
        public void setScrapped(long scrapped) { this.scrapped = scrapped; }
    }
}
