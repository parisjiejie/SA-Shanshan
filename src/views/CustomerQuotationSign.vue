<template>
  <div class="customer-quotation-sign">
    <!-- 顶部导航 -->
    <div class="sign-header">
      <el-button link @click="goBack">
        <el-icon><ArrowLeft /></el-icon>
        <span>返回</span>
      </el-button>
      <span class="header-title">报价单确认</span>
      <span class="placeholder"></span>
    </div>

    <!-- 报价单内容区 -->
    <div class="quotation-content" v-if="!signMode">
      <!-- 报价单头部信息 -->
      <div class="quotation-header-card">
        <div class="quotation-status">
          <el-tag :type="getStatusType(quotation.status)" size="large">
            {{ getStatusText(quotation.status) }}
          </el-tag>
        </div>
        <div class="quotation-no">{{ quotation.quotationNo }}</div>
        <div class="quotation-date">报价日期：{{ quotation.quotationDate }}</div>
      </div>

      <!-- 客户信息 -->
      <div class="info-section">
        <h4 class="section-title">
          <el-icon><User /></el-icon>
          <span>客户信息</span>
        </h4>
        <div class="info-grid">
          <div class="info-item">
            <span class="label">客户名称</span>
            <span class="value">{{ quotation.customerName }}</span>
          </div>
          <div class="info-item">
            <span class="label">联系人</span>
            <span class="value">{{ quotation.contactName }}</span>
          </div>
          <div class="info-item">
            <span class="label">联系电话</span>
            <span class="value">{{ quotation.contactPhone }}</span>
          </div>
          <div class="info-item">
            <span class="label">关联工单</span>
            <span class="value">{{ quotation.workorderId }}</span>
          </div>
        </div>
      </div>

      <!-- 配件明细 -->
      <div class="info-section">
        <h4 class="section-title">
          <el-icon><Goods /></el-icon>
          <span>配件明细</span>
          <span class="item-count">共 {{ quotation.items?.length || 0 }} 项</span>
        </h4>
        <div class="items-list">
          <div v-for="(item, index) in quotation.items" :key="index" class="item-card">
            <div class="item-header">
              <span class="item-index">{{ index + 1 }}</span>
              <span class="item-name">{{ item.name }}</span>
            </div>
            <div class="item-details">
              <div class="detail-row">
                <span class="label">型号规格</span>
                <span class="value">{{ item.model || '-' }}</span>
              </div>
              <div class="detail-row">
                <span class="label">数量</span>
                <span class="value">{{ item.quantity }} {{ item.unit || '件' }}</span>
              </div>
              <div class="detail-row">
                <span class="label">单价</span>
                <span class="value price">¥{{ formatAmount(item.salePrice) }}</span>
              </div>
              <div class="detail-row">
                <span class="label">小计</span>
                <span class="value price">¥{{ formatAmount(item.salePrice * item.quantity) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 费用汇总 -->
      <div class="info-section">
        <h4 class="section-title">
          <el-icon><Money /></el-icon>
          <span>费用汇总</span>
        </h4>
        <div class="amount-summary">
          <div class="summary-row">
            <span class="label">配件合计</span>
            <span class="value">¥{{ formatAmount(quotation.subtotal) }}</span>
          </div>
          <div class="summary-row">
            <span class="label">人工费用</span>
            <span class="value">¥{{ formatAmount(quotation.laborCost) }}</span>
          </div>
          <div class="summary-row">
            <span class="label">其他费用</span>
            <span class="value">¥{{ formatAmount(quotation.otherCost) }}</span>
          </div>
          <div class="summary-row discount" v-if="quotation.discount > 0">
            <span class="label">优惠金额</span>
            <span class="value">-¥{{ formatAmount(quotation.discount) }}</span>
          </div>
          <div class="summary-row total">
            <span class="label">报价总额</span>
            <span class="value">¥{{ formatAmount(quotation.totalAmount) }}</span>
          </div>
        </div>
      </div>

      <!-- 备注说明 -->
      <div class="info-section" v-if="quotation.remark">
        <h4 class="section-title">
          <el-icon><Document /></el-icon>
          <span>备注说明</span>
        </h4>
        <div class="remark-content">{{ quotation.remark }}</div>
      </div>

      <!-- 有效期说明 -->
      <div class="validity-notice">
        <el-icon><InfoFilled /></el-icon>
        <span>此报价单有效期至 {{ quotation.validityDate }}，请在有效期内确认</span>
      </div>
    </div>

    <!-- 签字模式 -->
    <div class="sign-mode-content" v-else>
      <div class="sign-info-card">
        <h4>报价单签字确认</h4>
        <div class="info-row">
          <span class="label">报价单号：</span>
          <span class="value">{{ quotation.quotationNo }}</span>
        </div>
        <div class="info-row">
          <span class="label">报价金额：</span>
          <span class="value amount">¥{{ formatAmount(quotation.totalAmount) }}</span>
        </div>
      </div>

      <p class="sign-tip">请在下方空白区域手写签名，表示您已确认并同意此报价</p>

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
    <div class="action-footer" v-if="!signMode">
      <el-button size="large" @click="goBack">取消</el-button>
      <el-button type="primary" size="large" @click="enterSignMode">
        <el-icon><EditPen /></el-icon>
        <span>确认报价</span>
      </el-button>
    </div>

    <div class="action-footer" v-else>
      <el-button size="large" @click="signMode = false">返回</el-button>
      <el-button size="large" @click="clearSignature">清除重写</el-button>
      <el-button type="primary" size="large" @click="submitSignature">
        <el-icon><Check /></el-icon>
        <span>提交确认</span>
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  ArrowLeft,
  User,
  Goods,
  Money,
  Document,
  InfoFilled,
  EditPen,
  Check
} from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()

// 签字模式
const signMode = ref(false)

// 签名画布
const signCanvas = ref(null)
let ctx = null
let isDrawing = false

// 报价单数据
const quotation = reactive({
  id: '',
  quotationNo: '',
  quotationDate: '',
  validityDate: '',
  status: 'sent',
  customerName: '',
  contactName: '',
  contactPhone: '',
  workorderId: '',
  items: [],
  subtotal: 0,
  laborCost: 0,
  otherCost: 0,
  discount: 0,
  totalAmount: 0,
  remark: ''
})

// 返回上一页
const goBack = () => {
  router.back()
}

// 获取状态类型
const getStatusType = (status) => {
  const map = {
    'draft': 'info',
    'pending': 'warning',
    'sent': 'primary',
    'approved': 'success',
    'rejected': 'danger',
    'expired': 'info'
  }
  return map[status] || 'info'
}

// 获取状态文本
const getStatusText = (status) => {
  const map = {
    'draft': '草稿',
    'pending': '待审核',
    'sent': '待确认',
    'approved': '已确认',
    'rejected': '已拒绝',
    'expired': '已过期'
  }
  return map[status] || status
}

// 格式化金额
const formatAmount = (amount) => {
  if (amount === undefined || amount === null) return '0.00'
  return amount.toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

// 加载报价单数据
const loadQuotationData = () => {
  const id = route.query.id
  if (!id) {
    ElMessage.error('报价单ID不存在')
    router.back()
    return
  }

  // 从 localStorage 获取报价单数据
  try {
    const storedQuotations = JSON.parse(localStorage.getItem('quotations') || '[]')
    const foundQuotation = storedQuotations.find(q => q.id === id || q.quotationNo === id)

    if (foundQuotation) {
      Object.assign(quotation, foundQuotation)
    } else {
      // 使用模拟数据
      Object.assign(quotation, {
        id: id,
        quotationNo: 'QT20260407651',
        quotationDate: '2026-04-07',
        validityDate: '2026-04-14',
        status: 'sent',
        customerName: '某某科技有限公司',
        contactName: '张经理',
        contactPhone: '13800138000',
        workorderId: 'WO2024001',
        items: [
          {
            name: '激光切割头保护镜片',
            model: 'LP-28mm',
            quantity: 2,
            unit: '片',
            salePrice: 280.00
          },
          {
            name: '聚焦镜片',
            model: 'FJ-50.8mm',
            quantity: 1,
            unit: '片',
            salePrice: 450.00
          },
          {
            name: '陶瓷环',
            model: 'TH-32mm',
            quantity: 3,
            unit: '个',
            salePrice: 120.00
          }
        ],
        subtotal: 1450.00,
        laborCost: 300.00,
        otherCost: 0,
        discount: 0,
        totalAmount: 1750.00,
        remark: '以上报价含税费，配件质保3个月。'
      })
    }
  } catch (e) {
    console.error('加载报价单失败:', e)
    ElMessage.error('加载报价单失败')
  }
}

// 进入签字模式
const enterSignMode = () => {
  signMode.value = true
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
  ctx.lineWidth = 3
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
const clearSignature = () => {
  if (!ctx || !signCanvas.value) return
  ctx.clearRect(0, 0, signCanvas.value.width, signCanvas.value.height)
}

// 提交签名
const submitSignature = () => {
  if (!signCanvas.value) return

  // 检查是否已签名
  const imageData = ctx.getImageData(0, 0, signCanvas.value.width, signCanvas.value.height)
  const hasSignature = imageData.data.some((value, index) => index % 4 === 3 && value > 0)

  if (!hasSignature) {
    ElMessage.warning('请先签名')
    return
  }

  // 保存签名图片
  const signImage = signCanvas.value.toDataURL('image/png')
  console.log('签名图片：', signImage)

  // 更新报价单状态
  try {
    const storedQuotations = JSON.parse(localStorage.getItem('quotations') || '[]')
    const index = storedQuotations.findIndex(q => q.id === quotation.id)
    if (index !== -1) {
      storedQuotations[index].status = 'confirmed'
      storedQuotations[index].customerSign = signImage
      storedQuotations[index].confirmTime = new Date().toISOString()
      storedQuotations[index].confirmedBy = quotation.contactName || '客户'
      localStorage.setItem('quotations', JSON.stringify(storedQuotations))

      // 添加业务助理通知
      const notifications = JSON.parse(localStorage.getItem('staffNotifications') || '[]')
      notifications.push({
        id: 'NOTIFY_' + Date.now(),
        type: 'quotation_confirmed',
        title: '报价单已确认',
        message: `客户 ${storedQuotations[index].customerName} 已确认报价单 ${storedQuotations[index].quotationNo}，并已完成签字`,
        quotationId: quotation.id,
        quotationNo: storedQuotations[index].quotationNo,
        customerName: storedQuotations[index].customerName,
        createTime: new Date().toISOString(),
        isRead: false
      })
      localStorage.setItem('staffNotifications', JSON.stringify(notifications))

      // 触发业务助理通知更新事件
      window.dispatchEvent(new CustomEvent('staff-notification-updated', {
        detail: { type: 'quotation_confirmed', quotationId: quotation.id }
      }))
    }
  } catch (e) {
    console.error('保存确认状态失败:', e)
  }

  ElMessage.success('报价单确认成功！')

  // 触发报价单更新事件
  window.dispatchEvent(new CustomEvent('quotation-updated', {
    detail: { quotationId: quotation.id, action: 'confirmed', customerSign: signImage }
  }))

  // 返回客户工作台
  setTimeout(() => {
    router.push('/customer-workspace')
  }, 1500)
}

onMounted(() => {
  loadQuotationData()
})
</script>

<style scoped>
.customer-quotation-sign {
  min-height: 100vh;
  background: #f5f7fa;
  padding-bottom: 80px;
}

/* 顶部导航 */
.sign-header {
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

.sign-header .el-button {
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

/* 报价单内容区 */
.quotation-content {
  padding: 15px;
}

/* 报价单头部卡片 */
.quotation-header-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 15px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.quotation-status {
  margin-bottom: 12px;
}

.quotation-no {
  font-size: 20px;
  font-weight: bold;
  color: #262626;
  margin-bottom: 8px;
  font-family: monospace;
}

.quotation-date {
  font-size: 14px;
  color: #8c8c8c;
}

/* 信息区块 */
.info-section {
  background: white;
  border-radius: 12px;
  padding: 15px;
  margin-bottom: 15px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 15px;
  font-size: 16px;
  color: #262626;
  font-weight: 500;
}

.section-title .el-icon {
  color: #1890ff;
}

.item-count {
  margin-left: auto;
  font-size: 13px;
  color: #8c8c8c;
  font-weight: normal;
}

/* 信息网格 */
.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-item .label {
  font-size: 12px;
  color: #8c8c8c;
}

.info-item .value {
  font-size: 14px;
  color: #262626;
  font-weight: 500;
}

/* 配件列表 */
.items-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.item-card {
  background: #f5f7fa;
  border-radius: 8px;
  padding: 12px;
}

.item-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}

.item-index {
  width: 22px;
  height: 22px;
  background: #1890ff;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
}

.item-name {
  font-size: 15px;
  font-weight: 500;
  color: #262626;
}

.item-details {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  padding-left: 30px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.detail-row .label {
  font-size: 12px;
  color: #8c8c8c;
}

.detail-row .value {
  font-size: 13px;
  color: #262626;
}

.detail-row .value.price {
  color: #f56c6c;
  font-weight: 500;
}

/* 费用汇总 */
.amount-summary {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px dashed #e8e8e8;
}

.summary-row:last-child {
  border-bottom: none;
}

.summary-row .label {
  font-size: 14px;
  color: #595959;
}

.summary-row .value {
  font-size: 14px;
  color: #262626;
  font-weight: 500;
}

.summary-row.discount .value {
  color: #67c23a;
}

.summary-row.total {
  padding-top: 12px;
  margin-top: 8px;
  border-top: 2px solid #e8e8e8;
}

.summary-row.total .label {
  font-size: 16px;
  font-weight: bold;
  color: #262626;
}

.summary-row.total .value {
  font-size: 20px;
  font-weight: bold;
  color: #f56c6c;
}

/* 备注 */
.remark-content {
  font-size: 14px;
  color: #595959;
  line-height: 1.6;
  padding: 10px;
  background: #f5f7fa;
  border-radius: 8px;
}

/* 有效期提示 */
.validity-notice {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 15px;
  background: #e6f7ff;
  border-radius: 8px;
  margin: 0 15px 15px;
  color: #1890ff;
  font-size: 13px;
}

.validity-notice .el-icon {
  font-size: 16px;
}

/* 签字模式内容 */
.sign-mode-content {
  padding: 15px;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.sign-info-card {
  background: white;
  border-radius: 12px;
  padding: 15px;
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

.sign-info-card .value.amount {
  color: #f56c6c;
  font-size: 18px;
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

/* 底部操作按钮 */
.action-footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  padding: 15px;
  display: flex;
  gap: 10px;
  box-shadow: 0 -2px 10px rgba(0,0,0,0.05);
  z-index: 100;
}

.action-footer .el-button {
  flex: 1;
}

/* 小屏幕适配 */
@media (max-width: 375px) {
  .sign-header {
    padding: 12px;
  }

  .header-title {
    font-size: 16px;
  }

  .quotation-content {
    padding: 10px;
  }

  .quotation-header-card {
    padding: 15px;
  }

  .quotation-no {
    font-size: 18px;
  }

  .info-section {
    padding: 12px;
    margin-bottom: 10px;
  }

  .section-title {
    font-size: 15px;
  }

  .info-grid {
    grid-template-columns: 1fr;
    gap: 10px;
  }

  .item-details {
    grid-template-columns: 1fr;
  }

  .sign-canvas {
    height: 200px;
  }
}

/* 平板及以上 */
@media (min-width: 768px) {
  .customer-quotation-sign {
    max-width: 414px;
    margin: 0 auto;
    border-left: 1px solid #e8e8e8;
    border-right: 1px solid #e8e8e8;
  }

  .action-footer {
    max-width: 414px;
    left: 50%;
    transform: translateX(-50%);
  }
}
</style>
