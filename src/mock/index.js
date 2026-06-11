import Mock from 'mockjs'

// 配置Mock.js
Mock.setup({
  timeout: '200-600' // 模拟网络延迟
})

// 基础响应格式
const createResponse = (data, code = 200, message = '成功') => {
  return {
    code,
    message,
    data
  }
}

// ========== 客户管理Mock ==========

// 客户列表
const customerList = Mock.mock({
  'list|20-50': [{
    'id|+1': 1,
    'name': '@cname',
    'companyName': '@ctitle(5, 10)有限公司',
    'phone': /^1[3-9]\d{9}$/,
    'email': '@email',
    'address': '@county(true)',
    'level|1': ['VIP', '普通', '潜在'],
    'status|1': ['active', 'inactive'],
    'creditCode': /[A-Z0-9]{18}/,
    'legalPerson': '@cname',
    'contact': '@cname',
    'createTime': '@datetime',
    'updateTime': '@datetime',
    'contacts|1-3': [{
      'id|+1': 100,
      'name': '@cname',
      'phone': /^1[3-9]\d{9}$/,
      'email': '@email',
      'position': '@ctitle(2, 4)',
      'approvalStatus|1': ['已通过', '待审核', '已拒绝'],
      'registerTime': '@datetime'
    }],
    'assets|1-5': [{
      'serialNumber': /SN[0-9]{6}/,
      'model': 'Model @string("upper", 1)',
      'status|1': ['运行中', '停机', '维修中'],
      'installDate': '@date',
      'warrantyEndDate': '@date'
    }],
    'workorders|0-3': [{
      'id': /WO[0-9]{6}/,
      'type|1': ['维修', '保养', '安装', '巡检'],
      'status|1': ['待处理', '处理中', '已完成'],
      'createTime': '@datetime',
      'finishTime': '@datetime'
    }]
  }]
}).list

// 客户列表接口
Mock.mock(/\/api\/customers(\?.*)?$/, 'get', (options) => {
  const url = new URL(options.url, 'http://localhost')
  const page = parseInt(url.searchParams.get('page')) || 1
  const pageSize = parseInt(url.searchParams.get('pageSize')) || 10
  const keyword = url.searchParams.get('keyword')
  
  let list = [...customerList]
  
  // 搜索过滤
  if (keyword) {
    list = list.filter(item => 
      item.name.includes(keyword) || 
      item.companyName.includes(keyword) ||
      item.phone.includes(keyword)
    )
  }
  
  const total = list.length
  const start = (page - 1) * pageSize
  const end = start + pageSize
  
  return createResponse({
    list: list.slice(start, end),
    total,
    page,
    pageSize
  })
})

// 客户详情接口
Mock.mock(/\/api\/customers\/\d+$/, 'get', (options) => {
  const id = parseInt(options.url.match(/\/(\d+)$/)[1])
  const customer = customerList.find(item => item.id === id) || customerList[0]
  return createResponse(customer)
})

// 创建客户
Mock.mock('/api/customers', 'post', (options) => {
  const data = JSON.parse(options.body)
  const newCustomer = {
    id: customerList.length + 1,
    ...data,
    createTime: new Date().toISOString(),
    updateTime: new Date().toISOString()
  }
  customerList.unshift(newCustomer)
  return createResponse(newCustomer)
})

// 更新客户
Mock.mock(/\/api\/customers\/\d+$/, 'put', (options) => {
  const id = parseInt(options.url.match(/\/(\d+)$/)[1])
  const data = JSON.parse(options.body)
  const index = customerList.findIndex(item => item.id === id)
  if (index !== -1) {
    customerList[index] = { ...customerList[index], ...data, updateTime: new Date().toISOString() }
    return createResponse(customerList[index])
  }
  return createResponse(null, 404, '客户不存在')
})

