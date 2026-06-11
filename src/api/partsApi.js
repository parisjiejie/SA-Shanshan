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
 * 配件管理API
 */
export const partsApi = {
  /**
   * 获取配件列表
   * @param {Object} params - 查询参数
   * @param {number} params.page - 页码
   * @param {number} params.pageSize - 每页数量
   * @param {string} params.keyword - 搜索关键词
   * @param {string} params.category - 配件分类
   * @param {string} params.status - 库存状态
   */
  getList(params = {}) {
    return apiClient.get('/parts', { params })
  },

  /**
   * 获取配件详情
   * @param {string} id - 配件ID
   */
  getById(id) {
    return apiClient.get(`/parts/${id}`)
  },

  /**
   * 创建配件
   * @param {Object} data - 配件数据
   */
  create(data) {
    return apiClient.post('/parts', data)
  },

  /**
   * 更新配件
   * @param {string} id - 配件ID
   * @param {Object} data - 配件数据
   */
  update(id, data) {
    return apiClient.put(`/parts/${id}`, data)
  },

  /**
   * 删除配件
   * @param {string} id - 配件ID
   */
  delete(id) {
    return apiClient.delete(`/parts/${id}`)
  },

  /**
   * 批量删除配件
   * @param {Array<string>} ids - 配件ID数组
   */
  batchDelete(ids) {
    return apiClient.delete('/parts/batch', { data: { ids } })
  },

  /**
   * 入库
   * @param {string} id - 配件ID
   * @param {Object} data - 入库数据
   * @param {number} data.quantity - 入库数量
   * @param {string} data.remarks - 备注
   */
  stockIn(id, data) {
    return apiClient.post(`/parts/${id}/stock-in`, data)
  },

  /**
   * 出库
   * @param {string} id - 配件ID
   * @param {Object} data - 出库数据
   * @param {number} data.quantity - 出库数量
   * @param {string} data.workorderId - 关联工单ID
   * @param {string} data.remarks - 备注
   */
  stockOut(id, data) {
    return apiClient.post(`/parts/${id}/stock-out`, data)
  },

  /**
   * 获取库存记录
   * @param {string} id - 配件ID
   * @param {Object} params - 查询参数
   */
  getStockRecords(id, params = {}) {
    return apiClient.get(`/parts/${id}/stock-records`, { params })
  },

  /**
   * 获取配件分类列表
   */
  getCategories() {
    return apiClient.get('/parts/categories')
  },

  /**
   * 创建配件分类
   * @param {Object} data - 分类数据
   */
  createCategory(data) {
    return apiClient.post('/parts/categories', data)
  },

  /**
   * 更新配件分类
   * @param {string} id - 分类ID
   * @param {Object} data - 分类数据
   */
  updateCategory(id, data) {
    return apiClient.put(`/parts/categories/${id}`, data)
  },

  /**
   * 删除配件分类
   * @param {string} id - 分类ID
   */
  deleteCategory(id) {
    return apiClient.delete(`/parts/categories/${id}`)
  },

  /**
   * 导出配件数据
   * @param {Object} params - 导出参数
   */
  export(params = {}) {
    return apiClient.get('/parts/export', {
      params,
      responseType: 'blob'
    })
  },

  /**
   * 导入配件数据
   * @param {FormData} formData - 包含文件的FormData
   */
  import(formData) {
    return apiClient.post('/parts/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },

  /**
   * 获取配件统计
   */
  getStatistics() {
    return apiClient.get('/parts/statistics')
  },

  /**
   * 获取低库存配件列表
   * @param {Object} params - 查询参数
   */
  getLowStockList(params = {}) {
    return apiClient.get('/parts/low-stock', { params })
  }
}

export default partsApi
