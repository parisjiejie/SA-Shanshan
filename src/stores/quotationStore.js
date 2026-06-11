import { reactive, computed, ref } from 'vue'

// 报价单状态枚举
const QuotationStatus = {
  DRAFT: 'draft',           // 草稿
  PENDING: 'pending',       // 待审核
  REVIEWING: 'reviewing',   // 审核中
  APPROVED: 'approved',     // 已通过
  REJECTED: 'rejected',     // 已驳回
  SENT: 'sent',             // 已发送客户
  CONFIRMED: 'confirmed',   // 客户已确认
  EXPIRED: 'expired',       // 已过期
  CANCELLED: 'cancelled'    // 已取消
}

// 报价单类型枚举
const QuotationType = {
  PARTS_SALE: 'parts_sale',           // 配件销售报价单
  WORKORDER_REPAIR: 'workorder_repair' // 维修工单报价单
}

// 审核级别枚举
const ApprovalLevel = {
  NONE: 0,
  SALES_SUPERVISOR: 1,      // 销售主管
  FINANCE: 2,               // 财务
  GENERAL_MANAGER: 3        // 总经理
}

// 审核级别配置（可根据金额配置）
const approvalLevelConfig = {
  [ApprovalLevel.SALES_SUPERVISOR]: {
    name: '销售主管',
    minAmount: 0,
    maxAmount: 10000
  },
  [ApprovalLevel.FINANCE]: {
    name: '财务',
    minAmount: 10000,
    maxAmount: 50000
  },
  [ApprovalLevel.GENERAL_MANAGER]: {
    name: '总经理',
    minAmount: 50000,
    maxAmount: Infinity
  }
}

// 获取需要的审核级别
function getRequiredApprovalLevel(totalAmount) {
  for (const level of Object.values(ApprovalLevel).filter(v => typeof v === 'number' && v > 0)) {
    const config = approvalLevelConfig[level]
    if (config && totalAmount >= config.minAmount && totalAmount < config.maxAmount) {
      return level
    }
  }
  return ApprovalLevel.SALES_SUPERVISOR
}

// 报价单数据存储
const state = reactive({
  quotations: [],              // 配件销售报价单
  workorderQuotations: [],     // 维修工单报价单
  currentQuotation: null,
  approvalRecords: []
})

// 保存报价单到 localStorage
function saveQuotationsToStorage() {
  try {
    localStorage.setItem('quotations', JSON.stringify(state.quotations))
    localStorage.setItem('workorderQuotations', JSON.stringify(state.workorderQuotations))
  } catch (e) {
    console.error('保存报价单到 localStorage 失败:', e)
  }
}

// 从 localStorage 加载报价单
function loadQuotationsFromStorage() {
  try {
    // 加载配件销售报价单
    const stored = localStorage.getItem('quotations')
    if (stored) {
      const parsed = JSON.parse(stored)
      if (Array.isArray(parsed) && parsed.length > 0) {
        // 兼容性处理：为旧数据添加 type 字段
        const loadedQuotations = parsed.map(q => ({
          ...q,
          type: q.type || QuotationType.PARTS_SALE
        }))
        // 合并数据：保留已有数据，添加新数据
        loadedQuotations.forEach(q => {
          if (!state.quotations.some(existing => existing.id === q.id)) {
            state.quotations.push(q)
          }
        })
      }
    }

    // 加载维修工单报价单
    const workorderStored = localStorage.getItem('workorderQuotations')
    if (workorderStored) {
      const parsed = JSON.parse(workorderStored)
      if (Array.isArray(parsed) && parsed.length > 0) {
        // 合并数据：保留已有数据，添加新数据
        parsed.forEach(q => {
          if (!state.workorderQuotations.some(existing => existing.id === q.id)) {
            state.workorderQuotations.push(q)
          }
        })
      }
    }
  } catch (e) {
    console.error('从 localStorage 加载报价单失败:', e)
  }
}

// 计算属性
const quotationList = computed(() => state.quotations)
const workorderQuotationList = computed(() => state.workorderQuotations)
const currentQuotation = computed(() => state.currentQuotation)

// 配件销售待审批数量
const pendingApprovalCount = computed(() => {
  return state.quotations.filter(q =>
    q.status === QuotationStatus.PENDING || q.status === QuotationStatus.REVIEWING
  ).length
})

// 维修工单待审批数量
const workorderPendingApprovalCount = computed(() => {
  return state.workorderQuotations.filter(q =>
    q.status === QuotationStatus.PENDING || q.status === QuotationStatus.REVIEWING
  ).length
})

// 总待审批数量
const totalPendingApprovalCount = computed(() => {
  return pendingApprovalCount.value + workorderPendingApprovalCount.value
})

// 生成报价单编号
function generateQuotationNo() {
  const date = new Date()
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '')
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
  return `QT${dateStr}${random}`
}

// 创建新报价单（配件销售）
function createQuotation(data) {
  const quotation = {
    id: Date.now().toString(),
    quotationNo: generateQuotationNo(),
    type: QuotationType.PARTS_SALE,                   // 标记为配件销售报价单
    workorderId: data.workorderId,                    // 关联工单ID
    workorderNo: data.workorderNo,                    // 工单编号
    customerId: data.customerId,
    customerName: data.customerName,
    contactName: data.contactName,
    contactPhone: data.contactPhone,
    items: data.items || [],
    subtotal: 0,                                      // 销售金额小计
    purchaseTotal: 0,                                 // 采购金额合计（成本）
    profitTotal: 0,                                   // 利润合计
    profitRate: 0,                                    // 总利润率
    taxRate: data.taxRate || 0.13,                   // 默认13%税率
    taxAmount: 0,
    discount: data.discount || 0,
    totalAmount: 0,                                   // 销售总价
    status: QuotationStatus.DRAFT,
    currentApprovalLevel: ApprovalLevel.NONE,
    requiredApprovalLevel: ApprovalLevel.NONE,
    version: 1,
    validDays: data.validDays || 30,
    validUntil: null,
    quoteDate: null,
    notes: data.notes || '',
    terms: data.terms || '',
    pdfUrl: null,                                     // 生成的PDF文件URL
    customerPdfUrl: null,                             // 客户回传的PDF文件URL
    createdBy: data.createdBy,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    sentAt: null,
    confirmedAt: null
  }

  // 计算金额
  calculateAmounts(quotation)
  saveQuotationsToStorage()

  state.quotations.push(quotation)
  return quotation
}

