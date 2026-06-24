<template>
  <div class="customer-workorder-list">
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
          placeholder="搜索工单号、设备型号、故障描述..."
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
          <div class="device-info" v-if="order.deviceModel">
            <el-icon><Monitor /></el-icon>
            <span>{{ order.deviceModel }}</span>
          </div>
          <p class="order-desc" v-if="order.faultDescription">
            {{ order.faultDescription }}
          </p>
          <p class="order-desc" v-else-if="order.description">
            {{ order.description }}
          </p>
        </div>
        <div class="card-footer">
          <span class="order-time">{{ formatDate(order.createTime) }}</span>
          <el-button
            v-if="order.status === 'pending_sign'"
            type="primary"
            size="small"
            @click.stop="handleSign(order)"
          >
            去签字
          </el-button>
          <el-button
            v-else-if="order.status === 'quotation_pending'"
            type="warning"
            size="small"
            @click.stop="viewQuotation(order)"
          >
            查看报价
          </el-button>
        </div>
      </div>

      <!-- 空状态 -->
      <div class="empty-state" v-if="filteredWorkorders.length === 0">
        <el-icon><Document /></el-icon>
        <p>暂无{{ getTabName(activeTab) }}工单</p>
      </div>

      <!-- 底部加载状态 -->
      <div class="load-more" v-if="filteredWorkorders.length > 0">
        <span v-if="hasMore" class="load-more-text" @click="loadMore">上拉加载更多</span>
        <span v-else class="no-more-text">没有更多了</span>
      </div>
    </div>

    <!-- 新建工单按钮 -->
    <div class="fab-button" @click="createWorkorder">
      <el-icon><Plus /></el-icon>
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
import { ref, computed, onMounted, onBeforeUnmount, onUnmounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  ArrowLeft,
  Monitor,
  Document,
  Plus,
  Search,
  Filter,
  CircleClose
} from '@element-plus/icons-vue'
import {
  getCustomerWorkorders,
  WorkorderStatusText,
  WorkorderStatusType,
  state as workorderFlowState
} from '../stores/workorderFlowStore.js'

const router = useRouter()
const route = useRoute()

// 当前选中的标签
const activeTab = ref('all')

// 搜索关键词
const searchKeyword = ref('')

// 是否显示筛选对话框
const showFilter = ref(false)

// 筛选表单
const filterForm = ref({
  type: '',
  timeRange: ''
})

// 已应用的筛选条件
const appliedFilters = ref({
  type: '',
  timeRange: ''
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
  return filters
})

// 当前客户ID
const currentCustomerId = ref('guest')

// 加载工单数据
const loadWorkorders = () => {
  // 获取当前客户信息
  let customerId = 'guest'
  let customerName = ''
  try {
    const auth = JSON.parse(localStorage.getItem('staffAuth') || '{}')
    customerId = auth.id || auth.userId || 'guest'
    customerName = auth.name || ''
  } catch (e) {
    console.error('读取客户信息失败:', e)
  }
  currentCustomerId.value = customerId

  // 获取该客户的工单
  let customerWorkorders = getCustomerWorkorders(customerId, customerName)
  
  console.log('客户工单:', { customerId, customerName, count: customerWorkorders.length })
  
  // 转换为组件需要的格式
  workorders.value = customerWorkorders.map(w => ({
    id: w.id,
    workorderId: w.workorderId,
    type: 'service',
    category: w.category,
    subType: w.subType,
    deviceModel: w.deviceModel,
    faultDescription: w.faultDescription,
    description: w.faultDescription,
    status: w.status,
    createTime: new Date(w.createTime),
    engineer: w.engineerName || ''
  }))
}

