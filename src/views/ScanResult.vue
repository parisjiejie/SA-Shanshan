<template>
  <div class="scan-result">
    <!-- 找到设备 -->
    <div v-if="deviceInfo" class="device-found">
      <div class="result-header">
        <div class="success-icon">
          <el-icon :size="48" color="#67C23A"><CircleCheckFilled /></el-icon>
        </div>
        <h2>设备识别成功</h2>
      </div>

      <el-card class="device-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <el-icon><Monitor /></el-icon>
            <span>设备档案</span>
          </div>
        </template>
        <el-descriptions :column="1" border>
          <el-descriptions-item label="设备序列号">{{ deviceInfo.serialNumber }}</el-descriptions-item>
          <el-descriptions-item label="设备型号">{{ deviceInfo.model }}</el-descriptions-item>
          <el-descriptions-item label="客户名称">{{ deviceInfo.customerName }}</el-descriptions-item>
          <el-descriptions-item label="当前状态">
            <el-tag :type="getStatusType(deviceInfo.status)">{{ deviceInfo.status }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="安装地址">{{ deviceInfo.installAddress }}</el-descriptions-item>
          <el-descriptions-item label="保修截止">{{ deviceInfo.warrantyEndDate }}</el-descriptions-item>
          <el-descriptions-item label="联系人">{{ deviceInfo.contactPerson }} {{ deviceInfo.contactPhone }}</el-descriptions-item>
        </el-descriptions>
      </el-card>

      <!-- 操作按钮 -->
      <div class="action-buttons">
        <el-button type="primary" size="large" round @click="showRepairDialog = true" class="action-btn">
          <el-icon><Edit /></el-icon>
          一键报修
        </el-button>
      </div>
    </div>

    <!-- 未找到设备 -->
    <div v-else class="device-not-found">
      <div class="result-header">
        <div class="error-icon">
          <el-icon :size="48" color="#F56C6C"><CircleCloseFilled /></el-icon>
        </div>
        <h2>未找到设备</h2>
        <p>该二维码尚未绑定设备，或设备信息不存在</p>
      </div>
      <el-button type="primary" round @click="goHome">返回首页</el-button>
    </div>

    <!-- 报修对话框 -->
    <el-dialog v-model="showRepairDialog" title="一键报修" width="90%" :close-on-click-modal="false">
      <el-form :model="repairForm" label-width="100px">
        <el-form-item label="设备序列号">
          <el-input v-model="repairForm.serialNumber" disabled />
        </el-form-item>
        <el-form-item label="设备型号">
          <el-input v-model="repairForm.model" disabled />
        </el-form-item>
        <el-form-item label="联系人">
          <el-input v-model="repairForm.contactPerson" placeholder="请输入联系人" />
        </el-form-item>
        <el-form-item label="联系电话">
          <el-input v-model="repairForm.contactPhone" placeholder="请输入联系电话" />
        </el-form-item>
        <el-form-item label="故障描述">
          <el-input v-model="repairForm.description" type="textarea" :rows="3" placeholder="请描述故障现象" />
        </el-form-item>
        <el-form-item label="紧急程度">
          <el-radio-group v-model="repairForm.urgency">
            <el-radio value="low">一般</el-radio>
            <el-radio value="medium">紧急</el-radio>
            <el-radio value="high">特急</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showRepairDialog = false">取消</el-button>
        <el-button type="primary" @click="submitRepair">提交报修</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { CircleCheckFilled, CircleCloseFilled, Monitor, Edit } from '@element-plus/icons-vue'
import { getAssetByQRToken, getAssetBySerialNumber } from '../stores/assetStore.js'
import { createWorkorder } from '../stores/workorderFlowStore.js'

const route = useRoute()
const router = useRouter()

const deviceInfo = ref(null)
const showRepairDialog = ref(false)
const repairForm = ref({
  serialNumber: '',
  model: '',
  contactPerson: '',
  contactPhone: '',
  description: '',
  urgency: 'medium'
})

const getStatusType = (status) => {
  const map = { '运行中': 'success', '停机': 'danger', '维修中': 'warning' }
  return map[status] || 'info'
}

const goHome = () => {
  router.push('/customer-workspace')
}

const submitRepair = () => {
  if (!repairForm.value.description) {
    ElMessage.warning('请输入故障描述')
    return
  }
  try {
    const workorder = createWorkorder({
      type: 'repair',
      category: 'service',
      subType: 'repair',
      customerId: deviceInfo.value.companyId || 'C001',
      customerName: deviceInfo.value.customerName || '',
      customerContact: repairForm.value.contactPerson,
      customerPhone: repairForm.value.contactPhone,
      customerAddress: deviceInfo.value.installAddress || '',
      deviceModel: deviceInfo.value.model || '',
      serialNumber: deviceInfo.value.serialNumber || '',
      faultDescription: repairForm.value.description,
      urgency: repairForm.value.urgency,
      warrantyEndDate: deviceInfo.value.warrantyEndDate || '',
      source: 'qrcode_scan'
    })
    ElMessage.success('报修申请已提交')
    showRepairDialog.value = false
    // 跳转到工单列表
    router.push('/customer-workorder-list')
  } catch (e) {
    ElMessage.error('提交报修失败，请重试')
  }
}

onMounted(() => {
  const token = route.query.token
  const serial = route.query.serial

  if (token) {
    // 通过二维码Token查找设备
    const asset = getAssetByQRToken(token)
    if (asset) {
      deviceInfo.value = asset
    }
  } else if (serial) {
    // 通过序列号查找设备
    const asset = getAssetBySerialNumber(serial)
    if (asset) {
      deviceInfo.value = asset
    }
  }

  if (deviceInfo.value) {
    repairForm.value.serialNumber = deviceInfo.value.serialNumber
    repairForm.value.model = deviceInfo.value.model
    repairForm.value.contactPerson = deviceInfo.value.contactPerson || ''
    repairForm.value.contactPhone = deviceInfo.value.contactPhone || ''
  }
})
</script>

<style scoped>
.scan-result {
  min-height: 100vh;
  background: #f5f7fa;
  padding: 20px;
  box-sizing: border-box;
}

.result-header {
  text-align: center;
  padding: 30px 0 20px;
}

.success-icon, .error-icon {
  margin-bottom: 16px;
}

.result-header h2 {
  font-size: 22px;
  color: #303133;
  margin: 0 0 8px;
}

.result-header p {
  color: #909399;
  font-size: 14px;
}

.device-card {
  margin-bottom: 24px;
  border-radius: 12px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #303133;
}

.action-buttons {
  display: flex;
  justify-content: center;
  gap: 16px;
}

.action-btn {
  padding: 16px 40px;
  font-size: 16px;
}

.device-not-found {
  text-align: center;
  padding-top: 60px;
}

.device-not-found .el-button {
  margin-top: 24px;
}
</style>
