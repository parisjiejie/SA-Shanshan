<template>
  <div class="techlead-workorder-manage">
    <!-- 顶部导航 -->
    <div class="header">
      <el-button link @click="goBack">
        <el-icon><ArrowLeft /></el-icon>
        <span>返回</span>
      </el-button>
      <span class="header-title">工单管理</span>
      <span class="placeholder"></span>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-cards">
      <div class="stat-card pending">
        <div class="stat-number">{{ pendingCount }}</div>
        <div class="stat-label">待分配</div>
      </div>
      <div class="stat-card in-warranty">
        <div class="stat-number">{{ inWarrantyCount }}</div>
        <div class="stat-label">保内工单</div>
      </div>
      <div class="stat-card out-warranty">
        <div class="stat-number">{{ outWarrantyCount }}</div>
        <div class="stat-label">保外工单</div>
      </div>
    </div>

    <!-- 工单列表 -->
    <div class="workorder-list">
      <div class="list-header">
        <span class="list-title">待分配工单</span>
        <el-tag type="warning">{{ pendingWorkorders.length }} 个待处理</el-tag>
      </div>

      <div
        v-for="workorder in pendingWorkorders"
        :key="workorder.id"
        class="workorder-card"
      >
        <div class="card-header">
          <span class="order-no">{{ workorder.workorderId }}</span>
          <div class="tags">
            <el-tag 
              :type="workorder.warrantyStatus === 'in' ? 'success' : 'danger'"
              size="small"
            >
              {{ workorder.warrantyStatus === 'in' ? '保内' : '保外' }}
            </el-tag>
            <el-tag :type="getUrgencyType(workorder.urgency)" size="small">
              {{ getUrgencyText(workorder.urgency) }}
            </el-tag>
          </div>
        </div>

        <div class="card-body">
          <div class="info-row">
            <el-icon><User /></el-icon>
            <span class="customer-name">{{ workorder.customerName }}</span>
            <span class="customer-phone">{{ workorder.customerPhone }}</span>
          </div>
          <div class="info-row">
            <el-icon><Monitor /></el-icon>
            <span class="device-model">{{ workorder.deviceModel || '未指定设备' }}</span>
          </div>
          <div class="info-row">
            <el-icon><Location /></el-icon>
            <span class="address">{{ workorder.address || '地址未提供' }}</span>
          </div>
          <div class="fault-desc">
            <el-icon><Warning /></el-icon>
            <span>{{ workorder.faultDescription }}</span>
          </div>
          <div class="create-time">
            <el-icon><Clock /></el-icon>
            <span>提交时间：{{ formatDateTime(workorder.createTime) }}</span>
          </div>
        </div>

        <div class="card-footer">
          <template v-if="workorder.warrantyStatus === 'in'">
            <!-- 保内：直接分配工程师 -->
            <el-button type="primary" @click="openAssignDialog(workorder)">
              <el-icon><UserFilled /></el-icon>
              分配工程师
            </el-button>
          </template>
          <template v-else>
            <!-- 保外：发起报价或分配工程师 -->
            <el-button type="warning" @click="openQuotationDialog(workorder)">
              <el-icon><Money /></el-icon>
              发起报价
            </el-button>
            <el-button type="primary" plain @click="openAssignDialog(workorder)">
              <el-icon><UserFilled /></el-icon>
              直接分配
            </el-button>
          </template>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-if="pendingWorkorders.length === 0" class="empty-state">
        <el-icon><DocumentChecked /></el-icon>
        <p>暂无待分配工单</p>
      </div>
    </div>

    <!-- 分配工程师对话框 -->
    <el-dialog
      v-model="assignDialog.visible"
      title="分配工程师"
      width="90%"
      class="mobile-dialog"
    >
      <div v-if="assignDialog.workorder" class="assign-dialog-content">
        <div class="workorder-info">
          <p><strong>工单号：</strong>{{ assignDialog.workorder.workorderId }}</p>
          <p><strong>客户：</strong>{{ assignDialog.workorder.customerName }}</p>
          <p><strong>设备：</strong>{{ assignDialog.workorder.deviceModel || '未指定' }}</p>
        </div>

        <el-divider />

        <div class="engineer-list">
          <div class="section-title">选择工程师</div>
          <div
            v-for="engineer in engineers"
            :key="engineer.id"
            class="engineer-item"
            :class="{ selected: assignDialog.selectedEngineer?.id === engineer.id }"
            @click="selectEngineer(engineer)"
          >
            <el-avatar :size="40" :icon="UserFilled" />
            <div class="engineer-info">
              <span class="name">{{ engineer.name }}</span>
              <span class="phone">{{ engineer.phone }}</span>
              <span class="status" :class="engineer.status">
                {{ engineer.status === 'available' ? '空闲' : '忙碌' }}
              </span>
            </div>
            <el-icon v-if="assignDialog.selectedEngineer?.id === engineer.id" class="check-icon">
              <Check />
            </el-icon>
          </div>
        </div>

        <div class="visit-time">
          <div class="section-title">预约上门时间</div>
          <el-date-picker
            v-model="assignDialog.visitTime"
            type="datetime"
            placeholder="选择上门时间"
            format="YYYY-MM-DD HH:mm"
            value-format="YYYY-MM-DDTHH:mm:ss"
            style="width: 100%"
          />
        </div>

        <div class="remark">
          <div class="section-title">备注（选填）</div>
          <el-input
            v-model="assignDialog.remark"
            type="textarea"
            :rows="3"
            placeholder="输入备注信息..."
          />
        </div>
      </div>

      <template #footer>
        <el-button @click="assignDialog.visible = false">取消</el-button>
        <el-button 
          type="primary" 
          :disabled="!assignDialog.selectedEngineer"
          @click="confirmAssign"
        >
          确认分配
        </el-button>
      </template>
    </el-dialog>

    <!-- 发起报价对话框 -->
    <el-dialog
      v-model="quotationDialog.visible"
      title="发起报价流程"
      width="90%"
      class="mobile-dialog"
    >
      <div v-if="quotationDialog.workorder" class="quotation-dialog-content">
        <div class="workorder-info">
          <p><strong>工单号：</strong>{{ quotationDialog.workorder.workorderId }}</p>
          <p><strong>客户：</strong>{{ quotationDialog.workorder.customerName }}</p>
          <p><strong>设备：</strong>{{ quotationDialog.workorder.deviceModel || '未指定' }}</p>
          <p><strong>保修状态：</strong><el-tag type="danger">保外</el-tag></p>
        </div>

        <el-divider />

        <div class="quotation-notice">
          <el-alert
            title="保外维修需要报价"
            description="该设备已过保修期，需要业务助理制作维修报价单，经客户确认后再安排工程师上门。"
            type="warning"
            :closable="false"
            show-icon
          />
        </div>

        <div class="estimated-cost">
          <div class="section-title">预估费用（选填）</div>
          <el-input
            v-model="quotationDialog.estimatedCost"
            type="number"
            placeholder="输入预估费用"
          >
            <template #append>元</template>
          </el-input>
        </div>

        <div class="remark">
          <div class="section-title">备注</div>
          <el-input
            v-model="quotationDialog.remark"
            type="textarea"
            :rows="3"
            placeholder="输入备注信息，将同步给业务助理..."
          />
        </div>
      </div>

      <template #footer>
        <el-button @click="quotationDialog.visible = false">取消</el-button>
        <el-button type="warning" @click="confirmQuotation">
          发起报价
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  ArrowLeft,
  User,
  Monitor,
  Location,
  Warning,
  Clock,
  UserFilled,
  Check,
  Money,
  DocumentChecked
} from '@element-plus/icons-vue'
import {
  getTechLeadPendingWorkorders,
  assignWorkorder,
  initiateQuotation,
  WorkorderStatusText
} from '../stores/workorderFlowStore.js'

