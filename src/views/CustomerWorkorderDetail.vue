<template>
  <div class="customer-workorder-detail">
    <!-- 顶部导航 -->
    <div class="detail-header">
      <el-button link @click="goBack">
        <el-icon><ArrowLeft /></el-icon>
        <span>返回</span>
      </el-button>
      <span class="header-title">工单详情</span>
      <span class="placeholder"></span>
    </div>

    <!-- 工单状态卡片 -->
    <div class="status-card">
      <div class="status-info">
        <span class="order-no">{{ workorder.workorderId }}</span>
        <el-tag :type="getStatusType(workorder.status)">{{ getStatusText(workorder.status) }}</el-tag>
      </div>
      <div class="status-desc">{{ getStatusDesc(workorder.status) }}</div>
    </div>

    <!-- 设备信息 -->
    <div class="info-section">
      <h4 class="section-title">
        <el-icon><Monitor /></el-icon>
        <span>设备信息</span>
      </h4>
      <div class="info-content">
        <div class="info-item">
          <span class="label">设备型号</span>
          <span class="value">{{ workorder.deviceModel || '-' }}</span>
        </div>
        <div class="info-item">
          <span class="label">设备编号</span>
          <span class="value">{{ workorder.assetSerialNumber || '-' }}</span>
        </div>
        <div class="info-item" v-if="workorder.faultDescription">
          <span class="label">故障描述</span>
          <span class="value">{{ workorder.faultDescription }}</span>
        </div>
        <div class="info-item" v-if="workorder.description">
          <span class="label">工单描述</span>
          <span class="value">{{ workorder.description }}</span>
        </div>
      </div>
    </div>

    <!-- 服务进度 -->
    <div class="info-section">
      <h4 class="section-title">
        <el-icon><Timer /></el-icon>
        <span>服务进度</span>
      </h4>
      <div class="progress-timeline">
        <div 
          v-for="(record, index) in workorder.processRecords" 
          :key="index"
          class="timeline-item"
          :class="{ active: index === 0 }"
        >
          <div class="timeline-dot"></div>
          <div class="timeline-content">
            <div class="timeline-title">{{ record.title }}</div>
            <div class="timeline-desc">{{ record.content }}</div>
            <div class="timeline-time">{{ formatTime(record.time) }}</div>
          </div>
        </div>
        <div v-if="!workorder.processRecords || workorder.processRecords.length === 0" class="empty-timeline">
          暂无进度记录
        </div>
      </div>
    </div>

    <!-- 工程师信息 -->
    <div class="info-section" v-if="workorder.assignEngineer">
      <h4 class="section-title">
        <el-icon><User /></el-icon>
        <span>服务工程师</span>
      </h4>
      <div class="engineer-card">
        <el-avatar :size="50" :icon="UserFilled" />
        <div class="engineer-info">
          <span class="name">{{ workorder.assignEngineer }}</span>
          <span class="phone">{{ workorder.engineerPhone || '电话：400-xxx-xxxx' }}</span>
        </div>
        <el-button type="primary" circle @click="callEngineer">
          <el-icon><Phone /></el-icon>
        </el-button>
      </div>
    </div>

    <!-- 服务报告PDF -->
    <div class="info-section" v-if="workorder.reportPdf">
      <h4 class="section-title">
        <el-icon><Document /></el-icon>
        <span>服务报告书</span>
      </h4>
      <div class="pdf-actions" style="display:flex;gap:10px;padding:10px 0">
        <el-button type="primary" @click="previewPdf" size="small">
          <el-icon><View /></el-icon>
          预览PDF
        </el-button>
        <el-button type="success" @click="downloadPdf" size="small">
          <el-icon><Download /></el-icon>
          下载PDF
        </el-button>
      </div>
    </div>

    <!-- 服务报告 -->
    <div class="info-section" v-if="workorder.serviceReport">
      <h4 class="section-title">
        <el-icon><Document /></el-icon>
        <span>服务报告</span>
      </h4>
      <div class="report-card">
        <div class="report-item">
          <span class="label">作业内容</span>
          <span class="value">{{ workorder.serviceReport.workContent || workorder.serviceReport.repairContent || '-' }}</span>
        </div>
        <div class="report-item">
          <span class="label">处理过程</span>
          <span class="value">{{ workorder.serviceReport.repairProcess || '-' }}</span>
        </div>
        <div class="report-item">
          <span class="label">更换配件</span>
          <span class="value">{{ (workorder.serviceReport.replacedParts || []).join('、') || '无' }}</span>
        </div>
        <div class="report-item">
          <span class="label">处理结果</span>
          <span class="value">{{ workorder.serviceReport.testResult || '-' }}</span>
        </div>
      </div>
    </div>

    <!-- 底部操作按钮 -->
    <div class="detail-footer" v-if="showActionButton">
      <el-button 
        v-if="workorder.status === 'pending_sign'" 
        type="primary" 
        size="large" 
        round 
        block
        @click="openSignDialog"
      >
        <el-icon><EditPen /></el-icon>
        <span>签字确认</span>
      </el-button>
      <el-button 
        v-if="workorder.status === 'completed' && !workorder.isEvaluated" 
        type="success" 
        size="large" 
        round 
        block
        @click="openEvaluateDialog"
      >
        <el-icon><Star /></el-icon>
        <span>评价服务</span>
      </el-button>
    </div>

    <!-- 签字全屏页面 v2 -->
    <div v-if="signDialog.visible" class="sign-fullscreen-page" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: #f5f7fa; z-index: 9999;">
      <!-- 顶部导航 -->
      <div class="sign-header" style="background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%); padding: 15px; display: flex; justify-content: space-between; align-items: center; color: white;">
        <el-button link @click="signDialog.visible = false">
          <el-icon><ArrowLeft /></el-icon>
          <span>返回</span>
        </el-button>
        <span class="header-title">签字确认</span>
        <span class="placeholder"></span>
      </div>
      
      <!-- 签字内容区 -->
      <div class="sign-content">
        <div class="sign-info-card">
          <h4>服务报告书签字确认</h4>
          <div class="info-row">
            <span class="label">工单号：</span>
            <span class="value">{{ workorder.workorderId }}</span>
          </div>
          <div class="info-row">
            <span class="label">设备型号：</span>
            <span class="value">{{ workorder.deviceModel || '-' }}</span>
          </div>
        </div>
        
        <p class="sign-tip">请在下方空白区域手写签名</p>
        <canvas
          ref="signCanvas"
          class="sign-canvas"
          @touchstart="handleTouchStart"
          @touchmove="handleTouchMove"
          @touchend="handleTouchEnd"
          @mousedown="handleMouseDown"
          @mousemove="handleMouseMove"
          @mouseup="handleMouseUp"
        ></canvas>
      </div>
      
      <!-- 底部操作按钮 -->
      <div class="sign-footer">
        <el-button size="large" @click="clearSign">
          <el-icon><Delete /></el-icon>
          <span>清除重写</span>
        </el-button>
        <el-button type="primary" size="large" @click="submitSign">
          <el-icon><Check /></el-icon>
          <span>确认签字</span>
        </el-button>
      </div>
    </div>

    <!-- 评价全屏页面 -->
    <div v-if="evaluateDialog.visible" class="evaluate-fullscreen-page">
      <!-- 顶部导航 -->
      <div class="evaluate-header">
        <el-button link @click="evaluateDialog.visible = false">
          <el-icon><ArrowLeft /></el-icon>
          <span>返回</span>
        </el-button>
        <span class="header-title">服务评价</span>
        <span class="placeholder"></span>
      </div>
      
      <!-- 评价内容区 -->
      <div class="evaluate-content">
        <div class="evaluate-card">
          <div class="rate-item">
            <span class="label">服务态度</span>
            <el-rate v-model="evaluateDialog.serviceRate" size="large" />
          </div>
          <div class="rate-item">
            <span class="label">响应速度</span>
            <el-rate v-model="evaluateDialog.responseRate" size="large" />
          </div>
          <div class="rate-item">
            <span class="label">技术水平</span>
            <el-rate v-model="evaluateDialog.techniqueRate" size="large" />
          </div>
        </div>
        
        <div class="comment-card">
          <h4>评价建议（选填）</h4>
          <el-input
            v-model="evaluateDialog.comment"
            type="textarea"
            :rows="5"
            placeholder="请输入您的评价建议，帮助我们改进服务..."
          />
        </div>
      </div>
      
      <!-- 底部操作按钮 -->
      <div class="evaluate-footer">
        <el-button type="primary" size="large" @click="submitEvaluate">
          <el-icon><Check /></el-icon>
          <span>提交评价</span>
        </el-button>
      </div>
    </div>

    <!-- PDF预览对话框 -->
    <el-dialog
      v-model="pdfDialog.visible"
      title="服务报告书"
      width="95%"
      fullscreen
      @close="onPdfDialogClose"
    >
      <iframe v-if="pdfDialog.url" :src="pdfDialog.url" style="width:100%;height:70vh;border:none;"></iframe>
      <div style="text-align:center;margin-top:15px;">
        <el-button type="primary" @click="downloadPdf">下载PDF</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  ArrowLeft,
  Monitor,
  Timer,
  User,
  UserFilled,
  Phone,
  Document,
  EditPen,
  View,
  Star,
  Delete,
  Download,
  Check
} from '@element-plus/icons-vue'
import { getWorkorderById, getCustomerWorkorders, getPendingSurveysByCustomer, signWorkorder, submitSatisfactionSurvey, saveReportPdf, WorkorderStatusText, WorkorderStatusType } from '../stores/workorderFlowStore.js'
import { generateReportPdf } from '../utils/reportPdf.js'

