package com.aftersales.service;

import com.aftersales.config.ThirdPartyApiConfig;
import com.aftersales.dto.AmapDTO;
import com.aftersales.entity.ApiCallLog;
import com.aftersales.repository.ApiCallLogRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * 高德地图API服务
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AmapService {

    private final ThirdPartyApiConfig thirdPartyApiConfig;
    private final ApiCallLogRepository apiCallLogRepository;
    private final ObjectMapper objectMapper;
    private final RestTemplate restTemplate = new RestTemplate();

    /**
     * 地理编码（地址转坐标）
     */
    public AmapDTO.GeocodeResponse geocode(AmapDTO.GeocodeRequest request) {
        if (!thirdPartyApiConfig.getAmap().isEnabled()) {
            log.warn("高德地图API未启用");
            return mockGeocodeResponse(request);
        }

        String apiName = "geocode";
        String url = thirdPartyApiConfig.getAmap().getBaseUrl() + "/geocode/geo";

        try {
            UriComponentsBuilder builder = UriComponentsBuilder.fromHttpUrl(url)
                    .queryParam("key", thirdPartyApiConfig.getAmap().getKey())
                    .queryParam("address", request.getAddress())
                    .queryParam("city", request.getCity())
                    .queryParam("output", request.getOutput());

            long startTime = System.currentTimeMillis();
            String responseBody = restTemplate.getForObject(builder.toUriString(), String.class);
            long costTime = System.currentTimeMillis() - startTime;

            // 记录调用日志
            saveApiLog("AMAP", apiName, request.toString(), responseBody, 1, null, (int) costTime);

            // 解析响应
            return parseGeocodeResponse(responseBody);
        } catch (Exception e) {
            log.error("高德地图地理编码失败", e);
            saveApiLog("AMAP", apiName, request.toString(), null, 0, e.getMessage(), 0);
            throw new RuntimeException("地理编码失败: " + e.getMessage());
        }
    }

    /**
     * 逆地理编码（坐标转地址）
     */
    public AmapDTO.RegeocodeResponse regeocode(AmapDTO.RegeocodeRequest request) {
        if (!thirdPartyApiConfig.getAmap().isEnabled()) {
            log.warn("高德地图API未启用");
            return mockRegeocodeResponse(request);
        }

        String apiName = "regeocode";
        String url = thirdPartyApiConfig.getAmap().getBaseUrl() + "/geocode/regeo";

        try {
            UriComponentsBuilder builder = UriComponentsBuilder.fromHttpUrl(url)
                    .queryParam("key", thirdPartyApiConfig.getAmap().getKey())
                    .queryParam("location", request.getLocation())
                    .queryParam("extensions", request.getExtensions())
                    .queryParam("output", request.getOutput());

            long startTime = System.currentTimeMillis();
            String responseBody = restTemplate.getForObject(builder.toUriString(), String.class);
            long costTime = System.currentTimeMillis() - startTime;

            // 记录调用日志
            saveApiLog("AMAP", apiName, request.toString(), responseBody, 1, null, (int) costTime);

            // 解析响应
            return parseRegeocodeResponse(responseBody);
        } catch (Exception e) {
            log.error("高德地图逆地理编码失败", e);
            saveApiLog("AMAP", apiName, request.toString(), null, 0, e.getMessage(), 0);
            throw new RuntimeException("逆地理编码失败: " + e.getMessage());
        }
    }

    /**
     * 路径规划
     */
    public AmapDTO.DirectionResponse direction(AmapDTO.DirectionRequest request) {
        if (!thirdPartyApiConfig.getAmap().isEnabled()) {
            log.warn("高德地图API未启用");
            return mockDirectionResponse(request);
        }

        String apiName = "direction";
        String url = thirdPartyApiConfig.getAmap().getBaseUrl() + "/direction/driving";

        try {
            UriComponentsBuilder builder = UriComponentsBuilder.fromHttpUrl(url)
                    .queryParam("key", thirdPartyApiConfig.getAmap().getKey())
                    .queryParam("origin", request.getOrigin())
                    .queryParam("destination", request.getDestination())
                    .queryParam("strategy", request.getStrategy())
                    .queryParam("output", request.getOutput());

            long startTime = System.currentTimeMillis();
            String responseBody = restTemplate.getForObject(builder.toUriString(), String.class);
            long costTime = System.currentTimeMillis() - startTime;

            // 记录调用日志
            saveApiLog("AMAP", apiName, request.toString(), responseBody, 1, null, (int) costTime);

            // 解析响应
            return parseDirectionResponse(responseBody);
        } catch (Exception e) {
            log.error("高德地图路径规划失败", e);
            saveApiLog("AMAP", apiName, request.toString(), null, 0, e.getMessage(), 0);
            throw new RuntimeException("路径规划失败: " + e.getMessage());
        }
    }

    /**
     * 地点搜索
     */
    public AmapDTO.PlaceSearchResponse placeSearch(AmapDTO.PlaceSearchRequest request) {
        if (!thirdPartyApiConfig.getAmap().isEnabled()) {
            log.warn("高德地图API未启用");
            return mockPlaceSearchResponse(request);
        }

        String apiName = "placeSearch";
        String url = thirdPartyApiConfig.getAmap().getBaseUrl() + "/place/text";

        try {
            UriComponentsBuilder builder = UriComponentsBuilder.fromHttpUrl(url)
                    .queryParam("key", thirdPartyApiConfig.getAmap().getKey())
                    .queryParam("keywords", request.getKeywords())
                    .queryParam("types", request.getTypes())
                    .queryParam("city", request.getCity())
                    .queryParam("offset", request.getOffset())
                    .queryParam("page", request.getPage())
                    .queryParam("output", request.getOutput());

            long startTime = System.currentTimeMillis();
            String responseBody = restTemplate.getForObject(builder.toUriString(), String.class);
            long costTime = System.currentTimeMillis() - startTime;

            // 记录调用日志
            saveApiLog("AMAP", apiName, request.toString(), responseBody, 1, null, (int) costTime);

            // 解析响应
            return parsePlaceSearchResponse(responseBody);
        } catch (Exception e) {
            log.error("高德地图地点搜索失败", e);
            saveApiLog("AMAP", apiName, request.toString(), null, 0, e.getMessage(), 0);
            throw new RuntimeException("地点搜索失败: " + e.getMessage());
        }
    }

    // 解析响应方法...
    private AmapDTO.GeocodeResponse parseGeocodeResponse(String responseBody) {
        try {
            JsonNode root = objectMapper.readTree(responseBody);
            AmapDTO.GeocodeResponse response = new AmapDTO.GeocodeResponse();
            response.setStatus(root.has("status") ? root.get("status").asText() : "0");
            response.setCount(root.has("count") ? root.get("count").asText() : "0");
            response.setInfo(root.has("info") ? root.get("info").asText() : "");

            List<AmapDTO.Geocode> geocodes = new ArrayList<>();
            if (root.has("geocodes")) {
                for (JsonNode node : root.get("geocodes")) {
                    AmapDTO.Geocode geocode = new AmapDTO.Geocode();
                    geocode.setFormattedAddress(node.has("formatted_address") ? node.get("formatted_address").asText() : "");
                    geocode.setCountry(node.has("country") ? node.get("country").asText() : "");
                    geocode.setProvince(node.has("province") ? node.get("province").asText() : "");
                    geocode.setCity(node.has("city") ? node.get("city").asText() : "");
                    geocode.setDistrict(node.has("district") ? node.get("district").asText() : "");
                    geocode.setLocation(node.has("location") ? node.get("location").asText() : "");
                    geocodes.add(geocode);
                }
            }
            response.setGeocodes(geocodes);
            return response;
        } catch (Exception e) {
            log.error("解析地理编码响应失败", e);
            throw new RuntimeException("解析响应失败");
        }
    }

    private AmapDTO.RegeocodeResponse parseRegeocodeResponse(String responseBody) {
        try {
            JsonNode root = objectMapper.readTree(responseBody);
            AmapDTO.RegeocodeResponse response = new AmapDTO.RegeocodeResponse();
            response.setStatus(root.has("status") ? root.get("status").asText() : "0");
            response.setInfo(root.has("info") ? root.get("info").asText() : "");

            if (root.has("regeocode")) {
                JsonNode regeocodeNode = root.get("regeocode");
                AmapDTO.Regeocode regeocode = new AmapDTO.Regeocode();
                regeocode.setFormattedAddress(regeocodeNode.has("formatted_address") ? regeocodeNode.get("formatted_address").asText() : "");
                response.setRegeocode(regeocode);
            }
            return response;
        } catch (Exception e) {
            log.error("解析逆地理编码响应失败", e);
            throw new RuntimeException("解析响应失败");
        }
    }

    private AmapDTO.DirectionResponse parseDirectionResponse(String responseBody) {
        try {
            JsonNode root = objectMapper.readTree(responseBody);
            AmapDTO.DirectionResponse response = new AmapDTO.DirectionResponse();
            response.setStatus(root.has("status") ? root.get("status").asText() : "0");
            response.setInfo(root.has("info") ? root.get("info").asText() : "");
            return response;
        } catch (Exception e) {
            log.error("解析路径规划响应失败", e);
            throw new RuntimeException("解析响应失败");
        }
    }

    private AmapDTO.PlaceSearchResponse parsePlaceSearchResponse(String responseBody) {
        try {
            JsonNode root = objectMapper.readTree(responseBody);
            AmapDTO.PlaceSearchResponse response = new AmapDTO.PlaceSearchResponse();
            response.setStatus(root.has("status") ? root.get("status").asText() : "0");
            response.setCount(root.has("count") ? root.get("count").asText() : "0");
            response.setInfo(root.has("info") ? root.get("info").asText() : "");
            return response;
        } catch (Exception e) {
            log.error("解析地点搜索响应失败", e);
            throw new RuntimeException("解析响应失败");
        }
    }

    // 模拟响应方法...
    private AmapDTO.GeocodeResponse mockGeocodeResponse(AmapDTO.GeocodeRequest request) {
        AmapDTO.GeocodeResponse response = new AmapDTO.GeocodeResponse();
        response.setStatus("1");
        response.setCount("0");
        response.setGeocodes(new ArrayList<>());
        return response;
    }

    private AmapDTO.RegeocodeResponse mockRegeocodeResponse(AmapDTO.RegeocodeRequest request) {
        AmapDTO.RegeocodeResponse response = new AmapDTO.RegeocodeResponse();
        response.setStatus("1");
        return response;
    }

    private AmapDTO.DirectionResponse mockDirectionResponse(AmapDTO.DirectionRequest request) {
        AmapDTO.DirectionResponse response = new AmapDTO.DirectionResponse();
        response.setStatus("1");
        return response;
    }

    private AmapDTO.PlaceSearchResponse mockPlaceSearchResponse(AmapDTO.PlaceSearchRequest request) {
        AmapDTO.PlaceSearchResponse response = new AmapDTO.PlaceSearchResponse();
        response.setStatus("1");
        response.setCount("0");
        return response;
    }

    private void saveApiLog(String apiType, String apiName, String requestParams,
                           String responseData, int status, String errorMsg, int costTime) {
        try {
            ApiCallLog log = new ApiCallLog();
            log.setApiType(apiType);
            log.setApiName(apiName);
            log.setRequestParams(requestParams);
            log.setResponseData(responseData);
            log.setStatus(status);
            log.setErrorMsg(errorMsg);
            log.setCostTime(costTime);
            log.setCreateTime(LocalDateTime.now());
            apiCallLogRepository.save(log);
        } catch (Exception e) {
            log.error("保存API调用日志失败", e);
        }
    }
}
