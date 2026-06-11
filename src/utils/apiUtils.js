/**
 * API工具函数
 * 提供通用的API调用辅助功能
 */

import { ElMessage } from 'element-plus'

/**
 * 处理API错误
 * @param {Error} error - 错误对象
 * @param {string} defaultMessage - 默认错误消息
 */
export const handleApiError = (error, defaultMessage = '操作失败') => {
  console.error('API Error:', error)
  
  if (error.response) {
    const { status, data } = error.response
    
    switch (status) {
      case 400:
        ElMessage.error(data.message || '请求参数错误')
        break
      case 401:
        ElMessage.error('登录已过期，请重新登录')
        localStorage.removeItem('token')
        setTimeout(() => {
          window.location.href = '/login'
        }, 1500)
        break
      case 403:
        ElMessage.error('没有权限执行此操作')
        break
      case 404:
        ElMessage.error('请求的资源不存在')
        break
      case 409:
        ElMessage.error(data.message || '数据冲突，请刷新后重试')
        break
      case 422:
        ElMessage.error(data.message || '数据验证失败')
        break
      case 500:
        ElMessage.error('服务器内部错误，请稍后重试')
        break
      case 503:
        ElMessage.error('服务暂时不可用，请稍后重试')
        break
      default:
        ElMessage.error(data.message || defaultMessage)
    }
  } else if (error.request) {
    ElMessage.error('网络请求失败，请检查网络连接')
  } else {
    ElMessage.error(error.message || defaultMessage)
  }
  
  throw error
}

/**
 * 下载Blob文件
 * @param {Blob} blob - Blob数据
 * @param {string} filename - 文件名
 */
export const downloadBlob = (blob, filename) => {
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

/**
 * 构建查询参数
 * @param {Object} params - 参数对象
 * @returns {Object} - 清理后的参数
 */
export const buildQueryParams = (params = {}) => {
  const query = {}
  
  Object.keys(params).forEach(key => {
    const value = params[key]
    
    // 过滤空值
    if (value === null || value === undefined || value === '') {
      return
    }
    
    // 处理数组
    if (Array.isArray(value)) {
      if (value.length > 0) {
        query[key] = value
      }
      return
    }
    
    // 处理日期范围
    if (key === 'dateRange' && Array.isArray(value) && value.length === 2) {
      query.startDate = value[0]
      query.endDate = value[1]
      return
    }
    
    query[key] = value
  })
  
  return query
}

/**
 * 防抖函数
 * @param {Function} fn - 要执行的函数
 * @param {number} delay - 延迟时间(ms)
 * @returns {Function}
 */
export const debounce = (fn, delay = 300) => {
  let timer = null
  return function (...args) {
    if (timer) {
      clearTimeout(timer)
    }
    timer = setTimeout(() => {
      fn.apply(this, args)
    }, delay)
  }
}

/**
 * 节流函数
 * @param {Function} fn - 要执行的函数
 * @param {number} limit - 限制时间(ms)
 * @returns {Function}
 */
export const throttle = (fn, limit = 300) => {
  let inThrottle = false
  return function (...args) {
    if (!inThrottle) {
      fn.apply(this, args)
      inThrottle = true
      setTimeout(() => {
        inThrottle = false
      }, limit)
    }
  }
}

/**
 * 格式化分页参数
 * @param {Object} pagination - 分页对象
 * @returns {Object}
 */
export const formatPagination = (pagination = {}) => {
  return {
    page: pagination.page || 1,
    pageSize: pagination.pageSize || 10
  }
}

/**
 * 检查文件类型
 * @param {File} file - 文件对象
 * @param {Array<string>} allowedTypes - 允许的文件类型
 * @returns {boolean}
 */
export const checkFileType = (file, allowedTypes = []) => {
  if (allowedTypes.length === 0) return true
  return allowedTypes.some(type => file.type.includes(type))
}

/**
 * 检查文件大小
 * @param {File} file - 文件对象
 * @param {number} maxSizeMB - 最大大小(MB)
 * @returns {boolean}
 */
export const checkFileSize = (file, maxSizeMB = 10) => {
  const maxSize = maxSizeMB * 1024 * 1024
  return file.size <= maxSize
}

/**
 * 创建FormData
 * @param {Object} data - 数据对象
 * @returns {FormData}
 */
export const createFormData = (data = {}) => {
  const formData = new FormData()
  
  Object.keys(data).forEach(key => {
    const value = data[key]
    
    if (value === null || value === undefined) {
      return
    }
    
    if (Array.isArray(value)) {
      value.forEach(item => {
        formData.append(key, item)
      })
    } else if (value instanceof File) {
      formData.append(key, value)
    } else {
      formData.append(key, String(value))
    }
  })
  
  return formData
}

/**
 * 重试机制
 * @param {Function} fn - 异步函数
 * @param {number} retries - 重试次数
 * @param {number} delay - 延迟时间(ms)
 * @returns {Promise}
 */
export const retry = async (fn, retries = 3, delay = 1000) => {
  try {
    return await fn()
  } catch (error) {
    if (retries <= 1) {
      throw error
    }
    await new Promise(resolve => setTimeout(resolve, delay))
    return retry(fn, retries - 1, delay)
  }
}

/**
 * 取消重复请求
 * 使用示例：
 * const { request, cancel } = createCancelableRequest()
 * request(api.getList()).then(...)
 * cancel() // 取消请求
 */
export const createCancelableRequest = () => {
  let cancelToken = null
  
  const request = (promise) => {
    return promise
  }
  
  const cancel = () => {
    if (cancelToken) {
      cancelToken.cancel('请求被取消')
    }
  }
  
  return { request, cancel }
}

export default {
  handleApiError,
  downloadBlob,
  buildQueryParams,
  debounce,
  throttle,
  formatPagination,
  checkFileType,
  checkFileSize,
  createFormData,
  retry,
  createCancelableRequest
}
