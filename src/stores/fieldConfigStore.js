import { ref, computed } from 'vue'
import { fieldTypeRegistry, FieldCategories } from './fieldTypeRegistry'
import { formConfigApi } from '../api/workflowApi'

/**
 * 字段配置中心 Store
 * 管理字段定义、字段分组、字段模板等核心数据
 */

// ==================== 默认字段定义 ====================

const DefaultFieldDefinitions = [
  // 基础字段
  {
    id: 'field_workorder_no',
    code: 'workorderNo',
    name: '工单编号',
    type: 'text',
    category: FieldCategories.BASIC,
    description: '工单唯一编号',
    config: {
      label: '工单编号',
      placeholder: '请输入工单编号',
      required: true,
      disabled: true
    },
    validation: [
      { required: true, message: '工单编号不能为空' }
    ]
  },
  {
    id: 'field_title',
    code: 'title',
    name: '工单标题',
    type: 'text',
    category: FieldCategories.BASIC,
    description: '工单标题',
    config: {
      label: '工单标题',
      placeholder: '请输入工单标题',
      required: true,
      maxLength: 100
    },
    validation: [
      { required: true, message: '工单标题不能为空' },
      { max: 100, message: '标题长度不能超过100个字符' }
    ]
  },
  {
    id: 'field_description',
    code: 'description',
    name: '问题描述',
    type: 'textarea',
    category: FieldCategories.BASIC,
    description: '详细描述问题',
    config: {
      label: '问题描述',
      placeholder: '请详细描述问题情况',
      required: true,
      rows: 4,
      maxLength: 2000
    },
    validation: [
      { required: true, message: '问题描述不能为空' }
    ]
  },
  {
    id: 'field_priority',
    code: 'priority',
    name: '优先级',
    type: 'select',
    category: FieldCategories.SELECT,
    description: '工单优先级',
    config: {
      label: '优先级',
      placeholder: '请选择优先级',
      required: true
    },
    dataSource: {
      type: 'static',
      options: [
        { label: '紧急', value: 'urgent', color: '#F56C6C' },
        { label: '高', value: 'high', color: '#E6A23C' },
        { label: '普通', value: 'normal', color: '#409EFF' },
        { label: '低', value: 'low', color: '#909399' }
      ]
    },
    validation: [
      { required: true, message: '请选择优先级' }
    ]
  },
  {
    id: 'field_engineer',
    code: 'engineer',
    name: '工程师',
    type: 'engineerSelector',
    category: FieldCategories.BUSINESS,
    description: '指派工程师',
    config: {
      label: '指派工程师',
      placeholder: '请选择工程师',
      required: true
    },
    dataSource: {
      type: 'api',
      api: '/api/engineers',
      labelField: 'name',
      valueField: 'id'
    }
  },
  {
    id: 'field_customer',
    code: 'customer',
    name: '客户',
    type: 'customerSelector',
    category: FieldCategories.BUSINESS,
    description: '关联客户',
    config: {
      label: '客户',
      placeholder: '请选择客户',
      required: true
    }
  },
  {
    id: 'field_asset',
    code: 'asset',
    name: '设备',
    type: 'assetSelector',
    category: FieldCategories.BUSINESS,
    description: '关联设备',
    config: {
      label: '设备',
      placeholder: '请选择设备',
      required: false
    }
  },
  {
    id: 'field_service_date',
    code: 'serviceDate',
    name: '服务日期',
    type: 'date',
    category: FieldCategories.BASIC,
    description: '计划服务日期',
    config: {
      label: '服务日期',
      placeholder: '请选择服务日期',
      required: true
    }
  },
  {
    id: 'field_arrive_time',
    code: 'arriveTime',
    name: '到场时间',
    type: 'datetime',
    category: FieldCategories.BASIC,
    description: '工程师到场时间',
    config: {
      label: '到场时间',
      placeholder: '请选择到场时间',
      required: true
    }
  },
  {
    id: 'field_location',
    code: 'location',
    name: '位置',
    type: 'location',
    category: FieldCategories.BUSINESS,
    description: '服务地点',
    config: {
      label: '服务地点',
      placeholder: '请选择或输入服务地点',
      required: true,
      autoLocate: true
    }
  },
  {
    id: 'field_photos',
    code: 'photos',
    name: '现场照片',
    type: 'imageUpload',
    category: FieldCategories.BUSINESS,
    description: '上传现场照片',
    config: {
      label: '现场照片',
      multiple: true,
      maxCount: 9,
      maxSize: 10
    }
  },
  {
    id: 'field_fault_description',
    code: 'faultDescription',
    name: '故障描述',
    type: 'textarea',
    category: FieldCategories.BASIC,
    description: '故障现象描述',
    config: {
      label: '故障描述',
      placeholder: '请详细描述故障现象',
      required: true,
      rows: 4
    }
  },
  {
    id: 'field_solution',
    code: 'solution',
    name: '处理措施',
    type: 'textarea',
    category: FieldCategories.BASIC,
    description: '解决方案',
    config: {
      label: '处理措施',
      placeholder: '请描述采取的解决措施',
      required: true,
      rows: 4
    }
  },
  {
    id: 'field_parts',
    code: 'parts',
    name: '更换配件',
    type: 'partsSelector',
    category: FieldCategories.BUSINESS,
    description: '更换的配件清单',
    config: {
      label: '更换配件',
      multiple: true,
      showPrice: true,
      showInventory: true
    }
  },
  {
    id: 'field_work_hours',
    code: 'workHours',
    name: '工时',
    type: 'number',
    category: FieldCategories.BASIC,
    description: '工作时长（小时）',
    config: {
      label: '工时(小时)',
      placeholder: '请输入工时',
      required: true,
      min: 0,
      precision: 1,
      step: 0.5
    }
  },
  {
    id: 'field_labor_cost',
    code: 'laborCost',
    name: '人工费用',
    type: 'number',
    category: FieldCategories.BASIC,
    description: '人工服务费用',
    config: {
      label: '人工费用',
      placeholder: '请输入人工费用',
      required: true,
      min: 0,
      precision: 2
    }
  },
  {
    id: 'field_parts_cost',
    code: 'partsCost',
    name: '配件费用',
    type: 'number',
    category: FieldCategories.BASIC,
    description: '配件总费用',
    config: {
      label: '配件费用',
      placeholder: '请输入配件费用',
      required: true,
      min: 0,
      precision: 2
    }
  },
  {
    id: 'field_total_amount',
    code: 'totalAmount',
    name: '合计金额',
    type: 'computed',
    category: FieldCategories.ADVANCED,
    description: '费用合计',
    config: {
      label: '合计金额',
      disabled: true
    },
    computed: {
      formula: '{{laborCost}} + {{partsCost}}',
      precision: 2
    }
  },
  {
    id: 'field_signature',
    code: 'signature',
    name: '电子签名',
    type: 'signature',
    category: FieldCategories.BUSINESS,
    description: '客户电子签名',
    config: {
      label: '客户签名',
      required: true,
      width: 400,
      height: 200
    }
  },
  {
    id: 'field_rating',
    code: 'rating',
    name: '服务评分',
    type: 'rate',
    category: FieldCategories.BUSINESS,
    description: '客户满意度评分',
    config: {
      label: '服务评分',
      required: true,
      max: 5,
      allowHalf: true
    }
  },
  {
    id: 'field_comment',
    code: 'comment',
    name: '评价内容',
    type: 'textarea',
    category: FieldCategories.BASIC,
    description: '客户评价',
    config: {
      label: '评价内容',
      placeholder: '请输入您的评价',
      rows: 3,
      maxLength: 500
    }
  },
  {
    id: 'field_reject_reason',
    code: 'rejectReason',
    name: '拒单原因',
    type: 'textarea',
    category: FieldCategories.BASIC,
    description: '工程师拒单原因',
    config: {
      label: '拒单原因',
      placeholder: '请输入拒单原因',
      required: true,
      rows: 3
    }
  },
  {
    id: 'field_transfer_reason',
    code: 'transferReason',
    name: '转派原因',
    type: 'textarea',
    category: FieldCategories.BASIC,
    description: '转派原因说明',
    config: {
      label: '转派原因',
      placeholder: '请输入转派原因',
      required: true,
      rows: 3
    }
  },
  {
    id: 'field_new_engineer',
    code: 'newEngineer',
    name: '新工程师',
    type: 'engineerSelector',
    category: FieldCategories.BUSINESS,
    description: '转派目标工程师',
    config: {
      label: '新工程师',
      placeholder: '请选择新工程师',
      required: true
    }
  },
  {
    id: 'field_payment_method',
    code: 'paymentMethod',
    name: '支付方式',
    type: 'select',
    category: FieldCategories.SELECT,
    description: '结算支付方式',
    config: {
      label: '支付方式',
      placeholder: '请选择支付方式',
      required: true
    },
    dataSource: {
      type: 'static',
      options: [
        { label: '现金', value: 'cash' },
        { label: '转账', value: 'transfer' },
        { label: '支票', value: 'check' },
        { label: '在线支付', value: 'online' }
      ]
    }
  },
  {
    id: 'field_inspection_items',
    code: 'inspectionItems',
    name: '巡检项目',
    type: 'table',
    category: FieldCategories.ADVANCED,
    description: '设备巡检项目清单',
    config: {
      label: '巡检项目',
      required: true
    },
    tableConfig: {
      columns: [
        { field: 'itemName', label: '检查项', type: 'text', width: 200 },
        { field: 'standard', label: '标准', type: 'text', width: 200 },
        { field: 'result', label: '结果', type: 'select', width: 150, 
          options: [
            { label: '正常', value: 'normal' },
            { label: '异常', value: 'abnormal' },
            { label: '不适用', value: 'na' }
          ]
        },
        { field: 'remark', label: '备注', type: 'text', width: 200 }
      ]
    }
  },
  {
    id: 'field_remark',
    code: 'remark',
    name: '备注',
    type: 'textarea',
    category: FieldCategories.BASIC,
    description: '备注信息',
    config: {
      label: '备注',
      placeholder: '请输入备注信息',
      rows: 3,
      maxLength: 1000
    }
  }
]

