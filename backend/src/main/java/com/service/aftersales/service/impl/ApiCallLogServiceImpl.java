package com.service.aftersales.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.service.aftersales.entity.ApiCallLog;
import com.service.aftersales.mapper.ApiCallLogMapper;
import com.service.aftersales.service.ApiCallLogService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

/**
 * API调用日志Service实现
 */
@Slf4j
@Service
public class ApiCallLogServiceImpl extends ServiceImpl<ApiCallLogMapper, ApiCallLog> implements ApiCallLogService {

    @Override
    public String logApiCall(String apiType, String apiName, String requestParams,
                           String responseData, Integer status, String errorMsg, Integer costTime) {
        try {
            ApiCallLog apiCallLog = new ApiCallLog();
            apiCallLog.setApiType(apiType);
            apiCallLog.setApiName(apiName);
            apiCallLog.setRequestParams(requestParams);
            apiCallLog.setResponseData(responseData);
            apiCallLog.setStatus(status);
            apiCallLog.setErrorMsg(errorMsg);
            apiCallLog.setCostTime(costTime);
            apiCallLog.setCreateTime(LocalDateTime.now());

            save(apiCallLog);
            return apiCallLog.getId();
        } catch (Exception e) {
            log.error("记录API调用日志失败", e);
            return null;
        }
    }
}
