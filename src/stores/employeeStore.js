import { reactive, computed } from 'vue'
import { updateEmployeeCount } from './organizationStore.js'

// 员工状态枚举
const EmployeeStatus = {
  ACTIVE: 'active',
  PROBATION: 'probation',
  RESIGNED: 'resigned',
  LOCKED: 'locked'
}

// 员工角色枚举
const EmployeeRole = {
  ADMIN: 'admin',
  SALES: 'assistant',
  ENGINEER: 'engineer',
  TECH_LEAD: 'techLead',
  CUSTOMER: 'customer'
}

// 数据权限枚举
const DataPermission = {
  ALL: 'all',
  DEPARTMENT: 'department',
  SELF: 'self'
}

// 性别枚举
const Gender = {
  MALE: 'male',
  FEMALE: 'female',
  OTHER: 'other'
}

// 角色标签
const roleLabels = {
  [EmployeeRole.ADMIN]: '系统管理员',
  [EmployeeRole.SALES]: '业务助理',
  [EmployeeRole.ENGINEER]: '工程师',
  [EmployeeRole.TECH_LEAD]: '课长',
  [EmployeeRole.CUSTOMER]: '客户'
}

// 状态标签
const statusLabels = {
  [EmployeeStatus.ACTIVE]: '在职',
  [EmployeeStatus.PROBATION]: '试用期',
  [EmployeeStatus.RESIGNED]: '离职',
  [EmployeeStatus.LOCKED]: '锁定'
}

// 数据权限标签
const dataPermissionLabels = {
  [DataPermission.ALL]: '全部数据',
  [DataPermission.DEPARTMENT]: '本部门数据',
  [DataPermission.SELF]: '仅自己数据'
}

// 性别标签
const genderLabels = {
  [Gender.MALE]: '男',
  [Gender.FEMALE]: '女',
  [Gender.OTHER]: '其他'
}

