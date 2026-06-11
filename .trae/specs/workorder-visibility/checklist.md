# 工单可见性控制 - 验证检查清单

## 后端 - 用户身份获取
- [x] Controller 能从 SecurityContext 正确获取当前登录用户的角色
- [x] Controller 能从 SecurityContext 正确获取当前登录用户的用户ID
- [x] Controller 能从 SecurityContext 正确获取当前登录用户的关联客户ID（客户角色）
- [x] Controller 能从 SecurityContext 正确获取当前登录用户的所属部门ID
- [x] 客户角色强制覆盖 customerId 参数（禁止客户传入其他 customerId）
- [x] 未认证请求返回 401 Unauthorized

## 后端 - 角色过滤逻辑
- [x] ADMIN 角色：返回所有工单，不加任何过滤条件
- [x] CUSTOMER 角色：仅返回 customerId = 当前用户关联客户ID 的工单
- [x] CUSTOMER 角色：不能通过传入其他 customerId 参数绕过过滤
- [x] TECH_LEAD 角色：仅返回本部门范围内的工单
- [x] TECH_LEAD 角色：不能看到其他部门的工单
- [x] ENGINEER 角色：仅返回 employeeId = 自身ID 或自己创建的工单
- [x] ENGINEER 角色：不能看到分配给其他工程师的工单
- [x] MANAGER/DIRECTOR 角色：返回本部门工单 + 管辖范围内所有工单
- [x] SALES/ASSISTANT 角色：仅返回自己创建的工单
- [x] 无关用户：返回所有工单（默认无过滤）

## 后端 - SecurityConfig
- [x] `/api/workorders/**` 接口需要认证
- [x] 未认证请求返回 401 状态码
- [x] 不影响其他公开接口的正常访问

## 后端 - JWT Token
- [x] CustomUserDetails 包含 employeeId、role、department 三个扩展字段
- [x] JwtTokenProvider.generateToken() 将 userId、role、department 写入 JWT claims
- [x] JwtTokenProvider.getAuthentication() 从 token 恢复 CustomUserDetails
- [x] CustomUserDetailsService 返回 CustomUserDetails 实例

## 前端 - 清理客户端过滤
- [x] `workorderFlowStore.js` 中 `getVisibleWorkorders()` 已从导出移除
- [x] `workorderFlowStore.js` 中 `getCustomerWorkorders()` 已从导出移除
- [x] 相关未使用代码已清理

## 前端 - 工单列表页面
- [x] `Workorder.vue` 直接使用 store 数据，无客户端角色过滤
- [x] `StaffWorkorderList.vue` 直接使用 store 数据，无客户端角色过滤
- [x] `TechLeadWorkorderManage.vue` 无需修改（未使用 getVisibleWorkorders）
- [x] 各页面操作按钮（接单/分配/课长确认/驳回/审核）逻辑未受影响

## 端到端集成测试 (需要运行环境)
- [ ] 管理员能看到所有工单
- [ ] 客户A能看到自己（customerId=A）的工单
- [ ] 客户A看不到客户B（customerId=B）的工单
- [ ] 课长能看到本部门工单
- [ ] 课长看不到其他部门工单
- [ ] 工程师A能看到分配给自己的工单
- [ ] 工程师A能看到自己创建的工单
- [ ] 工程师A看不到分配给工程师B的工单
- [ ] 部长能看到课长超时升级的工单
- [ ] 业务助理能看到自己创建的工单
- [ ] 未登录用户访问工单接口返回 401
- [ ] 无关用户看不到任何工单

## 代码文件变更清单
| 文件 | 变更类型 | 说明 |
|------|----------|------|
| `backend/.../security/CustomUserDetails.java` | 新建 | 扩展 UserDetails，包含 employeeId/role/department |
| `backend/.../security/CustomUserDetailsService.java` | 修改 | 返回 CustomUserDetails |
| `backend/.../security/JwtTokenProvider.java` | 修改 | JWT claims 增加 userId/role/department |
| `backend/.../config/SecurityConfig.java` | 修改 | /workorders/** 需要认证 + 401 处理 |
| `backend/.../controller/WorkorderController.java` | 修改 | 从 SecurityContext 获取当前用户 |
| `backend/.../service/WorkorderService.java` | 修改 | 增加角色可见性过滤逻辑 |
| `backend/.../repository/WorkorderRepository.java` | 修改 | JPQL 增强，新增过滤参数 |
| `backend/.../repository/EmployeeRepository.java` | 修改 | 新增 findByDepartment() |
| `backend/.../repository/ContactRepository.java` | 修改 | 新增 findByPhone() |
| `src/stores/workorderFlowStore.js` | 修改 | 移除 getVisibleWorkorders/getCustomerWorkorders 导出 |
| `src/views/Workorder.vue` | 修改 | 移除客户端角色过滤调用 |
| `src/views/StaffWorkorderList.vue` | 修改 | 移除客户端角色过滤调用 |