// 删除客户
Mock.mock(/\/api\/customers\/\d+$/, 'delete', (options) => {
  const id = parseInt(options.url.match(/\/(\d+)$/)[1])
  const index = customerList.findIndex(item => item.id === id)
  if (index !== -1) {
    customerList.splice(index, 1)
    return createResponse(null)
  }
  return createResponse(null, 404, '客户不存在')
})

// 客户统计
Mock.mock('/api/customers/statistics', 'get', () => {
  return createResponse({
    total: customerList.length,
    active: customerList.filter(c => c.status === 'active').length,
    inactive: customerList.filter(c => c.status === 'inactive').length,
    newThisMonth: Mock.Random.integer(5, 20)
  })
})

// ========== 设备管理Mock ==========

const assetList = Mock.mock({
  'list|30-60': [{
    'id|+1': 1,
    'serialNumber': /SN[0-9]{8}/,
    'model': 'Model @string("upper", 2)-@integer(100, 999)',
    'name': '@ctitle(3, 6)设备',
    'customerId|1-50': 1,
    'customerName': '@ctitle(5, 10)有限公司',
    'status|1': ['运行中', '停机', '维修中', '报废'],
    'type|1': ['激光切割机', '数控机床', '注塑机', '冲压机'],
    'manufactureDate': '@date',
    'salesDate': '@date',
    'installDate': '@date',
    'warrantyEndDate': '@date',
    'isEL|1': true,
    'installAddress': '@county(true)',
    'createTime': '@datetime',
    'maintenanceHistory|0-5': [{
      'date': '@date',
      'type|1': ['日常保养', '故障维修', '定期巡检'],
      'content': '@csentence(10, 30)',
      'engineer': '@cname',
      'result|1': ['正常', '需跟进', '已完成']
    }]
  }]
}).list

Mock.mock(/\/api\/assets(\?.*)?$/, 'get', (options) => {
  const url = new URL(options.url, 'http://localhost')
  const page = parseInt(url.searchParams.get('page')) || 1
  const pageSize = parseInt(url.searchParams.get('pageSize')) || 10
  
  const total = assetList.length
  const start = (page - 1) * pageSize
  const end = start + pageSize
  
  return createResponse({
    list: assetList.slice(start, end),
    total,
    page,
    pageSize
  })
})

Mock.mock(/\/api\/assets\/\d+$/, 'get', (options) => {
  const id = parseInt(options.url.match(/\/(\d+)$/)[1])
  const asset = assetList.find(item => item.id === id) || assetList[0]
  return createResponse(asset)
})

// ========== 工单管理Mock ==========

const workorderList = Mock.mock({
  'list|50-100': [{
    'id': /WO[0-9]{8}/,
    'type|1': ['维修', '保养', '安装', '巡检', '配件更换'],
    'status|1': ['待处理', '已接单', '处理中', '待确认', '已完成', '已取消'],
    'priority|1': ['紧急', '高', '中', '低'],
    'customerId|1-50': 1,
    'customerName': '@ctitle(5, 10)有限公司',
    'customerContact': '@cname',
    'customerPhone': /^1[3-9]\d{9}$/,
    'deviceId|1-60': 1,
    'deviceModel': 'Model @string("upper", 2)-@integer(100, 999)',
    'deviceSerialNumber': /SN[0-9]{8}/,
    'problemDescription': '@csentence(20, 50)',
    'solution': '@csentence(20, 50)',
    'engineerId|1-20': 1,
    'engineerName': '@cname',
    'engineerPhone': /^1[3-9]\d{9}$/,
    'createTime': '@datetime',
    'acceptTime': '@datetime',
    'startTime': '@datetime',
    'completeTime': '@datetime',
    'expectTime': '@datetime',
    'actualTime': '@datetime',
    'parts|0-3': [{
      'name': '@ctitle(3, 6)配件',
      'model': 'P-@integer(100, 999)',
      'quantity|1-5': 1,
      'unit|1': ['个', '套', '件']
    }],
    'records|1-5': [{
      'time': '@datetime',
      'action|1': ['创建工单', '接单', '开始处理', '完成处理', '客户签字'],
      'operator': '@cname',
      'remark': '@csentence(10, 30)'
    }]
  }]
}).list