// 初始员工数据
const initialEmployees = [
  {
    id: 'emp001',
    employeeNo: 'E2024001',
    name: '李经理',
    gender: Gender.MALE,
    phone: '13800138001',
    email: 'li.manager@company.com',
    departmentId: '2',
    position: '销售经理',
    level: 'M2',
    role: EmployeeRole.SALES,
    dataPermission: DataPermission.DEPARTMENT,
    status: EmployeeStatus.ACTIVE,
    entryDate: '2024-01-15',
    probationEndDate: '2024-04-15',
    resignationDate: null,
    avatar: null,
    password: 'hashed_password',
    lastLoginTime: '2026-04-01 09:30:00',
    isFirstLogin: false,
    passwordExpiredAt: '2026-07-01',
    loginFailCount: 0,
    lockedUntil: null,
    idCard: '310101199001011234',
    emergencyContact: '张三 13900139001',
    address: '上海市浦东新区xxx路xxx号',
    createdAt: '2024-01-15',
    updatedAt: '2026-04-01'
  },
  {
    id: 'emp002',
    employeeNo: 'E2024002',
    name: '王经理',
    gender: Gender.MALE,
    phone: '13800138002',
    email: 'wang.manager@company.com',
    departmentId: '3',
    position: '技术经理',
    level: 'M2',
    role: EmployeeRole.TECH_LEAD,
    dataPermission: DataPermission.ALL,
    status: EmployeeStatus.ACTIVE,
    entryDate: '2024-01-10',
    probationEndDate: null,
    resignationDate: null,
    avatar: null,
    password: 'hashed_password',
    lastLoginTime: '2026-04-01 08:45:00',
    isFirstLogin: false,
    passwordExpiredAt: '2026-06-15',
    loginFailCount: 0,
    lockedUntil: null,
    idCard: '310101198505056789',
    emergencyContact: '李四 13900139002',
    address: '上海市浦东新区xxx路xxx号',
    createdAt: '2024-01-10',
    updatedAt: '2026-04-01'
  },
  {
    id: 'emp003',
    employeeNo: 'E2024003',
    name: '赵主管',
    gender: Gender.MALE,
    phone: '13800138003',
    email: 'zhao.supervisor@company.com',
    departmentId: '4',
    position: '售后服务主管',
    level: 'M1',
    role: EmployeeRole.TECH_LEAD,
    dataPermission: DataPermission.DEPARTMENT,
    status: EmployeeStatus.ACTIVE,
    entryDate: '2024-02-01',
    probationEndDate: '2024-05-01',
    resignationDate: null,
    avatar: null,
    password: 'hashed_password',
    lastLoginTime: '2026-04-01 10:00:00',
    isFirstLogin: false,
    passwordExpiredAt: '2026-08-01',
    loginFailCount: 0,
    lockedUntil: null,
    idCard: '310101199510101111',
    emergencyContact: '王五 13900139003',
    address: '上海市浦东新区xxx路xxx号',
    createdAt: '2024-02-01',
    updatedAt: '2026-04-01'
  },
  {
    id: 'emp004',
    employeeNo: 'E2024004',
    name: '钱主管',
    gender: Gender.FEMALE,
    phone: '13800138004',
    email: 'qian.supervisor@company.com',
    departmentId: '5',
    position: '技术支持主管',
    level: 'M1',
    role: EmployeeRole.TECH_LEAD,
    dataPermission: DataPermission.DEPARTMENT,
    status: EmployeeStatus.ACTIVE,
    entryDate: '2024-02-15',
    probationEndDate: '2024-05-15',
    resignationDate: null,
    avatar: null,
    password: 'hashed_password',
    lastLoginTime: '2026-03-31 17:30:00',
    isFirstLogin: false,
    passwordExpiredAt: '2026-08-15',
    loginFailCount: 0,
    lockedUntil: null,
    idCard: '310101199202022222',
    emergencyContact: '赵六 13900139004',
    address: '上海市浦东新区xxx路xxx号',
    createdAt: '2024-02-15',
    updatedAt: '2026-03-31'
  },
  {
    id: 'emp005',
    employeeNo: 'E2024005',
    name: '孙经理',
    gender: Gender.MALE,
    phone: '13800138005',
    email: 'sun.manager@company.com',
    departmentId: '6',
    position: '财务经理',
    level: 'M2',
    role: EmployeeRole.ADMIN,
    dataPermission: DataPermission.ALL,
    status: EmployeeStatus.ACTIVE,
    entryDate: '2024-01-20',
    probationEndDate: null,
    resignationDate: null,
    avatar: null,
    password: 'hashed_password',
    lastLoginTime: '2026-04-01 09:00:00',
    isFirstLogin: false,
    passwordExpiredAt: '2026-07-20',
    loginFailCount: 0,
    lockedUntil: null,
    idCard: '310101198808083333',
    emergencyContact: '钱七 13900139005',
    address: '上海市浦东新区xxx路xxx号',
    createdAt: '2024-01-20',
    updatedAt: '2026-04-01'
  },
  {
    id: 'emp006',
    employeeNo: 'E2024006',
    name: '周经理',
    gender: Gender.FEMALE,
    phone: '13800138006',
    email: 'zhou.manager@company.com',
    departmentId: '7',
    position: '行政经理',
    level: 'M2',
    role: EmployeeRole.ADMIN,
    dataPermission: DataPermission.ALL,
    status: EmployeeStatus.ACTIVE,
    entryDate: '2024-01-25',
    probationEndDate: null,
    resignationDate: null,
    avatar: null,
    password: 'hashed_password',
    lastLoginTime: '2026-04-01 08:30:00',
    isFirstLogin: false,
    passwordExpiredAt: '2026-07-25',
    loginFailCount: 0,
    lockedUntil: null,
    idCard: '310101199303034444',
    emergencyContact: '孙八 13900139006',
    address: '上海市浦东新区xxx路xxx号',
    createdAt: '2024-01-25',
    updatedAt: '2026-04-01'
  },
  {
    id: 'emp007',
    employeeNo: 'E2024007',
    name: '吴工程师',
    gender: Gender.MALE,
    phone: '13800138007',
    email: 'wu.engineer@company.com',
    departmentId: '4',
    position: '售后工程师',
    level: 'P3',
    role: EmployeeRole.ENGINEER,
    dataPermission: DataPermission.SELF,
    status: EmployeeStatus.ACTIVE,
    entryDate: '2024-03-01',
    probationEndDate: '2024-06-01',
    resignationDate: null,
    avatar: null,
    password: 'hashed_password',
    lastLoginTime: '2026-04-01 07:45:00',
    isFirstLogin: false,
    passwordExpiredAt: '2026-09-01',
    loginFailCount: 0,
    lockedUntil: null,
    idCard: '310101199606065555',
    emergencyContact: '周九 13900139007',
    address: '上海市浦东新区xxx路xxx号',
    createdAt: '2024-03-01',
    updatedAt: '2026-04-01'
  },
  {
    id: 'emp008',
    employeeNo: 'E2024008',
    name: '郑工程师',
    gender: Gender.FEMALE,
    phone: '13800138008',
    email: 'zheng.engineer@company.com',
    departmentId: '4',
    position: '售后工程师',
    level: 'P2',
    role: EmployeeRole.ENGINEER,
    dataPermission: DataPermission.SELF,
    status: EmployeeStatus.PROBATION,
    entryDate: '2026-03-01',
    probationEndDate: '2026-06-01',
    resignationDate: null,
    avatar: null,
    password: 'hashed_password',
    lastLoginTime: '2026-04-01 08:00:00',
    isFirstLogin: true,
    passwordExpiredAt: null,
    loginFailCount: 0,
    lockedUntil: null,
    idCard: '310101199808086666',
    emergencyContact: '吴十 13900139008',
    address: '上海市浦东新区xxx路xxx号',
    createdAt: '2026-03-01',
    updatedAt: '2026-04-01'
  },
  {
    id: 'emp009',
    employeeNo: 'E2024009',
    name: '陈销售',
    gender: Gender.MALE,
    phone: '13800138009',
    email: 'chen.sales@company.com',
    departmentId: '2',
    position: '销售代表',
    level: 'P2',
    role: EmployeeRole.SALES,
    dataPermission: DataPermission.SELF,
    status: EmployeeStatus.RESIGNED,
    entryDate: '2024-02-01',
    probationEndDate: '2024-05-01',
    resignationDate: '2026-02-28',
    avatar: null,
    password: 'hashed_password',
    lastLoginTime: '2026-02-28 17:00:00',
    isFirstLogin: false,
    passwordExpiredAt: null,
    loginFailCount: 0,
    lockedUntil: null,
    idCard: '310101199404047777',
    emergencyContact: '郑十一 13900139009',
    address: '上海市浦东新区xxx路xxx号',
    createdAt: '2024-02-01',
    updatedAt: '2026-02-28'
  }
]

