/**
 * 流程实例路由
 * 提供流程实例的创建、执行、查询等API
 */

const express = require('express')
const router = express.Router()
const db = require('../models/database')

/**
 * 初始化流程实例
 * POST /api/workflow/instances/:workorderId/init
 */
router.post('/:workorderId/init', (req, res) => {
  try {
    const { workorderId } = req.params
    const { type, scene, templateId, creator } = req.body
    
    // 检查是否已存在
    const existingInstance = db.getInstance(workorderId)
    if (existingInstance) {
      return res.json({
        success: true,
        message: '流程实例已存在',
        data: {
          instance: existingInstance,
          history: db.getHistory(workorderId)
        }
      })
    }
    
    // 获取模板
    let template = null
    if (templateId) {
      template = db.getTemplateById(templateId)
    } else if (type) {
      // 根据类型查找默认模板
      const templates = db.getAllTemplates().filter(t => 
        t.workorderTypes.includes(type) && t.status === 'active'
      )
      if (scene) {
        template = templates.find(t => t.scenes?.includes(scene))
      }
      if (!template) {
        template = templates.find(t => t.isDefault) || templates[0]
      }
    }
    
    if (!template) {
      return res.status(404).json({
        success: false,
        message: '未找到适用的流程模板'
      })
    }
    
    // 创建流程实例
    const instance = {
      workorderId,
      templateId: template.id,
      templateVersion: template.version,
      currentStatus: 'CREATED',
      currentNode: template.nodes.find(n => n.type === 'start'),
      startTime: new Date().toISOString(),
      variables: {},
      status: 'running',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    db.saveInstance(instance)
    
    // 创建初始历史记录
    const historyRecord = {
      id: db.generateId(),
      workorderId,
      title: '工单创建',
      content: `创建${type || '工单'}`,
      action: 'create',
      fromStatus: null,
      toStatus: 'CREATED',
      operator: creator || '系统',
      operatorRole: '客服',
      time: new Date().toISOString(),
      status: 'completed',
      formData: {}
    }
    
    db.addHistory(workorderId, historyRecord)
    
    res.status(201).json({
      success: true,
      message: '流程实例初始化成功',
      data: {
        instance,
        history: [historyRecord]
      }
    })
  } catch (error) {
    console.error('初始化流程实例失败:', error)
    res.status(500).json({
      success: false,
      message: '初始化流程实例失败',
      error: error.message
    })
  }
})

/**
 * 获取流程实例
 * GET /api/workflow/instances/:workorderId
 */
router.get('/:workorderId', (req, res) => {
  try {
    const { workorderId } = req.params
    const instance = db.getInstance(workorderId)
    
    if (!instance) {
      return res.status(404).json({
        success: false,
        message: '流程实例不存在'
      })
    }
    
    res.json({
      success: true,
      data: instance
    })
  } catch (error) {
    console.error('获取流程实例失败:', error)
    res.status(500).json({
      success: false,
      message: '获取流程实例失败',
      error: error.message
    })
  }
})

/**
 * 执行流程操作
 * POST /api/workflow/instances/:workorderId/actions
 */
router.post('/:workorderId/actions', (req, res) => {
  try {
    const { workorderId } = req.params
    const { action, operator, operatorRole, formData = {}, remark = '' } = req.body
    
    // 获取流程实例
    const instance = db.getInstance(workorderId)
    if (!instance) {
      return res.status(404).json({
        success: false,
        message: '流程实例不存在'
      })
    }
    
    // 检查流程是否已完成
    if (instance.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: '流程已结束，无法执行操作'
      })
    }
    
    // 获取模板和当前节点
    const template = db.getTemplateById(instance.templateId)
    if (!template) {
      return res.status(404).json({
        success: false,
        message: '流程模板不存在'
      })
    }
    
    const currentNode = template.nodes.find(n => n.code === instance.currentStatus)
    if (!currentNode) {
      return res.status(404).json({
        success: false,
        message: '当前节点配置不存在'
      })
    }
    
    // 查找操作配置
    const actionConfig = currentNode.actions?.find(a => a.code === action)
    if (!actionConfig) {
      return res.status(400).json({
        success: false,
        message: `当前状态不支持操作: ${action}`
      })
    }
    
    // 检查权限
    if (actionConfig.roles && !actionConfig.roles.includes(operatorRole)) {
      return res.status(403).json({
        success: false,
        message: '您没有权限执行此操作'
      })
    }
    
    // 获取下一个状态
    const nextStatus = actionConfig.nextNode
    if (!nextStatus) {
      return res.status(400).json({
        success: false,
        message: '操作未定义下一个状态'
      })
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
    
    db.saveInstance(instance)
    
    // 添加流转历史
    const historyRecord = {
      id: db.generateId(),
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
    
    db.addHistory(workorderId, historyRecord)
    
    res.json({
      success: true,
      message: '操作执行成功',
      data: {
        workorderId,
        fromStatus,
        toStatus: nextStatus,
        action,
        operator,
        timestamp: historyRecord.time,
        isCompleted: instance.status === 'completed'
      }
    })
  } catch (error) {
    console.error('执行操作失败:', error)
    res.status(500).json({
      success: false,
      message: '执行操作失败',
      error: error.message
    })
  }
})

/**
 * 批量执行操作
 * POST /api/workflow/instances/batch-actions
 */
router.post('/batch-actions', (req, res) => {
  try {
    const { actions } = req.body
    
    if (!Array.isArray(actions)) {
      return res.status(400).json({
        success: false,
        message: 'actions 必须是数组'
      })
    }
    
    const results = []
    
    for (const actionData of actions) {
      try {
        const { workorderId, action, operator, operatorRole, formData, remark } = actionData
        
        // 获取流程实例
        const instance = db.getInstance(workorderId)
        if (!instance) {
          results.push({
            success: false,
            workorderId,
            error: '流程实例不存在'
          })
          continue
        }
        
        // 获取模板和节点
        const template = db.getTemplateById(instance.templateId)
        const currentNode = template.nodes.find(n => n.code === instance.currentStatus)
        const actionConfig = currentNode.actions?.find(a => a.code === action)
        
        if (!actionConfig) {
          results.push({
            success: false,
            workorderId,
            error: `当前状态不支持操作: ${action}`
          })
          continue
        }
        
        // 执行操作
        const fromStatus = instance.currentStatus
        const nextStatus = actionConfig.nextNode
        
        instance.currentStatus = nextStatus
        instance.currentNode = template.nodes.find(n => n.code === nextStatus)
        instance.lastAction = action
        instance.lastActionTime = new Date().toISOString()
        instance.lastOperator = operator
        
        if (instance.currentNode?.type === 'end') {
          instance.status = 'completed'
          instance.endTime = new Date().toISOString()
        }
        
        if (formData) {
          Object.assign(instance.variables, formData)
        }
        
        db.saveInstance(instance)
        
        // 添加历史记录
        db.addHistory(workorderId, {
          id: db.generateId(),
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
        })
        
        results.push({
          success: true,
          workorderId,
          fromStatus,
          toStatus: nextStatus,
          isCompleted: instance.status === 'completed'
        })
      } catch (error) {
        results.push({
          success: false,
          workorderId: actionData.workorderId,
          error: error.message
        })
      }
    }
    
    res.json({
      success: true,
      data: results
    })
  } catch (error) {
    console.error('批量执行操作失败:', error)
    res.status(500).json({
      success: false,
      message: '批量执行操作失败',
      error: error.message
    })
  }
})

/**
 * 获取流转历史
 * GET /api/workflow/instances/:workorderId/history
 */
router.get('/:workorderId/history', (req, res) => {
  try {
    const { workorderId } = req.params
    const history = db.getHistory(workorderId)
    
    res.json({
      success: true,
      data: history
    })
  } catch (error) {
    console.error('获取流转历史失败:', error)
    res.status(500).json({
      success: false,
      message: '获取流转历史失败',
      error: error.message
    })
  }
})

/**
 * 获取流程进度
 * GET /api/workflow/instances/:workorderId/progress
 */
router.get('/:workorderId/progress', (req, res) => {
  try {
    const { workorderId } = req.params
    const instance = db.getInstance(workorderId)
    
    if (!instance) {
      return res.status(404).json({
        success: false,
        message: '流程实例不存在'
      })
    }
    
    const template = db.getTemplateById(instance.templateId)
    const totalNodes = template.nodes.filter(n => n.type !== 'end').length
    const currentNodeIndex = template.nodes.findIndex(n => n.code === instance.currentStatus)
    
    const progress = {
      currentStatus: instance.currentStatus,
      currentStatusName: instance.currentNode?.name,
      progress: Math.round((currentNodeIndex / totalNodes) * 100),
      totalSteps: totalNodes,
      currentStep: currentNodeIndex + 1,
      isCompleted: instance.status === 'completed',
      startTime: instance.startTime,
      endTime: instance.endTime
    }
    
    res.json({
      success: true,
      data: progress
    })
  } catch (error) {
    console.error('获取流程进度失败:', error)
    res.status(500).json({
      success: false,
      message: '获取流程进度失败',
      error: error.message
    })
  }
})

/**
 * 取消流程
 * POST /api/workflow/instances/:workorderId/cancel
 */
router.post('/:workorderId/cancel', (req, res) => {
  try {
    const { workorderId } = req.params
    const { operator, reason = '' } = req.body
    
    const instance = db.getInstance(workorderId)
    if (!instance) {
      return res.status(404).json({
        success: false,
        message: '流程实例不存在'
      })
    }
    
    const template = db.getTemplateById(instance.templateId)
    
    // 检查是否允许取消
    if (!template.config?.allowCancel) {
      return res.status(400).json({
        success: false,
        message: '该流程不允许取消'
      })
    }
    
    // 检查当前状态是否可以取消
    if (!template.config.cancelableNodes?.includes(instance.currentStatus)) {
      return res.status(400).json({
        success: false,
        message: '当前状态不允许取消'
      })
    }
    
    // 更新实例状态
    const fromStatus = instance.currentStatus
    instance.currentStatus = 'CANCELLED'
    instance.currentNode = template.nodes.find(n => n.code === 'CANCELLED')
    instance.status = 'completed'
    instance.endTime = new Date().toISOString()
    instance.cancelReason = reason
    
    db.saveInstance(instance)
    
    // 添加历史记录
    db.addHistory(workorderId, {
      id: db.generateId(),
      workorderId,
      title: '工单取消',
      content: `取消原因: ${reason}`,
      action: 'cancel',
      fromStatus,
      toStatus: 'CANCELLED',
      operator,
      operatorRole: '系统',
      time: new Date().toISOString(),
      status: 'completed',
      formData: { cancelReason: reason }
    })
    
    res.json({
      success: true,
      message: '流程已取消',
      data: {
        workorderId,
        fromStatus,
        toStatus: 'CANCELLED',
        timestamp: instance.endTime
      }
    })
  } catch (error) {
    console.error('取消流程失败:', error)
    res.status(500).json({
      success: false,
      message: '取消流程失败',
      error: error.message
    })
  }
})

/**
 * 转交工单
 * POST /api/workflow/instances/:workorderId/transfer
 */
router.post('/:workorderId/transfer', (req, res) => {
  try {
    const { workorderId } = req.params
    const { fromUser, toUser, reason = '' } = req.body
    
    const instance = db.getInstance(workorderId)
    if (!instance) {
      return res.status(404).json({
        success: false,
        message: '流程实例不存在'
      })
    }
    
    const template = db.getTemplateById(instance.templateId)
    
    // 检查是否允许转交
    if (!template.config?.allowTransfer) {
      return res.status(400).json({
        success: false,
        message: '该流程不允许转交'
      })
    }
    
    // 添加转交记录
    db.addHistory(workorderId, {
      id: db.generateId(),
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
      formData: { fromUser, toUser, transferReason: reason }
    })
    
    res.json({
      success: true,
      message: '工单转交成功',
      data: {
        workorderId,
        fromUser,
        toUser,
        timestamp: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('转交工单失败:', error)
    res.status(500).json({
      success: false,
      message: '转交工单失败',
      error: error.message
    })
  }
})

/**
 * 获取流程统计
 * GET /api/workflow/instances/:workorderId/statistics
 */
router.get('/:workorderId/statistics', (req, res) => {
  try {
    const { workorderId } = req.params
    const instance = db.getInstance(workorderId)
    const history = db.getHistory(workorderId)
    
    if (!instance) {
      return res.status(404).json({
        success: false,
        message: '流程实例不存在'
      })
    }
    
    // 计算各节点耗时
    const nodeDurations = []
    for (let i = 0; i < history.length - 1; i++) {
      const current = history[i]
      const next = history[i + 1]
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
    
    const statistics = {
      totalDuration: Math.round(totalDuration / 1000),
      nodeDurations,
      actionCount: history.length,
      operatorCount: new Set(history.map(h => h.operator)).size
    }
    
    res.json({
      success: true,
      data: statistics
    })
  } catch (error) {
    console.error('获取流程统计失败:', error)
    res.status(500).json({
      success: false,
      message: '获取流程统计失败',
      error: error.message
    })
  }
})

/**
 * 导出流程数据
 * GET /api/workflow/instances/:workorderId/export
 */
router.get('/:workorderId/export', (req, res) => {
  try {
    const { workorderId } = req.params
    const instance = db.getInstance(workorderId)
    const history = db.getHistory(workorderId)
    
    if (!instance) {
      return res.status(404).json({
        success: false,
        message: '流程实例不存在'
      })
    }
    
    const template = db.getTemplateById(instance.templateId)
    
    // 计算统计信息
    const totalDuration = instance.endTime 
      ? new Date(instance.endTime) - new Date(instance.startTime)
      : new Date() - new Date(instance.startTime)
    
    const exportData = {
      workorderId,
      template,
      instance,
      histories: history,
      statistics: {
        totalDuration: Math.round(totalDuration / 1000),
        actionCount: history.length,
        operatorCount: new Set(history.map(h => h.operator)).size
      },
      exportedAt: new Date().toISOString()
    }
    
    res.json({
      success: true,
      data: exportData
    })
  } catch (error) {
    console.error('导出流程数据失败:', error)
    res.status(500).json({
      success: false,
      message: '导出流程数据失败',
      error: error.message
    })
  }
})

module.exports = router
