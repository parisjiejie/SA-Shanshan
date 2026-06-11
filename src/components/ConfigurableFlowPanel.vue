<template>
  <div class="configurable-flow-panel">
    <!-- 加载状态 -->
    <el-skeleton v-if="loading" :rows="6" animated />
    
    <template v-else>
      <!-- 流程步骤条 -->
      <div class="flow-steps-section">
        <div class="flow-steps desktop-steps">
          <el-steps :active="currentStepIndex" finish-status="success" align-center>
            <el-step
              v-for="(step, index) in flowSteps"
              :key="step.code"
              :title="step.name"
              :description="step.description"
              :status="getStepStatus(index)"
            />
          </el-steps>
        </div>
        
        <!-- 移动端简化版 -->
        <div class="flow-steps mobile-steps">
          <div class="mobile-progress">
            <div class="progress-header">
              <span class="progress-title">工单进度</span>
              <span class="progress-text">{{ currentStepIndex + 1 }} / {{ flowSteps.length }}</span>
            </div>
            <el-progress 
              :percentage="((currentStepIndex + 1) / flowSteps.length * 100)" 
              :show-text="false"
              :stroke-width="8"
            />
            <div class="current-step-info">
              <el-tag :type="currentNodeConfig?.type === 'end' ? 'success' : 'primary'" size="large">
                {{ currentStatusText }}
              </el-tag>
              <span class="step-description">{{ currentNodeConfig?.description }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 当前状态显示 -->
      <div class="current-status-section">
        <div class="status-card">
          <div class="status-icon">
            <el-icon :size="32" :color="statusIconColor">
              <component :is="statusIcon" />
            </el-icon>
          </div>
          <div class="status-info">
            <div class="status-title">{{ currentStatusText }}</div>
            <div class="status-desc">{{ currentNodeConfig?.description }}</div>
          </div>
          <div class="status-meta" v-if="currentHandler">
            <el-tag size="small">处理人: {{ currentHandler }}</el-tag>
          </div>
        </div>
      </div>

      <!-- 可执行操作区域 -->
      <div v-if="availableActions.length > 0" class="actions-section">
        <el-divider>
          <el-icon><Operation /></el-icon>
          流转操作
        </el-divider>
        
        <div class="action-buttons">
          <el-button
            v-for="action in availableActions"
            :key="action.code"
            :type="action.type || 'default'"
            size="large"
            @click="handleActionClick(action)"
            class="action-btn"
          >
            <el-icon v-if="action.icon"><component :is="action.icon" /></el-icon>
            {{ action.label }}
          </el-button>
        </div>
      </div>

      <!-- 操作表单对话框 -->
      <el-dialog
        v-model="actionDialog.visible"
        :title="actionDialog.title"
        width="600px"
        destroy-on-close
      >
        <el-alert
          v-if="actionDialog.action?.confirmMessage"
          :title="actionDialog.action.confirmMessage"
          type="info"
          :closable="false"
          show-icon
          class="action-alert"
        />
        
        <DynamicForm
          v-if="actionDialog.formFields.length > 0"
          ref="actionFormRef"
          :fields="actionDialog.formFields"
          v-model="actionDialog.formData"
          @location="handleLocationRequest"
        />
        
        <template #footer>
          <el-button @click="actionDialog.visible = false">取消</el-button>
          <el-button 
            :type="actionDialog.action?.type || 'primary'" 
            @click="confirmAction"
            :loading="actionDialog.loading"
          >
            确认
          </el-button>
        </template>
      </el-dialog>

      <!-- 流转记录时间线 -->
      <div v-if="flowHistory.length > 0" class="history-section">
        <el-divider>
          <el-icon><Timer /></el-icon>
          流转记录
        </el-divider>
        
        <el-timeline>
          <el-timeline-item
            v-for="(record, index) in flowHistory"
            :key="index"
            :type="getHistoryItemType(record)"
            :color="getHistoryItemColor(record)"
            :timestamp="formatTime(record.time)"
            :hollow="index === 0"
          >
            <el-card shadow="hover" class="history-card">
              <template #header>
                <div class="history-header">
                  <span class="history-title">{{ record.title }}</span>
                  <el-tag size="small" :type="record.status === 'completed' ? 'success' : 'info'">
                    {{ record.operator }}
                  </el-tag>
                </div>
              </template>
              <div class="history-content">
                <p v-if="record.content">{{ record.content }}</p>
                <div v-if="record.formData && Object.keys(record.formData).length > 0" class="history-data">
                  <el-descriptions :column="2" size="small" border>
                    <el-descriptions-item 
                      v-for="(value, key) in record.formData" 
                      :key="key"
                      :label="getFieldLabel(key)"
                    >
                      {{ formatFieldValue(key, value) }}
                    </el-descriptions-item>
                  </el-descriptions>
                </div>
              </div>
            </el-card>
          </el-timeline-item>
        </el-timeline>
      </div>

      <!-- 流程图预览 -->
      <div class="flow-preview-section">
        <el-divider>
          <el-icon><View /></el-icon>
          流程预览
        </el-divider>
        
        <div class="flow-preview">
          <div
            v-for="(node, index) in flowSteps"
            :key="node.code"
            class="flow-node"
            :class="{
              'is-active': node.code === currentStatus,
              'is-completed': isNodeCompleted(node.code),
              'is-pending': isNodePending(node.code)
            }"
          >
            <div class="node-dot">
              <el-icon v-if="isNodeCompleted(node.code)"><Check /></el-icon>
              <span v-else>{{ index + 1 }}</span>
            </div>
            <div class="node-content">
              <div class="node-name">{{ node.name }}</div>
              <div class="node-desc">{{ node.description }}</div>
            </div>
            <div v-if="index < flowSteps.length - 1" class="node-arrow">
              <el-icon><ArrowRight /></el-icon>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { 
  Operation, Timer, View, Check, ArrowRight, 
  Loading, CircleCheck, Warning, InfoFilled 
} from '@element-plus/icons-vue'
import DynamicForm from './DynamicForm.vue'
import { useWorkflowConfigStore, NodeType } from '../stores/workflowConfigStore'

