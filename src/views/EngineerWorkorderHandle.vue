<template>
  <div class="engineer-workorder-handle">
    <!-- 顶部导航 -->
    <div class="header">
      <el-button link @click="goBack">
        <el-icon><ArrowLeft /></el-icon>
        <span>返回</span>
      </el-button>
      <span class="header-title">我的工单</span>
      <span class="placeholder"></span>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-cards">
      <div class="stat-card assigned">
        <div class="stat-number">{{ assignedCount }}</div>
        <div class="stat-label">待接单</div>
      </div>
      <div class="stat-card processing">
        <div class="stat-number">{{ processingCount }}</div>
        <div class="stat-label">进行中</div>
      </div>
      <div class="stat-card pending-sign">
        <div class="stat-number">{{ pendingSignCount }}</div>
        <div class="stat-label">待签字</div>
      </div>
    </div>

    <!-- 状态标签 -->
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

    <!-- 工单列表 -->
    <div class="workorder-list">
      <div
        v-for="workorder in filteredWorkorders"
        :key="workorder.id"
        class="workorder-card"
        @click="viewWorkorderDetail(workorder)"
      >
        <div class="card-header">
          <span class="order-no">{{ workorder.workorderId }}</span>
          <el-tag :type="getStatusType(workorder.status)" size="small">
            {{ getStatusText(workorder.status) }}
          </el-tag>
        </div>

        <div class="card-body">
          <div class="info-row">
            <el-icon><User /></el-icon>
            <span class="customer-name">{{ workorder.customerName }}</span>
            <a :href="`tel:${workorder.customerPhone}`" class="phone-link" @click.stop>
              <el-icon><Phone /></el-icon>
              {{ workorder.customerPhone }}
            </a>
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
        </div>

        <div class="card-footer">
          <!-- 待接单状态 -->
          <template v-if="workorder.status === 'pending_accept'">
            <el-button type="primary" @click.stop="openAcceptDialog(workorder)">
              <el-icon><Check /></el-icon>
              接单
            </el-button>
            <el-button @click.stop="rejectWorkorder(workorder)">
              <el-icon><Close /></el-icon>
              拒单
            </el-button>
          </template>

          <!-- 进行中状态 -->
          <template v-else-if="workorder.status === 'processing'">
            <el-button type="success" @click.stop="openCheckInDialog(workorder)">
              <el-icon><MapLocation /></el-icon>
              签到
            </el-button>
            <el-button type="primary" @click.stop="openServiceReportDialog(workorder)">
              <el-icon><Document /></el-icon>
              提交报告
            </el-button>
          </template>

          <!-- 待签字状态 -->
          <template v-else-if="workorder.status === 'pending_sign'">
            <el-button type="warning" @click.stop="openSignOptions(workorder)">
              <el-icon><EditPen /></el-icon>
              客户签字
            </el-button>
          </template>

          <!-- 其他状态 -->
          <template v-else>
            <el-button type="info" disabled>
              {{ getStatusText(workorder.status) }}
            </el-button>
          </template>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-if="filteredWorkorders.length === 0" class="empty-state">
        <el-icon><DocumentChecked /></el-icon>
        <p>暂无{{ getTabName(activeTab) }}工单</p>
      </div>
    </div>

    <!-- 接单对话框 -->
    <el-dialog
      v-model="acceptDialog.visible"
      title="确认接单"
      width="90%"
      class="mobile-dialog"
    >
      <div v-if="acceptDialog.workorder" class="dialog-content">
        <div class="workorder-info">
          <p><strong>工单号：</strong>{{ acceptDialog.workorder.workorderId }}</p>
          <p><strong>客户：</strong>{{ acceptDialog.workorder.customerName }}</p>
          <p><strong>地址：</strong>{{ acceptDialog.workorder.address }}</p>
        </div>

        <el-divider />

        <div class="visit-time">
          <div class="section-title">预计上门时间</div>
          <el-date-picker
            v-model="acceptDialog.visitTime"
            type="datetime"
            placeholder="选择预计上门时间"
            format="YYYY-MM-DD HH:mm"
            value-format="YYYY-MM-DDTHH:mm:ss"
            style="width: 100%"
          />
        </div>

        <div class="remark">
          <div class="section-title">备注（选填）</div>
          <el-input
            v-model="acceptDialog.remark"
            type="textarea"
            :rows="3"
            placeholder="输入备注信息..."
          />
        </div>
      </div>

      <template #footer>
        <el-button @click="acceptDialog.visible = false">取消</el-button>
        <el-button type="primary" @click="confirmAccept">
          确认接单
        </el-button>
      </template>
    </el-dialog>

    <!-- 签到对话框 -->
    <el-dialog
      v-model="checkInDialog.visible"
      title="到场签到"
      width="90%"
      class="mobile-dialog"
    >
      <div v-if="checkInDialog.workorder" class="dialog-content">
        <div class="workorder-info">
          <p><strong>工单号：</strong>{{ checkInDialog.workorder.workorderId }}</p>
          <p><strong>客户：</strong>{{ checkInDialog.workorder.customerName }}</p>
          <p><strong>地址：</strong>{{ checkInDialog.workorder.address }}</p>
        </div>

        <el-divider />

        <div class="location-info">
          <div class="section-title">当前位置</div>
          <div class="location-display">
            <el-icon><MapLocation /></el-icon>
            <span>{{ checkInDialog.location || '正在获取位置...' }}</span>
          </div>
          <el-button 
            v-if="!checkInDialog.location" 
            type="primary" 
            plain 
            @click="getCurrentLocation"
            :loading="checkInDialog.locating"
          >
            获取位置
          </el-button>
        </div>

        <div class="checkin-photos">
          <div class="section-title">现场照片（选填）</div>
          <div class="photo-upload">
            <div 
              v-for="(photo, index) in checkInDialog.photos" 
              :key="index"
              class="photo-item"
            >
              <img :src="photo" alt="现场照片" />
              <el-icon class="delete-btn" @click="removePhoto(index)"><Close /></el-icon>
            </div>
            <div class="upload-btn" @click="takePhoto" v-if="checkInDialog.photos.length < 4">
              <el-icon><Camera /></el-icon>
              <span>拍照</span>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <el-button @click="checkInDialog.visible = false">取消</el-button>
        <el-button 
          type="success" 
          @click="confirmCheckIn"
          :disabled="!checkInDialog.location"
        >
          确认签到
        </el-button>
      </template>
    </el-dialog>

    <!-- 服务报告对话框 -->
    <el-dialog
      v-model="serviceReportDialog.visible"
      title="服务报告"
      width="90%"
      class="mobile-dialog"
    >
      <div v-if="serviceReportDialog.workorder" class="dialog-content">
        <div class="report-form">
          <div class="form-item">
            <div class="section-title">故障现象</div>
            <el-input
              v-model="serviceReportDialog.faultPhenomenon"
              type="textarea"
              :rows="3"
              placeholder="描述设备故障现象..."
            />
          </div>

          <div class="form-item">
            <div class="section-title">故障原因</div>
            <el-input
              v-model="serviceReportDialog.faultReason"
              type="textarea"
              :rows="3"
              placeholder="分析故障原因..."
            />
          </div>

          <div class="form-item">
            <div class="section-title">维修措施</div>
            <el-input
              v-model="serviceReportDialog.repairMeasures"
              type="textarea"
              :rows="3"
              placeholder="描述维修措施..."
            />
          </div>

          <div class="form-item">
            <div class="section-title">更换配件</div>
            <div class="parts-list">
              <div 
                v-for="(part, index) in serviceReportDialog.parts" 
                :key="index"
                class="part-item"
              >
                <el-input v-model="part.name" placeholder="配件名称" />
                <el-input v-model="part.quantity" placeholder="数量" style="width: 80px" />
                <el-icon class="delete-btn" @click="removePart(index)"><Close /></el-icon>
              </div>
              <el-button type="primary" plain @click="addPart">
                <el-icon><Plus /></el-icon>
                添加配件
              </el-button>
            </div>
          </div>

          <div class="form-item">
            <div class="section-title">维修结果</div>
            <el-radio-group v-model="serviceReportDialog.result">
              <el-radio-button value="repaired">已修复</el-radio-button>
              <el-radio-button value="unrepairable">无法修复</el-radio-button>
              <el-radio-button value="parts_needed">需更换配件</el-radio-button>
            </el-radio-group>
          </div>

          <div class="form-item">
            <div class="section-title">维修费用（元）</div>
            <el-input
              v-model="serviceReportDialog.cost"
              type="number"
              placeholder="输入维修费用"
            />
          </div>

          <div class="form-item">
            <div class="section-title">备注</div>
            <el-input
              v-model="serviceReportDialog.remark"
              type="textarea"
              :rows="3"
              placeholder="其他备注信息..."
            />
          </div>
        </div>
      </div>

      <template #footer>
        <el-button @click="serviceReportDialog.visible = false">取消</el-button>
        <el-button type="primary" @click="confirmServiceReport">
          提交报告
        </el-button>
      </template>
    </el-dialog>

    <!-- 签字选项对话框 -->
    <el-dialog
      v-model="signOptionsDialog.visible"
      title="客户签字"
      width="90%"
      class="mobile-dialog"
    >
      <div class="sign-options">
        <div class="option-card" @click="goToOnSiteSign">
          <div class="option-icon">
            <el-icon><EditPen /></el-icon>
          </div>
          <div class="option-content">
            <h4>现场签字</h4>
            <p>客户在工程师手机上直接签字确认</p>
          </div>
          <el-icon class="arrow"><ArrowRight /></el-icon>
        </div>

        <div class="option-card" @click="pushToCustomerSign">
          <div class="option-icon blue">
            <el-icon><Message /></el-icon>
          </div>
          <div class="option-content">
            <h4>推送签字</h4>
            <p>发送签字链接到客户手机，客户远程签字</p>
          </div>
          <el-icon class="arrow"><ArrowRight /></el-icon>
        </div>
      </div>
    </el-dialog>

    <!-- 隐藏的文件输入 -->
    <input
      ref="fileInput"
      type="file"
      accept="image/*"
      capture="environment"
      style="display: none"
      @change="handlePhotoChange"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  ArrowLeft,
  User,
  Phone,
  Monitor,
  Location,
  Warning,
  Check,
  Close,
  MapLocation,
  Document,
  EditPen,
  Camera,
  Plus,
  ArrowRight,
  Message,
  DocumentChecked
} from '@element-plus/icons-vue'
import {
  getEngineerWorkorders,
  acceptWorkorder,
  checkInWorkorder,
  completeWorkorder,
  WorkorderStatusText,
  WorkorderStatusType
} from '../stores/workorderFlowStore.js'

