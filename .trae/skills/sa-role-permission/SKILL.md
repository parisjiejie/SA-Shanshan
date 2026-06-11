---
name: "sa-role-permission"
description: "SA系统角色定义、权限校验、工单可见性规则、页面访问控制。修改角色权限、路由守卫、可见范围时必须参考此技能。"
---

# SA — 角色与权限体系

> ✅ 已与用户确认（2026-06-11）

---

## 一、角色定义（6 个）

| 序号 | roleKey | 角色名 | 登录名 | 首页路由 | 核心职责 |
|------|---------|--------|--------|----------|----------|
| 1 | `admin` | 管理员 | 李管理员 | `/staff-mobile-workspace` | 系统管理、全部权限 |
| 2 | `assistant` | 业务助理 | 赵业务助理 | `/staff-mobile-workspace` | 客户管理、建工单、报价、全部工单查看 |
| 3 | `techLead` | 课长 | 张工程课课长 | `/staff-mobile-workspace` | 分配工程师、课长确认 |
| 4 | `director` | 部长 | 钱部长 | `/staff-mobile-workspace` | 超时工单分配、部门管理 |
| 5 | `engineer` | 工程师 | 王工程师 | `/staff-mobile-workspace` | 接单/弃单、处理工单、打卡、签字 |
| 6 | `customer` | 客户 | 王客户 | `/customer-workspace` | 创建工单、签字确认、查看自己的工单 |

---

## 二、工单可见性规则

| 角色 | 可见范围 | 代码位置 | 状态 |
|------|----------|----------|------|
| admin | 全部工单 | `getVisibleWorkorders` | ✅ |
| techLead | 全部工单 | `getVisibleWorkorders` | ✅ |
| director | 全部工单 | `getVisibleWorkorders` | ✅ |
| assistant | **全部工单** | `getVisibleWorkorders` | 🔧当前只看自己创建的 + assistant_confirm 状态 |
| engineer | **仅分配给自己的** | `getVisibleWorkorders` | 🔧当前还包含自己创建的工单 |
| customer | 自己的工单 | `getCustomerWorkorders` | ✅ |

---

## 三、流程操作权限

### 创建工单 — `canCreateWorkorder`
- ✅ admin / assistant / **customer**
- ❌ engineer / techLead / director / sales
- 🔧当前代码允许 engineer/techLead/sales

### 分配工程师 — `canAssignWorkorder`
- ✅ admin / techLead
- ✅ director（仅超时工单）

### 接单/弃单 — `canAcceptWorkorder` / `canRejectWorkorder`
- ✅ admin
- ✅ engineer（仅分配给自己的）

### 提交服务报告 — `canSubmitForSign`
- ✅ admin
- ✅ engineer（仅分配给自己的）

### 签字 — `canSignWorkorder`
- ✅ admin
- ✅ engineer（自己的工单）
- ✅ customer（自己的工单）

### 课长确认 — `canTechLeadConfirm`
- ✅ admin / techLead

### 业务确认 — `canAssistantConfirm`
- ✅ admin / assistant

### 直接完成 — `canCompleteDirectly`
- ✅ admin

---

## 四、页面路由授权

路由守卫文件：`src/router/index.js`

| 页面 | 路由 | 授权角色 |
|------|------|----------|
| Dashboard | `/dashboard` | 全部（UnifiedLogin） |
| 工单管理 | `/workorder` | 全部 |
| 客户管理 | `/customer` | admin / assistant / techLead |
| 设备管理 | `/asset` | admin / assistant |
| 员工管理 | `/staff` | admin |
| 报价管理 | `/quotation` | admin / assistant / techLead |
| 职员个人资料 | `/staff-profile/:id` | 全部 |
| 职员移动工作台 | `/staff-mobile-workspace` | 全部 |
| 移动端工单列表 | `/staff-workorder-list` | admin / assistant / engineer / techLead |
| 移动端工单详情 | `/staff-workorder-detail/:id` | admin / assistant / engineer / techLead |
| 🔧创建工单 | `/staff-workorder-create` | admin / assistant / engineer（需移除engineer）|

---

## 五、路线图文

```
统一登录 → UnifiedLogin → 6个角色选择
  ├─ admin → /staff-mobile-workspace（手机端工作台）
  ├─ assistant → /staff-mobile-workspace（手机端工作台）
  ├─ techLead → /staff-mobile-workspace（手机端工作台）
  ├─ director → /staff-mobile-workspace（手机端工作台）
  ├─ engineer → /staff-mobile-workspace（手机端工作台）
  └─ customer → /customer-workspace（手机端客户台）
```

---

## 六、相关文件

| 文件 | 职责 |
|------|------|
| `src/stores/workorderFlowStore.js:L611-L662` | 全部权限校验函数 |
| `src/stores/workorderFlowStore.js:L403-L428` | `getVisibleWorkorders` |
| `src/router/index.js` | 路由 + 导航守卫 |
| `src/views/UnifiedLogin.vue` | 角色选择与登录 |
