package com.aftersales.controller;

import com.aftersales.dto.AmapDTO;
import com.aftersales.dto.ApiResponse;
import com.aftersales.dto.SmsDTO;
import com.aftersales.dto.TianyanchaDTO;
import com.aftersales.service.AmapService;
import com.aftersales.service.SmsService;
import com.aftersales.service.TianyanchaService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

/**
 * 第三方API统一控制器
 */
@RestController
@RequestMapping("/third-party")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ThirdPartyApiController {

    private final TianyanchaService tianyanchaService;
    private final AmapService amapService;
    private final SmsService smsService;

    // ==================== 天眼查API ====================

    /**
     * 企业搜索
     */
    @PostMapping("/tianyancha/search")
    public ApiResponse<TianyanchaDTO.SearchResponse> searchCompany(@RequestBody TianyanchaDTO.SearchRequest request) {
        TianyanchaDTO.SearchResponse response = tianyanchaService.searchCompany(request);
        return ApiResponse.success(response);
    }

    /**
     * 企业详情
     */
    @PostMapping("/tianyancha/detail")
    public ApiResponse<TianyanchaDTO.DetailResponse> getCompanyDetail(@RequestBody TianyanchaDTO.DetailRequest request) {
        TianyanchaDTO.DetailResponse response = tianyanchaService.getCompanyDetail(request);
        return ApiResponse.success(response);
    }

    // ==================== 高德地图API ====================

    /**
     * 地理编码（地址转坐标）
     */
    @PostMapping("/amap/geocode")
    public ApiResponse<AmapDTO.GeocodeResponse> geocode(@RequestBody AmapDTO.GeocodeRequest request) {
        AmapDTO.GeocodeResponse response = amapService.geocode(request);
        return ApiResponse.success(response);
    }

    /**
     * 逆地理编码（坐标转地址）
     */
    @PostMapping("/amap/regeocode")
    public ApiResponse<AmapDTO.RegeocodeResponse> regeocode(@RequestBody AmapDTO.RegeocodeRequest request) {
        AmapDTO.RegeocodeResponse response = amapService.regeocode(request);
        return ApiResponse.success(response);
    }

    /**
     * 路径规划
     */
    @PostMapping("/amap/direction")
    public ApiResponse<AmapDTO.DirectionResponse> direction(@RequestBody AmapDTO.DirectionRequest request) {
        AmapDTO.DirectionResponse response = amapService.direction(request);
        return ApiResponse.success(response);
    }

    /**
     * 地点搜索
     */
    @PostMapping("/amap/place-search")
    public ApiResponse<AmapDTO.PlaceSearchResponse> placeSearch(@RequestBody AmapDTO.PlaceSearchRequest request) {
        AmapDTO.PlaceSearchResponse response = amapService.placeSearch(request);
        return ApiResponse.success(response);
    }

    // ==================== 短信API ====================

    /**
     * 发送验证码
     */
    @PostMapping("/sms/send-verify-code")
    public ApiResponse<SmsDTO.SendResponse> sendVerifyCode(@RequestBody SmsDTO.SendVerifyCodeRequest request) {
        SmsDTO.SendResponse response = smsService.sendVerifyCode(request);
        if (response.getSuccess()) {
            return ApiResponse.success("验证码发送成功", response);
        } else {
            return ApiResponse.error(response.getCode(), response.getMessage());
        }
    }

    /**
     * 验证验证码
     */
    @PostMapping("/sms/verify-code")
    public ApiResponse<SmsDTO.VerifyCodeResponse> verifyCode(@RequestBody SmsDTO.VerifyCodeRequest request) {
        SmsDTO.VerifyCodeResponse response = smsService.verifyCode(request);
        if (response.getSuccess()) {
            return ApiResponse.success("验证成功", response);
        } else {
            return ApiResponse.error(response.getCode(), response.getMessage());
        }
    }
}