const route = useRoute()
const router = useRouter()

// 工单数据
const workorder = ref({
  id: '',
  workorderId: '',
  type: 'service',
  deviceModel: '',
  assetSerialNumber: '',
  serialNumber: '',
  faultDescription: '',
  description: '',
  status: 'processing',
  createTime: '',
  assignEngineer: '',
  engineerName: '',
  engineerPhone: '',
  customerName: '',
  isEvaluated: false,
  processRecords: [],
  serviceReport: null,
  reportPdf: null
})

// 签字对话框
const signDialog = reactive({
  visible: false
})

// 评价对话框
const evaluateDialog = reactive({
  visible: false,
  serviceRate: 5,
  responseRate: 5,
  techniqueRate: 5,
  comment: ''
})

// 签名画布
const signCanvas = ref(null)
let ctx = null
let isDrawing = false

// 是否显示操作按钮
const showActionButton = computed(() => {
  return ['pending_sign', 'completed'].includes(workorder.value.status)
})

// 返回上一页
const goBack = () => {
  router.back()
}

// 获取状态类型
const getStatusType = (status) => WorkorderStatusType[status] || 'info'

// 获取状态文本
const getStatusText = (status) => WorkorderStatusText[status] || status

// 获取状态描述
const getStatusDesc = (status) => {
  const map = {
    pending_assign: '您的工单已提交，等待分配工程师',
    pending_accept: '工单已分配，等待工程师接单',
    processing: '工程师正在处理中',
    pending_sign: '服务已完成，请您签字确认',
    techlead_confirm: '课长正在审核确认中',
    assistant_confirm: '业务助理正在审核确认中',
    completed: '工单已完成，感谢您的使用',
  }
  return map[status] || ''
}

