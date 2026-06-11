<template>
  <div class="staff-workorder-list">
    <!-- 顶部导航 -->
    <div class="list-header">
      <el-button link @click="goBack">
        <el-icon><ArrowLeft /></el-icon>
        <span>返回</span>
      </el-button>
      <span class="header-title">我的工单</span>
      <span class="placeholder"></span>
    </div>

    <!-- 搜索栏 -->
    <div class="search-section">
      <div class="search-input-wrapper">
        <el-icon class="search-icon"><Search /></el-icon>
        <input
          v-model="searchKeyword"
          type="text"
          class="search-input"
          placeholder="搜索工单号、客户名称、设备型号..."
          @input="handleSearch"
        />
        <el-icon v-if="searchKeyword" class="clear-icon" @click="clearSearch"><CircleClose /></el-icon>
      </div>
      <el-button link class="filter-btn" @click="showFilter = true">
        <el-icon><Filter /></el-icon>
        <span>筛选</span>
      </el-button>
    </div>

    <!-- 工单状态标签 -->
    <div class="status-tabs">
      <div
        v-for="tab in statusTabs"
        :key="tab.key"
        class="tab-item"
        :class="{ active: activeTab === tab.key }"
        @click="activeTab = tab.key"
      >
        <span class="tab-name">{{ tab.name }}</span>
        <span class="tab-count" v-if="tab.count > 0">{{ tab.count }}</span>
      </div>
    </div>

    <!-- 筛选条件展示 -->
    <div class="filter-tags" v-if="hasActiveFilters">
      <el-tag
        v-for="(filter, key) in activeFilters"
        :key="key"
        closable
        size="small"
        @close="removeFilter(key)"
      >
        {{ filter.label }}: {{ filter.value }}
      </el-tag>
      <el-button link size="small" @click="clearAllFilters">清除全部</el-button>
    </div>

    <!-- 工单列表 -->
    <div class="workorder-list">
      <div
        v-for="order in filteredWorkorders"
        :key="order.id"
        class="workorder-card"
        @click="viewWorkorderDetail(order)"
      >
        <div class="card-header">
          <span class="order-no">{{ order.workorderId }}</span>
          <el-tag :type="getStatusType(order.status)" size="small">
            {{ getStatusText(order.status) }}
          </el-tag>
        </div>
        <div class="card-body">
          <div class="info-row">
            <el-icon><Monitor /></el-icon>
            <span class="device-model">{{ order.deviceModel || '设备型号未指定' }}</span>
          </div>
          <div class="info-row">
            <el-icon><OfficeBuilding /></el-icon>
            <span class="customer-name">{{ order.customerName }}</span>
          </div>
          <div class="info-row">
            <el-icon><Location /></el-icon>
            <span class="address">{{ order.address }}</span>
          </div>
          <p class="order-desc">{{ order.faultDescription || order.description }}</p>
        </div>
        <div class="card-footer">
          <span class="order-time">{{ formatDate(order.createTime) }}</span>
          <div class="action-buttons">
            <!-- 待分配：课长分配 + 创建人可编辑删除 -->
            <template v-if="order.status === 'pending_assign'">
              <el-button v-if="canAssignWorkorder(currentUserRole, order)" type="primary" size="small" @click.stop="goToAssign(order)">分配</el-button>
              <el-button v-if="canEditForMobile(order)" type="success" size="small" @click.stop="handleEditWorkorder(order)">编辑</el-button>
              <el-button v-if="canEditForMobile(order)" type="danger" size="small" @click.stop="handleDeleteWorkorder(order)">删除</el-button>
            </template>
            <!-- 待接单：工程师接单/弃单 -->
            <template v-if="order.status === 'pending_accept'">
              <el-button v-if="canAcceptWorkorder(currentUserRole, order, currentUserId)" type="primary" size="small" @click.stop="acceptWorkorder(order)">接单</el-button>
              <el-button v-if="canRejectWorkorder(currentUserRole, order, currentUserId)" type="warning" size="small" @click.stop="rejectOrder(order)">弃单</el-button>
            </template>
            <!-- 进行中：工程师处理 -->
            <el-button v-if="canSubmitForSign(currentUserRole, order, currentUserId)" type="success" size="small" @click.stop="goToProcess(order)">处理</el-button>
            <!-- 待签字：工程师操作签字 -->
            <el-button v-if="canSignWorkorder(currentUserRole, order, currentUserId)" type="warning" size="small" @click.stop="goToSign(order)">签字</el-button>
            <!-- 课长确认 -->
            <el-button v-if="canTechLeadConfirm(currentUserRole)" type="primary" size="small" @click.stop="techLeadConfirmMobile(order)">确认</el-button>
            <!-- 业务确认 -->
            <el-button v-if="canAssistantConfirm(currentUserRole)" type="primary" size="small" @click.stop="assistantConfirmMobile(order)">确认</el-button>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div class="empty-state" v-if="filteredWorkorders.length === 0">
        <el-icon><Document /></el-icon>
        <p>暂无{{ statusTabs.find(t => t.key === activeTab)?.name || '相关' }}工单</p>
        <p v-if="searchKeyword || hasActiveFilters" class="empty-tip">请尝试调整搜索条件</p>
      </div>
    </div>

    <!-- 筛选对话框 -->
    <el-dialog
      v-model="showFilter"
      title="筛选条件"
      width="90%"
      class="mobile-dialog filter-dialog"
    >
      <div class="filter-section">
        <div class="filter-group">
          <div class="filter-label">工单类型</div>
          <div class="filter-options">
            <el-check-tag
              v-for="type in filterOptions.types"
              :key="type.value"
              :checked="filterForm.type === type.value"
              @change="filterForm.type = filterForm.type === type.value ? '' : type.value"
            >
              {{ type.label }}
            </el-check-tag>
          </div>
        </div>

        <div class="filter-group">
          <div class="filter-label">创建时间</div>
          <div class="filter-options">
            <el-check-tag
              v-for="time in filterOptions.timeRanges"
              :key="time.value"
              :checked="filterForm.timeRange === time.value"
              @change="filterForm.timeRange = filterForm.timeRange === time.value ? '' : time.value"
            >
              {{ time.label }}
            </el-check-tag>
          </div>
        </div>

        <div class="filter-group">
          <div class="filter-label">客户名称</div>
          <el-input
            v-model="filterForm.customerName"
            placeholder="请输入客户名称"
            clearable
          />
        </div>
      </div>
      <template #footer>
        <el-button @click="showFilter = false">取消</el-button>
        <el-button @click="resetFilter">重置</el-button>
        <el-button type="primary" @click="applyFilter">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { state as workorderFlowState, WorkorderStatusText, WorkorderStatusType, acceptWorkorder as storeAccept, rejectWorkorder as storeReject, techLeadConfirm as storeTechLeadConfirm, assistantConfirm as storeAssistantConfirm, getVisibleWorkorders, canAcceptWorkorder, canRejectWorkorder, canSubmitForSign, canSignWorkorder, canTechLeadConfirm, canAssistantConfirm, canAssignWorkorder } from '../stores/workorderFlowStore.js'
