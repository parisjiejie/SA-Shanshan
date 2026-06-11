<template>
  <div class="customer-workorder-sign">
    <!-- 顶部导航 -->
    <div class="header">
      <el-button link @click="goBack">
        <el-icon><ArrowLeft /></el-icon>
        <span>返回</span>
      </el-button>
      <span class="header-title">服务确认</span>
      <span class="placeholder"></span>
    </div>

    <!-- 工单信息 -->
    <div v-if="workorder" class="workorder-info-card">
      <div class="info-header">
        <span class="order-no">{{ workorder.workorderId }}</span>
        <el-tag :type="getStatusType(workorder.status)" size="small">
          {{ getStatusText(workorder.status) }}
        </el-tag>
      </div>

      <div class="info-body">
        <div class="info-item">
          <span class="label">设备型号</span>
          <span class="value">{{ workorder.deviceModel || '未指定' }}</span>
        </div>
        <div class="info-item">
          <span class="label">工程师</span>
          <span class="value">{{ workorder.engineerName || '未分配' }}</span>
        </div>
        <div class="info-item">
          <span class="label">服务时间</span>
          <span class="value">{{ formatDateTime(workorder.completeTime) }}</span>
        </div>
      </div>
    </div>

    <!-- 服务报告 -->
    <div v-if="serviceReport" class="service-report-card">
      <div class="card-title">
        <el-icon><Document /></el-icon>
        <span>服务报告</span>
      </div>

      <div class="report-content">
        <div class="report-item">
          <span class="label">故障现象</span>
          <p class="value">{{ serviceReport.faultPhenomenon }}</p>
        </div>
        <div class="report-item">
          <span class="label">故障原因</span>
          <p class="value">{{ serviceReport.faultReason || '未填写' }}</p>
        </div>
        <div class="report-item">
          <span class="label">维修措施</span>
          <p class="value">{{ serviceReport.repairMeasures }}</p>
        </div>
        <div v-if="serviceReport.parts && serviceReport.parts.length > 0" class="report-item">
          <span class="label">更换配件</span>
          <div class="parts-list">
            <el-tag v-for="(part, index) in serviceReport.parts" :key="index" size="small">
              {{ part.name }} x{{ part.quantity }}
            </el-tag>
          </div>
        </div>
        <div class="report-item">
          <span class="label">维修结果</span>
          <el-tag :type="getResultType(serviceReport.result)" size="small">
            {{ getResultText(serviceReport.result) }}
          </el-tag>
        </div>
        <div v-if="serviceReport.cost > 0" class="report-item">
          <span class="label">维修费用</span>
          <span class="value cost">¥{{ serviceReport.cost }}</span>
        </div>
      </div>
    </div>

    <!-- 签字区域 -->
    <div class="sign-section">
      <div class="section-title">
        <el-icon><EditPen /></el-icon>
        <span>客户签字确认</span>
      </div>
      <p class="sign-desc">请确认服务已完成并签字</p>

      <div class="sign-canvas-wrapper">
        <canvas
          ref="signCanvas"
          class="sign-canvas"
          @touchstart="handleTouchStart"
          @touchmove="handleTouchMove"
          @touchend="handleTouchEnd"
          @mousedown="handleMouseDown"
          @mousemove="handleMouseMove"
          @mouseup="handleMouseUp"
          @mouseleave="handleMouseUp"
        ></canvas>
        <div v-if="!hasSignature" class="sign-placeholder">
          <el-icon><EditPen /></el-icon>
          <span>请在此处签字</span>
        </div>
      </div>

      <div class="sign-actions">
        <el-button @click="clearSignature">
          <el-icon><RefreshLeft /></el-icon>
          重签
        </el-button>
        <el-button type="primary" :disabled="!hasSignature" @click="submitSignature">
          <el-icon><Check /></el-icon>
          确认签字
        </el-button>
      </div>
    </div>

    <!-- 提示信息 -->
    <div class="tips">
      <el-icon><InfoFilled /></el-icon>
      <span>签字即表示您确认服务已完成，设备正常运行</span>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  ArrowLeft,
  Document,
  EditPen,
  RefreshLeft,
  Check,
  InfoFilled
} from '@element-plus/icons-vue'
import {
  getWorkorderById,
  signWorkorder,
  WorkorderStatusText,
  WorkorderStatusType
} from '../stores/workorderFlowStore.js'

const route = useRoute()
const router = useRouter()

// 工单数据
const workorder = ref(null)
const serviceReport = ref(null)

// 画布相关
const signCanvas = ref(null)
const hasSignature = ref(false)
let canvas = null
let ctx = null
let isDrawing = false
let lastX = 0
let lastY = 0

// 获取状态类型
const getStatusType = (status) => {
  return WorkorderStatusType[status] || 'info'
}

// 获取状态文本
const getStatusText = (status) => {
  return WorkorderStatusText[status] || status
}

// 获取结果类型
const getResultType = (result) => {
  const map = {
    'repaired': 'success',
    'unrepairable': 'danger',
    'parts_needed': 'warning'
  }
  return map[result] || 'info'
}

// 获取结果文本
const getResultText = (result) => {
  const map = {
    'repaired': '已修复',
    'unrepairable': '无法修复',
    'parts_needed': '需更换配件'
  }
  return map[result] || result
}