const props = defineProps({
  // 工单数据
  workorder: {
    type: Object,
    required: true
  },
  // 当前用户角色
  userRole: {
    type: String,
    default: '工程师'
  },
  // 当前用户ID
  userId: {
    type: String,
    default: ''
  },
  // 是否加载中
  loading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['action', 'statusChange', 'error'])

const workflowStore = useWorkflowConfigStore()
const actionFormRef = ref(null)

// ==================== 计算属性 ====================

// 当前流程模板
const currentTemplate = computed(() => {
  if (!props.workorder?.type) return null
  return workflowStore.getTemplateByWorkorderType(
    props.workorder.type, 
    props.workorder.scene
  )
})

// 流程所有节点
const flowSteps = computed(() => {
  return currentTemplate.value?.nodes || []
})

// 当前状态
const currentStatus = computed(() => {
  return props.workorder?.flowStatus || 'CREATED'
})

// 当前节点配置
const currentNodeConfig = computed(() => {
  if (!currentTemplate.value) return null
  return workflowStore.getNodeConfig(
    currentTemplate.value.id, 
    currentStatus.value
  )
})

// 当前状态文本
const currentStatusText = computed(() => {
  return currentNodeConfig.value?.name || currentStatus.value
})

// 当前步骤索引
const currentStepIndex = computed(() => {
  return flowSteps.value.findIndex(n => n.code === currentStatus.value)
})

// 当前处理人
const currentHandler = computed(() => {
  return props.workorder?.assignEngineer || ''
})

// 可用操作列表
const availableActions = computed(() => {
  if (!currentTemplate.value || !currentNodeConfig.value) return []
  
  const actions = currentNodeConfig.value.actions || []
  
  // 过滤有权限的操作
  return actions.filter(action => {
    // 检查角色权限
    if (action.roles && !action.roles.includes(props.userRole)) {
      return false
    }
    // 检查条件
    if (action.condition) {
      return evaluateCondition(action.condition)
    }
    return true
  })
})

// 状态图标
const statusIcon = computed(() => {
  const iconMap = {
    [NodeType.START]: InfoFilled,
    [NodeType.TASK]: Loading,
    [NodeType.END]: CircleCheck
  }
  return iconMap[currentNodeConfig.value?.type] || InfoFilled
})

// 状态图标颜色
const statusIconColor = computed(() => {
  const colorMap = {
    [NodeType.START]: '#409EFF',
    [NodeType.TASK]: '#E6A23C',
    [NodeType.END]: '#67C23A'
  }
  return colorMap[currentNodeConfig.value?.type] || '#909399'
})

// 流转历史
const flowHistory = computed(() => {
  return props.workorder?.processRecords || []
})

// ==================== 方法 ====================

// 获取步骤状态
const getStepStatus = (index) => {
  if (index < currentStepIndex.value) return 'success'
  if (index === currentStepIndex.value) return 'process'
  return 'wait'
}

// 检查节点是否已完成
const isNodeCompleted = (nodeCode) => {
  const nodeIndex = flowSteps.value.findIndex(n => n.code === nodeCode)
  return nodeIndex < currentStepIndex.value
}

// 检查节点是否待处理
const isNodePending = (nodeCode) => {
  const nodeIndex = flowSteps.value.findIndex(n => n.code === nodeCode)
  return nodeIndex > currentStepIndex.value
}

// 评估条件
const evaluateCondition = (condition) => {
  if (typeof condition !== 'string') return true
  
  try {
    // 替换变量
    let expr = condition
      .replace(/\{\{workorder\.(\w+)\}\}/g, (match, key) => {
        return JSON.stringify(props.workorder?.[key] || '')
      })
      .replace(/\{\{(\w+)\}\}/g, (match, key) => {
        return JSON.stringify(props.workorder?.variables?.[key] || '')
      })
    
    return new Function('return ' + expr)()
  } catch (e) {
    console.warn('Condition evaluation error:', e)
    return true
  }
}

// 操作对话框状态
const actionDialog = ref({
  visible: false,
  title: '',
  action: null,
  formFields: [],
  formData: {},
  loading: false
})

// 处理操作点击
const handleActionClick = (action) => {
  actionDialog.value = {
    visible: true,
    title: action.label,
    action: action,
    formFields: workflowStore.getActionFormFields(
      currentTemplate.value.id,
      currentStatus.value,
      action.code
    ),
    formData: {},
    loading: false
  }
}

// 确认执行操作
const confirmAction = async () => {
  const { action, formData } = actionDialog.value
  
  // 如果有表单，先验证
  if (actionDialog.value.formFields.length > 0) {
    try {
      await actionFormRef.value?.validate()
    } catch (e) {
      return
    }
  }
  
  actionDialog.value.loading = true
  
  try {
    // 构建操作数据
    const actionData = {
      workorderId: props.workorder.id,
      action: action.code,
      fromStatus: currentStatus.value,
      toStatus: action.nextNode,
      operator: props.userId,
      operatorRole: props.userRole,
      formData: { ...formData },
      timestamp: new Date().toISOString()
    }
    
    // 触发操作事件
    emit('action', actionData)
    
    actionDialog.value.visible = false
  } catch (error) {
    emit('error', error)
  } finally {
    actionDialog.value.loading = false
  }
}

// 处理位置请求
const handleLocationRequest = (fieldName, callback) => {
  // 调用浏览器地理定位API
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = `${position.coords.latitude},${position.coords.longitude}`
        callback(location)
      },
      (error) => {
        console.error('Geolocation error:', error)
        // 使用默认位置或提示用户
        callback('')
      }
    )
  } else {
    callback('')
  }
}