const router = useRouter()

// 当前工程师ID（从localStorage获取）
const currentEngineerId = ref('eng001')

// 工单列表
const workorders = ref([])

// 当前选中的标签
const activeTab = ref('all')

// 文件输入引用
const fileInput = ref(null)

// 对话框状态
const acceptDialog = ref({
  visible: false,
  workorder: null,
  visitTime: '',
  remark: ''
})

const checkInDialog = ref({
  visible: false,
  workorder: null,
  location: '',
  locating: false,
  photos: []
})

const serviceReportDialog = ref({
  visible: false,
  workorder: null,
  faultPhenomenon: '',
  faultReason: '',
  repairMeasures: '',
  parts: [],
  result: 'repaired',
  cost: '',
  remark: ''
})

const signOptionsDialog = ref({
  visible: false,
  workorder: null
})

// 状态标签
const statusTabs = computed(() => [
  { 
    key: 'all', 
    name: '全部', 
    count: workorders.value.length 
  },
  { 
    key: 'pending_accept', 
    name: '待接单', 
    count: workorders.value.filter(w => w.status === 'pending_accept').length 
  },
  { 
    key: 'processing', 
    name: '进行中', 
    count: workorders.value.filter(w => w.status === 'processing').length 
  },
  { 
    key: 'pending_sign', 
    name: '待签字', 
    count: workorders.value.filter(w => w.status === 'pending_sign').length 
  }
])

