<template>
  <div class="asset-detail">
    <!-- 移动端设备详情页 -->
    <div class="mobile-asset-detail">
      <!-- 顶部导航 -->
      <div class="detail-header">
        <el-button link @click="goBack">
          <el-icon><ArrowLeft /></el-icon>
        </el-button>
        <span class="header-title">设备详情</span>
        <el-button link @click="showMoreActions">
          <el-icon><More /></el-icon>
        </el-button>
      </div>

      <!-- 设备基本信息卡片 -->
      <div class="device-info-card" v-if="deviceInfo">
        <div class="device-header">
          <div class="device-icon">
            <el-icon><Monitor /></el-icon>
          </div>
          <div class="device-title">
            <h3>{{ deviceInfo.model }}</h3>
            <p class="device-sn">序列号: {{ deviceInfo.serialNumber }}</p>
          </div>
          <el-tag :type="getStatusType(deviceInfo.status)" size="small">
            {{ deviceInfo.status }}
          </el-tag>
        </div>

        <div class="device-details">
          <div class="detail-row">
            <span class="label">客户名称</span>
            <span class="value">{{ deviceInfo.customerName }}</span>
          </div>
          <div class="detail-row">
            <span class="label">安装地址</span>
            <span class="value">{{ deviceInfo.installAddress }}</span>
          </div>
          <div class="detail-row">
            <span class="label">联系人</span>
            <span class="value">{{ deviceInfo.contactPerson }} {{ deviceInfo.contactPhone }}</span>
          </div>
          <div class="detail-row">
            <span class="label">出厂日期</span>
            <span class="value">{{ deviceInfo.manufactureDate }}</span>
          </div>
          <div class="detail-row">
            <span class="label">销售日期</span>
            <span class="value">{{ deviceInfo.saleDate }}</span>
          </div>
          <div class="detail-row">
            <span class="label">保修截止</span>
            <span class="value" :class="{ 'expired': isWarrantyExpired }">
              {{ deviceInfo.warrantyEndDate }}
              <el-tag v-if="isWarrantyExpired" type="danger" size="small">已过期</el-tag>
              <el-tag v-else-if="isWarrantyExpiringSoon" type="warning" size="small">即将过期</el-tag>
            </span>
          </div>
          <div class="detail-row">
            <span class="label">是否EL</span>
            <span class="value">{{ deviceInfo.isEL ? '是' : '否' }}</span>
          </div>
        </div>

        <!-- 快捷操作按钮 -->
        <div class="quick-actions">
          <el-button type="primary" @click="showRepairDialog = true">
            <el-icon><Tools /></el-icon>
            一键报修
          </el-button>
          <el-button @click="showManualDialog = true">
            <el-icon><Document /></el-icon>
            操作手册
          </el-button>
          <el-button type="warning" @click="goToDocuments">
            <el-icon><Folder /></el-icon>
            相关资料
          </el-button>
        </div>

        <!-- 装机按钮 / 装机记录按钮（客户不填装机报告，由工程师填写） -->
        <div class="install-action" v-if="!isCustomer">
          <el-button 
            v-if="!hasInstallReport" 
            type="success" 
            class="install-btn"
            @click="goToInstallReport"
          >
            <el-icon><CirclePlus /></el-icon>
            填写装机报告
          </el-button>
          <el-button 
            v-else 
            type="info" 
            class="install-record-btn"
            @click="viewInstallRecord"
          >
            <el-icon><DocumentChecked /></el-icon>
            查看装机记录
          </el-button>
        </div>
      </div>

      <!-- 工单一览 -->
      <div class="workorder-section">
        <div class="section-header">
          <h4>服务记录</h4>
          <div class="filter-tabs">
            <span 
              v-for="tab in workorderTabs" 
              :key="tab.key"
              :class="{ active: activeTab === tab.key }"
              @click="activeTab = tab.key"
            >
              {{ tab.name }}
            </span>
          </div>
        </div>

        <div class="workorder-list">
          <div v-if="filteredWorkorders.length === 0" class="empty-state">
            <el-icon><Document /></el-icon>
            <p>暂无服务记录</p>
          </div>
          
          <div 
            v-for="workorder in filteredWorkorders" 
            :key="workorder.id"
            class="workorder-item"
            @click="viewWorkorderDetail(workorder)"
          >
            <div class="workorder-header">
              <span class="wo-no">{{ workorder.workorderId }}</span>
              <el-tag :type="getWorkorderStatusType(workorder.status)" size="small">
                {{ getWorkorderStatusText(workorder.status) }}
              </el-tag>
            </div>
            <div class="workorder-type">
              <el-icon><component :is="getWorkorderTypeIcon(workorder.type)" /></el-icon>
              <span>{{ getWorkorderTypeText(workorder.type) }}</span>
            </div>
            <div class="workorder-desc">{{ workorder.description }}</div>
            <div class="workorder-footer">
              <span class="wo-date">{{ formatDate(workorder.createTime) }}</span>
              <span class="wo-engineer" v-if="workorder.engineer">
                <el-icon><User /></el-icon>
                {{ workorder.engineer }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 报修对话框 -->
    <el-dialog
      v-model="showRepairDialog"
      title="一键报修"
      width="95%"
      class="mobile-dialog repair-dialog"
    >
      <el-form :model="repairForm" label-position="top">
        <!-- 客户信息 -->
        <div class="repair-section">
          <div class="repair-section-title">客户信息</div>
        </div>
        <el-form-item label="客户公司">
          <el-input v-model="repairForm.customerName" disabled />
        </el-form-item>
        <el-form-item label="联系人">
          <el-input v-model="repairForm.contactPerson" placeholder="联系人姓名" />
        </el-form-item>
        <el-form-item label="联系电话">
          <el-input v-model="repairForm.contactPhone" placeholder="联系电话" />
        </el-form-item>
        <el-form-item label="地址">
          <el-input v-model="repairForm.address" disabled />
        </el-form-item>

        <!-- 工单信息 -->
        <div class="repair-section">
          <div class="repair-section-title">工单信息</div>
        </div>
        <el-form-item label="服务类型">
          <el-radio-group v-model="repairForm.subType" class="type-radio-group">
            <el-radio-button label="repair">维修</el-radio-button>
            <el-radio-button label="trial_processing">试加工</el-radio-button>
            <el-radio-button label="refitting">改造</el-radio-button>
          </el-radio-group>
        </el-form-item>

        <!-- 设备信息 -->
        <div class="repair-section">
          <div class="repair-section-title">设备信息</div>
        </div>
        <el-form-item label="设备型号">
          <el-input v-model="repairForm.model" disabled />
        </el-form-item>
        <el-form-item label="序列号">
          <el-input v-model="repairForm.serialNumber" disabled />
        </el-form-item>
        <el-form-item v-if="repairForm.warrantyStatus" label="保修状态">
          <el-tag :type="repairForm.warrantyStatus === 'in_warranty' ? 'success' : 'warning'" size="large">
            {{ repairForm.warrantyStatus === 'in_warranty' ? '保内' : '保外' }}
          </el-tag>
        </el-form-item>

        <!-- 故障描述 -->
        <div class="repair-section">
          <div class="repair-section-title">故障描述</div>
        </div>
        <el-form-item required>
          <el-input 
            v-model="repairForm.description" 
            type="textarea" 
            :rows="4"
            placeholder="请详细描述设备故障现象..."
          />
        </el-form-item>
        <div class="fault-tags">
          <span class="tag-label">常见故障：</span>
          <el-tag
            v-for="tag in commonFaultTags"
            :key="tag.label"
            class="fault-tag"
            effect="plain"
            @click="repairForm.description = tag.description"
          >
            {{ tag.label }}
          </el-tag>
        </div>

        <!-- 故障附件 -->
        <el-form-item label="故障附件">
          <RepairAttachments v-model="repairForm.attachments" />
        </el-form-item>

        <el-form-item label="紧急程度">
          <el-radio-group v-model="repairForm.urgency">
            <el-radio-button value="low">一般</el-radio-button>
            <el-radio-button value="medium">紧急</el-radio-button>
            <el-radio-button value="high">特急</el-radio-button>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="repair-footer">
          <el-button size="large" @click="showRepairDialog = false">取消</el-button>
          <el-button type="primary" size="large" @click="submitRepair">提交报修</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 操作手册对话框 -->
    <el-dialog
      v-model="showManualDialog"
      title="操作手册"
      width="95%"
      class="mobile-dialog"
    >
      <div class="manual-content">
        <h3>{{ deviceInfo?.model }} 操作手册</h3>
        <el-divider />
        <div class="manual-section">
          <h4>1. 设备简介</h4>
          <p>本设备为工业级机械设备，采用先进的控制系统...</p>
        </div>
        <div class="manual-section">
          <h4>2. 操作说明</h4>
          <p>2.1 开机前检查电源、气源是否正常<br>
             2.2 按照操作面板提示进行启动<br>
             2.3 运行中注意观察设备状态指示灯</p>
        </div>
        <div class="manual-section">
          <h4>3. 日常维护</h4>
          <p>3.1 每日清洁设备表面<br>
             3.2 每周检查润滑油位<br>
             3.3 每月检查皮带张力</p>
        </div>
        <div class="manual-section">
          <h4>4. 常见故障处理</h4>
          <p>E01 - 电源故障：检查电源连接<br>
             E02 - 通信故障：检查网络连接<br>
             E03 - 传感器故障：联系售后</p>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  ArrowLeft,
  More,
  Monitor,
  Tools,
  Document,
  Document as DocumentIcon,
  Warning,
  ShoppingCart,
  User,
  Setting,
  CirclePlus,
  DocumentChecked,
  Folder,
  Picture,
  VideoCamera,
  Delete
} from '@element-plus/icons-vue'
import { createWorkorder, getCustomerWorkorders, state as workorderFlowState } from '../stores/workorderFlowStore.js'
import { saveAttachments } from '../stores/attachmentStore.js'
import RepairAttachments from '../components/RepairAttachments.vue'
import { getAssetBySerialNumber } from '../stores/assetStore.js'