Mock.mock(/\/api\/workorders(\?.*)?$/, 'get', (options) => {
  const url = new URL(options.url, 'http://localhost')
  const page = parseInt(url.searchParams.get('page')) || 1
  const pageSize = parseInt(url.searchParams.get('pageSize')) || 10
  const status = url.searchParams.get('status')
  
  let list = [...workorderList]
  if (status) {
    list = list.filter(item => item.status === status)
  }
  
  const total = list.length
  const start = (page - 1) * pageSize
  const end = start + pageSize
  
  return createResponse({
    list: list.slice(start, end),
    total,
    page,
    pageSize
  })
})

Mock.mock(/\/api\/workorders\/WO\d+$/, 'get', (options) => {
  const id = options.url.match(/WO\d+$/)[0]
  const workorder = workorderList.find(item => item.id === id) || workorderList[0]
  return createResponse(workorder)
})

// 接单
Mock.mock(/\/api\/workorders\/WO\d+\/accept$/, 'post', () => {
  return createResponse({ success: true })
})

// 完成工单
Mock.mock(/\/api\/workorders\/WO\d+\/complete$/, 'post', () => {
  return createResponse({ success: true })
})

// ========== 员工管理Mock ==========

const employeeList = Mock.mock({
  'list|20-40': [{
    'id|+1': 1,
    'name': '@cname',
    'username': '@string("lower", 6)',
    'phone': /^1[3-9]\d{9}$/,
    'email': '@email',
    'department|1': ['技术部', '销售部', '客服部', '维修部', '管理部'],
    'role|1': ['工程师', '课长', '业务助理', '客服', '经理', '管理员'],
    'status|1': ['在职', '离职', '休假'],
    'joinDate': '@date',
    'createTime': '@datetime'
  }]
}).list

Mock.mock(/\/api\/employees(\?.*)?$/, 'get', (options) => {
  const url = new URL(options.url, 'http://localhost')
  const page = parseInt(url.searchParams.get('page')) || 1
  const pageSize = parseInt(url.searchParams.get('pageSize')) || 10
  
  const total = employeeList.length
  const start = (page - 1) * pageSize
  const end = start + pageSize
  
  return createResponse({
    list: employeeList.slice(start, end),
    total,
    page,
    pageSize
  })
})

// 登录
Mock.mock('/api/employees/login', 'post', (options) => {
  const { username, password } = JSON.parse(options.body)
  return createResponse({
    token: 'mock_token_' + Date.now(),
    user: employeeList[0]
  })
})

// ========== 配件管理Mock ==========

const partsList = Mock.mock({
  'list|40-80': [{
    'id|+1': 1,
    'code': /P[0-9]{6}/,
    'name': '@ctitle(3, 6)配件',
    'model': 'PM-@integer(100, 999)',
    'category|1': ['机械部件', '电气部件', '液压部件', '气动部件', '易损件'],
    'specification': '@csentence(5, 15)',
    'unit|1': ['个', '套', '件', '米', '千克'],
    'stock|0-100': 1,
    'minStock|5-20': 1,
    'maxStock|50-200': 1,
    'price|10-1000.2': 1,
    'supplier': '@ctitle(5, 10)供应商',
    'status|1': ['充足', '紧张', '缺货'],
    'location': '仓库@integer(1, 5)-@integer(1, 20)',
    'createTime': '@datetime'
  }]
}).list