// 统计数量
const assignedCount = computed(() => 
  workorders.value.filter(w => w.status === 'pending_accept').length
)
const processingCount = computed(() => 
  workorders.value.filter(w => w.status === 'processing').length
)
const pendingSignCount = computed(() => 
  workorders.value.filter(w => w.status === 'pending_sign').length
)

// 筛选后的工单
const filteredWorkorders = computed(() => {
  const sortByTime = (arr) => [...arr].sort((a, b) => new Date(b.createTime) - new Date(a.createTime))
  if (activeTab.value === 'all') return sortByTime(workorders.value)
  return sortByTime(workorders.value.filter(w => w.status === activeTab.value))
})

// 加载工单数据
const loadWorkorders = () => {
  // 获取当前工程师信息
  try {
    const staffAuth = JSON.parse(localStorage.getItem('staffAuth') || '{}')
    if (staffAuth.userId) {
      currentEngineerId.value = staffAuth.userId
    }
  } catch (e) {
    console.error('读取工程师信息失败:', e)
  }

  // 从 store 获取工单列表
  const engineerWorkorders = getEngineerWorkorders(currentEngineerId.value, staffAuth.name || '')
  workorders.value = engineerWorkorders
}

// 获取状态类型
const getStatusType = (status) => {
  return WorkorderStatusType[status] || 'info'
}

