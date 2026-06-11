/**
 * 工单流程管理 Store v3
 * 新7节点流程：待分配 → 待接单 → 进行中 → 待签字 → 课长确认 → 业务确认 → 完成
 * 类型体系：category(installation/service) + subType(repair/trial_processing/refitting)
 */

import { reactive } from 'vue'
import { addNotification, NotificationType } from './notificationStore'

// ==================== 工单类型枚举 ====================
export const WorkorderCategory = {
  INSTALLATION: 'installation',
  SERVICE: 'service',
}

export const WorkorderCategoryText = {
  [WorkorderCategory.INSTALLATION]: '安装工单',
  [WorkorderCategory.SERVICE]: '服务工单',
}

export const WorkorderSubType = {
  REPAIR: 'repair',
  TRIAL_PROCESSING: 'trial_processing',
  REFITTING: 'refitting',
}

export const WorkorderSubTypeText = {
  [WorkorderSubType.REPAIR]: '维修',
  [WorkorderSubType.TRIAL_PROCESSING]: '试加工',
  [WorkorderSubType.REFITTING]: '改造',
}

// 子类型→课长角色映射
export const SUBTYPE_TECHLEAD_MAP = {
  [WorkorderSubType.REPAIR]: { role: 'techLead', name: '工程课课长', display: '工程课A课长' },
  [WorkorderSubType.TRIAL_PROCESSING]: { role: 'techLead', name: '应用加工课课长', display: '应用加工课B课长' },
  [WorkorderSubType.REFITTING]: { role: 'techLead', name: '自动化改造课课长', display: '自动化改造课C课长' },
}

export const WorkorderStatus = {
  PENDING_ASSIGN: 'pending_assign',
  PENDING_ACCEPT: 'pending_accept',
  PROCESSING: 'processing',
  PENDING_SIGN: 'pending_sign',
  TECHLEAD_CONFIRM: 'techlead_confirm',
  ASSISTANT_CONFIRM: 'assistant_confirm',
  COMPLETED: 'completed',
  REJECTED: 'rejected',
}

export const WorkorderStatusText = {
  pending_assign: '待分配', pending_accept: '待接单', processing: '进行中',
  pending_sign: '待签字', techlead_confirm: '课长确认', assistant_confirm: '业务确认',
  completed: '已完成', rejected: '已退回',
}

export const WorkorderStatusType = {
  pending_assign: 'warning', pending_accept: 'info', processing: '',
  pending_sign: 'danger', techlead_confirm: 'warning', assistant_confirm: 'warning',
  completed: 'success', rejected: 'danger',
}

export const WorkorderFlowSteps = [
  { key: 'pending_assign', title: '待分配', description: '课长分配工程师' },
  { key: 'pending_accept', title: '待接单', description: '工程师接单' },
  { key: 'processing', title: '进行中', description: '工程师处理' },
  { key: 'pending_sign', title: '待签字', description: '客户/工程师签字' },
  { key: 'techlead_confirm', title: '课长确认', description: '课长查看确认' },
  { key: 'assistant_confirm', title: '业务确认', description: '业务助理确认' },
  { key: 'completed', title: '完成', description: '工单已完成' },
]

// ==================== 状态管理 ====================
const state = reactive({ workorders: [], notifications: [] })

const loadFromStorage = () => {
  try {
    const saved = localStorage.getItem('workorderFlowData')
    if (saved) {
      const d = JSON.parse(saved)
      state.workorders = d.workorders || []
      state.notifications = d.notifications || []
    }
  } catch (e) { console.error('加载工单流程数据失败:', e) }
  if (state.workorders.length === 0) {
    initMockData()
  }
}

const saveToStorage = () => {
  try { localStorage.setItem('workorderFlowData', JSON.stringify({ workorders: state.workorders, notifications: state.notifications })) }
  catch (e) { console.error('保存工单流程数据失败:', e) }
}

const generateWorkorderId = () => {
  const d = new Date(); const ds = d.toISOString().slice(0,10).replace(/-/g,'')
  // 从已有工单中找出当日最大序号 +1
  const prefix = `WO${ds}`
  let maxSeq = 0
  state.workorders.forEach(w => {
    if (w.workorderId && w.workorderId.startsWith(prefix)) {
      const seq = parseInt(w.workorderId.slice(-4))
      if (seq > maxSeq) maxSeq = seq
    }
  })
  return `${prefix}${String(maxSeq + 1).padStart(4, '0')}`
}

// ==================== 流程函数 ====================

