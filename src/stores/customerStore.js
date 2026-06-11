import { reactive, computed, readonly } from 'vue'
import { customerApi } from '../api/customerApi.js'
import { ElMessage } from 'element-plus'

// 创建全局状态
const state = reactive({
  customers: [],
  currentCustomer: null,
  isLoggedIn: false,
  loading: false,
  error: null,
  pagination: {
    page: 1,
    pageSize: 10,
    total: 0
  }
})

// 计算属性
const customerInfo = computed(() => state.currentCustomer)
const customerStatus = computed(() => state.currentCustomer?.status || null)
const customerCompanyId = computed(() => state.currentCustomer?.companyId || null)
const customerCompanyName = computed(() => state.currentCustomer?.companyName || null)
const isLoading = computed(() => state.loading)

// ========== API 方法 ==========

/**
 * 获取客户列表
 * @param {Object} params - 查询参数
 */
const fetchCustomers = async (params = {}) => {
  state.loading = true
  state.error = null
  
  try {
    const data = await customerApi.getList({
      page: state.pagination.page,
      pageSize: state.pagination.pageSize,
      ...params
    })
    
    state.customers = data.list || []
    state.pagination.total = data.total || 0
    state.pagination.page = data.page || 1
    state.pagination.pageSize = data.pageSize || 10
    
    return data
  } catch (error) {
    state.error = error.message || '获取客户列表失败'
    ElMessage.error(state.error)
    throw error
  } finally {
    state.loading = false
  }
}

/**
 * 获取客户详情
 * @param {string} id - 客户ID
 */
const fetchCustomerById = async (id) => {
  state.loading = true
  state.error = null
  
  try {
    const data = await customerApi.getById(id)
    return data
  } catch (error) {
    state.error = error.message || '获取客户详情失败'
    ElMessage.error(state.error)
    throw error
  } finally {
    state.loading = false
  }
}

/**
 * 创建客户
 * @param {Object} customerData - 客户数据
 */
const createCustomer = async (customerData) => {
  state.loading = true
  state.error = null
  
  try {
    const data = await customerApi.create(customerData)
    ElMessage.success('客户创建成功')
    
    // 刷新列表
    await fetchCustomers()
    
    return data
  } catch (error) {
    state.error = error.message || '创建客户失败'
    ElMessage.error(state.error)
    throw error
  } finally {
    state.loading = false
  }
}

/**
 * 更新客户
 * @param {string} id - 客户ID
 * @param {Object} customerData - 客户数据
 */
const updateCustomer = async (id, customerData) => {
  state.loading = true
  state.error = null
  
  try {
    const data = await customerApi.update(id, customerData)
    ElMessage.success('客户更新成功')
    
    // 更新本地数据
    const index = state.customers.findIndex(c => c.id === id)
    if (index !== -1) {
      state.customers[index] = { ...state.customers[index], ...data }
    }
    
    // 如果当前登录客户被更新，同步更新
    if (state.currentCustomer?.id === id) {
      state.currentCustomer = { ...state.currentCustomer, ...data }
    }
    
    return data
  } catch (error) {
    state.error = error.message || '更新客户失败'
    ElMessage.error(state.error)
    throw error
  } finally {
    state.loading = false
  }
}

/**
 * 删除客户
 * @param {string} id - 客户ID
 */
const deleteCustomer = async (id) => {
  state.loading = true
  state.error = null
  
  try {
    await customerApi.delete(id)
    ElMessage.success('客户删除成功')
    
    // 从本地列表移除
    state.customers = state.customers.filter(c => c.id !== id)
    state.pagination.total--
    
    return true
  } catch (error) {
    state.error = error.message || '删除客户失败'
    ElMessage.error(state.error)
    throw error
  } finally {
    state.loading = false
  }
}

/**
 * 批量删除客户
 * @param {Array<string>} ids - 客户ID数组
 */
const batchDeleteCustomers = async (ids) => {
  state.loading = true
  state.error = null
  
  try {
    await customerApi.batchDelete(ids)
    ElMessage.success(`成功删除 ${ids.length} 个客户`)
    
    // 刷新列表
    await fetchCustomers()
    
    return true
  } catch (error) {
    state.error = error.message || '批量删除客户失败'
    ElMessage.error(state.error)
    throw error
  } finally {
    state.loading = false
  }
}