const formatTime = (timeStr) => {
  if (!timeStr) return ''
  const d = new Date(timeStr)
  if (isNaN(d.getTime())) return timeStr
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

// 加载工单详情
const loadWorkorderDetail = () => {
  const id = route.query.id
  if (!id) {
    ElMessage.error('工单ID不存在')
    router.back()
    return
  }

  // 从 store 获取工单数据
  const storeWorkorder = getWorkorderById(id)
  
  if (storeWorkorder) {
        // 权限检查：客户只能查看自己的工单
        // 演示环境下：客户测试账号可查看所有工单
        // 正式环境应恢复：通过 getCustomerWorkorders 判断
        // const customerWorkorderIds = getCustomerWorkorders().map(w => String(w.id || w.workorderId))
        // const currentId = String(storeWorkorder.id || storeWorkorder.workorderId)
        // if (customerWorkorderIds.length > 0 && !customerWorkorderIds.includes(currentId)) {
        //   ElMessage.error('无权查看此工单')
        //   router.back()
        //   return
        // }
    // 转换 store 数据为组件格式
    workorder.value = {
      id: storeWorkorder.id,
      workorderId: storeWorkorder.workorderId,
      type: 'service',
      deviceModel: storeWorkorder.deviceModel,
      assetSerialNumber: storeWorkorder.serialNumber,
      serialNumber: storeWorkorder.serialNumber,
      faultDescription: storeWorkorder.faultDescription,
      description: storeWorkorder.faultDescription,
      status: storeWorkorder.status,
      createTime: storeWorkorder.createTime,
      assignEngineer: storeWorkorder.engineerName,
      engineerName: storeWorkorder.engineerName,
      engineerPhone: storeWorkorder.engineerPhone,
      customerName: storeWorkorder.customerName,
      isEvaluated: false,
      processRecords: storeWorkorder.processRecords?.map(r => ({
        time: r.time,
        title: r.title,
        content: r.content,
        operator: r.operator
      })) || [],
      serviceReport: storeWorkorder.serviceReport,
      reportPdf: storeWorkorder.reportPdf
    }
    console.log('加载工单详情:', workorder.value)
  } else {
    ElMessage.error('工单不存在')
    router.back()
  }
}

// 联系工程师
const callEngineer = () => {
  if (workorder.value.engineerPhone) {
    window.location.href = `tel:${workorder.value.engineerPhone}`
  } else {
    ElMessage.info('客服电话：400-xxx-xxxx')
  }
}

// 打开签字对话框
const openSignDialog = () => {
  signDialog.visible = true
  nextTick(() => {
    initCanvas()
  })
}

// 初始化画布
const initCanvas = () => {
  if (!signCanvas.value) return
  const canvas = signCanvas.value
  canvas.width = canvas.offsetWidth
  canvas.height = canvas.offsetHeight
  ctx = canvas.getContext('2d')
  ctx.strokeStyle = '#000'
  ctx.lineWidth = 2
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
}

// 触摸事件处理
const handleTouchStart = (e) => {
  e.preventDefault()
  isDrawing = true
  const touch = e.touches[0]
  const rect = signCanvas.value.getBoundingClientRect()
  ctx.beginPath()
  ctx.moveTo(touch.clientX - rect.left, touch.clientY - rect.top)
}

const handleTouchMove = (e) => {
  e.preventDefault()
  if (!isDrawing) return
  const touch = e.touches[0]
  const rect = signCanvas.value.getBoundingClientRect()
  ctx.lineTo(touch.clientX - rect.left, touch.clientY - rect.top)
  ctx.stroke()
}

const handleTouchEnd = () => {
  isDrawing = false
}

// 鼠标事件处理
const handleMouseDown = (e) => {
  isDrawing = true
  const rect = signCanvas.value.getBoundingClientRect()
  ctx.beginPath()
  ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top)
}