const router = useRouter()

// 待分配工单列表
const pendingWorkorders = ref([])

// 工程师列表（模拟数据）
const engineers = ref([
  { id: 'eng001', name: '李工程师', phone: '13800138001', status: 'available' },
  { id: 'eng002', name: '王工程师', phone: '13800138002', status: 'available' },
  { id: 'eng003', name: '张工程师', phone: '13800138003', status: 'busy' },
  { id: 'eng004', name: '刘工程师', phone: '13800138004', status: 'available' },
])

// 分配对话框
const assignDialog = ref({
  visible: false,
  workorder: null,
  selectedEngineer: null,
  visitTime: '',
  remark: ''
})

// 报价对话框
const quotationDialog = ref({
  visible: false,
  workorder: null,
  estimatedCost: '',
  remark: ''
})

// 统计数量
const pendingCount = computed(() => pendingWorkorders.value.length)
const inWarrantyCount = computed(() => 
  pendingWorkorders.value.filter(w => w.warrantyStatus === 'in').length
)
const outWarrantyCount = computed(() => 
  pendingWorkorders.value.filter(w => w.warrantyStatus === 'out').length
)

// 加载待分配工单
const loadPendingWorkorders = () => {
  pendingWorkorders.value = getTechLeadPendingWorkorders().sort((a, b) => new Date(b.createTime) - new Date(a.createTime))
}