/**
 * 导出客户数据
 * @param {Object} params - 导出参数
 */
const exportCustomers = async (params = {}) => {
  state.loading = true
  state.error = null
  
  try {
    const blob = await customerApi.export(params)
    
    // 创建下载链接
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `客户数据_${new Date().toISOString().split('T')[0]}.xlsx`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    
    ElMessage.success('导出成功')
    return true
  } catch (error) {
    state.error = error.message || '导出客户数据失败'
    ElMessage.error(state.error)
    throw error
  } finally {
    state.loading = false
  }
}

/**
 * 导入客户数据
 * @param {FormData} formData - 包含文件的FormData
 */
const importCustomers = async (formData) => {
  state.loading = true
  state.error = null
  
  try {
    const data = await customerApi.import(formData)
    ElMessage.success(`导入成功: ${data.success} 条, 失败: ${data.failed} 条`)
    
    // 刷新列表
    await fetchCustomers()
    
    return data
  } catch (error) {
    state.error = error.message || '导入客户数据失败'
    ElMessage.error(state.error)
    throw error
  } finally {
    state.loading = false
  }
}

// ========== 本地方法（保持向后兼容） ==========

const findCustomerByPhone = (phone) => {
  return state.customers.find(c => c.phone === phone)
}

const login = (customer) => {
  state.currentCustomer = customer
  state.isLoggedIn = true
  
  // 保存到 localStorage
  const authData = {
    customerId: customer.id,
    phone: customer.phone,
    name: customer.name,
    companyId: customer.companyId,
    companyName: customer.companyName,
    status: customer.status,
    loginTime: new Date().toISOString()
  }
  localStorage.setItem('customerAuth', JSON.stringify(authData))
  
  // 更新最后登录时间
  customer.lastLoginAt = new Date().toLocaleString()
}

const logout = () => {
  state.currentCustomer = null
  state.isLoggedIn = false
  localStorage.removeItem('customerAuth')
  localStorage.removeItem('token')
}

const checkLoginStatus = () => {
  const authData = localStorage.getItem('customerAuth')
  if (authData) {
    try {
      const parsed = JSON.parse(authData)
      const customer = findCustomerByPhone(parsed.phone)
      if (customer) {
        state.currentCustomer = customer
        state.isLoggedIn = true
        return true
      }
    } catch (e) {
      console.error('解析登录数据失败', e)
    }
  }
  return false
}

const registerCustomer = async (customerData) => {
  // 使用API创建客户
  return await createCustomer({
    ...customerData,
    status: 'pending',
    role: 'customer'
  })
}

const getCustomers = () => {
  return state.customers
}

const getCustomerById = (id) => {
  return state.customers.find(c => c.id === id)
}

const updateCustomerStatus = async (id, status) => {
  return await updateCustomer(id, { status })
}

// ========== 分页方法 ==========

const setPage = (page) => {
  state.pagination.page = page
}

const setPageSize = (pageSize) => {
  state.pagination.pageSize = pageSize
  state.pagination.page = 1
}

// 导出 useCustomerStore 函数
export const useCustomerStore = () => {
  return {
    // State (readonly)
    customers: readonly(state.customers),
    currentCustomer: readonly(state.currentCustomer),
    isLoggedIn: readonly(state.isLoggedIn),
    loading: isLoading,
    error: readonly(state.error),
    pagination: readonly(state.pagination),
    
    // Getters
    customerInfo,
    customerStatus,
    customerCompanyId,
    customerCompanyName,
    
    // API Actions
    fetchCustomers,
    fetchCustomerById,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    batchDeleteCustomers,
    exportCustomers,
    importCustomers,
    
    // Local Actions
    findCustomerByPhone,
    login,
    logout,
    checkLoginStatus,
    registerCustomer,
    getCustomers,
    getCustomerById,
    updateCustomerStatus,
    
    // Pagination
    setPage,
    setPageSize
  }
}

// 默认导出
export default {
  useCustomerStore
}
