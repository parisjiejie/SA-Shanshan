package com.aftersales.service;

import com.aftersales.dto.PageResult;
import com.aftersales.dto.QuotationDTO;
import com.aftersales.dto.QuotationItemDTO;
import com.aftersales.entity.Part;
import com.aftersales.entity.Quotation;
import com.aftersales.mapper.QuotationMapper;
import com.aftersales.repository.CustomerRepository;
import com.aftersales.repository.EmployeeRepository;
import com.aftersales.repository.PartRepository;
import com.aftersales.repository.QuotationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * 报价单服务层
 */
@Service
@RequiredArgsConstructor
public class QuotationService {

    private final QuotationRepository quotationRepository;
    private final QuotationMapper quotationMapper;
    private final CustomerRepository customerRepository;
    private final EmployeeRepository employeeRepository;
    private final PartRepository partRepository;

    /**
     * 获取报价单列表（分页）
     */
    public PageResult<QuotationDTO> getList(Integer page, Integer pageSize, String keyword,
                                            Long customerId, Quotation.QuotationStatus status) {
        Pageable pageable = PageRequest.of(page - 1, pageSize, Sort.by("createdAt").descending());
        Page<Quotation> quotationPage = quotationRepository.searchQuotations(keyword, customerId, status, pageable);

        List<QuotationDTO> dtoList = quotationPage.getContent().stream()
                .map(this::enrichQuotationDTO)
                .collect(Collectors.toList());

        return PageResult.of(dtoList, quotationPage.getTotalElements(), page, pageSize);
    }