// 获取历史记录项类型
const getHistoryItemType = (record) => {
  const typeMap = {
    'completed': 'success',
    'cancelled': 'danger',
    'rejected': 'warning'
  }
  return typeMap[record.status] || 'primary'
}

// 获取历史记录项颜色
const getHistoryItemColor = (record) => {
  const colorMap = {
    'completed': '#67C23A',
    'cancelled': '#F56C6C',
    'rejected': '#E6A23C'
  }
  return colorMap[record.status] || '#409EFF'
}

// 获取字段标签
const getFieldLabel = (fieldName) => {
  const field = workflowStore.formFieldConfigs[fieldName]
  return field?.label || fieldName
}

// 格式化字段值
const formatFieldValue = (fieldName, value) => {
  const field = workflowStore.formFieldConfigs[fieldName]
  
  if (field?.type === 'select' && field.options) {
    const option = field.options.find(o => o.value === value)
    return option?.label || value
  }
  
  if (Array.isArray(value)) {
    return value.length + ' 项'
  }
  
  return value
}

// 格式化时间
const formatTime = (time) => {
  if (!time) return ''
  const date = new Date(time)
  return date.toLocaleString('zh-CN')
}

// ==================== 监听 ====================

watch(() => props.workorder?.flowStatus, (newStatus, oldStatus) => {
  if (newStatus && newStatus !== oldStatus) {
    emit('statusChange', {
      workorderId: props.workorder.id,
      from: oldStatus,
      to: newStatus,
      timestamp: new Date().toISOString()
    })
  }
})
</script>

