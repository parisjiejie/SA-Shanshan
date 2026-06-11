<template>
  <div class="asset-install-report">
    <!-- 顶部导航 -->
    <div class="report-header">
      <el-button link @click="goBack">
        <el-icon><ArrowLeft /></el-icon>
        <span>返回</span>
      </el-button>
      <span class="header-title">装机报告</span>
      <span class="placeholder"></span>
    </div>

    <!-- 设备信息卡片 -->
    <div class="device-info-card" v-if="deviceInfo">
      <div class="device-header">
        <div class="device-icon">
          <el-icon><Monitor /></el-icon>
        </div>
        <div class="device-title">
          <h3>{{ deviceInfo.model }}</h3>
          <p class="device-sn">序列号: {{ deviceInfo.serialNumber }}</p>
        </div>
      </div>
    </div>

    <!-- 装机报告表单 -->
    <div class="report-form">
      <el-form :model="reportForm" label-position="top" class="mobile-form">
        <!-- 安装日期 -->
        <el-form-item label="安装日期" required>
          <el-date-picker
            v-model="reportForm.installDate"
            type="date"
            placeholder="选择安装日期"
            style="width: 100%"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>

        <!-- 安装地址 -->
        <el-form-item label="安装地址" required>
          <div class="address-input-wrapper">
            <el-input
              v-model="reportForm.installAddress"
              type="textarea"
              :rows="2"
              placeholder="正在获取定位地址..."
              :disabled="isLocating"
            />
            <div v-if="isLocating" class="locating-indicator">
              <el-icon class="rotating"><Loading /></el-icon>
              <span>定位中...</span>
            </div>
            <div v-else-if="locationError" class="location-error">
              <el-icon><Warning /></el-icon>
              <span>{{ locationError }}</span>
            </div>
          </div>
        </el-form-item>

        <!-- 客户名称 -->
        <el-form-item label="客户名称" required>
          <el-input v-model="reportForm.customerName" placeholder="请输入客户名称" />
        </el-form-item>

        <!-- 联系人 -->
        <el-form-item label="联系人" required>
          <el-input v-model="reportForm.contactPerson" placeholder="请输入联系人姓名" />
        </el-form-item>

        <!-- 联系电话 -->
        <el-form-item label="联系电话" required>
          <el-input v-model="reportForm.contactPhone" placeholder="请输入联系电话" />
        </el-form-item>

        <!-- 安装工程师 -->
        <el-form-item label="安装工程师" required>
          <el-input v-model="reportForm.engineerName" placeholder="请输入工程师姓名" />
        </el-form-item>

        <!-- 设备状态 -->
        <el-form-item label="设备运行状态" required>
          <el-radio-group v-model="reportForm.deviceStatus">
            <el-radio-button value="normal">正常运行</el-radio-button>
            <el-radio-button value="debugging">调试中</el-radio-button>
            <el-radio-button value="abnormal">存在异常</el-radio-button>
          </el-radio-group>
        </el-form-item>

        <!-- 安装内容 -->
        <el-form-item label="安装内容">
          <el-checkbox-group v-model="reportForm.installContent">
            <el-checkbox value="unpack">拆箱验货</el-checkbox>
            <el-checkbox value="install">设备安装</el-checkbox>
            <el-checkbox value="debug">设备调试</el-checkbox>
            <el-checkbox value="train">操作培训</el-checkbox>
            <el-checkbox value="accept">验收交付</el-checkbox>
          </el-checkbox-group>
        </el-form-item>

        <!-- 备注说明 -->
        <el-form-item label="备注说明">
          <el-input
            v-model="reportForm.notes"
            type="textarea"
            :rows="3"
            placeholder="请输入其他需要说明的内容..."
          />
        </el-form-item>

        <!-- 客户签字 -->
        <el-form-item label="客户签字确认" required>
          <div class="sign-section">
            <p class="sign-tip">请客户在下方空白区域手写签名</p>
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
            <div class="sign-actions">
              <el-button size="small" @click="clearSignature">清除重写</el-button>
            </div>
          </div>
        </el-form-item>
      </el-form>
    </div>

    <!-- 提交按钮 -->
    <div class="submit-section">
      <el-button type="primary" size="large" class="submit-btn" @click="submitReport">
        <el-icon><Check /></el-icon>
        提交装机报告
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  ArrowLeft,
  Monitor,
  Check,
  Loading,
  Warning
} from '@element-plus/icons-vue'
import { state as workorderFlowState, createWorkorder } from '../stores/workorderFlowStore.js'

const route = useRoute()
const router = useRouter()

// 设备信息
const deviceInfo = ref({
  serialNumber: '',
  model: ''
})