// 页面加载时读取URL参数
onMounted(() => {
  const filter = route.query.filter
  if (filter && ['all', 'pending_assign', 'pending_accept', 'processing', 'pending_sign', 'techlead_confirm', 'assistant_confirm', 'completed'].includes(filter)) {
    activeTab.value = filter
  }
  
  // 加载工单数据
  loadWorkorders()
  
  // 监听工单更新事件
  window.addEventListener('workorder-flow-updated', handleWorkorderUpdate)
  // 监听滚动加载
  window.addEventListener('scroll', onWindowScroll)
})

// 组件卸载时移除监听
onBeforeUnmount(() => {
  window.removeEventListener('scroll', onWindowScroll)
})

onUnmounted(() => {
  window.removeEventListener('workorder-flow-updated', handleWorkorderUpdate)
})

// 处理工单更新事件
const handleWorkorderUpdate = (event) => {
  console.log('工单流程更新:', event.detail)
  loadWorkorders()
}

// 工单列表
const workorders = ref([])

// 基础筛选（搜索+筛选条件，不含状态tab筛选）
const baseFilteredWorkorders = computed(() => {
  let result = workorders.value

  // 按关键词搜索
  if (searchKeyword.value.trim()) {
    const keyword = searchKeyword.value.toLowerCase().trim()
    result = result.filter(order => {
      if (order.workorderId && order.workorderId.toLowerCase().includes(keyword)) return true
      if (order.deviceModel && order.deviceModel.toLowerCase().includes(keyword)) return true
      if (order.faultDescription && order.faultDescription.toLowerCase().includes(keyword)) return true
      if (order.description && order.description.toLowerCase().includes(keyword)) return true
      return false
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

  return result.sort((a, b) => new Date(b.createTime) - new Date(a.createTime))
})

// 状态标签（数字从筛选后数据计算）
const statusTabs = computed(() => {
  const base = baseFilteredWorkorders.value
  return [
    { key: 'all', name: '全部', count: base.length },
    { key: 'pending_assign', name: '待分配', count: base.filter(w => w.status === 'pending_assign').length },
    { key: 'pending_accept', name: '待接单', count: base.filter(w => w.status === 'pending_accept').length },
    { key: 'processing', name: '进行中', count: base.filter(w => w.status === 'processing').length },
    { key: 'pending_sign', name: '待签字', count: base.filter(w => w.status === 'pending_sign').length },
    { key: 'techlead_confirm', name: '课长确认', count: base.filter(w => w.status === 'techlead_confirm').length },
    { key: 'assistant_confirm', name: '业务确认', count: base.filter(w => w.status === 'assistant_confirm').length },
    { key: 'completed', name: '已完成', count: base.filter(w => w.status === 'completed').length }
  ]
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

// 切换tab或筛选时重置分页
watch([activeTab, searchKeyword, appliedFilters], () => {
  displayCount.value = pageSize
}, { deep: true })

// 搜索处理
const handleSearch = () => {}

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
    timeRange: ''
  }
}

const removeFilter = (key) => {
  appliedFilters.value[key] = ''
  filterForm.value[key] = ''
}

const clearAllFilters = () => {
  appliedFilters.value = {
    type: '',
    timeRange: ''
  }
  filterForm.value = {
    type: '',
    timeRange: ''
  }
}

// 返回上一页
const goBack = () => {
  router.back()
}

// 获取标签名称
const getTabName = (key) => {
  const tab = statusTabs.value.find(t => t.key === key)
  return tab ? tab.name : ''
}

// 获取状态类型
const getStatusType = (status) => {
  return WorkorderStatusType[status] || 'info'
}

// 获取状态文本
const getStatusText = (status) => {
  return WorkorderStatusText[status] || status
}

// 格式化日期
const formatDate = (date) => {
  if (!date) return ''
  const d = new Date(date)
  const now = new Date()
  const diff = now - d
  const days = Math.floor(diff / 86400000)

  if (days === 0) {
    return '今天'
  } else if (days === 1) {
    return '昨天'
  } else if (days < 7) {
    return `${days}天前`
  } else {
    return `${d.getMonth() + 1}月${d.getDate()}日`
  }
}

// 查看工单详情
const viewWorkorderDetail = (order) => {
  router.push(`/customer-workorder-detail?id=${order.id}`)
}

// 处理签字
const handleSign = (order) => {
  router.push(`/customer-workorder-detail?id=${order.id}&action=sign`)
}

// 查看报价
const viewQuotation = (order) => {
  router.push(`/customer-workorder-detail?id=${order.id}&action=quotation`)
}

// 新建工单
const createWorkorder = () => {
  // 跳转到客户工作台并打开报修对话框
  router.push('/customer-workspace?action=repair')
}
</script>

<style scoped>
.customer-workorder-list {
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
  background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
  padding: 15px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: white;
  position: sticky;
  top: 0;
  z-index: 100;
}

.list-header .el-button {
  color: white;
  font-size: 14px;
}

.header-title {
  font-size: 18px;
  font-weight: 500;
}

.placeholder {
  width: 60px;
}

/* 状态标签 */
.status-tabs {
  display: flex;
  gap: 8px;
  padding: 15px;
  background: white;
  margin-bottom: 15px;
  overflow-x: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
  -webkit-overflow-scrolling: touch;
}

.status-tabs::-webkit-scrollbar {
  display: none;
}

.tab-item {
  padding: 8px 16px;
  background: #f5f5f5;
  border-radius: 20px;
  font-size: 14px;
  color: #595959;
  cursor: pointer;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.3s;
}

.tab-item.active {
  background: #1890ff;
  color: white;
}

.tab-count {
  background: #1890ff;
  color: white;
  font-size: 12px;
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

/* 筛选对话框 */
.filter-dialog .filter-section {
  padding: 10px 0;
}

.filter-dialog .filter-group {
  margin-bottom: 20px;
}

.filter-dialog .filter-label {
  font-size: 14px;
  font-weight: 500;
  color: #262626;
  margin-bottom: 10px;
}

.filter-dialog .filter-options {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

/* 工单列表 */
.workorder-list {
  padding: 0 15px;
}

.workorder-card {
  background: white;
  border-radius: 12px;
  padding: 15px;
  margin-bottom: 12px;
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
  font-size: 14px;
  color: #8c8c8c;
  font-family: monospace;
}

.card-body {
  margin-bottom: 12px;
}

.device-info {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 15px;
  color: #262626;
  margin-bottom: 8px;
  font-weight: 500;
}

.device-info .el-icon {
  color: #1890ff;
}

.order-desc {
  font-size: 14px;
  color: #595959;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.order-time {
  font-size: 13px;
  color: #8c8c8c;
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

/* 新建工单按钮 */
.fab-button {
  position: fixed;
  bottom: 30px;
  right: 20px;
  width: 56px;
  height: 56px;
  background: #1890ff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 24px;
  box-shadow: 0 4px 12px rgba(24, 144, 255, 0.4);
  cursor: pointer;
  transition: all 0.3s;
  z-index: 100;
}

.fab-button:active {
  transform: scale(0.95);
}

/* 小屏幕适配 */
@media (max-width: 375px) {
  .list-header {
    padding: 12px;
  }

  .header-title {
    font-size: 16px;
  }

  .status-tabs {
    padding: 12px;
  }

  .tab-item {
    padding: 6px 12px;
    font-size: 13px;
  }

  .workorder-list {
    padding: 0 12px;
  }

  .workorder-card {
    padding: 12px;
  }

  .fab-button {
    width: 50px;
    height: 50px;
    font-size: 20px;
  }
}

/* 平板及以上 */
@media (min-width: 768px) {
  .customer-workorder-list {
    max-width: 414px;
    margin: 0 auto;
    border-left: 1px solid #e8e8e8;
    border-right: 1px solid #e8e8e8;
  }

  .fab-button {
    right: calc(50% - 207px + 20px);
  }
}
</style>