<style scoped>
.configurable-flow-panel {
  padding: 20px;
}

.flow-steps-section {
  margin-bottom: 24px;
}

.desktop-steps {
  display: block;
}

.mobile-steps {
  display: none;
}

@media (max-width: 768px) {
  .desktop-steps {
    display: none;
  }
  
  .mobile-steps {
    display: block;
  }
}

.mobile-progress {
  background: #f5f7fa;
  border-radius: 8px;
  padding: 16px;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.progress-title {
  font-weight: 600;
  color: #303133;
}

.progress-text {
  color: #909399;
  font-size: 14px;
}

.current-step-info {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 12px;
}

.step-description {
  color: #606266;
  font-size: 14px;
}

.current-status-section {
  margin-bottom: 24px;
}

.status-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: linear-gradient(135deg, #f5f7fa 0%, #ffffff 100%);
  border-radius: 12px;
  border: 1px solid #e4e7ed;
}

.status-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  background: #fff;
  border-radius: 50%;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.status-info {
  flex: 1;
}

.status-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
}

.status-desc {
  font-size: 14px;
  color: #606266;
}

.actions-section {
  margin-bottom: 24px;
}

.action-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: center;
}

.action-btn {
  min-width: 120px;
}

.action-alert {
  margin-bottom: 20px;
}

.history-section {
  margin-bottom: 24px;
}

.history-card {
  margin-bottom: 12px;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.history-title {
  font-weight: 600;
  color: #303133;
}

.history-content {
  color: #606266;
  font-size: 14px;
}

.history-data {
  margin-top: 12px;
}

.flow-preview-section {
  margin-top: 24px;
}

.flow-preview {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px;
  background: #f5f7fa;
  border-radius: 8px;
}

.flow-node {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #fff;
  border-radius: 8px;
  border: 2px solid #dcdfe6;
  transition: all 0.3s;
}

.flow-node.is-active {
  border-color: #409EFF;
  background: #ecf5ff;
  box-shadow: 0 2px 12px rgba(64, 158, 255, 0.2);
}

.flow-node.is-completed {
  border-color: #67C23A;
  background: #f0f9eb;
}

.flow-node.is-pending {
  opacity: 0.6;
}

.node-dot {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: #dcdfe6;
  border-radius: 50%;
  font-size: 14px;
  font-weight: 600;
  color: #606266;
}

.flow-node.is-active .node-dot {
  background: #409EFF;
  color: #fff;
}

.flow-node.is-completed .node-dot {
  background: #67C23A;
  color: #fff;
}

.node-content {
  flex: 1;
}

.node-name {
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
}

.node-desc {
  font-size: 12px;
  color: #909399;
}

.node-arrow {
  display: none;
}
</style>
