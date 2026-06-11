import axios from 'axios'

// 创建axios实例
const getBaseURL = () => {
  const envURL = import.meta.env.VITE_API_BASE_URL
  if (!envURL) return 'http://localhost:3456/api'
  // 确保 URL 以 http:// 或 https:// 开头
  if (envURL.startsWith('http://') || envURL.startsWith('https://')) {
    return envURL
  }
  // 如果 URL 以 / 开头，说明是相对路径，需要添加协议和主机
  if (envURL.startsWith('/')) {
    return `${window.location.protocol}//${window.location.host}${envURL}`
  }
  // 其他情况，添加 http:// 协议
  return `http://${envURL}`
}

const apiClient = axios.create({
  baseURL: getBaseURL(),
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
apiClient.interceptors.request.use(
  config => {
    // 可以在这里添加token等
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

// 响应拦截器
apiClient.interceptors.response.use(
  response => {
    return response.data
  },
  error => {
    console.error('API Error:', error)
    return Promise.reject(error)
  }
)

/**
 * 流程模板API
 */
export const workflowTemplateApi = {
  /**
   * 获取所有流程模板
   */
  getTemplates() {
    return apiClient.get('/workflow/templates')
  },

  /**
   * 获取单个流程模板
   * @param {string} id - 模板ID
   */
  getTemplate(id) {
    return apiClient.get(`/workflow/templates/${id}`)
  },

  /**
   * 根据工单类型获取默认模板
   * @param {string} type - 工单类型
   * @param {string} scene - 场景（可选）
   */
  getTemplateByType(type, scene = null) {
    return apiClient.get('/workflow/templates/default', {
      params: { type, scene }
    })
  },

  /**
   * 创建流程模板
   * @param {Object} data - 模板数据
   */
  createTemplate(data) {
    return apiClient.post('/workflow/templates', data)
  },

  /**
   * 更新流程模板
   * @param {string} id - 模板ID
   * @param {Object} data - 模板数据
   */
  updateTemplate(id, data) {
    return apiClient.put(`/workflow/templates/${id}`, data)
  },

  /**
   * 删除流程模板
   * @param {string} id - 模板ID
   */
  deleteTemplate(id) {
    return apiClient.delete(`/workflow/templates/${id}`)
  },

  /**
   * 设置默认模板
   * @param {string} id - 模板ID
   */
  setDefaultTemplate(id) {
    return apiClient.post(`/workflow/templates/${id}/set-default`)
  },

  /**
   * 更新模板节点配置
   * @param {string} id - 模板ID
   * @param {Array} nodes - 节点配置
   */
  updateTemplateNodes(id, nodes) {
    return apiClient.put(`/workflow/templates/${id}/nodes`, { nodes })
  }
}

/**
 * 流程实例API
 */
export const workflowInstanceApi = {
  /**
   * 初始化流程实例
   * @param {string} workorderId - 工单ID
   * @param {Object} data - 工单数据
   */
  initInstance(workorderId, data) {
    return apiClient.post(`/workflow/instances/${workorderId}/init`, data)
  },

  /**
   * 获取流程实例
   * @param {string} workorderId - 工单ID
   */
  getInstance(workorderId) {
    return apiClient.get(`/workflow/instances/${workorderId}`)
  },

  /**
   * 执行流程操作
   * @param {string} workorderId - 工单ID
   * @param {Object} data - 操作数据
   */
  executeAction(workorderId, data) {
    return apiClient.post(`/workflow/instances/${workorderId}/actions`, data)
  },

  /**
   * 批量执行操作
   * @param {Array} actions - 操作列表
   */
  executeBatchActions(actions) {
    return apiClient.post('/workflow/instances/batch-actions', { actions })
  },

  /**
   * 获取流转历史
   * @param {string} workorderId - 工单ID
   */
  getFlowHistory(workorderId) {
    return apiClient.get(`/workflow/instances/${workorderId}/history`)
  },

  /**
   * 获取流程进度
   * @param {string} workorderId - 工单ID
   */
  getFlowProgress(workorderId) {
    return apiClient.get(`/workflow/instances/${workorderId}/progress`)
  },

  /**
   * 取消流程
   * @param {string} workorderId - 工单ID
   * @param {Object} data - 取消数据
   */
  cancelFlow(workorderId, data) {
    return apiClient.post(`/workflow/instances/${workorderId}/cancel`, data)
  },

  /**
   * 转交工单
   * @param {string} workorderId - 工单ID
   * @param {Object} data - 转交数据
   */
  transferWorkorder(workorderId, data) {
    return apiClient.post(`/workflow/instances/${workorderId}/transfer`, data)
  },

  /**
   * 获取流程统计
   * @param {string} workorderId - 工单ID
   */
  getFlowStatistics(workorderId) {
    return apiClient.get(`/workflow/instances/${workorderId}/statistics`)
  },

  /**
   * 导出流程数据
   * @param {string} workorderId - 工单ID
   */
  exportFlowData(workorderId) {
    return apiClient.get(`/workflow/instances/${workorderId}/export`)
  }
}

/**
 * 表单配置API
 */
export const formConfigApi = {
  /**
   * 获取所有表单字段配置
   */
  getFormFields() {
    return apiClient.get('/workflow/form-fields')
  },

  /**
   * 获取指定字段配置
   * @param {string} fieldName - 字段名称
   */
  getFormField(fieldName) {
    return apiClient.get(`/workflow/form-fields/${fieldName}`)
  },

  /**
   * 创建字段定义
   * @param {Object} data - 字段数据
   */
  createFormField(data) {
    return apiClient.post('/workflow/form-fields', data)
  },

  /**
   * 更新字段定义
   * @param {string} id - 字段ID
   * @param {Object} data - 字段数据
   */
  updateFormField(id, data) {
    return apiClient.put(`/workflow/form-fields/${id}`, data)
  },

  /**
   * 删除字段定义
   * @param {string} id - 字段ID
   */
  deleteFormField(id) {
    return apiClient.delete(`/workflow/form-fields/${id}`)
  },

  /**
   * 获取字段分组列表
   */
  getFieldGroups() {
    return apiClient.get('/workflow/field-groups')
  },

  /**
   * 保存字段分组
   * @param {Object} data - 分组数据
   */
  saveFieldGroup(data) {
    return apiClient.post('/workflow/field-groups', data)
  },

  /**
   * 删除字段分组
   * @param {string} id - 分组ID
   */
  deleteFieldGroup(id) {
    return apiClient.delete(`/workflow/field-groups/${id}`)
  },

  /**
   * 获取字段模板列表
   */
  getFieldTemplates() {
    return apiClient.get('/workflow/field-templates')
  },

  /**
   * 获取指定字段模板
   * @param {string} id - 模板ID
   */
  getFieldTemplate(id) {
    return apiClient.get(`/workflow/field-templates/${id}`)
  },

  /**
   * 创建字段模板
   * @param {Object} data - 模板数据
   */
  createFieldTemplate(data) {
    return apiClient.post('/workflow/field-templates', data)
  },

  /**
   * 更新字段模板
   * @param {string} id - 模板ID
   * @param {Object} data - 模板数据
   */
  updateFieldTemplate(id, data) {
    return apiClient.put(`/workflow/field-templates/${id}`, data)
  },

  /**
   * 删除字段模板
   * @param {string} id - 模板ID
   */
  deleteFieldTemplate(id) {
    return apiClient.delete(`/workflow/field-templates/${id}`)
  },

  /**
   * 发布字段模板
   * @param {string} id - 模板ID
   */
  publishFieldTemplate(id) {
    return apiClient.post(`/workflow/field-templates/${id}/publish`)
  },

  /**
   * 克隆字段模板
   * @param {string} id - 模板ID
   * @param {Object} data - 克隆配置
   */
  cloneFieldTemplate(id, data = {}) {
    return apiClient.post(`/workflow/field-templates/${id}/clone`, data)
  },

  /**
   * 获取客户字段配置
   * @param {string} customerId - 客户ID
   */
  getCustomerFieldConfig(customerId) {
    return apiClient.get(`/workflow/customer-field-configs/${customerId}`)
  },

  /**
   * 保存客户字段配置
   * @param {string} customerId - 客户ID
   * @param {Object} data - 配置数据
   */
  saveCustomerFieldConfig(customerId, data) {
    return apiClient.put(`/workflow/customer-field-configs/${customerId}`, data)
  },

  /**
   * 导出字段配置
   * @param {Array} fieldIds - 字段ID列表
   */
  exportFieldConfig(fieldIds) {
    return apiClient.post('/workflow/form-fields/export', { fieldIds })
  },

  /**
   * 导入字段配置
   * @param {Object} data - 配置数据
   */
  importFieldConfig(data) {
    return apiClient.post('/workflow/form-fields/import', data)
  }
}

export default {
  workflowTemplateApi,
  workflowInstanceApi,
  formConfigApi
}
