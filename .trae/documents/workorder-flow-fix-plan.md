# 工单流程修复与完善计划

## 概述

**目标**：修复前端工单流程中的状态校验缺失、角色权限不统一、超时提醒缺失等问题，确保演示环境下不同角色的工单流程完整打通。

**技术栈确认**：
- 移动端：Vue3 + Element Plus 响应式适配（暂不装 Vant4）
- PC端：Vue3 + Element Plus
- 后端：C# .NET 10（未来）/ 当前演示用 localStorage + Pinia Store
- 数据库：SQL Server 2012（未来）
- 部署：IIS（未来）

**约束**：
- 演示阶段，前端 Store（localStorage）自成体系，不依赖后端 API
- 管理员拥有所有职员功能（用于测试，后期会关闭）
- 不创建新文件，只修改现有文件

---

## 当前状态分析

### 工单流程 8 节点

```
创建工单 ──→ pending_assign ──→ pending_accept ──→ processing ──→ pending_sign
  ▲              │  │                │  │                              │
  │              │  │                │  │                              │
  │    2h超时→部长│  课长分配         │  工程师接单                       │ 签字
  │              │  │                │  │                              │
  │              │  ▼                │  ▼                              ▼
  │         [部长待分配池]     ← 弃单(reject)                  techlead_confirm
  │                                                                    │
  │                                                              课长确认│
  │                                                                    ▼
  └────────── 业务助理 / 工程师 / 客户 / 管理员 均可创建        assistant_confirm
                                                                       │
                                                                 业务确认│
                                                                       ▼
                                                                   completed
```

### 各角色操作汇总

| 操作 | 管理员 | 课长 | 部长 | 工程师 | 业务助理 | 客户 |
|------|:------:|:----:|:----:|:------:|:--------:|:----:|
| 创建工单 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 分配工程师 | ✅ | ✅ | ✅(超时工单) | — | — | — |
| 接单 | ✅ | — | — | ✅ | — | — |
| 弃单 | ✅ | — | — | ✅ | — | — |
| 完工提交 | ✅ | — | — | ✅ | — | — |
| 签字 | ✅ | — | — | ✅ | — | ✅ |
| 课长确认 | ✅ | ✅ | — | — | — | — |
| 业务确认 | ✅ | — | — | — | ✅ | — |
| 进行中直接完成 | ✅ | — | — | — | — | — |

### 已发现的代码问题

1. **`workorderFlowStore.js`**：所有状态流转函数（assignAcceptRejectSign等）都没有前置状态校验
2. **`checkInWorkorder()`**：强制覆盖状态为 PROCESSING，即使已完成也会被覆盖
3. **角色操作权限**：分散在各 Vue 组件中，不统一，部分角色判断有漏洞
4. **部长2小时超时**：完全没有实现
5. **管理员权限**：部分页面 admin 被赋予了所有权限，但部分页面漏了
6. **前端 API（workorderApi.js）**：调用了后端不存在的接口（assign、customerSign 等），但演示阶段不需要
7. **双写数据**：Workorder.vue 维护了自己的 workorders 数组副本，与 Store 数据可能不一致

---

## 修改计划

### P0 - 核心修复：workorderFlowStore.js

**文件**：`src/stores/workorderFlowStore.js`

#### 修改1：所有流转函数增加前置状态校验

每个函数在修改状态前，校验当前状态是否符合预期：

```javascript
// assignWorkorder: 只能从 pending_assign 分配
const assignWorkorder = (workorderId, engineerId, engineerName, remark) => {
  const w = state.workorders.find(w => w.id === workorderId)
  if (!w) return null
  if (w.status !== WorkorderStatus.PENDING_ASSIGN) {
    console.warn('assignWorkorder: 工单状态不允许分配，当前状态:', w.status)
    return null
  }
  w.engineerId = engineerId
  w.engineerName = engineerName
  w.status = WorkorderStatus.PENDING_ACCEPT
  w.assignTime = new Date().toISOString()
  // ...
}

// acceptWorkorder: 只能从 pending_accept 接单
// rejectWorkorder: 只能从 pending_accept 弃单
// submitForSign: 只能从 processing 提交
// signWorkorder: 只能从 pending_sign 签字
// techLeadConfirm: 只能从 techlead_confirm 确认
// assistantConfirm: 只能从 assistant_confirm 确认
// checkInWorkorder: 只能从 pending_accept 签到
```