// 初始登录日志数据
const initialLoginLogs = [
  {
    id: 'log001',
    employeeId: 'emp001',
    employeeName: '李经理',
    loginTime: '2026-04-01 09:30:00',
    ipAddress: '192.168.1.100',
    deviceInfo: 'Chrome 123.0 / Windows 10',
    status: 'success',
    message: '登录成功'
  },
  {
    id: 'log002',
    employeeId: 'emp002',
    employeeName: '王经理',
    loginTime: '2026-04-01 08:45:00',
    ipAddress: '192.168.1.101',
    deviceInfo: 'Chrome 123.0 / Windows 10',
    status: 'success',
    message: '登录成功'
  },
  {
    id: 'log003',
    employeeId: 'emp007',
    employeeName: '吴工程师',
    loginTime: '2026-04-01 07:45:00',
    ipAddress: '192.168.1.102',
    deviceInfo: 'WeChat/ iPhone 15',
    status: 'success',
    message: '登录成功'
  }
]

// 初始操作日志数据
const initialOperationLogs = [
  {
    id: 'op001',
    employeeId: 'emp001',
    employeeName: '李经理',
    operationType: 'password_change',
    operationDesc: '修改密码',
    operationTime: '2026-03-15 10:30:00',
    ipAddress: '192.168.1.100',
    details: null
  },
  {
    id: 'op002',
    employeeId: 'emp002',
    employeeName: '王经理',
    operationType: 'role_update',
    operationDesc: '更新角色权限',
    operationTime: '2026-03-20 14:00:00',
    ipAddress: '192.168.1.101',
    details: { oldRole: 'engineer', newRole: 'techLead' }
  }
]

