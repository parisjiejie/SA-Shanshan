import axios from 'axios'

// 创建axios实例
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
apiClient.interceptors.request.use(
  config => {
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
    if (response.data.code === 200) {
      return response.data.data
    } else {
      return Promise.reject(new Error(response.data.message || '请求失败'))
    }
  },
  error => {
    console.error('API Error:', error)
    if (error.response) {
      switch (error.response.status) {
        case 401:
          localStorage.removeItem('token')
          window.location.href = '/login'
          break
        case 403:
          console.error('没有权限访问该资源')
          break
        case 404:
          console.error('请求的资源不存在')
          break
        case 500:
          console.error('服务器内部错误')
          break
        default:
          console.error(`请求失败: ${error.response.status}`)
      }
    } else if (error.request) {
      console.error('网络请求失败，请检查网络连接')
    }
    return Promise.reject(error)
  }
)

/**
 * 报价管理API
 */
export const quotationApi = {
  /**
   * 获取报价单列表
   * @param {Object} params - 查询参数
   * @param {number} params.page - 页码
   * @param {number} params.pageSize - 每页数量
   * @param {string} params.keyword - 搜索关键词
   * @param {string} params.status - 报价状态
   * @param {string} params.customerId - 客户ID
   */
  getList(params = {}) {
    return apiClient.get('/quotations', { params })
  },

  /**
   * 获取报价单详情
   * @param {string} id - 报价单ID
   */
  getById(id) {
    return apiClient.get(`/quotations/${id}`)
  },

  /**
   * 创建报价单
   * @param {Object} data - 报价单数据
   */
  create(data) {
    return apiClient.post('/quotations', data)
  },

  /**
   * 更新报价单
   * @param {string} id - 报价单ID
   * @param {Object} data - 报价单数据
   */
  update(id, data) {
    return apiClient.put(`/quotations/${id}`, data)
  },

  /**
   * 删除报价单
   * @param {string} id - 报价单ID
   */
  delete(id) {
    return apiClient.delete(`/quotations/${id}`)
  },

  /**
   * 批量删除报价单
   * @param {Array<string>} ids - 报价单ID数组
   */
  batchDelete(ids) {
    return apiClient.delete('/quotations/batch', { data: { ids } })
  },

  /**
   * 提交报价单
   * @param {string} id - 报价单ID
   */
  submit(id) {
    return apiClient.post(`/quotations/${id}/submit`)
  },

  /**
   * 审核报价单
   * @param {string} id - 报价单ID
   * @param {Object} data - 审核数据
   * @param {boolean} data.approved - 是否通过
   * @param {string} data.remark - 审核意见
   */
  approve(id, data) {
    return apiClient.post(`/quotations/${id}/approve`, data)
  },

  /**
   * 发送报价单给客户
   * @param {string} id - 报价单ID
   */
  sendToCustomer(id) {
    return apiClient.post(`/quotations/${id}/send`)
  },

  /**
   * 客户确认报价单
   * @param {string} id - 报价单ID
   * @param {Object} data - 确认数据
   * @param {boolean} data.accepted - 是否接受
   * @param {string} data.remark - 客户备注
   */
  customerConfirm(id, data) {
    return apiClient.post(`/quotations/${id}/confirm`, data)
  },

  /**
   * 生成PDF
   * @param {string} id - 报价单ID
   */
  generatePdf(id) {
    return apiClient.get(`/quotations/${id}/pdf`, {
      responseType: 'blob'
    })
  },

  /**
   * 获取报价单模板列表
   */
  getTemplates() {
    return apiClient.get('/quotations/templates')
  },

  /**
   * 获取配件报价查询
   * @param {Object} params - 查询参数
   * @param {string} params.partNumber - 配件编号
   * @param {string} params.partName - 配件名称
   */
  queryPartPrice(params = {}) {
    return apiClient.get('/quotations/part-price', { params })
  },

  /**
   * 获取客户报价历史
   * @param {string} customerId - 客户ID
   */
  getCustomerHistory(customerId) {
    return apiClient.get(`/quotations/customer/${customerId}/history`)
  },

  /**
   * 导出报价单数据
   * @param {Object} params - 导出参数
   */
  export(params = {}) {
    return apiClient.get('/quotations/export', {
      params,
      responseType: 'blob'
    })
  },

  /**
   * 获取报价单统计
   */
  getStatistics() {
    return apiClient.get('/quotations/statistics')
  }
}

export default quotationApi
