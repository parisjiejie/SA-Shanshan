<template>
  <div class="asset-install-record">
    <!-- 顶部导航 -->
    <div class="record-header">
      <el-button link @click="goBack">
        <el-icon><ArrowLeft /></el-icon>
        <span>返回</span>
      </el-button>
      <span class="header-title">装机记录</span>
      <span class="placeholder"></span>
    </div>

    <!-- 设备信息卡片 -->
    <div class="device-info-card" v-if="installRecord">
      <div class="device-header">
        <div class="device-icon">
          <el-icon><Monitor /></el-icon>
        </div>
        <div class="device-title">
          <h3>{{ installRecord.model }}</h3>
          <p class="device-sn">序列号: {{ installRecord.serialNumber }}</p>
        </div>
      </div>
    </div>

    <!-- 装机记录详情 -->
    <div class="record-detail" v-if="installRecord">
      <el-card class="detail-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <el-icon><DocumentChecked /></el-icon>
            <span>装机信息</span>
            <el-tag type="success" size="small" style="margin-left: auto;">已完成</el-tag>
          </div>
        </template>

        <div class="detail-content">
          <div class="detail-item">
            <span class="label">安装日期</span>
            <span class="value">{{ installRecord.installDate }}</span>
          </div>
          <div class="detail-item">
            <span class="label">安装地址</span>
            <span class="value">{{ installRecord.installAddress }}</span>
          </div>
          <div class="detail-item">
            <span class="label">客户名称</span>
            <span class="value">{{ installRecord.customerName }}</span>
          </div>
          <div class="detail-item">
            <span class="label">联系人</span>
            <span class="value">{{ installRecord.contactPerson }}</span>
          </div>
          <div class="detail-item">
            <span class="label">联系电话</span>
            <span class="value">{{ installRecord.contactPhone }}</span>
          </div>
          <div class="detail-item">
            <span class="label">安装工程师</span>
            <span class="value">{{ installRecord.engineerName }}</span>
          </div>
          <div class="detail-item">
            <span class="label">设备状态</span>
            <el-tag :type="getStatusType(installRecord.deviceStatus)" size="small">
              {{ getStatusText(installRecord.deviceStatus) }}
            </el-tag>
          </div>
          <div class="detail-item" v-if="installRecord.installContent && installRecord.installContent.length > 0">
            <span class="label">安装内容</span>
            <div class="content-tags">
              <el-tag v-for="item in installRecord.installContent" :key="item" size="small" type="info" style="margin-right: 5px; margin-bottom: 5px;">
                {{ getContentText(item) }}
              </el-tag>
            </div>
          </div>
          <div class="detail-item" v-if="installRecord.notes">
            <span class="label">备注说明</span>
            <span class="value">{{ installRecord.notes }}</span>
          </div>
        </div>
      </el-card>

      <!-- 客户签字 -->
      <el-card class="sign-card" shadow="hover" v-if="installRecord.customerSign">
        <template #header>
          <div class="card-header">
            <el-icon><CircleCheckFilled /></el-icon>
            <span>客户签字确认</span>
          </div>
        </template>
        <div class="sign-content">
          <img :src="installRecord.customerSign" alt="客户签字" class="sign-image" />
          <p class="sign-time" v-if="installRecord.createTime">
            确认时间：{{ formatDateTime(installRecord.createTime) }}
          </p>
        </div>
      </el-card>
    </div>

    <!-- 无记录提示 -->
    <div class="no-record" v-else>
      <el-empty description="暂无装机记录">
        <template #description>
          <p>该设备暂无装机记录</p>
        </template>
        <el-button type="primary" @click="goToInstallReport">填写装机报告</el-button>
      </el-empty>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  ArrowLeft,
  Monitor,
  DocumentChecked,
  CircleCheckFilled
} from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()

// 装机记录
const installRecord = ref(null)

// 返回上一页
const goBack = () => {
  router.back()
}

// 跳转到装机报告页面
const goToInstallReport = () => {
  router.push(`/asset-install-report?serial=${route.query.serial || ''}`)
}

// 获取状态类型
const getStatusType = (status) => {
  const map = {
    'normal': 'success',
    'debugging': 'warning',
    'abnormal': 'danger'
  }
  return map[status] || 'info'
}

// 获取状态文本
const getStatusText = (status) => {
  const map = {
    'normal': '正常运行',
    'debugging': '调试中',
    'abnormal': '存在异常'
  }
  return map[status] || status
}

// 获取安装内容文本
const getContentText = (content) => {
  const map = {
    'unpack': '拆箱验货',
    'install': '设备安装',
    'debug': '设备调试',
    'train': '操作培训',
    'accept': '验收交付'
  }
  return map[content] || content
}

// 格式化日期时间
const formatDateTime = (dateTime) => {
  if (!dateTime) return '-'
  const date = new Date(dateTime)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

onMounted(() => {
  const recordId = route.query.id
  const serialNumber = route.query.serial

  if (recordId) {
    // 根据ID查找记录
    try {
      const installReports = JSON.parse(localStorage.getItem('installReports') || '[]')
      const record = installReports.find(r => r.id === recordId)
      if (record) {
        installRecord.value = record
      }
    } catch (e) {
      console.error('读取装机记录失败:', e)
    }
  } else if (serialNumber) {
    // 根据序列号查找记录
    try {
      const installReports = JSON.parse(localStorage.getItem('installReports') || '[]')
      const record = installReports.find(r => r.serialNumber === serialNumber)
      if (record) {
        installRecord.value = record
      }
    } catch (e) {
      console.error('读取装机记录失败:', e)
    }
  }
})
</script>

<style scoped>
.asset-install-record {
  min-height: 100vh;
  background: #f5f7fa;
  padding-bottom: 20px;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

/* 顶部导航 */
.record-header {
  background: white;
  padding: 12px 15px;
  display: flex;
  justify-content: space-between;
  align-items: center;
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

.placeholder {
  width: 60px;
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

/* 记录详情 */
.record-detail {
  margin: 15px;
}

.detail-card {
  margin-bottom: 15px;
  border-radius: 12px;
}

.detail-card :deep(.el-card__header) {
  padding: 12px 16px;
  background: #f5f7fa;
  border-bottom: 1px solid #e4e7ed;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #303133;
}

.detail-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}

.detail-item:last-child {
  border-bottom: none;
}

.detail-item .label {
  font-size: 14px;
  color: #8c8c8c;
  flex-shrink: 0;
  width: 80px;
}

.detail-item .value {
  font-size: 14px;
  color: #262626;
  text-align: right;
  flex: 1;
  word-break: break-all;
}

.content-tags {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  flex: 1;
}

/* 签字卡片 */
.sign-card {
  border-radius: 12px;
}

.sign-card :deep(.el-card__header) {
  padding: 12px 16px;
  background: linear-gradient(135deg, #67c23a 0%, #85ce61 100%);
  border-bottom: none;
  color: white;
}

.sign-card .card-header {
  color: white;
}

.sign-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 10px 0;
}

.sign-image {
  max-width: 280px;
  max-height: 120px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 10px;
  background: #f5f7fa;
}

.sign-time {
  font-size: 13px;
  color: #8c8c8c;
  margin: 0;
}

/* 无记录提示 */
.no-record {
  padding: 40px 20px;
}

/* 响应式适配 */
@media (min-width: 768px) {
  .asset-install-record {
    max-width: 414px;
    margin: 0 auto;
    border-left: 1px solid #e8e8e8;
    border-right: 1px solid #e8e8e8;
  }
}
</style>