Mock.mock(/\/api\/parts(\?.*)?$/, 'get', (options) => {
  const url = new URL(options.url, 'http://localhost')
  const page = parseInt(url.searchParams.get('page')) || 1
  const pageSize = parseInt(url.searchParams.get('pageSize')) || 10
  
  const total = partsList.length
  const start = (page - 1) * pageSize
  const end = start + pageSize
  
  return createResponse({
    list: partsList.slice(start, end),
    total,
    page,
    pageSize
  })
})

// ========== 报价管理Mock ==========

const quotationList = Mock.mock({
  'list|30-60': [{
    'id': /QT[0-9]{8}/,
    'customerId|1-50': 1,
    'customerName': '@ctitle(5, 10)有限公司',
    'contact': '@cname',
    'phone': /^1[3-9]\d{9}$/,
    'status|1': ['草稿', '待审核', '已审核', '已发送', '客户已确认', '客户已拒绝', '已过期'],
    'totalAmount|1000-50000.2': 1,
    'validDays|7-30': 1,
    'createTime': '@datetime',
    'expireTime': '@datetime',
    'items|1-5': [{
      'name': '@ctitle(3, 6)服务',
      'specification': '@csentence(5, 10)',
      'quantity|1-10': 1,
      'unit|1': ['次', '台', '套'],
      'unitPrice|100-5000.2': 1,
      'amount': function() {
        return this.quantity * this.unitPrice
      }
    }]
  }]
}).list

Mock.mock(/\/api\/quotations(\?.*)?$/, 'get', (options) => {
  const url = new URL(options.url, 'http://localhost')
  const page = parseInt(url.searchParams.get('page')) || 1
  const pageSize = parseInt(url.searchParams.get('pageSize')) || 10
  
  const total = quotationList.length
  const start = (page - 1) * pageSize
  const end = start + pageSize
  
  return createResponse({
    list: quotationList.slice(start, end),
    total,
    page,
    pageSize
  })
})

Mock.mock(/\/api\/quotations\/QT\d+$/, 'get', (options) => {
  const id = options.url.match(/QT\d+$/)[0]
  const quotation = quotationList.find(item => item.id === id) || quotationList[0]
  return createResponse(quotation)
})

// 生成PDF
Mock.mock(/\/api\/quotations\/QT\d+\/pdf$/, 'get', () => {
  // 返回模拟的PDF Blob
  return createResponse(new Blob(['PDF content'], { type: 'application/pdf' }))
})

// ========== 工作流配置Mock ==========

// 流程模板列表
const workflowTemplates = Mock.mock({
  'list|5-10': [{
    'id|+1': 1,
    'code': /WF[0-9]{4}/,
    'name': '@ctitle(4, 8)流程',
    'version|0-5': 1,
    'type|1': ['维修', '保养', '安装', '巡检', '配件销售'],
    'scene|1': ['标准', '加急', 'VIP', null],
    'isDefault|1': false,
    'status|1': ['已启用', '已停用'],
    'nodes|2-6': [{
      'id': '@string("lower", 8)',
      'name': '@ctitle(2, 4)',
      'type|1': ['start', 'task', 'approval', 'end'],
      'assignee|1': ['工程师', '课长', '客服', '系统自动'],
      'duration|1-24': 1
    }],
    'createTime': '@datetime',
    'updateTime': '@datetime'
  }]
}).list

// 表单字段配置
const formFields = Mock.mock({
  'list|10-20': [{
    'id|+1': 1,
    'fieldName': '@string("lower", 6)',
    'label': '@ctitle(2, 4)',
    'fieldType|1': ['text', 'number', 'date', 'select', 'textarea', 'checkbox', 'radio'],
    'category|1': ['基本信息', '设备信息', '服务信息', '配件信息'],
    'isRequired|1': true,
    'isVisible|1': true,
    'isEditable|1': true,
    'sortOrder|1-100': 1,
    'defaultValue': '@ctitle(2, 5)',
    'placeholder': '@csentence(5, 10)',
    'options|0-5': ['@ctitle(2)', '@ctitle(2)', '@ctitle(2)'],
    'createTime': '@datetime'
  }]
}).list

