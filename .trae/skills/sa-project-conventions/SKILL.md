---
name: "sa-project-conventions"
description: "SA项目技术栈、项目结构、代码规范约定。使用框架/库、命名规则、文件组织方式。新增页面或组件时必须参考此技能。"
---

# SA — 项目技术约定

> ✅ 2026-06-11

---

## 一、技术栈

| 层面 | 技术 |
|------|------|
| 前端框架 | Vue 3（Composition API + `<script setup>`） |
| UI 组件库 | Element Plus |
| 状态管理 | Pinia（组合式 stores）+ Vue `reactive`/`ref` |
| 路由 | Vue Router 4（`createWebHistory`） |
| 构建工具 | Vite 5 |
| 样式方案 | Scoped CSS + Element Plus 主题变量 |
| 图标 | `@element-plus/icons-vue` |
| 数据持久化 | `localStorage`（演示环境，无后端数据库） |

---

## 二、项目目录结构

```
src/
├── App.vue                    # 根组件（PC 布局 + router-view）
├── main.js                    # 入口
├── router/
│   └── index.js               # 路由定义 + 导航守卫
├── stores/                    # Pinia / reactive 状态管理
│   ├── workorderFlowStore.js  # 工单流程核心（状态机）
│   ├── quotationStore.js      # 报价单
│   ├── notificationStore.js   # 通知中心
│   ├── customerStore.js       # 客户数据
│   └── ...
├── views/                     # 页面组件（按功能命名）
│   ├── Dashboard.vue          # PC 看板
│   ├── Workorder.vue          # PC 工单管理
│   ├── UnifiedLogin.vue       # 统一登录页
│   ├── StaffMobileWorkspace.vue  # 移动端工作台
│   ├── StaffWorkorderList.vue    # 移动端工单列表
│   ├── StaffWorkorderCreate.vue  # 移动端创建工单
│   ├── CustomerMobileWorkspace.vue # 客户端工作台
│   └── ...
├── components/                # 可复用组件
│   ├── ConfigurableTable.vue  # 可配置表格
│   └── ...
└── assets/                    # 静态资源
```

---

## 三、命名约定

| 类别 | 约定 | 示例 |
|------|------|------|
| Vue 组件 | PascalCase | `StaffMobileWorkspace.vue` |
| Store 文件 | camelCase + Store | `workorderFlowStore.js` |
| 路由路径 | kebab-case | `/staff-mobile-workspace` |
| CSS 类名 | kebab-case 或 BEM | `.search-bar`, `.action-item` |
| 常量 | UPPER_SNAKE_CASE | `WorkorderStatus.PENDING_ASSIGN` |
| 函数 | camelCase | `createWorkorder()`, `loadFromStorage()` |

---

## 四、代码风格

- 使用 `<script setup>` + Composition API（不使用 Options API）
- 状态管理：`reactive()` 用于对象/数组，`ref()` 用于基本类型
- 对话框表单使用 `v-model` 双向绑定
- Element Plus 组件属性优先使用 `:attr` 动态绑定而非字符串
- 所有用户数据存储在 `localStorage`，以 JSON 格式序列化
- 使用 `toRaw()` 剥离 Vue 代理层后再持久化到 `localStorage`

---

## 五、PC 端 vs 移动端策略

- **PC 端**：Vue Router 控制所有页面切换
- **移动端**：同一路由通过 CSS 媒体查询或独立页面组件适配
- 工程师和客户角色**没有 PC 端工作台**，只有移动端页面
- 侧边栏菜单使用 Element Plus `<el-menu>` + `router` 属性

---

## 六、关键库版本

| 库 | 版本 |
|----|------|
| vue | 3.x |
| vue-router | 4.x |
| element-plus | 2.x |
| vite | 5.x |
| @element-plus/icons-vue | 2.x |