// 创建维修工单报价单（上传PDF方式）
function createWorkorderQuotation(data) {
  const quotation = {
    id: Date.now().toString(),
    quotationNo: generateQuotationNo(),
    type: QuotationType.WORKORDER_REPAIR,  // 标记为维修工单报价单
    workorderId: data.workorderId,          // 关联工单ID
    workorderNo: data.workorderNo,          // 工单编号
    customerId: data.customerId,
    customerName: data.customerName,
    contactName: data.contactName,
    contactPhone: data.contactPhone,

    // 维修工单报价单特有字段
    pdfUrl: data.pdfUrl,                    // 上传的PDF文件URL
    fileName: data.fileName,                // 文件名
    totalAmount: data.totalAmount || 0,     // 总金额（手动填写或从PDF识别）
    remark: data.remark || '',              // 备注说明

    // 通用字段
    status: QuotationStatus.DRAFT,
    version: 1,
    validDays: data.validDays || 7,         // 维修报价通常有效期较短
    validUntil: null,
    quoteDate: null,

    // 审批相关
    currentApprovalLevel: ApprovalLevel.NONE,
    requiredApprovalLevel: ApprovalLevel.SALES_SUPERVISOR, // 维修工单通常只需要销售主管审批

    // 时间戳
    createdBy: data.createdBy,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    sentAt: null,
    confirmedAt: null,
    approvedAt: null,
    approvedBy: null,
    rejectedAt: null,
    rejectedBy: null
  }

  state.workorderQuotations.push(quotation)
  saveQuotationsToStorage()
  return quotation
}

// 计算报价单金额
function calculateAmounts(quotation) {
  // 计算销售金额小计
  quotation.subtotal = quotation.items.reduce((sum, item) => {
    return sum + (item.quantity * item.unitPrice)
  }, 0)

  // 计算采购金额合计（成本）
  quotation.purchaseTotal = quotation.items.reduce((sum, item) => {
    return sum + (item.quantity * (item.purchasePrice || 0))
  }, 0)

  // 计算利润合计
  quotation.profitTotal = quotation.subtotal - quotation.purchaseTotal

  // 计算总利润率（基于采购金额/成本）
  if (quotation.purchaseTotal > 0) {
    quotation.profitRate = (quotation.profitTotal / quotation.purchaseTotal) * 100
  } else {
    quotation.profitRate = 0
  }

  // 计算税额
  quotation.taxAmount = quotation.subtotal * quotation.taxRate

  // 计算销售总价（小计 + 税额 - 折扣）
  quotation.totalAmount = quotation.subtotal + quotation.taxAmount - quotation.discount

  // 计算所需审核级别
  quotation.requiredApprovalLevel = getRequiredApprovalLevel(quotation.totalAmount)

  return quotation
}

// 更新报价单
function updateQuotation(id, data) {
  const index = state.quotations.findIndex(q => q.id === id)
  if (index === -1) return null
  
  const quotation = state.quotations[index]
  
  // 如果已提交审核，不允许直接修改
  if (quotation.status !== QuotationStatus.DRAFT && 
      quotation.status !== QuotationStatus.REJECTED) {
    throw new Error('当前状态不允许修改')
  }
  
  // 更新字段
  Object.assign(quotation, data, {
    updatedAt: new Date().toISOString()
  })
  
  // 重新计算金额
  calculateAmounts(quotation)
  
  return quotation
}

// 提交审核（配件销售）
function submitForApproval(id) {
  const quotation = state.quotations.find(q => q.id === id)
  if (!quotation) return null

  if (quotation.status !== QuotationStatus.DRAFT &&
      quotation.status !== QuotationStatus.REJECTED) {
    throw new Error('当前状态不允许提交审核')
  }

  quotation.status = QuotationStatus.PENDING
  quotation.currentApprovalLevel = ApprovalLevel.SALES_SUPERVISOR
  quotation.updatedAt = new Date().toISOString()

  // 创建审核记录
  createApprovalRecord({
    quotationId: id,
    level: ApprovalLevel.SALES_SUPERVISOR,
    action: 'submit',
    comment: '提交审核',
    operator: quotation.createdBy
  })

  saveQuotationsToStorage()
  return quotation
}

// 提交维修工单报价单审核
function submitWorkorderQuotationForApproval(id) {
  const quotation = state.workorderQuotations.find(q => q.id === id)
  if (!quotation) return null

  if (quotation.status !== QuotationStatus.DRAFT &&
      quotation.status !== QuotationStatus.REJECTED) {
    throw new Error('当前状态不允许提交审核')
  }

  quotation.status = QuotationStatus.PENDING
  quotation.currentApprovalLevel = ApprovalLevel.SALES_SUPERVISOR
  quotation.updatedAt = new Date().toISOString()

  // 创建审核记录
  createApprovalRecord({
    quotationId: id,
    level: ApprovalLevel.SALES_SUPERVISOR,
    action: 'submit',
    comment: '提交审核',
    operator: quotation.createdBy,
    quotationType: QuotationType.WORKORDER_REPAIR
  })

  saveQuotationsToStorage()
  return quotation
}