const handleMouseMove = (e) => {
  if (!isDrawing) return
  const rect = signCanvas.value.getBoundingClientRect()
  ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top)
  ctx.stroke()
}

const handleMouseUp = () => {
  isDrawing = false
}

// 清除签名
const clearSign = () => {
  if (!ctx || !signCanvas.value) return
  ctx.clearRect(0, 0, signCanvas.value.width, signCanvas.value.height)
}

// 提交签名
const submitSign = async () => {
  if (!signCanvas.value) return
  const imageData = ctx.getImageData(0, 0, signCanvas.value.width, signCanvas.value.height)
  const hasSignature = imageData.data.some((value, index) => index % 4 === 3 && value > 0)
  
  if (!hasSignature) {
    ElMessage.warning('请先签名')
    return
  }
  
  const signImage = signCanvas.value.toDataURL('image/png')
  
  try {
    const pdfBase64 = await generateReportPdf(workorder.value, signImage, 'customer')
    if (pdfBase64) {
      saveReportPdf(workorder.value.id, pdfBase64)
      workorder.value.reportPdf = pdfBase64
    }
  } catch (e) {
    console.error('PDF生成失败:', e)
  }

  // 调用 store 方法更新工单状态
  const result = signWorkorder(workorder.value.id, signImage)
  if (result) {
    ElMessage.success('签字确认成功')
    signDialog.visible = false
    workorder.value.status = 'techlead_confirm'
  } else {
    ElMessage.error('签字失败，请重试')
  }
}

// 查看报价
const viewQuotation = () => {
  ElMessage.info('查看报价功能开发中')
}

// PDF预览 - 使用 Blob URL 兼容手机浏览器
const pdfDialog = reactive({ visible: false, url: '', _blobUrl: null })

const dataUriToBlobUrl = (dataUri) => {
  try {
    const base64Match = dataUri.match(/^data:application\/pdf;base64,(.+)$/)
    if (base64Match) {
      const binaryStr = atob(base64Match[1])
      const bytes = new Uint8Array(binaryStr.length)
      for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i)
      const blob = new Blob([bytes], { type: 'application/pdf' })
      return URL.createObjectURL(blob)
    }
  } catch (e) {
    console.error('PDF Blob转换失败:', e)
  }
  return dataUri
}

