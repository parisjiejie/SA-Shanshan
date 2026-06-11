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
 * 工单管理API
 */
export const workorderApi = {
  /**
   * 获取工单列表
   * @param {Object} params - 查询参数
   * @param {number} params.page - 页码
   * @param {number} params.pageSize - 每页数量
   * @param {string} params.keyword - 搜索关键词
   * @param {string} params.status - 工单状态
   * @param {string} params.type - 工单类型
   * @param {string} params.customerId - 客户ID
   * @param {string} params.employeeId - 员工ID
   */
  getList(params = {}) {
    return apiClient.get('/workorders', { params })
  },

  /**
   * 获取工单详情
   * @param {string} id - 工单ID
   */
  getById(id) {
    return apiClient.get(`/workorders/${id}`)
  },

  /**
   * 创建工单
   * @param {Object} data - 工单数据
   */
  create(data) {
    return apiClient.post('/workorders', data)
  },

  /**
   * 更新工单
   * @param {string} id - 工单ID
   * @param {Object} data - 工单数据
   */
  update(id, data) {
    return apiClient.put(`/workorders/${id}`, data)
  },

  /**
   * 删除工单
   * @param {string} id - 工单ID
   */
  delete(id) {
    return apiClient.delete(`/workorders/${id}`)
  },

  /**
   * 批量删除工单
   * @param {Array<string>} ids - 工单ID数组
   */
  batchDelete(ids) {
    return apiClient.delete('/workorders/batch', { data: { ids } })
  },

  /**
   * 接单
   * @param {string} id - 工单ID
   */
  accept(id) {
    return apiClient.post(`/workorders/${id}/accept`)
  },

  /**
   * 开始处理
   * @param {string} id - 工单ID
   */
  start(id) {
    return apiClient.post(`/workorders/${id}/start`)
  },

  /**
   * 完成工单
   * @param {string} id - 工单ID
   * @param {Object} data - 完成数据
   */
  complete(id, data) {
    return apiClient.post(`/workorders/${id}/complete`, data)
  },

  /**
   * 取消工单
   * @param {string} id - 工单ID
   * @param {string} reason - 取消原因
   */
  cancel(id, reason) {
    return apiClient.post(`/workorders/${id}/cancel`, { reason })
  },

  /**
   * 分配工程师
   * @param {string} id - 工单ID
   * @param {string} employeeId - 员工ID
   */
  assign(id, employeeId) {
    return apiClient.post(`/workorders/${id}/assign`, { employeeId })
  },

  /**
   * 添加工单记录
   * @param {string} id - 工单ID
   * @param {Object} data - 记录数据
   */
  addRecord(id, data) {
    return apiClient.post(`/workorders/${id}/records`, data)
  },

  /**
   * 获取工单记录
   * @param {string} id - 工单ID
   */
  getRecords(id) {
    return apiClient.get(`/workorders/${id}/records`)
  },

  /**
   * 客户签字
   * @param {string} id - 工单ID
   * @param {Object} data - 签字数据
   */
  customerSign(id, data) {
    return apiClient.post(`/workorders/${id}/sign`, data)
  },

  /**
   * 服务评价
   * @param {string} id - 工单ID
   * @param {Object} data - 评价数据
   */
  evaluate(id, data) {
    return apiClient.post(`/workorders/${id}/evaluate`, data)
  },

  /**
   * 获取客户工单列表
   * @param {string} customerId - 客户ID
   */
  getByCustomerId(customerId) {
    return apiClient.get(`/workorders/customer/${customerId}`)
  },

  /**
   * 获取员工工单列表
   * @param {string} employeeId - 员工ID
   */
  getByEmployeeId(employeeId) {
    return apiClient.get(`/workorders/employee/${employeeId}`)
  },

  /**
   * 导出工单数据
   * @param {Object} params - 导出参数
   */
  export(params = {}) {
    return apiClient.get('/workorders/export', {
      params,
      responseType: 'blob'
    })
  },

  /**
   * 获取工单统计
   */
  getStatistics() {
    return apiClient.get('/workorders/statistics')
  },

  /**
   * 获取待处理工单数量
   */
  getPendingCount() {
    return apiClient.get('/workorders/pending-count')
  }
}

export default workorderApi
