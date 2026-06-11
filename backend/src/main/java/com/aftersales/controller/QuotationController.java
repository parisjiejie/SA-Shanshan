package com.aftersales.controller;

import com.aftersales.dto.ApiResponse;
import com.aftersales.dto.PageResult;
import com.aftersales.dto.QuotationDTO;
import com.aftersales.entity.Quotation;
import com.aftersales.service.QuotationService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * 报价单管理控制器
 */
@RestController
@RequestMapping("/quotations")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class QuotationController {

    private final QuotationService quotationService;

    /**
     * 获取报价单列表
     */
    @GetMapping
    public ApiResponse<PageResult<QuotationDTO>> getList(
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "10") Integer pageSize,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Long customerId,
            @RequestParam(required = false) Quotation.QuotationStatus status) {
        PageResult<QuotationDTO> result = quotationService.getList(page, pageSize, keyword, customerId, status);
        return ApiResponse.success(result);
    }

    /**
     * 获取报价单详情
     */
    @GetMapping("/{id}")
    public ApiResponse<QuotationDTO> getById(@PathVariable Long id) {
        QuotationDTO quotation = quotationService.getById(id);
        return ApiResponse.success(quotation);
    }

    /**
     * 根据报价单号获取报价单
     */
    @GetMapping("/no/{quotationNo}")
    public ApiResponse<QuotationDTO> getByQuotationNo(@PathVariable String quotationNo) {
        QuotationDTO quotation = quotationService.getByQuotationNo(quotationNo);
        return ApiResponse.success(quotation);
    }

    /**
     * 创建报价单
     */
    @PostMapping
    public ApiResponse<QuotationDTO> create(@RequestBody QuotationDTO.CreateRequest request) {
        // TODO: 从当前登录用户获取创建人ID
        Long createdBy = 1L;
        QuotationDTO newQuotation = quotationService.create(request, createdBy);
        return ApiResponse.success("创建成功", newQuotation);
    }

    /**
     * 更新报价单
     */
    @PutMapping("/{id}")
    public ApiResponse<QuotationDTO> update(@PathVariable Long id, @RequestBody QuotationDTO.UpdateRequest request) {
        QuotationDTO updatedQuotation = quotationService.update(id, request);
        return ApiResponse.success("更新成功", updatedQuotation);
    }

    /**
     * 提交审核
     */
    @PostMapping("/{id}/submit")
    public ApiResponse<QuotationDTO> submit(@PathVariable Long id) {
        QuotationDTO updatedQuotation = quotationService.submit(id);
        return ApiResponse.success("提交审核成功", updatedQuotation);
    }

    /**
     * 审核报价单
     */
    @PostMapping("/{id}/approve")
    public ApiResponse<QuotationDTO> approve(@PathVariable Long id, @RequestBody QuotationDTO.ApproveRequest request) {
        // TODO: 从当前登录用户获取审核人ID
        Long approvedBy = 1L;
        QuotationDTO updatedQuotation = quotationService.approve(id, request.getApproved(), approvedBy);
        return ApiResponse.success(request.getApproved() ? "审核通过" : "审核驳回", updatedQuotation);
    }

    /**
     * 发送报价单
     */
    @PostMapping("/{id}/send")
    public ApiResponse<QuotationDTO> send(@PathVariable Long id) {
        QuotationDTO updatedQuotation = quotationService.send(id);
        return ApiResponse.success("发送成功", updatedQuotation);
    }

    /**
     * 客户确认
     */
    @PostMapping("/{id}/confirm")
    public ApiResponse<QuotationDTO> customerConfirm(@PathVariable Long id) {
        QuotationDTO updatedQuotation = quotationService.customerConfirm(id);
        return ApiResponse.success("客户已确认", updatedQuotation);
    }

    /**
     * 客户拒绝
     */
    @PostMapping("/{id}/reject")
    public ApiResponse<QuotationDTO> customerReject(@PathVariable Long id) {
        QuotationDTO updatedQuotation = quotationService.customerReject(id);
        return ApiResponse.success("客户已拒绝", updatedQuotation);
    }

    /**
     * 删除报价单
     */
    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        quotationService.delete(id);
        return ApiResponse.success("删除成功", null);
    }

    /**
     * 批量删除报价单
     */
    @DeleteMapping("/batch")
    public ApiResponse<Void> batchDelete(@RequestBody Map<String, List<Long>> request) {
        List<Long> ids = request.get("ids");
        quotationService.batchDelete(ids);
        return ApiResponse.success("批量删除成功", null);
    }

    /**
     * 获取所有报价单（简要信息）
     */
    @GetMapping("/simple")
    public ApiResponse<List<QuotationDTO.SimpleDTO>> getAllSimple() {
        List<QuotationDTO.SimpleDTO> quotations = quotationService.getAllSimple();
        return ApiResponse.success(quotations);
    }

    /**
     * 获取报价单统计
     */
    @GetMapping("/statistics")
    public ApiResponse<QuotationService.QuotationStatistics> getStatistics() {
        QuotationService.QuotationStatistics stats = quotationService.getStatistics();
        return ApiResponse.success(stats);
    }
}
