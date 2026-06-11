<template>
  <div class="employee-page">
    <div class="page-header">
      <h2>员工账号管理</h2>
      <div class="header-actions">
        <el-button @click="handleImport">
          <el-icon><Upload /></el-icon>批量导入
        </el-button>
        <el-button type="primary" @click="handleAddEmployee">
          <el-icon><Plus /></el-icon>新增员工
        </el-button>
      </div>
    </div>

    <!-- 搜索和筛选 -->
    <div class="search-filter-bar">
      <el-input
        v-model="searchForm.keyword"
        placeholder="搜索姓名/工号/手机号"
        clearable
        style="width: 250px"
        @input="handleSearch"
      />
      <el-select
        v-model="searchForm.departmentId"
        placeholder="所属部门"
        clearable
        style="width: 180px"
        @change="handleSearch"
      >
        <el-option
          v-for="dept in activeDepartments"
          :key="dept.id"
          :label="dept.name"
          :value="dept.id"
        />
      </el-select>
      <el-select
        v-model="searchForm.role"
        placeholder="角色"
        clearable
        style="width: 150px"
        @change="handleSearch"
      >
        <el-option
          v-for="(label, value) in roleLabels"
          :key="value"
          :label="label"
          :value="value"
        />
      </el-select>
      <el-select
        v-model="searchForm.status"
        placeholder="状态"
        clearable
        style="width: 120px"
        @change="handleSearch"
      >
        <el-option
          v-for="(label, value) in statusLabels"
          :key="value"
          :label="label"
          :value="value"
        />
      </el-select>
      <el-button @click="handleReset">重置</el-button>
    </div>

    <!-- 员工列表 -->
    <el-table
      :data="filteredEmployees"
      stripe
      v-loading="loading"
      style="width: 100%"
      @selection-change="handleSelectionChange"
    >
      <el-table-column type="selection" width="55" />
      <el-table-column label="员工信息" min-width="200">
        <template #default="{ row }">
          <div class="employee-info">
            <el-avatar :size="40" :src="row.avatar">
              {{ row.name.charAt(0) }}
            </el-avatar>
            <div class="info-text">
              <div class="name">{{ row.name }}</div>
              <div class="no">{{ row.employeeNo }}</div>
            </div>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="gender" label="性别" width="80">
        <template #default="{ row }">
          {{ genderLabels[row.gender] }}
        </template>
      </el-table-column>
      <el-table-column prop="departmentId" label="所属部门" width="150">
        <template #default="{ row }">
          {{ getDepartmentName(row.departmentId) }}
        </template>
      </el-table-column>
      <el-table-column prop="position" label="职位" width="150" />
      <el-table-column prop="role" label="角色" width="120">
        <template #default="{ row }">
          <el-tag size="small">{{ roleLabels[row.role] }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="phone" label="手机号" width="130" />
      <el-table-column prop="status" label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="getStatusType(row.status)" size="small">
            {{ statusLabels[row.status] }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="entryDate" label="入职日期" width="120" />
      <el-table-column prop="lastLoginTime" label="最后登录" width="150">
        <template #default="{ row }">
          {{ row.lastLoginTime || '从未登录' }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="handleView(row)">查看</el-button>
          <el-button link type="primary" @click="handleEdit(row)">编辑</el-button>
          <el-dropdown trigger="click" @command="(cmd) => handleCommand(cmd, row)">
            <el-button link type="primary">
              更多<el-icon class="el-icon--right"><arrow-down /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="resetPassword">重置密码</el-dropdown-item>
                <el-dropdown-item command="toggleLock" v-if="row.status !== 'resigned'">
                  {{ row.status === 'locked' ? '解锁账号' : '锁定账号' }}
                </el-dropdown-item>
                <el-dropdown-item command="viewLogs">查看日志</el-dropdown-item>
                <el-dropdown-item command="resign" v-if="row.status === 'active' || row.status === 'probation'" divided>
                  办理离职
                </el-dropdown-item>
                <el-dropdown-item command="delete" v-if="row.status === 'resigned'" type="danger">
                  删除账号
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <div class="pagination-wrapper">
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="filteredEmployees.length"
        layout="total, sizes, prev, pager, next, jumper"
      />
    </div>

    <!-- 员工编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogType === 'add' ? '新增员工' : '编辑员工'"
      width="700px"
      destroy-on-close
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="100px"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="姓名" prop="name">
              <el-input v-model="formData.name" placeholder="请输入姓名" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="性别" prop="gender">
              <el-radio-group v-model="formData.gender">
                <el-radio-button :label="Gender.MALE">男</el-radio-button>
                <el-radio-button :label="Gender.FEMALE">女</el-radio-button>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="手机号" prop="phone">
              <el-input v-model="formData.phone" placeholder="请输入手机号" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="邮箱" prop="email">
              <el-input v-model="formData.email" placeholder="请输入邮箱" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="所属部门" prop="departmentId">
              <el-tree-select
                v-model="formData.departmentId"
                :data="departmentTree"
                :props="{ label: 'name', value: 'id', children: 'children' }"
                placeholder="请选择所属部门"
                check-strictly
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="职位" prop="position">
              <el-input v-model="formData.position" placeholder="请输入职位" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="角色" prop="role">
              <el-select v-model="formData.role" placeholder="请选择角色" style="width: 100%">
                <el-option
                  v-for="(label, value) in roleLabels"
                  :key="value"
                  :label="label"
                  :value="value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="数据权限" prop="dataPermission">
              <el-select v-model="formData.dataPermission" placeholder="请选择数据权限" style="width: 100%">
                <el-option
                  v-for="(label, value) in dataPermissionLabels"
                  :key="value"
                  :label="label"
                  :value="value"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="入职日期" prop="entryDate">
              <el-date-picker
                v-model="formData.entryDate"
                type="date"
                placeholder="选择入职日期"
                style="width: 100%"
                value-format="YYYY-MM-DD"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="试用期至" prop="probationEndDate">
              <el-date-picker
                v-model="formData.probationEndDate"
                type="date"
                placeholder="选择试用期结束日期"
                style="width: 100%"
                value-format="YYYY-MM-DD"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="身份证号" prop="idCard">
          <el-input v-model="formData.idCard" placeholder="请输入身份证号" />
        </el-form-item>
        <el-form-item label="紧急联系人" prop="emergencyContact">
          <el-input v-model="formData.emergencyContact" placeholder="请输入紧急联系人及电话" />
        </el-form-item>
        <el-form-item label="家庭住址" prop="address">
          <el-input v-model="formData.address" type="textarea" :rows="2" placeholder="请输入家庭住址" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitLoading">确定</el-button>
      </template>
    </el-dialog>

    <!-- 员工详情对话框 -->
    <el-dialog
      v-model="detailVisible"
      title="员工详情"
      width="800px"
    >
      <div v-if="currentEmployee" class="employee-detail">
        <div class="detail-header">
          <el-avatar :size="80" :src="currentEmployee.avatar">
            {{ currentEmployee.name.charAt(0) }}
          </el-avatar>
          <div class="header-info">
            <h3>{{ currentEmployee.name }}</h3>
            <p>{{ currentEmployee.employeeNo }} | {{ currentEmployee.position }}</p>
            <el-tag :type="getStatusType(currentEmployee.status)">
              {{ statusLabels[currentEmployee.status] }}
            </el-tag>
          </div>
        </div>
        <el-tabs v-model="activeTab">
          <el-tab-pane label="基本信息" name="basic">
            <el-descriptions :column="2" border>
              <el-descriptions-item label="姓名">{{ currentEmployee.name }}</el-descriptions-item>
              <el-descriptions-item label="性别">{{ genderLabels[currentEmployee.gender] }}</el-descriptions-item>
              <el-descriptions-item label="手机号">{{ currentEmployee.phone }}</el-descriptions-item>
              <el-descriptions-item label="邮箱">{{ currentEmployee.email || '-' }}</el-descriptions-item>
              <el-descriptions-item label="所属部门">{{ getDepartmentName(currentEmployee.departmentId) }}</el-descriptions-item>
              <el-descriptions-item label="职位">{{ currentEmployee.position }}</el-descriptions-item>
              <el-descriptions-item label="角色">{{ roleLabels[currentEmployee.role] }}</el-descriptions-item>
              <el-descriptions-item label="数据权限">{{ dataPermissionLabels[currentEmployee.dataPermission] }}</el-descriptions-item>
              <el-descriptions-item label="入职日期">{{ currentEmployee.entryDate }}</el-descriptions-item>
              <el-descriptions-item label="试用期至">{{ currentEmployee.probationEndDate || '-' }}</el-descriptions-item>
              <el-descriptions-item label="身份证号">{{ currentEmployee.idCard || '-' }}</el-descriptions-item>
              <el-descriptions-item label="紧急联系人">{{ currentEmployee.emergencyContact || '-' }}</el-descriptions-item>
              <el-descriptions-item label="家庭住址" :span="2">{{ currentEmployee.address || '-' }}</el-descriptions-item>
            </el-descriptions>
          </el-tab-pane>
          <el-tab-pane label="账号信息" name="account">
            <el-descriptions :column="2" border>
              <el-descriptions-item label="账号状态">
                <el-tag :type="getStatusType(currentEmployee.status)">{{ statusLabels[currentEmployee.status] }}</el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="首次登录">{{ currentEmployee.isFirstLogin ? '是' : '否' }}</el-descriptions-item>
              <el-descriptions-item label="最后登录时间">{{ currentEmployee.lastLoginTime || '从未登录' }}</el-descriptions-item>
              <el-descriptions-item label="密码过期时间">{{ currentEmployee.passwordExpiredAt || '-' }}</el-descriptions-item>
              <el-descriptions-item label="登录失败次数">{{ currentEmployee.loginFailCount }}</el-descriptions-item>
              <el-descriptions-item label="锁定至">{{ currentEmployee.lockedUntil || '-' }}</el-descriptions-item>
            </el-descriptions>
          </el-tab-pane>
          <el-tab-pane label="登录日志" name="logs">
            <el-table :data="employeeLoginLogs" stripe size="small">
              <el-table-column prop="loginTime" label="登录时间" width="160" />
              <el-table-column prop="ipAddress" label="IP地址" width="130" />
              <el-table-column prop="deviceInfo" label="设备信息" min-width="200" />
              <el-table-column prop="status" label="状态" width="100">
                <template #default="{ row }">
                  <el-tag :type="row.status === 'success' ? 'success' : 'danger'" size="small">
                    {{ row.status === 'success' ? '成功' : '失败' }}
                  </el-tag>
                </template>
              </el-table-column>
            </el-table>
          </el-tab-pane>
        </el-tabs>
      </div>
    </el-dialog>

    <!-- 离职办理对话框 -->
    <el-dialog
      v-model="resignDialogVisible"
      title="办理离职"
      width="500px"
    >
      <el-form :model="resignForm" label-width="100px">
        <el-form-item label="员工姓名">
          <el-input v-model="resignForm.employeeName" disabled />
        </el-form-item>
        <el-form-item label="离职日期" required>
          <el-date-picker
            v-model="resignForm.resignationDate"
            type="date"
            placeholder="选择离职日期"
            style="width: 100%"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item label="离职原因">
          <el-input
            v-model="resignForm.reason"
            type="textarea"
            :rows="3"
            placeholder="请输入离职原因"
          />
        </el-form-item>
        <el-form-item label="工作交接给">
          <el-select v-model="resignForm.handoverTo" placeholder="请选择交接人" style="width: 100%" clearable>
            <el-option
              v-for="emp in activeEmployees.filter(e => e.id !== resignForm.employeeId)"
              :key="emp.id"
              :label="`${emp.name} (${emp.employeeNo})`"
              :value="emp.id"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="resignDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleResignSubmit">确认离职</el-button>
      </template>
    </el-dialog>

    <!-- 批量导入对话框 -->
    <el-dialog
      v-model="importDialogVisible"
      title="批量导入员工"
      width="600px"
    >
      <div class="import-guide">
        <h4>导入说明</h4>
        <ol>
          <li>请下载并使用标准模板填写员工信息</li>
          <li>支持导入字段：姓名、性别、手机号、邮箱、部门、职位、角色、入职日期</li>
          <li>手机号和邮箱不可重复</li>
          <li>每次最多导入500条记录</li>
        </ol>
        <el-button type="primary" link @click="downloadTemplate">
          <el-icon><Download /></el-icon>下载导入模板
        </el-button>
      </div>
      <el-upload
        class="upload-area"
        drag
        action="#"
        :auto-upload="false"
        :on-change="handleFileChange"
        accept=".xlsx,.xls"
      >
        <el-icon class="el-icon--upload"><upload-filled /></el-icon>
        <div class="el-upload__text">
          拖拽文件到此处或 <em>点击上传</em>
        </div>
        <template #tip>
          <div class="el-upload__tip">
            仅支持 .xlsx, .xls 格式的Excel文件
          </div>
        </template>
      </el-upload>
      <template #footer>
        <el-button @click="importDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleImportSubmit" :disabled="!importFile">开始导入</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Plus, Upload, Download, ArrowDown, UploadFilled
} from '@element-plus/icons-vue'
import {
  state as empState,
  activeEmployees,
  roleLabels,
  statusLabels,
  genderLabels,
  dataPermissionLabels,
  EmployeeStatus,
  Gender,
  EmployeeRole,
  DataPermission,
  actions as empActions,
  validatePassword
} from '../stores/employeeStore.js'
import {
  departmentTree,
  activeDepartments,
  actions as orgActions
} from '../stores/organizationStore.js'

// Refs
const formRef = ref(null)
const loading = ref(false)
const dialogVisible = ref(false)
const dialogType = ref('add')
const submitLoading = ref(false)
const detailVisible = ref(false)
const activeTab = ref('basic')
const resignDialogVisible = ref(false)
const importDialogVisible = ref(false)
const importFile = ref(null)
const selectedRows = ref([])

// Search form
const searchForm = reactive({
  keyword: '',
  departmentId: '',
  role: '',
  status: ''
})

// Pagination
const pagination = reactive({
  page: 1,
  pageSize: 10
})

// Form data
const formData = ref({
  name: '',
  gender: Gender.MALE,
  phone: '',
  email: '',
  departmentId: null,
  position: '',
  role: EmployeeRole.ENGINEER,
  dataPermission: DataPermission.SELF,
  entryDate: '',
  probationEndDate: null,
  idCard: '',
  emergencyContact: '',
  address: ''
})

// Resign form
const resignForm = ref({
  employeeId: '',
  employeeName: '',
  resignationDate: '',
  reason: '',
  handoverTo: null
})

// Current employee for detail view
const currentEmployee = ref(null)
const employeeLoginLogs = ref([])

// Form rules
const formRules = {
  name: [
    { required: true, message: '请输入姓名', trigger: 'blur' },
    { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' }
  ],
  gender: [
    { required: true, message: '请选择性别', trigger: 'change' }
  ],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确', trigger: 'blur' }
  ],
  email: [
    { type: 'email', message: '邮箱格式不正确', trigger: 'blur' }
  ],
  departmentId: [
    { required: true, message: '请选择所属部门', trigger: 'change' }
  ],
  position: [
    { required: true, message: '请输入职位', trigger: 'blur' }
  ],
  role: [
    { required: true, message: '请选择角色', trigger: 'change' }
  ],
  entryDate: [
    { required: true, message: '请选择入职日期', trigger: 'change' }
  ]
}

// Computed
const filteredEmployees = computed(() => {
  let result = empActions.searchEmployees(searchForm.keyword, {
    departmentId: searchForm.departmentId,
    role: searchForm.role,
    status: searchForm.status
  })
  
  // 分页
  const start = (pagination.page - 1) * pagination.pageSize
  const end = start + pagination.pageSize
  return result.slice(start, end)
})

// Methods
const getDepartmentName = (departmentId) => {
  if (!departmentId) return '-'
  const dept = activeDepartments.value.find(d => d.id === departmentId)
  return dept ? dept.name : '-'
}

const getStatusType = (status) => {
  const typeMap = {
    [EmployeeStatus.ACTIVE]: 'success',
    [EmployeeStatus.PROBATION]: 'warning',
    [EmployeeStatus.RESIGNED]: 'info',
    [EmployeeStatus.LOCKED]: 'danger'
  }
  return typeMap[status] || 'info'
}

const handleSearch = () => {
  pagination.page = 1
}

const handleReset = () => {
  searchForm.keyword = ''
  searchForm.departmentId = ''
  searchForm.role = ''
  searchForm.status = ''
  pagination.page = 1
}

const resetForm = () => {
  formData.value = {
    name: '',
    gender: Gender.MALE,
    phone: '',
    email: '',
    departmentId: null,
    position: '',
    role: EmployeeRole.ENGINEER,
    dataPermission: DataPermission.SELF,
    entryDate: new Date().toISOString().split('T')[0],
    probationEndDate: null,
    idCard: '',
    emergencyContact: '',
    address: ''
  }
}

const handleAddEmployee = () => {
  dialogType.value = 'add'
  resetForm()
  dialogVisible.value = true
}

const handleEdit = (row) => {
  dialogType.value = 'edit'
  formData.value = { ...row }
  dialogVisible.value = true
}

const handleView = (row) => {
  currentEmployee.value = row
  activeTab.value = 'basic'
  employeeLoginLogs.value = empActions.queryLoginLogs({ employeeId: row.id })
  detailVisible.value = true
}

const handleSubmit = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    submitLoading.value = true
    
    if (dialogType.value === 'add') {
      const { employee, initialPassword } = empActions.createEmployee(formData.value)
      ElMessage.success(`员工创建成功，初始密码：${initialPassword}`)
    } else {
      empActions.updateEmployee(formData.value.id, formData.value)
      ElMessage.success('员工更新成功')
    }
    dialogVisible.value = false
  } catch (error) {
    if (error.message) {
      ElMessage.error(error.message)
    }
  } finally {
    submitLoading.value = false
  }
}