// 定位状态
const isLocating = ref(false)
const locationError = ref('')

// 报告表单
const reportForm = ref({
  installDate: new Date().toISOString().split('T')[0],
  installAddress: '',
  customerName: '',
  contactPerson: '',
  contactPhone: '',
  engineerName: '',
  deviceStatus: 'normal',
  installContent: [],
  notes: ''
})

// 签名画布
const signCanvas = ref(null)
let ctx = null
let isDrawing = false

// 返回上一页
const goBack = () => {
  router.back()
}

// 初始化画布
const initCanvas = () => {
  if (!signCanvas.value) return
  const canvas = signCanvas.value
  const rect = canvas.getBoundingClientRect()
  canvas.width = rect.width
  canvas.height = rect.height
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

// 提交报告
const submitReport = () => {
  // 表单验证
  if (!reportForm.value.installDate) {
    ElMessage.warning('请选择安装日期')
    return
  }
  if (!reportForm.value.installAddress) {
    ElMessage.warning('请输入安装地址')
    return
  }
  if (!reportForm.value.customerName) {
    ElMessage.warning('请输入客户名称')
    return
  }
  if (!reportForm.value.contactPerson) {
    ElMessage.warning('请输入联系人')
    return
  }
  if (!reportForm.value.contactPhone) {
    ElMessage.warning('请输入联系电话')
    return
  }
  if (!reportForm.value.engineerName) {
    ElMessage.warning('请输入安装工程师')
    return
  }

  // 检查签名
  if (!signCanvas.value) {
    ElMessage.warning('请客户签名')
    return
  }
  const imageData = ctx.getImageData(0, 0, signCanvas.value.width, signCanvas.value.height)
  const hasSignature = imageData.data.some((value, index) => index % 4 === 3 && value > 0)
  if (!hasSignature) {
    ElMessage.warning('请客户签名')
    return
  }

  // 保存签名
  const signImage = signCanvas.value.toDataURL('image/png')

  // 生成报告数据
  const reportData = {
    id: 'IR' + Date.now(),
    serialNumber: deviceInfo.value.serialNumber,
    model: deviceInfo.value.model,
    ...reportForm.value,
    customerSign: signImage,
    createTime: new Date().toISOString(),
    status: 'completed'
  }

  // 保存到 localStorage
  try {
    const installReports = JSON.parse(localStorage.getItem('installReports') || '[]')
    installReports.push(reportData)
    localStorage.setItem('installReports', JSON.stringify(installReports))

    // 同时创建安装工单到 workorderFlowState
    const workorder = createWorkorder({
      type: '安装',
      customerId: reportForm.value.customerName,
      customerName: reportForm.value.customerName,
      customerPhone: reportForm.value.contactPhone,
      deviceModel: deviceInfo.value.model,
      serialNumber: deviceInfo.value.serialNumber,
      faultDescription: `设备安装完成，安装地址：${reportForm.value.installAddress}`,
      address: reportForm.value.installAddress
    })

    if (workorder) {
      console.log('安装工单创建成功:', workorder.workorderId)
    }

    ElMessage.success('装机报告提交成功！')
    // 返回设备详情页
    setTimeout(() => {
      router.back()
    }, 1500)
  } catch (e) {
    console.error('保存装机报告失败:', e)
    ElMessage.error('保存失败，请重试')
  }
}

onMounted(() => {
  // 获取路由参数
  const serialNumber = route.query.serial
  const model = route.query.model

  if (serialNumber) {
    deviceInfo.value.serialNumber = serialNumber
  }
  if (model) {
    deviceInfo.value.model = decodeURIComponent(model)
  }

  // 从设备详情页获取更多信息并自动填充
  loadDeviceInfoAndFillForm(serialNumber)

  // 初始化画布
  nextTick(() => {
    initCanvas()
  })
})

// 加载设备信息并自动填充表单
const loadDeviceInfoAndFillForm = (serialNumber) => {
  try {
    // 尝试从 localStorage 获取设备信息（从设备详情页传递过来的）
    const deviceDataStr = localStorage.getItem('currentDeviceInfo')
    let deviceData = null

    if (deviceDataStr) {
      deviceData = JSON.parse(deviceDataStr)
    }

    // 如果 localStorage 中没有，尝试从设备列表中查找
    if (!deviceData && serialNumber) {
      const deviceList = JSON.parse(localStorage.getItem('deviceList') || '[]')
      deviceData = deviceList.find(d => d.serialNumber === serialNumber)
    }

    // 自动填充表单
    if (deviceData) {
      reportForm.value.customerName = deviceData.customerName || ''
      reportForm.value.contactPerson = deviceData.contactPerson || ''
      reportForm.value.contactPhone = deviceData.contactPhone || ''
      reportForm.value.installAddress = deviceData.installAddress || ''
    }

    // 获取当前登录的工程师信息
    const staffAuth = JSON.parse(localStorage.getItem('staffAuth') || '{}')
    if (staffAuth.userName) {
      reportForm.value.engineerName = staffAuth.userName
    }

    // 如果没有安装地址，尝试通过定位获取
    if (!reportForm.value.installAddress) {
      getCurrentLocation()
    }
  } catch (e) {
    console.error('加载设备信息失败:', e)
    // 如果加载失败，仍然尝试获取定位
    getCurrentLocation()
  }
}

// 获取当前定位地址
const getCurrentLocation = () => {
  isLocating.value = true
  locationError.value = ''

  if (!navigator.geolocation) {
    isLocating.value = false
    locationError.value = '浏览器不支持定位功能'
    return
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const { latitude, longitude } = position.coords
      // 使用高德地图逆地理编码API获取地址
      reverseGeocode(latitude, longitude)
    },
    (error) => {
      isLocating.value = false
      switch (error.code) {
        case error.PERMISSION_DENIED:
          locationError.value = '请允许使用定位权限'
          break
        case error.POSITION_UNAVAILABLE:
          locationError.value = '无法获取位置信息'
          break
        case error.TIMEOUT:
          locationError.value = '定位超时，请重试'
          break
        default:
          locationError.value = '定位失败'
      }
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    }
  )
}

