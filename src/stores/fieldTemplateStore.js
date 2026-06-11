import { ref, computed } from 'vue'
import { workflowTemplateApi } from '../api/workflowApi'
import { useFieldConfigStore } from './fieldConfigStore'

/**
 * 字段模板管理 Store
 * 管理字段模板的创建、版本控制、客户定制等
 */

// ==================== 默认字段模板 ====================

const DefaultFieldTemplates = [
  {
    id: 'template_repair_standard',
    code: 'REPAIR_STANDARD',
    name: '标准维修字段模板',
    description: '标准维修工单字段配置模板',
    scope: {
      workorderTypes: ['维修'],
      scenes: ['现场维修', '返厂维修'],
      customers: []
    },
    fields: [
      { fieldDefId: 'field_workorder_no', sortOrder: 1, colSpan: 12 },
      { fieldDefId: 'field_title', sortOrder: 2, colSpan: 12 },
      { fieldDefId: 'field_customer', sortOrder: 3, colSpan: 12 },
      { fieldDefId: 'field_asset', sortOrder: 4, colSpan: 12 },
      { fieldDefId: 'field_priority', sortOrder: 5, colSpan: 12 },
      { fieldDefId: 'field_service_date', sortOrder: 6, colSpan: 12 },
      { fieldDefId: 'field_description', sortOrder: 7, colSpan: 24 },
      { fieldDefId: 'field_engineer', sortOrder: 8, colSpan: 12 },
      { fieldDefId: 'field_location', sortOrder: 9, colSpan: 12 },
      { fieldDefId: 'field_arrive_time', sortOrder: 10, colSpan: 12 },
      { fieldDefId: 'field_fault_description', sortOrder: 11, colSpan: 24 },
      { fieldDefId: 'field_solution', sortOrder: 12, colSpan: 24 },
      { fieldDefId: 'field_parts', sortOrder: 13, colSpan: 24 },
      { fieldDefId: 'field_work_hours', sortOrder: 14, colSpan: 12 },
      { fieldDefId: 'field_photos', sortOrder: 15, colSpan: 24 },
      { fieldDefId: 'field_labor_cost', sortOrder: 16, colSpan: 12 },
      { fieldDefId: 'field_parts_cost', sortOrder: 17, colSpan: 12 },
      { fieldDefId: 'field_total_amount', sortOrder: 18, colSpan: 12 },
      { fieldDefId: 'field_payment_method', sortOrder: 19, colSpan: 12 },
      { fieldDefId: 'field_signature', sortOrder: 20, colSpan: 24 },
      { fieldDefId: 'field_rating', sortOrder: 21, colSpan: 12 },
      { fieldDefId: 'field_comment', sortOrder: 22, colSpan: 24 },
      { fieldDefId: 'field_remark', sortOrder: 23, colSpan: 24 }
    ],
    layout: {
      type: 'grid',
      columns: 24,
      gutter: 16
    },
    nodeFieldMapping: {
      'CREATED': ['workorderNo', 'title', 'customer', 'asset', 'priority', 'serviceDate', 'description'],
      'DISPATCHED': ['engineer', 'location'],
      'ACCEPTED': ['arriveTime'],
      'ARRIVED': [],
      'WORKING': ['faultDescription', 'solution', 'parts', 'workHours', 'photos'],
      'REPORT_CREATED': [],
      'REPORT_SIGNED': [],
      'COMPLETED': ['laborCost', 'partsCost', 'totalAmount'],
      'EVALUATED': ['rating', 'comment'],
      'SETTLEMENT_CREATED': ['paymentMethod'],
      'SETTLEMENT_SIGNED': ['signature']
    },
    metadata: {
      version: 1,
      isDefault: true,
      creator: 'system',
      createTime: '2026-01-01T00:00:00Z',
      status: 'active'
    }
  },
  {
    id: 'template_install_standard',
    code: 'INSTALL_STANDARD',
    name: '标准安装字段模板',
    description: '标准安装工单字段配置模板',
    scope: {
      workorderTypes: ['安装'],
      scenes: ['新装', '移机'],
      customers: []
    },
    fields: [
      { fieldDefId: 'field_workorder_no', sortOrder: 1, colSpan: 12 },
      { fieldDefId: 'field_title', sortOrder: 2, colSpan: 12 },
      { fieldDefId: 'field_customer', sortOrder: 3, colSpan: 12 },
      { fieldDefId: 'field_asset', sortOrder: 4, colSpan: 12 },
      { fieldDefId: 'field_priority', sortOrder: 5, colSpan: 12 },
      { fieldDefId: 'field_service_date', sortOrder: 6, colSpan: 12 },
      { fieldDefId: 'field_description', sortOrder: 7, colSpan: 24 },
      { fieldDefId: 'field_engineer', sortOrder: 8, colSpan: 12 },
      { fieldDefId: 'field_location', sortOrder: 9, colSpan: 12 },
      { fieldDefId: 'field_arrive_time', sortOrder: 10, colSpan: 12 },
      { fieldDefId: 'field_photos', sortOrder: 11, colSpan: 24 },
      { fieldDefId: 'field_work_hours', sortOrder: 12, colSpan: 12 },
      { fieldDefId: 'field_labor_cost', sortOrder: 13, colSpan: 12 },
      { fieldDefId: 'field_total_amount', sortOrder: 14, colSpan: 12 },
      { fieldDefId: 'field_signature', sortOrder: 15, colSpan: 24 },
      { fieldDefId: 'field_rating', sortOrder: 16, colSpan: 12 },
      { fieldDefId: 'field_comment', sortOrder: 17, colSpan: 24 }
    ],
    layout: {
      type: 'grid',
      columns: 24,
      gutter: 16
    },
    nodeFieldMapping: {
      'CREATED': ['workorderNo', 'title', 'customer', 'asset', 'priority', 'serviceDate', 'description'],
      'SCHEDULED': ['engineer'],
      'INSTALLING': ['location', 'arriveTime', 'photos'],
      'INSTALLED': ['workHours'],
      'TRAINED': [],
      'FINISHED': ['laborCost', 'totalAmount', 'paymentMethod', 'signature', 'rating', 'comment']
    },
    metadata: {
      version: 1,
      isDefault: true,
      creator: 'system',
      createTime: '2026-01-01T00:00:00Z',
      status: 'active'
    }
  },
  {
    id: 'template_inspection_standard',
    code: 'INSPECTION_STANDARD',
    name: '标准巡检字段模板',
    description: '标准巡检工单字段配置模板',
    scope: {
      workorderTypes: ['巡检'],
      scenes: ['定期巡检', '专项巡检'],
      customers: []
    },
    fields: [
      { fieldDefId: 'field_workorder_no', sortOrder: 1, colSpan: 12 },
      { fieldDefId: 'field_title', sortOrder: 2, colSpan: 12 },
      { fieldDefId: 'field_customer', sortOrder: 3, colSpan: 12 },
      { fieldDefId: 'field_asset', sortOrder: 4, colSpan: 12 },
      { fieldDefId: 'field_priority', sortOrder: 5, colSpan: 12 },
      { fieldDefId: 'field_service_date', sortOrder: 6, colSpan: 12 },
      { fieldDefId: 'field_engineer', sortOrder: 7, colSpan: 12 },
      { fieldDefId: 'field_location', sortOrder: 8, colSpan: 12 },
      { fieldDefId: 'field_arrive_time', sortOrder: 9, colSpan: 12 },
      { fieldDefId: 'field_inspection_items', sortOrder: 10, colSpan: 24 },
      { fieldDefId: 'field_photos', sortOrder: 11, colSpan: 24 },
      { fieldDefId: 'field_remark', sortOrder: 12, colSpan: 24 },
      { fieldDefId: 'field_signature', sortOrder: 13, colSpan: 24 }
    ],
    layout: {
      type: 'grid',
      columns: 24,
      gutter: 16
    },
    nodeFieldMapping: {
      'CREATED': ['workorderNo', 'title', 'customer', 'asset', 'priority', 'serviceDate'],
      'ASSIGNED': ['engineer'],
      'INSPECTING': ['location', 'arriveTime', 'inspectionItems', 'photos'],
      'REPORT_SUBMITTED': ['remark'],
      'FINISHED': ['signature']
    },
    metadata: {
      version: 1,
      isDefault: true,
      creator: 'system',
      createTime: '2026-01-01T00:00:00Z',
      status: 'active'
    }
  }
]

