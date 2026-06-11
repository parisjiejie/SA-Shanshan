package com.service.aftersales.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.service.aftersales.entity.SmsSendRecord;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.time.LocalDateTime;

/**
 * 短信发送记录Mapper
 */
@Mapper
public interface SmsSendRecordMapper extends BaseMapper<SmsSendRecord> {

    /**
     * 查询手机号今日发送次数
     */
    @Select("SELECT COUNT(*) FROM sms_send_record WHERE phone = #{phone} AND DATE(create_time) = CURDATE()")
    int countTodayByPhone(@Param("phone") String phone);

    /**
     * 查询手机号最近一次发送记录
     */
    @Select("SELECT * FROM sms_send_record WHERE phone = #{phone} ORDER BY create_time DESC LIMIT 1")
    SmsSendRecord findLatestByPhone(@Param("phone") String phone);

    /**
     * 查询手机号指定类型的验证码记录
     */
    @Select("SELECT * FROM sms_send_record WHERE phone = #{phone} AND verify_code_type = #{type} AND status = 1 ORDER BY create_time DESC LIMIT 1")
    SmsSendRecord findLatestVerifyCode(@Param("phone") String phone, @Param("type") String type);
}
