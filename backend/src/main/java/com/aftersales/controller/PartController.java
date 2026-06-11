package com.aftersales.controller;

import com.aftersales.dto.ApiResponse;
import com.aftersales.dto.PageResult;
import com.aftersales.dto.PartDTO;
import com.aftersales.entity.Part;
import com.aftersales.service.PartService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * 配件管理控制器
 */
@RestController
@RequestMapping("/parts")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class PartController {

    private final PartService partService;

    /**
     * 获取配件列表
     */
    @GetMapping
    public ApiResponse<PageResult<PartDTO>> getList(
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "10") Integer pageSize,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) Part.PartStatus status) {
        PageResult<PartDTO> result = partService.getList(page, pageSize, keyword, category, status);
        return ApiResponse.success(result);
    }

    /**
     * 获取配件详情
     */
    @GetMapping("/{id}")
    public ApiResponse<PartDTO> getById(@PathVariable Long id) {
        PartDTO part = partService.getById(id);
        return ApiResponse.success(part);
    }

    /**
     * 根据编码获取配件
     */
    @GetMapping("/code/{code}")
    public ApiResponse<PartDTO> getByCode(@PathVariable String code) {
        PartDTO part = partService.getByCode(code);
        return ApiResponse.success(part);
    }

    /**
     * 创建配件
     */
    @PostMapping
    public ApiResponse<PartDTO> create(@RequestBody PartDTO.CreateRequest request) {
        PartDTO newPart = partService.create(request);
        return ApiResponse.success("创建成功", newPart);
    }

    /**
     * 更新配件
     */
    @PutMapping("/{id}")
    public ApiResponse<PartDTO> update(@PathVariable Long id, @RequestBody PartDTO.UpdateRequest request) {
        PartDTO updatedPart = partService.update(id, request);
        return ApiResponse.success("更新成功", updatedPart);
    }

    /**
     * 删除配件
     */
    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        partService.delete(id);
        return ApiResponse.success("删除成功", null);
    }

    /**
     * 批量删除配件
     */
    @DeleteMapping("/batch")
    public ApiResponse<Void> batchDelete(@RequestBody Map<String, List<Long>> request) {
        List<Long> ids = request.get("ids");
        partService.batchDelete(ids);
        return ApiResponse.success("批量删除成功", null);
    }

    /**
     * 调整库存
     */
    @PostMapping("/{id}/stock/adjust")
    public ApiResponse<PartDTO> adjustStock(@PathVariable Long id, @RequestBody PartDTO.StockAdjustRequest request) {
        PartDTO updatedPart = partService.adjustStock(id, request.getQuantity(), request.getReason());
        return ApiResponse.success("库存调整成功", updatedPart);
    }

    /**
     * 获取低库存配件列表
     */
    @GetMapping("/low-stock")
    public ApiResponse<PageResult<PartDTO>> getLowStockParts(
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "10") Integer pageSize) {
        PageResult<PartDTO> result = partService.getLowStockParts(page, pageSize);
        return ApiResponse.success(result);
    }

    /**
     * 获取所有配件（简要信息）
     */
    @GetMapping("/simple")
    public ApiResponse<List<PartDTO.SimpleDTO>> getAllSimple() {
        List<PartDTO.SimpleDTO> parts = partService.getAllSimple();
        return ApiResponse.success(parts);
    }

    /**
     * 获取配件统计
     */
    @GetMapping("/statistics")
    public ApiResponse<PartService.PartStatistics> getStatistics() {
        PartService.PartStatistics stats = partService.getStatistics();
        return ApiResponse.success(stats);
    }
}