// 字段模板
const fieldTemplates = Mock.mock({
  'list|3-8': [{
    'id|+1': 1,
    'name': '@ctitle(4, 8)模板',
    'description': '@csentence(10, 30)',
    'fieldCount|5-15': 1,
    'status|1': ['草稿', '已发布', '已归档'],
    'createTime': '@datetime',
    'updateTime': '@datetime'
  }]
}).list

// 流程模板接口
Mock.mock(/\/api\/workflow\/templates(\?.*)?$/, 'get', (options) => {
  const url = new URL(options.url, 'http://localhost')
  const page = parseInt(url.searchParams.get('page')) || 1
  const pageSize = parseInt(url.searchParams.get('pageSize')) || 10
  
  const total = workflowTemplates.length
  const start = (page - 1) * pageSize
  const end = start + pageSize
  
  return createResponse({
    list: workflowTemplates.slice(start, end),
    total,
    page,
    pageSize
  })
})

Mock.mock(/\/api\/workflow\/templates\/\d+$/, 'get', (options) => {
  const id = parseInt(options.url.match(/\/(\d+)$/)[1])
  const template = workflowTemplates.find(item => item.id === id) || workflowTemplates[0]
  return createResponse(template)
})

Mock.mock(/\/api\/workflow\/templates\/\d+$/, 'put', (options) => {
  const id = parseInt(options.url.match(/\/(\d+)$/)[1])
  const data = JSON.parse(options.body)
  const index = workflowTemplates.findIndex(item => item.id === id)
  if (index !== -1) {
    workflowTemplates[index] = { ...workflowTemplates[index], ...data, updateTime: new Date().toISOString() }
    return createResponse(workflowTemplates[index])
  }
  return createResponse(null, 404, '模板不存在')
})

Mock.mock(/\/api\/workflow\/templates\/\d+$/, 'delete', (options) => {
  const id = parseInt(options.url.match(/\/(\d+)$/)[1])
  const index = workflowTemplates.findIndex(item => item.id === id)
  if (index !== -1) {
    workflowTemplates.splice(index, 1)
    return createResponse(null)
  }
  return createResponse(null, 404, '模板不存在')
})

Mock.mock('/api/workflow/templates', 'post', (options) => {
  const data = JSON.parse(options.body)
  const newTemplate = {
    id: workflowTemplates.length + 1,
    ...data,
    createTime: new Date().toISOString(),
    updateTime: new Date().toISOString()
  }
  workflowTemplates.unshift(newTemplate)
  return createResponse(newTemplate)
})

Mock.mock(/\/api\/workflow\/templates\/\d+\/set-default$/, 'post', (options) => {
  const id = parseInt(options.url.match(/\/(\d+)\/set-default$/)[1])
  workflowTemplates.forEach(t => t.isDefault = false)
  const index = workflowTemplates.findIndex(item => item.id === id)
  if (index !== -1) {
    workflowTemplates[index].isDefault = true
    return createResponse(workflowTemplates[index])
  }
  return createResponse(null, 404, '模板不存在')
})

Mock.mock(/\/api\/workflow\/templates\/\d+\/nodes$/, 'put', (options) => {
  const id = parseInt(options.url.match(/\/(\d+)\/nodes$/)[1])
  const data = JSON.parse(options.body)
  const index = workflowTemplates.findIndex(item => item.id === id)
  if (index !== -1) {
    workflowTemplates[index].nodes = data.nodes
    workflowTemplates[index].updateTime = new Date().toISOString()
    return createResponse(workflowTemplates[index])
  }
  return createResponse(null, 404, '模板不存在')
})

