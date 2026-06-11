/**
 * 报价单工具函数
 * 用于处理报价单有效期检查、到期提醒等功能
 */

import { QuotationStatus } from '../stores/quotationStore.js'

/**
 * 检查报价单是否已过期
 * @param {Object} quotation - 报价单对象
 * @returns {boolean} - 是否已过期
 */
export function isQuotationExpired(quotation) {
  if (!quotation || !quotation.validUntil) return false

  // 只有已发送的报价单才检查过期
  if (quotation.status !== QuotationStatus.SENT) return false

  const now = new Date()
  const validUntil = new Date(quotation.validUntil)

  return now > validUntil
}

/**
 * 检查报价单是否即将过期（7天内）
 * @param {Object} quotation - 报价单对象
 * @param {number} days - 提前天数（默认7天）
 * @returns {boolean} - 是否即将过期
 */
export function isQuotationExpiringSoon(quotation, days = 7) {
  if (!quotation || !quotation.validUntil) return false

  // 只有已发送的报价单才检查
  if (quotation.status !== QuotationStatus.SENT) return false

  const now = new Date()
  const validUntil = new Date(quotation.validUntil)
  const diffTime = validUntil - now
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  return diffDays > 0 && diffDays <= days
}

/**
 * 获取报价单剩余有效天数
 * @param {Object} quotation - 报价单对象
 * @returns {number} - 剩余天数（负数表示已过期）
 */
export function getRemainingDays(quotation) {
  if (!quotation || !quotation.validUntil) return 0

  const now = new Date()
  const validUntil = new Date(quotation.validUntil)
  const diffTime = validUntil - now
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  return diffDays
}

/**
 * 获取报价单有效期状态
 * @param {Object} quotation - 报价单对象
 * @returns {Object} - 状态信息 { status: string, text: string, type: string }
 */
export function getValidityStatus(quotation) {
  if (!quotation) {
    return { status: 'unknown', text: '未知', type: 'info' }
  }

  // 非已发送状态的报价单
  if (quotation.status !== QuotationStatus.SENT) {
    return { status: 'not_sent', text: '未发送', type: 'info' }
  }

  const remainingDays = getRemainingDays(quotation)

  if (remainingDays < 0) {
    return { status: 'expired', text: `已过期 ${Math.abs(remainingDays)} 天`, type: 'danger' }
  } else if (remainingDays === 0) {
    return { status: 'expiring_today', text: '今日到期', type: 'warning' }
  } else if (remainingDays <= 3) {
    return { status: 'expiring_soon', text: `剩 ${remainingDays} 天`, type: 'warning' }
  } else if (remainingDays <= 7) {
    return { status: 'expiring_soon', text: `剩 ${remainingDays} 天`, type: 'info' }
  } else {
    return { status: 'valid', text: `剩 ${remainingDays} 天`, type: 'success' }
  }
}

/**
 * 检查并更新报价单过期状态
 * @param {Array} quotations - 报价单列表
 * @returns {Array} - 已过期的报价单ID列表
 */
export function checkAndUpdateExpiredQuotations(quotations) {
  const expiredIds = []

  quotations.forEach(quotation => {
    if (quotation.status === QuotationStatus.SENT && isQuotationExpired(quotation)) {
      quotation.status = QuotationStatus.EXPIRED
      quotation.expiredAt = new Date().toISOString()
      expiredIds.push(quotation.id)
    }
  })

  return expiredIds
}

/**
 * 获取即将过期的报价单列表
 * @param {Array} quotations - 报价单列表
 * @param {number} days - 提前天数（默认7天）
 * @returns {Array} - 即将过期的报价单列表
 */
export function getExpiringQuotations(quotations, days = 7) {
  return quotations.filter(quotation =>
    quotation.status === QuotationStatus.SENT &&
    isQuotationExpiringSoon(quotation, days)
  )
}

/**
 * 格式化有效期显示
 * @param {Object} quotation - 报价单对象
 * @returns {string} - 格式化后的有效期字符串
 */
export function formatValidityPeriod(quotation) {
  if (!quotation || !quotation.validUntil) return '-'

  const validUntil = new Date(quotation.validUntil)
  const validityStatus = getValidityStatus(quotation)

  return `${validUntil.toLocaleDateString('zh-CN')} (${validityStatus.text})`
}

/**
 * 计算报价单有效期截止日期
 * @param {number} validDays - 有效天数
 * @param {string} startDate - 开始日期（ISO字符串，默认为当前时间）
 * @returns {string} - 截止日期（ISO字符串）
 */
export function calculateValidUntil(validDays, startDate = null) {
  const start = startDate ? new Date(startDate) : new Date()
  const validUntil = new Date(start.getTime() + validDays * 24 * 60 * 60 * 1000)
  return validUntil.toISOString()
}

/**
 * 延期报价单有效期
 * @param {Object} quotation - 报价单对象
 * @param {number} additionalDays - 延期的天数
 * @returns {Object} - 更新后的报价单
 */
export function extendValidityPeriod(quotation, additionalDays) {
  if (!quotation || !quotation.validUntil) return quotation

  const currentValidUntil = new Date(quotation.validUntil)
  const newValidUntil = new Date(currentValidUntil.getTime() + additionalDays * 24 * 60 * 60 * 1000)

  quotation.validUntil = newValidUntil.toISOString()
  quotation.validDays = quotation.validDays + additionalDays
  quotation.updatedAt = new Date().toISOString()

  // 如果之前已过期，恢复为已发送状态
  if (quotation.status === QuotationStatus.EXPIRED) {
    quotation.status = QuotationStatus.SENT
    quotation.expiredAt = null
  }

  return quotation
}