#### 修改2：新增 `checkInWorkorder` 状态保护

```javascript
const checkInWorkorder = (workorderId, location) => {
  const w = state.workorders.find(w => w.id === workorderId)
  if (!w) return null
  // 只能在待接单或进行中状态打卡
  if (w.status !== WorkorderStatus.PENDING_ACCEPT && w.status !== WorkorderStatus.PROCESSING) {
    console.warn('checkInWorkorder: 当前状态不允许打卡:', w.status)
    return null
  }
  if (w.status === WorkorderStatus.PENDING_ACCEPT) {
    w.status = WorkorderStatus.PROCESSING  // 接单后自动签到
  }
  w.checkInTime = new Date().toISOString()
  w.checkInLocation = location
  return w
}
```

#### 修改3：新增角色操作权限校验函数

在 Store 中统一管理所有角色权限，各 Vue 组件直接调用：

```javascript
// 角色常量
export const Roles = {
  ADMIN: 'admin',
  TECH_LEAD: 'techLead',
  DIRECTOR: 'director',
  ENGINEER: 'engineer',
  ASSISTANT: 'assistant',
  SALES: 'sales',
  CUSTOMER: 'customer'
}

// 创建工单权限：管理员、业务助理、工程师、课长都可创建
export const canCreateWorkorder = (role) =>
  [Roles.ADMIN, Roles.ASSISTANT, Roles.ENGINEER, Roles.TECH_LEAD, Roles.SALES].includes(role)

// 分配工程师权限：管理员、课长、部长(超时工单)
export const canAssignWorkorder = (role, workorder) => {
  if ([Roles.ADMIN, Roles.TECH_LEAD].includes(role)) return true
  if (role === Roles.DIRECTOR && workorder) {
    return isTimeoutUnassigned(workorder)
  }
  return false
}

// 接单权限：管理员、工程师(且工单分配给该工程师)
export const canAcceptWorkorder = (role, workorder, userId) => {
  if (role === Roles.ADMIN) return true
  if (role === Roles.ENGINEER) return workorder.engineerId === userId
  return false
}

// 弃单权限：管理员、工程师(且工单分配给该工程师)
// 完工提交：管理员、工程师(且是自己的工单)
// 签字：管理员、工程师(自己的)、客户(自己的)
// 课长确认：管理员、课长
// 业务确认：管理员、业务助理
// 直接完成：仅管理员(从 processing 状态)
```

#### 修改4：新增2小时超时检测 + 部长待分配池

```javascript
// 超时时间（毫秒）
const ASSIGN_TIMEOUT_MS = 2 * 60 * 60 * 1000  // 2小时

// 检查工单是否超时未分配
const isTimeoutUnassigned = (workorder) => {
  if (workorder.status !== WorkorderStatus.PENDING_ASSIGN) return false
  const createTime = new Date(workorder.createTime).getTime()
  return (Date.now() - createTime) > ASSIGN_TIMEOUT_MS
}

// 获取部长待分配池（超时未分配的工单）
const getDirectorPendingPool = () => {
  return state.workorders.filter(w => isTimeoutUnassigned(w))
    .sort((a, b) => new Date(b.createTime) - new Date(a.createTime))
}

// 启动超时检测定时器（每30秒检查一次）
let timeoutCheckInterval = null
const startTimeoutChecker = () => {
  if (timeoutCheckInterval) return
  timeoutCheckInterval = setInterval(() => {
    const timeoutWorkorders = state.workorders.filter(w => isTimeoutUnassigned(w))
    if (timeoutWorkorders.length > 0) {
      // 触发部长通知
      createNotification({
        targetRole: 'director',
        title: '工单超时提醒',
        message: `有 ${timeoutWorkorders.length} 个工单超过2小时未分配`,
        type: 'timeout_alarm'
      })
    }
  }, 30000)  // 30秒检查一次
}

const stopTimeoutChecker = () => {
  if (timeoutCheckInterval) {
    clearInterval(timeoutCheckInterval)
    timeoutCheckInterval = null
  }
}
```

