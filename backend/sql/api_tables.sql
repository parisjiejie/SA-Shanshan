-- ============================================
-- 第三方API相关数据表
-- ============================================

-- API调用日志表
CREATE TABLE IF NOT EXISTS api_call_log (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '日志ID',
    api_type VARCHAR(50) NOT NULL COMMENT 'API类型：TIANYANCHA/AMAP/SMS',
    api_name VARCHAR(100) NOT NULL COMMENT '接口名称',
    request_params TEXT COMMENT '请求参数',
    response_data TEXT COMMENT '响应数据',
    status TINYINT DEFAULT 0 COMMENT '状态：0-失败 1-成功',
    error_msg VARCHAR(500) COMMENT '错误信息',
    cost_time INT COMMENT '耗时（毫秒）',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    INDEX idx_api_type (api_type),
    INDEX idx_api_name (api_name),
    INDEX idx_status (status),
    INDEX idx_create_time (create_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='API调用日志表';

-- 短信发送记录表
CREATE TABLE IF NOT EXISTS sms_send_record (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '记录ID',
    phone VARCHAR(20) NOT NULL COMMENT '手机号',
    template_code VARCHAR(50) NOT NULL COMMENT '模板编码',
    template_params TEXT COMMENT '模板参数',
    verify_code VARCHAR(10) COMMENT '验证码',
    verify_code_type VARCHAR(50) COMMENT '验证码类型：login/register/reset_password/bind_phone',
    status TINYINT DEFAULT 0 COMMENT '状态：0-发送中 1-成功 2-失败',
    response_code VARCHAR(50) COMMENT '响应码',
    response_msg VARCHAR(500) COMMENT '响应消息',
    send_time DATETIME COMMENT '发送时间',
    expire_time DATETIME COMMENT '过期时间',
    verify_time DATETIME COMMENT '验证时间',
    ip_address VARCHAR(50) COMMENT 'IP地址',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    INDEX idx_phone (phone),
    INDEX idx_verify_code (verify_code),
    INDEX idx_status (status),
    INDEX idx_create_time (create_time),
    INDEX idx_verify_code_type (verify_code_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='短信发送记录表';
