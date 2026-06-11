<template>
  <div class="customer-device-list">
    <!-- 顶部导航 -->
    <div class="list-header">
      <el-button link @click="goBack">
        <el-icon><ArrowLeft /></el-icon>
        <span>返回</span>
      </el-button>
      <span class="header-title">我的设备</span>
      <span class="placeholder"></span>
    </div>

    <!-- 设备统计 -->
    <div class="device-stats">
      <div class="stats-card">
        <span class="stats-number">{{ devices.length }}</span>
        <span class="stats-label">设备总数</span>
      </div>
      <div class="stats-card">
        <span class="stats-number">{{ runningDevices }}</span>
        <span class="stats-label">运行中</span>
      </div>
      <div class="stats-card">
        <span class="stats-number">{{ warningDevices }}</span>
        <span class="stats-label">需维护</span>
      </div>
    </div>

    <!-- 设备列表 -->
    <div class="device-list">
      <div
        v-for="device in devices"
        :key="device.id"
        class="device-card"
        @click="viewDeviceDetail(device)"
      >
        <div class="device-header">
          <div class="device-icon">
            <el-icon><Monitor /></el-icon>
          </div>
          <div class="device-status">
            <el-tag :type="getStatusType(device.status)" size="small">
              {{ getStatusText(device.status) }}
            </el-tag>
          </div>
        </div>
        <div class="device-info">
          <h4 class="device-name">{{ device.name }}</h4>
          <p class="device-model">{{ device.model }}</p>
          <p class="device-serial">序列号：{{ device.serialNumber }}</p>
        </div>
        <div class="device-footer">
          <div class="device-meta">
            <span class="meta-item">
              <el-icon><Location /></el-icon>
              {{ device.location }}
            </span>
            <span class="meta-item">
              <el-icon><Calendar /></el-icon>
              {{ formatDate(device.purchaseDate) }}
            </span>
          </div>
          <el-icon class="device-arrow"><ArrowRight /></el-icon>
        </div>
      </div>

      <!-- 空状态 -->
      <div class="empty-state" v-if="devices.length === 0">
        <el-icon><Monitor /></el-icon>
        <p>暂无设备</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  ArrowLeft,
  Monitor,
  Location,
  Calendar,
  ArrowRight
} from '@element-plus/icons-vue'

const router = useRouter()

// 设备列表数据
const devices = ref([
  {
    id: 1,
    name: '激光切割机',
    model: 'LX-3000',
    serialNumber: 'SN2024001001',
    status: 'running',
    location: 'A车间',
    purchaseDate: new Date('2024-01-15'),
    lastMaintenance: new Date('2024-03-15'),
    nextMaintenance: new Date('2024-06-15')
  },
  {
    id: 2,
    name: '数控折弯机',
    model: 'ZW-1500',
    serialNumber: 'SN2024001002',
    status: 'running',
    location: 'B车间',
    purchaseDate: new Date('2024-02-20'),
    lastMaintenance: new Date('2024-04-20'),
    nextMaintenance: new Date('2024-07-20')
  },
  {
    id: 3,
    name: '激光焊接机',
    model: 'HJ-2000',
    serialNumber: 'SN2024001003',
    status: 'warning',
    location: 'A车间',
    purchaseDate: new Date('2023-08-10'),
    lastMaintenance: new Date('2024-01-10'),
    nextMaintenance: new Date('2024-04-10')
  },
  {
    id: 4,
    name: '数控冲床',
    model: 'CC-800',
    serialNumber: 'SN2024001004',
    status: 'stopped',
    location: 'C车间',
    purchaseDate: new Date('2023-05-05'),
    lastMaintenance: new Date('2024-02-05'),
    nextMaintenance: new Date('2024-05-05')
  }
])

// 运行中设备数量
const runningDevices = computed(() => {
  return devices.value.filter(d => d.status === 'running').length
})

// 需维护设备数量
const warningDevices = computed(() => {
  return devices.value.filter(d => d.status === 'warning').length
})

// 返回上一页
const goBack = () => {
  router.back()
}

// 获取状态类型
const getStatusType = (status) => {
  const map = {
    'running': 'success',
    'warning': 'warning',
    'stopped': 'info',
    'error': 'danger'
  }
  return map[status] || 'info'
}

// 获取状态文本
const getStatusText = (status) => {
  const map = {
    'running': '运行中',
    'warning': '需维护',
    'stopped': '已停机',
    'error': '故障'
  }
  return map[status] || status
}

// 格式化日期
const formatDate = (date) => {
  if (!date) return ''
  const d = new Date(date)
  return `${d.getFullYear()}.${(d.getMonth() + 1).toString().padStart(2, '0')}`
}

// 查看设备详情
const viewDeviceDetail = (device) => {
  router.push(`/asset-detail?serial=${device.serialNumber}&id=${device.id}`)
}

</script>

<style scoped>
.customer-device-list {
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

/* 设备统计 */
.device-stats {
  display: flex;
  gap: 10px;
  padding: 15px;
  margin-bottom: 5px;
}

.stats-card {
  flex: 1;
  background: white;
  border-radius: 12px;
  padding: 15px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.stats-number {
  display: block;
  font-size: 24px;
  font-weight: 600;
  color: #1890ff;
  margin-bottom: 5px;
}

.stats-label {
  font-size: 12px;
  color: #8c8c8c;
}

/* 设备列表 */
.device-list {
  padding: 0 15px;
}

.device-card {
  background: white;
  border-radius: 12px;
  padding: 15px;
  margin-bottom: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  cursor: pointer;
  transition: all 0.3s;
}

.device-card:active {
  transform: scale(0.98);
}

.device-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.device-icon {
  width: 50px;
  height: 50px;
  background: #e6f7ff;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  color: #1890ff;
}

.device-info {
  margin-bottom: 12px;
}

.device-name {
  margin: 0 0 6px;
  font-size: 17px;
  font-weight: 500;
  color: #262626;
}

.device-model {
  margin: 0 0 4px;
  font-size: 14px;
  color: #595959;
}

.device-serial {
  margin: 0;
  font-size: 13px;
  color: #8c8c8c;
  font-family: monospace;
}

.device-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}

.device-meta {
  display: flex;
  gap: 15px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #8c8c8c;
}

.meta-item .el-icon {
  font-size: 14px;
}

.device-arrow {
  color: #bfbfbf;
  font-size: 18px;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 80px 20px;
  color: #bfbfbf;
}

.empty-state .el-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.empty-state p {
  margin: 0 0 20px;
  font-size: 16px;
}

/* 扫码添加按钮 */
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

  .device-stats {
    padding: 12px;
  }

  .stats-number {
    font-size: 20px;
  }

  .device-list {
    padding: 0 12px;
  }

  .device-card {
    padding: 12px;
  }

  .device-icon {
    width: 44px;
    height: 44px;
    font-size: 24px;
  }

  .device-name {
    font-size: 16px;
  }

  .fab-button {
    width: 50px;
    height: 50px;
    font-size: 20px;
  }
}

/* 平板及以上 */
@media (min-width: 768px) {
  .customer-device-list {
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