#### 修改5：Store 初始化时启动超时检测

在 `initMockData()` 或模块加载时调用 `startTimeoutChecker()`。

#### 修改6：导出新增的函数

```javascript
export {
  // ... existing exports ...
  Roles,
  canCreateWorkorder, canAssignWorkorder, canAcceptWorkorder,
  canRejectWorkorder, canSubmitForSign, canSignWorkorder,
  canTechLeadConfirm, canAssistantConfirm, canCompleteDirectly,
  isTimeoutUnassigned, getDirectorPendingPool,
  startTimeoutChecker, stopTimeoutChecker,
}
```

---

### P0 - 页面修复：Workorder.vue（PC端工单管理）

**文件**：`src/views/Workorder.vue`

#### 修改1：操作按钮改用统一的权限函数

当前操作按钮分散判断角色（[L105-L117](file:///d:/SA/src/views/Workorder.vue#L105-L117)），改为调用 Store 中的统一权限函数：

```html
<!-- 示例：分配按钮 -->
<el-button v-if="canAssignWorkorder(currentUserRole, currentWorkorder)"
  @click="handleAssign">分配工程师</el-button>
```

#### 修改2：增加「进行中直接完成」按钮（管理员专属）

在 `processing` 状态下，管理员看到"直接完成"按钮：

```html
<el-button v-if="canCompleteDirectly(currentUserRole) && currentWorkorder.status === 'processing'"
  type="success" @click="handleDirectComplete">直接完成</el-button>
```

`handleDirectComplete` 直接将工单状态设为 `completed`。

#### 修改3：移除冗余的本地 workorders 数组副本

当前 `Workorder.vue` 维护了 `const workorders = ref([])` 并做 `.map()` 转换，同时 Store 也有一份数据。改为直接使用响应式 Store 数据：

```javascript
// 改为 computed 直接读取 Store
const workorders = computed(() =>
  [...workorderFlowState.workorders]
    .sort((a, b) => new Date(b.createTime) - new Date(a.createTime))
    .map(w => ({ /* 转换格式 */ }))
)
```

---

### P0 - 页面修复：StaffWorkorderList.vue（移动端工单列表）

**文件**：`src/views/StaffWorkorderList.vue`

#### 修改1：引入统一权限函数

```javascript
import {
  canAcceptWorkorder, canRejectWorkorder, canSubmitForSign,
  canSignWorkorder, canTechLeadConfirm, canAssistantConfirm,
  canAssignWorkorder, canCompleteDirectly,
  Roles
} from '../stores/workorderFlowStore.js'
```

#### 修改2：按钮显示逻辑改为调用权限函数

替换当前在模板中写死的角色判断（如 `isEngineer`、`isTechLead`）：

```html
<!-- 之前 -->
<van-button v-if="isEngineer && item.status === 'pending_accept'" @click="acceptWorkorder(item)">接单</van-button>

<!-- 之后 -->
<van-button v-if="canAcceptWorkorder(currentUserRole, item, currentUserId)" @click="acceptWorkorder(item)">接单</van-button>
```

#### 修改3：正确处理 currentUserId

从 `staffAuth` 中获取当前用户的真实 ID，传给权限函数：

```javascript
const auth = JSON.parse(localStorage.getItem('staffAuth') || '{}')
const currentUserId = auth.id || auth.userId || ''
```

---

### P1 - 页面修复：StaffWorkorderCreate.vue（创建工单）

**文件**：`src/views/StaffWorkorderCreate.vue`

#### 修改1：开放业务助理的创建权限

检查当前页面是否有角色限制，确保 `assistant`、`admin`、`engineer`、`techLead` 角色均可创建工单。

#### 修改2：创建时正确设置 createdBy

创建工单时，正确记录创建者信息：

```javascript
const workorder = {
  // ...
  createdBy: {
    id: currentUserId,
    name: currentUserName,
    role: currentUserRole
  }
}
```

---

### P1 - 页面修复：StaffMobileWorkspace.vue（员工移动工作台）

**文件**：`src/views/StaffMobileWorkspace.vue`

#### 修改1：部长首页增加超时待分配池入口

部门角色登录后，首页显示超时待分配工单数量卡片：

```
┌─────────────────────────────┐
│  ⚠ 超时未分配工单           │
│        3 个                  │
│   点击查看 →                 │
└─────────────────────────────┘
```

#### 修改2：点击跳转到部长待分配列表

跳转到一个筛选视图，展示所有 `isTimeoutUnassigned()` 返回 true 的工单，部长可以分配。

---

### P2 - 路由权限修复：router/index.js

**文件**：`src/router/index.js`

#### 修改1：确保 admin 角色可访问所有路由

检查 `rolePermissions.admin` 数组是否包含所有路由路径。

#### 修改2：确保业务助理有创建工单的路由权限

`staff-workorder-create` 路由需在 `assistant` 的权限列表中。

---

### P2 - 菜单权限修复：App.vue

**文件**：`src/App.vue`

#### 修改1：检查业务助理菜单

确保 `roleMenus.assistant` 包含"创建工单"菜单项。

#### 修改2：检查管理员菜单

管理员菜单应包含所有功能入口。

---

## 实施顺序

1. **先改 Store（workorderFlowStore.js）** — 核心逻辑，所有页面依赖它
2. **再改页面组件** — 依赖 Store 的新函数
3. **最后改路由和菜单** — 保证入口正确

| 步骤 | 文件 | 内容 | 预估改动量 |
|------|------|------|------------|
| 1 | `workorderFlowStore.js` | 状态校验 + 权限函数 + 超时检测 | ~150行新增/修改 |
| 2 | `Workorder.vue` | 权限函数替换 + 管理员直接完成按钮 | ~30行修改 |
| 3 | `StaffWorkorderList.vue` | 权限函数替换 | ~20行修改 |
| 4 | `StaffWorkorderCreate.vue` | 业务助理创建权限 | ~10行修改 |
| 5 | `StaffMobileWorkspace.vue` | 部长超时待分配卡片 | ~30行新增 |
| 6 | `router/index.js` | 角色路由权限核对 | ~5行修改 |
| 7 | `App.vue` | 菜单权限核对 | ~5行修改 |

---

## 验收标准

1. **管理员**：登录后能执行所有角色操作（创建、分配、接单、弃单、完工提交、签字、课长确认、业务确认、直接完成）
2. **业务助理**：能创建工单、能看到待业务确认的工单并确认
3. **课长**：能分配待分配工单、能课长确认
4. **工程师**：能接单（仅限分配给自己）、能弃单、能完工提交、能签字
5. **客户**：能签字（仅限自己的工单）
6. **部长**：2小时后能看到超时未分配的工单，能分配工程师
7. **状态流转**：所有非法状态跳转被拦截（如跳过待接单直接完成、已完成后再次提交等）
8. **数据一致性**：Workorder.vue 不再维护独立数组副本

---

## 不处理的遗留问题（待 C# 后端阶段解决）

- 工单号的数据库序列（当前前端随机生成）
- 后端 API 对接（当前 Store 自成体系）
- Java 后端代码（将被 C# 替换，不再修改）
- Vant4 迁移（后期统一做）
- 真实数据库持久化