const route = useRoute()
const router = useRouter()

// 设备信息
const deviceInfo = ref(null)

// 是否有装机报告
const hasInstallReport = ref(false)
const installReportId = ref(null)

// 是否为客户角色（客户不填装机报告，由工程师填写）
const isCustomer = computed(() => {
  try {
    // 通过客户专属登录页登录（customerAuth）
    const customerAuth = JSON.parse(localStorage.getItem('customerAuth') || '{}')
    if (customerAuth.customerId) return true
    // 通过统一登录页选"客户"角色登录（staffAuth.role === 'customer'）
    const staffAuth = JSON.parse(localStorage.getItem('staffAuth') || '{}')
    if (staffAuth.role === 'customer') return true
    return false
  } catch { return false }
})

// 对话框显示状态
const showRepairDialog = ref(false)
const showManualDialog = ref(false)

// 报修表单
const repairForm = ref({
  serialNumber: '',
  model: '',
  customerName: '',
  address: '',
  description: '',
  urgency: 'medium',
  subType: 'repair',
  contactPerson: '',
  contactPhone: '',
  warrantyStatus: '',
  attachments: []
})

// 常见故障标签
const commonFaultTags = [
  { label: '无法启动', description: '设备无法正常启动，通电后无响应' },
  { label: '异响', description: '设备运行过程中出现异常响声' },
  { label: '漏油', description: '设备存在漏油现象，需检查密封件' },
  { label: '精度异常', description: '设备加工精度超出允许偏差范围' },
  { label: '过热报警', description: '设备运行中触发过热报警保护' }
]