/** 创建工单 → 待分配 */
const createWorkorder = (data, creatorRole, creatorName) => {
  const category = data.category || WorkorderCategory.SERVICE
  const subType = category === WorkorderCategory.SERVICE ? (data.subType || WorkorderSubType.REPAIR) : null
  const tlInfo = subType ? SUBTYPE_TECHLEAD_MAP[subType] : SUBTYPE_TECHLEAD_MAP[WorkorderSubType.REPAIR]

  const workorder = {
    id: Date.now().toString(),
    workorderId: generateWorkorderId(),
    category,
    subType,
    status: WorkorderStatus.PENDING_ASSIGN,
    createTime: new Date().toISOString(),
    updateTime: new Date().toISOString(),
    createdBy: data.createdBy || { id: '', role: creatorRole || 'customer', name: creatorName || data.customerName || '未知' },
    // 客户
    customerId: data.customerId, customerName: data.customerName,
    customerPhone: data.customerPhone, customerContact: data.customerContact || '',
    customerFax: data.customerFax || '',
    // 设备
    deviceModel: data.deviceModel, serialNumber: data.serialNumber,
    faultDescription: data.faultDescription, urgency: data.urgency || 'medium',
    attachments: data.attachments || [],
    warrantyStatus: data.warrantyStatus || 'unknown', warrantyEndDate: data.warrantyEndDate,
    installDate: data.installDate || '',
    address: data.address,
    techLeadRole: tlInfo.role, techLeadName: tlInfo.name,
    processRecords: [{
      time: new Date().toISOString(), title: '工单创建',
      content: `${creatorRole === 'customer' ? '客户' : '业务助理'}提交工单`,
      operator: creatorName || data.customerName, operatorType: creatorRole || 'customer'
    }],
    engineerId: null, engineerName: null, engineerPhone: null,
    assignTime: null, acceptTime: null, completeTime: null, signTime: null,
    techLeadConfirmTime: null, assistantConfirmTime: null,
    serviceReport: null, customerSign: null, engineerSign: null, reportPdf: null,
    quotationId: null, partsList: data.partsList || [],
    totalCostAmount: data.totalCostAmount || 0, totalSaleAmount: data.totalSaleAmount || 0,
    totalProfitMargin: data.totalProfitMargin || 0,
  }
  state.workorders.push(workorder); saveToStorage()
  addNotification({ type: NotificationType.WORKORDER_CREATED, level: 'action', title: '新工单待分配',
    content: `${workorder.createdBy.name} 提交了工单 ${workorder.workorderId}（${tlInfo.display}）`,
    targetRole: 'techLead', jumpPath: '/workorder', relatedId: workorder.workorderId })
  addNotification({ type: NotificationType.WORKORDER_CREATED, level: 'info', title: '新工单创建',
    content: `工单 ${workorder.workorderId} 已创建，等待课长分配`, targetRole: 'director',
    jumpPath: '/workorder', relatedId: workorder.workorderId })
  window.dispatchEvent(new CustomEvent('workorder-flow-updated', { detail: { action: 'created', workorder } }))
  return workorder
}

/** 课长分配工程师 → 待接单 */
const assignWorkorder = (workorderId, engineerId, engineerName, engineerPhone) => {
  const w = state.workorders.find(w => w.id === workorderId); if (!w) return null
  if (w.status !== WorkorderStatus.PENDING_ASSIGN) {
    console.warn('assignWorkorder: 状态不允许分配，当前:', w.status)
    return null
  }
  w.status = WorkorderStatus.PENDING_ACCEPT; w.engineerId = engineerId
  w.engineerName = engineerName; w.engineerPhone = engineerPhone
  w.assignTime = new Date().toISOString(); w.updateTime = new Date().toISOString()
  w.processRecords.push({ time: new Date().toISOString(), title: '工单分配',
    content: `课长分配给工程师 ${engineerName}`, operator: '课长', operatorType: 'techLead' })
  saveToStorage()
  addNotification({ type: NotificationType.WORKORDER_ASSIGNED, level: 'action', title: '新工单待接单',
    content: `课长分配了工单 ${w.workorderId}，请尽快接单`, targetRole: 'engineer',
    jumpPath: '/staff-workorder-list', jumpParams: { filter: 'pending_accept' }, relatedId: w.workorderId })
  window.dispatchEvent(new CustomEvent('workorder-flow-updated', { detail: { action: 'assigned', workorder: w } }))
  return w
}

/** 工程师弃单 → 回待分配 */
const rejectWorkorder = (workorderId, reason) => {
  const w = state.workorders.find(w => w.id === workorderId); if (!w) return null
  if (w.status !== WorkorderStatus.PENDING_ACCEPT) {
    console.warn('rejectWorkorder: 状态不允许弃单，当前:', w.status)
    return null
  }
  const prevEng = w.engineerName; w.status = WorkorderStatus.PENDING_ASSIGN
  w.engineerId = null; w.engineerName = null; w.engineerPhone = null
  w.assignTime = null; w.updateTime = new Date().toISOString()
  w.processRecords.push({ time: new Date().toISOString(), title: '工程师弃单',
    content: `工程师 ${prevEng} 放弃工单，原因：${reason || '未说明'}`, operator: prevEng, operatorType: 'engineer' })
  saveToStorage()
  addNotification({ type: NotificationType.WORKORDER_REJECTED, level: 'action', title: '工单被弃单',
    content: `工程师 ${prevEng} 弃单 ${w.workorderId}，请重新分配`, targetRole: 'techLead',
    jumpPath: '/workorder', relatedId: w.workorderId })
  window.dispatchEvent(new CustomEvent('workorder-flow-updated', { detail: { action: 'rejected', workorder: w } }))
  return w
}

