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
 * 员工管理API
 */
export const employeeApi = {
  /**
   * 获取员工列表
   * @param {Object} params - 查询参数
   * @param {number} params.page - 页码
   * @param {number} params.pageSize - 每页数量
   * @param {string} params.keyword - 搜索关键词
   * @param {string} params.department - 部门
   * @param {string} params.role - 角色
   * @param {string} params.status - 状态
   */
  getList(params = {}) {
    return apiClient.get('/employees', { params })
  },

  /**
   * 获取员工详情
   * @param {string} id - 员工ID
   */
  getById(id) {
    return apiClient.get(`/employees/${id}`)
  },

  /**
   * 创建员工
   * @param {Object} data - 员工数据
   */
  create(data) {
    return apiClient.post('/employees', data)
  },

  /**
   * 更新员工
   * @param {string} id - 员工ID
   * @param {Object} data - 员工数据
   */
  update(id, data) {
    return apiClient.put(`/employees/${id}`, data)
  },

  /**
   * 删除员工
   * @param {string} id - 员工ID
   */
  delete(id) {
    return apiClient.delete(`/employees/${id}`)
  },

  /**
   * 批量删除员工
   * @param {Array<string>} ids - 员工ID数组
   */
  batchDelete(ids) {
    return apiClient.delete('/employees/batch', { data: { ids } })
  },

  /**
   * 员工登录
   * @param {Object} credentials - 登录凭证
   * @param {string} credentials.username - 用户名
   * @param {string} credentials.password - 密码
   */
  login(credentials) {
    return apiClient.post('/employees/login', credentials)
  },

  /**
   * 修改密码
   * @param {string} id - 员工ID
   * @param {Object} data - 密码数据
   * @param {string} data.oldPassword - 旧密码
   * @param {string} data.newPassword - 新密码
   */
  changePassword(id, data) {
    return apiClient.post(`/employees/${id}/change-password`, data)
  },

  /**
   * 重置密码
   * @param {string} id - 员工ID
   */
  resetPassword(id) {
    return apiClient.post(`/employees/${id}/reset-password`)
  },

  /**
   * 获取当前登录员工信息
   */
  getCurrentUser() {
    return apiClient.get('/employees/current')
  },

  /**
   * 更新当前员工信息
   * @param {Object} data - 员工数据
   */
  updateCurrentUser(data) {
    return apiClient.put('/employees/current', data)
  },

  /**
   * 获取员工工单统计
   * @param {string} id - 员工ID
   * @param {Object} params - 查询参数
   */
  getWorkorderStatistics(id, params = {}) {
    return apiClient.get(`/employees/${id}/workorder-statistics`, { params })
  },

  /**
   * 获取员工打卡记录
   * @param {string} id - 员工ID
   * @param {Object} params - 查询参数
   */
  getCheckinRecords(id, params = {}) {
    return apiClient.get(`/employees/${id}/checkin-records`, { params })
  },

  /**
   * 导出员工数据
   * @param {Object} params - 导出参数
   */
  export(params = {}) {
    return apiClient.get('/employees/export', {
      params,
      responseType: 'blob'
    })
  },

  /**
   * 获取员工统计
   */
  getStatistics() {
    return apiClient.get('/employees/statistics')
  }
}

export default employeeApi