const handleCommand = (command, row) => {
  switch (command) {
    case 'resetPassword':
      handleResetPassword(row)
      break
    case 'toggleLock':
      handleToggleLock(row)
      break
    case 'viewLogs':
      handleViewLogs(row)
      break
    case 'resign':
      handleResign(row)
      break
    case 'delete':
      handleDelete(row)
      break
  }
}

const handleResetPassword = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确定要重置员工"${row.name}"的密码吗？`,
      '确认重置密码',
      { type: 'warning' }
    )
    
    const { newPassword } = empActions.resetPassword(row.id)
    ElMessage.success(`密码重置成功，新密码：${newPassword}`)
  } catch {
    // 用户取消
  }
}

const handleToggleLock = async (row) => {
  const action = row.status === EmployeeStatus.LOCKED ? '解锁' : '锁定'
  
  try {
    await ElMessageBox.confirm(
      `确定要${action}员工"${row.name}"的账号吗？`,
      `确认${action}`,
      { type: 'warning' }
    )
    
    empActions.toggleLockEmployee(row.id)
    ElMessage.success(`${action}成功`)
  } catch {
    // 用户取消
  }
}

const handleViewLogs = (row) => {
  currentEmployee.value = row
  employeeLoginLogs.value = empActions.queryLoginLogs({ employeeId: row.id })
  activeTab.value = 'logs'
  detailVisible.value = true
}

const handleResign = (row) => {
  resignForm.value = {
    employeeId: row.id,
    employeeName: row.name,
    resignationDate: new Date().toISOString().split('T')[0],
    reason: '',
    handoverTo: null
  }
  resignDialogVisible.value = true
}

const handleResignSubmit = async () => {
  if (!resignForm.value.resignationDate) {
    ElMessage.warning('请选择离职日期')
    return
  }
  
  try {
    empActions.deactivateEmployee(resignForm.value.employeeId, {
      resignationDate: resignForm.value.resignationDate,
      reason: resignForm.value.reason,
      handoverTo: resignForm.value.handoverTo
    })
    ElMessage.success('离职办理成功')
    resignDialogVisible.value = false
  } catch (error) {
    ElMessage.error(error.message)
  }
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确定要彻底删除员工"${row.name}"的账号吗？此操作不可恢复！`,
      '警告',
      { type: 'error' }
    )
    
    empActions.deleteEmployee(row.id)
    ElMessage.success('删除成功')
  } catch {
    // 用户取消
  }
}

