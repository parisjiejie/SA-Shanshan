# 工单流程引擎使用说明

## 概述

本流程引擎采用配置化设计，支持不同工单类型、不同业务场景的灵活流程配置。

## 核心模块

### 1. 流程配置管理 (workflowConfigStore.js)

负责管理流程模板定义、节点配置、表单字段配置等。

**主要功能：**
- 流程模板CRUD操作
- 节点配置管理
- 表单字段配置
- 权限控制配置

**使用示例：**
```javascript
import { useWorkflowConfigStore } from '@/stores/workflowConfigStore'

const workflowStore = useWorkflowConfigStore()

// 获取工单类型的默认流程模板
const template = workflowStore.getTemplateByWorkorderType('维修', '现场维修')

// 获取节点配置
const nodeConfig = workflowStore.getNodeConfig(template.id, 'DISPATCHED')

// 获取节点可用操作
const actions = workflowStore.getNodeActions(template.id, 'DISPATCHED')

// 检查操作权限
const canDispatch = workflowStore.canExecuteAction(
  template.id, 
  'CREATED', 
  'dispatch', 
  '调度员'
)
```

### 2. 流程实例管理 (workflowInstanceStore.js)

负责管理工单流程的执行状态、历史记录等。

**主要功能：**
- 流程实例生命周期管理
- 流程操作执行
- 流转历史记录
- 流程统计分析

**使用示例：**
```javascript
import { useWorkflowInstanceStore } from '@/stores/workflowInstanceStore'

const instanceStore = useWorkflowInstanceStore()

// 初始化流程实例
const instance = instanceStore.initInstance(workorder)

// 执行流程操作
const result = await instanceStore.executeAction({
  workorderId: 'WO001',
  action: 'dispatch',
  operator: 'user001',
  operatorRole: '调度员',
  formData: { engineer: '王工程师', priority: 'high' }
})

// 获取流转历史
const history = instanceStore.getFlowHistory('WO001')

// 获取流程进度
const progress = instanceStore.getFlowProgress('WO001')
```

### 3. 动态表单组件 (DynamicForm.vue)

根据配置动态渲染表单字段。

**支持的字段类型：**
- text - 文本输入
- textarea - 文本域
- number - 数字输入
- select - 下拉选择
- date/datetime - 日期/日期时间
- rate - 评分
- location - 位置选择
- imageUpload - 图片上传
- signature - 电子签名
- partsSelector - 配件选择器
- inspectionItems - 巡检项目

**使用示例：**
```vue
<template>
  <DynamicForm
    ref="formRef"
    :fields="formFields"
    v-model="formData"
    @change="handleFieldChange"
  />
</template>

<script setup>
import DynamicForm from '@/components/DynamicForm.vue'

const formFields = [
  { name: 'engineer', label: '工程师', type: 'select', required: true },
  { name: 'priority', label: '优先级', type: 'select', required: true },
  { name: 'remark', label: '备注', type: 'textarea' }
]

const formData = ref({})
const formRef = ref(null)

// 验证表单
const validate = async () => {
  return await formRef.value.validate()
}
</script>
```

### 4. 配置化流程面板 (ConfigurableFlowPanel.vue)

完整的流程操作面板组件，包含步骤条、操作按钮、历史记录等。

**使用示例：**
```vue
<template>
  <ConfigurableFlowPanel
    :workorder="workorder"
    :user-role="currentUserRole"
    :user-id="currentUserId"
    @action="handleFlowAction"
    @statusChange="handleStatusChange"
  />
</template>

<script setup>
import ConfigurableFlowPanel from '@/components/ConfigurableFlowPanel.vue'

const handleFlowAction = (actionData) => {
  console.log('Action:', actionData)
  // actionData包含: workorderId, action, fromStatus, toStatus, formData等
}
</script>
```

## 流程配置管理界面

访问路径：`/workflow/config`

**功能：**
- 查看所有流程模板
- 创建/编辑/删除流程模板
- 配置流程节点
- 配置节点操作
- 预览流程

## 默认流程模板

系统预置了以下流程模板：

### 1. 标准维修流程 (REPAIR_STANDARD)
适用类型：维修
适用场景：现场维修、返厂维修

流程节点：
1. 已创建 → 派单 → 已派单
2. 已派单 → 接单/拒单 → 已接单/已创建
3. 已接单 → 到场打卡 → 到场打卡
4. 到场打卡 → 开始作业 → 作业中
5. 作业中 → 制作服务报告 → 报告待签字
6. 报告待签字 → 客户签字 → 报告已签字
7. 报告已签字 → 完工打卡 → 已完工
8. 已完工 → 客户评价 → 已评价
9. 已评价 → 制作结算单 → 结算待签字
10. 结算待签字 → 结算单签字 → 结算已签字
11. 结算已签字 → 完成工单 → 已完成

### 2. 标准安装流程 (INSTALL_STANDARD)
适用类型：安装
适用场景：新装、移机

### 3. 标准巡检流程 (INSPECTION_STANDARD)
适用类型：巡检
适用场景：定期巡检、专项巡检

## 扩展开发

### 添加新的流程模板

```javascript
// 在 workflowConfigStore.js 中的 DefaultFlowTemplates 数组添加
{
  id: 'flow_custom',
  code: 'CUSTOM',
  name: '自定义流程',
  version: '1.0.0',
  workorderTypes: ['维修'],
  scenes: ['特殊场景'],
  nodes: [
    // 定义节点...
  ]
}
```

### 添加新的表单字段类型

```javascript
// 在 DynamicForm.vue 中添加新的字段渲染逻辑
<el-form-item v-else-if="field.type === 'customType'">
  <!-- 自定义渲染 -->
</el-form-item>
```

### 添加新的操作类型

```javascript
// 在节点配置的 actions 中添加
{
  code: 'customAction',
  label: '自定义操作',
  type: 'primary',
  nextNode: 'NEXT_STATUS',
  roles: ['管理员'],
  formFields: ['field1', 'field2']
}
```

## 注意事项

1. **数据持久化**：当前实现使用内存存储，生产环境需要对接后端API
2. **并发控制**：多用户同时操作同一工单时需要加锁机制
3. **权限控制**：建议结合后端进行权限校验
4. **流程版本**：流程模板修改后，正在进行的工单仍使用旧版本

## 后续优化方向

1. 可视化流程设计器
2. 流程版本管理
3. 流程性能监控
4. 流程数据分析
5. 流程自动化规则
