import { reactive, computed } from 'vue'

// 部门状态枚举
const DepartmentStatus = {
  ACTIVE: 'active',
  INACTIVE: 'inactive'
}

// 部门类型枚举
const DepartmentType = {
  COMPANY: 'company',
  SALES: 'sales',
  TECH: 'tech',
  FINANCE: 'finance',
  ADMIN: 'admin',
  OTHER: 'other'
}

// 部门类型标签
const departmentTypeLabels = {
  [DepartmentType.COMPANY]: '公司',
  [DepartmentType.SALES]: '销售部',
  [DepartmentType.TECH]: '技术部',
  [DepartmentType.FINANCE]: '财务部',
  [DepartmentType.ADMIN]: '行政部',
  [DepartmentType.OTHER]: '其他'
}

// 初始部门数据
const initialDepartments = [
  {
    id: '1',
    name: '总公司',
    code: '01',
    type: DepartmentType.COMPANY,
    parentId: null,
    managerId: null,
    managerName: '张总',
    description: '公司总部',
    sortOrder: 1,
    status: DepartmentStatus.ACTIVE,
    level: 1,
    employeeCount: 25,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01'
  },
  {
    id: '2',
    name: '销售部',
    code: '01-01',
    type: DepartmentType.SALES,
    parentId: '1',
    managerId: 'emp001',
    managerName: '李经理',
    description: '负责产品销售和客户关系维护',
    sortOrder: 1,
    status: DepartmentStatus.ACTIVE,
    level: 2,
    employeeCount: 8,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01'
  },
  {
    id: '3',
    name: '技术部',
    code: '01-02',
    type: DepartmentType.TECH,
    parentId: '1',
    managerId: 'emp002',
    managerName: '王经理',
    description: '负责技术支持和售后服务',
    sortOrder: 2,
    status: DepartmentStatus.ACTIVE,
    level: 2,
    employeeCount: 12,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01'
  },
  {
    id: '4',
    name: '售后服务组',
    code: '01-02-01',
    type: DepartmentType.TECH,
    parentId: '3',
    managerId: 'emp003',
    managerName: '赵主管',
    description: '负责设备安装、维修、巡检等售后服务',
    sortOrder: 1,
    status: DepartmentStatus.ACTIVE,
    level: 3,
    employeeCount: 8,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01'
  },
  {
    id: '5',
    name: '技术支持组',
    code: '01-02-02',
    type: DepartmentType.TECH,
    parentId: '3',
    managerId: 'emp004',
    managerName: '钱主管',
    description: '负责技术咨询和远程支持',
    sortOrder: 2,
    status: DepartmentStatus.ACTIVE,
    level: 3,
    employeeCount: 4,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01'
  },
  {
    id: '6',
    name: '财务部',
    code: '01-03',
    type: DepartmentType.FINANCE,
    parentId: '1',
    managerId: 'emp005',
    managerName: '孙经理',
    description: '负责财务管理和成本控制',
    sortOrder: 3,
    status: DepartmentStatus.ACTIVE,
    level: 2,
    employeeCount: 3,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01'
  },
  {
    id: '7',
    name: '行政部',
    code: '01-04',
    type: DepartmentType.ADMIN,
    parentId: '1',
    managerId: 'emp006',
    managerName: '周经理',
    description: '负责行政管理和人力资源',
    sortOrder: 4,
    status: DepartmentStatus.ACTIVE,
    level: 2,
    employeeCount: 2,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01'
  }
]

// 创建响应式状态
const state = reactive({
  departments: [...initialDepartments],
  loading: false,
  selectedDepartmentId: null
})

// 计算属性
const departmentTree = computed(() => {
  return buildDepartmentTree(state.departments)
})

const activeDepartments = computed(() => {
  return state.departments.filter(d => d.status === DepartmentStatus.ACTIVE)
})

const selectedDepartment = computed(() => {
  return state.departments.find(d => d.id === state.selectedDepartmentId) || null
})

// 构建部门树
function buildDepartmentTree(departments, parentId = null) {
  return departments
    .filter(d => d.parentId === parentId)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map(d => ({
      ...d,
      children: buildDepartmentTree(departments, d.id)
    }))
}

// 生成部门编码
function generateDepartmentCode(parentId) {
  if (!parentId) {
    // 顶级部门，查找最大编码
    const topDepartments = state.departments.filter(d => !d.parentId)
    if (topDepartments.length === 0) return '01'
    const maxCode = Math.max(...topDepartments.map(d => parseInt(d.code)))
    return String(maxCode + 1).padStart(2, '0')
  }

  // 子部门编码
  const parent = state.departments.find(d => d.id === parentId)
  if (!parent) return '01'

  const siblings = state.departments.filter(d => d.parentId === parentId)
  if (siblings.length === 0) {
    return `${parent.code}-01`
  }

  const maxSuffix = Math.max(...siblings.map(d => {
    const parts = d.code.split('-')
    return parseInt(parts[parts.length - 1])
  }))
  return `${parent.code}-${String(maxSuffix + 1).padStart(2, '0')}`
}

// 获取部门层级
function getDepartmentLevel(parentId) {
  if (!parentId) return 1
  const parent = state.departments.find(d => d.id === parentId)
  return parent ? parent.level + 1 : 1
}

// 检查是否可以删除部门
function canDeleteDepartment(departmentId) {
  const department = state.departments.find(d => d.id === departmentId)
  if (!department) return { canDelete: false, reason: '部门不存在' }

  // 检查是否有子部门
  const hasChildren = state.departments.some(d => d.parentId === departmentId)
  if (hasChildren) {
    return { canDelete: false, reason: '该部门下有子部门，无法删除' }
  }

  // 检查是否有员工
  if (department.employeeCount > 0) {
    return { canDelete: false, reason: '该部门下有员工，无法删除' }
  }

  return { canDelete: true, reason: '' }
}

