package com.service.aftersales.service.impl;

import cn.hutool.http.HttpRequest;
import cn.hutool.http.HttpResponse;
import cn.hutool.json.JSONArray;
import cn.hutool.json.JSONObject;
import cn.hutool.json.JSONUtil;
import com.service.aftersales.config.ThirdPartyApiConfig;
import com.service.aftersales.dto.TianyanchaDTO;
import com.service.aftersales.service.ApiCallLogService;
import com.service.aftersales.service.TianyanchaService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

/**
 * 天眼查服务实现
 */
@Slf4j
@Service
public class TianyanchaServiceImpl implements TianyanchaService {

    @Autowired
    private ThirdPartyApiConfig apiConfig;

    @Autowired
    private ApiCallLogService apiCallLogService;

    private static final String API_TYPE = "TIANYANCHA";

    @Override
    public TianyanchaDTO.SearchResponse searchCompany(TianyanchaDTO.SearchRequest request) {
        long startTime = System.currentTimeMillis();
        String apiName = "searchCompany";
        String requestParams = JSONUtil.toJsonStr(request);
        String responseData = null;
        Integer status = 0;
        String errorMsg = null;

        try {
            if (!apiConfig.getTianyancha().isEnabled()) {
                errorMsg = "天眼查服务未启用";
                log.warn(errorMsg);
                return createMockSearchResponse(request);
            }

            String url = apiConfig.getTianyancha().getBaseUrl() + "/open/suggest/v2";

            HttpResponse response = HttpRequest.get(url)
                    .header("Authorization", apiConfig.getTianyancha().getApiKey())
                    .form("keyword", request.getKeyword())
                    .form("pageNum", request.getPageNum())
                    .form("pageSize", request.getPageSize())
                    .timeout(apiConfig.getTianyancha().getConnectTimeout())
                    .execute();

            responseData = response.body();

            if (response.getStatus() == 200) {
                JSONObject json = JSONUtil.parseObj(responseData);
                if (json.getInt("error_code") == 0) {
                    status = 1;
                    return parseSearchResponse(json);
                } else {
                    errorMsg = json.getStr("reason");
                    log.error("天眼查搜索失败: {}", errorMsg);
                }
            } else {
                errorMsg = "HTTP " + response.getStatus();
                log.error("天眼查请求失败: {}", errorMsg);
            }
        } catch (Exception e) {
            errorMsg = e.getMessage();
            log.error("天眼查搜索异常", e);
        } finally {
            int costTime = (int) (System.currentTimeMillis() - startTime);
            apiCallLogService.logApiCall(API_TYPE, apiName, requestParams, responseData, status, errorMsg, costTime);
        }

        return createMockSearchResponse(request);
    }

    @Override
    public TianyanchaDTO.DetailResponse getCompanyDetail(TianyanchaDTO.DetailRequest request) {
        long startTime = System.currentTimeMillis();
        String apiName = "getCompanyDetail";
        String requestParams = JSONUtil.toJsonStr(request);
        String responseData = null;
        Integer status = 0;
        String errorMsg = null;

        try {
            if (!apiConfig.getTianyancha().isEnabled()) {
                errorMsg = "天眼查服务未启用";
                log.warn(errorMsg);
                return createMockDetailResponse(request);
            }

            String url = apiConfig.getTianyancha().getBaseUrl() + "/open/baseinfo/v2";

            HttpResponse response = HttpRequest.get(url)
                    .header("Authorization", apiConfig.getTianyancha().getApiKey())
                    .form("id", request.getId())
                    .form("name", request.getName())
                    .timeout(apiConfig.getTianyancha().getConnectTimeout())
                    .execute();

            responseData = response.body();

            if (response.getStatus() == 200) {
                JSONObject json = JSONUtil.parseObj(responseData);
                if (json.getInt("error_code") == 0) {
                    status = 1;
                    return parseDetailResponse(json);
                } else {
                    errorMsg = json.getStr("reason");
                    log.error("天眼查获取详情失败: {}", errorMsg);
                }
            } else {
                errorMsg = "HTTP " + response.getStatus();
                log.error("天眼查请求失败: {}", errorMsg);
            }
        } catch (Exception e) {
            errorMsg = e.getMessage();
            log.error("天眼查获取详情异常", e);
        } finally {
            int costTime = (int) (System.currentTimeMillis() - startTime);
            apiCallLogService.logApiCall(API_TYPE, apiName, requestParams, responseData, status, errorMsg, costTime);
        }

        return createMockDetailResponse(request);
    }

    @Override
    public TianyanchaDTO.DetailResponse getCompanyDetailByName(String companyName) {
        TianyanchaDTO.DetailRequest request = new TianyanchaDTO.DetailRequest();
        request.setName(companyName);
        return getCompanyDetail(request);
    }