// 表单字段接口
Mock.mock(/\/api\/workflow\/form-fields(\?.*)?$/, 'get', (options) => {
  const url = new URL(options.url, 'http://localhost')
  const page = parseInt(url.searchParams.get('page')) || 1
  const pageSize = parseInt(url.searchParams.get('pageSize')) || 10
  
  const total = formFields.length
  const start = (page - 1) * pageSize
  const end = start + pageSize
  
  return createResponse({
    list: formFields.slice(start, end),
    total,
    page,
    pageSize
  })
})

Mock.mock(/\/api\/workflow\/form-fields\/\d+$/, 'get', (options) => {
  const id = parseInt(options.url.match(/\/(\d+)$/)[1])
  const field = formFields.find(item => item.id === id) || formFields[0]
  return createResponse(field)
})

Mock.mock('/api/workflow/form-fields', 'post', (options) => {
  const data = JSON.parse(options.body)
  const newField = {
    id: formFields.length + 1,
    ...data,
    createTime: new Date().toISOString()
  }
  formFields.unshift(newField)
  return createResponse(newField)
})

Mock.mock(/\/api\/workflow\/form-fields\/\d+$/, 'put', (options) => {
  const id = parseInt(options.url.match(/\/(\d+)$/)[1])
  const data = JSON.parse(options.body)
  const index = formFields.findIndex(item => item.id === id)
  if (index !== -1) {
    formFields[index] = { ...formFields[index], ...data }
    return createResponse(formFields[index])
  }
  return createResponse(null, 404, '字段不存在')
})

Mock.mock(/\/api\/workflow\/form-fields\/\d+$/, 'delete', (options) => {
  const id = parseInt(options.url.match(/\/(\d+)$/)[1])
  const index = formFields.findIndex(item => item.id === id)
  if (index !== -1) {
    formFields.splice(index, 1)
    return createResponse(null)
  }
  return createResponse(null, 404, '字段不存在')
})

// 字段分组接口
Mock.mock('/api/workflow/field-groups', 'get', () => {
  return createResponse([
    { id: 1, name: '基本信息', sortOrder: 1 },
    { id: 2, name: '设备信息', sortOrder: 2 },
    { id: 3, name: '服务信息', sortOrder: 3 },
    { id: 4, name: '配件信息', sortOrder: 4 }
  ])
})

Mock.mock('/api/workflow/field-groups', 'post', (options) => {
  const data = JSON.parse(options.body)
  return createResponse({ id: Date.now(), ...data })
})

Mock.mock(/\/api\/workflow\/field-groups\/\d+$/, 'delete', () => {
  return createResponse(null)
})

// 字段模板接口
Mock.mock(/\/api\/workflow\/field-templates(\?.*)?$/, 'get', (options) => {
  const url = new URL(options.url, 'http://localhost')
  const page = parseInt(url.searchParams.get('page')) || 1
  const pageSize = parseInt(url.searchParams.get('pageSize')) || 10
  
  const total = fieldTemplates.length
  const start = (page - 1) * pageSize
  const end = start + pageSize
  
  return createResponse({
    list: fieldTemplates.slice(start, end),
    total,
    page,
    pageSize
  })
})

Mock.mock(/\/api\/workflow\/field-templates\/\d+$/, 'get', (options) => {
  const id = parseInt(options.url.match(/\/(\d+)$/)[1])
  const template = fieldTemplates.find(item => item.id === id) || fieldTemplates[0]
  return createResponse(template)
})

Mock.mock('/api/workflow/field-templates', 'post', (options) => {
  const data = JSON.parse(options.body)
  const newTemplate = {
    id: fieldTemplates.length + 1,
    ...data,
    createTime: new Date().toISOString(),
    updateTime: new Date().toISOString()
  }
  fieldTemplates.unshift(newTemplate)
  return createResponse(newTemplate)
})

Mock.mock(/\/api\/workflow\/field-templates\/\d+$/, 'put', (options) => {
  const id = parseInt(options.url.match(/\/(\d+)$/)[1])
  const data = JSON.parse(options.body)
  const index = fieldTemplates.findIndex(item => item.id === id)
  if (index !== -1) {
    fieldTemplates[index] = { ...fieldTemplates[index], ...data, updateTime: new Date().toISOString() }
    return createResponse(fieldTemplates[index])
  }
  return createResponse(null, 404, '模板不存在')
})