/** 工程师接单 → 进行中 */
const acceptWorkorder = (workorderId) => {
  const w = state.workorders.find(w => w.id === workorderId); if (!w) return null
  if (w.status !== WorkorderStatus.PENDING_ACCEPT) {
    console.warn('acceptWorkorder: 状态不允许接单，当前:', w.status)
    return null
  }
  w.status = WorkorderStatus.PROCESSING; w.acceptTime = new Date().toISOString()
  w.updateTime = new Date().toISOString()
  w.processRecords.push({ time: new Date().toISOString(), title: '工程师接单',
    content: `工程师 ${w.engineerName} 已接单`, operator: w.engineerName, operatorType: 'engineer' })
  saveToStorage()
  addNotification({ type: NotificationType.WORKORDER_ACCEPTED, level: 'info', title: '工程师已接单',
    content: `工单 ${w.workorderId} 已被 ${w.engineerName} 接单`, targetRole: 'customer',
    jumpPath: '/customer-workorder-list', relatedId: w.workorderId })
  addNotification({ type: NotificationType.WORKORDER_ACCEPTED, level: 'info', title: '工程师已接单',
    content: `工单 ${w.workorderId} 已被 ${w.engineerName} 接单`, targetRole: 'techLead',
    jumpPath: '/workorder', relatedId: w.workorderId })
  if (w.createdBy.role !== 'customer' && w.createdBy.role !== 'engineer') {
    addNotification({ type: NotificationType.WORKORDER_ACCEPTED, level: 'info', title: '工单已接单',
      content: `工单 ${w.workorderId} 已被 ${w.engineerName} 接单`, targetRole: 'assistant',
      jumpPath: '/workorder', relatedId: w.workorderId })
  }
  window.dispatchEvent(new CustomEvent('workorder-flow-updated', { detail: { action: 'accepted', workorder: w } }))
  return w
}

/** 工程师提交客户签字 → 待签字 */
const submitForSign = (workorderId, serviceReport) => {
  const w = state.workorders.find(w => w.id === workorderId); if (!w) return null
  if (w.status !== WorkorderStatus.PROCESSING) {
    console.warn('submitForSign: 状态不允许提交签字，当前:', w.status)
    return null
  }
  w.status = WorkorderStatus.PENDING_SIGN; w.completeTime = new Date().toISOString()
  w.updateTime = new Date().toISOString()
  if (serviceReport) { w.serviceReport = { ...w.serviceReport, ...serviceReport } }
  w.processRecords.push({ time: new Date().toISOString(), title: '提交签字',
    content: '工程师已提交服务报告，等待签字确认', operator: w.engineerName, operatorType: 'engineer' })
  saveToStorage()
  addNotification({ type: NotificationType.WORKORDER_PENDING_SIGN, level: 'action', title: '工单待签字',
    content: `工单 ${w.workorderId} 已完成维修，请签字确认`, targetRole: 'customer',
    jumpPath: '/customer-workspace', relatedId: w.workorderId })
  addNotification({ type: NotificationType.WORKORDER_PENDING_SIGN, level: 'action', title: '工单待签字',
    content: `工单 ${w.workorderId} 等待签字`, targetRole: 'engineer',
    jumpPath: '/staff-workorder-detail', jumpParams: { id: w.id }, relatedId: w.workorderId })
  window.dispatchEvent(new CustomEvent('workorder-flow-updated', { detail: { action: 'pending_sign', workorder: w } }))
  return w
}

/** 签字确认（任一方） → 课长确认 */
const signWorkorder = (workorderId, signImage, signRole = 'customer') => {
  const w = state.workorders.find(w => w.id === workorderId); if (!w) return null
  if (w.status !== WorkorderStatus.PENDING_SIGN) {
    console.warn('signWorkorder: 状态不允许签字，当前:', w.status)
    return null
  }
  w.status = WorkorderStatus.TECHLEAD_CONFIRM; w.signTime = new Date().toISOString()
  w.updateTime = new Date().toISOString()
  if (signRole === 'customer') w.customerSign = signImage; else w.engineerSign = signImage
  const signer = signRole === 'customer' ? w.customerName : w.engineerName
  w.processRecords.push({ time: new Date().toISOString(), title: '签字确认',
    content: `${signer}（${signRole === 'customer' ? '客户' : '工程师'}）已完成签字`, operator: signer, operatorType: signRole })
  saveToStorage()
  addNotification({ type: NotificationType.WORKORDER_SIGNED, level: 'action', title: '工单待确认',
    content: `工单 ${w.workorderId} 已签字，请课长确认`, targetRole: 'techLead',
    jumpPath: '/workorder', relatedId: w.workorderId })
  const otherRole = signRole === 'customer' ? 'engineer' : 'customer'
  addNotification({ type: NotificationType.WORKORDER_SIGNED, level: 'info', title: '签字已完成',
    content: `工单 ${w.workorderId} 已由 ${signer} 签字确认`, targetRole: otherRole,
    jumpPath: otherRole === 'customer' ? '/customer-workorder-list' : '/staff-workorder-list', relatedId: w.workorderId })
  window.dispatchEvent(new CustomEvent('workorder-flow-updated', { detail: { action: 'signed', workorder: w } }))
  return w
}