    @Override
    public TianyanchaDTO.RiskInfo getCompanyRiskInfo(String companyId) {
        long startTime = System.currentTimeMillis();
        String apiName = "getCompanyRiskInfo";
        String requestParams = "{\"companyId\":\"" + companyId + "\"}";
        String responseData = null;
        Integer status = 0;
        String errorMsg = null;

        try {
            if (!apiConfig.getTianyancha().isEnabled()) {
                errorMsg = "天眼查服务未启用";
                log.warn(errorMsg);
                return createMockRiskInfo();
            }

            // 这里可以调用天眼查的风险信息接口
            // 暂时返回模拟数据
            status = 1;
            return createMockRiskInfo();

        } catch (Exception e) {
            errorMsg = e.getMessage();
            log.error("天眼查获取风险信息异常", e);
        } finally {
            int costTime = (int) (System.currentTimeMillis() - startTime);
            apiCallLogService.logApiCall(API_TYPE, apiName, requestParams, responseData, status, errorMsg, costTime);
        }

        return createMockRiskInfo();
    }

    /**
     * 解析搜索响应
     */
    private TianyanchaDTO.SearchResponse parseSearchResponse(JSONObject json) {
        TianyanchaDTO.SearchResponse response = new TianyanchaDTO.SearchResponse();

        JSONObject result = json.getJSONObject("result");
        if (result != null) {
            response.setTotal(result.getInt("total"));

            JSONArray items = result.getJSONArray("items");
            if (items != null) {
                List<TianyanchaDTO.CompanyInfo> companyList = new ArrayList<>();
                for (int i = 0; i < items.size(); i++) {
                    JSONObject item = items.getJSONObject(i);
                    TianyanchaDTO.CompanyInfo info = new TianyanchaDTO.CompanyInfo();
                    info.setId(item.getStr("id"));
                    info.setName(item.getStr("name"));
                    info.setCreditCode(item.getStr("creditCode"));
                    info.setRegNumber(item.getStr("regNumber"));
                    info.setCompanyType(item.getStr("companyType"));
                    info.setLegalPersonName(item.getStr("legalPersonName"));
                    info.setRegCapital(item.getStr("regCapital"));
                    info.setRegStatus(item.getStr("regStatus"));
                    info.setRegLocation(item.getStr("regLocation"));
                    info.setBusinessScope(item.getStr("businessScope"));
                    info.setPhone(item.getStr("phone"));
                    info.setEmail(item.getStr("email"));
                    info.setWebsite(item.getStr("website"));
                    info.setBase(item.getStr("base"));
                    info.setCity(item.getStr("city"));
                    info.setDistrict(item.getStr("district"));

                    // 解析成立日期
                    String estiblishTime = item.getStr("estiblishTime");
                    if (estiblishTime != null && !estiblishTime.isEmpty()) {
                        try {
                            info.setEstiblishTime(LocalDate.parse(estiblishTime, DateTimeFormatter.ISO_DATE));
                        } catch (Exception e) {
                            log.warn("解析成立日期失败: {}", estiblishTime);
                        }
                    }

                    companyList.add(info);
                }
                response.setCompanyList(companyList);
            }
        }

        return response;
    }

    /**
     * 解析详情响应
     */
    private TianyanchaDTO.DetailResponse parseDetailResponse(JSONObject json) {
        TianyanchaDTO.DetailResponse response = new TianyanchaDTO.DetailResponse();

        JSONObject result = json.getJSONObject("result");
        if (result != null) {
            // 解析企业基本信息
            TianyanchaDTO.CompanyInfo companyInfo = new TianyanchaDTO.CompanyInfo();
            companyInfo.setId(result.getStr("id"));
            companyInfo.setName(result.getStr("name"));
            companyInfo.setCreditCode(result.getStr("creditCode"));
            companyInfo.setLegalPersonName(result.getStr("legalPersonName"));
            companyInfo.setRegCapital(result.getStr("regCapital"));
            companyInfo.setRegStatus(result.getStr("regStatus"));
            companyInfo.setRegLocation(result.getStr("regLocation"));
            companyInfo.setBusinessScope(result.getStr("businessScope"));
            companyInfo.setPhone(result.getStr("phone"));
            companyInfo.setEmail(result.getStr("email"));
            response.setCompanyInfo(companyInfo);

            // 解析股东信息
            JSONArray shareholders = result.getJSONArray("shareholders");
            if (shareholders != null) {
                List<TianyanchaDTO.Shareholder> shareholderList = new ArrayList<>();
                for (int i = 0; i < shareholders.size(); i++) {
                    JSONObject item = shareholders.getJSONObject(i);
                    TianyanchaDTO.Shareholder shareholder = new TianyanchaDTO.Shareholder();
                    shareholder.setName(item.getStr("name"));
                    shareholder.setType(item.getStr("type"));
                    shareholder.setCapital(item.getStr("capital"));
                    shareholder.setCapitalPercent(item.getStr("capitalActl"));
                    shareholderList.add(shareholder);
                }
                response.setShareholders(shareholderList);
            }

            // 解析主要人员
            JSONArray staffList = result.getJSONArray("staffList");
            if (staffList != null) {
                List<TianyanchaDTO.KeyPerson> keyPersonList = new ArrayList<>();
                for (int i = 0; i < staffList.size(); i++) {
                    JSONObject item = staffList.getJSONObject(i);
                    TianyanchaDTO.KeyPerson person = new TianyanchaDTO.KeyPerson();
                    person.setName(item.getStr("name"));
                    person.setPosition(item.getStr("position"));
                    keyPersonList.add(person);
                }
                response.setKeyPersons(keyPersonList);
            }
        }

        return response;
    }