// 使用高德地图API进行逆地理编码
const reverseGeocode = async (latitude, longitude) => {
  try {
    // 使用高德地图Web服务API进行逆地理编码
    // 注意：实际项目中需要替换为真实的高德地图Key
    const amapKey = localStorage.getItem('amapKey') || 'YOUR_AMAP_KEY'

    // 如果有配置高德Key，则调用API
    if (amapKey && amapKey !== 'YOUR_AMAP_KEY') {
      const response = await fetch(
        `https://restapi.amap.com/v3/geocode/regeo?key=${amapKey}&location=${longitude},${latitude}&extensions=base`
      )
      const data = await response.json()

      if (data.status === '1' && data.regeocode) {
        reportForm.value.installAddress = data.regeocode.formatted_address
      } else {
        // 如果API调用失败，使用经纬度作为地址
        reportForm.value.installAddress = `经纬度: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
      }
    } else {
      // 如果没有配置高德Key，使用经纬度作为地址
      reportForm.value.installAddress = `经纬度: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
    }
  } catch (e) {
    console.error('逆地理编码失败:', e)
    // 使用经纬度作为备用地址
    reportForm.value.installAddress = `经纬度: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
  } finally {
    isLocating.value = false
  }
}
</script>

<style scoped>
.asset-install-report {
  min-height: 100vh;
  background: #f5f7fa;
  padding-bottom: 100px;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

/* 顶部导航 */
.report-header {
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

/* 报告表单 */
.report-form {
  background: white;
  margin: 15px;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.mobile-form :deep(.el-form-item__label) {
  font-size: 14px;
  color: #262626;
  font-weight: 500;
  padding-bottom: 8px;
}

/* 地址输入区域 */
.address-input-wrapper {
  position: relative;
}

.locating-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
  font-size: 13px;
  color: #1890ff;
}

.locating-indicator .rotating {
  animation: rotate 1s linear infinite;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.location-error {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
  font-size: 13px;
  color: #f56c6c;
}

/* 签字区域 */
.sign-section {
  border: 1px dashed #d9d9d9;
  border-radius: 8px;
  padding: 15px;
  background: #fafafa;
}

.sign-tip {
  font-size: 13px;
  color: #8c8c8c;
  margin: 0 0 10px;
  text-align: center;
}

.sign-canvas {
  width: 100%;
  height: 150px;
  background: white;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  touch-action: none;
}

.sign-actions {
  margin-top: 10px;
  text-align: center;
}

/* 提交按钮 */
.submit-section {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  padding: 15px;
  box-shadow: 0 -2px 10px rgba(0,0,0,0.05);
}

.submit-btn {
  width: 100%;
  height: 44px;
  font-size: 16px;
}

/* 响应式适配 */
@media (min-width: 768px) {
  .asset-install-report {
    max-width: 414px;
    margin: 0 auto;
    border-left: 1px solid #e8e8e8;
    border-right: 1px solid #e8e8e8;
    background: white;
  }

  .submit-section {
    max-width: 414px;
    left: 50%;
    transform: translateX(-50%);
  }
}
</style>
