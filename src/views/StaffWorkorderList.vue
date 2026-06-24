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
        <span class="tab-count" v-if="tab.count > 0 && tab.key !== 'all' && tab.key !== 'completed'">{{ tab.count }}</span>
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

    <!-- 列表顶部数量提示 -->
    <div class="list-summary" v-if="activeTab === 'all' || activeTab === 'completed'">
      <span v-if="activeTab === 'all'">共 {{ filteredWorkorders.length }} 条工单</span>
      <span v-else>已完成 {{ filteredWorkorders.length }} 条</span>
    </div>

    <!-- 工单列表 -->
    <div class="workorder-list">
      <div
        v-for="order in displayedWorkorders"
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
              <el-button v-if="canAssignWorkorder(currentUserRole, order)" type="primary" size="small" @click.stop="openAssignDialog(order)">分配</el-button>
              <el-button v-if="canEditForMobile(order)" type="success" size="small" @click.stop="handleEditWorkorder(order)">编辑</el-button>
              <el-button v-if="canEditForMobile(order)" type="danger" size="small" @click.stop="handleDeleteWorkorder(order)">删除</el-button>
            </template>
            <!-- 待接单：工程师接单/弃单 -->
            <template v-if="order.status === 'pending_accept'">
              <el-button v-if="canAcceptWorkorder(currentUserRole, order, currentUserId)" type="primary" size="small" @click.stop="acceptWorkorder(order)">接单</el-button>
              <el-button v-if="canRejectWorkorder(currentUserRole, order, currentUserId)" type="warning" size="small" @click.stop="rejectOrder(order)">弃单</el-button>
            </template>
            <!-- 进行中：工程师打卡+处理 -->
            <el-button v-if="order.status === 'processing' && canSubmitForSign(currentUserRole, order, currentUserId)" type="primary" size="small" :disabled="hasCheckedIn(order)" @click.stop="goToCheckInFromWorkorder(order)">{{ hasCheckedIn(order) ? '已打卡' : '打卡' }}</el-button>
            <el-button v-if="order.status === 'processing' && canSubmitForSign(currentUserRole, order, currentUserId)" type="success" size="small" @click.stop="goToProcess(order)">处理</el-button>
            <!-- 待签字：工程师操作签字（仅待签字状态显示） -->
            <el-button v-if="order.status === 'pending_sign' && canSignWorkorder(currentUserRole, order, currentUserId)" type="warning" size="small" @click.stop="goToSign(order)">签字</el-button>
            <!-- 课长确认（仅课长确认状态显示） -->
            <el-button v-if="order.status === 'techlead_confirm' && canTechLeadConfirm(currentUserRole)" type="primary" size="small" @click.stop="techLeadConfirmMobile(order)">确认</el-button>
            <!-- 业务确认（仅业务确认状态显示） -->
            <el-button v-if="order.status === 'assistant_confirm' && canAssistantConfirm(currentUserRole)" type="primary" size="small" @click.stop="assistantConfirmMobile(order)">确认</el-button>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div class="empty-state" v-if="filteredWorkorders.length === 0">
        <el-icon><Document /></el-icon>
        <p>暂无{{ statusTabs.find(t => t.key === activeTab)?.name || '相关' }}工单</p>
        <p v-if="searchKeyword || hasActiveFilters" class="empty-tip">请尝试调整搜索条件</p>
      </div>

      <!-- 底部加载状态 -->
      <div class="load-more" v-if="filteredWorkorders.length > 0">
        <span v-if="hasMore" class="load-more-text" @click="loadMore">上拉加载更多</span>
        <span v-else class="no-more-text">没有更多了</span>
      </div>
    </div>

    <!-- 分配工程师对话框 -->
    <el-dialog
      v-model="assignDialogVisible"
      title="分配工程师"
      width="95%"
      :show-close="false"
      class="mobile-dialog assign-mobile-dialog"
      :fullscreen="true"
    >
      <template #header>
        <div class="repair-dialog-header">
          <span class="repair-title">分配工程师</span>
          <el-button link @click="assignDialogVisible = false">
            <el-icon><Close /></el-icon>
          </el-button>
        </div>
      </template>
      <div v-if="assignWorkorderData" class="assign-dialog-content">
        <!-- 工单基础信息 -->
        <div class="assign-info-section">
          <div class="assign-section-title">工单信息</div>
          <div class="assign-info-row"><span class="label">工单号</span><span class="value">{{ assignWorkorderData.workorderId }}</span></div>
          <div class="assign-info-row"><span class="label">工单类型</span><span class="value">{{ getCategoryText(assignWorkorderData.category) }}{{ assignWorkorderData.subType ? '·' + getSubTypeText(assignWorkorderData.subType) : '' }}</span></div>
          <div class="assign-info-row"><span class="label">客户公司</span><span class="value">{{ assignWorkorderData.customerName }}</span></div>
          <div class="assign-info-row"><span class="label">联系电话</span><span class="value">{{ assignWorkorderData.customerPhone }}</span></div>
          <div class="assign-info-row"><span class="label">地址</span><span class="value">{{ assignWorkorderData.address }}</span></div>
          <div class="assign-info-pair">
            <div class="assign-info-item"><span class="label">设备型号</span><span class="value">{{ assignWorkorderData.deviceModel || '-' }}</span></div>
            <div class="assign-info-item"><span class="label">序列号</span><span class="value">{{ assignWorkorderData.serialNumber || '-' }}</span></div>
          </div>
          <div class="assign-info-row"><span class="label">保修状态</span><span class="value"><el-tag :type="getWarrantyTagType(assignWorkorderData.warrantyStatus)" size="small">{{ getWarrantyText(assignWorkorderData.warrantyStatus) }}</el-tag></span></div>
          <div class="assign-info-desc"><span class="label">故障描述</span><div class="value">{{ assignWorkorderData.faultDescription }}</div></div>
        </div>

        <el-divider />

        <el-form label-position="top">
          <el-form-item label="选择工程师" required>
            <el-select
              v-model="assignFormData.selectedEngineerIds"
              multiple
              placeholder="请选择工程师（可多选）"
              style="width: 100%"
              filterable
            >
              <el-option
                v-for="eng in engineerList"
                :key="eng.id"
                :label="`${eng.name}（${eng.department}·${eng.specialty}）`"
                :value="eng.id"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="工作内容">
            <el-input v-model="assignFormData.workContent" type="textarea" :rows="3" placeholder="请填写工作内容" />
            <div class="work-content-tags">
              <span class="tags-label">快捷填入：</span>
              <el-tag
                v-for="tag in workContentTags"
                :key="tag"
                class="work-tag"
                :effect="isTagSelected(tag) ? 'dark' : 'plain'"
                :type="isTagSelected(tag) ? 'primary' : ''"
                @click="toggleWorkTag(tag)"
              >
                {{ tag }}
              </el-tag>
            </div>
          </el-form-item>
          <el-form-item label="工作开始时间">
            <el-date-picker
              v-model="assignFormData.workStartTime"
              type="datetime"
              placeholder="选择开始时间"
              format="YYYY-MM-DD HH:mm"
              value-format="YYYY-MM-DDTHH:mm:ss"
              style="width: 100%"
            />
          </el-form-item>
          <el-form-item label="预定完成时间">
            <el-date-picker
              v-model="assignFormData.workEndTime"
              type="datetime"
              placeholder="选择完成时间"
              format="YYYY-MM-DD HH:mm"
              value-format="YYYY-MM-DDTHH:mm:ss"
              style="width: 100%"
            />
          </el-form-item>
          <el-form-item label="使用车辆">
            <el-radio-group v-model="assignFormData.vehicle">
              <el-radio label="self">自备</el-radio>
              <el-radio label="company">公司车辆</el-radio>
              <el-radio label="public">公共交通</el-radio>
            </el-radio-group>
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <div class="repair-footer">
          <el-button size="large" @click="assignDialogVisible = false">取消</el-button>
          <el-button type="primary" size="large" @click="confirmAssign" :disabled="assignFormData.selectedEngineerIds.length === 0">确认分配</el-button>
        </div>
      </template>
    </el-dialog>

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
import { ref, computed, onMounted, onBeforeUnmount, reactive, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { state as workorderFlowState, WorkorderStatusText, WorkorderStatusType, acceptWorkorder as storeAccept, rejectWorkorder as storeReject, techLeadConfirm as storeTechLeadConfirm, assistantConfirm as storeAssistantConfirm, getVisibleWorkorders, canAcceptWorkorder, canRejectWorkorder, canSubmitForSign, canSignWorkorder, canTechLeadConfirm, canAssistantConfirm, canAssignWorkorder, engineerList, assignWorkorder } from '../stores/workorderFlowStore.js'
import {
  ArrowLeft,
  Monitor,
  Document,
  Location,
  OfficeBuilding,
  Search,
  CircleClose,
  Filter,
  Close
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

// 工单列表（从store获取，按当前用户角色过滤）
const loadWorkorders = () => {
  workorders.value = [...workorderFlowState.workorders].sort((a, b) => new Date(b.createTime) - new Date(a.createTime))
}

// 基础筛选（搜索+筛选条件，不含状态tab筛选）
const baseFilteredWorkorders = computed(() => {
  let result = workorders.value

  // 工程师不展示待分配工单
  if (currentUserRole.value === 'engineer') {
    result = result.filter(order => order.status !== 'pending_assign')
  }

  // 按搜索关键词筛选
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

// 状态标签（根据角色动态生成，数字从筛选后数据计算）
const showPendingAssignTab = computed(() => {
  return ['admin', 'assistant', 'techLead', 'director'].includes(currentUserRole.value)
})

const statusTabs = computed(() => {
  const base = baseFilteredWorkorders.value
  const tabs = [
    { key: 'all', name: '全部', count: base.length },
  ]
  if (showPendingAssignTab.value) {
    tabs.push({ key: 'pending_assign', name: '待分配', count: base.filter(w => w.status === 'pending_assign').length })
  }
  tabs.push(
    { key: 'pending_accept', name: '待接单', count: base.filter(w => w.status === 'pending_accept').length },
    { key: 'processing', name: '进行中', count: base.filter(w => w.status === 'processing').length },
    { key: 'pending_sign', name: '待签字', count: base.filter(w => w.status === 'pending_sign').length },
    { key: 'techlead_confirm', name: '课长确认', count: base.filter(w => w.status === 'techlead_confirm').length },
    { key: 'assistant_confirm', name: '业务确认', count: base.filter(w => w.status === 'assistant_confirm').length },
    { key: 'completed', name: '已完成', count: base.filter(w => w.status === 'completed').length }
  )
  return tabs
})

// 筛选后的工单（基础筛选 + 状态tab筛选）
const filteredWorkorders = computed(() => {
  if (activeTab.value === 'all') {
    return baseFilteredWorkorders.value
  }
  return baseFilteredWorkorders.value.filter(order => order.status === activeTab.value)
})

// 分页加载
const pageSize = 10
const displayCount = ref(pageSize)

const displayedWorkorders = computed(() => {
  return filteredWorkorders.value.slice(0, displayCount.value)
})

const hasMore = computed(() => displayCount.value < filteredWorkorders.value.length)

const loadMore = () => {
  if (hasMore.value) {
    displayCount.value += pageSize
  }
}

// 滚动加载（监听window滚动）
const onWindowScroll = () => {
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop
  const windowHeight = window.innerHeight
  const docHeight = document.documentElement.scrollHeight
  const threshold = 200
  if (docHeight - scrollTop - windowHeight < threshold && hasMore.value) {
    loadMore()
  }
}

onMounted(() => {
  // 加载工单数据
  loadWorkorders()

  // URL filter参数优先，否则恢复上次Tab状态
  const filter = route.query.filter
  const validFilters = ['all', 'pending_assign', 'pending_accept', 'processing', 'pending_sign', 'techlead_confirm', 'assistant_confirm', 'completed']
  if (filter && validFilters.includes(filter)) {
    activeTab.value = filter
  } else {
    const savedTab = sessionStorage.getItem('workorderList_activeTab')
    if (savedTab) {
      activeTab.value = savedTab
    }
  }

  // 监听工单更新事件
  window.addEventListener('workorder-updated', loadWorkorders)
  // 监听滚动加载
  window.addEventListener('scroll', onWindowScroll)
})

onBeforeUnmount(() => {
  window.removeEventListener('workorder-updated', loadWorkorders)
  window.removeEventListener('scroll', onWindowScroll)
})

// 切换tab或筛选时重置分页
watch([activeTab, searchKeyword, appliedFilters], () => {
  displayCount.value = pageSize
}, { deep: true })

// 方法
const goBack = () => {
  router.back()
}

const viewWorkorderDetail = (order) => {
  // 保存当前Tab状态到sessionStorage，返回时恢复
  sessionStorage.setItem('workorderList_activeTab', activeTab.value)
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

// 判断工单是否已打卡签到
const hasCheckedIn = (order) => {
  try {
    const records = JSON.parse(localStorage.getItem('checkinRecords') || '[]')
    const wid = order.workorderId || order.id
    return records.some(r => r.workorderId === wid && r.status === '已签到')
  } catch { return false }
}

const goToCheckInFromWorkorder = (order) => {
  router.push({
    path: '/staff-checkin',
    query: {
      from: 'workorder',
      workorderId: order.workorderId || order.id,
      customerName: order.customerName || ''
    }
  })
}

const completeWorkorder = (order) => {
  router.push(`/staff-workorder-detail?id=${order.id}&action=complete`)
}

// 分配工程师对话框
const assignDialogVisible = ref(false)
const assignWorkorderData = ref(null)
const assignFormData = reactive({
  selectedEngineerIds: [],
  workContent: '',
  workStartTime: null,
  workEndTime: null,
  vehicle: 'self'
})

const workContentTags = [
  '设备维修', '故障诊断', '配件更换', '设备调试', '试加工测试',
  '设备改造', '操作培训', '定期保养', '检修巡检', '技术指导'
]

const toggleWorkTag = (tag) => {
  const current = assignFormData.workContent || ''
  if (current.includes(tag)) {
    assignFormData.workContent = current.replace(new RegExp(tag + '(、)?'), '').replace(/、$/, '').replace(/^、/, '')
  } else {
    assignFormData.workContent = current ? current + '、' + tag : tag
  }
}

const isTagSelected = (tag) => {
  return (assignFormData.workContent || '').includes(tag)
}

const getCategoryText = (cat) => {
  const map = { installation: '安装工单', service: '服务工单' }
  return map[cat] || cat
}
const getSubTypeText = (sub) => {
  const map = { repair: '维修', trial_processing: '试加工', refitting: '改造' }
  return map[sub] || sub
}
const getWarrantyText = (ws) => {
  const map = { in_warranty: '保内', out_of_warranty: '保外', expired: '过保', in: '保内', out: '保外', unknown: '未知' }
  return map[ws] || ws
}
const getWarrantyTagType = (ws) => {
  const map = { in_warranty: 'success', out_of_warranty: 'warning', expired: 'danger', in: 'success', out: 'danger', unknown: 'info' }
  return map[ws] || 'info'
}

const openAssignDialog = (order) => {
  const fullWo = workorderFlowState.workorders.find(w => w.id === (order.id || order.rawId))
  assignWorkorderData.value = fullWo || order
  assignFormData.selectedEngineerIds = []
  assignFormData.workContent = ''
  assignFormData.workStartTime = null
  assignFormData.workEndTime = null
  assignFormData.vehicle = 'self'
  assignDialogVisible.value = true
}

const confirmAssign = () => {
  if (assignFormData.selectedEngineerIds.length === 0) {
    ElMessage.warning('请选择工程师')
    return
  }
  const primaryEng = engineerList.find(e => e.id === assignFormData.selectedEngineerIds[0])
  if (!primaryEng) return
  const selectedEngineers = assignFormData.selectedEngineerIds.map(id => {
    const eng = engineerList.find(e => e.id === id)
    return eng ? { id: eng.id, name: eng.name, phone: eng.phone } : null
  }).filter(Boolean)

  assignWorkorder(assignWorkorderData.value.id || assignWorkorderData.value.rawId, primaryEng.id, primaryEng.name, primaryEng.phone, {
    engineers: selectedEngineers,
    workContent: assignFormData.workContent,
    workStartTime: assignFormData.workStartTime || '',
    workEndTime: assignFormData.workEndTime || '',
    vehicle: assignFormData.vehicle
  })
  ElMessage.success(`已分配给 ${primaryEng.name}${selectedEngineers.length > 1 ? ` 等${selectedEngineers.length}人` : ''}`)
  assignDialogVisible.value = false
  loadWorkorders()
}

const goToSign = (order) => {
  router.push(`/staff-workorder-detail?id=${order.id}&action=sign`)
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
  background: #1890ff;
  color: white;
  padding: 2px 6px;
  border-radius: 10px;
  max-width: 48px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tab-item.active .tab-count {
  background: white;
  color: #1890ff;
}

/* 列表顶部数量提示 */
.list-summary {
  padding: 8px 15px;
  font-size: 13px;
  color: #8c8c8c;
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

/* 底部加载状态 */
.load-more {
  text-align: center;
  padding: 16px 0 24px;
}

.load-more-text {
  font-size: 13px;
  color: #1890ff;
  cursor: pointer;
}

.no-more-text {
  font-size: 13px;
  color: #bfbfbf;
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

/* 分配工程师对话框 */
.assign-mobile-dialog .assign-dialog-content {
  max-height: calc(100vh - 140px);
  overflow-y: auto;
}
.assign-info-section {
  background: #f5f7fa;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 12px;
}
.assign-section-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 10px;
  padding-left: 8px;
  border-left: 3px solid #409eff;
}
.assign-info-row {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 13px;
  margin-bottom: 6px;
}
.assign-info-row .label {
  color: #909399;
  white-space: nowrap;
  min-width: 56px;
  flex-shrink: 0;
}
.assign-info-row .value {
  color: #303133;
  word-break: break-all;
}
.assign-info-pair {
  display: flex;
  gap: 16px;
  margin-bottom: 6px;
}
.assign-info-pair .assign-info-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  flex: 1;
}
.assign-info-pair .assign-info-item .label {
  color: #909399;
  white-space: nowrap;
  min-width: 50px;
}
.assign-info-pair .assign-info-item .value {
  color: #303133;
  word-break: break-all;
}
.assign-info-desc {
  margin-top: 8px;
  font-size: 13px;
}
.assign-info-desc .label {
  color: #909399;
  display: block;
  margin-bottom: 4px;
}
.assign-info-desc .value {
  color: #303133;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-all;
}
.repair-dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 10px;
}
.repair-title {
  font-size: 18px;
  font-weight: 500;
  color: #262626;
}
.repair-footer {
  display: flex;
  gap: 15px;
  width: 100%;
}
.repair-footer .el-button {
  flex: 1;
}

.work-content-tags {
  margin-top: 10px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.tags-label {
  font-size: 12px;
  color: #909399;
}

.work-tag {
  cursor: pointer;
  user-select: none;
}
</style>
