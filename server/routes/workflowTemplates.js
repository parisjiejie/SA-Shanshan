/**
 * 流程模板路由
 * 提供流程模板的CRUD API
 */

const express = require('express')
const router = express.Router()
const db = require('../models/database')

/**
 * 获取所有流程模板
 * GET /api/workflow/templates
 */
router.get('/', (req, res) => {
  try {
    const templates = db.getAllTemplates()
    res.json({
      success: true,
      data: templates
    })
  } catch (error) {
    console.error('获取流程模板列表失败:', error)
    res.status(500).json({
      success: false,
      message: '获取流程模板列表失败',
      error: error.message
    })
  }
})

/**
 * 获取单个流程模板
 * GET /api/workflow/templates/:id
 */
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params
    const template = db.getTemplateById(id)
    
    if (!template) {
      return res.status(404).json({
        success: false,
        message: '流程模板不存在'
      })
    }
    
    res.json({
      success: true,
      data: template
    })
  } catch (error) {
    console.error('获取流程模板失败:', error)
    res.status(500).json({
      success: false,
      message: '获取流程模板失败',
      error: error.message
    })
  }
})

/**
 * 根据工单类型获取默认模板
 * GET /api/workflow/templates/default
 */
router.get('/default', (req, res) => {
  try {
    const { type, scene } = req.query
    
    if (!type) {
      return res.status(400).json({
        success: false,
        message: '缺少工单类型参数'
      })
    }
    
    const templates = db.getAllTemplates().filter(t => 
      t.workorderTypes.includes(type) && t.status === 'active'
    )
    
    // 如果有场景要求，优先匹配场景
    let template = null
    if (scene) {
      template = templates.find(t => t.scenes?.includes(scene))
    }
    
    // 返回默认模板或第一个模板
    if (!template) {
      template = templates.find(t => t.isDefault) || templates[0]
    }
    
    if (!template) {
      return res.status(404).json({
        success: false,
        message: `未找到工单类型 "${type}" 的流程模板`
      })
    }
    
    res.json({
      success: true,
      data: template
    })
  } catch (error) {
    console.error('获取默认模板失败:', error)
    res.status(500).json({
      success: false,
      message: '获取默认模板失败',
      error: error.message
    })
  }
})

/**
 * 创建流程模板
 * POST /api/workflow/templates
 */
router.post('/', (req, res) => {
  try {
    const templateData = req.body
    
    // 验证必填字段
    if (!templateData.name || !templateData.code) {
      return res.status(400).json({
        success: false,
        message: '缺少必填字段：name 和 code'
      })
    }
    
    // 检查编码是否已存在
    const existingTemplate = db.getAllTemplates().find(t => t.code === templateData.code)
    if (existingTemplate) {
      return res.status(409).json({
        success: false,
        message: '流程模板编码已存在'
      })
    }
    
    // 创建新模板
    const newTemplate = {
      id: db.generateId(),
      ...templateData,
      version: '1.0.0',
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    // 如果没有提供 nodes，使用默认的空节点数组
    if (!newTemplate.nodes) {
      newTemplate.nodes = []
    }
    
    db.saveTemplate(newTemplate)
    
    res.status(201).json({
      success: true,
      message: '流程模板创建成功',
      data: newTemplate
    })
  } catch (error) {
    console.error('创建流程模板失败:', error)
    res.status(500).json({
      success: false,
      message: '创建流程模板失败',
      error: error.message
    })
  }
})

/**
 * 更新流程模板
 * PUT /api/workflow/templates/:id
 */
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params
    const updateData = req.body
    
    const existingTemplate = db.getTemplateById(id)
    if (!existingTemplate) {
      return res.status(404).json({
        success: false,
        message: '流程模板不存在'
      })
    }
    
    // 合并更新数据
    const updatedTemplate = {
      ...existingTemplate,
      ...updateData,
      id, // 保持ID不变
      updatedAt: new Date().toISOString()
    }
    
    // 如果更新了 nodes，增加版本号
    if (updateData.nodes && JSON.stringify(updateData.nodes) !== JSON.stringify(existingTemplate.nodes)) {
      const versionParts = updatedTemplate.version.split('.')
      versionParts[2] = parseInt(versionParts[2]) + 1
      updatedTemplate.version = versionParts.join('.')
    }
    
    db.saveTemplate(updatedTemplate)
    
    res.json({
      success: true,
      message: '流程模板更新成功',
      data: updatedTemplate
    })
  } catch (error) {
    console.error('更新流程模板失败:', error)
    res.status(500).json({
      success: false,
      message: '更新流程模板失败',
      error: error.message
    })
  }
})

