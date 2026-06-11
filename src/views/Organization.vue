<template>
  <div class="organization-page">
    <div class="page-header">
      <h2>组织结构管理</h2>
      <el-button type="primary" @click="handleAddDepartment">
        <el-icon><Plus /></el-icon>新增部门
      </el-button>
    </div>

    <div class="organization-container">
      <!-- 左侧部门树 -->
      <div class="department-tree-panel">
        <div class="tree-header">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索部门"
            clearable
            :prefix-icon="Search"
            @input="handleSearch"
          />
        </div>
        <div class="tree-content">
          <el-tree
            ref="treeRef"
            :data="filteredDepartmentTree"
            :props="treeProps"
            node-key="id"
            default-expand-all
            highlight-current
            :current-node-key="selectedDepartmentId"
            @node-click="handleNodeClick"
          >
            <template #default="{ node, data }">
              <div class="tree-node" :class="{ 'inactive': data.status === 'inactive' }">
                <el-icon class="node-icon">
                  <OfficeBuilding v-if="!data.parentId" />
                  <FolderOpened v-else-if="data.children && data.children.length" />
                  <Document v-else />
                </el-icon>
                <span class="node-label">{{ node.label }}</span>
                <el-tag v-if="data.status === 'inactive'" size="small" type="info">已停用</el-tag>
                <span class="node-count" v-if="data.employeeCount">({{ data.employeeCount }}人)</span>
              </div>
            </template>
          </el-tree>
        </div>
      </div>

      <!-- 右侧部门详情 -->
      <div class="department-detail-panel">
        <div v-if="selectedDepartment" class="detail-content">
          <div class="detail-header">
            <div class="header-title">
              <h3>{{ selectedDepartment.name }}</h3>
              <el-tag :type="selectedDepartment.status === 'active' ? 'success' : 'info'">
                {{ selectedDepartment.status === 'active' ? '启用' : '停用' }}
              </el-tag>
            </div>
            <div class="header-actions">
              <el-button type="primary" @click="handleEditDepartment">
                <el-icon><Edit /></el-icon>编辑
              </el-button>
              <el-button 
                :type="selectedDepartment.status === 'active' ? 'warning' : 'success'"
                @click="handleToggleStatus"
              >
                <el-icon><SwitchButton /></el-icon>
                {{ selectedDepartment.status === 'active' ? '停用' : '启用' }}
              </el-button>
              <el-button type="danger" @click="handleDeleteDepartment" :disabled="!canDelete">
                <el-icon><Delete /></el-icon>删除
              </el-button>
            </div>
          </div>

          <el-descriptions :column="2" border class="detail-info">
            <el-descriptions-item label="部门编码">{{ selectedDepartment.code }}</el-descriptions-item>
            <el-descriptions-item label="部门类型">
              {{ departmentTypeLabels[selectedDepartment.type] }}
            </el-descriptions-item>
            <el-descriptions-item label="上级部门">
              {{ getParentDepartmentName(selectedDepartment.parentId) }}
            </el-descriptions-item>
            <el-descriptions-item label="部门负责人">
              {{ selectedDepartment.managerName || '未设置' }}
            </el-descriptions-item>
            <el-descriptions-item label="部门层级">第 {{ selectedDepartment.level }} 级</el-descriptions-item>
            <el-descriptions-item label="排序号">{{ selectedDepartment.sortOrder }}</el-descriptions-item>
            <el-descriptions-item label="人员数量">{{ selectedDepartment.employeeCount }} 人</el-descriptions-item>
            <el-descriptions-item label="创建时间">{{ selectedDepartment.createdAt }}</el-descriptions-item>
            <el-descriptions-item label="部门描述" :span="2">
              {{ selectedDepartment.description || '暂无描述' }}
            </el-descriptions-item>
          </el-descriptions>

          <!-- 部门人员列表 -->
          <div class="employee-section">
            <div class="section-header">
              <h4>部门人员</h4>
              <el-button type="primary" size="small" @click="handleAddEmployee">
                <el-icon><Plus /></el-icon>添加人员
              </el-button>
            </div>
            <el-table :data="departmentEmployees" stripe style="width: 100%">
              <el-table-column prop="employeeNo" label="工号" width="120" />
              <el-table-column prop="name" label="姓名" width="100" />
              <el-table-column prop="gender" label="性别" width="80">
                <template #default="{ row }">
                  {{ genderLabels[row.gender] }}
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
              <el-table-column label="操作" width="150" fixed="right">
                <template #default="{ row }">
                  <el-button link type="primary" @click="handleViewEmployee(row)">查看</el-button>
                  <el-button link type="primary" @click="handleTransferEmployee(row)">调岗</el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </div>

        <div v-else class="empty-state">
          <el-empty description="请选择部门查看详情">
            <el-button type="primary" @click="handleAddDepartment">新增部门</el-button>
          </el-empty>
        </div>
      </div>
    </div>

    <!-- 部门编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogType === 'add' ? '新增部门' : '编辑部门'"
      width="600px"
      destroy-on-close
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="100px"
      >
        <el-form-item label="部门名称" prop="name">
          <el-input v-model="formData.name" placeholder="请输入部门名称" />
        </el-form-item>
        <el-form-item label="部门类型" prop="type">
          <el-select v-model="formData.type" placeholder="请选择部门类型" style="width: 100%">
            <el-option
              v-for="(label, value) in departmentTypeLabels"
              :key="value"
              :label="label"
              :value="value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="上级部门" prop="parentId">
          <el-tree-select
            v-model="formData.parentId"
            :data="departmentTreeForSelect"
            :props="{ label: 'name', value: 'id', children: 'children' }"
            placeholder="请选择上级部门（不选则为顶级部门）"
            clearable
            check-strictly
            :disabled="dialogType === 'edit' && formData.id === '1'"
          />
        </el-form-item>
        <el-form-item label="部门负责人" prop="managerId">
          <el-select
            v-model="formData.managerId"
            placeholder="请选择部门负责人"
            style="width: 100%"
            clearable
          >
            <el-option
              v-for="emp in activeEmployees"
              :key="emp.id"
              :label="`${emp.name} (${emp.employeeNo})`"
              :value="emp.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="排序号" prop="sortOrder">
          <el-input-number v-model="formData.sortOrder" :min="1" :max="999" style="width: 100%" />
        </el-form-item>
        <el-form-item label="部门描述" prop="description">
          <el-input
            v-model="formData.description"
            type="textarea"
            :rows="3"
            placeholder="请输入部门描述"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitLoading">确定</el-button>
      </template>
    </el-dialog>

    <!-- 员工调岗对话框 -->
    <el-dialog
      v-model="transferDialogVisible"
      title="员工调岗"
      width="500px"
    >
      <el-form :model="transferForm" label-width="100px">
        <el-form-item label="员工姓名">
          <el-input v-model="transferForm.employeeName" disabled />
        </el-form-item>
        <el-form-item label="当前部门">
          <el-input v-model="transferForm.currentDepartment" disabled />
        </el-form-item>
        <el-form-item label="目标部门" prop="targetDepartmentId">
          <el-tree-select
            v-model="transferForm.targetDepartmentId"
            :data="departmentTreeForSelect"
            :props="{ label: 'name', value: 'id', children: 'children' }"
            placeholder="请选择目标部门"
            check-strictly
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="transferDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleTransferSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Plus, Edit, Delete, SwitchButton, Search,
  OfficeBuilding, FolderOpened, Document
} from '@element-plus/icons-vue'
import {
  state as orgState,
  departmentTree,
  selectedDepartment,
  departmentTypeLabels,
  actions as orgActions,
  canDeleteDepartment,
  DepartmentStatus
} from '../stores/organizationStore.js'
import {
  state as empState,
  activeEmployees,
  roleLabels,
  statusLabels,
  genderLabels,
  EmployeeStatus,
  actions as empActions
} from '../stores/employeeStore.js'

