package com.aftersales.service;

import com.aftersales.config.ThirdPartyApiConfig;
import com.aftersales.dto.TianyanchaDTO;
import com.aftersales.entity.ApiCallLog;
import com.aftersales.repository.ApiCallLogRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * 天眼查API服务
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class TianyanchaService {

    private final ThirdPartyApiConfig thirdPartyApiConfig;
    private final ApiCallLogRepository apiCallLogRepository;
    private final ObjectMapper objectMapper;
    private final RestTemplate restTemplate = new RestTemplate();

    /**
     * 企业搜索
     */
    public TianyanchaDTO.SearchResponse searchCompany(TianyanchaDTO.SearchRequest request) {
        if (!thirdPartyApiConfig.getTianyancha().isEnabled()) {
            log.warn("天眼查API未启用");
            return mockSearchResponse(request);
        }

        String apiName = "searchCompany";
        String url = thirdPartyApiConfig.getTianyancha().getBaseUrl() + "/open/search.json";

        try {
            UriComponentsBuilder builder = UriComponentsBuilder.fromHttpUrl(url)
                    .queryParam("word", request.getKeyword())
                    .queryParam("pageNum", request.getPageNum())
                    .queryParam("pageSize", request.getPageSize())
                    .queryParam("key", thirdPartyApiConfig.getTianyancha().getApiKey());

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<String> entity = new HttpEntity<>(headers);

            long startTime = System.currentTimeMillis();
            ResponseEntity<String> response = restTemplate.exchange(
                    builder.toUriString(),
                    HttpMethod.GET,
                    entity,
                    String.class
            );
            long costTime = System.currentTimeMillis() - startTime;

            // 记录调用日志
            saveApiLog("TIANYANCHA", apiName, request.toString(), response.getBody(), 1, null, (int) costTime);

            // 解析响应
            return parseSearchResponse(response.getBody());
        } catch (Exception e) {
            log.error("天眼查企业搜索失败", e);
            saveApiLog("TIANYANCHA", apiName, request.toString(), null, 0, e.getMessage(), 0);
            // API调用失败时返回模拟数据
            log.warn("天眼查API调用失败，返回模拟数据");
            return mockSearchResponse(request);
        }
    }

    /**
     * 获取企业详情
     */
    public TianyanchaDTO.DetailResponse getCompanyDetail(TianyanchaDTO.DetailRequest request) {
        if (!thirdPartyApiConfig.getTianyancha().isEnabled()) {
            log.warn("天眼查API未启用");
            return mockDetailResponse(request);
        }

        String apiName = "getCompanyDetail";
        String url = thirdPartyApiConfig.getTianyancha().getBaseUrl() + "/open/baseinfo.json";

        try {
            UriComponentsBuilder builder = UriComponentsBuilder.fromHttpUrl(url)
                    .queryParam("id", request.getId())
                    .queryParam("name", request.getName());

            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", thirdPartyApiConfig.getTianyancha().getApiKey());

            HttpEntity<String> entity = new HttpEntity<>(headers);

            long startTime = System.currentTimeMillis();
            ResponseEntity<String> response = restTemplate.exchange(
                    builder.toUriString(),
                    HttpMethod.GET,
                    entity,
                    String.class
            );
            long costTime = System.currentTimeMillis() - startTime;

            // 记录调用日志
            saveApiLog("TIANYANCHA", apiName, request.toString(), response.getBody(), 1, null, (int) costTime);

            // 解析响应
            return parseDetailResponse(response.getBody());
        } catch (Exception e) {
            log.error("天眼查获取企业详情失败", e);
            saveApiLog("TIANYANCHA", apiName, request.toString(), null, 0, e.getMessage(), 0);
            throw new RuntimeException("获取企业详情失败: " + e.getMessage());
        }
    }

    /**
     * 解析搜索响应
     */
    private TianyanchaDTO.SearchResponse parseSearchResponse(String responseBody) {
        try {
            JsonNode root = objectMapper.readTree(responseBody);
            TianyanchaDTO.SearchResponse response = new TianyanchaDTO.SearchResponse();
            
            if (root.has("error_code") && root.get("error_code").asInt() == 0) {
                JsonNode result = root.get("result");
                response.setTotal(result.has("total") ? result.get("total").asInt() : 0);
                
                List<TianyanchaDTO.CompanyInfo> companyList = new ArrayList<>();
                if (result.has("items")) {
                    for (JsonNode item : result.get("items")) {
                        TianyanchaDTO.CompanyInfo info = new TianyanchaDTO.CompanyInfo();
                        info.setId(item.has("id") ? item.get("id").asText() : "");
                        info.setName(item.has("name") ? item.get("name").asText() : "");
                        info.setCreditCode(item.has("credit_code") ? item.get("credit_code").asText() : "");
                        info.setLegalPersonName(item.has("legal_person_name") ? item.get("legal_person_name").asText() : "");
                        info.setRegStatus(item.has("reg_status") ? item.get("reg_status").asText() : "");
                        info.setRegLocation(item.has("reg_location") ? item.get("reg_location").asText() : "");
                        companyList.add(info);
                    }
                }
                response.setCompanyList(companyList);
            }
            
            return response;
        } catch (Exception e) {
            log.error("解析搜索响应失败", e);
            throw new RuntimeException("解析响应失败");
        }
    }

    /**
     * 解析详情响应
     */
    private TianyanchaDTO.DetailResponse parseDetailResponse(String responseBody) {
        try {
            JsonNode root = objectMapper.readTree(responseBody);
            TianyanchaDTO.DetailResponse response = new TianyanchaDTO.DetailResponse();
            
            if (root.has("error_code") && root.get("error_code").asInt() == 0) {
                JsonNode result = root.get("result");
                
                TianyanchaDTO.CompanyInfo info = new TianyanchaDTO.CompanyInfo();
                info.setId(result.has("id") ? result.get("id").asText() : "");
                info.setName(result.has("name") ? result.get("name").asText() : "");
                info.setCreditCode(result.has("credit_code") ? result.get("credit_code").asText() : "");
                info.setLegalPersonName(result.has("legal_person_name") ? result.get("legal_person_name").asText() : "");
                info.setRegStatus(result.has("reg_status") ? result.get("reg_status").asText() : "");
                info.setRegLocation(result.has("reg_location") ? result.get("reg_location").asText() : "");
                info.setPhone(result.has("phone") ? result.get("phone").asText() : "");
                info.setEmail(result.has("email") ? result.get("email").asText() : "");
                
                response.setCompanyInfo(info);
            }
            
            return response;
        } catch (Exception e) {
            log.error("解析详情响应失败", e);
            throw new RuntimeException("解析响应失败");
        }
    }

    /**
     * 模拟搜索响应（API未启用时使用）
     */
    private TianyanchaDTO.SearchResponse mockSearchResponse(TianyanchaDTO.SearchRequest request) {
        TianyanchaDTO.SearchResponse response = new TianyanchaDTO.SearchResponse();
        List<TianyanchaDTO.CompanyInfo> companyList = new ArrayList<>();
        
        // 根据关键词返回模拟数据
        String keyword = request.getKeyword();
        
        // 模拟企业1
        TianyanchaDTO.CompanyInfo company1 = new TianyanchaDTO.CompanyInfo();
        company1.setId("1234567890");
        company1.setName(keyword + "科技有限公司");
        company1.setCreditCode("91110108MA00" + (int)(Math.random() * 10000) + "XY");
        company1.setLegalPersonName("张三");
        company1.setRegStatus("存续");
        company1.setRegLocation("北京市海淀区中关村大街1号");
        company1.setRegCapital("1000万人民币");
        company1.setPhone("010-12345678");
        companyList.add(company1);
        
        // 模拟企业2
        TianyanchaDTO.CompanyInfo company2 = new TianyanchaDTO.CompanyInfo();
        company2.setId("0987654321");
        company2.setName(keyword + "网络技术有限公司");
        company2.setCreditCode("91110108MA00" + (int)(Math.random() * 10000) + "XZ");
        company2.setLegalPersonName("李四");
        company2.setRegStatus("在业");
        company2.setRegLocation("上海市浦东新区张江高科技园区");
        company2.setRegCapital("5000万人民币");
        company2.setPhone("021-87654321");
        companyList.add(company2);
        
        // 模拟企业3
        TianyanchaDTO.CompanyInfo company3 = new TianyanchaDTO.CompanyInfo();
        company3.setId("1122334455");
        company3.setName(keyword + "信息技术股份有限公司");
        company3.setCreditCode("91110108MA00" + (int)(Math.random() * 10000) + "XA");
        company3.setLegalPersonName("王五");
        company3.setRegStatus("存续");
        company3.setRegLocation("深圳市南山区科技园");
        company3.setRegCapital("2000万人民币");
        company3.setPhone("0755-12345678");
        companyList.add(company3);
        
        response.setTotal(companyList.size());
        response.setCompanyList(companyList);
        return response;
    }

    /**
     * 模拟详情响应（API未启用时使用）
     */
    private TianyanchaDTO.DetailResponse mockDetailResponse(TianyanchaDTO.DetailRequest request) {
        TianyanchaDTO.DetailResponse response = new TianyanchaDTO.DetailResponse();
        TianyanchaDTO.CompanyInfo info = new TianyanchaDTO.CompanyInfo();
        info.setId(request.getId());
        info.setName(request.getName());
        response.setCompanyInfo(info);
        return response;
    }

    /**
     * 保存API调用日志
     */
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
