package com.aftersales.service;

import com.aftersales.dto.ContactDTO;
import com.aftersales.dto.PageResult;
import com.aftersales.entity.Contact;
import com.aftersales.mapper.ContactMapper;
import com.aftersales.repository.ContactRepository;
import com.aftersales.repository.CustomerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * 联系人服务层
 */
@Service
@RequiredArgsConstructor
public class ContactService {

    private final ContactRepository contactRepository;
    private final ContactMapper contactMapper;
    private final CustomerRepository customerRepository;

    /**
     * 获取联系人列表（分页）
     */
    public PageResult<ContactDTO> getList(Integer page, Integer pageSize, String keyword,
                                          Long customerId, Contact.ApprovalStatus approvalStatus) {
        Pageable pageable = PageRequest.of(page - 1, pageSize, Sort.by("createdAt").descending());
        
        // 使用自定义查询方法
        Page<Contact> contactPage;
        if (customerId != null && approvalStatus != null) {
            // 根据客户ID和审核状态查询
            List<Contact> contacts = contactRepository.findByCustomerIdAndApprovalStatus(customerId, approvalStatus);
            // 手动分页
            int start = (int) pageable.getOffset();
            int end = Math.min((start + pageable.getPageSize()), contacts.size());
            List<Contact> pagedContacts = contacts.subList(start, end);
            contactPage = new org.springframework.data.domain.PageImpl<>(pagedContacts, pageable, contacts.size());
        } else if (customerId != null) {
            // 根据客户ID查询
            List<Contact> contacts = contactRepository.findByCustomerId(customerId);
            int start = (int) pageable.getOffset();
            int end = Math.min((start + pageable.getPageSize()), contacts.size());
            List<Contact> pagedContacts = start < contacts.size() ? contacts.subList(start, end) : List.of();
            contactPage = new org.springframework.data.domain.PageImpl<>(pagedContacts, pageable, contacts.size());
        } else {
            // 查询所有
            contactPage = contactRepository.findAll(pageable);
        }

        // 转换为DTO并填充客户名称
        List<ContactDTO> dtoList = contactPage.getContent().stream()
                .map(this::enrichContactDTO)
                .collect(Collectors.toList());

        return PageResult.of(dtoList, contactPage.getTotalElements(), page, pageSize);
    }