// Tree props
const treeProps = {
  label: 'name',
  children: 'children'
}

// Refs
const treeRef = ref(null)
const formRef = ref(null)
const searchKeyword = ref('')
const dialogVisible = ref(false)
const dialogType = ref('add')
const submitLoading = ref(false)
const transferDialogVisible = ref(false)

// Form data
const formData = ref({
  name: '',
  type: '',
  parentId: null,
  managerId: null,
  sortOrder: 1,
  description: ''
})

// Transfer form
const transferForm = ref({
  employeeId: '',
  employeeName: '',
  currentDepartment: '',
  targetDepartmentId: null
})

// Form rules
const formRules = {
  name: [
    { required: true, message: '请输入部门名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  type: [
    { required: true, message: '请选择部门类型', trigger: 'change' }
  ]
}

// Computed
const selectedDepartmentId = computed(() => orgState.selectedDepartmentId)

const filteredDepartmentTree = computed(() => {
  if (!searchKeyword.value) return departmentTree.value
  
  const keyword = searchKeyword.value.toLowerCase()
  const filterTree = (nodes) => {
    return nodes.filter(node => {
      const match = node.name.toLowerCase().includes(keyword) ||
                   node.code.toLowerCase().includes(keyword)
      const children = node.children ? filterTree(node.children) : []
      if (children.length) {
        node.children = children
        return true
      }
      return match
    })
  }
  
  return filterTree([...departmentTree.value])
})

const departmentTreeForSelect = computed(() => {
  // 过滤掉当前编辑的部门及其子部门（编辑时）
  const filterCurrent = (nodes, excludeId) => {
    return nodes.filter(node => {
      if (node.id === excludeId) return false
      if (node.children) {
        node.children = filterCurrent(node.children, excludeId)
      }
      return true
    })
  }
  
  if (dialogType.value === 'edit' && formData.value.id) {
    return filterCurrent([...departmentTree.value], formData.value.id)
  }
  return departmentTree.value
})

const canDelete = computed(() => {
  if (!selectedDepartment.value) return false
  const { canDelete: deletable } = canDeleteDepartment(selectedDepartment.value.id)
  return deletable
})

const departmentEmployees = computed(() => {
  if (!selectedDepartment.value) return []
  return empActions.getEmployeesByDepartment(selectedDepartment.value.id)
})

// Methods
const handleSearch = () => {
  // 搜索逻辑已在 computed 中处理
}

const handleNodeClick = (data) => {
  orgActions.setSelectedDepartment(data.id)
}

const getParentDepartmentName = (parentId) => {
  if (!parentId) return '无（顶级部门）'
  const parent = orgState.departments.find(d => d.id === parentId)
  return parent ? parent.name : '未知'
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

const resetForm = () => {
  formData.value = {
    name: '',
    type: '',
    parentId: null,
    managerId: null,
    sortOrder: 1,
    description: ''
  }
}

const handleAddDepartment = () => {
  dialogType.value = 'add'
  resetForm()
  dialogVisible.value = true
}

const handleEditDepartment = () => {
  if (!selectedDepartment.value) return
  dialogType.value = 'edit'
  formData.value = { ...selectedDepartment.value }
  dialogVisible.value = true
}

const handleSubmit = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    submitLoading.value = true
    
    if (dialogType.value === 'add') {
      orgActions.createDepartment(formData.value)
      ElMessage.success('部门创建成功')
    } else {
      orgActions.updateDepartment(formData.value.id, formData.value)
      ElMessage.success('部门更新成功')
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

const handleToggleStatus = async () => {
  if (!selectedDepartment.value) return
  
  const action = selectedDepartment.value.status === DepartmentStatus.ACTIVE ? '停用' : '启用'
  
  try {
    await ElMessageBox.confirm(
      `确定要${action}部门"${selectedDepartment.value.name}"吗？`,
      '提示',
      { type: 'warning' }
    )
    
    orgActions.toggleDepartmentStatus(selectedDepartment.value.id)
    ElMessage.success(`${action}成功`)
  } catch {
    // 用户取消
  }
}

const handleDeleteDepartment = async () => {
  if (!selectedDepartment.value) return
  
  const { canDelete: deletable, reason } = canDeleteDepartment(selectedDepartment.value.id)
  if (!deletable) {
    ElMessage.warning(reason)
    return
  }
  
  try {
    await ElMessageBox.confirm(
      `确定要删除部门"${selectedDepartment.value.name}"吗？此操作不可恢复！`,
      '警告',
      { type: 'error' }
    )
    
    orgActions.deleteDepartment(selectedDepartment.value.id)
    ElMessage.success('删除成功')
  } catch {
    // 用户取消
  }
}

const handleAddEmployee = () => {
  ElMessage.info('跳转到员工管理页面添加人员')
  // 可以在这里实现路由跳转
}

const handleViewEmployee = (row) => {
  ElMessage.info(`查看员工: ${row.name}`)
  // 可以打开员工详情对话框
}

const handleTransferEmployee = (row) => {
  transferForm.value = {
    employeeId: row.id,
    employeeName: row.name,
    currentDepartment: selectedDepartment.value?.name || '',
    targetDepartmentId: null
  }
  transferDialogVisible.value = true
}

const handleTransferSubmit = () => {
  if (!transferForm.value.targetDepartmentId) {
    ElMessage.warning('请选择目标部门')
    return
  }
  
  try {
    empActions.updateEmployee(transferForm.value.employeeId, {
      departmentId: transferForm.value.targetDepartmentId
    })
    ElMessage.success('调岗成功')
    transferDialogVisible.value = false
  } catch (error) {
    ElMessage.error(error.message)
  }
}

onMounted(() => {
  // 默认选中第一个部门
  if (orgState.departments.length > 0 && !orgState.selectedDepartmentId) {
    orgActions.setSelectedDepartment(orgState.departments[0].id)
  }
})
</script>

<style scoped>
.organization-page {
  padding: 20px;
  height: 100%;
  display: flex;
  flex-direction: column;
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

.organization-container {
  display: flex;
  flex: 1;
  gap: 20px;
  overflow: hidden;
}

.department-tree-panel {
  width: 320px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
}

.tree-header {
  padding: 16px;
  border-bottom: 1px solid #e4e7ed;
}

.tree-content {
  flex: 1;
  padding: 12px;
  overflow-y: auto;
}

.tree-node {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.tree-node.inactive {
  color: #909399;
}

.node-icon {
  color: #409eff;
  font-size: 16px;
}

.node-label {
  flex: 1;
}

.node-count {
  color: #909399;
  font-size: 12px;
}

.department-detail-panel {
  flex: 1;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  overflow-y: auto;
}

.detail-content {
  padding: 24px;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e4e7ed;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-title h3 {
  margin: 0;
  font-size: 20px;
  font-weight: 500;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.detail-info {
  margin-bottom: 32px;
}

.employee-section {
  margin-top: 24px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-header h4 {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}
</style>