import {
  ArrowLeft,
  Monitor,
  Document,
  Location,
  OfficeBuilding,
  Search,
  CircleClose,
  Filter
} from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()

// 当前选中的标签
const activeTab = ref('all')

// 是否为管理员/课长/部长（可编辑删除工单）
const isManager = computed(() => {
  try {
    const auth = JSON.parse(localStorage.getItem('staffAuth') || '{}')
    return ['admin', 'assistant', 'techLead', 'director'].includes(auth.role)
  } catch { return false }
})

const auth = computed(() => {
  try {
    return JSON.parse(localStorage.getItem('staffAuth') || '{}')
  } catch { return {} }
})

// 当前用户角色和姓名
const currentUserRole = computed(() => auth.value.role || 'engineer')
const currentUserId = computed(() => auth.value.id || auth.value.userId || '')
const currentUserName = computed(() => auth.value.name || '')

// 角色快捷判断
const isEngineer = computed(() => currentUserRole.value === 'engineer' || currentUserRole.value === 'admin')
const isTechLead = computed(() => currentUserRole.value === 'techLead' || currentUserRole.value === 'admin' || currentUserRole.value === 'director')
const isAssistant = computed(() => currentUserRole.value === 'assistant' || currentUserRole.value === 'admin')

// 移动端编辑权限（待分配 + 创建人）
const canEditForMobile = (order) => {
  const role = currentUserRole.value
  if (role === 'admin') return true
  if (order.createdBy && order.createdBy.role === role) return true
  return false
}

// 搜索关键词
const searchKeyword = ref('')

// 是否显示筛选对话框
const showFilter = ref(false)

// 筛选表单
const filterForm = ref({
  type: '',
  timeRange: '',
  customerName: ''
})

// 已应用的筛选条件
const appliedFilters = ref({
  type: '',
  timeRange: '',
  customerName: ''
})