    /**
     * 获取报价单详情
     */
    public QuotationDTO getById(Long id) {
        Quotation quotation = quotationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("报价单不存在"));
        return enrichQuotationDTO(quotation);
    }

    /**
     * 根据报价单号获取报价单
     */
    public QuotationDTO getByQuotationNo(String quotationNo) {
        Quotation quotation = quotationRepository.findByQuotationNo(quotationNo)
                .orElseThrow(() -> new RuntimeException("报价单不存在"));
        return enrichQuotationDTO(quotation);
    }

    /**
     * 创建报价单
     */
    @Transactional
    public QuotationDTO create(QuotationDTO.CreateRequest request, Long createdBy) {
        // 检查客户是否存在
        if (request.getCustomerId() != null && !customerRepository.existsById(request.getCustomerId())) {
            throw new RuntimeException("客户不存在");
        }

        Quotation quotation = quotationMapper.toEntity(request);
        quotation.setQuotationNo(generateQuotationNo());
        quotation.setStatus(Quotation.QuotationStatus.DRAFT);
        quotation.setCreatedBy(createdBy);

        // 计算总金额和过期日期
        calculateTotalAmountAndExpireDate(quotation, request.getItems());

        Quotation savedQuotation = quotationRepository.save(quotation);
        return getById(savedQuotation.getId());
    }

    /**
     * 更新报价单
     */
    @Transactional
    public QuotationDTO update(Long id, QuotationDTO.UpdateRequest request) {
        Quotation existingQuotation = quotationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("报价单不存在"));

        // 只有草稿状态可以编辑
        if (existingQuotation.getStatus() != Quotation.QuotationStatus.DRAFT) {
            throw new RuntimeException("只有草稿状态的报价单可以编辑");
        }

        // 检查客户是否存在
        if (request.getCustomerId() != null && !customerRepository.existsById(request.getCustomerId())) {
            throw new RuntimeException("客户不存在");
        }

        // 使用MapStruct更新实体
        quotationMapper.updateEntityFromRequest(request, existingQuotation);

        // 重新计算总金额和过期日期
        calculateTotalAmountAndExpireDate(existingQuotation, request.getItems());

        Quotation updatedQuotation = quotationRepository.save(existingQuotation);
        return getById(updatedQuotation.getId());
    }

    /**
     * 提交审核
     */
    @Transactional
    public QuotationDTO submit(Long id) {
        Quotation quotation = quotationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("报价单不存在"));

        if (quotation.getStatus() != Quotation.QuotationStatus.DRAFT) {
            throw new RuntimeException("只有草稿状态的报价单可以提交审核");
        }

        quotation.setStatus(Quotation.QuotationStatus.PENDING_APPROVAL);

        Quotation updatedQuotation = quotationRepository.save(quotation);
        return getById(updatedQuotation.getId());
    }

    /**
     * 审核报价单
     */
    @Transactional
    public QuotationDTO approve(Long id, Boolean approved, Long approvedBy) {
        Quotation quotation = quotationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("报价单不存在"));

        if (quotation.getStatus() != Quotation.QuotationStatus.PENDING_APPROVAL) {
            throw new RuntimeException("只有待审核状态的报价单可以进行审核");
        }

        if (approved) {
            quotation.setStatus(Quotation.QuotationStatus.APPROVED);
            quotation.setApprovedBy(approvedBy);
            quotation.setApprovedTime(LocalDateTime.now());
        } else {
            quotation.setStatus(Quotation.QuotationStatus.DRAFT);
        }

        Quotation updatedQuotation = quotationRepository.save(quotation);
        return getById(updatedQuotation.getId());
    }

    /**
     * 发送报价单
     */
    @Transactional
    public QuotationDTO send(Long id) {
        Quotation quotation = quotationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("报价单不存在"));

        if (quotation.getStatus() != Quotation.QuotationStatus.APPROVED) {
            throw new RuntimeException("只有已审核状态的报价单可以发送");
        }

        quotation.setStatus(Quotation.QuotationStatus.SENT);

        Quotation updatedQuotation = quotationRepository.save(quotation);
        return getById(updatedQuotation.getId());
    }

    /**
     * 客户确认
     */
    @Transactional
    public QuotationDTO customerConfirm(Long id) {
        Quotation quotation = quotationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("报价单不存在"));

        if (quotation.getStatus() != Quotation.QuotationStatus.SENT) {
            throw new RuntimeException("只有已发送状态的报价单可以确认");
        }

        quotation.setStatus(Quotation.QuotationStatus.CUSTOMER_CONFIRMED);

        Quotation updatedQuotation = quotationRepository.save(quotation);
        return getById(updatedQuotation.getId());
    }

    /**
     * 客户拒绝
     */
    @Transactional
    public QuotationDTO customerReject(Long id) {
        Quotation quotation = quotationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("报价单不存在"));

        if (quotation.getStatus() != Quotation.QuotationStatus.SENT) {
            throw new RuntimeException("只有已发送状态的报价单可以拒绝");
        }

        quotation.setStatus(Quotation.QuotationStatus.CUSTOMER_REJECTED);

        Quotation updatedQuotation = quotationRepository.save(quotation);
        return getById(updatedQuotation.getId());
    }

    /**
     * 删除报价单
     */
    @Transactional
    public void delete(Long id) {
        Quotation quotation = quotationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("报价单不存在"));

        // 只有草稿或已拒绝状态的报价单可以删除
        if (quotation.getStatus() != Quotation.QuotationStatus.DRAFT &&
            quotation.getStatus() != Quotation.QuotationStatus.CUSTOMER_REJECTED) {
            throw new RuntimeException("只有草稿或已拒绝状态的报价单可以删除");
        }

        quotationRepository.deleteById(id);
    }

    /**
     * 批量删除报价单
     */
    @Transactional
    public void batchDelete(List<Long> ids) {
        quotationRepository.deleteAllById(ids);
    }

    /**
     * 获取所有报价单（简要信息）
     */
    public List<QuotationDTO.SimpleDTO> getAllSimple() {
        return quotationRepository.findAll().stream()
                .map(quotationMapper::toSimpleDTO)
                .collect(Collectors.toList());
    }

    /**
     * 获取报价单统计
     */
    public QuotationStatistics getStatistics() {
        long total = quotationRepository.count();
        long draft = quotationRepository.countByStatus(Quotation.QuotationStatus.DRAFT);
        long pendingApproval = quotationRepository.countByStatus(Quotation.QuotationStatus.PENDING_APPROVAL);
        long approved = quotationRepository.countByStatus(Quotation.QuotationStatus.APPROVED);
        long sent = quotationRepository.countByStatus(Quotation.QuotationStatus.SENT);
        long customerConfirmed = quotationRepository.countByStatus(Quotation.QuotationStatus.CUSTOMER_CONFIRMED);
        long customerRejected = quotationRepository.countByStatus(Quotation.QuotationStatus.CUSTOMER_REJECTED);
        long expired = quotationRepository.countByStatus(Quotation.QuotationStatus.EXPIRED);

        QuotationStatistics stats = new QuotationStatistics();
        stats.setTotal(total);
        stats.setDraft(draft);
        stats.setPendingApproval(pendingApproval);
        stats.setApproved(approved);
        stats.setSent(sent);
        stats.setCustomerConfirmed(customerConfirmed);
        stats.setCustomerRejected(customerRejected);
        stats.setExpired(expired);
        return stats;
    }

    /**
     * 填充报价单DTO的关联信息
     */
    private QuotationDTO enrichQuotationDTO(Quotation quotation) {
        QuotationDTO dto = quotationMapper.toDTO(quotation);

        // 填充客户名称
        if (quotation.getCustomerId() != null) {
            customerRepository.findById(quotation.getCustomerId())
                    .ifPresent(customer -> dto.setCustomerName(customer.getName()));
        }

        // 填充创建人名称
        if (quotation.getCreatedBy() != null) {
            employeeRepository.findById(quotation.getCreatedBy())
                    .ifPresent(employee -> dto.setCreatedByName(employee.getName()));
        }

        // 填充审核人名称
        if (quotation.getApprovedBy() != null) {
            employeeRepository.findById(quotation.getApprovedBy())
                    .ifPresent(employee -> dto.setApprovedByName(employee.getName()));
        }

        // TODO: 填充报价单项列表
        dto.setItems(new ArrayList<>());

        return dto;
    }

    /**
     * 计算总金额和过期日期
     */
    private void calculateTotalAmountAndExpireDate(Quotation quotation, List<?> items) {
        // 计算总金额
        BigDecimal totalAmount = BigDecimal.ZERO;
        if (items != null) {
            for (Object obj : items) {
                BigDecimal unitPrice = BigDecimal.ZERO;
                BigDecimal discount = BigDecimal.ONE;
                Integer quantity = 0;
                
                if (obj instanceof QuotationItemDTO.CreateRequest) {
                    QuotationItemDTO.CreateRequest item = (QuotationItemDTO.CreateRequest) obj;
                    unitPrice = item.getUnitPrice() != null ? item.getUnitPrice() : BigDecimal.ZERO;
                    discount = item.getDiscount() != null ? item.getDiscount() : BigDecimal.ONE;
                    quantity = item.getQuantity() != null ? item.getQuantity() : 0;
                } else if (obj instanceof QuotationItemDTO.UpdateRequest) {
                    QuotationItemDTO.UpdateRequest item = (QuotationItemDTO.UpdateRequest) obj;
                    unitPrice = item.getUnitPrice() != null ? item.getUnitPrice() : BigDecimal.ZERO;
                    discount = item.getDiscount() != null ? item.getDiscount() : BigDecimal.ONE;
                    quantity = item.getQuantity() != null ? item.getQuantity() : 0;
                }

                BigDecimal itemAmount = unitPrice.multiply(discount).multiply(new BigDecimal(quantity));
                totalAmount = totalAmount.add(itemAmount);
            }
        }
        quotation.setTotalAmount(totalAmount);

        // 计算过期日期
        Integer validDays = quotation.getValidDays() != null ? quotation.getValidDays() : 30;
        quotation.setExpireDate(LocalDate.now().plusDays(validDays));
    }

    /**
     * 生成报价单号
     */
    private String generateQuotationNo() {
        String dateStr = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String sequence = String.format("%04d", (int) (Math.random() * 10000));
        return "QT" + dateStr + sequence;
    }

    /**
     * 报价单统计DTO
     */
    public static class QuotationStatistics {
        private long total;
        private long draft;
        private long pendingApproval;
        private long approved;
        private long sent;
        private long customerConfirmed;
        private long customerRejected;
        private long expired;

        // Getters and Setters
        public long getTotal() { return total; }
        public void setTotal(long total) { this.total = total; }
        public long getDraft() { return draft; }
        public void setDraft(long draft) { this.draft = draft; }
        public long getPendingApproval() { return pendingApproval; }
        public void setPendingApproval(long pendingApproval) { this.pendingApproval = pendingApproval; }
        public long getApproved() { return approved; }
        public void setApproved(long approved) { this.approved = approved; }
        public long getSent() { return sent; }
        public void setSent(long sent) { this.sent = sent; }
        public long getCustomerConfirmed() { return customerConfirmed; }
        public void setCustomerConfirmed(long customerConfirmed) { this.customerConfirmed = customerConfirmed; }
        public long getCustomerRejected() { return customerRejected; }
        public void setCustomerRejected(long customerRejected) { this.customerRejected = customerRejected; }
        public long getExpired() { return expired; }
        public void setExpired(long expired) { this.expired = expired; }
    }
}