Mock.mock(/\/api\/workflow\/field-templates\/\d+$/, 'delete', (options) => {
  const id = parseInt(options.url.match(/\/(\d+)$/)[1])
  const index = fieldTemplates.findIndex(item => item.id === id)
  if (index !== -1) {
    fieldTemplates.splice(index, 1)
    return createResponse(null)
  }
  return createResponse(null, 404, '模板不存在')
})

Mock.mock(/\/api\/workflow\/field-templates\/\d+\/publish$/, 'post', (options) => {
  const id = parseInt(options.url.match(/\/(\d+)\/publish$/)[1])
  const index = fieldTemplates.findIndex(item => item.id === id)
  if (index !== -1) {
    fieldTemplates[index].status = '已发布'
    fieldTemplates[index].updateTime = new Date().toISOString()
    return createResponse(fieldTemplates[index])
  }
  return createResponse(null, 404, '模板不存在')
})

Mock.mock(/\/api\/workflow\/field-templates\/\d+\/clone$/, 'post', (options) => {
  const id = parseInt(options.url.match(/\/(\d+)\/clone$/)[1])
  const data = JSON.parse(options.body)
  const template = fieldTemplates.find(item => item.id === id)
  if (template) {
    const newTemplate = {
      ...template,
      id: fieldTemplates.length + 1,
      name: data.name || `${template.name} - 副本`,
      status: '草稿',
      createTime: new Date().toISOString(),
      updateTime: new Date().toISOString()
    }
    fieldTemplates.unshift(newTemplate)
    return createResponse(newTemplate)
  }
  return createResponse(null, 404, '模板不存在')
})

// 客户字段配置接口
Mock.mock(/\/api\/workflow\/customer-field-configs\/\d+$/, 'get', (options) => {
  const customerId = parseInt(options.url.match(/\/(\d+)$/)[1])
  return createResponse({
    customerId,
    fields: formFields.slice(0, 5).map(f => ({
      ...f,
      isVisible: true,
      isEditable: true,
      isRequired: f.isRequired
    }))
  })
})

Mock.mock(/\/api\/workflow\/customer-field-configs\/\d+$/, 'put', (options) => {
  const customerId = parseInt(options.url.match(/\/(\d+)$/)[1])
  const data = JSON.parse(options.body)
  return createResponse({
    customerId,
    ...data,
    updateTime: new Date().toISOString()
  })
})

// 导出导入接口
Mock.mock('/api/workflow/form-fields/export', 'post', () => {
  return createResponse({
    url: 'http://localhost:3000/mock/export/field-config.json',
    filename: 'field-config.json'
  })
})

Mock.mock('/api/workflow/form-fields/import', 'post', () => {
  return createResponse({ success: true, count: 10 })
})

// ========== 流程实例Mock ==========

const workflowInstances = Mock.mock({
  'list|20-40': [{
    'workorderId': /WO[0-9]{8}/,
    'templateId|1-10': 1,
    'templateName': '@ctitle(4, 8)流程',
    'currentNodeId': '@string("lower", 8)',
    'currentNodeName': '@ctitle(2, 4)',
    'status|1': ['运行中', '已暂停', '已完成', '已取消'],
    'startTime': '@datetime',
    'endTime': '@datetime',
    'progress|0-100': 1,
    'history|2-6': [{
      'nodeId': '@string("lower", 8)',
      'nodeName': '@ctitle(2, 4)',
      'action|1': ['进入', '完成', '转交', '退回'],
      'operator': '@cname',
      'time': '@datetime',
      'remark': '@csentence(5, 15)'
    }]
  }]
}).list

