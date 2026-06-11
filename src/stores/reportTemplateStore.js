import { ref, computed } from 'vue'

/**
 * 报告模板类型
 */
export const TemplateType = {
  SERVICE_REPORT: 'service_report',    // 服务报告书
  SETTLEMENT: 'settlement'             // 结算单
}

/**
 * 模板类型显示名称
 */
export const TemplateTypeText = {
  [TemplateType.SERVICE_REPORT]: '服务报告书',
  [TemplateType.SETTLEMENT]: '结算单'
}

/**
 * 可用字段定义（用于字段映射）
 */
export const AvailableFields = {
  // 工单基础信息
  workorderId: { label: '工单号', type: 'text' },
  customerName: { label: '客户名称', type: 'text' },
  customerAddress: { label: '客户地址', type: 'text' },
  deviceSerialNumber: { label: '设备序列号', type: 'text' },
  deviceModel: { label: '设备型号', type: 'text' },
  assignEngineer: { label: '指派工程师', type: 'text' },
  createTime: { label: '创建时间', type: 'datetime' },
  finishTime: { label: '完成时间', type: 'datetime' },
  
  // 报告信息
  reportNo: { label: '报告编号', type: 'text' },
  serviceDate: { label: '服务日期', type: 'date' },
  faultDescription: { label: '故障描述', type: 'textarea' },
  solution: { label: '处理措施', type: 'textarea' },
  serviceResult: { label: '服务结果', type: 'text' },
  remark: { label: '备注', type: 'textarea' },
  
  // 配件信息（数组类型）
  parts: { label: '配件清单', type: 'array', fields: ['name', 'model', 'quantity', 'price'] },
  
  // 费用信息
  totalAmount: { label: '总金额', type: 'number' },
  materialCost: { label: '材料费', type: 'number' },
  laborCost: { label: '人工费', type: 'number' },
  otherCost: { label: '其他费用', type: 'number' },
  
  // 签字信息
  customerSign: { label: '客户签字', type: 'image' },
  engineerSign: { label: '工程师签字', type: 'image' },
  signDate: { label: '签字日期', type: 'date' }
}

/**
 * 模板存储
 */
export const reportTemplates = ref([
  {
    id: 'default_service_report',
    name: '默认服务报告书模板',
    type: TemplateType.SERVICE_REPORT,
    description: '系统默认服务报告书模板',
    isDefault: true,
    createTime: new Date().toISOString(),
    updateTime: new Date().toISOString(),
    // Excel 文件信息
    excelFile: null,
    // 字段映射配置
    fieldMappings: [
      { field: 'workorderId', cellRef: 'B2', type: 'text' },
      { field: 'customerName', cellRef: 'B3', type: 'text' },
      { field: 'serviceDate', cellRef: 'B4', type: 'date' },
      { field: 'assignEngineer', cellRef: 'D4', type: 'text' },
      { field: 'faultDescription', cellRef: 'B6', type: 'textarea' },
      { field: 'solution', cellRef: 'B8', type: 'textarea' },
      { field: 'serviceResult', cellRef: 'B10', type: 'text' },
      { field: 'customerSign', cellRef: 'B15', type: 'image' },
      { field: 'signDate', cellRef: 'D15', type: 'date' }
    ],
    // 表格配置（用于配件列表等动态数据）
    tableConfigs: [
      {
        name: 'parts',
        startCell: 'A12',
        columns: [
          { field: 'name', header: '配件名称' },
          { field: 'model', header: '型号规格' },
          { field: 'quantity', header: '数量' }
        ]
      }
    ]
  }
])

/**
 * 获取所有模板
 */
export const getAllTemplates = () => {
  return reportTemplates.value
}

/**
 * 根据类型获取模板
 */
export const getTemplatesByType = (type) => {
  return reportTemplates.value.filter(t => t.type === type)
}

/**
 * 获取默认模板
 */
export const getDefaultTemplate = (type) => {
  return reportTemplates.value.find(t => t.type === type && t.isDefault)
}

/**
 * 根据ID获取模板
 */
export const getTemplateById = (id) => {
  return reportTemplates.value.find(t => t.id === id)
}