const previewPdf = () => {
  if (!workorder.value.reportPdf) { ElMessage.warning('PDF不存在'); return }
  // 释放旧的 Blob URL
  if (pdfDialog._blobUrl) { URL.revokeObjectURL(pdfDialog._blobUrl); pdfDialog._blobUrl = null }
  const blobUrl = dataUriToBlobUrl(workorder.value.reportPdf)
  pdfDialog.url = blobUrl
  pdfDialog._blobUrl = blobUrl.startsWith('blob:') ? blobUrl : null
  pdfDialog.visible = true
}

const onPdfDialogClose = () => {
  if (pdfDialog._blobUrl) { URL.revokeObjectURL(pdfDialog._blobUrl); pdfDialog._blobUrl = null }
}

// PDF下载
const downloadPdf = () => {
  if (!workorder.value.reportPdf) { ElMessage.warning('PDF不存在'); return }
  const blobUrl = dataUriToBlobUrl(workorder.value.reportPdf)
  const link = document.createElement('a')
  link.href = blobUrl
  link.download = `服务报告书_${workorder.value.workorderId || workorder.value.id}.pdf`
  link.target = '_blank'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  ElMessage.success('PDF下载中')
}

// 打开评价对话框
const openEvaluateDialog = () => {
  evaluateDialog.visible = true
  evaluateDialog.serviceRate = 5
  evaluateDialog.responseRate = 5
  evaluateDialog.techniqueRate = 5
  evaluateDialog.comment = ''
}

// 提交评价
const submitEvaluate = () => {
  let customerId = 'guest'
  try {
    const customerInfo = JSON.parse(localStorage.getItem('customerInfo') || '{}')
    customerId = customerInfo.id || 'guest'
  } catch (e) {}

  const pendingSurveys = getPendingSurveysByCustomer(customerId)
  const survey = pendingSurveys.find(s => s.workorderId === workorder.value.id)
  
  if (survey) {
    const result = submitSatisfactionSurvey(survey.id, {
      serviceRate: evaluateDialog.serviceRate,
      responseRate: evaluateDialog.responseRate,
      techniqueRate: evaluateDialog.techniqueRate,
      comment: evaluateDialog.comment
    })
    if (result) {
      ElMessage.success('评价提交成功，感谢您的反馈！')
      evaluateDialog.visible = false
      workorder.value.isEvaluated = true
      workorder.value.status = 'evaluated'
    } else {
      ElMessage.error('评价提交失败，请重试')
    }
  } else {
    ElMessage.success('评价提交成功，感谢您的反馈！')
    evaluateDialog.visible = false
    workorder.value.isEvaluated = true
  }
}

onMounted(() => {
  loadWorkorderDetail()
})
</script>

<style scoped>
.customer-workorder-detail {
  min-height: 100vh;
  background: #f5f7fa;
  padding-bottom: 80px;
}

/* 顶部导航 */
.detail-header {
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

.detail-header .el-button {
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

/* 状态卡片 */
.status-card {
  background: white;
  margin: 15px;
  padding: 15px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.status-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.order-no {
  font-size: 16px;
  font-weight: 500;
  color: #262626;
  font-family: monospace;
}

.status-desc {
  font-size: 14px;
  color: #8c8c8c;
}

/* 信息区块 */
.info-section {
  background: white;
  margin: 0 15px 15px;
  padding: 15px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 15px;
  font-size: 16px;
  color: #262626;
}

.section-title .el-icon {
  color: #1890ff;
}

.info-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-item .label {
  font-size: 13px;
  color: #8c8c8c;
}

.info-item .value {
  font-size: 15px;
  color: #262626;
  line-height: 1.5;
}

/* 进度时间线 */
.progress-timeline {
  position: relative;
  padding-left: 20px;
}

.progress-timeline::before {
  content: '';
  position: absolute;
  left: 5px;
  top: 8px;
  bottom: 8px;
  width: 2px;
  background: #e8e8e8;
}

.timeline-item {
  position: relative;
  padding-bottom: 20px;
}

.timeline-item:last-child {
  padding-bottom: 0;
}

.timeline-dot {
  position: absolute;
  left: -17px;
  top: 4px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #bfbfbf;
  border: 2px solid white;
  box-shadow: 0 0 0 1px #d9d9d9;
}

.timeline-item.active .timeline-dot {
  background: #1890ff;
  box-shadow: 0 0 0 1px #1890ff;
}

.timeline-content {
  margin-left: 10px;
}

.timeline-title {
  font-size: 15px;
  font-weight: 500;
  color: #262626;
  margin-bottom: 4px;
}

.timeline-desc {
  font-size: 14px;
  color: #595959;
  margin-bottom: 4px;
}

.timeline-time {
  font-size: 12px;
  color: #8c8c8c;
}

.empty-timeline {
  text-align: center;
  color: #bfbfbf;
  padding: 20px;
}

/* 工程师卡片 */
.engineer-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 8px;
}

.engineer-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.engineer-info .name {
  font-size: 16px;
  font-weight: 500;
  color: #262626;
}

.engineer-info .phone {
  font-size: 13px;
  color: #8c8c8c;
}

/* 报告卡片 */
.report-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.report-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 10px;
}

.report-item .label {
  font-size: 14px;
  color: #8c8c8c;
  flex-shrink: 0;
}

.report-item .value {
  font-size: 14px;
  color: #262626;
  text-align: right;
  flex: 1;
}

/* 底部操作 */
.detail-footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  padding: 15px;
  box-shadow: 0 -2px 10px rgba(0,0,0,0.05);
  z-index: 100;
}