// 初始化流程实例
Mock.mock(/\/api\/workflow\/instances\/WO\d+\/init$/, 'post', (options) => {
  const workorderId = options.url.match(/WO\d+/)[0]
  return createResponse({
    workorderId,
    instanceId: 'INST' + Date.now(),
    status: '运行中',
    currentNode: '接单',
    startTime: new Date().toISOString()
  })
})

// 获取流程实例
Mock.mock(/\/api\/workflow\/instances\/WO\d+$/, 'get', (options) => {
  const workorderId = options.url.match(/WO\d+/)[0]
  const instance = workflowInstances.find(i => i.workorderId === workorderId) || workflowInstances[0]
  return createResponse({ ...instance, workorderId })
})

// 执行流程操作
Mock.mock(/\/api\/workflow\/instances\/WO\d+\/actions$/, 'post', () => {
  return createResponse({
    success: true,
    nextNode: '@ctitle(2, 4)',
    nextAssignee: '@cname',
    message: '操作成功'
  })
})

// 批量执行操作
Mock.mock('/api/workflow/instances/batch-actions', 'post', () => {
  return createResponse({
    success: true,
    processed: 5,
    failed: 0
  })
})

// 获取流转历史
Mock.mock(/\/api\/workflow\/instances\/WO\d+\/history$/, 'get', (options) => {
  const workorderId = options.url.match(/WO\d+/)[0]
  return createResponse([
    {
      id: '1',
      nodeName: '创建工单',
      action: '提交',
      operator: '@cname',
      time: Mock.Random.datetime(),
      remark: '客户报修'
    },
    {
      id: '2',
      nodeName: '接单',
      action: '接单',
      operator: '@cname',
      time: Mock.Random.datetime(),
      remark: '已安排工程师'
    },
    {
      id: '3',
      nodeName: '处理中',
      action: '开始处理',
      operator: '@cname',
      time: Mock.Random.datetime(),
      remark: '正在维修'
    }
  ])
})

// 获取流程进度
Mock.mock(/\/api\/workflow\/instances\/WO\d+\/progress$/, 'get', () => {
  return createResponse({
    totalNodes: 6,
    completedNodes: 3,
    currentNode: '处理中',
    progress: 50,
    estimatedTime: '2小时'
  })
})

// 取消流程
Mock.mock(/\/api\/workflow\/instances\/WO\d+\/cancel$/, 'post', () => {
  return createResponse({ success: true, message: '流程已取消' })
})

// 转交工单
Mock.mock(/\/api\/workflow\/instances\/WO\d+\/transfer$/, 'post', () => {
  return createResponse({
    success: true,
    newAssignee: '@cname',
    message: '工单已转交'
  })
})

// 获取流程统计
Mock.mock(/\/api\/workflow\/instances\/WO\d+\/statistics$/, 'get', () => {
  return createResponse({
    duration: '2天3小时',
    handoverCount: 2,
    returnCount: 0,
    satisfaction: 4.5
  })
})

// 导出流程数据
Mock.mock(/\/api\/workflow\/instances\/WO\d+\/export$/, 'get', () => {
  return createResponse({
    url: 'http://localhost:3000/mock/export/workflow-data.json',
    filename: 'workflow-data.json'
  })
})

// ========== 其他通用接口 ==========

// 文件上传
Mock.mock('/api/files/upload', 'post', () => {
  return createResponse({
    url: 'http://localhost:3000/mock/files/uploaded-file.jpg',
    name: 'uploaded-file.jpg',
    size: 102400
  })
})

// 获取当前登录用户信息
Mock.mock('/api/auth/user', 'get', () => {
  return createResponse({
    id: 1,
    name: '演示用户',
    username: 'demo',
    role: '管理员',
    department: '管理部',
    avatar: null
  })
})

// 退出登录
Mock.mock('/api/auth/logout', 'post', () => {
  return createResponse({ success: true })
})

export default Mock