// 筛选选项
const filterOptions = {
  types: [
    { label: '安装工单', value: 'installation' },
    { label: '服务工单-维修', value: 'repair' },
    { label: '服务工单-试加工', value: 'trial_processing' },
    { label: '服务工单-改造', value: 'refitting' }
  ],
  timeRanges: [
    { label: '今天', value: 'today' },
    { label: '最近7天', value: 'week' },
    { label: '最近30天', value: 'month' },
    { label: '最近90天', value: 'quarter' }
  ]
}

// 是否有活动的筛选条件
const hasActiveFilters = computed(() => {
  return Object.values(appliedFilters.value).some(v => v !== '')
})

// 活动的筛选条件列表（用于显示标签）
const activeFilters = computed(() => {
  const filters = {}
  if (appliedFilters.value.type) {
    const type = filterOptions.types.find(t => t.value === appliedFilters.value.type)
    filters.type = { label: '类型', value: type?.label || appliedFilters.value.type }
  }
  if (appliedFilters.value.timeRange) {
    const time = filterOptions.timeRanges.find(t => t.value === appliedFilters.value.timeRange)
    filters.timeRange = { label: '时间', value: time?.label || appliedFilters.value.timeRange }
  }
  if (appliedFilters.value.customerName) {
    filters.customerName = { label: '客户', value: appliedFilters.value.customerName }
  }
  return filters
})

// 页面加载时读取URL参数
// (loadWorkorders定义见下方状态标签区域)

const workorders = ref([])

onMounted(() => {
  // 加载工单数据
  loadWorkorders()

  const filter = route.query.filter
  if (filter && ['all', 'pending_accept', 'processing', 'pending_sign', 'techlead_confirm', 'completed'].includes(filter)) {
    activeTab.value = filter
  }

  // 监听工单更新事件
  window.addEventListener('workorder-updated', loadWorkorders)
})

// 工单列表（从store获取，按当前用户角色过滤）
const loadWorkorders = () => {
  workorders.value = [...workorderFlowState.workorders].sort((a, b) => new Date(b.createTime) - new Date(a.createTime))
}

// 状态标签（展示全部7个流程节点）
const statusTabs = computed(() => [
  { key: 'all', name: '全部', count: workorders.value.length },
  { key: 'pending_assign', name: '待分配', count: workorders.value.filter(w => w.status === 'pending_assign').length },
  { key: 'pending_accept', name: '待接单', count: workorders.value.filter(w => w.status === 'pending_accept').length },
  { key: 'processing', name: '进行中', count: workorders.value.filter(w => w.status === 'processing').length },
  { key: 'pending_sign', name: '待签字', count: workorders.value.filter(w => w.status === 'pending_sign').length },
  { key: 'techlead_confirm', name: '课长确认', count: workorders.value.filter(w => w.status === 'techlead_confirm').length },
  { key: 'assistant_confirm', name: '业务确认', count: workorders.value.filter(w => w.status === 'assistant_confirm').length },
  { key: 'completed', name: '已完成', count: workorders.value.filter(w => w.status === 'completed').length }
])

// 筛选后的工单
const filteredWorkorders = computed(() => {
  let result = workorders.value

  // 1. 按状态标签筛选
  if (activeTab.value !== 'all') {
    result = result.filter(order => {
      switch (activeTab.value) {
        case 'pending_assign':
          return order.status === 'pending_assign'
        case 'pending_accept':
          return order.status === 'pending_accept'
        case 'processing':
          return order.status === 'processing'
        case 'pending_sign':
          return order.status === 'pending_sign'
        case 'techlead_confirm':
          return order.status === 'techlead_confirm'
        case 'assistant_confirm':
          return order.status === 'assistant_confirm'
        case 'completed':
          return order.status === 'completed'
        default:
          return true
      }
    })
  }

  // 2. 按搜索关键词筛选
  if (searchKeyword.value.trim()) {
    const keyword = searchKeyword.value.toLowerCase().trim()
    result = result.filter(order => {
      return (
        order.workorderId?.toLowerCase().includes(keyword) ||
        order.customerName?.toLowerCase().includes(keyword) ||
        order.deviceModel?.toLowerCase().includes(keyword) ||
        order.faultDescription?.toLowerCase().includes(keyword) ||
        order.description?.toLowerCase().includes(keyword) ||
        order.address?.toLowerCase().includes(keyword)
      )
    })
  }

  // 3. 按筛选条件筛选
  // 按类型筛选
  if (appliedFilters.value.type) {
    const fv = appliedFilters.value.type
    if (fv === 'installation') {
      result = result.filter(order => order.category === 'installation')
    } else {
      result = result.filter(order => order.category === 'service' && order.subType === fv)
    }
  }

  // 按时间范围筛选
  if (appliedFilters.value.timeRange) {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    result = result.filter(order => {
      const createTime = new Date(order.createTime)
      switch (appliedFilters.value.timeRange) {
        case 'today':
          return createTime >= today
        case 'week':
          const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
          return createTime >= weekAgo
        case 'month':
          const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
          return createTime >= monthAgo
        case 'quarter':
          const quarterAgo = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000)
          return createTime >= quarterAgo
        default:
          return true
      }
    })
  }

  // 按客户名称筛选
  if (appliedFilters.value.customerName) {
    const customerKeyword = appliedFilters.value.customerName.toLowerCase()
    result = result.filter(order =>
      order.customerName?.toLowerCase().includes(customerKeyword)
    )
  }

  return result.sort((a, b) => new Date(b.createTime) - new Date(a.createTime))
})

