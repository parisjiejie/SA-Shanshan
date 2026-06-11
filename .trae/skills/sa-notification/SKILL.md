---
name: "sa-notification"
description: "SA系统通知体系规范。定义通知类型枚举、触发规则、目标角色、超时报警机制。修改通知逻辑时必须参考此技能。"
---

# SA — 通知系统规范

> ✅ 已与用户确认（2026-06-11）

---

## 一、通知类型枚举

定义文件：`src/stores/notificationStore.js`

| 枚举值 | 含义 |
|--------|------|
| `WORKORDER_CREATED` | 工单已创建 |
| `WORKORDER_ASSIGNED` | 工单已分配工程师 |
| `WORKORDER_ACCEPTED` | 工单已接单 |
| `WORKORDER_REJECTED` | 工单已弃单 |
| `WORKORDER_IN_PROGRESS` | 工单进行中 |
| `WORKORDER_PENDING_SIGN` | 工单待签字 |
| `WORKORDER_SIGNED` | 工单已签字 |
| `WORKORDER_TECHLEAD_CONFIRMED` | 课长已确认 |
| `WORKORDER_COMPLETED` | 工单已完成 |
| `TIMEOUT_ALARM` | 超时报警 |
| `QUOTATION_SUBMITTED` | 报价单已提交 |
| `QUOTATION_APPROVED` | 报价单审核通过 |
| `QUOTATION_REJECTED` | 报价单审核驳回 |
| `QUOTATION_SENT` | 报价单已发送客户 |
| `QUOTATION_CONFIRMED` | 客户已确认报价单 |
| `CHECKIN_SUBMITTED` | 打卡已提交审批 |
| `CHECKIN_APPROVED` | 打卡审批通过 |
| `CUSTOMER_REGISTERED` | 新客户注册待审核 |

---

## 二、工单流程通知矩阵

| 触发事件 | 通知对象 | 通知级别 | 跳转路径 |
|----------|----------|----------|----------|
| 工单创建 | 课长 | `action` | `/workorder` |
| 工单创建 | 部长 | `info` | `/workorder` |
| 课长分配工程师 | 工程师 | `action` | `/staff-workorder-list?filter=pending_accept` |
| 工程师弃单 | 课长 | `action` | `/workorder` |
| 工程师接单 | 客户 | `info` | `/customer-workorder-list` |
| 工程师接单 | 课长 | `info` | `/workorder` |
| 工程师接单 | 业务助理 | `info` | `/workorder` |
| 提交签字 | 客户 | `action` | `/customer-workspace` |
| 提交签字 | 工程师 | `action` | `/staff-workorder-detail` |
| 签字完成 | 课长 | `action` | `/workorder` |
| 签字完成 | 另一方(客户/工程师) | `info` | 对应列表 |
| 课长确认 | 业务助理 | `action` | `/workorder` |
| 业务确认 | 工程师 | `info` | `/staff-workorder-list` |
| 业务确认 | 客户 | `info` | `/customer-workorder-list` |

---

## 三、超时报警

**检测间隔：** 30 秒 | **阈值：** 2 小时

| 超时场景 | 通知对象 | 文件位置 | 状态 |
|----------|----------|----------|------|
| 创建后 2 小时未分配 | 部长 | `checkTimeoutAlarms` | ✅ |
| 分配后 2 小时未接单 | 🔧 工程师 + 该工单分配课长 | `checkTimeoutAlarms` | 🔧当前错误通知 techLead+director |

---

## 四、Dashboard 按角色的待处理通知

| 角色 | 待处理通知内容 |
|------|---------------|
| 课长 | 待分配数量 + 被弃单数量 + 待课长确认数量 |
| 工程师 | 待接单数量 + 待签字数量 |
| 业务助理 | 待业务确认数量 + 待审核报价数量 |
| 客户 | 待签字数量 |
| 部长 | 超时未分配数量 |

---

## 五、通知数据结构

```js
{
  id: String,           // 唯一ID
  type: NotificationType,
  level: 'action'|'info',  // action=需操作, info=仅通知
  title: String,
  content: String,
  targetRole: String,   // admin/techLead/engineer/assistant/customer/director
  targetUserId: String?, // 可选，精确到人
  jumpPath: String,     // 点击跳转
  relatedId: String?,   // 关联工单ID
  createTime: ISOString,
  isRead: false
}
```

---

## 六、相关文件

| 文件 | 职责 |
|------|------|
| `src/stores/notificationStore.js` | 通知存储、类型枚举、增删查改 |
| `src/stores/workorderFlowStore.js` | 各流程节点内的 `addNotification()` 调用 |
| `src/views/Dashboard.vue` | PC端通知展示 |
| `src/views/UnifiedLogin.vue` | 登录页通知入口 |