// 审核报价单（配件销售）
function approveQuotation(id, data) {
  const quotation = state.quotations.find(q => q.id === id)
  if (!quotation) return null

  const { level, action, comment, operator } = data

  // 创建审核记录
  createApprovalRecord({
    quotationId: id,
    level,
    action,
    comment,
    operator
  })

  if (action === 'approve') {
    // 判断是否还需要更高级别审核
    if (level < quotation.requiredApprovalLevel) {
      // 进入下一级审核
      quotation.currentApprovalLevel = level + 1
      quotation.status = QuotationStatus.REVIEWING
    } else {
      // 审核通过
      quotation.status = QuotationStatus.APPROVED
      quotation.currentApprovalLevel = level
    }
  } else if (action === 'reject') {
    // 驳回
    quotation.status = QuotationStatus.REJECTED
  }

  quotation.updatedAt = new Date().toISOString()
  saveQuotationsToStorage()
  return quotation
}

// 审核维修工单报价单
function approveWorkorderQuotation(id, data) {
  const quotation = state.workorderQuotations.find(q => q.id === id)
  if (!quotation) return null

  const { action, comment, operator } = data

  // 创建审核记录
  createApprovalRecord({
    quotationId: id,
    level: ApprovalLevel.SALES_SUPERVISOR,
    action,
    comment,
    operator,
    quotationType: QuotationType.WORKORDER_REPAIR
  })

  if (action === 'approve') {
    // 审核通过
    quotation.status = QuotationStatus.APPROVED
    quotation.approvedAt = new Date().toISOString()
    quotation.approvedBy = operator
  } else if (action === 'reject') {
    // 驳回
    quotation.status = QuotationStatus.REJECTED
    quotation.rejectedAt = new Date().toISOString()
    quotation.rejectedBy = operator
  }

  quotation.updatedAt = new Date().toISOString()
  saveQuotationsToStorage()
  return quotation
}

// 创建审核记录
function createApprovalRecord(data) {
  const record = {
    id: Date.now().toString(),
    quotationId: data.quotationId,
    level: data.level,
    levelName: approvalLevelConfig[data.level]?.name || '未知',
    action: data.action,  // submit, approve, reject
    actionName: {
      submit: '提交',
      approve: '通过',
      reject: '驳回'
    }[data.action] || data.action,
    comment: data.comment,
    operator: data.operator,
    createdAt: new Date().toISOString()
  }
  
  state.approvalRecords.push(record)
  return record
}

// 获取报价单的审核记录
function getApprovalRecords(quotationId) {
  return state.approvalRecords
    .filter(r => r.quotationId === quotationId)
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
}

// 将报价单转化为工单数据
function convertToWorkorderData(quotation) {
  if (!quotation) return null

  return {
    workorderNo: generateWorkorderNo(),
    type: '配件销售',
    customerId: quotation.customerId,
    customerName: quotation.customerName,
    contactName: quotation.contactName,
    contactPhone: quotation.contactPhone,
    sourceQuotationId: quotation.id,
    sourceQuotationNo: quotation.quotationNo,
    items: quotation.items?.map(item => ({
      partNumber: item.partNumber,
      partName: item.partName,
      specification: item.specification,
      unit: item.unit,
      quantity: item.quantity,
      costPrice: item.purchasePrice,
      salePrice: item.unitPrice,
      costAmount: item.purchaseTotal,
      saleAmount: item.totalPrice,
      profitMargin: item.profitRate,
      remark: item.remark
    })) || [],
    totalAmount: quotation.totalAmount,
    status: 'pending',
    createdAt: new Date().toISOString()
  }
}

// 生成工单编号
function generateWorkorderNo() {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const random = String(Math.floor(Math.random() * 1000)).padStart(3, '0')
  return `WO${year}${month}${day}${random}`
}

// 发送报价单给客户
function sendQuotation(id, sendData = {}) {
  const quotation = state.quotations.find(q => q.id === id)
  if (!quotation) return null

  if (quotation.status !== QuotationStatus.APPROVED) {
    throw new Error('报价单未通过审核，无法发送')
  }

  quotation.status = QuotationStatus.SENT
  quotation.quoteDate = new Date().toISOString()
  quotation.validUntil = new Date(Date.now() + quotation.validDays * 24 * 60 * 60 * 1000).toISOString()
  quotation.sentAt = new Date().toISOString()
  quotation.updatedAt = new Date().toISOString()

  // 记录发送信息
  if (sendData.toEmail) {
    quotation.sendRecord = {
      toEmail: sendData.toEmail,
      ccEmail: sendData.ccEmail,
      subject: sendData.subject,
      content: sendData.content,
      needSignature: sendData.needSignature,
      signatureDeadline: sendData.signatureDeadline,
      sentAt: sendData.sentAt || new Date().toISOString(),
      operator: sendData.operator || '当前用户'
    }
  }

  // 保存到 localStorage，供客户工作台读取
  saveQuotationsToStorage()

  // 触发报价单更新事件，通知客户工作台刷新
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('quotation-updated', {
      detail: { quotationId: id, action: 'sent' }
    }))
  }

  return quotation
}

// 客户确认报价单（配件销售）
function confirmQuotation(id) {
  const quotation = state.quotations.find(q => q.id === id)
  if (!quotation) return null

  if (quotation.status !== QuotationStatus.SENT) {
    throw new Error('报价单未发送，无法确认')
  }

  // 检查是否过期
  if (new Date() > new Date(quotation.validUntil)) {
    quotation.status = QuotationStatus.EXPIRED
    saveQuotationsToStorage()
    throw new Error('报价单已过期')
  }

  quotation.status = QuotationStatus.CONFIRMED
  quotation.confirmedAt = new Date().toISOString()
  quotation.updatedAt = new Date().toISOString()

  saveQuotationsToStorage()
  return quotation
}