/** 课长确认 → 业务确认 */
const techLeadConfirm = (workorderId) => {
  const w = state.workorders.find(w => w.id === workorderId); if (!w) return null
  if (w.status !== WorkorderStatus.TECHLEAD_CONFIRM) {
    console.warn('techLeadConfirm: 状态不允许课长确认，当前:', w.status)
    return null
  }
  w.status = WorkorderStatus.ASSISTANT_CONFIRM; w.techLeadConfirmTime = new Date().toISOString()
  w.updateTime = new Date().toISOString()
  w.processRecords.push({ time: new Date().toISOString(), title: '课长确认',
    content: '课长已查看并确认工单', operator: '课长', operatorType: 'techLead' })
  saveToStorage()
  addNotification({ type: NotificationType.WORKORDER_TECHLEAD_CONFIRMED, level: 'action', title: '工单待业务确认',
    content: `工单 ${w.workorderId} 课长已确认，请业务助理确认`, targetRole: 'assistant',
    jumpPath: '/workorder', relatedId: w.workorderId })
  window.dispatchEvent(new CustomEvent('workorder-flow-updated', { detail: { action: 'techlead_confirmed', workorder: w } }))
  return w
}

/** 业务确认 → 完成 */
const assistantConfirm = (workorderId) => {
  const w = state.workorders.find(w => w.id === workorderId); if (!w) return null
  if (w.status !== WorkorderStatus.ASSISTANT_CONFIRM) {
    console.warn('assistantConfirm: 状态不允许业务确认，当前:', w.status)
    return null
  }
  w.status = WorkorderStatus.COMPLETED; w.assistantConfirmTime = new Date().toISOString()
  w.updateTime = new Date().toISOString()
  w.processRecords.push({ time: new Date().toISOString(), title: '业务确认',
    content: '业务助理已确认，工单完成', operator: '业务助理', operatorType: 'assistant' })
  saveToStorage()
  addNotification({ type: NotificationType.WORKORDER_COMPLETED, level: 'info', title: '工单已完成',
    content: `工单 ${w.workorderId} 已完成`, targetRole: 'engineer',
    jumpPath: '/staff-workorder-list', relatedId: w.workorderId })
  addNotification({ type: NotificationType.WORKORDER_COMPLETED, level: 'info', title: '工单已完成',
    content: `工单 ${w.workorderId} 已完成`, targetRole: 'customer',
    jumpPath: '/customer-workorder-list', relatedId: w.workorderId })
  window.dispatchEvent(new CustomEvent('workorder-flow-updated', { detail: { action: 'completed', workorder: w } }))
  return w
}

/** 暂存服务报告 */
const saveServiceReportDraft = (workorderId, reportData) => {
  const w = state.workorders.find(w => w.id === workorderId); if (!w) return null
  w.serviceReport = { ...w.serviceReport, ...reportData }; saveToStorage(); return w
}

// ==================== 满意度调查(兼容旧接口) ====================
const getSatisfactionSurvey = () => null
const getPendingSurveysByCustomer = () => []
const submitSatisfactionSurvey = (surveyId, data) => { console.log('满意度调查已提交', surveyId, data); return { id: surveyId, status: 'completed' } }

// ==================== 旧接口兼容适配 ====================
const checkInWorkorder = (workorderId, location) => {
  const w = state.workorders.find(w => w.id === workorderId)
  if (!w) return null
  if (w.status !== WorkorderStatus.PENDING_ACCEPT && w.status !== WorkorderStatus.PROCESSING) {
    console.warn('checkInWorkorder: 当前状态不允许打卡:', w.status)
    return null
  }
  if (w.status === WorkorderStatus.PENDING_ACCEPT) {
    w.status = WorkorderStatus.PROCESSING
  }
  w.checkInTime = new Date().toISOString()
  w.checkInLocation = location
  saveToStorage()
  return w
}
const completeWorkorder = (workorderId, serviceReport) => submitForSign(workorderId, serviceReport)

/** 发起报价(stub) */
const initiateQuotation = (workorderId) => {
  const w = state.workorders.find(w => w.id === workorderId); if (!w) return null
  console.log('发起报价(模拟):', w.workorderId); return w
}

/** 保存签字PDF */
const saveReportPdf = (workorderId, pdfBase64) => {
  const w = state.workorders.find(w => w.id === workorderId); if (!w) return null
  w.reportPdf = pdfBase64; saveToStorage(); return w
}

// ==================== 通知 ====================
const createNotification = (data) => {
  const n = { id: Date.now().toString(), type: data.type, title: data.title, content: data.content,
    targetRole: data.targetRole, targetUserId: data.targetUserId,
    workorderId: data.workorderId, workorderNo: data.workorderNo,
    createTime: new Date().toISOString(), isRead: false }
  state.notifications.push(n); saveToStorage()
  window.dispatchEvent(new CustomEvent('new-notification', { detail: { notification: n } }))
  return n
}
const markNotificationAsRead = (notificationId) => {
  const n = state.notifications.find(n => n.id === notificationId); if (n) { n.isRead = true; saveToStorage() }
}

