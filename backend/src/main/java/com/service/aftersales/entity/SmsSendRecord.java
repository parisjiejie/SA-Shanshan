package com.service.aftersales.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDateTime;

/**
 * 短信发送记录实体
 */
@Data
@EqualsAndHashCode(callSuper = true)
@TableName("sms_send_record")
public class SmsSendRecord extends BaseEntity {

    private static final long serialVersionUID = 1L;

    /** 记录ID */
    @TableId(type = IdType.ASSIGN_ID)
    private String id;

    /** 手机号 */
    private String phone;

    /** 模板编码 */
    private String templateCode;

    /** 模板参数 */
    private String templateParams;

    /** 验证码 */
    private String verifyCode;

    /** 验证码类型：login/register/reset_password/bind_phone */
    private String verifyCodeType;

    /** 状态：0-发送中 1-成功 2-失败 */
    private Integer status;

    /** 响应码 */
    private String responseCode;

    /** 响应消息 */
    private String responseMsg;

    /** 发送时间 */
    private LocalDateTime sendTime;

    /** 过期时间 */
    private LocalDateTime expireTime;

    /** 验证时间 */
    private LocalDateTime verifyTime;

    /** IP地址 */
    private String ipAddress;

    /** 创建时间 */
    private LocalDateTime createTime;
}