// 获取紧急程度类型
const getUrgencyType = (urgency) => {
  const map = {
    'low': 'info',
    'medium': 'warning',
    'high': 'danger'
  }
  return map[urgency] || 'info'
}

// 获取紧急程度文本
const getUrgencyText = (urgency) => {
  const map = {
    'low': '一般',
    'medium': '紧急',
    'high': '特急'
  }
  return map[urgency] || '一般'
}

// 格式化日期时间
const formatDateTime = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return `${date.getMonth() + 1}月${date.getDate()}日 ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

// 打开分配对话框
const openAssignDialog = (workorder) => {
  assignDialog.value = {
    visible: true,
    workorder,
    selectedEngineer: null,
    visitTime: '',
    remark: ''
  }
}

// 选择工程师
const selectEngineer = (engineer) => {
  assignDialog.value.selectedEngineer = engineer
}

// 确认分配
const confirmAssign = () => {
  const { workorder, selectedEngineer, visitTime, remark } = assignDialog.value
  
  if (!selectedEngineer) {
    ElMessage.warning('请选择工程师')
    return
  }

  // 调用 store 分配工单
  const result = assignWorkorder(
    workorder.id,
    selectedEngineer.id,
    selectedEngineer.name,
    selectedEngineer.phone
  )

  if (result) {
    ElMessage.success(`工单已分配给 ${selectedEngineer.name}`)
    assignDialog.value.visible = false
    loadPendingWorkorders()
  } else {
    ElMessage.error('分配失败，请重试')
  }
}

// 打开报价对话框
const openQuotationDialog = (workorder) => {
  quotationDialog.value = {
    visible: true,
    workorder,
    estimatedCost: '',
    remark: ''
  }
}

// 确认发起报价
const confirmQuotation = () => {
  const { workorder, estimatedCost, remark } = quotationDialog.value
  
  // 调用 store 发起报价流程
  const result = initiateQuotation(workorder.id, null)

  if (result) {
    ElMessage.success('已发起报价流程，业务助理将收到通知')
    quotationDialog.value.visible = false
    loadPendingWorkorders()
  } else {
    ElMessage.error('操作失败，请重试')
  }
}

// 返回上一页
const goBack = () => {
  router.back()
}

// 处理工单更新事件
const handleWorkorderUpdate = (event) => {
  console.log('工单流程更新:', event.detail)
  loadPendingWorkorders()
}

onMounted(() => {
  loadPendingWorkorders()
  window.addEventListener('workorder-flow-updated', handleWorkorderUpdate)
})

onUnmounted(() => {
  window.removeEventListener('workorder-flow-updated', handleWorkorderUpdate)
})
</script>

<style scoped>
.techlead-workorder-manage {
  min-height: 100vh;
  background: #f5f7fa;
  padding-bottom: 20px;
}

/* 顶部导航 */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 15px;
  background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
  color: white;
}

.header .el-button {
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

/* 统计卡片 */
.stats-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  padding: 15px;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 15px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.stat-card.pending {
  border-top: 3px solid #faad14;
}

.stat-card.in-warranty {
  border-top: 3px solid #52c41a;
}

.stat-card.out-warranty {
  border-top: 3px solid #f5222d;
}

.stat-number {
  font-size: 24px;
  font-weight: 600;
  color: #262626;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 13px;
  color: #8c8c8c;
}

/* 工单列表 */
.workorder-list {
  padding: 0 15px;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.list-title {
  font-size: 16px;
  font-weight: 500;
  color: #262626;
}

.workorder-card {
  background: white;
  border-radius: 12px;
  padding: 15px;
  margin-bottom: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.order-no {
  font-size: 15px;
  font-weight: 600;
  color: #1890ff;
  font-family: monospace;
}

.tags {
  display: flex;
  gap: 6px;
}

.card-body {
  margin-bottom: 15px;
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

.customer-name {
  font-weight: 500;
  color: #262626;
}

.customer-phone {
  color: #8c8c8c;
  font-size: 13px;
}

.device-model {
  color: #262626;
}

.address {
  color: #8c8c8c;
  font-size: 13px;
}

.fault-desc {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 10px;
  background: #fff7e6;
  border-radius: 8px;
  margin: 10px 0;
  font-size: 14px;
  color: #262626;
}

.fault-desc .el-icon {
  color: #faad14;
  font-size: 16px;
  margin-top: 2px;
}

.create-time {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #8c8c8c;
}

.card-footer {
  display: flex;
  gap: 10px;
  padding-top: 15px;
  border-top: 1px solid #f0f0f0;
}

.card-footer .el-button {
  flex: 1;
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

/* 对话框样式 */
.assign-dialog-content,
.quotation-dialog-content {
  padding: 10px 0;
}

.workorder-info {
  background: #f5f7fa;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 15px;
}

.workorder-info p {
  margin: 8px 0;
  font-size: 14px;
}

.section-title {
  font-size: 14px;
  font-weight: 500;
  color: #262626;
  margin-bottom: 12px;
}

.engineer-list {
  margin-bottom: 20px;
}

.engineer-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 8px;
  margin-bottom: 10px;
  cursor: pointer;
  transition: all 0.3s;
  border: 2px solid transparent;
}

.engineer-item:hover {
  background: #e6f7ff;
}

.engineer-item.selected {
  border-color: #1890ff;
  background: #e6f7ff;
}

.engineer-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.engineer-info .name {
  font-size: 15px;
  font-weight: 500;
  color: #262626;
}

.engineer-info .phone {
  font-size: 13px;
  color: #8c8c8c;
}

.engineer-info .status {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 10px;
  width: fit-content;
}

.engineer-info .status.available {
  background: #f6ffed;
  color: #52c41a;
}

.engineer-info .status.busy {
  background: #fff2f0;
  color: #f5222d;
}

.check-icon {
  color: #1890ff;
  font-size: 20px;
}

.visit-time,
.remark,
.estimated-cost,
.quotation-notice {
  margin-bottom: 20px;
}

/* 响应式适配 */
@media (min-width: 768px) {
  .techlead-workorder-manage {
    max-width: 414px;
    margin: 0 auto;
    border-left: 1px solid #e8e8e8;
    border-right: 1px solid #e8e8e8;
  }
}
</style>