// ==================== 查询 ====================
const getCustomerWorkorders = (customerId, customerName) => {
  const byId = state.workorders.filter(w => w.customerId === customerId)
  if (byId.length > 0) return byId.sort((a, b) => new Date(b.createTime) - new Date(a.createTime))
  // 退而按客户名称匹配
  if (customerName) {
    return state.workorders.filter(w => w.customerName === customerName)
      .sort((a, b) => new Date(b.createTime) - new Date(a.createTime))
  }
  return []
}
const getEngineerWorkorders = (engineerId, engineerName) => {
  const byId = state.workorders.filter(w => w.engineerId === engineerId)
  const byName = state.workorders.filter(w => w.engineerName === engineerName)
  // 合并去重
  const merged = [...byId, ...byName.filter(w => !byId.find(x => x.id === w.id))]
  return merged.sort((a, b) => new Date(b.createTime) - new Date(a.createTime))
}
const getWorkorderById = (id) =>
  state.workorders.find(w => w.id === id || w.workorderId === id)

/** 根据用户角色返回可见的工单列表 */
const getVisibleWorkorders = (user) => {
  const { role, id: userId, name: userName } = user || {}
  // admin/director 看全部
  if (role === 'admin' || role === 'director') return [...state.workorders].sort((a, b) => new Date(b.createTime) - new Date(a.createTime))
  // techLead 看全部（负责分配和确认所有工单）
  if (role === 'techLead') return [...state.workorders].sort((a, b) => new Date(b.createTime) - new Date(a.createTime))
  // engineer 只看分配给自己或自己创建的
  if (role === 'engineer') {
    return state.workorders.filter(w =>
      w.engineerId === userId || w.engineerName === userName ||
      (w.createdBy && (w.createdBy.name === userName || w.createdBy.role === 'engineer'))
    ).sort((a, b) => new Date(b.createTime) - new Date(a.createTime))
  }
  // assistant 只看自己创建的 + 待业务确认的
  if (role === 'assistant') {
    return state.workorders.filter(w =>
      (w.createdBy && (w.createdBy.role === 'assistant' || w.createdBy.name === userName)) ||
      w.status === 'assistant_confirm'
    ).sort((a, b) => new Date(b.createTime) - new Date(a.createTime))
  }
  // customer 只看跟自己有关的
  if (role === 'customer') {
    return getCustomerWorkorders(userId, userName)
  }
  return []
}
const getWorkordersByStatus = (status) =>
  state.workorders.filter(w => w.status === status).sort((a, b) => new Date(b.createTime) - new Date(a.createTime))

const getPendingAssignWorkorders = () => getWorkordersByStatus(WorkorderStatus.PENDING_ASSIGN)
const getTechLeadPendingWorkorders = getPendingAssignWorkorders
const getPendingAcceptWorkorders = () => getWorkordersByStatus(WorkorderStatus.PENDING_ACCEPT)
const getProcessingWorkorders = () => getWorkordersByStatus(WorkorderStatus.PROCESSING)
const getPendingSignWorkorders = () => getWorkordersByStatus(WorkorderStatus.PENDING_SIGN)
const getTechLeadConfirmWorkorders = () => getWorkordersByStatus(WorkorderStatus.TECHLEAD_CONFIRM)
const getAssistantConfirmWorkorders = () => getWorkordersByStatus(WorkorderStatus.ASSISTANT_CONFIRM)
const getCompletedWorkorders = () => getWorkordersByStatus(WorkorderStatus.COMPLETED)

const getPendingWorkordersByRole = (role) => {
  switch (role) {
    case 'techLead': return [...getPendingAssignWorkorders(), ...getTechLeadConfirmWorkorders()]
    case 'engineer': return [...getPendingAcceptWorkorders(), ...getPendingSignWorkorders()]
    case 'assistant': return getAssistantConfirmWorkorders()
    case 'customer': return getPendingSignWorkorders()
    default: return []
  }
}

const getTechLeadNotifications = () => state.notifications.filter(n => n.targetRole === 'techLead' && !n.isRead).sort((a, b) => new Date(b.createTime) - new Date(a.createTime))
const getEngineerNotifications = (engineerId) => state.notifications.filter(n => n.targetRole === 'engineer' && !n.isRead).sort((a, b) => new Date(b.createTime) - new Date(a.createTime))
const getCustomerNotifications = (customerId) => state.notifications.filter(n => n.targetRole === 'customer' && n.targetUserId === customerId && !n.isRead).sort((a, b) => new Date(b.createTime) - new Date(a.createTime))
const getAssistantNotifications = () => state.notifications.filter(n => n.targetRole === 'assistant' && !n.isRead).sort((a, b) => new Date(b.createTime) - new Date(a.createTime))

const getFlowStatusText = (s) => WorkorderStatusText[s] || s
const getFlowStatusType = (s) => WorkorderStatusType[s] || 'info'
const getCurrentStepIndex = (s) => ['pending_assign','pending_accept','processing','pending_sign','techlead_confirm','assistant_confirm','completed'].indexOf(s)

const getAvailableActions = (status) => ({
  'pending_assign': ['assign'], 'pending_accept': ['accept', 'reject'],
  'processing': ['submit_sign'], 'pending_sign': ['sign'],
  'techlead_confirm': ['confirm_techlead'], 'assistant_confirm': ['confirm_assistant'], 'completed': []
}[status] || [])

const getNextStatus = (cur, action) => ({
  'pending_assign': { 'assign': 'pending_accept' },
  'pending_accept': { 'accept': 'processing', 'reject': 'pending_assign' },
  'processing': { 'submit_sign': 'pending_sign' },
  'pending_sign': { 'sign': 'techlead_confirm' },
  'techlead_confirm': { 'confirm_techlead': 'assistant_confirm' },
  'assistant_confirm': { 'confirm_assistant': 'completed' },
}[cur]?.[action] || cur)

