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
    // 假设后端返回格式: { code: 200, data: {}, message: '' }
    if (response.data.code === 200) {
      return response.data.data
    } else {
      return Promise.reject(new Error(response.data.message || '请求失败'))
    }
  },
  error => {
    console.error('API Error:', error)
    // 统一错误处理
    if (error.response) {
      switch (error.response.status) {
        case 401:
          // 未授权，跳转到登录页
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
 * 客户管理API
 * 
 * 接口规范:
 * - 列表查询: GET /customers
 * - 单个查询: GET /customers/:id
 * - 创建: POST /customers
 * - 更新: PUT /customers/:id
 * - 删除: DELETE /customers/:id
 * - 批量删除: DELETE /customers/batch
 * - 导出: GET /customers/export
 * - 导入: POST /customers/import
 */
export const customerApi = {
  /**
   * 获取客户列表
   * @param {Object} params - 查询参数
   * @param {number} params.page - 页码 (默认1)
   * @param {number} params.pageSize - 每页数量 (默认10)
   * @param {string} params.keyword - 搜索关键词 (姓名/公司名/手机号)
   * @param {string} params.status - 客户状态
   * @param {string} params.sortField - 排序字段
   * @param {string} params.sortOrder - 排序方式 (asc/desc)
   * @returns {Promise<{list: Array, total: number, page: number, pageSize: number}>}
   * 
   * 响应示例:
   * {
   *   list: [
   *     {
   *       id: 'C001',
   *       name: '张三',
   *       companyName: '上海某机械有限公司',
   *       phone: '13800138001',
   *       email: 'zhangsan@example.com',
   *       address: '上海市浦东新区xxx路xxx号',
   *       status: 'active',
   *       createTime: '2024-01-10T09:00:00',
   *       updateTime: '2024-01-10T09:00:00'
   *     }
   *   ],
   *   total: 100,
   *   page: 1,
   *   pageSize: 10
   * }
   */
  getList(params = {}) {
    return apiClient.get('/customers', { params })
  },

  /**
   * 获取客户详情
   * @param {string} id - 客户ID
   * @returns {Promise<Object>}
   * 
   * 响应示例:
   * {
   *   id: 'C001',
   *   name: '张三',
   *   companyName: '上海某机械有限公司',
   *   phone: '13800138001',
   *   email: 'zhangsan@example.com',
   *   address: '上海市浦东新区xxx路xxx号',
   *   status: 'active',
   *   remark: '重要客户',
   *   contacts: [
   *     { name: '李四', phone: '13900139001', position: '技术负责人' }
   *   ],
   *   devices: [
   *     { id: 'D001', name: '激光切割机', model: 'LX-3000' }
   *   ],
   *   createTime: '2024-01-10T09:00:00',
   *   updateTime: '2024-01-10T09:00:00'
   * }
   */
  getById(id) {
    return apiClient.get(`/customers/${id}`)
  },

  /**
   * 创建客户
   * @param {Object} data - 客户数据
   * @param {string} data.name - 客户姓名 (必填)
   * @param {string} data.companyName - 公司名称 (必填)
   * @param {string} data.phone - 手机号 (必填)
   * @param {string} data.email - 邮箱
   * @param {string} data.address - 地址
   * @param {string} data.remark - 备注
   * @returns {Promise<Object>} - 创建后的客户数据(包含id)
   */
  create(data) {
    return apiClient.post('/customers', data)
  },

  /**
   * 更新客户
   * @param {string} id - 客户ID
   * @param {Object} data - 客户数据
   * @returns {Promise<Object>} - 更新后的客户数据
   */
  update(id, data) {
    return apiClient.put(`/customers/${id}`, data)
  },

  /**
   * 删除客户
   * @param {string} id - 客户ID
   * @returns {Promise<void>}
   */
  delete(id) {
    return apiClient.delete(`/customers/${id}`)
  },

  /**
   * 批量删除客户
   * @param {Array<string>} ids - 客户ID数组
   * @returns {Promise<void>}
   */
  batchDelete(ids) {
    return apiClient.delete('/customers/batch', { data: { ids } })
  },

  /**
   * 根据手机号查找客户
   * @param {string} phone - 手机号
   * @returns {Promise<Object|null>}
   */
  findByPhone(phone) {
    return apiClient.get('/customers/find-by-phone', { params: { phone } })
  },

  /**
   * 导出客户数据
   * @param {Object} params - 导出参数
   * @returns {Promise<Blob>}
   */
  export(params = {}) {
    return apiClient.get('/customers/export', {
      params,
      responseType: 'blob'
    })
  },

  /**
   * 导入客户数据
   * @param {FormData} formData - 包含文件的FormData
   * @returns {Promise<{success: number, failed: number, errors: Array}>}
   */
  import(formData) {
    return apiClient.post('/customers/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },

  /**
   * 获取客户统计信息
   * @returns {Promise<Object>}
   * 
   * 响应示例:
   * {
   *   total: 100,
   *   active: 80,
   *   inactive: 20,
   *   newThisMonth: 15
   * }
   */
  getStatistics() {
    return apiClient.get('/customers/statistics')
  }
}

export default customerApi
