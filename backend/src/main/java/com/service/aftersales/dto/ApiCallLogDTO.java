package com.service.aftersales.dto;

import lombok.Data;
import java.time.LocalDateTime;

/**
 * API调用日志DTO
 */
@Data
public class ApiCallLogDTO {

    /** 日志ID */
    private String id;

    /** API类型：TIANYANCHA/AMAP/SMS */
    private String apiType;

    /** 接口名称 */
    private String apiName;

    /** 请求参数 */
    private String requestParams;

    /** 响应数据 */
    private String responseData;

    /** 状态：0-失败 1-成功 */
    private Integer status;

    /** 错误信息 */
    private String errorMsg;

    /** 耗时（毫秒） */
    private Integer costTime;

    /** 创建时间 */
    private LocalDateTime createTime;
}