// 工单标签
const workorderTabs = [
  { key: 'all', name: '全部' },
  { key: 'repair', name: '维修' },
  { key: 'maintenance', name: '保养' },
  { key: 'install', name: '安装' }
]
const activeTab = ref('all')

// 模拟设备数据
const mockDeviceData = {
  serialNumber: 'SN202403001',
  model: '激光切割机 LX-3000',
  manufactureDate: '2024-01-15',
  saleDate: '2024-02-20',
  warrantyEndDate: '2026-02-19',
  status: '运行中',
  isEL: true,
  installAddress: '广州市天河区科技园路1号',
  customerName: '广州某科技有限公司',
  contactPerson: '张经理',
  contactPhone: '13800138000'
}

// 工单列表 - 从 store 加载
const workorders = ref([])

// 加载工单数据
const loadWorkorders = () => {
  // 获取当前设备序列号
  let serialNumber = null
  try {
    // 优先从 deviceInfo 获取序列号
    serialNumber = deviceInfo.value?.serialNumber
    
    // 如果 deviceInfo 中没有，尝试从 localStorage 获取
    if (!serialNumber) {
      const currentDeviceInfo = JSON.parse(localStorage.getItem('currentDeviceInfo') || '{}')
      serialNumber = currentDeviceInfo.serialNumber
    }
  } catch (e) {
    console.error('读取设备信息失败:', e)
  }

  // 从 store 获取工单列表
  let storeWorkorders = []
  
  // 1. 首先尝试从所有工单中筛选与当前设备相关的（通过 serialNumber 匹配）
  if (serialNumber) {
    storeWorkorders = (workorderFlowState.workorders || []).filter(w => w.serialNumber === serialNumber)
    console.log('通过序列号筛选工单:', serialNumber, storeWorkorders.length)
  }
  
  // 2. 如果还是没有找到，显示所有工单
  if (storeWorkorders.length === 0) {
    storeWorkorders = workorderFlowState.workorders || []
    console.log('显示所有工单:', storeWorkorders.length)
  }
  
  console.log('设备详情页加载工单:', { serialNumber, count: storeWorkorders.length })
  
  // 转换为组件需要的格式
  workorders.value = storeWorkorders.map(w => ({
    id: w.id,
    workorderId: w.workorderId,
    type: 'repair',
    description: w.faultDescription,
    status: w.status,
    createTime: new Date(w.createTime),
    engineer: w.engineerName || '',
    solution: w.serviceReport?.repairContent || ''
  }))
}