const handleSelectionChange = (selection) => {
  selectedRows.value = selection
}

const handleImport = () => {
  importDialogVisible.value = true
  importFile.value = null
}

const downloadTemplate = () => {
  // 生成并下载Excel模板
  const templateData = [
    ['姓名', '性别', '手机号', '邮箱', '部门ID', '职位', '角色', '入职日期', '身份证号', '紧急联系人', '家庭住址'],
    ['张三', '男', '13800138001', 'zhangsan@company.com', '2', '销售代表', 'assistant', '2024-01-15', '310101199001011234', '李四 13900139001', '上海市浦东新区xxx路xxx号'],
    ['李四', '女', '13800138002', 'lisi@company.com', '3', '售后工程师', 'engineer', '2024-02-01', '310101199502022222', '张三 13900139002', '上海市浦东新区xxx路xxx号']
  ]
  
  // 这里应该调用excel导出功能
  ElMessage.success('模板下载成功')
}

const handleFileChange = (file) => {
  importFile.value = file
}

const handleImportSubmit = () => {
  if (!importFile.value) {
    ElMessage.warning('请先选择文件')
    return
  }
  
  // 这里应该调用Excel解析功能
  ElMessage.info('导入功能需要配合Excel解析库使用')
  importDialogVisible.value = false
}
</script>

<style scoped>
.employee-page {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 500;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.search-filter-bar {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.employee-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.info-text {
  display: flex;
  flex-direction: column;
}

.info-text .name {
  font-weight: 500;
  font-size: 14px;
}

.info-text .no {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}

.employee-detail {
  padding: 20px;
}

.detail-header {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid #e4e7ed;
}

.header-info h3 {
  margin: 0 0 8px 0;
  font-size: 20px;
}

.header-info p {
  margin: 0 0 8px 0;
  color: #606266;
}

.import-guide {
  margin-bottom: 20px;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 4px;
}

.import-guide h4 {
  margin: 0 0 12px 0;
}

.import-guide ol {
  margin: 0 0 16px 0;
  padding-left: 20px;
  color: #606266;
  line-height: 1.8;
}

.upload-area {
  text-align: center;
}
</style>