// ==================== 超时报警 ====================
const flowRecords = []
const addFlowRecord = (workorderId, action, operator, remark = '') => {
  const r = { id: 'fr_'+Date.now(), workorderId, action, operator, remark, createTime: new Date().toISOString() }
  flowRecords.push(r); return r
}
const getFlowRecordsByWorkorder = (workorderId) => flowRecords.filter(r => r.workorderId === workorderId).sort((a,b)=>new Date(b.createTime)-new Date(a.createTime))

const checkTimeoutAlarms = () => {
  const now = Date.now(); const TWO_HOURS = 2*60*60*1000
  state.workorders.forEach(w => {
    if (w.status === WorkorderStatus.PENDING_ASSIGN && w.createTime) {
      if (now - new Date(w.createTime).getTime() > TWO_HOURS && !w._alarmAssignSent) {
        w._alarmAssignSent = true
        addNotification({ type: NotificationType.TIMEOUT_ALARM, level: 'action', title: '超时报警',
          content: `工单 ${w.workorderId} 已超过2小时未分配`, targetRole: 'director',
          jumpPath: '/workorder', relatedId: w.workorderId })
      }
    }
    if (w.status === WorkorderStatus.PENDING_ACCEPT && w.assignTime) {
      if (now - new Date(w.assignTime).getTime() > TWO_HOURS && !w._alarmAcceptSent) {
        w._alarmAcceptSent = true
        ;['techLead','director'].forEach(role => {
          addNotification({ type: NotificationType.TIMEOUT_ALARM, level: 'action', title: '超时报警',
            content: `工单 ${w.workorderId} 已超过2小时未被工程师接单`, targetRole: role,
            jumpPath: '/workorder', relatedId: w.workorderId })
        })
      }
    }
  })
  saveToStorage()
}