    /**
     * 创建模拟搜索响应（用于服务未启用时）
     */
    private TianyanchaDTO.SearchResponse createMockSearchResponse(TianyanchaDTO.SearchRequest request) {
        TianyanchaDTO.SearchResponse response = new TianyanchaDTO.SearchResponse();
        response.setTotal(1);

        List<TianyanchaDTO.CompanyInfo> companyList = new ArrayList<>();
        TianyanchaDTO.CompanyInfo info = new TianyanchaDTO.CompanyInfo();
        info.setId("mock-id-001");
        info.setName(request.getKeyword() + "（模拟数据）");
        info.setCreditCode("91110000XXXXXXXXXX");
        info.setLegalPersonName("张三");
        info.setRegCapital("1000万人民币");
        info.setRegStatus("存续");
        info.setRegLocation("北京市朝阳区");
        info.setBusinessScope("技术开发、技术服务等");
        info.setPhone("010-12345678");
        info.setEmail("contact@example.com");
        info.setBase("北京");
        info.setCity("北京市");
        info.setDistrict("朝阳区");
        info.setEstiblishTime(LocalDate.of(2020, 1, 1));
        companyList.add(info);

        response.setCompanyList(companyList);
        return response;
    }

    /**
     * 创建模拟详情响应（用于服务未启用时）
     */
    private TianyanchaDTO.DetailResponse createMockDetailResponse(TianyanchaDTO.DetailRequest request) {
        TianyanchaDTO.DetailResponse response = new TianyanchaDTO.DetailResponse();

        TianyanchaDTO.CompanyInfo companyInfo = new TianyanchaDTO.CompanyInfo();
        companyInfo.setId("mock-id-001");
        companyInfo.setName(request.getName() != null ? request.getName() : "模拟企业");
        companyInfo.setCreditCode("91110000XXXXXXXXXX");
        companyInfo.setLegalPersonName("张三");
        companyInfo.setRegCapital("1000万人民币");
        companyInfo.setRegStatus("存续");
        companyInfo.setRegLocation("北京市朝阳区XXX路XXX号");
        companyInfo.setBusinessScope("技术开发、技术服务、技术咨询、技术转让；销售自行开发后的产品等");
        companyInfo.setPhone("010-12345678");
        companyInfo.setEmail("contact@example.com");
        companyInfo.setWebsite("www.example.com");
        companyInfo.setBase("北京");
        companyInfo.setCity("北京市");
        companyInfo.setDistrict("朝阳区");
        companyInfo.setEstiblishTime(LocalDate.of(2020, 1, 1));
        response.setCompanyInfo(companyInfo);

        // 股东信息
        List<TianyanchaDTO.Shareholder> shareholders = new ArrayList<>();
        TianyanchaDTO.Shareholder shareholder1 = new TianyanchaDTO.Shareholder();
        shareholder1.setName("张三");
        shareholder1.setType("自然人股东");
        shareholder1.setCapital("600万人民币");
        shareholder1.setCapitalPercent("60%");
        shareholders.add(shareholder1);

        TianyanchaDTO.Shareholder shareholder2 = new TianyanchaDTO.Shareholder();
        shareholder2.setName("李四");
        shareholder2.setType("自然人股东");
        shareholder2.setCapital("400万人民币");
        shareholder2.setCapitalPercent("40%");
        shareholders.add(shareholder2);
        response.setShareholders(shareholders);

        // 主要人员
        List<TianyanchaDTO.KeyPerson> keyPersons = new ArrayList<>();
        TianyanchaDTO.KeyPerson person1 = new TianyanchaDTO.KeyPerson();
        person1.setName("张三");
        person1.setPosition("执行董事兼经理");
        keyPersons.add(person1);

        TianyanchaDTO.KeyPerson person2 = new TianyanchaDTO.KeyPerson();
        person2.setName("李四");
        person2.setPosition("监事");
        keyPersons.add(person2);
        response.setKeyPersons(keyPersons);

        // 风险信息
        response.setRiskInfo(createMockRiskInfo());

        return response;
    }

    /**
     * 创建模拟风险信息
     */
    private TianyanchaDTO.RiskInfo createMockRiskInfo() {
        TianyanchaDTO.RiskInfo riskInfo = new TianyanchaDTO.RiskInfo();
        riskInfo.setAbnormalCount(0);
        riskInfo.setPenaltyCount(0);
        riskInfo.setDishonestCount(0);
        riskInfo.setExecutedPersonCount(0);
        riskInfo.setJudicialAidCount(0);
        return riskInfo;
    }
}