// 方法
const goBack = () => {
  router.push('/staff-mobile-workspace')
}

const viewWorkorderDetail = (order) => {
  router.push(`/staff-workorder-detail?id=${order.id}`)
}

const acceptWorkorder = (order) => {
  ElMessageBox.confirm('确认接单？', '接单确认', { type: 'info' }).then(() => {
    storeAccept(order.id || order.rawId)
    loadWorkorders()
    ElMessage.success(`已接单: ${order.workorderId}`)
  }).catch(() => {})
}

const rejectOrder = (order) => {
  ElMessageBox.prompt('请输入弃单原因', '弃单', { type: 'warning' }).then(({ value: reason }) => {
    storeReject(order.id || order.rawId, reason)
    loadWorkorders()
    ElMessage.success('已弃单，工单返回待分配')
  }).catch(() => {})
}

const goToProcess = (order) => {
  router.push(`/staff-workorder-detail?id=${order.id}&action=process`)
}

const completeWorkorder = (order) => {
  router.push(`/staff-workorder-detail?id=${order.id}&action=complete`)
}

const goToSign = (order) => {
  router.push(`/staff-workorder-detail?id=${order.id}&action=sign`)
}

const goToAssign = (order) => {
  router.push(`/staff-workorder-detail?id=${order.id}&action=assign`)
}

const techLeadConfirmMobile = (order) => {
  ElMessageBox.confirm('确认此工单？', '课长确认', { type: 'info' }).then(() => {
    storeTechLeadConfirm(order.id || order.rawId)
    loadWorkorders()
    ElMessage.success('课长已确认')
  }).catch(() => {})
}

const assistantConfirmMobile = (order) => {
  ElMessageBox.confirm('确认此工单？', '业务确认', { type: 'info' }).then(() => {
    storeAssistantConfirm(order.id || order.rawId)
    loadWorkorders()
    ElMessage.success('业务已确认，工单完成')
  }).catch(() => {})
}

// 编辑工单
const handleEditWorkorder = (order) => {
  router.push(`/staff-workorder-create?id=${order.id}`)
}

// 删除工单
const handleDeleteWorkorder = (order) => {
  ElMessageBox.confirm(
    `确定删除工单 ${order.workorderId} 吗？删除后不可恢复。`,
    '删除确认',
    { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }
  ).then(() => {
    const index = workorderFlowState.workorders.findIndex(w => w.id === order.id || w.workorderId === order.workorderId)
    if (index !== -1) {
      workorderFlowState.workorders.splice(index, 1)
      loadWorkorders()
      ElMessage.success('工单已删除')
    }
  }).catch(() => {})
}

const getStatusType = (status) => WorkorderStatusType[status] || 'info'

const getStatusText = (status) => WorkorderStatusText[status] || status

const formatDate = (date) => {
  if (!date) return ''
  const d = new Date(date)
  return `${d.getMonth() + 1}月${d.getDate()}日`
}

// 搜索相关方法
const handleSearch = () => {
  // 实时搜索，无需额外操作，computed属性会自动更新
}

const clearSearch = () => {
  searchKeyword.value = ''
}

// 筛选相关方法
const applyFilter = () => {
  appliedFilters.value = { ...filterForm.value }
  showFilter.value = false
  ElMessage.success('筛选已应用')
}

const resetFilter = () => {
  filterForm.value = {
    type: '',
    timeRange: '',
    customerName: ''
  }
}

const removeFilter = (key) => {
  appliedFilters.value[key] = ''
  filterForm.value[key] = ''
}