// 发送维修工单报价单给客户
function sendWorkorderQuotation(id, sendData = {}) {
  const quotation = state.workorderQuotations.find(q => q.id === id)
  if (!quotation) return null

  if (quotation.status !== QuotationStatus.APPROVED) {
    throw new Error('报价单未通过审核，无法发送')
  }

  quotation.status = QuotationStatus.SENT
  quotation.quoteDate = new Date().toISOString()
  quotation.validUntil = new Date(Date.now() + quotation.validDays * 24 * 60 * 60 * 1000).toISOString()
  quotation.sentAt = new Date().toISOString()
  quotation.updatedAt = new Date().toISOString()

  // 记录发送信息
  quotation.sendRecord = {
    toEmail: sendData.toEmail,
    toPhone: sendData.toPhone,
    sendMethod: sendData.sendMethod || 'link', // link, email, sms
    sentAt: sendData.sentAt || new Date().toISOString(),
    operator: sendData.operator || '当前用户'
  }

  // 保存到 localStorage
  saveQuotationsToStorage()

  // 触发报价单更新事件
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('workorder-quotation-updated', {
      detail: { quotationId: id, action: 'sent', workorderId: quotation.workorderId }
    }))
  }

  return quotation
}

// 客户确认维修工单报价单
function confirmWorkorderQuotation(id, confirmData = {}) {
  const quotation = state.workorderQuotations.find(q => q.id === id)
  if (!quotation) return null

  if (quotation.status !== QuotationStatus.SENT) {
    throw new Error('报价单未发送，无法确认')
  }

  // 检查是否过期
  if (quotation.validUntil && new Date() > new Date(quotation.validUntil)) {
    quotation.status = QuotationStatus.EXPIRED
    saveQuotationsToStorage()
    throw new Error('报价单已过期')
  }

  quotation.status = QuotationStatus.CONFIRMED
  quotation.confirmedAt = new Date().toISOString()
  quotation.updatedAt = new Date().toISOString()

  // 保存客户签名
  if (confirmData.signature) {
    quotation.customerSignature = confirmData.signature
  }

  // 保存客户确认备注
  if (confirmData.remark) {
    quotation.confirmRemark = confirmData.remark
  }

  saveQuotationsToStorage()

  // 触发确认事件
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('workorder-quotation-updated', {
      detail: { quotationId: id, action: 'confirmed', workorderId: quotation.workorderId }
    }))
  }

  return quotation
}