/**
 * 添加新模板
 */
export const addTemplate = (template) => {
  const newTemplate = {
    id: 'template_' + Date.now(),
    ...template,
    createTime: new Date().toISOString(),
    updateTime: new Date().toISOString()
  }
  reportTemplates.value.push(newTemplate)
  return newTemplate
}

/**
 * 更新模板
 */
export const updateTemplate = (id, updates) => {
  const index = reportTemplates.value.findIndex(t => t.id === id)
  if (index !== -1) {
    reportTemplates.value[index] = {
      ...reportTemplates.value[index],
      ...updates,
      updateTime: new Date().toISOString()
    }
    return reportTemplates.value[index]
  }
  return null
}

/**
 * 删除模板
 */
export const deleteTemplate = (id) => {
  const index = reportTemplates.value.findIndex(t => t.id === id)
  if (index !== -1 && !reportTemplates.value[index].isDefault) {
    reportTemplates.value.splice(index, 1)
    return true
  }
  return false
}

/**
 * 设置默认模板
 */
export const setDefaultTemplate = (id) => {
  const template = reportTemplates.value.find(t => t.id === id)
  if (template) {
    // 取消同类型的其他默认模板
    reportTemplates.value
      .filter(t => t.type === template.type)
      .forEach(t => { t.isDefault = false })
    // 设置当前为默认
    template.isDefault = true
    template.updateTime = new Date().toISOString()
    return true
  }
  return false
}

/**
 * 上传Excel文件
 */
export const uploadExcelFile = async (file, templateId) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const data = e.target.result
      // 更新模板的Excel文件信息
      const template = reportTemplates.value.find(t => t.id === templateId)
      if (template) {
        template.excelFile = {
          name: file.name,
          size: file.size,
          type: file.type,
          data: data, // Base64编码的Excel数据
          uploadTime: new Date().toISOString()
        }
        template.updateTime = new Date().toISOString()
        resolve(template.excelFile)
      } else {
        reject(new Error('模板不存在'))
      }
    }
    reader.onerror = (e) => reject(e)
    reader.readAsDataURL(file)
  })
}

/**
 * 解析Excel模板（用于预览和验证）
 */
export const parseExcelTemplate = (excelData) => {
  // 这里可以使用 xlsx.js 库来解析Excel
  // 返回工作表信息和单元格数据
  return {
    sheets: [],
    cellRefs: []
  }
}

/**
 * 根据模板和数据生成报告数据
 */
export const generateReportData = (template, workorderData) => {
  const result = {
    textFields: {},
    tableData: {},
    images: {}
  }
  
  // 处理字段映射
  if (template.fieldMappings) {
    template.fieldMappings.forEach(mapping => {
      const value = getFieldValue(workorderData, mapping.field)
      if (mapping.type === 'image') {
        result.images[mapping.cellRef] = value
      } else {
        result.textFields[mapping.cellRef] = formatValue(value, mapping.type)
      }
    })
  }
  
  // 处理表格数据
  if (template.tableConfigs) {
    template.tableConfigs.forEach(config => {
      const data = getFieldValue(workorderData, config.name)
      if (Array.isArray(data)) {
        result.tableData[config.name] = data.map(row => {
          const rowData = {}
          config.columns.forEach(col => {
            rowData[col.field] = row[col.field] || ''
          })
          return rowData
        })
      }
    })
  }
  
  return result
}

/**
 * 获取字段值（支持嵌套路径）
 */
const getFieldValue = (data, field) => {
  const keys = field.split('.')
  let value = data
  for (const key of keys) {
    if (value && typeof value === 'object') {
      value = value[key]
    } else {
      return undefined
    }
  }
  return value
}

/**
 * 格式化值
 */
const formatValue = (value, type) => {
  if (value === undefined || value === null) return ''
  
  switch (type) {
    case 'date':
      return new Date(value).toLocaleDateString('zh-CN')
    case 'datetime':
      return new Date(value).toLocaleString('zh-CN')
    case 'number':
      return Number(value).toFixed(2)
    default:
      return String(value)
  }
}
