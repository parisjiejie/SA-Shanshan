package com.aftersales.service;

import com.aftersales.dto.PageResult;
import com.aftersales.dto.PartDTO;
import com.aftersales.entity.Part;
import com.aftersales.mapper.PartMapper;
import com.aftersales.repository.PartRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

/**
 * 配件服务层
 */
@Service
@RequiredArgsConstructor
public class PartService {

    private final PartRepository partRepository;
    private final PartMapper partMapper;

    /**
     * 获取配件列表（分页）
     */
    public PageResult<PartDTO> getList(Integer page, Integer pageSize, String keyword,
                                       String category, Part.PartStatus status) {
        Pageable pageable = PageRequest.of(page - 1, pageSize, Sort.by("createdAt").descending());
        Page<Part> partPage = partRepository.searchParts(keyword, category, status, pageable);

        List<PartDTO> dtoList = partPage.getContent().stream()
                .map(partMapper::toDTO)
                .collect(Collectors.toList());

        return PageResult.of(dtoList, partPage.getTotalElements(), page, pageSize);
    }

    /**
     * 获取配件详情
     */
    public PartDTO getById(Long id) {
        Part part = partRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("配件不存在"));
        return partMapper.toDTO(part);
    }

    /**
     * 根据编码获取配件
     */
    public PartDTO getByCode(String code) {
        Part part = partRepository.findByCode(code)
                .orElseThrow(() -> new RuntimeException("配件不存在"));
        return partMapper.toDTO(part);
    }

    /**
     * 创建配件
     */
    @Transactional
    public PartDTO create(PartDTO.CreateRequest request) {
        // 检查编码是否已存在
        if (request.getCode() != null && partRepository.existsByCode(request.getCode())) {
            throw new RuntimeException("配件编码已存在");
        }

        Part part = partMapper.toEntity(request);
        part.setStatus(calculateStatus(part.getStock(), part.getMinStock()));

        Part savedPart = partRepository.save(part);
        return partMapper.toDTO(savedPart);
    }

    /**
     * 更新配件
     */
    @Transactional
    public PartDTO update(Long id, PartDTO.UpdateRequest request) {
        Part existingPart = partRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("配件不存在"));

        // 检查编码是否被其他配件使用
        if (request.getCode() != null && !request.getCode().equals(existingPart.getCode())) {
            if (partRepository.existsByCode(request.getCode())) {
                throw new RuntimeException("配件编码已存在");
            }
        }

        // 使用MapStruct更新实体
        partMapper.updateEntityFromRequest(request, existingPart);
        existingPart.setStatus(calculateStatus(existingPart.getStock(), existingPart.getMinStock()));

        Part updatedPart = partRepository.save(existingPart);
        return partMapper.toDTO(updatedPart);
    }

    /**
     * 删除配件
     */
    @Transactional
    public void delete(Long id) {
        if (!partRepository.existsById(id)) {
            throw new RuntimeException("配件不存在");
        }
        partRepository.deleteById(id);
    }

    /**
     * 批量删除配件
     */
    @Transactional
    public void batchDelete(List<Long> ids) {
        partRepository.deleteAllById(ids);
    }

    /**
     * 调整库存
     */
    @Transactional
    public PartDTO adjustStock(Long id, Integer quantity, String reason) {
        Part part = partRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("配件不存在"));

        int newStock = part.getStock() + quantity;
        if (newStock < 0) {
            throw new RuntimeException("库存不足，无法调整");
        }

        part.setStock(newStock);
        part.setStatus(calculateStatus(newStock, part.getMinStock()));

        Part updatedPart = partRepository.save(part);
        return partMapper.toDTO(updatedPart);
    }

    /**
     * 获取低库存配件列表
     */
    public PageResult<PartDTO> getLowStockParts(Integer page, Integer pageSize) {
        Pageable pageable = PageRequest.of(page - 1, pageSize, Sort.by("stock").ascending());
        Page<Part> partPage = partRepository.findLowStockParts(pageable);

        List<PartDTO> dtoList = partPage.getContent().stream()
                .map(partMapper::toDTO)
                .collect(Collectors.toList());

        return PageResult.of(dtoList, partPage.getTotalElements(), page, pageSize);
    }

    /**
     * 获取所有配件（简要信息）
     */
    public List<PartDTO.SimpleDTO> getAllSimple() {
        return partRepository.findAll().stream()
                .map(partMapper::toSimpleDTO)
                .collect(Collectors.toList());
    }

    /**
     * 获取配件统计
     */
    public PartStatistics getStatistics() {
        long total = partRepository.count();
        long sufficient = partRepository.count((root, query, cb) ->
                cb.equal(root.get("status"), Part.PartStatus.SUFFICIENT));
        long tight = partRepository.count((root, query, cb) ->
                cb.equal(root.get("status"), Part.PartStatus.TIGHT));
        long outOfStock = partRepository.count((root, query, cb) ->
                cb.equal(root.get("status"), Part.PartStatus.OUT_OF_STOCK));

        // 计算库存总值
        BigDecimal totalValue = partRepository.findAll().stream()
                .map(p -> p.getPrice() != null ? p.getPrice().multiply(new BigDecimal(p.getStock())) : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        PartStatistics stats = new PartStatistics();
        stats.setTotal(total);
        stats.setSufficient(sufficient);
        stats.setTight(tight);
        stats.setOutOfStock(outOfStock);
        stats.setTotalValue(totalValue);
        return stats;
    }

    /**
     * 计算配件状态
     */
    private Part.PartStatus calculateStatus(Integer stock, Integer minStock) {
        if (stock == null || stock <= 0) {
            return Part.PartStatus.OUT_OF_STOCK;
        }
        if (minStock != null && stock <= minStock) {
            return Part.PartStatus.TIGHT;
        }
        return Part.PartStatus.SUFFICIENT;
    }

    /**
     * 配件统计DTO
     */
    public static class PartStatistics {
        private long total;
        private long sufficient;
        private long tight;
        private long outOfStock;
        private BigDecimal totalValue;

        // Getters and Setters
        public long getTotal() { return total; }
        public void setTotal(long total) { this.total = total; }
        public long getSufficient() { return sufficient; }
        public void setSufficient(long sufficient) { this.sufficient = sufficient; }
        public long getTight() { return tight; }
        public void setTight(long tight) { this.tight = tight; }
        public long getOutOfStock() { return outOfStock; }
        public void setOutOfStock(long outOfStock) { this.outOfStock = outOfStock; }
        public BigDecimal getTotalValue() { return totalValue; }
        public void setTotalValue(BigDecimal totalValue) { this.totalValue = totalValue; }
    }
}