// 筛选后的工单
const filteredWorkorders = computed(() => {
  if (activeTab.value === 'all') return workorders.value
  return workorders.value.filter(w => w.type === activeTab.value)
})

// 保修状态计算
const isWarrantyExpired = computed(() => {
  if (!deviceInfo.value?.warrantyEndDate) return false
  return new Date(deviceInfo.value.warrantyEndDate) < new Date()
})

const isWarrantyExpiringSoon = computed(() => {
  if (!deviceInfo.value?.warrantyEndDate) return false
  const endDate = new Date(deviceInfo.value.warrantyEndDate)
  const now = new Date()
  const diffDays = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24))
  return diffDays > 0 && diffDays <= 30
})

// 方法
const goBack = () => {
  router.back()
}

const showMoreActions = () => {
  ElMessage.info('更多功能开发中')
}

const getStatusType = (status) => {
  const map = {
    '运行中': 'success',
    '停机': 'danger',
    '维修中': 'warning',
    '报废': 'info'
  }
  return map[status] || 'info'
}

const getWorkorderStatusType = (status) => {
  const map = {
    'pending': 'warning',
    'processing': 'primary',
    'completed': 'success',
    'closed': 'info'
  }
  return map[status] || 'info'
}

const getWorkorderStatusText = (status) => {
  const map = {
    'pending': '待处理',
    'processing': '进行中',
    'completed': '已完成',
    'closed': '已关闭'
  }
  return map[status] || status
}

