package com.service.aftersales.service.impl;

import cn.hutool.core.util.RandomUtil;
import cn.hutool.json.JSONUtil;
import com.aliyun.dysmsapi20170525.Client;
import com.aliyun.dysmsapi20170525.models.SendSmsRequest;
import com.aliyun.dysmsapi20170525.models.SendSmsResponse;
import com.aliyun.teaopenapi.models.Config;
import com.service.aftersales.config.ThirdPartyApiConfig;
import com.service.aftersales.dto.SmsDTO;
import com.service.aftersales.entity.SmsSendRecord;
import com.service.aftersales.mapper.SmsSendRecordMapper;
import com.service.aftersales.service.ApiCallLogService;
import com.service.aftersales.service.SmsService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

/**
 * 短信服务实现
 */
@Slf4j
@Service
public class SmsServiceImpl implements SmsService {

    @Autowired
    private ThirdPartyApiConfig apiConfig;

    @Autowired
    private SmsSendRecordMapper smsSendRecordMapper;

    @Autowired
    private ApiCallLogService apiCallLogService;

    private static final String API_TYPE = "SMS";

    @Override
    public SmsDTO.SendResponse sendSms(String phone, String templateCode, String templateParam) {
        long startTime = System.currentTimeMillis();
        String apiName = "sendSms";
        String requestParams = String.format("{\"phone\":\"%s\",\"templateCode\":\"%s\",\"templateParam\":%s}",
                phone, templateCode, templateParam);
        String responseData = null;
        Integer status = 0;
        String errorMsg = null;

        SmsDTO.SendResponse response = new SmsDTO.SendResponse();

        try {
            if (!apiConfig.getSms().isEnabled()) {
                errorMsg = "短信服务未启用";
                log.warn(errorMsg);
                response.setSuccess(false);
                response.setCode("SERVICE_DISABLED");
                response.setMessage(errorMsg);
                return response;
            }

            // 保存发送记录
            SmsSendRecord record = new SmsSendRecord();
            record.setPhone(phone);
            record.setTemplateCode(templateCode);
            record.setTemplateParams(templateParam);
            record.setStatus(0);
            record.setCreateTime(LocalDateTime.now());
            smsSendRecordMapper.insert(record);

            // 根据配置选择服务商
            if ("aliyun".equals(apiConfig.getSms().getProvider())) {
                response = sendAliyunSms(phone, templateCode, templateParam, record);
            } else if ("tencent".equals(apiConfig.getSms().getProvider())) {
                response = sendTencentSms(phone, templateCode, templateParam, record);
            } else {
                errorMsg = "不支持的短信服务商: " + apiConfig.getSms().getProvider();
                log.error(errorMsg);
                response.setSuccess(false);
                response.setCode("UNSUPPORTED_PROVIDER");
                response.setMessage(errorMsg);
            }

            if (response.getSuccess()) {
                status = 1;
                responseData = JSONUtil.toJsonStr(response);
            } else {
                errorMsg = response.getMessage();
            }

        } catch (Exception e) {
            errorMsg = e.getMessage();
            log.error("发送短信异常", e);
            response.setSuccess(false);
            response.setCode("SYSTEM_ERROR");
            response.setMessage("系统错误: " + errorMsg);
        } finally {
            int costTime = (int) (System.currentTimeMillis() - startTime);
            apiCallLogService.logApiCall(API_TYPE, apiName, requestParams, responseData, status, errorMsg, costTime);
        }

        return response;
    }

    @Override
    public SmsDTO.SendResponse sendVerifyCode(SmsDTO.SendVerifyCodeRequest request) {
        SmsDTO.SendResponse response = new SmsDTO.SendResponse();

        try {
            // 检查是否可以发送
            if (!canSend(request.getPhone())) {
                response.setSuccess(false);
                response.setCode("SEND_TOO_FREQUENT");
                response.setMessage("发送过于频繁，请稍后再试");
                return response;
            }

            // 生成验证码
            String verifyCode = RandomUtil.randomNumbers(apiConfig.getSms().getVerifyCodeLength());

            // 构建模板参数
            String templateParam = String.format("{\"code\":\"%s\"}", verifyCode);

            // 获取验证码模板
            String templateCode = apiConfig.getSms().getAliyun().getVerifyCodeTemplateCode();
            if (templateCode == null || templateCode.isEmpty()) {
                // 如果没有配置模板，使用模拟发送
                log.info("模拟发送验证码到 {}: {}", request.getPhone(), verifyCode);

                // 保存记录
                SmsSendRecord record = new SmsSendRecord();
                record.setPhone(request.getPhone());
                record.setTemplateCode("VERIFY_CODE");
                record.setTemplateParams(templateParam);
                record.setVerifyCode(verifyCode);
                record.setVerifyCodeType(request.getType());
                record.setStatus(1);
                record.setSendTime(LocalDateTime.now());
                record.setExpireTime(LocalDateTime.now().plusMinutes(apiConfig.getSms().getVerifyCodeExpireMinutes()));
                record.setCreateTime(LocalDateTime.now());
                smsSendRecordMapper.insert(record);

                response.setSuccess(true);
                response.setCode("OK");
                response.setMessage("验证码已发送（模拟）");
                response.setRecordId(record.getId());
                response.setSendTime(record.getSendTime());

                return response;
            }

            // 发送短信
            response = sendSms(request.getPhone(), templateCode, templateParam);

            if (response.getSuccess()) {
                // 更新记录，保存验证码
                SmsSendRecord record = smsSendRecordMapper.selectById(response.getRecordId());
                if (record != null) {
                    record.setVerifyCode(verifyCode);
                    record.setVerifyCodeType(request.getType());
                    record.setExpireTime(LocalDateTime.now().plusMinutes(apiConfig.getSms().getVerifyCodeExpireMinutes()));
                    smsSendRecordMapper.updateById(record);
                }
            }

        } catch (Exception e) {
            log.error("发送验证码异常", e);
            response.setSuccess(false);
            response.setCode("SYSTEM_ERROR");
            response.setMessage("系统错误: " + e.getMessage());
        }

        return response;
    }