// ==================== Mock数据 ====================
const initMockData = (force = false) => {
  if (force || state.workorders.length === 0) {
    if (force) state.workorders = []
    const now = Date.now(); const h = (n) => new Date(now - n*3600000).toISOString()

    const pushMock = (id, wid, cat, sub, status, cTime, uTime, createdBy, custName, custPhone, model, serial, fault, urgency, warranty, wEnd, addr, records, engId, engName, engPhone, aTime, acTime, coTime, siTime, tlTime, asTime, sr, cs, es, pdf, qid) => {
      state.workorders.push({ id, workorderId: wid, category: cat, subType: sub, status, createTime: cTime, updateTime: uTime, createdBy, customerId: 'C001', customerName: custName, customerPhone: custPhone, customerContact: '', customerFax: '', deviceModel: model, serialNumber: serial, faultDescription: fault, urgency, attachments: [], warrantyStatus: warranty, warrantyEndDate: wEnd, installDate: '', address: addr, techLeadRole: 'techLead', techLeadName: sub ? SUBTYPE_TECHLEAD_MAP[sub].name : '', processRecords: records, engineerId: engId, engineerName: engName, engineerPhone: engPhone, assignTime: aTime, acceptTime: acTime, completeTime: coTime, signTime: siTime, techLeadConfirmTime: tlTime, assistantConfirmTime: asTime, serviceReport: sr, customerSign: cs, engineerSign: es, reportPdf: pdf, quotationId: qid, partsList: [], totalCostAmount: 0, totalSaleAmount: 0, totalProfitMargin: 0 })
    }

    pushMock('wo_001','WO20260608001','service','repair',WorkorderStatus.PENDING_ASSIGN,
      h(1),h(1),{role:'assistant',name:'赵业务助理'},'张经理','13800138000',
      '激光切割机 LX-3000','ABC123','设备无法正常启动，显示屏报错E01','high','in','2026-02-19',
      '广州市天河区科技园路1号',[{time:h(1),title:'工单创建',content:'业务助理提交工单',operator:'赵业务助理',operatorType:'assistant'}],
      null,null,null,null,null,null,null,null,null,null,null,null,null,null)

    pushMock('wo_002','WO20260608002','service','trial_processing',WorkorderStatus.PENDING_ACCEPT,
      h(24),h(12),{role:'customer',name:'张经理'},'张经理','13800138000',
      '加工中心 MC-800','DEF456','试加工件轮廓精度不合格','medium','in','2026-06-30',
      '广州市天河区科技园路1号',[
        {time:h(24),title:'工单创建',content:'客户提交工单',operator:'张经理',operatorType:'customer'},
        {time:h(12),title:'工单分配',content:'课长分配给工程师 李工程师',operator:'课长',operatorType:'techLead'}],
      'eng_001','李工程师','13900139000',h(12),null,null,null,null,null,null,null,null,null)

    pushMock('wo_003','WO20260608003','service','refitting',WorkorderStatus.PROCESSING,
      h(48),h(6),{role:'customer',name:'张经理'},'张经理','13800138000',
      '数控冲床 CK-2000','GHI789','改造后模具无法复位','medium','out','2024-12-31',
      '广州市天河区科技园路1号',[
        {time:h(48),title:'工单创建',content:'客户提交工单',operator:'张经理',operatorType:'customer'},
        {time:h(36),title:'工单分配',content:'课长分配给工程师 王工程师',operator:'课长',operatorType:'techLead'},
        {time:h(6),title:'工程师接单',content:'工程师 王工程师 已接单',operator:'王工程师',operatorType:'engineer'}],
      'eng_002','王工程师','13900239000',h(36),h(6),null,null,null,null,null,null,null,null)

    pushMock('wo_004','WO20260608004','service','repair',WorkorderStatus.PENDING_SIGN,
      h(72),h(2),{role:'customer',name:'张经理'},'张经理','13800138000',
      '激光切割机 LX-3000','JKL012','激光器功率衰减','medium','out','2024-12-31',
      '广州市天河区科技园路1号',[
        {time:h(72),title:'工单创建',content:'客户提交工单',operator:'张经理',operatorType:'customer'},
        {time:h(48),title:'工单分配',content:'课长分配给工程师 赵工程师',operator:'课长',operatorType:'techLead'},
        {time:h(24),title:'工程师接单',content:'接单',operator:'赵工程师',operatorType:'engineer'},
        {time:h(2),title:'提交签字',content:'已提交服务报告',operator:'赵工程师',operatorType:'engineer'}],
      'eng_003','赵工程师','13900339000',h(48),h(24),h(2),null,null,null,
      {repairContent:'更换激光器模块，校准光路',replacedParts:['激光器模块'],testResult:'功率恢复正常'},null,null,null,null)

    pushMock('wo_005','WO20260608005','installation',null,WorkorderStatus.TECHLEAD_CONFIRM,
      h(96),h(4),{role:'assistant',name:'钱业务助理'},'李总','13911111111',
      '激光切割机 LX-5000','MNO345','新设备安装调试','low','in','2026-08-15',
      '广州市番禺区',[
        {time:h(96),title:'工单创建',content:'业务助理提交工单',operator:'钱业务助理',operatorType:'assistant'},
        {time:h(72),title:'工单分配',content:'课长分配给工程师 孙工程师',operator:'课长',operatorType:'techLead'},
        {time:h(48),title:'工程师接单',content:'接单',operator:'孙工程师',operatorType:'engineer'},
        {time:h(24),title:'提交签字',content:'已提交服务报告',operator:'孙工程师',operatorType:'engineer'},
        {time:h(4),title:'签字确认',content:'客户已完成签字',operator:'李总',operatorType:'customer'}],
      'eng_004','孙工程师','13900439000',h(72),h(48),h(24),h(4),null,null,
      {repairContent:'安装调试激光切割机',replacedParts:[],testResult:'设备运行正常'},
      'sig_base64',null,null,null)

    pushMock('wo_006','WO20260608006','service','repair',WorkorderStatus.ASSISTANT_CONFIRM,
      h(120),h(8),{role:'assistant',name:'赵业务助理'},'王工','13822222222',
      '加工中心 MC-800','PQR678','主轴异响','high','in','2026-08-15',
      '广州市黄埔区',[
        {time:h(120),title:'工单创建',content:'业务助理提交',operator:'赵业务助理',operatorType:'assistant'},
        {time:h(96),title:'工单分配',content:'课长分配',operator:'课长',operatorType:'techLead'},
        {time:h(72),title:'工程师接单',content:'接单',operator:'周工程师',operatorType:'engineer'},
        {time:h(48),title:'提交签字',content:'提交服务报告',operator:'周工程师',operatorType:'engineer'},
        {time:h(24),title:'签字确认',content:'客户签字',operator:'王工',operatorType:'customer'},
        {time:h(8),title:'课长确认',content:'课长已确认',operator:'课长',operatorType:'techLead'}],
      'eng_005','周工程师','13900539000',h(96),h(72),h(48),h(24),h(8),null,
      {repairContent:'更换主轴轴承',replacedParts:['轴承SKF-6205'],testResult:'异响消除'},
      'sig_base64_2',null,null,null)

    pushMock('wo_007','WO20260608007','service','trial_processing',WorkorderStatus.COMPLETED,
      h(168),h(12),{role:'customer',name:'王工'},'王工','13822222222',
      '加工中心 MC-800','STU901','试加工件表面粗糙度不合格','medium','out','2024-08-30',
      '广州市黄埔区',[
        {time:h(168),title:'工单创建',content:'客户提交',operator:'王工',operatorType:'customer'},
        {time:h(144),title:'工单分配',content:'课长分配',operator:'课长',operatorType:'techLead'},
        {time:h(120),title:'工程师接单',content:'接单',operator:'吴工程师',operatorType:'engineer'},
        {time:h(96),title:'提交签字',content:'已提交',operator:'吴工程师',operatorType:'engineer'},
        {time:h(72),title:'签字确认',content:'客户签字',operator:'王工',operatorType:'customer'},
        {time:h(48),title:'课长确认',content:'已确认',operator:'课长',operatorType:'techLead'},
        {time:h(12),title:'业务确认',content:'工单完成',operator:'业务助理',operatorType:'assistant'}],
      'eng_006','吴工程师','13900639000',h(144),h(120),h(96),h(72),h(48),h(12),
      {repairContent:'优化切削参数，更换刀具',replacedParts:['精车刀片'],testResult:'粗糙度达标'},
      'sig_base64_3',null,'pdf_sample_base64',null)

    saveToStorage()
  }
  setTimeout(() => startTimeoutChecker(), 0)
}
loadFromStorage() // 首次加载，若 localStorage 为空则初始化 mock 数据