// ==================== 默认字段分组 ====================

const DefaultFieldGroups = [
  {
    id: 'group_basic',
    code: 'basic',
    name: '基本信息',
    description: '工单基本信息字段',
    sortOrder: 1,
    fields: ['workorderNo', 'title', 'customer', 'asset', 'priority', 'serviceDate']
  },
  {
    id: 'group_dispatch',
    code: 'dispatch',
    name: '派单信息',
    description: '派单相关字段',
    sortOrder: 2,
    fields: ['engineer', 'location', 'arriveTime']
  },
  {
    id: 'group_service',
    code: 'service',
    name: '服务信息',
    description: '服务执行相关字段',
    sortOrder: 3,
    fields: ['faultDescription', 'solution', 'parts', 'workHours', 'photos']
  },
  {
    id: 'group_settlement',
    code: 'settlement',
    name: '结算信息',
    description: '费用结算相关字段',
    sortOrder: 4,
    fields: ['laborCost', 'partsCost', 'totalAmount', 'paymentMethod']
  },
  {
    id: 'group_evaluation',
    code: 'evaluation',
    name: '评价信息',
    description: '客户评价相关字段',
    sortOrder: 5,
    fields: ['rating', 'comment', 'signature']
  }
]

// ==================== Store 定义 ====================