    /**
     * 获取联系人详情
     */
    public ContactDTO getById(Long id) {
        Contact contact = contactRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("联系人不存在"));
        return enrichContactDTO(contact);
    }

    /**
     * 创建联系人
     */
    @Transactional
    public ContactDTO create(ContactDTO.CreateRequest request) {
        // 检查客户是否存在
        if (request.getCustomerId() != null && !customerRepository.existsById(request.getCustomerId())) {
            throw new RuntimeException("客户不存在");
        }

        // 检查手机号是否已存在
        if (request.getPhone() != null) {
            List<Contact> existingContacts = contactRepository.findByCustomerId(request.getCustomerId());
            boolean phoneExists = existingContacts.stream()
                    .anyMatch(c -> request.getPhone().equals(c.getPhone()));
            if (phoneExists) {
                throw new RuntimeException("该手机号已存在");
            }
        }

        Contact contact = contactMapper.toEntity(request);
        contact.setApprovalStatus(Contact.ApprovalStatus.PENDING);
        contact.setRegisterTime(LocalDateTime.now());

        Contact savedContact = contactRepository.save(contact);
        return getById(savedContact.getId());
    }

    /**
     * 更新联系人
     */
    @Transactional
    public ContactDTO update(Long id, ContactDTO.UpdateRequest request) {
        Contact existingContact = contactRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("联系人不存在"));

        // 检查客户是否存在
        if (request.getCustomerId() != null && !customerRepository.existsById(request.getCustomerId())) {
            throw new RuntimeException("客户不存在");
        }

        // 检查手机号是否被其他联系人使用
        if (request.getPhone() != null && !request.getPhone().equals(existingContact.getPhone())) {
            List<Contact> existingContacts = contactRepository.findByCustomerId(request.getCustomerId());
            boolean phoneExists = existingContacts.stream()
                    .anyMatch(c -> !c.getId().equals(id) && request.getPhone().equals(c.getPhone()));
            if (phoneExists) {
                throw new RuntimeException("该手机号已存在");
            }
        }

        // 使用MapStruct更新实体
        contactMapper.updateEntityFromRequest(request, existingContact);
        Contact updatedContact = contactRepository.save(existingContact);
        return getById(updatedContact.getId());
    }

    /**
     * 审核联系人
     */
    @Transactional
    public ContactDTO approve(Long id, Boolean approved) {
        Contact contact = contactRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("联系人不存在"));

        if (contact.getApprovalStatus() != Contact.ApprovalStatus.PENDING) {
            throw new RuntimeException("只有待审核状态的联系人可以进行审核");
        }

        if (approved) {
            contact.setApprovalStatus(Contact.ApprovalStatus.APPROVED);
        } else {
            contact.setApprovalStatus(Contact.ApprovalStatus.REJECTED);
        }

        Contact updatedContact = contactRepository.save(contact);
        return getById(updatedContact.getId());
    }

    /**
     * 删除联系人
     */
    @Transactional
    public void delete(Long id) {
        if (!contactRepository.existsById(id)) {
            throw new RuntimeException("联系人不存在");
        }
        contactRepository.deleteById(id);
    }

    /**
     * 批量删除联系人
     */
    @Transactional
    public void batchDelete(List<Long> ids) {
        contactRepository.deleteAllById(ids);
    }

    /**
     * 获取客户的所有联系人
     */
    public List<ContactDTO> getByCustomerId(Long customerId) {
        List<Contact> contacts = contactRepository.findByCustomerId(customerId);
        return contacts.stream()
                .map(this::enrichContactDTO)
                .collect(Collectors.toList());
    }

    /**
     * 获取客户的已审核联系人
     */
    public List<ContactDTO> getApprovedByCustomerId(Long customerId) {
        List<Contact> contacts = contactRepository.findByCustomerIdAndApprovalStatus(customerId, Contact.ApprovalStatus.APPROVED);
        return contacts.stream()
                .map(this::enrichContactDTO)
                .collect(Collectors.toList());
    }

    /**
     * 获取所有联系人（简要信息）
     */
    public List<ContactDTO.SimpleDTO> getAllSimple() {
        return contactRepository.findAll().stream()
                .map(contactMapper::toSimpleDTO)
                .collect(Collectors.toList());
    }

    /**
     * 获取联系人统计
     */
    public ContactStatistics getStatistics() {
        long total = contactRepository.count();
        long pending = contactRepository.findAll().stream()
                .filter(c -> c.getApprovalStatus() == Contact.ApprovalStatus.PENDING)
                .count();
        long approved = contactRepository.findAll().stream()
                .filter(c -> c.getApprovalStatus() == Contact.ApprovalStatus.APPROVED)
                .count();
        long rejected = contactRepository.findAll().stream()
                .filter(c -> c.getApprovalStatus() == Contact.ApprovalStatus.REJECTED)
                .count();

        ContactStatistics stats = new ContactStatistics();
        stats.setTotal(total);
        stats.setPending(pending);
        stats.setApproved(approved);
        stats.setRejected(rejected);
        return stats;
    }

    /**
     * 填充联系人DTO的关联信息
     */
    private ContactDTO enrichContactDTO(Contact contact) {
        ContactDTO dto = contactMapper.toDTO(contact);

        // 填充客户名称
        if (contact.getCustomerId() != null) {
            customerRepository.findById(contact.getCustomerId())
                    .ifPresent(customer -> dto.setCustomerName(customer.getName()));
        }

        return dto;
    }

    /**
     * 联系人统计DTO
     */
    public static class ContactStatistics {
        private long total;
        private long pending;
        private long approved;
        private long rejected;

        // Getters and Setters
        public long getTotal() { return total; }
        public void setTotal(long total) { this.total = total; }
        public long getPending() { return pending; }
        public void setPending(long pending) { this.pending = pending; }
        public long getApproved() { return approved; }
        public void setApproved(long approved) { this.approved = approved; }
        public long getRejected() { return rejected; }
        public void setRejected(long rejected) { this.rejected = rejected; }
    }
}
