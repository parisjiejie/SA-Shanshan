/**
 * 统一通知中心 Store
 * 管理所有角色的通知消息，支持小喇叭展示 + 微信公众号推送预留
 */
import { ref, computed } from 'vue'

// 通知类型枚举
export const NotificationType = {
  // 工单相关 - 新流程
  WORKORDER_CREATED: 'workorder_created',           // 工单已创建
  WORKORDER_ASSIGNED: 'workorder_assigned',         // 工单已分配工程师
  WORKORDER_ASSIGNED_TO_ENGINEER: 'workorder_assigned',  // 工单已分配工程师（兼容旧引用）
  WORKORDER_ACCEPTED: 'workorder_accepted',         // 工单已接单
  WORKORDER_REJECTED: 'workorder_rejected',         // 工单已弃单
  WORKORDER_IN_PROGRESS: 'workorder_in_progress',   // 工单进行中
  WORKORDER_PENDING_SIGN: 'workorder_pending_sign', // 工单待签字
  WORKORDER_SIGNED: 'workorder_signed',             // 工单已签字
  WORKORDER_TECHLEAD_CONFIRMED: 'workorder_techlead_confirmed', // 课长已确认
  WORKORDER_COMPLETED: 'workorder_completed',       // 工单已完成
  TIMEOUT_ALARM: 'timeout_alarm',                   // 超时报警
  
  // 报价相关
  QUOTATION_SUBMITTED: 'quotation_submitted',       // 报价单已提交
  QUOTATION_APPROVED: 'quotation_approved',         // 报价单审核通过
  QUOTATION_REJECTED: 'quotation_rejected',         // 报价单审核驳回
  QUOTATION_SENT: 'quotation_sent',                 // 报价单已发送客户
  QUOTATION_CONFIRMED: 'quotation_confirmed',       // 报价单客户已确认
  
  // 打卡审批
  CHECKIN_SUBMITTED: 'checkin_submitted',           // 打卡已提交审批
  CHECKIN_APPROVED: 'checkin_approved',             // 打卡审批通过
  
  // 系统通知
  CUSTOMER_REGISTERED: 'customer_registered',       // 新客户注册待审核
}

// 通知数据
const notifications = ref(loadFromStorage())

function loadFromStorage() {
  try {
    return JSON.parse(localStorage.getItem('notifications') || '[]')
  } catch {
    return []
  }
}

function saveToStorage() {
  localStorage.setItem('notifications', JSON.stringify(notifications.value))
}

// 未读数量
const unreadCount = computed(() => notifications.value.filter(n => !n.isRead).length)

/**
 * 创建通知
 * @param {Object} options
 * @param {string} options.type     - 通知类型 (NotificationType)
 * @param {string} options.title    - 通知标题
 * @param {string} options.content  - 通知内容
 * @param {string} options.targetRole - 目标角色 (admin/assistant/engineer/techLead/director/customer)
 * @param {string} [options.level]     - 通知级别 (info=信息通知, action=需要处理)
 * @param {string} [options.jumpPath]   - 点击跳转路由
 * @param {Object} [options.jumpParams] - 跳转参数
 * @param {string} [options.relatedId]  - 关联业务ID（工单号/报价单号等）
 */
export function addNotification({ type, title, content, targetRole, level, jumpPath, jumpParams, relatedId }) {
  const notification = {
    id: `NOTIFY-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    type,
    title,
    content,
    targetRole,
    level: level || 'info',   // info=小喇叭, action=待处理+小喇叭
    jumpPath: jumpPath || null,
    jumpParams: jumpParams || null,
    relatedId: relatedId || null,
    isRead: false,
    wechatPushStatus: 'pending', // pending/pushed/failed - 预留微信推送
    createdAt: new Date().toISOString()
  }
  
  notifications.value.unshift(notification)
  saveToStorage()
  
  // 触发全局事件
  window.dispatchEvent(new CustomEvent('notification-updated'))
  
  return notification
}

/**
 * 标记已读
 */
export function markAsRead(notificationId) {
  const n = notifications.value.find(item => item.id === notificationId)
  if (n && !n.isRead) {
    n.isRead = true
    saveToStorage()
  }
}

/**
 * 全部标记已读
 */
export function markAllAsRead() {
  notifications.value.forEach(n => { n.isRead = true })
  saveToStorage()
  window.dispatchEvent(new CustomEvent('notification-updated'))
}

/**
 * 按角色获取通知
 * 部长(director)和课长(techLead)共享通知
 */
export function getNotificationsByRole(role) {
  return notifications.value.filter(n => {
    if (n.targetRole === role || n.targetRole === 'all') return true
    // 部长也能看到发给课长的通知（后期分流后移除）
    if (role === 'director' && n.targetRole === 'techLead') return true
    return false
  })
}

/**
 * 按角色获取未读数
 */
export function getUnreadCountByRole(role) {
  return notifications.value.filter(n => {
    if ((n.targetRole === role || n.targetRole === 'all') && !n.isRead) return true
    if (role === 'director' && n.targetRole === 'techLead' && !n.isRead) return true
    return false
  }).length
}

/**
 * 删除通知
 */
export function removeNotification(notificationId) {
  notifications.value = notifications.value.filter(n => n.id !== notificationId)
  saveToStorage()
  window.dispatchEvent(new CustomEvent('notification-updated'))
}

/**
 * 清空通知
 */
export function clearNotifications() {
  notifications.value = []
  saveToStorage()
  window.dispatchEvent(new CustomEvent('notification-updated'))
}

/**
 * 按角色获取待处理通知（level=action）
 */
export function getActionNotificationsByRole(role) {
  return notifications.value.filter(n => {
    const matchRole = n.targetRole === role || n.targetRole === 'all' || (role === 'director' && n.targetRole === 'techLead')
    return matchRole && n.level === 'action' && !n.isRead
  })
}

export { notifications, unreadCount }