// 创建响应式状态
const state = reactive({
  employees: [...initialEmployees],
  loginLogs: [...initialLoginLogs],
  operationLogs: [...initialOperationLogs],
  loading: false,
  selectedEmployeeId: null
})

// 计算属性
const activeEmployees = computed(() => {
  return state.employees.filter(e => e.status === EmployeeStatus.ACTIVE || e.status === EmployeeStatus.PROBATION)
})

const selectedEmployee = computed(() => {
  return state.employees.find(e => e.id === state.selectedEmployeeId) || null
})

// 生成工号
function generateEmployeeNo() {
  const year = new Date().getFullYear()
  const prefix = `E${year}`
  const existingNos = state.employees
    .filter(e => e.employeeNo.startsWith(prefix))
    .map(e => parseInt(e.employeeNo.slice(-4)))
  
  const maxNo = existingNos.length > 0 ? Math.max(...existingNos) : 0
  return `${prefix}${String(maxNo + 1).padStart(4, '0')}`
}

// 生成初始密码
function generateInitialPassword() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let password = ''
  for (let i = 0; i < 10; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}

// 验证密码复杂度
function validatePassword(password) {
  if (password.length < 8) {
    return { valid: false, message: '密码长度至少8位' }
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: '密码必须包含大写字母' }
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: '密码必须包含小写字母' }
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: '密码必须包含数字' }
  }
  return { valid: true, message: '' }
}

