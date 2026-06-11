package com.service.aftersales.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.service.aftersales.entity.ApiCallLog;
import org.apache.ibatis.annotations.Mapper;

/**
 * API调用日志Mapper
 */
@Mapper
public interface ApiCallLogMapper extends BaseMapper<ApiCallLog> {
}
