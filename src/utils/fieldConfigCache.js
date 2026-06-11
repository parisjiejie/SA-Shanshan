/**
 * 字段配置缓存管理
 * 提供本地缓存功能，减少API请求
 */

const CACHE_KEY = 'field_config_cache'
const CACHE_VERSION = '1.0'
const CACHE_EXPIRY = 24 * 60 * 60 * 1000 // 24小时

class FieldConfigCache {
  constructor() {
    this.memoryCache = new Map()
    this.init()
  }

  // 初始化，从localStorage加载缓存
  init() {
    try {
      const cached = localStorage.getItem(CACHE_KEY)
      if (cached) {
        const data = JSON.parse(cached)
        // 检查版本
        if (data.version === CACHE_VERSION) {
          // 检查是否过期
          const now = Date.now()
          if (now - data.timestamp < CACHE_EXPIRY) {
            this.memoryCache = new Map(data.entries)
            console.log('[FieldConfigCache] Loaded from localStorage')
          } else {
            console.log('[FieldConfigCache] Cache expired, cleared')
            this.clear()
          }
        } else {
          console.log('[FieldConfigCache] Version mismatch, cleared')
          this.clear()
        }
      }
    } catch (e) {
      console.error('[FieldConfigCache] Init error:', e)
    }
  }

  // 获取缓存
  get(key) {
    // 先查内存
    if (this.memoryCache.has(key)) {
      return this.memoryCache.get(key)
    }
    return null
  }

  // 设置缓存
  set(key, value) {
    this.memoryCache.set(key, value)
    this.persist()
  }

  // 批量设置缓存
  setBatch(entries) {
    entries.forEach(([key, value]) => {
      this.memoryCache.set(key, value)
    })
    this.persist()
  }

  // 删除缓存
  delete(key) {
    this.memoryCache.delete(key)
    this.persist()
  }

  // 清空缓存
  clear() {
    this.memoryCache.clear()
    localStorage.removeItem(CACHE_KEY)
  }

  // 持久化到localStorage
  persist() {
    try {
      const data = {
        version: CACHE_VERSION,
        timestamp: Date.now(),
        entries: Array.from(this.memoryCache.entries())
      }
      localStorage.setItem(CACHE_KEY, JSON.stringify(data))
    } catch (e) {
      console.error('[FieldConfigCache] Persist error:', e)
    }
  }

  // 获取字段定义缓存
  getFieldDefinition(fieldId) {
    return this.get(`field_def_${fieldId}`)
  }

  // 设置字段定义缓存
  setFieldDefinition(fieldId, data) {
    this.set(`field_def_${fieldId}`, data)
  }

  // 获取模板缓存
  getTemplate(templateId) {
    return this.get(`template_${templateId}`)
  }

  // 设置模板缓存
  setTemplate(templateId, data) {
    this.set(`template_${templateId}`, data)
  }

  // 获取客户配置缓存
  getCustomerConfig(customerId) {
    return this.get(`customer_config_${customerId}`)
  }

  // 设置客户配置缓存
  setCustomerConfig(customerId, data) {
    this.set(`customer_config_${customerId}`, data)
  }

  // 获取缓存统计
  getStats() {
    return {
      size: this.memoryCache.size,
      keys: Array.from(this.memoryCache.keys())
    }
  }
}

// 创建单例实例
export const fieldConfigCache = new FieldConfigCache()

// 默认导出
export default FieldConfigCache
