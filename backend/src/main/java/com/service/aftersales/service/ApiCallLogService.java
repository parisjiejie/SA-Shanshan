package com.service.aftersales.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.service.aftersales.entity.ApiCallLog;

/**
 * API调用日志Service接口
 */
public interface ApiCallLogService extends IService<ApiCallLog> {

    /**
     * 记录API调用日志
     *
     * @param apiType      API类型
     * @param apiName      接口名称
     * @param requestParams 请求参数
     * @param responseData 响应数据
     * @param status       状态：0-失败 1-成功
     * @param errorMsg     错误信息
     * @param costTime     耗时（毫秒）
     * @return 日志ID
     */
    String logApiCall(String apiType, String apiName, String requestParams,
                    String responseData, Integer status, String errorMsg, Integer costTime);
}
