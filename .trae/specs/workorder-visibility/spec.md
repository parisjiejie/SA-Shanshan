# 工单可见性控制 Spec

## Why
当前后端工单查询接口 `/api/workorders` (GET) 没有任何角色过滤逻辑，任何用户都能看到所有工单。前端虽然有一些本地模拟的过滤逻辑（`workorderFlowStore.js`），但无法真正保护数据安全。需要在后端实现基于角色的工单数据范围控制，确保每个用户只能看到与自己相关的工单。

## What Changes
- 后端 `WorkorderService.getList()` 增加基于当前登录用户角色的数据过滤
- 后端 `WorkorderController` 从 JWT/SecurityContext 获取当前用户信息并传入 Service
- 后端 `SecurityConfig` 工单接口增加认证要求
- 新增工单可见性规则引擎，统一管理各角色的可见范围逻辑
- 前端移除本地 localStorage 的模拟过滤逻辑，改为依赖后端返回的已过滤数据
- 前端工单列表页面直接展示后端返回的数据，不再做客户端过滤

## Impact
- Affected specs: after_sales_system (FR-3 工单管理, FR-9 角色与访问权限)
- Affected code:
  - `backend/.../controller/WorkorderController.java` — 获取当前用户，传递给 Service
  - `backend/.../service/WorkorderService.java` — 增加角色过滤逻辑
  - `backend/.../repository/WorkorderRepository.java` — 可能需要增强查询以支持按部门/创建者过滤
  - `backend/.../config/SecurityConfig.java` — 工单接口增加认证要求
  - `src/stores/workorderFlowStore.js` — 移除 getVisibleWorkorders()
  - `src/views/Workorder.vue` — 直接使用后端数据
  - `src/views/StaffWorkorderList.vue` — 直接使用后端数据
  - `src/views/TechLeadWorkorderManage.vue` — 直接使用后端数据

## ADDED Requirements

### Requirement: 工单可见性 - 管理员
系统 SHALL 允许具有 `ADMIN` 角色的用户查看所有工单，不受任何过滤限制。

#### Scenario: 管理员查看工单列表
- **GIVEN** 当前登录用户具有 ADMIN 角色
- **WHEN** 该用户调用工单列表查询接口
- **THEN** 系统返回所有工单数据，不做任何角色过滤

### Requirement: 工单可见性 - 客户
系统 SHALL 确保客户（`CUSTOMER` 角色）只能查看自己作为客户（`customerId` 等于自身关联客户ID）的工单，不能查看其他客户的工单。

#### Scenario: 客户查看自己的工单
- **GIVEN** 当前登录用户为客户角色，关联客户ID为 100
- **WHEN** 该用户调用工单列表查询接口
- **THEN** 系统仅返回 `customerId = 100` 的工单

#### Scenario: 客户无法查看其他客户的工单
- **GIVEN** 当前登录用户为客户角色，关联客户ID为 100
- **WHEN** 该用户调用工单列表查询接口
- **THEN** 系统不返回任何 `customerId != 100` 的工单

### Requirement: 工单可见性 - 课长
系统 SHALL 确保课长（`TECH_LEAD` 角色）可以看到属于本部门的工单。课长能看到所有状态为本部门相关的工单，包括待分配、已分配、处理中等。

> **说明**：课长的可见范围基于其所属部门。课长能看到本部门下属工程师创建的或被分配给本部门工程师的工单，以及客户发起的本部门范围内的工单。

#### Scenario: 课长查看本部门工单
- **GIVEN** 当前登录用户为课长角色，所属部门ID为 10
- **WHEN** 该用户调用工单列表查询接口
- **THEN** 系统返回以下工单：
  - 创建者属于部门ID=10的工单
  - 被分配给部门ID=10下工程师的工单
  - 客户发起的、属于部门ID=10管辖范围的工单

### Requirement: 工单可见性 - 工程师
系统 SHALL 确保工程师（`ENGINEER` 角色）只能看到分配给自己（`employeeId` 等于自身ID）的工单，以及自己创建的工单。

#### Scenario: 工程师查看分配给自己或自己创建的工单
- **GIVEN** 当前登录用户为工程师角色，员工ID为 50
- **WHEN** 该用户调用工单列表查询接口
- **THEN** 系统返回 `employeeId = 50` 或 `createdBy.employeeId = 50` 的工单

### Requirement: 工单可见性 - 部长
系统 SHALL 确保部长（`MANAGER`/`DIRECTOR` 角色）可以看到工单，特别是课长超时未分配而推送给部长的工单（升级/超时工单）。部长还可以看到其下属课长部门的工单。

> **说明**：部长是课长的上级。当课长超时未分配工单时，工单会升级推送给部长。部长可以看到这些升级工单以及其管辖范围内的所有工单。

#### Scenario: 部长查看升级工单
- **GIVEN** 当前登录用户为部长角色
- **AND** 存在课长超时未分配的工单（已升级/推送给部长）
- **WHEN** 该用户调用工单列表查询接口
- **THEN** 系统返回这些升级工单及部长管辖范围内的所有工单

### Requirement: 工单可见性 - 业务助理
系统 SHALL 确保业务助理（`SALES`/`ASSISTANT` 角色）只能查看自己创建的工单、以及状态为"待业务确认"的工单。

#### Scenario: 业务助理查看相关工单
- **GIVEN** 当前登录用户为业务助理角色，员工ID为 30
- **WHEN** 该用户调用工单列表查询接口
- **THEN** 系统返回：
  - `createdBy.employeeId = 30` 的工单
  - 状态为 `ASSISTANT_CONFIRM` 的工单

### Requirement: 工单可见性 - 通用规则
系统 SHALL 确保与工单无任何关联的用户（非管理员、非创建者、非客户、非分配工程师、非课长、非部长、非业务助理）不能看到该工单。

#### Scenario: 无关用户无法看到工单
- **GIVEN** 当前登录用户 John（工程师，员工ID=100）与工单WO-001（客户ID=200，分配工程师ID=50，创建者ID=30）没有任何关联
- **WHEN** John 调用工单列表查询接口
- **THEN** 系统不返回工单 WO-001

### Requirement: 后端接口认证保护
系统 SHALL 要求工单相关接口必须经过认证才能访问，未认证请求应返回 401 Unauthorized。

#### Scenario: 未认证用户访问工单接口
- **GIVEN** 用户未登录
- **WHEN** 该用户调用 `/api/workorders` 接口
- **THEN** 系统返回 401 Unauthorized

## 角色可见性规则汇总表

| 角色 | 可见范围 | 说明 |
|------|----------|------|
| ADMIN（管理员） | 所有工单 | 无限制 |
| CUSTOMER（客户） | `customerId = 自身关联客户ID` | 只能看自己的工单 |
| TECH_LEAD（课长） | 本部门范围内的工单 | 包括本部门工程师的工单 |
| ENGINEER（工程师） | `employeeId = 自身ID` 或自己创建的 | 分配给自己 + 自己创建 |
| MANAGER/DIRECTOR（部长） | 升级工单 + 管辖范围内所有工单 | 上级可见下级 |
| SALES/ASSISTANT（业务助理） | 自己创建的 + 待业务确认的 | 仅自身相关 |
| 其他无关用户 | 无 | 看不到任何工单 |
