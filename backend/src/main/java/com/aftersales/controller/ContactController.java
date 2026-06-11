package com.aftersales.controller;

import com.aftersales.dto.ApiResponse;
import com.aftersales.dto.ContactDTO;
import com.aftersales.dto.PageResult;
import com.aftersales.entity.Contact;
import com.aftersales.service.ContactService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * 联系人管理控制器
 */
@RestController
@RequestMapping("/contacts")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ContactController {

    private final ContactService contactService;

    /**
     * 获取联系人列表
     */
    @GetMapping
    public ApiResponse<PageResult<ContactDTO>> getList(
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "10") Integer pageSize,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Long customerId,
            @RequestParam(required = false) Contact.ApprovalStatus approvalStatus) {
        PageResult<ContactDTO> result = contactService.getList(page, pageSize, keyword, customerId, approvalStatus);
        return ApiResponse.success(result);
    }

    /**
     * 获取联系人详情
     */
    @GetMapping("/{id}")
    public ApiResponse<ContactDTO> getById(@PathVariable Long id) {
        ContactDTO contact = contactService.getById(id);
        return ApiResponse.success(contact);
    }

    /**
     * 创建联系人
     */
    @PostMapping
    public ApiResponse<ContactDTO> create(@RequestBody ContactDTO.CreateRequest request) {
        ContactDTO newContact = contactService.create(request);
        return ApiResponse.success("创建成功", newContact);
    }

    /**
     * 更新联系人
     */
    @PutMapping("/{id}")
    public ApiResponse<ContactDTO> update(@PathVariable Long id, @RequestBody ContactDTO.UpdateRequest request) {
        ContactDTO updatedContact = contactService.update(id, request);
        return ApiResponse.success("更新成功", updatedContact);
    }

    /**
     * 审核联系人
     */
    @PostMapping("/{id}/approve")
    public ApiResponse<ContactDTO> approve(@PathVariable Long id, @RequestBody ContactDTO.ApproveRequest request) {
        ContactDTO updatedContact = contactService.approve(id, request.getApproved());
        return ApiResponse.success(request.getApproved() ? "审核通过" : "审核驳回", updatedContact);
    }

    /**
     * 删除联系人
     */
    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        contactService.delete(id);
        return ApiResponse.success("删除成功", null);
    }

    /**
     * 批量删除联系人
     */
    @DeleteMapping("/batch")
    public ApiResponse<Void> batchDelete(@RequestBody Map<String, List<Long>> request) {
        List<Long> ids = request.get("ids");
        contactService.batchDelete(ids);
        return ApiResponse.success("批量删除成功", null);
    }

    /**
     * 获取客户的所有联系人
     */
    @GetMapping("/customer/{customerId}")
    public ApiResponse<List<ContactDTO>> getByCustomerId(@PathVariable Long customerId) {
        List<ContactDTO> contacts = contactService.getByCustomerId(customerId);
        return ApiResponse.success(contacts);
    }

    /**
     * 获取客户的已审核联系人
     */
    @GetMapping("/customer/{customerId}/approved")
    public ApiResponse<List<ContactDTO>> getApprovedByCustomerId(@PathVariable Long customerId) {
        List<ContactDTO> contacts = contactService.getApprovedByCustomerId(customerId);
        return ApiResponse.success(contacts);
    }

    /**
     * 获取所有联系人（简要信息）
     */
    @GetMapping("/simple")
    public ApiResponse<List<ContactDTO.SimpleDTO>> getAllSimple() {
        List<ContactDTO.SimpleDTO> contacts = contactService.getAllSimple();
        return ApiResponse.success(contacts);
    }

    /**
     * 获取联系人统计
     */
    @GetMapping("/statistics")
    public ApiResponse<ContactService.ContactStatistics> getStatistics() {
        ContactService.ContactStatistics stats = contactService.getStatistics();
        return ApiResponse.success(stats);
    }
}
