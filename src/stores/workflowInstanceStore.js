import { ref, computed } from 'vue'
import { workflowInstanceApi } from '../api/workflowApi'
import { useWorkflowConfigStore } from './workflowConfigStore'

/**
 * 工单流程实例管理 Store
 * 管理工单流程的执行状态、历史记录等
 * 
 * 注意：当前实现同时支持API调用和本地数据，如果API不可用会自动降级到本地数据
 */

// 创建单例实例
let instanceStoreInstance = null

export const useWorkflowInstanceStore = () => {
  // 如果实例已存在，直接返回
  if (instanceStoreInstance) return instanceStoreInstance
  
  const configStore = useWorkflowConfigStore()
  
  // ==================== State ====================
  
  // 流程实例列表（内存存储，实际应持久化到后端）
  const instances = ref(new Map())
  
  // 流转历史记录
  const flowHistories = ref(new Map())
  
  // 加载状态
  const loading = ref(false)
  
  // ==================== Getters ====================
  
  // 获取流程实例
  const getInstance = (workorderId) => {
    return instances.value.get(workorderId)
  }
  
  // 获取流转历史
  const getFlowHistory = (workorderId) => {
    return flowHistories.value.get(workorderId) || []
  }
  
  // 获取工单的当前状态
  const getWorkorderStatus = (workorderId) => {
    const instance = getInstance(workorderId)
    return instance?.currentStatus || 'CREATED'
  }
  
  // 检查是否可以执行操作
  const canExecuteAction = (workorderId, actionCode, userRole) => {
    const instance = getInstance(workorderId)
    if (!instance) return false
    
    return configStore.canExecuteAction(
      instance.templateId,
      instance.currentStatus,
      actionCode,
      userRole
    )
  }
  
  // ==================== Actions ====================
  
  /**
   * 初始化工单流程实例（支持API和本地两种模式）
   * @param {Object} workorder - 工单数据
   * @returns {Object} 流程实例
   */
  const initInstance = async (workorder) => {
    const template = configStore.getTemplateByWorkorderType(
      workorder.type,
      workorder.scene
    )
    
    if (!template) {
      throw new Error(`未找到工单类型 "${workorder.type}" 的流程模板`)
    }
    
    // 尝试通过API初始化
    try {
      const response = await workflowInstanceApi.initInstance(workorder.id, {
        workorderId: workorder.id,
        type: workorder.type,
        scene: workorder.scene,
        templateId: template.id,
        creator: workorder.creator
      })
      
      if (response && response.data) {
        instances.value.set(workorder.id, response.data.instance)
        flowHistories.value.set(workorder.id, response.data.history || [])
        return response.data.instance
      }
    } catch (error) {
      console.warn('Failed to init instance via API, using local mode:', error)
    }
    
    // 本地初始化（作为fallback）
    const instance = {
      workorderId: workorder.id,
      templateId: template.id,
      templateVersion: template.version,
      currentStatus: 'CREATED',
      currentNode: template.nodes.find(n => n.type === 'start'),
      startTime: new Date().toISOString(),
      variables: {},
      status: 'running'
    }
    
    instances.value.set(workorder.id, instance)
    
    // 初始化流转历史
    flowHistories.value.set(workorder.id, [{
      id: generateHistoryId(),
      workorderId: workorder.id,
      title: '工单创建',
      content: `创建${workorder.type}工单`,
      action: 'create',
      fromStatus: null,
      toStatus: 'CREATED',
      operator: workorder.creator || '系统',
      operatorRole: '客服',
      time: new Date().toISOString(),
      status: 'completed',
      formData: {}
    }])
    
    return instance
  }
  
  /**
   * 执行流程操作（支持API和本地两种模式）
   * @param {Object} params - 操作参数
   * @returns {Object} 操作结果
   */
  const executeAction = async (params) => {
    const { 
      workorderId, 
      action, 
      operator, 
      operatorRole, 
      formData = {},
      remark = '' 
    } = params
    
    loading.value = true
    
    try {
      // 尝试通过API执行操作
      try {
        const response = await workflowInstanceApi.executeAction(workorderId, {
          action,
          operator,
          operatorRole,
          formData,
          remark
        })
        
        if (response && response.data) {
          // 更新本地实例
          const instance = getInstance(workorderId)
          if (instance) {
            instance.currentStatus = response.data.toStatus
            instance.lastAction = action
            instance.lastActionTime = response.data.timestamp
            instance.lastOperator = operator
            
            if (response.data.isCompleted) {
              instance.status = 'completed'
              instance.endTime = response.data.timestamp
            }
          }
          
          // 更新历史记录
          await loadFlowHistory(workorderId)
          
          return {
            success: true,
            workorderId,
            fromStatus: response.data.fromStatus,
            toStatus: response.data.toStatus,
            action,
            operator,
            timestamp: response.data.timestamp,
            isCompleted: response.data.isCompleted
          }
        }
      } catch (apiError) {
        console.warn('Failed to execute action via API, using local mode:', apiError)
      }
      
      // 本地执行（作为fallback）
      return executeActionLocal(params)
      
    } catch (error) {
      console.error('Execute action error:', error)
      throw error
    } finally {
      loading.value = false
    }
  }
  
  /**
   * 本地执行流程操作（作为fallback）
   */
  const executeActionLocal = async (params) => {
    const { 
      workorderId, 
      action, 
      operator, 
      operatorRole, 
      formData = {},
      remark = '' 
    } = params
    
    // 获取流程实例
    let instance = getInstance(workorderId)
    
    // 如果实例不存在，尝试初始化
    if (!instance) {
      throw new Error('流程实例不存在，请先初始化')
    }
    
    // 获取当前模板和节点
    const template = configStore.getTemplateById(instance.templateId)
    const currentNode = configStore.getNodeConfig(
      instance.templateId, 
      instance.currentStatus
    )
    
    if (!currentNode) {
      throw new Error('当前节点配置不存在')
    }
    
    // 查找操作配置
    const actionConfig = currentNode.actions?.find(a => a.code === action)
    if (!actionConfig) {
      throw new Error(`当前状态不支持操作: ${action}`)
    }
    
    // 检查权限
    if (actionConfig.roles && !actionConfig.roles.includes(operatorRole)) {
      throw new Error('您没有权限执行此操作')
    }
    
    // 获取下一个状态
    const nextStatus = actionConfig.nextNode
    if (!nextStatus) {
      throw new Error('操作未定义下一个状态')
    }
    
    // 更新流程实例
    const fromStatus = instance.currentStatus
    instance.currentStatus = nextStatus
    instance.currentNode = template.nodes.find(n => n.code === nextStatus)
    instance.lastAction = action
    instance.lastActionTime = new Date().toISOString()
    instance.lastOperator = operator
    
    // 如果到达结束节点，更新实例状态
    if (instance.currentNode?.type === 'end') {
      instance.status = 'completed'
      instance.endTime = new Date().toISOString()
    }
    
    // 保存变量
    if (formData) {
      Object.assign(instance.variables, formData)
    }
    
    // 添加流转历史
    const history = {
      id: generateHistoryId(),
      workorderId,
      title: actionConfig.label,
      content: remark || `${actionConfig.label}操作`,
      action,
      fromStatus,
      toStatus: nextStatus,
      operator,
      operatorRole,
      time: new Date().toISOString(),
      status: 'completed',
      formData: { ...formData }
    }
    
    const histories = flowHistories.value.get(workorderId) || []
    histories.unshift(history)
    flowHistories.value.set(workorderId, histories)
    
    // 返回操作结果
    return {
      success: true,
      workorderId,
      fromStatus,
      toStatus: nextStatus,
      action,
      operator,
      timestamp: history.time,
      isCompleted: instance.status === 'completed'
    }
  }
  
  /**
   * 批量执行操作（用于批量处理）
   * @param {Array} actions - 操作列表
   * @returns {Array} 操作结果列表
   */
  const executeBatchActions = async (actions) => {
    const results = []
    
    for (const action of actions) {
      try {
        const result = await executeAction(action)
        results.push({ success: true, ...result })
      } catch (error) {
        results.push({ 
          success: false, 
          workorderId: action.workorderId,
          error: error.message 
        })
      }
    }
    
    return results
  }
  
  /**
   * 获取工单可用的操作列表
   * @param {string} workorderId - 工单ID
   * @param {string} userRole - 用户角色
   * @returns {Array} 可用操作列表
   */
  const getAvailableActions = (workorderId, userRole) => {
    const instance = getInstance(workorderId)
    if (!instance) return []
    
    return configStore.getNodeActions(instance.templateId, instance.currentStatus)
      .filter(action => {
        // 检查角色权限
        if (action.roles && !action.roles.includes(userRole)) {
          return false
        }
        return true
      })
  }
  
  /**
   * 获取工单流程进度
   * @param {string} workorderId - 工单ID
   * @returns {Object} 进度信息
   */
  const getFlowProgress = (workorderId) => {
    const instance = getInstance(workorderId)
    if (!instance) return null
    
    const template = configStore.getTemplateById(instance.templateId)
    const totalNodes = template.nodes.filter(n => n.type !== 'end').length
    const currentNodeIndex = template.nodes.findIndex(
      n => n.code === instance.currentStatus
    )
    
    return {
      currentStatus: instance.currentStatus,
      currentStatusName: instance.currentNode?.name,
      progress: Math.round((currentNodeIndex / totalNodes) * 100),
      totalSteps: totalNodes,
      currentStep: currentNodeIndex + 1,
      isCompleted: instance.status === 'completed',
      startTime: instance.startTime,
      endTime: instance.endTime
    }
  }
  
  /**
   * 取消工单流程
   * @param {string} workorderId - 工单ID
   * @param {string} operator - 操作人
   * @param {string} reason - 取消原因
   */
  const cancelFlow = async (workorderId, operator, reason = '') => {
    const instance = getInstance(workorderId)
    if (!instance) {
      throw new Error('流程实例不存在')
    }
    
    const template = configStore.getTemplateById(instance.templateId)
    const cancelConfig = template.config
    
    // 检查是否允许取消
    if (!cancelConfig?.allowCancel) {
      throw new Error('该流程不允许取消')
    }
    
    // 检查当前状态是否可以取消
    if (!cancelConfig.cancelableNodes?.includes(instance.currentStatus)) {
      throw new Error('当前状态不允许取消')
    }
    
    // 执行取消操作
    return executeAction({
      workorderId,
      action: 'cancel',
      operator,
      operatorRole: '系统',
      formData: { cancelReason: reason },
      remark: `取消原因: ${reason}`
    })
  }
  
  /**
   * 转交工单
   * @param {string} workorderId - 工单ID
   * @param {string} fromUser - 原处理人
   * @param {string} toUser - 新处理人
   * @param {string} reason - 转交原因
   */
  const transferWorkorder = async (workorderId, fromUser, toUser, reason = '') => {
    const instance = getInstance(workorderId)
    if (!instance) {
      throw new Error('流程实例不存在')
    }
    
    const template = configStore.getTemplateById(instance.templateId)
    
    // 检查是否允许转交
    if (!template.config?.allowTransfer) {
      throw new Error('该流程不允许转交')
    }
    
    // 添加转交记录
    const history = {
      id: generateHistoryId(),
      workorderId,
      title: '工单转交',
      content: `从 ${fromUser} 转交给 ${toUser}`,
      action: 'transfer',
      fromStatus: instance.currentStatus,
      toStatus: instance.currentStatus,
      operator: fromUser,
      operatorRole: '工程师',
      time: new Date().toISOString(),
      status: 'completed',
      formData: { 
        fromUser, 
        toUser, 
        transferReason: reason 
      }
    }
    
    const histories = flowHistories.value.get(workorderId) || []
    histories.unshift(history)
    flowHistories.value.set(workorderId, histories)
    
    return {
      success: true,
      workorderId,
      fromUser,
      toUser,
      timestamp: history.time
    }
  }
  
  /**
   * 获取流程统计信息
   * @param {string} workorderId - 工单ID
   * @returns {Object} 统计信息
   */
  const getFlowStatistics = (workorderId) => {
    const instance = getInstance(workorderId)
    const histories = getFlowHistory(workorderId)
    
    if (!instance) return null
    
    // 计算各节点耗时
    const nodeDurations = []
    for (let i = 0; i < histories.length - 1; i++) {
      const current = histories[i]
      const next = histories[i + 1]
      const duration = new Date(current.time) - new Date(next.time)
      
      nodeDurations.push({
        node: next.toStatus,
        duration: Math.round(duration / 1000), // 秒
        operator: next.operator
      })
    }
    
    // 计算总耗时
    const totalDuration = instance.endTime 
      ? new Date(instance.endTime) - new Date(instance.startTime)
      : new Date() - new Date(instance.startTime)
    
    return {
      totalDuration: Math.round(totalDuration / 1000),
      nodeDurations,
      actionCount: histories.length,
      operatorCount: new Set(histories.map(h => h.operator)).size
    }
  }
  
  /**
   * 导出流程数据
   * @param {string} workorderId - 工单ID
   * @returns {Object} 完整的流程数据
   */
  const exportFlowData = (workorderId) => {
    const instance = getInstance(workorderId)
    const histories = getFlowHistory(workorderId)
    
    if (!instance) return null
    
    return {
      workorderId,
      template: configStore.getTemplateById(instance.templateId),
      instance,
      histories,
      statistics: getFlowStatistics(workorderId)
    }
  }
  
  // ==================== 辅助函数 ====================
  
  // 生成历史记录ID
  const generateHistoryId = () => {
    return `hist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
  
  // 加载实例数据（模拟从后端加载）
  const loadInstance = async (workorderId) => {
    // 这里将来替换为实际API调用
    // const response = await fetch(`/api/workflow/instances/${workorderId}`)
    // const data = await response.json()
    // instances.value.set(workorderId, data)
    
    return getInstance(workorderId)
  }
  
  // 保存实例数据（模拟保存到后端）
  const saveInstance = async (workorderId) => {
    const instance = getInstance(workorderId)
    if (!instance) return
    
    // 这里将来替换为实际API调用
    // await fetch(`/api/workflow/instances/${workorderId}`, {
    //   method: 'PUT',
    //   body: JSON.stringify(instance)
    // })
  }
  
  // 创建 store 对象
  const store = {
    // State
    instances,
    flowHistories,
    loading,
    
    // Getters
    getInstance,
    getFlowHistory,
    getWorkorderStatus,
    canExecuteAction,
    
    // Actions
    initInstance,
    executeAction,
    executeBatchActions,
    getAvailableActions,
    getFlowProgress,
    cancelFlow,
    transferWorkorder,
    getFlowStatistics,
    exportFlowData,
    loadInstance,
    saveInstance
  }
  
  // 保存实例
  instanceStoreInstance = store
  
  return store
}
