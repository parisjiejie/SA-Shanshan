package com.aftersales.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * 天眼查相关DTO
 */
public class TianyanchaDTO {

    /**
     * 企业搜索请求
     */
    @Data
    public static class SearchRequest {
        /** 搜索关键词 */
        private String keyword;
        /** 页码 */
        private Integer pageNum = 1;
        /** 每页数量 */
        private Integer pageSize = 20;
    }

    /**
     * 企业搜索响应
     */
    @Data
    public static class SearchResponse {
        /** 总数量 */
        private Integer total;
        /** 企业列表 */
        private List<CompanyInfo> companyList;
    }

    /**
     * 企业基本信息
     */
    @Data
    public static class CompanyInfo {
        /** 企业ID */
        private String id;
        /** 企业名称 */
        private String name;
        /** 统一社会信用代码 */
        private String creditCode;
        /** 注册号 */
        private String regNumber;
        /** 企业类型 */
        private String companyType;
        /** 法定代表人 */
        private String legalPersonName;
        /** 注册资本 */
        private String regCapital;
        /** 成立日期 */
        private LocalDate estiblishTime;
        /** 经营状态 */
        private String regStatus;
        /** 注册地址 */
        private String regLocation;
        /** 经营范围 */
        private String businessScope;
        /** 联系电话 */
        private String phone;
        /** 邮箱 */
        private String email;
        /** 官网 */
        private String website;
        /** 省份 */
        private String base;
        /** 城市 */
        private String city;
        /** 区县 */
        private String district;
    }

    /**
     * 企业详情请求
     */
    @Data
    public static class DetailRequest {
        /** 企业ID */
        private String id;
        /** 企业名称 */
        private String name;
    }

    /**
     * 企业详情响应
     */
    @Data
    public static class DetailResponse {
        /** 企业基本信息 */
        private CompanyInfo companyInfo;
        /** 股东信息 */
        private List<Shareholder> shareholders;
        /** 主要人员 */
        private List<KeyPerson> keyPersons;
        /** 分支机构 */
        private List<Branch> branches;
        /** 变更记录 */
        private List<ChangeRecord> changeRecords;
        /** 风险信息 */
        private RiskInfo riskInfo;
    }

    /**
     * 股东信息
     */
    @Data
    public static class Shareholder {
        /** 股东名称 */
        private String name;
        /** 股东类型 */
        private String type;
        /** 认缴出资额 */
        private String capital;
        /** 出资比例 */
        private String capitalPercent;
    }

    /**
     * 主要人员
     */
    @Data
    public static class KeyPerson {
        /** 姓名 */
        private String name;
        /** 职位 */
        private String position;
    }

    /**
     * 分支机构
     */
    @Data
    public static class Branch {
        /** 机构名称 */
        private String name;
        /** 机构ID */
        private String id;
    }

    /**
     * 变更记录
     */
    @Data
    public static class ChangeRecord {
        /** 变更事项 */
        private String changeItem;
        /** 变更前 */
        private String contentBefore;
        /** 变更后 */
        private String contentAfter;
        /** 变更日期 */
        private LocalDate changeTime;
    }

    /**
     * 风险信息
     */
    @Data
    public static class RiskInfo {
        /** 经营异常数量 */
        private Integer abnormalCount;
        /** 行政处罚数量 */
        private Integer penaltyCount;
        /** 失信信息数量 */
        private Integer dishonestCount;
        /** 被执行人数量 */
        private Integer executedPersonCount;
        /** 司法协助数量 */
        private Integer judicialAidCount;
    }
}