const clearAllFilters = () => {
  appliedFilters.value = {
    type: '',
    timeRange: '',
    customerName: ''
  }
  filterForm.value = {
    type: '',
    timeRange: '',
    customerName: ''
  }
  ElMessage.success('筛选已清除')
}
</script>

<style scoped>
.staff-workorder-list {
  min-height: 100vh;
  background: #f5f7fa;
  padding-bottom: 20px;
  width: 100vw;
  max-width: 100%;
  overflow-x: hidden;
  box-sizing: border-box;
}

/* 顶部导航 */
.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 15px;
  background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
  color: white;
}

.list-header .el-button {
  color: white;
  font-size: 14px;
}

.header-title {
  font-size: 17px;
  font-weight: 500;
}

.placeholder {
  width: 60px;
}

/* 搜索栏 */
.search-section {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 15px;
  background: white;
  border-bottom: 1px solid #f0f0f0;
}

.search-input-wrapper {
  flex: 1;
  display: flex;
  align-items: center;
  background: #f5f7fa;
  border-radius: 20px;
  padding: 8px 12px;
  gap: 8px;
}

.search-icon {
  color: #8c8c8c;
  font-size: 16px;
}

.search-input {
  flex: 1;
  border: none;
  background: transparent;
  font-size: 14px;
  color: #262626;
  outline: none;
}

.search-input::placeholder {
  color: #bfbfbf;
}

.clear-icon {
  color: #bfbfbf;
  font-size: 16px;
  cursor: pointer;
}

.filter-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #595959;
  font-size: 14px;
}

/* 筛选标签 */
.filter-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 10px 15px;
  background: white;
  border-bottom: 1px solid #f0f0f0;
}

.filter-tags .el-tag {
  margin-right: 0;
}

/* 状态标签 */
.status-tabs {
  display: flex;
  gap: 8px;
  padding: 15px;
  background: white;
  overflow-x: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.status-tabs::-webkit-scrollbar {
  display: none;
}

.tab-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: #f5f5f5;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.3s;
  white-space: nowrap;
}

.tab-item.active {
  background: #1890ff;
  color: white;
}

.tab-name {
  font-size: 14px;
}

.tab-count {
  font-size: 12px;
  background: #ff4d4f;
  color: white;
  padding: 2px 6px;
  border-radius: 10px;
}

.tab-item.active .tab-count {
  background: white;
  color: #1890ff;
}

/* 工单列表 */
.workorder-list {
  padding: 0 15px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.workorder-card {
  background: white;
  border-radius: 12px;
  padding: 15px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  cursor: pointer;
  transition: all 0.3s;
}

.workorder-card:active {
  transform: scale(0.98);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.order-no {
  font-size: 16px;
  font-weight: 600;
  color: #1890ff;
}

.card-body {
  margin-bottom: 12px;
}

.info-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  font-size: 14px;
  color: #595959;
}

.info-row .el-icon {
  color: #8c8c8c;
  font-size: 16px;
}

.device-model {
  font-weight: 500;
  color: #262626;
}

.customer-name {
  color: #595959;
}

.address {
  color: #8c8c8c;
  font-size: 13px;
}

.order-desc {
  font-size: 14px;
  color: #262626;
  margin: 10px 0 0;
  padding: 10px;
  background: #f5f7fa;
  border-radius: 8px;
  line-height: 1.5;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}

.order-time {
  font-size: 13px;
  color: #8c8c8c;
}

.action-buttons {
  display: flex;
  gap: 8px;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #bfbfbf;
}

.empty-state .el-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.empty-state p {
  margin: 0;
  font-size: 14px;
}

.empty-tip {
  font-size: 12px;
  color: #8c8c8c;
  margin-top: 8px;
}

/* 筛选对话框 */
.filter-dialog .filter-section {
  padding: 10px 0;
}

.filter-group {
  margin-bottom: 20px;
}

.filter-label {
  font-size: 14px;
  font-weight: 500;
  color: #262626;
  margin-bottom: 10px;
}

.filter-options {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.filter-options .el-check-tag {
  padding: 6px 12px;
  font-size: 13px;
}

/* 手机端小屏幕适配 */
@media (max-width: 375px) {
  .tab-item {
    padding: 6px 12px;
    font-size: 13px;
  }
  
  .workorder-card {
    padding: 12px;
  }
  
  .order-no {
    font-size: 14px;
  }
}

/* 响应式适配 - 平板及以上 */
@media (min-width: 768px) {
  .staff-workorder-list {
    max-width: 414px;
    margin: 0 auto;
    border-left: 1px solid #e8e8e8;
    border-right: 1px solid #e8e8e8;
  }
}
</style>