let storeInstance = null

export const useFieldConfigStore = () => {
  if (storeInstance) return storeInstance

  // 初始化字段类型注册表
  fieldTypeRegistry.init()

  // State
  const fieldDefinitions = ref([...DefaultFieldDefinitions])
  const fieldGroups = ref([...DefaultFieldGroups])
  const loading = ref(false)
  const currentField = ref(null)

  // ==================== Getters ====================

  // 获取所有字段定义
  const allFields = computed(() => {
    return Array.isArray(fieldDefinitions.value) ? fieldDefinitions.value : []
  })

  // 获取激活的字段定义
  const activeFields = computed(() => {
    return fieldDefinitions.value.filter(f => f.metadata?.status !== 'inactive')
  })

  // 按分类获取字段
  const getFieldsByCategory = (category) => {
    return fieldDefinitions.value.filter(f => f.category === category)
  }

  // 按类型获取字段
  const getFieldsByType = (type) => {
    return fieldDefinitions.value.filter(f => f.type === type)
  }

  // 获取字段定义
  const getFieldDefinition = (idOrCode) => {
    return fieldDefinitions.value.find(f => 
      f.id === idOrCode || f.code === idOrCode
    )
  }

  // 获取字段分组
  const getFieldGroup = (idOrCode) => {
    return fieldGroups.value.find(g => 
      g.id === idOrCode || g.code === idOrCode
    )
  }

  // 获取分组下的字段
  const getFieldsByGroup = (groupId) => {
    const group = getFieldGroup(groupId)
    if (!group) return []
    return group.fields.map(fieldCode => getFieldDefinition(fieldCode)).filter(Boolean)
  }

  // 搜索字段
  const searchFields = (keyword) => {
    if (!keyword) return fieldDefinitions.value
    const lowerKeyword = keyword.toLowerCase()
    return fieldDefinitions.value.filter(f => 
      f.name.toLowerCase().includes(lowerKeyword) ||
      f.code.toLowerCase().includes(lowerKeyword) ||
      f.description?.toLowerCase().includes(lowerKeyword)
    )
  }

  // ==================== Actions ====================

  // 加载字段定义
  const loadFieldDefinitions = async () => {
    loading.value = true
    try {
      const response = await formConfigApi.getFormFields()
      if (response && response.data && response.data.length > 0) {
        fieldDefinitions.value = response.data
      }
      return fieldDefinitions.value
    } catch (error) {
      console.warn('[FieldConfigStore] Failed to load from API, using defaults:', error)
      return fieldDefinitions.value
    } finally {
      loading.value = false
    }
  }

  // 保存字段定义
  const saveFieldDefinition = async (fieldDef) => {
    loading.value = true
    try {
      const isUpdate = fieldDef.id && fieldDefinitions.value.some(f => f.id === fieldDef.id)
      
      if (isUpdate) {
        // 更新
        const response = await formConfigApi.updateFormField?.(fieldDef.id, fieldDef)
        if (response?.data) {
          const index = fieldDefinitions.value.findIndex(f => f.id === fieldDef.id)
          if (index >= 0) {
            fieldDefinitions.value[index] = {
              ...fieldDefinitions.value[index],
              ...response.data,
              metadata: {
                ...fieldDefinitions.value[index].metadata,
                ...response.data.metadata,
                updateTime: new Date().toISOString()
              }
            }
          }
        }
      } else {
        // 创建
        const newField = {
          ...fieldDef,
          id: fieldDef.id || `field_${Date.now()}`,
          metadata: {
            creator: 'system',
            createTime: new Date().toISOString(),
            updater: 'system',
            updateTime: new Date().toISOString(),
            version: 1,
            status: 'active'
          }
        }
        
        const response = await formConfigApi.createFormField?.(newField)
        if (response?.data) {
          fieldDefinitions.value.push(response.data)
        } else {
          fieldDefinitions.value.push(newField)
        }
      }
      
      return fieldDef
    } catch (error) {
      console.error('[FieldConfigStore] Save field definition error:', error)
      // 本地模式回退
      return saveFieldDefinitionLocal(fieldDef)
    } finally {
      loading.value = false
    }
  }

  // 本地保存字段定义（fallback）
  const saveFieldDefinitionLocal = (fieldDef) => {
    const index = fieldDefinitions.value.findIndex(f => f.id === fieldDef.id)
    
    if (index >= 0) {
      // 更新
      fieldDefinitions.value[index] = {
        ...fieldDefinitions.value[index],
        ...fieldDef,
        metadata: {
          ...fieldDefinitions.value[index].metadata,
          ...fieldDef.metadata,
          updateTime: new Date().toISOString(),
          version: (fieldDefinitions.value[index].metadata?.version || 0) + 1
        }
      }
      return fieldDefinitions.value[index]
    } else {
      // 创建
      const newField = {
        ...fieldDef,
        id: fieldDef.id || `field_${Date.now()}`,
        metadata: {
          creator: 'system',
          createTime: new Date().toISOString(),
          updater: 'system',
          updateTime: new Date().toISOString(),
          version: 1,
          status: 'active'
        }
      }
      fieldDefinitions.value.push(newField)
      return newField
    }
  }

  // 删除字段定义
  const deleteFieldDefinition = async (id) => {
    try {
      await formConfigApi.deleteFormField?.(id)
    } catch (error) {
      console.warn('[FieldConfigStore] API delete failed:', error)
    }
    
    const index = fieldDefinitions.value.findIndex(f => f.id === id)
    if (index >= 0) {
      fieldDefinitions.value.splice(index, 1)
    }
    
    // 从分组中移除
    fieldGroups.value.forEach(group => {
      const fieldIndex = group.fields.indexOf(id)
      if (fieldIndex >= 0) {
        group.fields.splice(fieldIndex, 1)
      }
    })
  }

  // 创建字段定义
  const createFieldDefinition = (typeCode, overrides = {}) => {
    const type = fieldTypeRegistry.getType(typeCode)
    if (!type) {
      throw new Error(`Unknown field type: ${typeCode}`)
    }

    const defaultConfig = fieldTypeRegistry.getDefaultConfig(typeCode)
    
    const newField = {
      id: `field_${Date.now()}`,
      code: overrides.code || `field_${Math.random().toString(36).substr(2, 9)}`,
      name: overrides.name || type.name,
      type: typeCode,
      category: type.category,
      description: overrides.description || type.description,
      config: {
        ...defaultConfig,
        label: overrides.name || type.name,
        ...overrides.config
      },
      validation: overrides.validation || [],
      dataSource: overrides.dataSource || null,
      displayControl: overrides.displayControl || null,
      linkageRules: overrides.linkageRules || [],
      metadata: {
        creator: 'system',
        createTime: new Date().toISOString(),
        updater: 'system',
        updateTime: new Date().toISOString(),
        version: 1,
        status: 'active'
      }
    }

    return newField
  }

  // 保存字段分组
  const saveFieldGroup = async (group) => {
    const index = fieldGroups.value.findIndex(g => g.id === group.id)
    
    if (index >= 0) {
      fieldGroups.value[index] = {
        ...fieldGroups.value[index],
        ...group,
        metadata: {
          ...fieldGroups.value[index].metadata,
          updateTime: new Date().toISOString()
        }
      }
      return fieldGroups.value[index]
    } else {
      const newGroup = {
        ...group,
        id: group.id || `group_${Date.now()}`,
        metadata: {
          creator: 'system',
          createTime: new Date().toISOString(),
          status: 'active'
        }
      }
      fieldGroups.value.push(newGroup)
      return newGroup
    }
  }

  // 删除字段分组
  const deleteFieldGroup = (id) => {
    const index = fieldGroups.value.findIndex(g => g.id === id)
    if (index >= 0) {
      fieldGroups.value.splice(index, 1)
    }
  }

  // 设置当前字段
  const setCurrentField = (field) => {
    currentField.value = field
  }

  // 获取字段类型列表
  const getFieldTypes = () => {
    return fieldTypeRegistry.getAllTypes()
  }

  // 获取字段分类列表
  const getFieldCategories = () => {
    return fieldTypeRegistry.getCategories()
  }

  // 验证字段编码唯一性
  const validateFieldCode = (code, excludeId = null) => {
    return !fieldDefinitions.value.some(f => 
      f.code === code && f.id !== excludeId
    )
  }

  // 导出字段配置
  const exportFieldConfig = (fieldIds = null) => {
    const fields = fieldIds 
      ? fieldDefinitions.value.filter(f => fieldIds.includes(f.id))
      : fieldDefinitions.value
    
    return {
      version: '1.0',
      exportTime: new Date().toISOString(),
      fields: fields.map(f => ({
        ...f,
        metadata: undefined // 不包含元数据
      })),
      groups: fieldGroups.value.map(g => ({
        ...g,
        metadata: undefined
      }))
    }
  }

  // 导入字段配置
  const importFieldConfig = (config) => {
    if (config.fields) {
      config.fields.forEach(field => {
        const existingIndex = fieldDefinitions.value.findIndex(f => f.code === field.code)
        if (existingIndex >= 0) {
          // 更新现有字段
          fieldDefinitions.value[existingIndex] = {
            ...fieldDefinitions.value[existingIndex],
            ...field,
            metadata: {
              ...fieldDefinitions.value[existingIndex].metadata,
              updateTime: new Date().toISOString(),
              version: (fieldDefinitions.value[existingIndex].metadata?.version || 0) + 1
            }
          }
        } else {
          // 添加新字段
          fieldDefinitions.value.push({
            ...field,
            id: `field_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            metadata: {
              creator: 'import',
              createTime: new Date().toISOString(),
              updater: 'import',
              updateTime: new Date().toISOString(),
              version: 1,
              status: 'active'
            }
          })
        }
      })
    }

    if (config.groups) {
      config.groups.forEach(group => {
        const existingIndex = fieldGroups.value.findIndex(g => g.code === group.code)
        if (existingIndex >= 0) {
          fieldGroups.value[existingIndex] = {
            ...fieldGroups.value[existingIndex],
            ...group
          }
        } else {
          fieldGroups.value.push({
            ...group,
            id: `group_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            metadata: {
              creator: 'import',
              createTime: new Date().toISOString(),
              status: 'active'
            }
          })
        }
      })
    }
  }

  const store = {
    // State - 使用 getter 返回实际值，避免 ComputedRefImpl 问题
    get fieldDefinitions() { return fieldDefinitions.value },
    get fieldGroups() { return fieldGroups.value },
    get loading() { return loading.value },
    get currentField() { return currentField.value },

    // Getters - 使用 getter 返回实际值，避免 ComputedRefImpl 问题
    get allFields() { return allFields.value },
    get activeFields() { return activeFields.value },

    // Methods
    getFieldsByCategory,
    getFieldsByType,
    getFieldDefinition,
    getFieldGroup,
    getFieldsByGroup,
    searchFields,
    loadFieldDefinitions,
    saveFieldDefinition,
    deleteFieldDefinition,
    createFieldDefinition,
    saveFieldGroup,
    deleteFieldGroup,
    setCurrentField,
    getFieldTypes,
    getFieldCategories,
    validateFieldCode,
    exportFieldConfig,
    importFieldConfig
  }

  storeInstance = store
  return store
}