// 获取状态文本
const getStatusText = (status) => {
  return WorkorderStatusText[status] || status
}

// 获取标签名称
const getTabName = (key) => {
  const tab = statusTabs.value.find(t => t.key === key)
  return tab ? tab.name : ''
}

// 查看工单详情
const viewWorkorderDetail = (workorder) => {
  // 可以跳转到详情页或展开更多信息
  console.log('查看工单详情:', workorder)
}

// 打开接单对话框
const openAcceptDialog = (workorder) => {
  acceptDialog.value = {
    visible: true,
    workorder,
    visitTime: '',
    remark: ''
  }
}

// 确认接单
const confirmAccept = () => {
  const { workorder } = acceptDialog.value
  
  const result = acceptWorkorder(workorder.id, currentEngineerId.value)
  
  if (result) {
    ElMessage.success('接单成功')
    acceptDialog.value.visible = false
    loadWorkorders()
  } else {
    ElMessage.error('接单失败，请重试')
  }
}

// 拒单
const rejectWorkorder = (workorder) => {
  ElMessage.info('拒单功能开发中')
}

// 打开签到对话框
const openCheckInDialog = (workorder) => {
  checkInDialog.value = {
    visible: true,
    workorder,
    location: '',
    locating: false,
    photos: []
  }
  // 自动获取位置
  getCurrentLocation()
}

// 获取当前位置
const getCurrentLocation = () => {
  checkInDialog.value.locating = true
  
  if (!navigator.geolocation) {
    ElMessage.warning('您的浏览器不支持地理定位')
    checkInDialog.value.locating = false
    return
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const { latitude, longitude } = position.coords
      checkInDialog.value.location = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
      checkInDialog.value.locating = false
    },
    (error) => {
      console.error('获取位置失败:', error)
      ElMessage.warning('获取位置失败，请手动输入')
      checkInDialog.value.locating = false
    },
    { enableHighAccuracy: true, timeout: 10000 }
  )
}

// 拍照
const takePhoto = () => {
  fileInput.value?.click()
}