// Actions
const actions = {
  // 设置选中的员工
  setSelectedEmployee(employeeId) {
    state.selectedEmployeeId = employeeId
  },

  // 创建员工
  createEmployee(employeeData) {
    // 检查手机号唯一性
    if (state.employees.some(e => e.phone === employeeData.phone)) {
      throw new Error('手机号已存在')
    }

    // 检查邮箱唯一性
    if (employeeData.email && state.employees.some(e => e.email === employeeData.email)) {
      throw new Error('邮箱已存在')
    }

    const initialPassword = generateInitialPassword()
    const now = new Date().toISOString().split('T')[0]

    const newEmployee = {
      id: `emp${Date.now()}`,
      employeeNo: generateEmployeeNo(),
      password: initialPassword, // 实际应该加密
      lastLoginTime: null,
      isFirstLogin: true,
      passwordExpiredAt: null,
      loginFailCount: 0,
      lockedUntil: null,
      resignationDate: null,
      createdAt: now,
      updatedAt: now,
      ...employeeData
    }

    state.employees.push(newEmployee)

    // 更新部门员工数量
    if (newEmployee.departmentId) {
      updateEmployeeCount(newEmployee.departmentId, 1)
    }

    return { employee: newEmployee, initialPassword }
  },

  // 更新员工
  updateEmployee(employeeId, updateData) {
    const index = state.employees.findIndex(e => e.id === employeeId)
    if (index === -1) {
      throw new Error('员工不存在')
    }

    const employee = state.employees[index]

    // 检查手机号唯一性
    if (updateData.phone && updateData.phone !== employee.phone) {
      if (state.employees.some(e => e.phone === updateData.phone && e.id !== employeeId)) {
        throw new Error('手机号已存在')
      }
    }

    // 检查邮箱唯一性
    if (updateData.email && updateData.email !== employee.email) {
      if (state.employees.some(e => e.email === updateData.email && e.id !== employeeId)) {
        throw new Error('邮箱已存在')
      }
    }

    // 如果修改了部门，更新部门员工数量
    if (updateData.departmentId && updateData.departmentId !== employee.departmentId) {
      if (employee.departmentId) {
        updateEmployeeCount(employee.departmentId, -1)
      }
      updateEmployeeCount(updateData.departmentId, 1)
    }

    state.employees[index] = {
      ...employee,
      ...updateData,
      updatedAt: new Date().toISOString().split('T')[0]
    }

    return state.employees[index]
  },

  // 停用员工账号（离职）
  deactivateEmployee(employeeId, resignationData) {
    const employee = state.employees.find(e => e.id === employeeId)
    if (!employee) {
      throw new Error('员工不存在')
    }

    employee.status = EmployeeStatus.RESIGNED
    employee.resignationDate = resignationData.resignationDate || new Date().toISOString().split('T')[0]
    employee.resignationReason = resignationData.reason
    employee.handoverTo = resignationData.handoverTo
    employee.updatedAt = new Date().toISOString().split('T')[0]

    // 更新部门员工数量
    if (employee.departmentId) {
      updateEmployeeCount(employee.departmentId, -1)
    }

    return employee
  },

  // 删除员工（仅超级管理员可操作）
  deleteEmployee(employeeId) {
    const index = state.employees.findIndex(e => e.id === employeeId)
    if (index === -1) {
      throw new Error('员工不存在')
    }

    const employee = state.employees[index]

    // 只有离职状态的员工才能删除
    if (employee.status !== EmployeeStatus.RESIGNED) {
      throw new Error('只能删除已离职的员工')
    }

    state.employees.splice(index, 1)

    // 如果删除的是当前选中的员工，清除选中状态
    if (state.selectedEmployeeId === employeeId) {
      state.selectedEmployeeId = null
    }

    return true
  },

  // 重置密码
  resetPassword(employeeId, newPassword = null) {
    const employee = state.employees.find(e => e.id === employeeId)
    if (!employee) {
      throw new Error('员工不存在')
    }

    const password = newPassword || generateInitialPassword()
    const validation = validatePassword(password)
    if (!validation.valid) {
      throw new Error(validation.message)
    }

    employee.password = password // 实际应该加密
    employee.isFirstLogin = true
    employee.passwordExpiredAt = null
    employee.loginFailCount = 0
    employee.lockedUntil = null
    employee.updatedAt = new Date().toISOString().split('T')[0]

    // 记录操作日志
    addOperationLog(employeeId, 'password_reset', '重置密码', { isAdminReset: true })

    return { success: true, newPassword: password }
  },

  // 锁定/解锁账号
  toggleLockEmployee(employeeId) {
    const employee = state.employees.find(e => e.id === employeeId)
    if (!employee) {
      throw new Error('员工不存在')
    }

    if (employee.status === EmployeeStatus.LOCKED) {
      employee.status = EmployeeStatus.ACTIVE
      employee.lockedUntil = null
      employee.loginFailCount = 0
    } else {
      employee.status = EmployeeStatus.LOCKED
      employee.lockedUntil = null
    }

    employee.updatedAt = new Date().toISOString().split('T')[0]
    return employee
  },

  // 批量导入员工
  batchImportEmployees(employeeList) {
    const results = {
      success: [],
      failed: []
    }

    for (const data of employeeList) {
      try {
        const { employee } = this.createEmployee(data)
        results.success.push({ data, employee })
      } catch (error) {
        results.failed.push({ data, error: error.message })
      }
    }

    return results
  },

  // 搜索员工
  searchEmployees(keyword, filters = {}) {
    let result = state.employees

    // 关键词搜索
    if (keyword) {
      const lowerKeyword = keyword.toLowerCase()
      result = result.filter(e =>
        e.name.toLowerCase().includes(lowerKeyword) ||
        e.employeeNo.toLowerCase().includes(lowerKeyword) ||
        e.phone.includes(keyword) ||
        (e.email && e.email.toLowerCase().includes(lowerKeyword))
      )
    }

    // 部门筛选
    if (filters.departmentId) {
      result = result.filter(e => e.departmentId === filters.departmentId)
    }

    // 角色筛选
    if (filters.role) {
      result = result.filter(e => e.role === filters.role)
    }

    // 状态筛选
    if (filters.status) {
      result = result.filter(e => e.status === filters.status)
    }

    return result
  },

  // 获取部门下的员工
  getEmployeesByDepartment(departmentId, includeChildren = false) {
    if (includeChildren) {
      // 这里需要配合 organizationStore 获取所有子部门ID
      return state.employees.filter(e => e.departmentId === departmentId)
    }
    return state.employees.filter(e => e.departmentId === departmentId)
  },

  // 添加登录日志
  addLoginLog(employeeId, status, ipAddress, deviceInfo, message = '') {
    const employee = state.employees.find(e => e.id === employeeId)
    const log = {
      id: `log${Date.now()}`,
      employeeId,
      employeeName: employee ? employee.name : '未知',
      loginTime: new Date().toISOString().replace('T', ' ').slice(0, 19),
      ipAddress,
      deviceInfo,
      status,
      message
    }
    state.loginLogs.unshift(log)

    // 更新员工最后登录时间
    if (employee && status === 'success') {
      employee.lastLoginTime = log.loginTime
    }

    return log
  },

  // 添加操作日志
  addOperationLog(employeeId, operationType, operationDesc, details = null) {
    const employee = state.employees.find(e => e.id === employeeId)
    const log = {
      id: `op${Date.now()}`,
      employeeId,
      employeeName: employee ? employee.name : '未知',
      operationType,
      operationDesc,
      operationTime: new Date().toISOString().replace('T', ' ').slice(0, 19),
      ipAddress: '192.168.1.1', // 实际应该从请求中获取
      details
    }
    state.operationLogs.unshift(log)
    return log
  },

  // 查询登录日志
  queryLoginLogs(filters = {}) {
    let result = [...state.loginLogs]

    if (filters.employeeId) {
      result = result.filter(l => l.employeeId === filters.employeeId)
    }

    if (filters.status) {
      result = result.filter(l => l.status === filters.status)
    }

    if (filters.startTime && filters.endTime) {
      result = result.filter(l => l.loginTime >= filters.startTime && l.loginTime <= filters.endTime)
    }

    return result
  },

  // 查询操作日志
  queryOperationLogs(filters = {}) {
    let result = [...state.operationLogs]

    if (filters.employeeId) {
      result = result.filter(l => l.employeeId === filters.employeeId)
    }

    if (filters.operationType) {
      result = result.filter(l => l.operationType === filters.operationType)
    }

    if (filters.startTime && filters.endTime) {
      result = result.filter(l => l.operationTime >= filters.startTime && l.operationTime <= filters.endTime)
    }

    return result
  }
}

// 添加操作日志的辅助函数
function addOperationLog(employeeId, operationType, operationDesc, details) {
  return actions.addOperationLog(employeeId, operationType, operationDesc, details)
}

export {
  state,
  activeEmployees,
  selectedEmployee,
  EmployeeStatus,
  EmployeeRole,
  DataPermission,
  Gender,
  roleLabels,
  statusLabels,
  dataPermissionLabels,
  genderLabels,
  actions,
  generateEmployeeNo,
  generateInitialPassword,
  validatePassword
}
