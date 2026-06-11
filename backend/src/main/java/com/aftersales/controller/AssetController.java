package com.aftersales.controller;

import com.aftersales.dto.ApiResponse;
import com.aftersales.dto.AssetDTO;
import com.aftersales.dto.PageResult;
import com.aftersales.entity.Asset;
import com.aftersales.service.AssetService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * 设备管理控制器
 */
@RestController
@RequestMapping("/assets")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AssetController {

    private final AssetService assetService;

    /**
     * 获取设备列表
     */
    @GetMapping
    public ApiResponse<PageResult<AssetDTO>> getList(
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "10") Integer pageSize,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Long customerId,
            @RequestParam(required = false) Asset.AssetStatus status) {
        PageResult<AssetDTO> result = assetService.getList(page, pageSize, keyword, customerId, status);
        return ApiResponse.success(result);
    }

    /**
     * 获取设备详情
     */
    @GetMapping("/{id}")
    public ApiResponse<AssetDTO> getById(@PathVariable Long id) {
        AssetDTO asset = assetService.getById(id);
        return ApiResponse.success(asset);
    }

    /**
     * 根据序列号获取设备
     */
    @GetMapping("/serial/{serialNumber}")
    public ApiResponse<AssetDTO> getBySerialNumber(@PathVariable String serialNumber) {
        AssetDTO asset = assetService.getBySerialNumber(serialNumber);
        return ApiResponse.success(asset);
    }

    /**
     * 创建设备
     */
    @PostMapping
    public ApiResponse<AssetDTO> create(@RequestBody AssetDTO.CreateRequest request) {
        AssetDTO newAsset = assetService.create(request);
        return ApiResponse.success("创建成功", newAsset);
    }

    /**
     * 更新设备
     */
    @PutMapping("/{id}")
    public ApiResponse<AssetDTO> update(@PathVariable Long id, @RequestBody AssetDTO.UpdateRequest request) {
        AssetDTO updatedAsset = assetService.update(id, request);
        return ApiResponse.success("更新成功", updatedAsset);
    }

    /**
     * 删除设备
     */
    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        assetService.delete(id);
        return ApiResponse.success("删除成功", null);
    }

    /**
     * 批量删除设备
     */
    @DeleteMapping("/batch")
    public ApiResponse<Void> batchDelete(@RequestBody Map<String, List<Long>> request) {
        List<Long> ids = request.get("ids");
        assetService.batchDelete(ids);
        return ApiResponse.success("批量删除成功", null);
    }

    /**
     * 获取客户的所有设备
     */
    @GetMapping("/customer/{customerId}")
    public ApiResponse<List<AssetDTO>> getByCustomerId(@PathVariable Long customerId) {
        List<AssetDTO> assets = assetService.getByCustomerId(customerId);
        return ApiResponse.success(assets);
    }

    /**
     * 获取所有设备（简要信息）
     */
    @GetMapping("/simple")
    public ApiResponse<List<AssetDTO.SimpleDTO>> getAllSimple() {
        List<AssetDTO.SimpleDTO> assets = assetService.getAllSimple();
        return ApiResponse.success(assets);
    }

    /**
     * 获取设备统计
     */
    @GetMapping("/statistics")
    public ApiResponse<AssetService.AssetStatistics> getStatistics() {
        AssetService.AssetStatistics stats = assetService.getStatistics();
        return ApiResponse.success(stats);
    }
}
