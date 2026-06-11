package com.aftersales.service;

import com.aftersales.dto.PageResult;
import com.aftersales.dto.WorkorderDTO;
import com.aftersales.entity.Employee;
import com.aftersales.entity.Workorder;
import com.aftersales.mapper.WorkorderMapper;
import com.aftersales.repository.AssetRepository;
import com.aftersales.repository.CustomerRepository;
import com.aftersales.repository.EmployeeRepository;
import com.aftersales.repository.WorkorderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class WorkorderService {

    private final WorkorderRepository workorderRepository;
    private final WorkorderMapper workorderMapper;
    private final CustomerRepository customerRepository;
    private final AssetRepository assetRepository;
    private final EmployeeRepository employeeRepository;

    public PageResult<WorkorderDTO> getList(Integer page, Integer pageSize, String keyword,
                                            Long customerId, Long employeeId,
                                            Workorder.WorkorderStatus status, Workorder.WorkorderType type,
                                            String currentUserRole, Long currentUserId,
                                            String currentUserDepartment, Long currentUserCustomerId) {
        Pageable pageable = PageRequest.of(page - 1, pageSize, Sort.by("createdAt").descending());

        Page<Workorder> workorderPage;

        if ("ADMIN".equals(currentUserRole)) {
            workorderPage = workorderRepository.searchWorkorders(
                    keyword, customerId, employeeId,
                    null, null, null,
                    status, type, null,
                    pageable);
        } else if ("CUSTOMER".equals(currentUserRole)) {
            Long targetCustomerId = currentUserCustomerId != null ? currentUserCustomerId : customerId;
            workorderPage = workorderRepository.searchWorkorders(
                    keyword, targetCustomerId, employeeId,
                    null, null, null,
                    status, type, null,
                    pageable);
        } else if ("TECH_LEAD".equals(currentUserRole) || "MANAGER".equals(currentUserRole)) {
            workorderPage = getWorkordersForDepartment(
                    keyword, customerId, status, type, currentUserDepartment, pageable);
        } else if ("ENGINEER".equals(currentUserRole)) {
            workorderPage = getWorkordersForEngineer(
                    keyword, customerId, status, type, currentUserId, pageable);
        } else if ("SALES".equals(currentUserRole)) {
            workorderPage = workorderRepository.searchWorkorders(
                    keyword, customerId, employeeId,
                    currentUserId, null, null,
                    status, type, null,
                    pageable);
        } else {
            workorderPage = workorderRepository.searchWorkorders(
                    keyword, customerId, employeeId,
                    null, null, null,
                    status, type, null,
                    pageable);
        }

        List<WorkorderDTO> dtoList = workorderPage.getContent().stream()
                .map(this::enrichWorkorderDTO)
                .collect(Collectors.toList());

        return PageResult.of(dtoList, workorderPage.getTotalElements(), page, pageSize);
    }

    private Page<Workorder> getWorkordersForDepartment(
            String keyword, Long customerId,
            Workorder.WorkorderStatus status, Workorder.WorkorderType type,
            String department, Pageable pageable) {
        List<Employee> deptEmployees = employeeRepository.findByDepartment(department);
        if (deptEmployees.isEmpty()) {
            return Page.empty();
        }
        List<Long> deptIds = deptEmployees.stream().map(Employee::getId).collect(Collectors.toList());

        Pageable unpaged = Pageable.unpaged();
        Page<Workorder> page1 = workorderRepository.searchWorkorders(
                keyword, customerId, null,
                null, deptIds, null,
                status, type, null,
                unpaged);
        Page<Workorder> page2 = workorderRepository.searchWorkorders(
                keyword, customerId, null,
                null, null, deptIds,
                status, type, null,
                unpaged);

        return mergeAndPaginate(page1, page2, pageable);
    }

    private Page<Workorder> getWorkordersForEngineer(
            String keyword, Long customerId,
            Workorder.WorkorderStatus status, Workorder.WorkorderType type,
            Long userId, Pageable pageable) {
        Pageable unpaged = Pageable.unpaged();
        Page<Workorder> page1 = workorderRepository.searchWorkorders(
                keyword, customerId, userId,
                null, null, null,
                status, type, null,
                unpaged);
        Page<Workorder> page2 = workorderRepository.searchWorkorders(
                keyword, customerId, null,
                userId, null, null,
                status, type, null,
                unpaged);

        return mergeAndPaginate(page1, page2, pageable);
    }

    private Page<Workorder> mergeAndPaginate(Page<Workorder> page1, Page<Workorder> page2, Pageable pageable) {
        Set<Long> seenIds = new LinkedHashSet<>();
        List<Workorder> merged = new ArrayList<>();

        for (Workorder w : page1.getContent()) {
            if (seenIds.add(w.getId())) {
                merged.add(w);
            }
        }
        for (Workorder w : page2.getContent()) {
            if (seenIds.add(w.getId())) {
                merged.add(w);
            }
        }

        merged.sort((a, b) -> {
            if (a.getCreatedAt() == null && b.getCreatedAt() == null) return 0;
            if (a.getCreatedAt() == null) return 1;
            if (b.getCreatedAt() == null) return -1;
            return b.getCreatedAt().compareTo(a.getCreatedAt());
        });

        long total = merged.size();
        int start = (int) pageable.getOffset();
        int end = Math.min(start + pageable.getPageSize(), merged.size());

        List<Workorder> pageContent;
        if (start >= merged.size()) {
            pageContent = List.of();
        } else {
            pageContent = merged.subList(start, end);
        }

        return new org.springframework.data.domain.PageImpl<>(pageContent, pageable, total);
    }

    public WorkorderDTO getById(Long id) {
        Workorder workorder = workorderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("工单不存在"));
        return enrichWorkorderDTO(workorder);
    }

    public WorkorderDTO getByWorkorderNo(String workorderNo) {
        Workorder workorder = workorderRepository.findByWorkorderNo(workorderNo)
                .orElseThrow(() -> new RuntimeException("工单不存在"));
        return enrichWorkorderDTO(workorder);
    }

    @Transactional
    public WorkorderDTO create(WorkorderDTO.CreateRequest request) {
        if (request.getCustomerId() != null && !customerRepository.existsById(request.getCustomerId())) {
            throw new RuntimeException("客户不存在");
        }

        if (request.getAssetId() != null && !assetRepository.existsById(request.getAssetId())) {
            throw new RuntimeException("设备不存在");
        }

        Workorder workorder = workorderMapper.toEntity(request);
        workorder.setWorkorderNo(generateWorkorderNo());
        workorder.setStatus(Workorder.WorkorderStatus.PENDING);
        workorder.setCreateTime(LocalDateTime.now());

        Workorder savedWorkorder = workorderRepository.save(workorder);
        return getById(savedWorkorder.getId());
    }

    @Transactional
    public WorkorderDTO update(Long id, WorkorderDTO.UpdateRequest request) {
        Workorder existingWorkorder = workorderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("工单不存在"));

        if (request.getCustomerId() != null && !customerRepository.existsById(request.getCustomerId())) {
            throw new RuntimeException("客户不存在");
        }

        if (request.getAssetId() != null && !assetRepository.existsById(request.getAssetId())) {
            throw new RuntimeException("设备不存在");
        }

        if (request.getEmployeeId() != null && !employeeRepository.existsById(request.getEmployeeId())) {
            throw new RuntimeException("工程师不存在");
        }

        workorderMapper.updateEntityFromRequest(request, existingWorkorder);
        Workorder updatedWorkorder = workorderRepository.save(existingWorkorder);
        return getById(updatedWorkorder.getId());
    }

    @Transactional
    public WorkorderDTO accept(Long id, Long employeeId) {
        Workorder workorder = workorderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("工单不存在"));

        if (workorder.getStatus() != Workorder.WorkorderStatus.PENDING) {
            throw new RuntimeException("工单状态不允许接单");
        }

        if (!employeeRepository.existsById(employeeId)) {
            throw new RuntimeException("工程师不存在");
        }

        workorder.setEmployeeId(employeeId);
        workorder.setStatus(Workorder.WorkorderStatus.ACCEPTED);
        workorder.setAcceptTime(LocalDateTime.now());

        Workorder updatedWorkorder = workorderRepository.save(workorder);
        return getById(updatedWorkorder.getId());
    }

    @Transactional
    public WorkorderDTO start(Long id) {
        Workorder workorder = workorderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("工单不存在"));

        if (workorder.getStatus() != Workorder.WorkorderStatus.ACCEPTED) {
            throw new RuntimeException("工单状态不允许开始处理");
        }

        workorder.setStatus(Workorder.WorkorderStatus.PROCESSING);
        workorder.setStartTime(LocalDateTime.now());

        Workorder updatedWorkorder = workorderRepository.save(workorder);
        return getById(updatedWorkorder.getId());
    }

    @Transactional
    public WorkorderDTO complete(Long id, WorkorderDTO.CompleteRequest request) {
        Workorder workorder = workorderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("工单不存在"));

        if (workorder.getStatus() != Workorder.WorkorderStatus.PROCESSING) {
            throw new RuntimeException("工单状态不允许完成");
        }

        workorder.setStatus(Workorder.WorkorderStatus.COMPLETED);
        workorder.setCompleteTime(LocalDateTime.now());
        workorder.setSolution(request.getSolution());
        workorder.setCustomerSign(request.getCustomerSign());
        workorder.setEvaluationScore(request.getEvaluationScore());
        workorder.setEvaluationContent(request.getEvaluationContent());

        Workorder updatedWorkorder = workorderRepository.save(workorder);
        return getById(updatedWorkorder.getId());
    }

    @Transactional
    public WorkorderDTO cancel(Long id) {
        Workorder workorder = workorderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("工单不存在"));

        if (workorder.getStatus() == Workorder.WorkorderStatus.COMPLETED ||
            workorder.getStatus() == Workorder.WorkorderStatus.CANCELLED) {
            throw new RuntimeException("工单状态不允许取消");
        }

        workorder.setStatus(Workorder.WorkorderStatus.CANCELLED);

        Workorder updatedWorkorder = workorderRepository.save(workorder);
        return getById(updatedWorkorder.getId());
    }

    @Transactional
    public void delete(Long id) {
        if (!workorderRepository.existsById(id)) {
            throw new RuntimeException("工单不存在");
        }
        workorderRepository.deleteById(id);
    }

    @Transactional
    public void batchDelete(List<Long> ids) {
        workorderRepository.deleteAllById(ids);
    }

    public List<WorkorderDTO> getByCustomerId(Long customerId) {
        List<Workorder> workorders = workorderRepository.findByCustomerId(customerId);
        return workorders.stream()
                .map(this::enrichWorkorderDTO)
                .collect(Collectors.toList());
    }

    public List<WorkorderDTO> getByEmployeeId(Long employeeId) {
        List<Workorder> workorders = workorderRepository.findByEmployeeId(employeeId);
        return workorders.stream()
                .map(this::enrichWorkorderDTO)
                .collect(Collectors.toList());
    }

    public List<WorkorderDTO.SimpleDTO> getAllSimple() {
        return workorderRepository.findAll().stream()
                .map(workorderMapper::toSimpleDTO)
                .collect(Collectors.toList());
    }

    public WorkorderStatistics getStatistics() {
        long total = workorderRepository.count();
        long pending = workorderRepository.countByStatus(Workorder.WorkorderStatus.PENDING);
        long processing = workorderRepository.countByStatus(Workorder.WorkorderStatus.PROCESSING);
        long completed = workorderRepository.countByStatus(Workorder.WorkorderStatus.COMPLETED);
        long cancelled = workorderRepository.countByStatus(Workorder.WorkorderStatus.CANCELLED);

        WorkorderStatistics stats = new WorkorderStatistics();
        stats.setTotal(total);
        stats.setPending(pending);
        stats.setProcessing(processing);
        stats.setCompleted(completed);
        stats.setCancelled(cancelled);
        return stats;
    }

    private WorkorderDTO enrichWorkorderDTO(Workorder workorder) {
        WorkorderDTO dto = workorderMapper.toDTO(workorder);

        if (workorder.getCustomerId() != null) {
            customerRepository.findById(workorder.getCustomerId())
                    .ifPresent(customer -> dto.setCustomerName(customer.getName()));
        }

        if (workorder.getAssetId() != null) {
            assetRepository.findById(workorder.getAssetId())
                    .ifPresent(asset -> dto.setAssetName(asset.getName()));
        }

        if (workorder.getEmployeeId() != null) {
            employeeRepository.findById(workorder.getEmployeeId())
                    .ifPresent(employee -> dto.setEmployeeName(employee.getName()));
        }

        return dto;
    }

    private String generateWorkorderNo() {
        String dateStr = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String sequence = String.format("%04d", (int) (Math.random() * 10000));
        return "WO" + dateStr + sequence;
    }

    public static class WorkorderStatistics {
        private long total;
        private long pending;
        private long processing;
        private long completed;
        private long cancelled;

        public long getTotal() { return total; }
        public void setTotal(long total) { this.total = total; }
        public long getPending() { return pending; }
        public void setPending(long pending) { this.pending = pending; }
        public long getProcessing() { return processing; }
        public void setProcessing(long processing) { this.processing = processing; }
        public long getCompleted() { return completed; }
        public void setCompleted(long completed) { this.completed = completed; }
        public long getCancelled() { return cancelled; }
        public void setCancelled(long cancelled) { this.cancelled = cancelled; }
    }
}