// 获取部门路径
function getDepartmentPath(departmentId) {
  const path = []
  let current = state.departments.find(d => d.id === departmentId)
  
  while (current) {
    path.unshift(current)
    current = state.departments.find(d => d.id === current.parentId)
  }
  
  return path
}

// 获取部门下的所有子部门ID（包括自身）
function getAllChildDepartmentIds(departmentId) {
  const ids = [departmentId]
  const children = state.departments.filter(d => d.parentId === departmentId)
  
  for (const child of children) {
    ids.push(...getAllChildDepartmentIds(child.id))
  }
  
  return ids
}

// 更新员工数量
function updateEmployeeCount(departmentId, delta) {
  const department = state.departments.find(d => d.id === departmentId)
  if (department) {
    department.employeeCount = Math.max(0, (department.employeeCount || 0) + delta)
    department.updatedAt = new Date().toISOString().split('T')[0]
  }
}

// Actions
const actions = {
  // 设置选中的部门
  setSelectedDepartment(departmentId) {
    state.selectedDepartmentId = departmentId
  },

  // 创建部门
  createDepartment(departmentData) {
    const level = getDepartmentLevel(departmentData.parentId)
    if (level > 5) {
      throw new Error('部门层级最多支持5级')
    }

    const newDepartment = {
      id: Date.now().toString(),
      code: generateDepartmentCode(departmentData.parentId),
      level,
      employeeCount: 0,
      status: DepartmentStatus.ACTIVE,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
      ...departmentData
    }

    state.departments.push(newDepartment)
    return newDepartment
  },

  // 更新部门
  updateDepartment(departmentId, updateData) {
    const index = state.departments.findIndex(d => d.id === departmentId)
    if (index === -1) {
      throw new Error('部门不存在')
    }

    const department = state.departments[index]
    
    // 如果修改了上级部门，需要重新计算编码和层级
    if (updateData.parentId !== undefined && updateData.parentId !== department.parentId) {
      const newLevel = getDepartmentLevel(updateData.parentId)
      if (newLevel > 5) {
        throw new Error('部门层级最多支持5级')
      }
      
      // 检查是否将自己或子部门设为了上级
      if (updateData.parentId) {
        const childIds = getAllChildDepartmentIds(departmentId)
        if (childIds.includes(updateData.parentId)) {
          throw new Error('不能将部门的上级设置为其子部门')
        }
      }

      updateData.code = generateDepartmentCode(updateData.parentId)
      updateData.level = newLevel
      
      // 递归更新所有子部门的编码和层级
      updateChildrenCodeAndLevel(departmentId, updateData.code, newLevel)
    }

    state.departments[index] = {
      ...department,
      ...updateData,
      updatedAt: new Date().toISOString().split('T')[0]
    }

    return state.departments[index]
  },

  // 删除部门
  deleteDepartment(departmentId) {
    const { canDelete, reason } = canDeleteDepartment(departmentId)
    if (!canDelete) {
      throw new Error(reason)
    }

    const index = state.departments.findIndex(d => d.id === departmentId)
    if (index > -1) {
      state.departments.splice(index, 1)
      
      // 如果删除的是当前选中的部门，清除选中状态
      if (state.selectedDepartmentId === departmentId) {
        state.selectedDepartmentId = null
      }
    }
  },

  // 停用/启用部门
  toggleDepartmentStatus(departmentId) {
    const department = state.departments.find(d => d.id === departmentId)
    if (!department) {
      throw new Error('部门不存在')
    }

    department.status = department.status === DepartmentStatus.ACTIVE 
      ? DepartmentStatus.INACTIVE 
      : DepartmentStatus.ACTIVE
    department.updatedAt = new Date().toISOString().split('T')[0]

    return department
  },

  // 搜索部门
  searchDepartments(keyword) {
    if (!keyword) return state.departments
    
    const lowerKeyword = keyword.toLowerCase()
    return state.departments.filter(d => 
      d.name.toLowerCase().includes(lowerKeyword) ||
      d.code.toLowerCase().includes(lowerKeyword) ||
      (d.description && d.description.toLowerCase().includes(lowerKeyword))
    )
  },

  // 获取部门的直属子部门
  getDirectChildren(departmentId) {
    return state.departments
      .filter(d => d.parentId === departmentId)
      .sort((a, b) => a.sortOrder - b.sortOrder)
  },

  // 设置部门列表（用于初始化或批量更新）
  setDepartments(departments) {
    state.departments = departments
  }
}

// 递归更新子部门的编码和层级
function updateChildrenCodeAndLevel(parentId, parentCode, parentLevel) {
  const children = state.departments.filter(d => d.parentId === parentId)
  
  children.forEach((child, index) => {
    const newCode = `${parentCode}-${String(index + 1).padStart(2, '0')}`
    const newLevel = parentLevel + 1
    
    child.code = newCode
    child.level = newLevel
    child.updatedAt = new Date().toISOString().split('T')[0]
    
    updateChildrenCodeAndLevel(child.id, newCode, newLevel)
  })
}

export {
  state,
  departmentTree,
  activeDepartments,
  selectedDepartment,
  DepartmentStatus,
  DepartmentType,
  departmentTypeLabels,
  actions,
  canDeleteDepartment,
  getDepartmentPath,
  getAllChildDepartmentIds,
  updateEmployeeCount
}
