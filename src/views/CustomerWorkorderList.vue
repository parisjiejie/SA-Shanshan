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

    <!-- 搜索框 -->
    <div class="search-box">
      <el-input
        v-model="searchKeyword"
        placeholder="搜索工单号、设备型号、故障描述..."
        clearable
        size="large"
        :prefix-icon="Search"
      />
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
    </div>

    <!-- 新建工单按钮 -->
    <div class="fab-button" @click="createWorkorder">
      <el-icon><Plus /></el-icon>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  ArrowLeft,
  Monitor,
  Document,
  Plus,
  Search
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
})

// 组件卸载时移除监听
onUnmounted(() => {
  window.removeEventListener('workorder-flow-updated', handleWorkorderUpdate)
})

// 处理工单更新事件
const handleWorkorderUpdate = (event) => {
  console.log('工单流程更新:', event.detail)
  loadWorkorders()
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

// 工单列表
const workorders = ref([])

// 筛选后的工单
const filteredWorkorders = computed(() => {
  let result = workorders.value

  // 按状态筛选
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

  // 按关键词搜索
  if (searchKeyword.value.trim()) {
    const keyword = searchKeyword.value.toLowerCase().trim()
    result = result.filter(order => {
      // 搜索工单号
      if (order.workorderId && order.workorderId.toLowerCase().includes(keyword)) {
        return true
      }
      // 搜索设备型号
      if (order.deviceModel && order.deviceModel.toLowerCase().includes(keyword)) {
        return true
      }
      // 搜索故障描述
      if (order.faultDescription && order.faultDescription.toLowerCase().includes(keyword)) {
        return true
      }
      // 搜索描述
      if (order.description && order.description.toLowerCase().includes(keyword)) {
        return true
      }
      return false
    })
  }

  return result.sort((a, b) => new Date(b.createTime) - new Date(a.createTime))
})

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
  background: #ff4d4f;
  color: white;
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 10px;
}

.tab-item.active .tab-count {
  background: white;
  color: #1890ff;
}

/* 搜索框 */
.search-box {
  padding: 0 15px 15px;
  background: white;
}

.search-box .el-input {
  --el-input-border-radius: 25px;
}

.search-box .el-input__wrapper {
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  padding: 0 15px;
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