// ==================== 角色常量 ====================
export const Roles = {
  ADMIN: 'admin',
  TECH_LEAD: 'techLead',
  DIRECTOR: 'director',
  ENGINEER: 'engineer',
  ASSISTANT: 'assistant',
  SALES: 'sales',
  CUSTOMER: 'customer'
}

// ==================== 统一角色权限校验 ====================
export const canCreateWorkorder = (role) =>
  [Roles.ADMIN, Roles.ASSISTANT, Roles.ENGINEER, Roles.TECH_LEAD, Roles.SALES].includes(role)

export const canAssignWorkorder = (role, workorder) => {
  if ([Roles.ADMIN, Roles.TECH_LEAD].includes(role)) return true
  if (role === Roles.DIRECTOR && workorder) return isTimeoutUnassigned(workorder)
  return false
}

export const canAcceptWorkorder = (role, workorder, userId) => {
  if (role === Roles.ADMIN) return true
  if (role === Roles.ENGINEER) {
    if (!workorder || !userId) return false
    const wId = workorder.engineerId || (workorder.engineerId === 0 ? 0 : workorder.engineerId)
    return String(wId) === String(userId)
  }
  return false
}

export const canRejectWorkorder = (role, workorder, userId) => canAcceptWorkorder(role, workorder, userId)

export const canSubmitForSign = (role, workorder, userId) => {
  if (role === Roles.ADMIN) return true
  if (role === Roles.ENGINEER) {
    if (!workorder || !userId) return false
    return String(workorder.engineerId) === String(userId)
  }
  return false
}

export const canSignWorkorder = (role, workorder, userId) => {
  if (role === Roles.ADMIN) return true
  if (role === Roles.ENGINEER) {
    if (!workorder || !userId) return false
    return String(workorder.engineerId) === String(userId)
  }
  if (role === Roles.CUSTOMER) {
    if (!workorder || !userId) return false
    return String(workorder.customerId) === String(userId)
  }
  return false
}

export const canTechLeadConfirm = (role) =>
  [Roles.ADMIN, Roles.TECH_LEAD].includes(role)

export const canAssistantConfirm = (role) =>
  [Roles.ADMIN, Roles.ASSISTANT].includes(role)

export const canCompleteDirectly = (role) =>
  role === Roles.ADMIN

// ==================== 2小时超时检测 + 部长待分配池 ====================
const ASSIGN_TIMEOUT_MS = 2 * 60 * 60 * 1000

export const isTimeoutUnassigned = (workorder) => {
  if (!workorder || workorder.status !== WorkorderStatus.PENDING_ASSIGN) return false
  if (!workorder.createTime) return false
  const createTime = new Date(workorder.createTime).getTime()
  if (isNaN(createTime)) return false
  return (Date.now() - createTime) > ASSIGN_TIMEOUT_MS
}

export const getDirectorPendingPool = () => {
  return state.workorders.filter(w => isTimeoutUnassigned(w))
    .sort((a, b) => new Date(b.createTime) - new Date(a.createTime))
}

let timeoutCheckInterval = null
export const startTimeoutChecker = () => {
  if (timeoutCheckInterval) return
  timeoutCheckInterval = setInterval(() => {
    const timeoutWorkorders = state.workorders.filter(w => isTimeoutUnassigned(w))
    if (timeoutWorkorders.length > 0) {
      createNotification({
        id: 'to_' + Date.now(),
        targetRole: 'director',
        title: '工单超时提醒',
        message: `有 ${timeoutWorkorders.length} 个工单超过2小时未分配，请及时处理`,
        type: 'timeout_alarm',
        createTime: new Date().toISOString(),
        isRead: false
      })
    }
  }, 30000)
}

export const stopTimeoutChecker = () => {
  if (timeoutCheckInterval) {
    clearInterval(timeoutCheckInterval)
    timeoutCheckInterval = null
  }
}

export {
  state, createWorkorder, assignWorkorder, rejectWorkorder, acceptWorkorder,
  submitForSign, signWorkorder, techLeadConfirm, assistantConfirm,
  saveServiceReportDraft, saveReportPdf,
  getEngineerWorkorders, getWorkorderById, getVisibleWorkorders, getCustomerWorkorders,
  getPendingAssignWorkorders, getTechLeadPendingWorkorders,
  getPendingAcceptWorkorders, getProcessingWorkorders, getPendingSignWorkorders,
  getTechLeadConfirmWorkorders, getAssistantConfirmWorkorders, getCompletedWorkorders,
  getPendingWorkordersByRole,
  getTechLeadNotifications, getEngineerNotifications, getCustomerNotifications, getAssistantNotifications,
  createNotification, markNotificationAsRead,
  getFlowStatusText, getFlowStatusType, getCurrentStepIndex,
  getAvailableActions, getNextStatus,
  checkTimeoutAlarms, addFlowRecord, getFlowRecordsByWorkorder,
  getSatisfactionSurvey, getPendingSurveysByCustomer, submitSatisfactionSurvey,
  checkInWorkorder, completeWorkorder, initiateQuotation,
}
