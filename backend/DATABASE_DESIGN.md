# 售后管理系统 - 数据库设计文档

## 目录

1. [数据库概览](#数据库概览)
2. [表结构说明](#表结构说明)
3. [实体关系图](#实体关系图)
4. [索引设计](#索引设计)

---

## 数据库概览

- **数据库名称**: `after_sales_db`
- **字符集**: `utf8mb4`
- **排序规则**: `utf8mb4_unicode_ci`
- **存储引擎**: InnoDB

---

## 表结构说明

### 1. 客户表 (customers)

存储客户（公司）基本信息

```sql
CREATE TABLE customers (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '客户ID',
    name VARCHAR(100) NOT NULL COMMENT '客户名称',
    credit_code VARCHAR(18) UNIQUE COMMENT '统一社会信用代码',
    legal_person VARCHAR(50) COMMENT '法人姓名',
    address VARCHAR(255) COMMENT '公司地址',
    phone VARCHAR(20) COMMENT '联系电话',
    email VARCHAR(100) COMMENT '邮箱',
    level ENUM('VIP', '普通', '潜在') DEFAULT '普通' COMMENT '客户等级',
    status ENUM('active', 'inactive') DEFAULT 'active' COMMENT '状态',
    remark TEXT COMMENT '备注',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    created_by BIGINT COMMENT '创建人ID',
    updated_by BIGINT COMMENT '更新人ID',
    INDEX idx_name (name),
    INDEX idx_level (level),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='客户表';
```

### 2. 联系人表 (contacts)

存储客户公司的联系人信息

```sql
CREATE TABLE contacts (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '联系人ID',
    customer_id BIGINT NOT NULL COMMENT '所属客户ID',
    name VARCHAR(50) NOT NULL COMMENT '姓名',
    phone VARCHAR(20) NOT NULL COMMENT '手机号',
    email VARCHAR(100) COMMENT '邮箱',
    position VARCHAR(50) COMMENT '职位',
    is_primary BOOLEAN DEFAULT FALSE COMMENT '是否主要联系人',
    approval_status ENUM('待审核', '已通过', '已拒绝') DEFAULT '待审核' COMMENT '审核状态',
    register_time TIMESTAMP COMMENT '注册时间',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    INDEX idx_customer_id (customer_id),
    INDEX idx_phone (phone)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='联系人表';
```

### 3. 设备表 (assets)

存储客户购买的设备信息

```sql
CREATE TABLE assets (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '设备ID',
    serial_number VARCHAR(50) UNIQUE NOT NULL COMMENT '序列号',
    model VARCHAR(100) NOT NULL COMMENT '设备型号',
    name VARCHAR(100) COMMENT '设备名称',
    customer_id BIGINT NOT NULL COMMENT '所属客户ID',
    type VARCHAR(50) COMMENT '设备类型',
    status ENUM('运行中', '停机', '维修中', '报废') DEFAULT '运行中' COMMENT '状态',
    manufacture_date DATE COMMENT '生产日期',
    sales_date DATE COMMENT '销售日期',
    install_date DATE COMMENT '安装日期',
    warranty_end_date DATE COMMENT '保修截止日期',
    is_el BOOLEAN DEFAULT FALSE COMMENT '是否EL设备',
    install_address VARCHAR(255) COMMENT '安装地址',
    qr_code VARCHAR(255) COMMENT '二维码URL',
    remark TEXT COMMENT '备注',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    INDEX idx_customer_id (customer_id),
    INDEX idx_serial_number (serial_number),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='设备表';
```

### 4. 工单表 (workorders)

存储售后服务工单信息

```sql
CREATE TABLE workorders (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '工单ID',
    workorder_no VARCHAR(20) UNIQUE NOT NULL COMMENT '工单编号',
    type ENUM('维修', '保养', '安装', '巡检', '配件更换') NOT NULL COMMENT '工单类型',
    status ENUM('待处理', '已接单', '处理中', '待确认', '已完成', '已取消') DEFAULT '待处理' COMMENT '状态',
    priority ENUM('紧急', '高', '中', '低') DEFAULT '中' COMMENT '优先级',
    customer_id BIGINT NOT NULL COMMENT '客户ID',
    asset_id BIGINT COMMENT '设备ID',
    contact_id BIGINT COMMENT '联系人ID',
    problem_description TEXT COMMENT '问题描述',
    solution TEXT COMMENT '解决方案',
    employee_id BIGINT COMMENT '处理员工ID',
    create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    accept_time TIMESTAMP COMMENT '接单时间',
    start_time TIMESTAMP COMMENT '开始处理时间',
    complete_time TIMESTAMP COMMENT '完成时间',
    expect_time TIMESTAMP COMMENT '期望完成时间',
    customer_sign TEXT COMMENT '客户签字(base64)',
    evaluation_score INT COMMENT '评价分数',
    evaluation_content TEXT COMMENT '评价内容',
    created_by BIGINT COMMENT '创建人ID',
    remark TEXT COMMENT '备注',
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    FOREIGN KEY (asset_id) REFERENCES assets(id),
    FOREIGN KEY (employee_id) REFERENCES employees(id),
    INDEX idx_workorder_no (workorder_no),
    INDEX idx_customer_id (customer_id),
    INDEX idx_employee_id (employee_id),
    INDEX idx_status (status),
    INDEX idx_type (type),
    INDEX idx_create_time (create_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='工单表';
```

### 5. 工单记录表 (workorder_records)

存储工单处理过程中的记录

```sql
CREATE TABLE workorder_records (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    workorder_id BIGINT NOT NULL COMMENT '工单ID',
    action VARCHAR(50) NOT NULL COMMENT '操作动作',
    operator_id BIGINT COMMENT '操作人ID',
    operator_name VARCHAR(50) COMMENT '操作人姓名',
    content TEXT COMMENT '内容',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (workorder_id) REFERENCES workorders(id) ON DELETE CASCADE,
    INDEX idx_workorder_id (workorder_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='工单记录表';
```

### 6. 员工表 (employees)

存储系统用户信息

```sql
CREATE TABLE employees (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '员工ID',
    username VARCHAR(50) UNIQUE NOT NULL COMMENT '用户名',
    password VARCHAR(255) NOT NULL COMMENT '密码(加密)',
    name VARCHAR(50) NOT NULL COMMENT '姓名',
    phone VARCHAR(20) COMMENT '手机号',
    email VARCHAR(100) COMMENT '邮箱',
    department VARCHAR(50) COMMENT '部门',
    role ENUM('管理员', '经理', '技术主管', '工程师', '业务员', '客服') DEFAULT '工程师' COMMENT '角色',
    status ENUM('在职', '离职', '休假') DEFAULT '在职' COMMENT '状态',
    join_date DATE COMMENT '入职日期',
    last_login_time TIMESTAMP COMMENT '最后登录时间',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_username (username),
    INDEX idx_department (department),
    INDEX idx_role (role),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='员工表';
```

### 7. 配件表 (parts)

存储配件库存信息

```sql
CREATE TABLE parts (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '配件ID',
    code VARCHAR(50) UNIQUE NOT NULL COMMENT '配件编码',
    name VARCHAR(100) NOT NULL COMMENT '配件名称',
    model VARCHAR(100) COMMENT '型号规格',
    category VARCHAR(50) COMMENT '分类',
    specification TEXT COMMENT '详细规格',
    unit VARCHAR(20) DEFAULT '个' COMMENT '单位',
    stock INT DEFAULT 0 COMMENT '当前库存',
    min_stock INT DEFAULT 10 COMMENT '最低库存',
    max_stock INT DEFAULT 100 COMMENT '最高库存',
    price DECIMAL(10, 2) COMMENT '单价',
    supplier VARCHAR(100) COMMENT '供应商',
    location VARCHAR(100) COMMENT '存放位置',
    remark TEXT COMMENT '备注',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_code (code),
    INDEX idx_category (category),
    INDEX idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='配件表';
```

### 8. 配件库存记录表 (part_stock_records)

存储配件出入库记录

```sql
CREATE TABLE part_stock_records (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    part_id BIGINT NOT NULL COMMENT '配件ID',
    type ENUM('入库', '出库') NOT NULL COMMENT '类型',
    quantity INT NOT NULL COMMENT '数量',
    before_stock INT COMMENT '操作前库存',
    after_stock INT COMMENT '操作后库存',
    workorder_id BIGINT COMMENT '关联工单ID',
    operator_id BIGINT COMMENT '操作人ID',
    remark TEXT COMMENT '备注',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (part_id) REFERENCES parts(id),
    INDEX idx_part_id (part_id),
    INDEX idx_type (type),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='配件库存记录表';
```

### 9. 报价单表 (quotations)

存储报价单信息

```sql
CREATE TABLE quotations (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '报价单ID',
    quotation_no VARCHAR(20) UNIQUE NOT NULL COMMENT '报价单编号',
    customer_id BIGINT NOT NULL COMMENT '客户ID',
    contact_id BIGINT COMMENT '联系人ID',
    status ENUM('草稿', '待审核', '已审核', '已发送', '客户已确认', '客户已拒绝', '已过期') DEFAULT '草稿' COMMENT '状态',
    total_amount DECIMAL(12, 2) COMMENT '总金额',
    valid_days INT DEFAULT 30 COMMENT '有效期(天)',
    expire_date DATE COMMENT '过期日期',
    pdf_url VARCHAR(255) COMMENT 'PDF文件URL',
    created_by BIGINT COMMENT '创建人ID',
    approved_by BIGINT COMMENT '审核人ID',
    approved_time TIMESTAMP COMMENT '审核时间',
    remark TEXT COMMENT '备注',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    INDEX idx_quotation_no (quotation_no),
    INDEX idx_customer_id (customer_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='报价单表';
```

### 10. 报价单项表 (quotation_items)

存储报价单明细

```sql
CREATE TABLE quotation_items (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    quotation_id BIGINT NOT NULL COMMENT '报价单ID',
    name VARCHAR(100) NOT NULL COMMENT '项目名称',
    specification VARCHAR(255) COMMENT '规格',
    quantity INT NOT NULL COMMENT '数量',
    unit VARCHAR(20) COMMENT '单位',
    unit_price DECIMAL(10, 2) NOT NULL COMMENT '单价',
    amount DECIMAL(12, 2) COMMENT '金额',
    sort_order INT DEFAULT 0 COMMENT '排序',
    FOREIGN KEY (quotation_id) REFERENCES quotations(id) ON DELETE CASCADE,
    INDEX idx_quotation_id (quotation_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='报价单项表';
```

### 11. 外勤打卡表 (field_checkins)

存储员工外勤打卡记录

```sql
CREATE TABLE field_checkins (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    employee_id BIGINT NOT NULL COMMENT '员工ID',
    workorder_id BIGINT COMMENT '关联工单ID',
    type ENUM('上班打卡', '下班打卡') NOT NULL COMMENT '打卡类型',
    checkin_time TIMESTAMP NOT NULL COMMENT '打卡时间',
    location VARCHAR(255) COMMENT '打卡位置',
    longitude DECIMAL(10, 7) COMMENT '经度',
    latitude DECIMAL(10, 7) COMMENT '纬度',
    photo_url VARCHAR(255) COMMENT '现场照片URL',
    remark TEXT COMMENT '备注',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id),
    INDEX idx_employee_id (employee_id),
    INDEX idx_workorder_id (workorder_id),
    INDEX idx_checkin_time (checkin_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='外勤打卡表';
```

### 12. 系统配置表 (system_configs)

存储系统配置参数

```sql
CREATE TABLE system_configs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    config_key VARCHAR(100) UNIQUE NOT NULL COMMENT '配置键',
    config_value TEXT COMMENT '配置值',
    description VARCHAR(255) COMMENT '描述',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_config_key (config_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='系统配置表';
```

---

## 实体关系图

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│    customers    │────<│    contacts     │     │     assets      │
│    (客户)       │     │    (联系人)      │     │    (设备)       │
└────────┬────────┘     └─────────────────┘     └────────┬────────┘
         │                                               │
         │                                               │
         │         ┌─────────────────┐                  │
         │         │   workorders    │<─────────────────┘
         │         │    (工单)       │
         │         └────────┬────────┘
         │                  │
         │                  │
         │         ┌────────┴────────┐
         │         │workorder_records│
         │         │  (工单记录)      │
         │         └─────────────────┘
         │
         │         ┌─────────────────┐
         └────────>│   quotations    │
                   │   (报价单)       │
                   └────────┬────────┘
                            │
                   ┌────────┴────────┐
                   │quotation_items   │
                   │  (报价单项)      │
                   └─────────────────┘

┌─────────────────┐     ┌─────────────────┐
│   employees     │────<│ field_checkins  │
│    (员工)       │     │  (外勤打卡)      │
└─────────────────┘     └─────────────────┘

┌─────────────────┐     ┌─────────────────┐
│     parts       │────<│part_stock_records│
│    (配件)       │     │ (库存记录)       │
└─────────────────┘     └─────────────────┘
```

---

## 索引设计

### 高频查询索引

| 表名 | 索引名 | 字段 | 说明 |
|------|--------|------|------|
| customers | idx_name | name | 客户名称搜索 |
| customers | idx_level | level | 客户等级筛选 |
| workorders | idx_status | status | 工单状态筛选 |
| workorders | idx_customer_id | customer_id | 客户工单查询 |
| workorders | idx_employee_id | employee_id | 员工工单查询 |
| assets | idx_customer_id | customer_id | 客户设备查询 |
| parts | idx_code | code | 配件编码查询 |
| employees | idx_username | username | 登录查询 |

### 复合索引

```sql
-- 工单时间范围查询
CREATE INDEX idx_workorder_time ON workorders(customer_id, create_time);

-- 配件库存预警查询
CREATE INDEX idx_part_stock ON parts(stock, min_stock);

-- 外勤打卡记录查询
CREATE INDEX idx_checkin_employee_time ON field_checkins(employee_id, checkin_time);
```

---

## 初始化数据

```sql
-- 插入默认管理员
INSERT INTO employees (username, password, name, department, role, status) 
VALUES ('admin', '$2a$10$...', '系统管理员', '管理部', '管理员', '在职');

-- 插入系统配置
INSERT INTO system_configs (config_key, config_value, description) VALUES
('system.name', '售后管理系统', '系统名称'),
('system.version', '1.0.0', '系统版本'),
('page.size.default', '10', '默认分页大小');
```

---

## 注意事项

1. **密码加密**: 员工密码使用BCrypt加密存储
2. **软删除**: 重要数据建议使用状态字段实现软删除
3. **乐观锁**: 并发更新场景建议添加version字段
4. **审计字段**: 所有表都包含created_at和updated_at
5. **字符集**: 统一使用utf8mb4支持emoji
