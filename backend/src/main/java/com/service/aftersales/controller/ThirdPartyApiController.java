package com.service.aftersales.controller;

import com.service.aftersales.common.Result;
import com.service.aftersales.dto.*;
import com.service.aftersales.service.AmapService;
import com.service.aftersales.service.SmsService;
import com.service.aftersales.service.TianyanchaService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

/**
 * 第三方API控制器
 * 提供天眼查、高德地图、短信服务的REST接口
 */
@Slf4j
@RestController
@RequestMapping("/third-party")
public class ThirdPartyApiController {

    @Autowired
    private TianyanchaService tianyanchaService;

    @Autowired
    private AmapService amapService;

    @Autowired
    private SmsService smsService;

    // ==================== 天眼查接口 ====================

    /**
     * 搜索企业
     */
    @PostMapping("/tianyancha/search")
    public Result<TianyanchaDTO.SearchResponse> searchCompany(@RequestBody TianyanchaDTO.SearchRequest request) {
        log.info("搜索企业: {}", request.getKeyword());
        TianyanchaDTO.SearchResponse response = tianyanchaService.searchCompany(request);
        return Result.success(response);
    }

    /**
     * 获取企业详情
     */
    @PostMapping("/tianyancha/detail")
    public Result<TianyanchaDTO.DetailResponse> getCompanyDetail(@RequestBody TianyanchaDTO.DetailRequest request) {
        log.info("获取企业详情: {}", request.getName());
        TianyanchaDTO.DetailResponse response = tianyanchaService.getCompanyDetail(request);
        return Result.success(response);
    }

    /**
     * 根据名称获取企业详情
     */
    @GetMapping("/tianyancha/detail-by-name")
    public Result<TianyanchaDTO.DetailResponse> getCompanyDetailByName(@RequestParam String companyName) {
        log.info("根据名称获取企业详情: {}", companyName);
        TianyanchaDTO.DetailResponse response = tianyanchaService.getCompanyDetailByName(companyName);
        return Result.success(response);
    }

    /**
     * 获取企业风险信息
     */
    @GetMapping("/tianyancha/risk/{companyId}")
    public Result<TianyanchaDTO.RiskInfo> getCompanyRiskInfo(@PathVariable String companyId) {
        log.info("获取企业风险信息: {}", companyId);
        TianyanchaDTO.RiskInfo riskInfo = tianyanchaService.getCompanyRiskInfo(companyId);
        return Result.success(riskInfo);
    }

    // ==================== 高德地图接口 ====================

    /**
     * 地理编码（地址转坐标）
     */
    @PostMapping("/amap/geocode")
    public Result<AmapDTO.GeocodeResponse> geocode(@RequestBody AmapDTO.GeocodeRequest request) {
        log.info("地理编码: {}", request.getAddress());
        AmapDTO.GeocodeResponse response = amapService.geocode(request);
        return Result.success(response);
    }

    /**
     * 逆地理编码（坐标转地址）
     */
    @PostMapping("/amap/regeocode")
    public Result<AmapDTO.RegeocodeResponse> regeocode(@RequestBody AmapDTO.RegeocodeRequest request) {
        log.info("逆地理编码: {}", request.getLocation());
        AmapDTO.RegeocodeResponse response = amapService.regeocode(request);
        return Result.success(response);
    }

    /**
     * 路径规划
     */
    @PostMapping("/amap/direction")
    public Result<AmapDTO.DirectionResponse> direction(@RequestBody AmapDTO.DirectionRequest request) {
        log.info("路径规划: {} -> {}", request.getOrigin(), request.getDestination());
        AmapDTO.DirectionResponse response = amapService.direction(request);
        return Result.success(response);
    }

    /**
     * 地点搜索
     */
    @PostMapping("/amap/place-search")
    public Result<AmapDTO.PlaceSearchResponse> placeSearch(@RequestBody AmapDTO.PlaceSearchRequest request) {
        log.info("地点搜索: {}", request.getKeywords());
        AmapDTO.PlaceSearchResponse response = amapService.placeSearch(request);
        return Result.success(response);
    }

    /**
     * 根据地址获取坐标（简化接口）
     */
    @GetMapping("/amap/location")
    public Result<AmapDTO.Location> getLocationByAddress(
            @RequestParam String address,
            @RequestParam(required = false) String city) {
        log.info("获取坐标: {}, city={}", address, city);
        AmapDTO.Location location = amapService.getLocationByAddress(address, city);
        return Result.success(location);
    }

    /**
     * 根据坐标获取地址（简化接口）
     */
    @GetMapping("/amap/address")
    public Result<AmapDTO.AddressComponent> getAddressByLocation(
            @RequestParam String longitude,
            @RequestParam String latitude) {
        log.info("获取地址: {}, {}", longitude, latitude);
        AmapDTO.AddressComponent address = amapService.getAddressByLocation(longitude, latitude);
        return Result.success(address);
    }

    /**
     * 计算两点间路线（简化接口）
     */
    @GetMapping("/amap/route")
    public Result<AmapDTO.Path> calculateRoute(
            @RequestParam String origin,
            @RequestParam String destination) {
        log.info("计算路线: {} -> {}", origin, destination);
        AmapDTO.Path path = amapService.calculateRoute(origin, destination);
        return Result.success(path);
    }

    // ==================== 短信接口 ====================

    /**
     * 发送验证码
     */
    @PostMapping("/sms/verify-code")
    public Result<SmsDTO.SendResponse> sendVerifyCode(
            @RequestBody SmsDTO.SendVerifyCodeRequest request,
            HttpServletRequest httpRequest) {
        log.info("发送验证码到: {}", request.getPhone());

        // 设置IP地址
        String ipAddress = getClientIpAddress(httpRequest);

        SmsDTO.SendResponse response = smsService.sendVerifyCode(request);

        if (response.getSuccess()) {
            // 隐藏验证码，只返回部分信息
            response.setMessage("验证码已发送");
        }

        return response.getSuccess() ? Result.success(response) : Result.error(response.getCode(), response.getMessage());
    }

    /**
     * 验证验证码
     */
    @PostMapping("/sms/verify-code/validate")
    public Result<SmsDTO.VerifyCodeResponse> verifyCode(@RequestBody SmsDTO.VerifyCodeRequest request) {
        log.info("验证验证码: {}", request.getPhone());
        SmsDTO.VerifyCodeResponse response = smsService.verifyCode(request);
        return response.getSuccess() ? Result.success(response) : Result.error(response.getCode(), response.getMessage());
    }

    /**
     * 检查是否可以发送验证码
     */
    @GetMapping("/sms/can-send")
    public Result<Boolean> canSend(@RequestParam String phone) {
        boolean canSend = smsService.canSend(phone);
        return Result.success(canSend);
    }

    /**
     * 获取短信发送统计
     */
    @GetMapping("/sms/statistics")
    public Result<SmsDTO.SendStatistics> getSmsStatistics() {
        SmsDTO.SendStatistics statistics = smsService.getStatistics();
        return Result.success(statistics);
    }

    /**
     * 获取客户端IP地址
     */
    private String getClientIpAddress(HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("Proxy-Client-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("WL-Proxy-Client-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("HTTP_CLIENT_IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("HTTP_X_FORWARDED_FOR");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddr();
        }
        // 多个代理情况，取第一个IP
        if (ip != null && ip.contains(",")) {
            ip = ip.split(",")[0].trim();
        }
        return ip;
    }
}