// 创建新版本
function createNewVersion(id) {
  const quotation = state.quotations.find(q => q.id === id)
  if (!quotation) return null
  
  const newQuotation = {
    ...quotation,
    id: Date.now().toString(),
    quotationNo: generateQuotationNo(),
    status: QuotationStatus.DRAFT,
    currentApprovalLevel: ApprovalLevel.NONE,
    version: quotation.version + 1,
    quoteDate: null,
    validUntil: null,
    sentAt: null,
    confirmedAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
  
  state.quotations.push(newQuotation)
  return newQuotation
}

// 获取报价单的历史版本
function getQuotationVersions(quotationNo) {
  // 提取基础报价单号（去掉版本号后缀）
  const baseQuotationNo = quotationNo.replace(/-\d+$/, '')

  return state.quotations
    .filter(q => q.quotationNo === quotationNo || q.quotationNo.startsWith(baseQuotationNo + '-'))
    .sort((a, b) => b.version - a.version)
}

// 添加配件明细项
function addItem(quotationId, item) {
  const quotation = state.quotations.find(q => q.id === quotationId)
  if (!quotation) return null

  const quantity = item.quantity || 1
  const unitPrice = item.unitPrice || 0
  const purchasePrice = item.purchasePrice || 0

  const purchaseTotal = quantity * purchasePrice
  const totalPrice = quantity * unitPrice
  const profit = totalPrice - purchaseTotal

  const newItem = {
    id: Date.now().toString(),
    partNumber: item.partNumber,
    partName: item.partName,
    specification: item.specification || '',
    unit: item.unit || '个',
    quantity: quantity,
    unitPrice: unitPrice,
    totalPrice: totalPrice,                     // 销售金额
    purchasePrice: purchasePrice,               // 采购单价（成本）
    purchaseTotal: purchaseTotal,               // 采购金额（成本）
    profit: profit,                             // 利润
    profitRate: purchaseTotal > 0 ? (profit / purchaseTotal) * 100 : 0,  // 利润率（基于成本）
    remark: item.remark || ''
  }

  quotation.items.push(newItem)
  calculateAmounts(quotation)
  quotation.updatedAt = new Date().toISOString()

  return newItem
}

// 更新配件明细项
function updateItem(quotationId, itemId, data) {
  const quotation = state.quotations.find(q => q.id === quotationId)
  if (!quotation) return null

  const item = quotation.items.find(i => i.id === itemId)
  if (!item) return null

  Object.assign(item, data)

  // 更新销售金额
  item.totalPrice = item.quantity * item.unitPrice

  // 更新采购金额（成本）
  item.purchaseTotal = item.quantity * (item.purchasePrice || 0)

  // 更新利润
  item.profit = item.totalPrice - item.purchaseTotal

  // 更新利润率（基于成本）
  item.profitRate = item.purchaseTotal > 0 ? (item.profit / item.purchaseTotal) * 100 : 0

  calculateAmounts(quotation)
  quotation.updatedAt = new Date().toISOString()

  return item
}

// 删除配件明细项
function removeItem(quotationId, itemId) {
  const quotation = state.quotations.find(q => q.id === quotationId)
  if (!quotation) return null
  
  const index = quotation.items.findIndex(i => i.id === itemId)
  if (index === -1) return null
  
  quotation.items.splice(index, 1)
  calculateAmounts(quotation)
  quotation.updatedAt = new Date().toISOString()
  
  return true
}

// 批量导入配件明细
function importItems(quotationId, items) {
  const quotation = state.quotations.find(q => q.id === quotationId)
  if (!quotation) return null
  
  items.forEach(item => {
    addItem(quotationId, item)
  })
  
  return quotation.items
}

// 设置当前操作的报价单
function setCurrentQuotation(quotation) {
  state.currentQuotation = quotation
}

// 获取报价单列表（带筛选）
function getQuotations(filters = {}) {
  let result = [...state.quotations]
  
  if (filters.status) {
    result = result.filter(q => q.status === filters.status)
  }
  
  if (filters.customerName) {
    result = result.filter(q => 
      q.customerName.includes(filters.customerName)
    )
  }
  
  if (filters.quotationNo) {
    result = result.filter(q => 
      q.quotationNo.includes(filters.quotationNo)
    )
  }
  
  if (filters.dateRange && filters.dateRange.length === 2) {
    result = result.filter(q => {
      const createdAt = new Date(q.createdAt)
      return createdAt >= filters.dateRange[0] && createdAt <= filters.dateRange[1]
    })
  }
  
  return result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
}

// 根据工单ID获取配件销售报价单列表
function getQuotationsByWorkorder(workorderId) {
  return state.quotations
    .filter(q => q.workorderId === workorderId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
}

// 根据工单ID获取维修工单报价单列表
function getWorkorderQuotationsByWorkorder(workorderId) {
  return state.workorderQuotations
    .filter(q => q.workorderId === workorderId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
}

// 获取所有待审核的维修工单报价单（用于课长工作台）
function getPendingWorkorderQuotations() {
  return state.workorderQuotations
    .filter(q => q.status === QuotationStatus.PENDING || q.status === QuotationStatus.REVIEWING)
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
}

// 生成PDF（模拟）
function generatePDF(id, pdfUrl) {
  const quotation = state.quotations.find(q => q.id === id)
  if (!quotation) return null

  if (quotation.status !== QuotationStatus.APPROVED) {
    throw new Error('报价单未通过审核，无法生成PDF')
  }

  quotation.pdfUrl = pdfUrl || `/pdfs/quotation_${quotation.quotationNo}.pdf`
  quotation.updatedAt = new Date().toISOString()

  return quotation
}

// 上传客户回传PDF
function uploadCustomerPDF(id, uploadData) {
  const quotation = state.quotations.find(q => q.id === id)
  if (!quotation) return null

  // 如果是订单确认，更新状态为已确认
  if (uploadData.uploadType === 'order' && uploadData.confirmOrder) {
    quotation.status = QuotationStatus.CONFIRMED
    quotation.confirmedAt = new Date().toISOString()
  }

  // 保存客户回传记录
  quotation.customerReturnRecord = {
    uploadType: uploadData.uploadType,
    fileName: uploadData.fileName,
    fileUrl: uploadData.fileUrl,
    fileSize: uploadData.fileSize,
    remark: uploadData.remark,
    uploadedAt: uploadData.uploadedAt,
    uploadedBy: uploadData.uploadedBy || '当前用户'
  }

  quotation.customerPdfUrl = uploadData.fileUrl
  quotation.updatedAt = new Date().toISOString()

  return quotation
}

// 模拟数据初始化
function initMockData() {
  const mockQuotations = [
    {
      id: '1',
      quotationNo: 'QT20260331001',
      workorderId: 'WO004',
      workorderNo: 'WO20260331004',
      customerId: 'C001',
      customerName: '上海某机械有限公司',
      contactName: '张先生',
      contactPhone: '13800138000',
      items: [
        {
          id: 'item1',
          partNumber: 'P001',
          partName: '零件A',
          specification: '规格A-100',
          unit: '个',
          quantity: 10,
          purchasePrice: 100,
          unitPrice: 150,
          purchaseTotal: 1000,
          totalPrice: 1500,
          profit: 500,
          profitRate: 33.33,
          remark: '紧急需求'
        },
        {
          id: 'item2',
          partNumber: 'P002',
          partName: '零件B',
          specification: '规格B-200',
          unit: '个',
          quantity: 5,
          purchasePrice: 200,
          unitPrice: 280,
          purchaseTotal: 1000,
          totalPrice: 1400,
          profit: 400,
          profitRate: 28.57,
          remark: ''
        }
      ],
      subtotal: 2900,
      purchaseTotal: 2000,
      profitTotal: 900,
      profitRate: 31.03,
      taxRate: 0.13,
      taxAmount: 377,
      discount: 0,
      totalAmount: 3277,
      status: QuotationStatus.CONFIRMED,
      currentApprovalLevel: ApprovalLevel.SALES_SUPERVISOR,
      requiredApprovalLevel: ApprovalLevel.SALES_SUPERVISOR,
      version: 1,
      validDays: 30,
      validUntil: null,
      quoteDate: null,
      notes: '请尽快确认',
      terms: '付款方式：月结30天',
      pdfUrl: null,
      customerPdfUrl: null,
      createdBy: '赵业务助理',
      createdAt: '2026-03-31T10:00:00Z',
      updatedAt: '2026-03-31T10:00:00Z',
      // 客户签字确认信息
      customerSign: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjE1MCIgZmlsbD0iI2Y1ZjdmYSIvPgogIDx0ZXh0IHg9IjE1MCIgeT0iNzUiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIiBmb250LXNpemU9IjI0IiBmaWxsPSIjMzMzIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+5byg5LiJPC90ZXh0PgogIDx0ZXh0IHg9IjE1MCIgeT0iMTEwIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzY2NiIgdGV4dC1hbmNob3I9Im1pZGRsZSI+MjAyNi0wNC0wODwvdGV4dD4KPC9zdmc+',
      confirmTime: '2026-04-08T14:30:00Z',
      confirmedBy: '张先生'
    },
    // 已发送给客户待回签的报价单
    {
      id: 'QT20260407651',
      quotationNo: 'QT20260407651',
      workorderId: 'WO2024001',
      workorderNo: 'WO2024001',
      customerId: 'C002',
      customerName: '某某科技有限公司',
      contactName: '张经理',
      contactPhone: '13800138000',
      items: [
        {
          id: 'item_qt_1',
          partNumber: 'LP-28',
          partName: '激光切割头保护镜片',
          specification: 'LP-28mm',
          unit: '片',
          quantity: 2,
          purchasePrice: 180,
          unitPrice: 280,
          purchaseTotal: 360,
          totalPrice: 560,
          profit: 200,
          profitRate: 55.56,
          remark: ''
        },
        {
          id: 'item_qt_2',
          partNumber: 'FJ-508',
          partName: '聚焦镜片',
          specification: 'FJ-50.8mm',
          unit: '片',
          quantity: 1,
          purchasePrice: 300,
          unitPrice: 450,
          purchaseTotal: 300,
          totalPrice: 450,
          profit: 150,
          profitRate: 50.00,
          remark: ''
        },
        {
          id: 'item_qt_3',
          partNumber: 'TH-32',
          partName: '陶瓷环',
          specification: 'TH-32mm',
          unit: '个',
          quantity: 3,
          purchasePrice: 80,
          unitPrice: 120,
          purchaseTotal: 240,
          totalPrice: 360,
          profit: 120,
          profitRate: 50.00,
          remark: ''
        }
      ],
      subtotal: 1450,
      purchaseTotal: 900,
      profitTotal: 550,
      profitRate: 61.11,
      taxRate: 0.13,
      taxAmount: 188.50,
      discount: 0,
      laborCost: 300,
      otherCost: 0,
      totalAmount: 1750,
      status: QuotationStatus.SENT,
      currentApprovalLevel: ApprovalLevel.SALES_SUPERVISOR,
      requiredApprovalLevel: ApprovalLevel.SALES_SUPERVISOR,
      version: 1,
      validDays: 7,
      validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      quoteDate: new Date().toISOString(),
      notes: '以上报价含税费，配件质保3个月。',
      terms: '付款方式：预付50%，发货前付清',
      pdfUrl: '/pdfs/quotation_QT20260407651.pdf',
      customerPdfUrl: null,
      sendRecord: {
        toEmail: 'zhang@example.com',
        subject: '配件报价单 - QT20260407651',
        needSignature: true,
        signatureDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        sentAt: new Date().toISOString(),
        operator: '赵业务助理'
      },
      createdBy: '赵业务助理',
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
      sentAt: new Date().toISOString()
    },
    // 客户已确认的报价单（用于演示转订单功能）- 2026-04-24新增
    {
      id: 'QT20260424001',
      quotationNo: 'QT20260424001',
      workorderId: 'WO20260424001',
      workorderNo: 'WO20260424001',
      customerId: 'C004',
      customerName: '某某设备有限公司',
      contactName: '陈经理',
      contactPhone: '13812345678',
      items: [
        {
          id: 'item_demo_1',
          partNumber: 'ZB-150',
          partName: '主轴轴承',
          specification: 'ZB-150型高精度主轴轴承',
          unit: '套',
          quantity: 2,
          purchasePrice: 1500,
          unitPrice: 2200,
          purchaseTotal: 3000,
          totalPrice: 4400,
          profit: 1400,
          profitRate: 46.67,
          remark: '德国进口，精度等级P4'
        },
        {
          id: 'item_demo_2',
          partNumber: 'JD-80',
          partName: '电机驱动器',
          specification: 'JD-80型伺服驱动器',
          unit: '台',
          quantity: 1,
          purchasePrice: 3800,
          unitPrice: 5200,
          purchaseTotal: 3800,
          totalPrice: 5200,
          profit: 1400,
          profitRate: 36.84,
          remark: '配套使用，质保2年'
        },
        {
          id: 'item_demo_3',
          partNumber: 'DL-25',
          partName: '导轨滑块',
          specification: 'DL-25型直线导轨滑块',
          unit: '套',
          quantity: 4,
          purchasePrice: 280,
          unitPrice: 420,
          purchaseTotal: 1120,
          totalPrice: 1680,
          profit: 560,
          profitRate: 50.00,
          remark: '国产优质品牌'
        }
      ],
      subtotal: 11280,
      purchaseTotal: 7920,
      profitTotal: 3360,
      profitRate: 42.86,
      taxRate: 0.13,
      taxAmount: 1466.40,
      discount: 0,
      laborCost: 500,
      otherCost: 200,
      totalAmount: 12946.40,
      status: QuotationStatus.CONFIRMED,
      currentApprovalLevel: ApprovalLevel.GENERAL_MANAGER,
      requiredApprovalLevel: ApprovalLevel.GENERAL_MANAGER,
      version: 1,
      validDays: 30,
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      quoteDate: new Date(Date.now() - 3 * 86400000).toISOString(),
      notes: '以上报价含税费，设备配件质保12个月。',
      terms: '付款方式：预付30%，安装调试完成后付清',
      pdfUrl: null,
      customerPdfUrl: null,
      createdBy: '赵业务助理',
      createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
      submittedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
      approvedAt: new Date(Date.now() - 4 * 86400000).toISOString(),
      approvedBy: '课长',
      approvalComments: '配件质量可靠，价格合理',
      sentAt: new Date(Date.now() - 4 * 86400000).toISOString(),
      confirmedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
      confirmedBy: '陈经理',
      customerSign: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48dGV4dCB4PSIxMCIgeT0iNTAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIzNiIgZmlsbD0iIzMzMyI+6aqM5L2g55qE5Zyw5a6ePC90ZXh0Pjwvc3ZnPg=='
    }
  ]

  state.quotations = mockQuotations
}

// 添加待审核报价单（用于演示审核流程）
function initPendingQuotationsForDemo() {
  // 检查是否已有待审核的报价单
  const hasPending = state.quotations.some(q => 
    q.status === QuotationStatus.PENDING || q.status === QuotationStatus.REVIEWING
  )
  
  if (!hasPending) {
    // 添加一个待审核的报价单
    const pendingQuotation = {
      id: 'QT_PENDING_001',
      quotationNo: 'QT20260415001',
      workorderId: 'WO2024005',
      workorderNo: 'WO2024005',
      customerId: 'C003',
      customerName: '某某制造厂',
      contactName: '王主任',
      contactPhone: '13900139000',
      items: [
        {
          id: 'item_pending_1',
          partNumber: 'HG-100',
          partName: '激光切割头',
          specification: 'HG-100W',
          unit: '个',
          quantity: 1,
          purchasePrice: 3500,
          unitPrice: 4800,
          purchaseTotal: 3500,
          totalPrice: 4800,
          profit: 1300,
          profitRate: 37.14,
          remark: '原厂配件'
        },
        {
          id: 'item_pending_2',
          partNumber: 'LJ-50',
          partName: '激光镜片套装',
          specification: 'LJ-50mm套装',
          unit: '套',
          quantity: 2,
          purchasePrice: 800,
          unitPrice: 1200,
          purchaseTotal: 1600,
          totalPrice: 2400,
          purchaseTotal: 1600,
          profit: 800,
          profitRate: 50.00,
          remark: ''
        }
      ],
      subtotal: 7200,
      purchaseTotal: 5100,
      profitTotal: 2100,
      profitRate: 41.18,
      taxRate: 0.13,
      taxAmount: 936,
      discount: 0,
      laborCost: 500,
      otherCost: 0,
      totalAmount: 7700,
      status: QuotationStatus.PENDING, // 待审核状态
      currentApprovalLevel: ApprovalLevel.NONE,
      requiredApprovalLevel: ApprovalLevel.SALES_SUPERVISOR,
      version: 1,
      validDays: 30,
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      quoteDate: new Date().toISOString(),
      notes: '以上报价含税费，配件质保6个月。',
      terms: '付款方式：预付30%，发货前付清',
      pdfUrl: null,
      customerPdfUrl: null,
      createdBy: '赵业务助理',
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
      submittedAt: new Date().toISOString() // 提交审核时间
    }
    
    state.quotations.unshift(pendingQuotation)
    saveQuotationsToStorage()
    console.log('已添加待审核报价单供演示:', pendingQuotation.quotationNo)
  }
}

// 从 localStorage 加载已有数据（如果有）
loadQuotationsFromStorage()

// 如果没有数据，初始化模拟数据
if (state.quotations.length === 0) {
  initMockData()
  initPendingQuotationsForDemo()
}

// 为配件销售工单创建关联的报价单（用于演示）
function initPartsWorkorderQuotationsForDemo() {
  // 检查是否已有与配件销售工单关联的报价单
  const existingIndex1 = state.quotations.findIndex(q => q.workorderId === 'wo_005')
  const existingIndex2 = state.quotations.findIndex(q => q.workorderId === 'wo_006')
  
  // 移除已存在的报价单（强制重新创建，确保数据完整）
  if (existingIndex1 > -1) {
    state.quotations.splice(existingIndex1, 1)
    console.log('移除已存在的wo_005报价单，准备重新创建')
  }
  if (existingIndex2 > -1) {
    state.quotations.splice(existingIndex2, 1)
    console.log('移除已存在的wo_006报价单，准备重新创建')
  }
  
  const hasPartsQuotation1 = state.quotations.some(q => q.workorderId === 'wo_005')
  const hasPartsQuotation2 = state.quotations.some(q => q.workorderId === 'wo_006')
  
  if (!hasPartsQuotation1) {
    // 为工单WO20260410005创建已确认的报价单
    const quotation1 = {
      id: 'QT_005_001',
      quotationNo: 'QT20260410001',
      workorderId: 'wo_005',
      workorderNo: 'WO20260410005',
      customerId: 'C002',
      customerName: '某某制造厂',
      contactName: '王主任',
      contactPhone: '13900139000',
      items: [
        {
          id: 'item_005_1',
          partNumber: 'YY-200',
          partName: '液压泵总成',
          specification: 'YY-200型高压液压泵',
          unit: '个',
          quantity: 1,
          purchasePrice: 2800,
          unitPrice: 3800,
          purchaseTotal: 2800,
          totalPrice: 3800,
          profit: 1000,
          profitRate: 35.71,
          remark: '原厂配件，质保1年'
        },
        {
          id: 'item_005_2',
          partName: '密封件套装',
          specification: '标准密封件套装',
          unit: '套',
          quantity: 2,
          purchasePrice: 350,
          unitPrice: 550,
          purchaseTotal: 700,
          totalPrice: 1100,
          profit: 400,
          profitRate: 57.14,
          remark: '进口密封件'
        }
      ],
      subtotal: 4900,
      purchaseTotal: 3500,
      profitTotal: 1400,
      profitRate: 40.00,
      taxRate: 0.13,
      taxAmount: 637,
      discount: 0,
      laborCost: 800,
      otherCost: 200,
      totalAmount: 5900,
      status: QuotationStatus.CONFIRMED, // 已确认状态
      currentApprovalLevel: ApprovalLevel.GENERAL_MANAGER,
      requiredApprovalLevel: ApprovalLevel.GENERAL_MANAGER,
      version: 1,
      validDays: 30,
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      quoteDate: new Date(Date.now() - 4 * 86400000).toISOString(),
      notes: '以上报价含税费，配件质保12个月。液压系统维修后提供3个月质保。',
      terms: '付款方式：预付50%，安装调试完成后付清',
      pdfUrl: null,
      customerPdfUrl: null,
      createdBy: '赵业务助理',
      createdAt: new Date(Date.now() - 4 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
      submittedAt: new Date(Date.now() - 4 * 86400000).toISOString(),
      approvedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
      approvedBy: '课长',
      approvalComments: '报价合理，同意通过',
      sentAt: new Date(Date.now() - 3 * 86400000).toISOString(),
      confirmedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
      confirmedBy: '王主任',
      customerSign: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48dGV4dCB4PSIxMCIgeT0iNTAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIzNiIgZmlsbD0iIzMzMyI+546L5L2g55qE5Zyw5a6ePC90ZXh0Pjwvc3ZnPg=='
    }
    
    state.quotations.unshift(quotation1)
    console.log('已为配件销售工单WO20260410005创建报价单:', quotation1.quotationNo)
  }
  
  if (!hasPartsQuotation2) {
    // 为工单WO20260401006创建已完成的报价单
    const quotation2 = {
      id: 'QT_006_001',
      quotationNo: 'QT20260401001',
      workorderId: 'wo_006',
      workorderNo: 'WO20260401006',
      customerId: 'C003',
      customerName: '上海某机械有限公司',
      contactName: '李先生',
      contactPhone: '13700137000',
      items: [
        {
          id: 'item_006_1',
          partNumber: 'DY-1000W',
          partName: '激光器电源模块',
          specification: 'DY-1000W型电源模块',
          unit: '个',
          quantity: 1,
          purchasePrice: 2200,
          unitPrice: 3200,
          purchaseTotal: 2200,
          totalPrice: 3200,
          profit: 1000,
          profitRate: 45.45,
          remark: '原装正品，质保2年'
        }
      ],
      subtotal: 3200,
      purchaseTotal: 2200,
      profitTotal: 1000,
      profitRate: 45.45,
      taxRate: 0.13,
      taxAmount: 416,
      discount: 0,
      laborCost: 0,
      otherCost: 100,
      totalAmount: 3300,
      status: QuotationStatus.CONFIRMED,
      currentApprovalLevel: ApprovalLevel.GENERAL_MANAGER,
      requiredApprovalLevel: ApprovalLevel.GENERAL_MANAGER,
      version: 1,
      validDays: 30,
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      quoteDate: new Date(Date.now() - 14 * 86400000).toISOString(),
      notes: '以上报价含税费，电源模块质保24个月。',
      terms: '付款方式：全款预付',
      pdfUrl: null,
      customerPdfUrl: null,
      createdBy: '钱业务助理',
      createdAt: new Date(Date.now() - 14 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 10 * 86400000).toISOString(),
      submittedAt: new Date(Date.now() - 14 * 86400000).toISOString(),
      approvedAt: new Date(Date.now() - 13 * 86400000).toISOString(),
      approvedBy: '课长',
      approvalComments: '价格合适，通过',
      sentAt: new Date(Date.now() - 13 * 86400000).toISOString(),
      confirmedAt: new Date(Date.now() - 12 * 86400000).toISOString(),
      confirmedBy: '李先生',
      customerSign: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48dGV4dCB4PSIxMCIgeT0iNTAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIzNiIgZmlsbD0iIzMzMyI+5p2O5L2g55qE5Zyw5a6ePC90ZXh0Pjwvc3ZnPg=='
    }
    
    state.quotations.unshift(quotation2)
    console.log('已为配件销售工单WO20260401006创建报价单:', quotation2.quotationNo)
  }
  
  if (!hasPartsQuotation1 || !hasPartsQuotation2) {
    saveQuotationsToStorage()
  }
}

// 执行初始化
console.log('执行 initPartsWorkorderQuotationsForDemo 前，state.quotations 数量:', state.quotations.length)
initPartsWorkorderQuotationsForDemo()
console.log('执行 initPartsWorkorderQuotationsForDemo 后，state.quotations 数量:', state.quotations.length)
console.log('wo_006 报价单:', state.quotations.find(q => q.workorderId === 'wo_006'))

// 保存报价单到存储
function saveQuotations() {
  saveQuotationsToStorage()
}

export {
  // 状态
  state,
  quotationList,
  workorderQuotationList,
  currentQuotation,
  pendingApprovalCount,
  workorderPendingApprovalCount,
  totalPendingApprovalCount,

  // 配件销售报价单
  createQuotation,
  updateQuotation,
  submitForApproval,
  approveQuotation,
  sendQuotation,
  confirmQuotation,
  createNewVersion,
  addItem,
  updateItem,
  removeItem,
  importItems,

  // 维修工单报价单
  createWorkorderQuotation,
  submitWorkorderQuotationForApproval,
  approveWorkorderQuotation,
  sendWorkorderQuotation,
  confirmWorkorderQuotation,
  getWorkorderQuotationsByWorkorder,
  getPendingWorkorderQuotations,

  // 通用方法
  getApprovalRecords,
  setCurrentQuotation,
  getQuotations,
  getQuotationsByWorkorder,
  getQuotationVersions,
  convertToWorkorderData,
  generatePDF,
  uploadCustomerPDF,
  calculateAmounts,
  getRequiredApprovalLevel,
  saveQuotations,
  saveQuotationsToStorage,

  // 枚举
  QuotationStatus,
  QuotationType,
  ApprovalLevel,
  approvalLevelConfig
}