    @Override
    public SmsDTO.VerifyCodeResponse verifyCode(SmsDTO.VerifyCodeRequest request) {
        SmsDTO.VerifyCodeResponse response = new SmsDTO.VerifyCodeResponse();

        try {
            // 查询最新的验证码记录
            SmsSendRecord record = smsSendRecordMapper.findLatestVerifyCode(request.getPhone(), request.getType());

            if (record == null) {
                response.setSuccess(false);
                response.setCode("CODE_NOT_FOUND");
                response.setMessage("验证码不存在或已过期");
                return response;
            }

            // 检查是否已过期
            if (record.getExpireTime() != null && record.getExpireTime().isBefore(LocalDateTime.now())) {
                response.setSuccess(false);
                response.setCode("CODE_EXPIRED");
                response.setMessage("验证码已过期");
                return response;
            }

            // 检查是否已验证过
            if (record.getVerifyTime() != null) {
                response.setSuccess(false);
                response.setCode("CODE_ALREADY_USED");
                response.setMessage("验证码已使用");
                return response;
            }

            // 验证验证码
            if (!record.getVerifyCode().equals(request.getCode())) {
                response.setSuccess(false);
                response.setCode("CODE_INVALID");
                response.setMessage("验证码错误");
                return response;
            }

            // 更新验证时间
            record.setVerifyTime(LocalDateTime.now());
            smsSendRecordMapper.updateById(record);

            response.setSuccess(true);
            response.setCode("OK");
            response.setMessage("验证成功");
            response.setVerifyTime(record.getVerifyTime());

        } catch (Exception e) {
            log.error("验证验证码异常", e);
            response.setSuccess(false);
            response.setCode("SYSTEM_ERROR");
            response.setMessage("系统错误: " + e.getMessage());
        }

        return response;
    }

    @Override
    public SmsDTO.SendStatistics getStatistics() {
        SmsDTO.SendStatistics statistics = new SmsDTO.SendStatistics();
        // 这里可以实现统计逻辑
        statistics.setTotalCount(0L);
        statistics.setSuccessCount(0L);
        statistics.setFailCount(0L);
        statistics.setTodayCount(0L);
        statistics.setTodaySuccessCount(0L);
        return statistics;
    }

    @Override
    public boolean canSend(String phone) {
        // 检查今日发送次数
        int todayCount = smsSendRecordMapper.countTodayByPhone(phone);
        if (todayCount >= apiConfig.getSms().getMaxSendPerDay()) {
            return false;
        }

        // 检查发送间隔
        SmsSendRecord latestRecord = smsSendRecordMapper.findLatestByPhone(phone);
        if (latestRecord != null) {
            long secondsSinceLastSend = ChronoUnit.SECONDS.between(latestRecord.getCreateTime(), LocalDateTime.now());
            if (secondsSinceLastSend < apiConfig.getSms().getSendInterval()) {
                return false;
            }
        }

        return true;
    }

    /**
     * 发送阿里云短信
     */
    private SmsDTO.SendResponse sendAliyunSms(String phone, String templateCode, String templateParam, SmsSendRecord record) {
        SmsDTO.SendResponse response = new SmsDTO.SendResponse();

        try {
            Config config = new Config()
                    .setAccessKeyId(apiConfig.getSms().getAliyun().getAccessKeyId())
                    .setAccessKeySecret(apiConfig.getSms().getAliyun().getAccessKeySecret());
            config.endpoint = "dysmsapi.aliyuncs.com";

            Client client = new Client(config);

            SendSmsRequest sendSmsRequest = new SendSmsRequest()
                    .setPhoneNumbers(phone)
                    .setSignName(apiConfig.getSms().getAliyun().getSignName())
                    .setTemplateCode(templateCode)
                    .setTemplateParam(templateParam);

            SendSmsResponse sendSmsResponse = client.sendSms(sendSmsRequest);

            response.setCode(sendSmsResponse.body.code);
            response.setMessage(sendSmsResponse.body.message);
            response.setSuccess("OK".equals(sendSmsResponse.body.code));

            // 更新记录
            record.setStatus(response.getSuccess() ? 1 : 2);
            record.setResponseCode(sendSmsResponse.body.code);
            record.setResponseMsg(sendSmsResponse.body.message);
            record.setSendTime(LocalDateTime.now());
            smsSendRecordMapper.updateById(record);

            response.setRecordId(record.getId());
            response.setSendTime(record.getSendTime());

        } catch (Exception e) {
            log.error("发送阿里云短信失败", e);
            response.setSuccess(false);
            response.setCode("SEND_FAILED");
            response.setMessage("发送失败: " + e.getMessage());

            // 更新记录为失败
            record.setStatus(2);
            record.setResponseCode("EXCEPTION");
            record.setResponseMsg(e.getMessage());
            smsSendRecordMapper.updateById(record);
        }

        return response;
    }

    /**
     * 发送腾讯云短信（预留）
     */
    private SmsDTO.SendResponse sendTencentSms(String phone, String templateCode, String templateParam, SmsSendRecord record) {
        SmsDTO.SendResponse response = new SmsDTO.SendResponse();
        // TODO: 实现腾讯云短信发送
        response.setSuccess(false);
        response.setCode("NOT_IMPLEMENTED");
        response.setMessage("腾讯云短信服务尚未实现");
        return response;
    }
}
