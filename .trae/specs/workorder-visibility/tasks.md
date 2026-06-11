# Tasks

## [x] Task 1: 后端 - 获取当前登录用户信息
- **Priority**: P0
- **Depends On**: None
- **Status**: ✅ 已完成
- **Description**:
  - 检查并完善 JWT Token 解析逻辑，确保能从 SecurityContext 中获取当前登录用户的角色、用户ID、关联客户ID、所属部门ID 等信息
  - 在 Controller 层获取这些信息并传递给 Service 层
  - 确保对于未认证请求返回 401
- **Steps**:
  - [x] 1.1 检查 `SecurityConfig.java`，确认 JWT Filter 正常工作
  - [x] 1.2 检查 `WorkorderController.getList()`，从 SecurityContext 获取当前用户
  - [x] 1.3 将用户信息（role, userId, customerId, departmentId）封装传入 Service

## [x] Task 2: 后端 - WorkorderService 增加角色过滤逻辑
- **Priority**: P0
- **Depends On**: Task 1
- **Status**: ✅ 已完成
- **Description**:
  - 在 `WorkorderService.getList()` 中根据当前用户角色构建不同的查询条件
  - ADMIN: 不加任何过滤，返回所有工单
  - CUSTOMER: 添加 `customerId = 当前用户关联客户ID` 条件
  - TECH_LEAD: 添加本部门范围条件（创建者所在部门 或 分配工程师所在部门 = 当前用户部门）
  - ENGINEER: 添加 `employeeId = 当前用户ID OR createdBy.employeeId = 当前用户ID` 条件
  - MANAGER/DIRECTOR: 添加管辖范围条件（升级工单 + 下属课长部门工单）
  - SALES/ASSISTANT: 添加 `createdBy.employeeId = 当前用户ID OR status = ASSISTANT_CONFIRM` 条件
- **Steps**:
  - [x] 2.1 在 `WorkorderService` 中新增 `getWorkordersForDepartment()` / `getWorkordersForEngineer()` 方法
  - [x] 2.2 为每种角色实现对应的过滤逻辑
  - [x] 2.3 修改 `getList()` 方法签名，接收用户角色和用户ID参数

## [x] Task 3: 后端 - WorkorderController 修改 getList 接口
- **Priority**: P0
- **Depends On**: Task 1, Task 2
- **Status**: ✅ 已完成
- **Description**:
  - 修改 `WorkorderController.getList()` 方法，从 SecurityContext 获取当前用户信息
  - 将用户信息传递给 `WorkorderService.getList()`
  - 对于客户角色，自动将 `customerId` 参数锁定为当前用户关联的客户ID，禁止客户传入其他 customerId 查看其他客户的工单
- **Steps**:
  - [x] 3.1 修改 Controller 方法，获取当前用户认证信息
  - [x] 3.2 对客户角色强制覆盖 `customerId` 参数
  - [x] 3.3 将用户角色和ID传入 Service 层

## [x] Task 4: 后端 - WorkorderRepository 增强查询能力
- **Priority**: P0
- **Depends On**: Task 2
- **Status**: ✅ 已完成
- **Description**:
  - 根据 Service 层的过滤需求，检查 Repository 层的 JPQL 是否支持新的过滤条件
  - 如需支持按部门过滤，可能需要 JOIN 查询或子查询
  - 如需支持按创建者过滤，添加 `createdBy` 相关的查询条件
- **Steps**:
  - [x] 4.1 分析 Workorder 实体关联关系，确认是否有关联 Employee/Department
  - [x] 4.2 增强 `searchWorkorders` JPQL，新增 `createdBy`、`creatorIdIn`、`employeeIdIn`、`includeStatuses` 参数
  - [x] 4.3 EmployeeRepository 新增 `findByDepartment()` 方法

## [x] Task 5: 后端 - SecurityConfig 增加工单接口认证要求
- **Priority**: P0
- **Depends On**: Task 1
- **Status**: ✅ 已完成
- **Description**:
  - 修改 `SecurityConfig.java`，将工单相关接口（`/api/workorders/**`）从 `permitAll` 改为需要认证
  - 确保未认证请求返回 401
- **Steps**:
  - [x] 5.1 在 SecurityConfig 中为 `/workorders/**` 添加 `.authenticated()` 要求
  - [x] 5.2 配置 `exceptionHandling` 返回 401 JSON 响应

## [x] Task 6: 前端 - 移除 workorderFlowStore 中的客户端过滤逻辑
- **Priority**: P1
- **Depends On**: Task 3
- **Status**: ✅ 已完成
- **Description**:
  - 移除 `workorderFlowStore.js` 中的 `getVisibleWorkorders()` 函数
  - 移除依赖 localStorage 的模拟数据过滤逻辑
  - 前端直接使用后端 API 返回的已过滤数据
- **Steps**:
  - [x] 6.1 从导出列表中移除 `getVisibleWorkorders()`
  - [x] 6.2 从导出列表中移除 `getCustomerWorkorders()`
  - [x] 6.3 清理相关未使用的代码

## [x] Task 7: 前端 - 更新工单列表页面使用后端数据
- **Priority**: P1
- **Depends On**: Task 6
- **Status**: ✅ 已完成
- **Description**:
  - 更新 `Workorder.vue`（桌面端工单列表），直接使用 store 数据，不做二次过滤
  - 更新 `StaffWorkorderList.vue`（移动端工单列表），直接使用 store 数据，不做二次过滤
  - 确保各页面的操作按钮（接单、分配、确认等）仍按角色正确显示
- **Steps**:
  - [x] 7.1 更新 Workorder.vue，移除对 getVisibleWorkorders() 的调用和 localStorage auth 读取
  - [x] 7.2 更新 StaffWorkorderList.vue，移除对 getVisibleWorkorders() 的调用和 localStorage auth 读取
  - [x] 7.3 TechLeadWorkorderManage.vue 未使用 getVisibleWorkorders()，无需修改
  - [x] 7.4 操作按钮逻辑未受影响

## [ ] Task 8: 集成测试与验证
- **Priority**: P0
- **Depends On**: Task 1-7
- **Description**:
  - 模拟不同角色用户登录，验证各自只能看到应有范围的工单
  - 验证客户1无法看到客户2的工单
  - 验证工程师只能看到分配给自己和自己创建的工单
  - 验证课长只能看到本部门工单
  - 验证部长能看到升级工单
  - 验证管理员能看到所有工单
  - 验证未登录请求返回 401
- **Steps**:
  - [ ] 8.1 管理员角色测试
  - [ ] 8.2 客户角色测试（含跨客户隔离测试）
  - [ ] 8.3 课长角色测试（含跨部门隔离测试）
  - [ ] 8.4 工程师角色测试（含跨工程师隔离测试）
  - [ ] 8.5 部长角色测试
  - [ ] 8.6 业务助理角色测试
  - [ ] 8.7 未认证用户测试

# Task Dependencies
- Task 2 依赖 Task 1
- Task 3 依赖 Task 1, Task 2
- Task 4 依赖 Task 2
- Task 5 依赖 Task 1
- Task 6 依赖 Task 3
- Task 7 依赖 Task 6
- Task 8 依赖 Task 1-7