// ==================== Store 定义 ====================

let storeInstance = null

export const useFieldTemplateStore = () => {
  if (storeInstance) return storeInstance

  const fieldConfigStore = useFieldConfigStore()

  // State
  const templates = ref([...DefaultFieldTemplates])
  const customerConfigs = ref([])
  const loading = ref(false)
  const currentTemplate = ref(null)

  // ==================== Getters ====================

  // 获取所有模板
  const allTemplates = computed(() => {
    return Array.isArray(templates.value) ? templates.value : []
  })

  // 获取激活的模板
  const activeTemplates = computed(() => {
    return templates.value.filter(t => t.metadata?.status === 'active')
  })

  // 获取默认模板
  const defaultTemplates = computed(() => {
    return templates.value.filter(t => t.metadata?.isDefault)
  })

  // ==================== Actions ====================

  // 根据ID获取模板
  const getTemplateById = (id) => {
    return templates.value.find(t => t.id === id)
  }

  // 根据编码获取模板
  const getTemplateByCode = (code) => {
    return templates.value.find(t => t.code === code)
  }

  // 根据工单类型和场景获取模板
  const getTemplateByScope = (workorderType, scene = null, customerId = null) => {
    // 首先查找客户专属模板
    if (customerId) {
      const customerConfig = getCustomerConfig(customerId)
      if (customerConfig?.customTemplateId) {
        const customTemplate = getTemplateById(customerConfig.customTemplateId)
        if (customTemplate) return customTemplate
      }
    }

    // 查找匹配的模板
    const matched = templates.value.filter(t => {
      const scopeMatch = t.scope.workorderTypes.includes(workorderType)
      const sceneMatch = !scene || t.scope.scenes.includes(scene)
      const statusMatch = t.metadata?.status === 'active'
      return scopeMatch && sceneMatch && statusMatch
    })

    // 返回默认模板或第一个匹配模板
    return matched.find(t => t.metadata?.isDefault) || matched[0] || null
  }

  // 获取模板字段实例（包含字段定义）
  const getTemplateFields = (templateId, nodeCode = null, customerId = null) => {
    const template = getTemplateById(templateId)
    if (!template) return []

    let fieldInstances = [...template.fields]

    // 应用客户定制
    if (customerId) {
      fieldInstances = applyCustomerCustomization(fieldInstances, customerId, templateId)
    }

    // 根据节点过滤字段
    if (nodeCode && template.nodeFieldMapping) {
      const allowedFields = template.nodeFieldMapping[nodeCode]
      if (allowedFields && allowedFields.length > 0) {
        fieldInstances = fieldInstances.filter(instance => {
          const fieldDef = fieldConfigStore.getFieldDefinition(instance.fieldDefId)
          return fieldDef && allowedFields.includes(fieldDef.code)
        })
      }
    }

    // 排序并补充字段定义
    return fieldInstances
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
      .map(instance => {
        const fieldDef = fieldConfigStore.getFieldDefinition(instance.fieldDefId)
        return {
          ...instance,
          fieldDef,
          config: mergeFieldConfig(fieldDef?.config, instance.override)
        }
      })
      .filter(item => item.fieldDef)
  }

  // 应用客户定制
  const applyCustomerCustomization = (fieldInstances, customerId, templateId) => {
    const customerConfig = getCustomerConfig(customerId, templateId)
    if (!customerConfig) return fieldInstances

    let customized = [...fieldInstances]

    // 移除字段
    if (customerConfig.customizations?.removeFields?.length > 0) {
      const removeIds = new Set(customerConfig.customizations.removeFields)
      customized = customized.filter(instance => !removeIds.has(instance.fieldDefId))
    }

    // 修改字段
    if (customerConfig.customizations?.modifyFields?.length > 0) {
      customerConfig.customizations.modifyFields.forEach(modify => {
        const index = customized.findIndex(instance => instance.fieldDefId === modify.fieldDefId)
        if (index >= 0) {
          customized[index] = {
            ...customized[index],
            override: {
              ...customized[index].override,
              ...modify.changes
            }
          }
        }
      })
    }

    // 添加字段
    if (customerConfig.customizations?.addFields?.length > 0) {
      customized.push(...customerConfig.customizations.addFields)
    }

    return customized
  }

  // 合并字段配置
  const mergeFieldConfig = (baseConfig, override) => {
    if (!override) return baseConfig || {}
    return {
      ...baseConfig,
      ...override
    }
  }

  // 获取客户配置
  const getCustomerConfig = (customerId, templateId = null) => {
    return customerConfigs.value.find(c => {
      const customerMatch = c.customerId === customerId
      const templateMatch = !templateId || c.templateId === templateId
      return customerMatch && templateMatch && c.metadata?.status === 'active'
    })
  }

  // 加载模板列表
  const loadTemplates = async () => {
    loading.value = true
    try {
      const response = await workflowTemplateApi.getTemplates?.()
      if (response?.data && response.data.length > 0) {
        // 合并远程数据和默认数据
        const remoteTemplates = response.data.filter(t => t.type === 'field')
        if (remoteTemplates.length > 0) {
          templates.value = [...templates.value, ...remoteTemplates]
        }
      }
      return templates.value
    } catch (error) {
      console.warn('[FieldTemplateStore] Failed to load from API:', error)
      return templates.value
    } finally {
      loading.value = false
    }
  }

  // 保存模板
  const saveTemplate = async (template) => {
    loading.value = true
    try {
      const isUpdate = template.id && templates.value.some(t => t.id === template.id)
      
      if (isUpdate) {
        // 更新版本
        const existingTemplate = getTemplateById(template.id)
        const updatedTemplate = {
          ...template,
          metadata: {
            ...existingTemplate.metadata,
            ...template.metadata,
            version: (existingTemplate.metadata?.version || 0) + 1,
            updateTime: new Date().toISOString()
          }
        }

        // 保存版本历史
        saveTemplateVersion(existingTemplate)

        const index = templates.value.findIndex(t => t.id === template.id)
        if (index >= 0) {
          templates.value[index] = updatedTemplate
        }
        return updatedTemplate
      } else {
        // 创建新模板
        const newTemplate = {
          ...template,
          id: template.id || `template_${Date.now()}`,
          metadata: {
            version: 1,
            isDefault: false,
            creator: 'system',
            createTime: new Date().toISOString(),
            status: 'draft'
          }
        }
        templates.value.push(newTemplate)
        return newTemplate
      }
    } catch (error) {
      console.error('[FieldTemplateStore] Save template error:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  // 保存模板版本
  const saveTemplateVersion = (template) => {
    // 实际项目中应该保存到后端或本地存储
    const versions = JSON.parse(localStorage.getItem(`template_versions_${template.id}`) || '[]')
    versions.push({
      ...template,
      archivedAt: new Date().toISOString()
    })
    localStorage.setItem(`template_versions_${template.id}`, JSON.stringify(versions))
  }

  // 获取模板版本历史
  const getTemplateVersions = (templateId) => {
    return JSON.parse(localStorage.getItem(`template_versions_${templateId}`) || '[]')
  }

  // 删除模板
  const deleteTemplate = async (id) => {
    try {
      await workflowTemplateApi.deleteTemplate?.(id)
    } catch (error) {
      console.warn('[FieldTemplateStore] API delete failed:', error)
    }

    const index = templates.value.findIndex(t => t.id === id)
    if (index >= 0) {
      templates.value.splice(index, 1)
    }
  }

  // 发布模板
  const publishTemplate = async (id) => {
    const template = getTemplateById(id)
    if (!template) throw new Error('Template not found')

    const publishedTemplate = {
      ...template,
      metadata: {
        ...template.metadata,
        status: 'active',
        publishTime: new Date().toISOString()
      }
    }

    const index = templates.value.findIndex(t => t.id === id)
    if (index >= 0) {
      templates.value[index] = publishedTemplate
    }

    return publishedTemplate
  }

  // 克隆模板
  const cloneTemplate = async (id, overrides = {}) => {
    const sourceTemplate = getTemplateById(id)
    if (!sourceTemplate) throw new Error('Source template not found')

    const clonedTemplate = {
      ...sourceTemplate,
      id: undefined,
      code: `${sourceTemplate.code}_CLONE`,
      name: `${sourceTemplate.name} (复制)`,
      metadata: {
        version: 1,
        isDefault: false,
        creator: 'system',
        createTime: new Date().toISOString(),
        status: 'draft'
      },
      ...overrides
    }

    return saveTemplate(clonedTemplate)
  }

  // 设置默认模板
  const setDefaultTemplate = async (id) => {
    const template = getTemplateById(id)
    if (!template) throw new Error('Template not found')

    // 取消同类型的其他默认模板
    templates.value.forEach(t => {
      const sameType = t.scope.workorderTypes.some(type => 
        template.scope.workorderTypes.includes(type)
      )
      if (sameType && t.id !== id) {
        t.metadata = {
          ...t.metadata,
          isDefault: false
        }
      }
    })

    // 设置当前为默认
    const index = templates.value.findIndex(t => t.id === id)
    if (index >= 0) {
      templates.value[index].metadata = {
        ...templates.value[index].metadata,
        isDefault: true
      }
    }
  }

  // 保存客户配置
  const saveCustomerConfig = async (config) => {
    const existingIndex = customerConfigs.value.findIndex(c => 
      c.customerId === config.customerId && c.templateId === config.templateId
    )

    const newConfig = {
      ...config,
      id: config.id || `customer_config_${Date.now()}`,
      metadata: {
        version: existingIndex >= 0 
          ? (customerConfigs.value[existingIndex].metadata?.version || 0) + 1
          : 1,
        createTime: existingIndex >= 0 
          ? customerConfigs.value[existingIndex].metadata?.createTime 
          : new Date().toISOString(),
        updateTime: new Date().toISOString(),
        status: 'active'
      }
    }

    if (existingIndex >= 0) {
      customerConfigs.value[existingIndex] = newConfig
    } else {
      customerConfigs.value.push(newConfig)
    }

    return newConfig
  }

  // 删除客户配置
  const deleteCustomerConfig = (customerId, templateId) => {
    const index = customerConfigs.value.findIndex(c => 
      c.customerId === customerId && c.templateId === templateId
    )
    if (index >= 0) {
      customerConfigs.value.splice(index, 1)
    }
  }

  // 设置当前模板
  const setCurrentTemplate = (template) => {
    currentTemplate.value = template
  }

  // 导出模板
  const exportTemplate = (templateId) => {
    const template = getTemplateById(templateId)
    if (!template) throw new Error('Template not found')

    return {
      version: '1.0',
      exportTime: new Date().toISOString(),
      template: {
        ...template,
        metadata: undefined
      }
    }
  }

  // 导入模板
  const importTemplate = (config) => {
    if (!config.template) throw new Error('Invalid template config')

    const importedTemplate = {
      ...config.template,
      id: `template_${Date.now()}`,
      code: `${config.template.code}_IMPORTED`,
      name: `${config.template.name} (导入)`,
      metadata: {
        version: 1,
        isDefault: false,
        creator: 'import',
        createTime: new Date().toISOString(),
        status: 'draft'
      }
    }

    templates.value.push(importedTemplate)
    return importedTemplate
  }

  // 搜索模板
  const searchTemplates = (keyword) => {
    if (!keyword) return templates.value
    const lowerKeyword = keyword.toLowerCase()
    return templates.value.filter(t => 
      t.name.toLowerCase().includes(lowerKeyword) ||
      t.code.toLowerCase().includes(lowerKeyword) ||
      t.description?.toLowerCase().includes(lowerKeyword)
    )
  }

  // 获取模板的字段统计
  const getTemplateStats = (templateId) => {
    const template = getTemplateById(templateId)
    if (!template) return null

    const fields = template.fields || []
    const fieldConfig = useFieldConfigStore()

    const stats = {
      totalFields: fields.length,
      byCategory: {},
      byType: {},
      requiredFields: 0
    }

    fields.forEach(instance => {
      const fieldDef = fieldConfig.getFieldDefinition(instance.fieldDefId)
      if (fieldDef) {
        // 按分类统计
        stats.byCategory[fieldDef.category] = (stats.byCategory[fieldDef.category] || 0) + 1
        // 按类型统计
        stats.byType[fieldDef.type] = (stats.byType[fieldDef.type] || 0) + 1
        // 必填字段统计
        if (instance.override?.required || fieldDef.config?.required) {
          stats.requiredFields++
        }
      }
    })

    return stats
  }

  const store = {
    // State - 使用 getter 返回实际值，避免 ComputedRefImpl 问题
    get templates() { return templates.value },
    get customerConfigs() { return customerConfigs.value },
    get loading() { return loading.value },
    get currentTemplate() { return currentTemplate.value },

    // Getters - 使用 getter 返回实际值，避免 ComputedRefImpl 问题
    get allTemplates() { return allTemplates.value },
    get activeTemplates() { return activeTemplates.value },
    get defaultTemplates() { return defaultTemplates.value },

    // Methods
    getTemplateById,
    getTemplateByCode,
    getTemplateByScope,
    getTemplateFields,
    getCustomerConfig,
    loadTemplates,
    saveTemplate,
    getTemplateVersions,
    deleteTemplate,
    publishTemplate,
    cloneTemplate,
    setDefaultTemplate,
    saveCustomerConfig,
    deleteCustomerConfig,
    setCurrentTemplate,
    exportTemplate,
    importTemplate,
    searchTemplates,
    getTemplateStats
  }

  storeInstance = store
  return store
}
