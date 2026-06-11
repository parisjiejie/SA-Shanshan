package com.service.aftersales.service;

import com.service.aftersales.dto.TianyanchaDTO;

/**
 * 天眼查服务接口
 */
public interface TianyanchaService {

    /**
     * 搜索企业
     *
     * @param request 搜索请求
     * @return 搜索结果
     */
    TianyanchaDTO.SearchResponse searchCompany(TianyanchaDTO.SearchRequest request);

    /**
     * 获取企业详情
     *
     * @param request 详情请求
     * @return 企业详情
     */
    TianyanchaDTO.DetailResponse getCompanyDetail(TianyanchaDTO.DetailRequest request);

    /**
     * 根据企业名称获取详情
     *
     * @param companyName 企业名称
     * @return 企业详情
     */
    TianyanchaDTO.DetailResponse getCompanyDetailByName(String companyName);

    /**
     * 获取企业风险信息
     *
     * @param companyId 企业ID
     * @return 风险信息
     */
    TianyanchaDTO.RiskInfo getCompanyRiskInfo(String companyId);
}