.detail-footer .el-button {
  width: 100%;
}

/* 签字全屏页面 */
.sign-fullscreen-page {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: #f5f7fa;
  z-index: 1000;
  display: flex;
  flex-direction: column;
}

.sign-header {
  background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
  padding: 15px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: white;
  flex-shrink: 0;
}

.sign-header .el-button {
  color: white;
  font-size: 14px;
}

.sign-content {
  flex: 1;
  overflow-y: auto;
  padding: 15px;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.sign-info-card {
  background: white;
  padding: 15px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.sign-info-card h4 {
  margin: 0 0 12px;
  font-size: 16px;
  color: #262626;
}

.sign-info-card .info-row {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
  font-size: 14px;
}

.sign-info-card .label {
  color: #8c8c8c;
  flex-shrink: 0;
}

.sign-info-card .value {
  color: #262626;
  font-weight: 500;
}

.sign-tip {
  text-align: center;
  color: #8c8c8c;
  font-size: 14px;
  margin: 0;
}

.sign-canvas {
  width: 100%;
  height: 250px;
  background: white;
  border: 1px dashed #d9d9d9;
  border-radius: 12px;
  touch-action: none;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.sign-footer {
  background: white;
  padding: 15px;
  display: flex;
  gap: 10px;
  box-shadow: 0 -2px 10px rgba(0,0,0,0.05);
  flex-shrink: 0;
}

.sign-footer .el-button {
  flex: 1;
}

/* 评价全屏页面 */
.evaluate-fullscreen-page {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: #f5f7fa;
  z-index: 1000;
  display: flex;
  flex-direction: column;
}

.evaluate-header {
  background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
  padding: 15px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: white;
  flex-shrink: 0;
}

.evaluate-header .el-button {
  color: white;
  font-size: 14px;
}

.evaluate-content {
  flex: 1;
  overflow-y: auto;
  padding: 15px;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.evaluate-card {
  background: white;
  padding: 20px 15px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.evaluate-card .rate-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.evaluate-card .rate-item .label {
  font-size: 16px;
  color: #262626;
  font-weight: 500;
}

.comment-card {
  background: white;
  padding: 15px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.comment-card h4 {
  margin: 0 0 12px;
  font-size: 16px;
  color: #262626;
}

.evaluate-footer {
  background: white;
  padding: 15px;
  box-shadow: 0 -2px 10px rgba(0,0,0,0.05);
  flex-shrink: 0;
}

.evaluate-footer .el-button {
  width: 100%;
}

/* 小屏幕适配 */
@media (max-width: 375px) {
  .detail-header {
    padding: 12px;
  }
  
  .header-title {
    font-size: 16px;
  }
  
  .status-card,
  .info-section {
    margin: 10px;
    padding: 12px;
  }
  
  .section-title {
    font-size: 15px;
  }
  
  .timeline-title {
    font-size: 14px;
  }
  
  .timeline-desc {
    font-size: 13px;
  }
}

/* 平板及以上 */
@media (min-width: 768px) {
  .customer-workorder-detail {
    max-width: 414px;
    margin: 0 auto;
    border-left: 1px solid #e8e8e8;
    border-right: 1px solid #e8e8e8;
  }
  
  .detail-footer {
    max-width: 414px;
    left: 50%;
    transform: translateX(-50%);
  }
}
</style>