// 处理照片选择
const handlePhotoChange = (event) => {
  const file = event.target.files[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (e) => {
    checkInDialog.value.photos.push(e.target.result)
  }
  reader.readAsDataURL(file)

  // 清空input，允许重复选择
  event.target.value = ''
}

// 删除照片
const removePhoto = (index) => {
  checkInDialog.value.photos.splice(index, 1)
}

// 确认签到
const confirmCheckIn = () => {
  const { workorder, location, photos } = checkInDialog.value
  
  const result = checkInWorkorder(workorder.id, {
    coordinates: location,
    photos: photos
  })
  
  if (result) {
    ElMessage.success('签到成功')
    checkInDialog.value.visible = false
    loadWorkorders()
  } else {
    ElMessage.error('签到失败，请重试')
  }
}

// 打开服务报告对话框
const openServiceReportDialog = (workorder) => {
  serviceReportDialog.value = {
    visible: true,
    workorder,
    faultPhenomenon: '',
    faultReason: '',
    repairMeasures: '',
    parts: [],
    result: 'repaired',
    cost: '',
    remark: ''
  }
}

// 添加配件
const addPart = () => {
  serviceReportDialog.value.parts.push({ name: '', quantity: 1 })
}

// 删除配件
const removePart = (index) => {
  serviceReportDialog.value.parts.splice(index, 1)
}

// 确认提交服务报告
const confirmServiceReport = () => {
  const { workorder, faultPhenomenon, faultReason, repairMeasures, parts, result, cost, remark } = serviceReportDialog.value
  
  if (!faultPhenomenon || !repairMeasures) {
    ElMessage.warning('请填写故障现象和维修措施')
    return
  }
  
  const serviceReport = {
    faultPhenomenon,
    faultReason,
    repairMeasures,
    parts: parts.filter(p => p.name),
    result,
    cost: parseFloat(cost) || 0,
    remark,
    submitTime: new Date().toISOString()
  }
  
  const result2 = completeWorkorder(workorder.id, serviceReport)
  
  if (result2) {
    ElMessage.success('服务报告已提交，等待客户签字')
    serviceReportDialog.value.visible = false
    loadWorkorders()
  } else {
    ElMessage.error('提交失败，请重试')
  }
}

// 打开签字选项
const openSignOptions = (workorder) => {
  signOptionsDialog.value = {
    visible: true,
    workorder
  }
}

// 现场签字
const goToOnSiteSign = () => {
  const workorder = signOptionsDialog.value.workorder
  signOptionsDialog.value.visible = false
  router.push(`/staff-workorder-detail?id=${workorder.id}&action=sign`)
}

// 推送签字给客户
const pushToCustomerSign = () => {
  const workorder = signOptionsDialog.value.workorder
  
  // 发送通知给客户
  // 这里会触发通知系统
  window.dispatchEvent(new CustomEvent('push-customer-sign', {
    detail: { workorderId: workorder.id }
  }))
  
  ElMessage.success('签字链接已推送给客户')
  signOptionsDialog.value.visible = false
}

// 返回上一页
const goBack = () => {
  router.back()
}

// 处理工单更新事件
const handleWorkorderUpdate = (event) => {
  console.log('工单流程更新:', event.detail)
  loadWorkorders()
}

onMounted(() => {
  loadWorkorders()
  window.addEventListener('workorder-flow-updated', handleWorkorderUpdate)
})

onUnmounted(() => {
  window.removeEventListener('workorder-flow-updated', handleWorkorderUpdate)
})
</script>

<style scoped>
.engineer-workorder-handle {
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

.stat-card.assigned {
  border-top: 3px solid #faad14;
}

.stat-card.processing {
  border-top: 3px solid #1890ff;
}

.stat-card.pending-sign {
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

/* 状态标签 */
.status-tabs {
  display: flex;
  gap: 8px;
  padding: 0 15px 15px;
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
  background: white;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.3s;
  white-space: nowrap;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.tab-item.active {
  background: #1890ff;
  color: white;
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
  font-size: 15px;
  font-weight: 600;
  color: #1890ff;
  font-family: monospace;
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

.phone-link {
  color: #1890ff;
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 4px;
  margin-left: auto;
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
  margin-top: 10px;
  font-size: 14px;
  color: #262626;
}

.fault-desc .el-icon {
  color: #faad14;
  font-size: 16px;
  margin-top: 2px;
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
.dialog-content {
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

.visit-time,
.remark,
.location-info,
.checkin-photos,
.form-item {
  margin-bottom: 20px;
}

.location-display {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 8px;
  margin-bottom: 10px;
  font-size: 14px;
  color: #262626;
}

.location-display .el-icon {
  color: #52c41a;
  font-size: 20px;
}

/* 照片上传 */
.photo-upload {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.photo-item {
  position: relative;
  width: 80px;
  height: 80px;
  border-radius: 8px;
  overflow: hidden;
}

.photo-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.photo-item .delete-btn {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 20px;
  height: 20px;
  background: rgba(0,0,0,0.5);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.upload-btn {
  width: 80px;
  height: 80px;
  border: 2px dashed #d9d9d9;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #8c8c8c;
  font-size: 12px;
}

.upload-btn .el-icon {
  font-size: 24px;
  margin-bottom: 4px;
}

/* 配件列表 */
.parts-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.part-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.part-item .delete-btn {
  color: #f5222d;
  cursor: pointer;
  font-size: 18px;
}

/* 签字选项 */
.sign-options {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.option-card {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 20px;
  background: white;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s;
  border: 1px solid #e8e8e8;
}

.option-card:hover {
  border-color: #1890ff;
  box-shadow: 0 2px 12px rgba(24,144,255,0.15);
}

.option-icon {
  width: 50px;
  height: 50px;
  background: #f6ffed;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #52c41a;
  font-size: 24px;
}

.option-icon.blue {
  background: #e6f7ff;
  color: #1890ff;
}

.option-content {
  flex: 1;
}

.option-content h4 {
  margin: 0 0 6px;
  font-size: 16px;
  color: #262626;
}

.option-content p {
  margin: 0;
  font-size: 13px;
  color: #8c8c8c;
}

.arrow {
  color: #bfbfbf;
  font-size: 20px;
}

/* 响应式适配 */
@media (min-width: 768px) {
  .engineer-workorder-handle {
    max-width: 414px;
    margin: 0 auto;
    border-left: 1px solid #e8e8e8;
    border-right: 1px solid #e8e8e8;
  }
}
</style>