// 格式化日期时间
const formatDateTime = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return `${date.getMonth() + 1}月${date.getDate()}日 ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

// 初始化画布
const initCanvas = () => {
  canvas = signCanvas.value
  if (!canvas) return

  // 设置画布大小
  const wrapper = canvas.parentElement
  canvas.width = wrapper.clientWidth
  canvas.height = 200

  ctx = canvas.getContext('2d')
  ctx.strokeStyle = '#262626'
  ctx.lineWidth = 2
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
}

// 获取坐标
const getCoordinates = (e) => {
  const rect = canvas.getBoundingClientRect()
  const clientX = e.touches ? e.touches[0].clientX : e.clientX
  const clientY = e.touches ? e.touches[0].clientY : e.clientY
  return {
    x: clientX - rect.left,
    y: clientY - rect.top
  }
}

// 开始绘制
const startDrawing = (e) => {
  isDrawing = true
  const coords = getCoordinates(e)
  lastX = coords.x
  lastY = coords.y
}

// 绘制
const draw = (e) => {
  if (!isDrawing) return
  e.preventDefault()

  const coords = getCoordinates(e)
  ctx.beginPath()
  ctx.moveTo(lastX, lastY)
  ctx.lineTo(coords.x, coords.y)
  ctx.stroke()

  lastX = coords.x
  lastY = coords.y
  hasSignature.value = true
}

// 停止绘制
const stopDrawing = () => {
  isDrawing = false
}

// 触摸事件
const handleTouchStart = (e) => {
  e.preventDefault()
  startDrawing(e)
}

const handleTouchMove = (e) => {
  e.preventDefault()
  draw(e)
}

const handleTouchEnd = (e) => {
  e.preventDefault()
  stopDrawing()
}

// 鼠标事件
const handleMouseDown = (e) => {
  startDrawing(e)
}

const handleMouseMove = (e) => {
  draw(e)
}

const handleMouseUp = () => {
  stopDrawing()
}

// 清除签名
const clearSignature = () => {
  if (!ctx) return
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  hasSignature.value = false
}

// 提交签名
const submitSignature = () => {
  if (!hasSignature.value) {
    ElMessage.warning('请先签字')
    return
  }

  // 将画布内容转换为图片
  const signatureImage = canvas.toDataURL('image/png')

  // 提交签字
  const result = signWorkorder(workorder.value.id, signatureImage)

  if (result) {
    ElMessage.success('签字成功，感谢您的配合！')
    // 返回工单列表
    setTimeout(() => {
      router.push('/customer-workorder-list')
    }, 1500)
  } else {
    ElMessage.error('签字失败，请重试')
  }
}

// 返回上一页
const goBack = () => {
  router.back()
}

// 加载工单数据
const loadWorkorder = () => {
  const workorderId = route.query.id
  if (!workorderId) {
    ElMessage.error('工单ID不存在')
    return
  }

  const wo = getWorkorderById(workorderId)
  if (wo) {
    workorder.value = wo
    serviceReport.value = wo.serviceReport
  } else {
    ElMessage.error('工单不存在')
  }
}

onMounted(() => {
  loadWorkorder()
  // 延迟初始化画布，确保DOM已渲染
  setTimeout(initCanvas, 100)
})

// 监听窗口大小变化
const handleResize = () => {
  initCanvas()
}

onMounted(() => {
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
.customer-workorder-sign {
  min-height: 100vh;
  background: #f5f7fa;
  padding-bottom: 30px;
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

/* 工单信息卡片 */
.workorder-info-card {
  background: white;
  border-radius: 12px;
  margin: 15px;
  padding: 15px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.info-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 15px;
  border-bottom: 1px solid #f0f0f0;
}

.order-no {
  font-size: 16px;
  font-weight: 600;
  color: #1890ff;
  font-family: monospace;
}

.info-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.info-item .label {
  font-size: 14px;
  color: #8c8c8c;
}

.info-item .value {
  font-size: 14px;
  color: #262626;
  font-weight: 500;
}

/* 服务报告卡片 */
.service-report-card {
  background: white;
  border-radius: 12px;
  margin: 15px;
  padding: 15px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.card-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: #262626;
  margin-bottom: 15px;
  padding-bottom: 15px;
  border-bottom: 1px solid #f0f0f0;
}

.card-title .el-icon {
  color: #1890ff;
}

.report-content {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.report-item .label {
  display: block;
  font-size: 13px;
  color: #8c8c8c;
  margin-bottom: 6px;
}

.report-item .value {
  font-size: 14px;
  color: #262626;
  line-height: 1.6;
}

.report-item .value.cost {
  color: #f5222d;
  font-weight: 600;
  font-size: 16px;
}

.parts-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

/* 签字区域 */
.sign-section {
  background: white;
  border-radius: 12px;
  margin: 15px;
  padding: 15px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: #262626;
  margin-bottom: 8px;
}

.section-title .el-icon {
  color: #1890ff;
}

.sign-desc {
  font-size: 13px;
  color: #8c8c8c;
  margin-bottom: 15px;
}

.sign-canvas-wrapper {
  position: relative;
  width: 100%;
  height: 200px;
  background: #fafafa;
  border: 2px dashed #d9d9d9;
  border-radius: 8px;
  overflow: hidden;
}

.sign-canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
}

.sign-placeholder {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: #bfbfbf;
  z-index: 0;
}

.sign-placeholder .el-icon {
  font-size: 32px;
}

.sign-actions {
  display: flex;
  gap: 10px;
  margin-top: 15px;
}

.sign-actions .el-button {
  flex: 1;
}

/* 提示信息 */
.tips {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 15px;
  padding: 12px 15px;
  background: #e6f7ff;
  border-radius: 8px;
  font-size: 13px;
  color: #1890ff;
}

.tips .el-icon {
  font-size: 16px;
  flex-shrink: 0;
}

/* 响应式适配 */
@media (min-width: 768px) {
  .customer-workorder-sign {
    max-width: 414px;
    margin: 0 auto;
    border-left: 1px solid #e8e8e8;
    border-right: 1px solid #e8e8e8;
  }
}
</style>