/**
 * 删除流程模板
 * DELETE /api/workflow/templates/:id
 */
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params
    
    const existingTemplate = db.getTemplateById(id)
    if (!existingTemplate) {
      return res.status(404).json({
        success: false,
        message: '流程模板不存在'
      })
    }
    
    // 检查是否有正在使用的流程实例
    const hasActiveInstances = Array.from(db.flowInstances.values()).some(
      instance => instance.templateId === id && instance.status === 'running'
    )
    
    if (hasActiveInstances) {
      return res.status(409).json({
        success: false,
        message: '该模板有正在运行的流程实例，无法删除'
      })
    }
    
    db.deleteTemplate(id)
    
    res.json({
      success: true,
      message: '流程模板删除成功'
    })
  } catch (error) {
    console.error('删除流程模板失败:', error)
    res.status(500).json({
      success: false,
      message: '删除流程模板失败',
      error: error.message
    })
  }
})

/**
 * 设置默认模板
 * POST /api/workflow/templates/:id/set-default
 */
router.post('/:id/set-default', (req, res) => {
  try {
    const { id } = req.params
    
    const template = db.getTemplateById(id)
    if (!template) {
      return res.status(404).json({
        success: false,
        message: '流程模板不存在'
      })
    }
    
    // 取消其他同类型模板的默认状态
    const allTemplates = db.getAllTemplates()
    allTemplates.forEach(t => {
      if (t.workorderTypes.some(type => template.workorderTypes.includes(type))) {
        if (t.isDefault) {
          t.isDefault = false
          db.saveTemplate(t)
        }
      }
    })
    
    // 设置当前为默认
    template.isDefault = true
    db.saveTemplate(template)
    
    res.json({
      success: true,
      message: '已设为默认模板',
      data: template
    })
  } catch (error) {
    console.error('设置默认模板失败:', error)
    res.status(500).json({
      success: false,
      message: '设置默认模板失败',
      error: error.message
    })
  }
})

/**
 * 更新模板节点配置
 * PUT /api/workflow/templates/:id/nodes
 */
router.put('/:id/nodes', (req, res) => {
  try {
    const { id } = req.params
    const { nodes } = req.body
    
    if (!nodes || !Array.isArray(nodes)) {
      return res.status(400).json({
        success: false,
        message: '缺少 nodes 参数或格式不正确'
      })
    }
    
    const template = db.getTemplateById(id)
    if (!template) {
      return res.status(404).json({
        success: false,
        message: '流程模板不存在'
      })
    }
    
    // 更新节点
    template.nodes = nodes
    
    // 增加版本号
    const versionParts = template.version.split('.')
    versionParts[1] = parseInt(versionParts[1]) + 1
    versionParts[2] = 0
    template.version = versionParts.join('.')
    
    db.saveTemplate(template)
    
    res.json({
      success: true,
      message: '节点配置更新成功',
      data: {
        nodes: template.nodes,
        version: template.version,
        updatedAt: template.updatedAt
      }
    })
  } catch (error) {
    console.error('更新节点配置失败:', error)
    res.status(500).json({
      success: false,
      message: '更新节点配置失败',
      error: error.message
    })
  }
})

module.exports = router