const getWorkorderTypeText = (type) => {
  const map = {
    'repair': '维修',
    'maintenance': '保养',
    'install': '安装',
    'parts': '配件'
  }
  return map[type] || type
}

const getWorkorderTypeIcon = (type) => {
  const map = {
    'repair': 'Warning',
    'maintenance': 'Setting',
    'install': 'Tools',
    'parts': 'ShoppingCart'
  }
  return map[type] || 'Document'
}

const formatDate = (date) => {
  if (!date) return ''
  const d = new Date(date)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const viewWorkorderDetail = (workorder) => {
  router.push(`/customer-workorder-detail?id=${workorder.id}`)
}

// 跳转到装机报告页面
const goToInstallReport = () => {
  // 将设备信息保存到 localStorage，供装机报告页面使用
  if (deviceInfo.value) {
    localStorage.setItem('currentDeviceInfo', JSON.stringify(deviceInfo.value))
  }
  router.push(`/asset-install-report?serial=${deviceInfo.value?.serialNumber}&model=${encodeURIComponent(deviceInfo.value?.model)}`)
}

// 查看装机记录
const viewInstallRecord = () => {
  if (installReportId.value) {
    router.push(`/asset-install-record?id=${installReportId.value}`)
  } else {
    // 如果没有记录ID，显示提示
    ElMessage.info('暂无装机记录详情')
  }
}

// 跳转到相关资料页面
const goToDocuments = () => {
  router.push(`/asset-documents?serial=${deviceInfo.value?.serialNumber}&model=${encodeURIComponent(deviceInfo.value?.model)}`)
}

const submitRepair = async () => {
  if (!repairForm.value.description) {
    ElMessage.warning('请填写故障描述')
    return
  }
  if (!repairForm.value.contactPhone) {
    ElMessage.warning('请填写联系电话')
    return
  }

  // 获取当前客户信息（统一从 staffAuth 读取，与首页报修一致）
  let customerId = ''
  let customerName = ''
  try {
    const auth = JSON.parse(localStorage.getItem('staffAuth') || '{}')
    customerId = auth.companyId || auth.id || ''
    customerName = auth.companyName || ''
  } catch (e) {
    console.error('读取客户信息失败:', e)
  }

  // 判断保修状态
  let warrantyStatus = 'unknown'
  if (deviceInfo.value?.warrantyEndDate) {
    const warrantyEnd = new Date(deviceInfo.value.warrantyEndDate)
    warrantyStatus = warrantyEnd > new Date() ? 'in_warranty' : 'out_of_warranty'
  }

  // 将附件存入 IndexedDB，工单只存引用（避免 localStorage 5MB 限制）
  const attachmentRefs = await saveAttachments(repairForm.value.attachments)

  const workorder = createWorkorder({
    customerId: customerId || deviceInfo.value?.serialNumber || `guest_${Date.now()}`,
    customerName: customerName || repairForm.value.customerName || deviceInfo.value?.customerName || '匿名客户',
    customerContact: repairForm.value.contactPerson,
    customerPhone: repairForm.value.contactPhone,
    deviceModel: deviceInfo.value?.model || repairForm.value.model,
    serialNumber: deviceInfo.value?.serialNumber || repairForm.value.serialNumber,
    faultDescription: repairForm.value.description,
    urgency: repairForm.value.urgency,
    subType: repairForm.value.subType || 'repair',
    attachments: attachmentRefs,
    warrantyStatus: warrantyStatus,
    warrantyEndDate: deviceInfo.value?.warrantyEndDate,
    address: repairForm.value.address || deviceInfo.value?.installAddress || ''
  }, 'customer', repairForm.value.contactPerson || customerName)

  if (workorder) {
    ElMessage.success('报修申请已提交，我们会尽快与您联系')
    showRepairDialog.value = false
    loadWorkorders()
  } else {
    ElMessage.error('提交报修申请失败，请重试')
  }
}

onMounted(() => {
  // 从路由参数获取设备序列号
  const serialNumber = route.query.serial

  // 从 assetStore 查找设备数据
  if (serialNumber) {
    const asset = getAssetBySerialNumber(serialNumber)
    if (asset) {
      deviceInfo.value = {
        serialNumber: asset.serialNumber,
        model: asset.name ? `${asset.name} ${asset.model}` : asset.model,
        manufactureDate: asset.manufactureDate || '',
        saleDate: asset.saleDate || '',
        warrantyEndDate: asset.warrantyEndDate || '',
        status: asset.status || '运行中',
        isEL: asset.isEL || false,
        installAddress: asset.installAddress || '',
        customerName: asset.customerName || '',
        contactPerson: asset.contactPerson || '',
        contactPhone: asset.contactPhone || ''
      }
    } else {
      // assetStore中没找到，用mock数据兜底
      deviceInfo.value = {
        ...mockDeviceData,
        serialNumber: serialNumber
      }
    }
  } else {
    deviceInfo.value = mockDeviceData
  }

  // 将当前设备信息保存到 localStorage，供其他页面使用
  localStorage.setItem('currentDeviceInfo', JSON.stringify(deviceInfo.value))

  // 初始化报修表单
  repairForm.value.serialNumber = deviceInfo.value.serialNumber
  repairForm.value.model = deviceInfo.value.model
  repairForm.value.customerName = deviceInfo.value.customerName
  repairForm.value.address = deviceInfo.value.installAddress
  repairForm.value.contactPerson = deviceInfo.value.contactPerson
  repairForm.value.contactPhone = deviceInfo.value.contactPhone
  repairForm.value.warrantyStatus = deviceInfo.value.warrantyEndDate && new Date(deviceInfo.value.warrantyEndDate) > new Date() ? 'in_warranty' : 'out_of_warranty'

  // 加载工单数据
  loadWorkorders()

  // 检查是否有装机报告（从 localStorage 读取）
  try {
    const installReports = JSON.parse(localStorage.getItem('installReports') || '[]')
    const existingReport = installReports.find(r => r.serialNumber === deviceInfo.value.serialNumber)
    if (existingReport) {
      hasInstallReport.value = true
      installReportId.value = existingReport.id
    }
  } catch (e) {
    console.error('读取装机报告失败:', e)
  }
})
</script>

<style scoped>
.asset-detail {
  min-height: 100vh;
  background: #f5f7fa;
  overflow-y: auto;
  overflow-x: hidden;
}

.mobile-asset-detail {
  padding-bottom: 20px;
}

/* 顶部导航 */
.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 15px;
  background: white;
  border-bottom: 1px solid #e8e8e8;
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-title {
  font-size: 17px;
  font-weight: 500;
  color: #262626;
}

/* 设备信息卡片 */
.device-info-card {
  background: white;
  margin: 15px;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.device-header {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #f0f0f0;
}

.device-icon {
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 30px;
}

.device-title {
  flex: 1;
}

.device-title h3 {
  margin: 0 0 6px;
  font-size: 18px;
  color: #262626;
}

.device-sn {
  margin: 0;
  font-size: 13px;
  color: #8c8c8c;
  font-family: monospace;
}

.device-details {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.detail-row .label {
  font-size: 14px;
  color: #8c8c8c;
}

.detail-row .value {
  font-size: 14px;
  color: #262626;
  text-align: right;
  max-width: 60%;
}

.detail-row .value.expired {
  color: #f5222d;
}

.quick-actions {
  display: flex;
  gap: 12px;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #f0f0f0;
}

.quick-actions .el-button {
  flex: 1;
  padding: 12px;
  font-size: 15px;
}

/* 装机按钮区域 */
.install-action {
  margin-top: 12px;
}

.install-action .el-button {
  width: 100%;
  padding: 12px;
  font-size: 15px;
}

.install-btn {
  background: linear-gradient(135deg, #52c41a 0%, #389e0d 100%);
  border: none;
}

.install-btn:hover {
  background: linear-gradient(135deg, #73d13d 0%, #52c41a 100%);
}

.install-record-btn {
  background: #f5f5f5;
  border: 1px solid #d9d9d9;
  color: #595959;
}

.install-record-btn:hover {
  background: #e8e8e8;
  border-color: #bfbfbf;
  color: #262626;
}

/* 工单区域 */
.workorder-section {
  background: white;
  margin: 15px;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.section-header {
  margin-bottom: 15px;
}

.section-header h4 {
  margin: 0 0 12px;
  font-size: 16px;
  color: #262626;
}

.filter-tabs {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 5px;
}

.filter-tabs span {
  padding: 6px 14px;
  background: #f5f5f5;
  border-radius: 16px;
  font-size: 13px;
  color: #595959;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.3s;
}

.filter-tabs span.active {
  background: #1890ff;
  color: white;
}

.workorder-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: #bfbfbf;
}

.empty-state .el-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.workorder-item {
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  padding: 15px;
  cursor: pointer;
  transition: all 0.3s;
}

.workorder-item:active {
  background: #f5f5f5;
}

.workorder-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.wo-no {
  font-size: 14px;
  color: #8c8c8c;
  font-family: monospace;
}

.workorder-type {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: #1890ff;
  margin-bottom: 8px;
}

.workorder-desc {
  font-size: 14px;
  color: #595959;
  margin-bottom: 10px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.workorder-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  color: #8c8c8c;
}

.wo-engineer {
  display: flex;
  align-items: center;
  gap: 4px;
}

/* 对话框样式 */
:deep(.mobile-dialog) {
  border-radius: 12px 12px 0 0;
  margin: 0;
  margin-top: auto;
}

:deep(.mobile-dialog .el-dialog__body) {
  padding: 15px;
  max-height: 70vh;
  overflow-y: auto;
}

/* 报修对话框附件样式 */
:deep(.repair-dialog .el-dialog__body) {
  max-height: 75vh;
}

/* 操作手册内容 */
.manual-content {
  padding: 10px;
}

.manual-content h3 {
  margin: 0 0 15px;
  font-size: 18px;
  color: #262626;
}

.manual-section {
  margin-bottom: 20px;
}

.manual-section h4 {
  margin: 0 0 10px;
  font-size: 15px;
  color: #1890ff;
}

.manual-section p {
  margin: 0;
  font-size: 14px;
  color: #595959;
  line-height: 1.8;
}

/* 报修分区样式 */
.repair-section {
  margin-bottom: 8px;
}

.repair-section-title {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
  padding: 8px 0 8px 12px;
  border-left: 3px solid #fa8c16;
}

.fault-tags {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  padding: 4px 0 8px 12px;
}

.tag-label {
  font-size: 13px;
  color: #909399;
}

.fault-tag {
  cursor: pointer;
  transition: all 0.2s;
}

.fault-tag:hover {
  color: #fa8c16;
  border-color: #fa8c16;
}

.type-radio-group {
  width: 100%;
}

.type-radio-group :deep(.el-radio-button) {
  flex: 1;
}

.type-radio-group :deep(.el-radio-button__inner) {
  width: 100%;
}

.repair-footer {
  display: flex;
  gap: 15px;
  width: 100%;
}

.repair-footer .el-button {
  flex: 1;
}

/* 响应式适配 */
@media (min-width: 768px) {
  .asset-detail {
    display: flex;
    justify-content: center;
    align-items: flex-start;
    min-height: 100vh;
    background: #f0f2f5;
    padding: 20px;
    overflow-y: auto;
  }

  .mobile-asset-detail {
    max-width: 414px;
    width: 100%;
    margin: 0 auto;
    border-left: 1px solid #e8e8e8;
    border-right: 1px solid #e8e8e8;
    min-height: calc(100vh - 40px);
    background: white;
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.08);
  }
}
</style>
