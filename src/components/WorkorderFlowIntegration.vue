<template>
  <div class="workorder-flow-integration">
    <!-- 使用新的配置化流程面板 -->
    <ConfigurableFlowPanel
      :workorder="workorder"
      :user-role="currentUserRole"
      :user-id="currentUserId"
      :loading="flowLoading"
      @action="handleFlowAction"
      @statusChange="handleStatusChange"
      @error="handleFlowError"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import ConfigurableFlowPanel from './ConfigurableFlowPanel.vue'
import { useWorkflowInstanceStore } from '../stores/workflowInstanceStore'
import { ElMessage, ElMessageBox } from 'element-plus'

const props = defineProps({
  workorder: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['update:workorder', 'refresh'])

const workflowInstanceStore = useWorkflowInstanceStore()

// 当前用户信息（实际应从用户Store获取）
const currentUserRole = ref('工程师')
const currentUserId = ref('engineer_001')
const flowLoading = ref(false)

// ==================== 流程操作处理 ====================

/**
 * 处理流程操作
 * @param {Object} actionData - 操作数据
 */
const handleFlowAction = async (actionData) => {
  flowLoading.value = true
  
  try {
    // 确保流程实例已初始化
    let instance = workflowInstanceStore.getInstance(props.workorder.id)
    if (!instance) {
      instance = workflowInstanceStore.initInstance(props.workorder)
    }
    
    // 执行流程操作
    const result = await workflowInstanceStore.executeAction({
      workorderId: props.workorder.id,
      action: actionData.action,
      operator: currentUserId.value,
      operatorRole: currentUserRole.value,
      formData: actionData.formData,
      remark: actionData.remark
    })
    
    // 更新工单状态
    const updatedWorkorder = {
      ...props.workorder,
      flowStatus: result.toStatus,
      status: getStatusText(result.toStatus),
      lastAction: actionData.action,
      lastActionTime: result.timestamp,
      processRecords: workflowInstanceStore.getFlowHistory(props.workorder.id)
    }
    
    // 根据操作类型更新特定字段
    updateWorkorderByAction(updatedWorkorder, actionData.action, actionData.formData)
    
    emit('update:workorder', updatedWorkorder)
    
    ElMessage.success(`${actionData.action} 操作成功`)
    
    // 如果流程已完成，提示用户
    if (result.isCompleted) {
      ElMessage.success('工单流程已完成')
    }
    
    // 刷新父组件数据
    emit('refresh')
    
  } catch (error) {
    console.error('Flow action error:', error)
    ElMessage.error(error.message || '操作失败')
  } finally {
    flowLoading.value = false
  }
}

/**
 * 根据操作类型更新工单字段
 */
const updateWorkorderByAction = (workorder, action, formData) => {
  switch (action) {
    case 'dispatch':
      if (formData.engineer) {
        workorder.assignEngineer = formData.engineer
      }
      if (formData.priority) {
        workorder.priority = formData.priority
      }
      break
      
    case 'accept':
      workorder.acceptTime = new Date().toISOString()
      break
      
    case 'arrive':
      workorder.arriveTime = formData.arriveTime || new Date().toISOString()
      workorder.arriveLocation = formData.location
      break
      
    case 'createReport':
      workorder.report = {
        faultDescription: formData.faultDescription,
        solution: formData.solution,
        parts: formData.parts || [],
        serviceDate: formData.serviceDate
      }
      break
      
    case 'complete':
      workorder.completeTime = formData.completeTime || new Date().toISOString()
      workorder.workContent = formData.workContent
      workorder.duration = formData.duration
      workorder.finishTime = formData.completeTime
      break
      
    case 'evaluate':
      workorder.evaluation = {
        rating: formData.rating,
        comment: formData.comment,
        evaluateTime: new Date().toISOString()
      }
      break
      
    case 'createSettlement':
      workorder.settlement = {
        laborCost: formData.laborCost,
        partsCost: formData.partsCost,
        totalAmount: formData.totalAmount
      }
      break
      
    case 'finish':
      workorder.finishTime = new Date().toISOString()
      break
      
    case 'cancel':
      workorder.cancelTime = new Date().toISOString()
      workorder.cancelReason = formData.cancelReason
      break
  }
}

/**
 * 获取状态显示文本
 */
const getStatusText = (status) => {
  const statusMap = {
    'CREATED': '待派单',
    'DISPATCHED': '已派单',
    'ACCEPTED': '已接单',
    'ARRIVED': '到场打卡',
    'WORKING': '作业中',
    'REPORT_CREATED': '报告待签字',
    'REPORT_SIGNED': '报告已签字',
    'COMPLETED': '已完工',
    'EVALUATED': '已评价',
    'SETTLEMENT_CREATED': '结算待签字',
    'SETTLEMENT_SIGNED': '结算已签字',
    'FINISHED': '已完成',
    'CANCELLED': '已取消'
  }
  return statusMap[status] || status
}

/**
 * 处理状态变化
 */
const handleStatusChange = (changeInfo) => {
  console.log('Status changed:', changeInfo)
  // 可以在这里发送通知、记录日志等
}

/**
 * 处理流程错误
 */
const handleFlowError = (error) => {
  console.error('Flow error:', error)
  ElMessage.error(error.message || '流程执行出错')
}

// ==================== 生命周期 ====================

onMounted(() => {
  // 如果工单没有流程实例，初始化一个
  if (props.workorder.id && !workflowInstanceStore.getInstance(props.workorder.id)) {
    workflowInstanceStore.initInstance(props.workorder)
  }
})
</script>

<style scoped>
.workorder-flow-integration {
  width: 100%;
}
</style>
