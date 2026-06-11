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
 * 设备管理API
 */
export const assetApi = {
  /**
   * 获取设备列表
   * @param {Object} params - 查询参数
   * @param {number} params.page - 页码
   * @param {number} params.pageSize - 每页数量
   * @param {string} params.keyword - 搜索关键词
   * @param {string} params.customerId - 客户ID筛选
   * @param {string} params.status - 设备状态
   * @param {string} params.type - 设备类型
   */
  getList(params = {}) {
    return apiClient.get('/assets', { params })
  },

  /**
   * 获取设备详情
   * @param {string} id - 设备ID
   */
  getById(id) {
    return apiClient.get(`/assets/${id}`)
  },

  /**
   * 创建设备
   * @param {Object} data - 设备数据
   */
  create(data) {
    return apiClient.post('/assets', data)
  },

  /**
   * 更新设备
   * @param {string} id - 设备ID
   * @param {Object} data - 设备数据
   */
  update(id, data) {
    return apiClient.put(`/assets/${id}`, data)
  },

  /**
   * 删除设备
   * @param {string} id - 设备ID
   */
  delete(id) {
    return apiClient.delete(`/assets/${id}`)
  },

  /**
   * 批量删除设备
   * @param {Array<string>} ids - 设备ID数组
   */
  batchDelete(ids) {
    return apiClient.delete('/assets/batch', { data: { ids } })
  },

  /**
   * 根据二维码获取设备
   * @param {string} qrCode - 二维码
   */
  getByQrCode(qrCode) {
    return apiClient.get('/assets/by-qrcode', { params: { qrCode } })
  },

  /**
   * 生成设备二维码
   * @param {string} id - 设备ID
   */
  generateQrCode(id) {
    return apiClient.get(`/assets/${id}/qrcode`)
  },

  /**
   * 获取设备维修历史
   * @param {string} id - 设备ID
   */
  getMaintenanceHistory(id) {
    return apiClient.get(`/assets/${id}/maintenance-history`)
  },

  /**
   * 获取客户设备列表
   * @param {string} customerId - 客户ID
   */
  getByCustomerId(customerId) {
    return apiClient.get(`/assets/customer/${customerId}`)
  },

  /**
   * 导出设备数据
   * @param {Object} params - 导出参数
   */
  export(params = {}) {
    return apiClient.get('/assets/export', {
      params,
      responseType: 'blob'
    })
  },

  /**
   * 获取设备统计
   */
  getStatistics() {
    return apiClient.get('/assets/statistics')
  }
}

export default assetApi
