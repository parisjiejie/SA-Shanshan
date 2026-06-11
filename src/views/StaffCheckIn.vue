<template>
  <div class="staff-checkin-page">
    <div class="page-header">
      <el-button link @click="goBack">
        <el-icon><ArrowLeft /></el-icon>
        <span>返回</span>
      </el-button>
      <span class="header-title">日报打卡</span>
      <span class="placeholder"></span>
    </div>

    <div class="checkin-form">
      <!-- 打卡类型 -->
      <div class="form-section">
        <label class="section-label">打卡类型</label>
        <div class="type-selector">
          <div class="type-card" :class="{ active: form.checkinType === 'workorder' }" @click="switchType('workorder')">
            <div class="type-icon workorder"><el-icon><Document /></el-icon></div>
            <span class="type-name">工单打卡</span>
            <span class="type-desc">安装、维修、试加工、改造</span>
          </div>
          <div class="type-card" :class="{ active: form.checkinType === 'daily' }" @click="switchType('daily')">
            <div class="type-icon activity"><el-icon><OfficeBuilding /></el-icon></div>
            <span class="type-name">日常打卡</span>
            <span class="type-desc">拜访、洽谈、活动</span>
          </div>
        </div>
      </div>

      <!-- 基础信息（自动） -->
      <div class="form-section">
        <div class="section-header">
          <label class="section-label">基础信息</label>
          <el-tag size="small" type="info">自动</el-tag>
        </div>
        <div class="auto-fields">
          <div class="auto-field-item"><span class="auto-label">工程师</span><span class="auto-value">{{ engineerName }}</span></div>
          <div class="auto-field-item"><span class="auto-label">签到时间</span><span class="auto-value time-value">{{ currentTime }}</span></div>
          <div class="auto-field-item">
            <span class="auto-label">打卡地点</span>
            <span class="auto-value">{{ form.location || '获取中...' }}</span>
            <el-button link size="small" @click="refreshLocation" :loading="locationLoading"><el-icon><Refresh /></el-icon></el-button>
          </div>
        </div>
      </div>

      <!-- 工单打卡：选工单（可选） -->
      <template v-if="form.checkinType === 'workorder'">
        <div class="form-section">
          <label class="section-label">关联工单 <span class="optional">（可选）</span></label>
          <div class="select-box" @click="showWorkorderPicker = true">
            <div v-if="form.workorderId" class="selected-value">
              <div class="workorder-title">{{ form.workorderId }}</div>
              <div class="workorder-subtitle">{{ form.customerName }} | {{ selectedWorkorder?.deviceModel }}</div>
            </div>
            <div v-else class="placeholder-text">选择工单（可选）</div>
            <el-icon><ArrowRight /></el-icon>
          </div>
        </div>
        <div class="form-section">
          <label class="section-label">客户名称 <span class="required">*</span></label>
          <el-input v-model="form.customerName" placeholder="选工单自动带入，也可手动输入" clearable />
        </div>
      </template>

      <!-- 日常打卡：客户名称+活动内容 -->
      <template v-if="form.checkinType === 'daily'">
        <div class="form-section">
          <label class="section-label">客户名称 <span class="required">*</span></label>
          <el-input v-model="form.customerName" placeholder="请输入客户名称" clearable />
        </div>
        <div class="form-section">
          <label class="section-label">活动内容 <span class="required">*</span></label>
          <el-input v-model="form.workContent" type="textarea" :rows="3" placeholder="拜访、洽谈、勘查等" maxlength="200" show-word-limit />
        </div>
      </template>

      <!-- 现场拍照 -->
      <div class="form-section">
        <label class="section-label">现场照片 <span class="optional">（可选，最多5张）</span></label>
        <div class="photo-section">
          <div class="photo-list">
            <div v-for="(photo, index) in form.photos" :key="index" class="photo-item">
              <img :src="photo" @click="previewPhoto(photo)" />
              <div class="photo-watermark">{{ form.location }} {{ currentTime }}</div>
              <el-icon class="remove-btn" @click="removePhoto(index)"><Close /></el-icon>
            </div>
          </div>
          <div class="photo-actions" v-if="form.photos.length < 5">
            <div class="photo-btn camera" @click="takePhoto"><el-icon><Camera /></el-icon><span>现场拍照</span></div>
          </div>
        </div>
      </div>
      <input ref="cameraInput" type="file" accept="image/*" capture="environment" style="display: none" @change="handleCameraCapture" />
    </div>

    <div class="submit-section">
      <el-button type="primary" size="large" round block :disabled="!canSubmit" :loading="submitting" @click="submitCheckIn">确认签到</el-button>
      <p class="submit-tips">签到后可在"外勤打卡"中补充签离信息及日报</p>
    </div>

    <!-- 工单选择器 -->
    <el-drawer v-model="showWorkorderPicker" title="选择工单" direction="btt" size="80%" :show-close="false">
      <div class="picker-content">
        <div class="picker-search"><el-input v-model="workorderSearch" placeholder="搜索工单号或客户名称" clearable><template #prefix><el-icon><Search /></el-icon></template></el-input></div>
        <div class="picker-list">
          <div v-for="wo in filteredWorkorders" :key="wo.id" class="picker-item" :class="{ active: form.workorderId === wo.id }" @click="selectWorkorder(wo)">
            <div class="picker-item-main">
              <div class="picker-item-title">{{ wo.id }}</div>
              <div class="picker-item-subtitle">{{ wo.customerName }}</div>
              <div class="picker-item-info">
                <el-tag size="small" :type="getWorkorderTagType(wo)">{{ getWorkorderTagText(wo) }}</el-tag>
                <span>{{ wo.deviceModel }}</span>
              </div>
            </div>
            <el-icon v-if="form.workorderId === wo.id" class="check-icon"><Check /></el-icon>
          </div>
        </div>
        <div class="picker-footer"><el-button block @click="showWorkorderPicker = false">关闭</el-button></div>
      </div>
    </el-drawer>

    <el-dialog v-model="previewVisible" width="95%" :show-close="false" class="preview-dialog">
      <img :src="previewImage" class="preview-img" />
      <template #footer><el-button @click="previewVisible = false">关闭</el-button></template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getCurrentPosition } from '../utils/gps'
import { state as workorderFlowState } from '../stores/workorderFlowStore.js'
import { ArrowLeft, Refresh, Camera, Close, ArrowRight, Search, Check, Document, OfficeBuilding } from '@element-plus/icons-vue'

const router = useRouter(); const route = useRoute()
const currentTime = ref(''); const timeInterval = ref(null)
const staffAuth = JSON.parse(localStorage.getItem('staffAuth') || '{}')
const engineerName = staffAuth.name || staffAuth.username || ''

const form = ref({
  checkinType: 'workorder',
  location: '', address: '', latitude: null, longitude: null,
  workorderId: '', customerName: '', workContent: '', photos: []
})

const locationLoading = ref(false); const submitting = ref(false)
const showWorkorderPicker = ref(false); const workorderSearch = ref('')
const previewVisible = ref(false); const previewImage = ref('')
const cameraInput = ref(null)

const workorders = computed(() => {
  const all = workorderFlowState.workorders || []
  return all
    .filter(w => w.status === 'processing' && (w.engineerId === staffAuth.id || w.engineerName === staffAuth.name))
    .map(w => ({ id: w.workorderId || w.id, rawId: w.id, customerName: w.customerName || '', deviceModel: w.deviceModel || '', category: w.category || 'service', subType: w.subType || '', address: w.address || '' }))
})

const selectedWorkorder = computed(() => workorders.value.find(w => w.id === form.value.workorderId))
const filteredWorkorders = computed(() => {
  if (!workorderSearch.value) return workorders.value
  const s = workorderSearch.value.toLowerCase()
  return workorders.value.filter(w => w.id.toLowerCase().includes(s) || w.customerName.toLowerCase().includes(s))
})

const canSubmit = computed(() => {
  const f = form.value
  if (!f.location) return false
  if (f.checkinType === 'workorder') return !!f.customerName
  return !!f.customerName && !!f.workContent
})

const switchType = (t) => { form.value.checkinType = t }
const goBack = () => router.push('/staff-mobile-workspace')
const updateTime = () => {
  const now = new Date()
  currentTime.value = now.toISOString().slice(0, 19).replace('T', ' ')
}

const refreshLocation = async () => {
  locationLoading.value = true
  try { const p = await getCurrentPosition(); form.value.location = p.address; form.value.address = p.address; form.value.latitude = p.latitude; form.value.longitude = p.longitude }
  catch { form.value.location = '上海市浦东新区张江高科技园区'; form.value.address = '科苑路88号'; form.value.latitude = 31.2304; form.value.longitude = 121.4737 }
  finally { locationLoading.value = false }
}

const selectWorkorder = (wo) => { form.value.workorderId = wo.id; form.value.customerName = wo.customerName; showWorkorderPicker.value = false }
const takePhoto = () => { if (!cameraInput.value) return; cameraInput.value.click() }
const handleCameraCapture = (e) => {
  const f = e.target.files[0]; if (!f) return
  if (!f.type.startsWith('image/')) { ElMessage.error('请选择图片文件'); return }
  if (f.size > 10*1024*1024) { ElMessage.error('图片不能超过10MB'); return }
  const r = new FileReader(); r.onload = (ev) => form.value.photos.push(ev.target.result); r.readAsDataURL(f); e.target.value = ''
}
const removePhoto = (i) => form.value.photos.splice(i, 1)
const previewPhoto = (p) => { previewImage.value = p; previewVisible.value = true }

const getWorkorderTagType = (w) => {
  if (w.category === 'installation') return 'primary'; if (w.subType === 'repair') return 'danger'
  if (w.subType === 'trial_processing') return 'success'; if (w.subType === 'refitting') return 'warning'; return 'info'
}
const getWorkorderTagText = (w) => {
  if (w.category === 'installation') return '安装'; if (w.subType === 'repair') return '维修'
  if (w.subType === 'trial_processing') return '试加工'; if (w.subType === 'refitting') return '改造'; return '服务'
}

const submitCheckIn = async () => {
  if (!canSubmit.value) return
  submitting.value = true
  try {
    await new Promise(r => setTimeout(r, 1000))
    const record = {
      id: Date.now(),
      type: form.value.checkinType,
      engineerName,
      checkinTime: currentTime.value, location: form.value.location, address: form.value.address,
      latitude: form.value.latitude, longitude: form.value.longitude,
      workorderId: form.value.workorderId, customerName: form.value.customerName,
      workContent: form.value.workContent,
      photos: form.value.photos,
      // 以下为签离时填写
      checkoutTime: null, checkOutLocation: '',
      departTime: '', workStartTime: '', returnTime: '', workEndTime: '',
      coworker: '', deviceStopped: null, taskCompleted: null, incompleteReason: '',
      faultAnalysis: '', bizFollowUps: [], pendingIssues: '',
      status: '已签到'
    }
    if (form.value.checkinType === 'workorder' && selectedWorkorder.value) {
      record.deviceModel = selectedWorkorder.value.deviceModel
    }
    const records = JSON.parse(localStorage.getItem('checkinRecords') || '[]')
    records.unshift(record)
    localStorage.setItem('checkinRecords', JSON.stringify(records))
    ElMessage.success('签到成功')
    router.push('/staff-mobile-workspace')
  } catch { ElMessage.error('签到失败') }
  finally { submitting.value = false }
}

onMounted(() => { updateTime(); timeInterval.value = setInterval(updateTime, 1000); refreshLocation() })
onUnmounted(() => { clearInterval(timeInterval.value) })
</script>

<style scoped>
.staff-checkin-page { min-height: 100vh; background: #f5f7fa; padding-bottom: 120px; }
.page-header { display: flex; align-items: center; justify-content: space-between; padding: 12px 15px; background: white; border-bottom: 1px solid #ebeef5; position: sticky; top: 0; z-index: 10; }
.header-title { font-size: 17px; font-weight: 600; color: #303133; }
.placeholder { width: 60px; }
.checkin-form { padding: 15px; }
.form-section { background: white; border-radius: 12px; padding: 16px; margin-bottom: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
.section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
.section-label { font-size: 15px; font-weight: 600; color: #303133; display: block; margin-bottom: 10px; }
.section-header .section-label { margin-bottom: 0; }
.required { color: #f56c6c; margin-left: 2px; }
.optional { color: #909399; font-weight: 400; font-size: 13px; }

.type-selector { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.type-card { display: flex; flex-direction: column; align-items: center; padding: 16px 8px; border: 2px solid #ebeef5; border-radius: 12px; cursor: pointer; transition: all 0.3s; gap: 6px; }
.type-card.active { border-color: #409EFF; background: #ecf5ff; }
.type-icon { width: 44px; height: 44px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 20px; }
.type-icon.workorder { background: #ecf5ff; color: #409EFF; }
.type-icon.activity { background: #fef0f0; color: #f56c6c; }
.type-name { font-size: 14px; font-weight: 600; color: #303133; }
.type-desc { font-size: 11px; color: #909399; }

.auto-fields { display: flex; flex-direction: column; gap: 10px; }
.auto-field-item { display: flex; align-items: center; gap: 10px; }
.auto-label { font-size: 13px; color: #909399; min-width: 70px; }
.auto-value { font-size: 14px; color: #303133; flex: 1; }
.time-value { font-family: monospace; color: #409EFF; font-weight: 500; }

.select-box { display: flex; align-items: center; justify-content: space-between; padding: 12px 14px; border: 1px solid #dcdfe6; border-radius: 8px; cursor: pointer; background: #fafafa; }
.select-box:hover { border-color: #409EFF; }
.selected-value { flex: 1; }
.workorder-title { font-size: 15px; font-weight: 500; color: #303133; }
.workorder-subtitle { font-size: 12px; color: #909399; margin-top: 2px; }
.placeholder-text { color: #c0c4cc; font-size: 14px; }

.photo-list { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 10px; }
.photo-item { position: relative; width: 80px; height: 80px; border-radius: 8px; overflow: hidden; }
.photo-item img { width: 100%; height: 100%; object-fit: cover; }
.photo-watermark { position: absolute; bottom: 0; left: 0; right: 0; background: rgba(0,0,0,0.5); color: white; font-size: 9px; padding: 2px 4px; text-align: center; }
.remove-btn { position: absolute; top: 2px; right: 2px; background: rgba(0,0,0,0.5); color: white; border-radius: 50%; padding: 2px; font-size: 14px; cursor: pointer; }
.photo-btn { display: flex; flex-direction: column; align-items: center; justify-content: center; width: 80px; height: 80px; border: 1px dashed #dcdfe6; border-radius: 8px; cursor: pointer; color: #909399; font-size: 12px; gap: 4px; }
.photo-btn:hover { border-color: #409EFF; color: #409EFF; }

.submit-section { position: fixed; bottom: 0; left: 0; right: 0; padding: 15px; background: white; box-shadow: 0 -2px 10px rgba(0,0,0,0.05); z-index: 10; }
.submit-tips { text-align: center; font-size: 12px; color: #909399; margin-top: 8px; }

.picker-content { padding: 0 16px; }
.picker-search { margin-bottom: 12px; }
.picker-list { max-height: 55vh; overflow-y: auto; }
.picker-item { display: flex; align-items: center; justify-content: space-between; padding: 14px 0; border-bottom: 1px solid #f0f0f0; cursor: pointer; }
.picker-item.active { background: #ecf5ff; margin: 0 -16px; padding: 14px 16px; }
.picker-item-main { flex: 1; }
.picker-item-title { font-size: 15px; font-weight: 500; color: #303133; }
.picker-item-subtitle { font-size: 13px; color: #606266; margin-top: 2px; }
.picker-item-info { display: flex; align-items: center; gap: 8px; margin-top: 4px; font-size: 12px; color: #909399; }
.check-icon { color: #409EFF; font-size: 18px; }
.picker-footer { padding: 12px 0; }
.preview-dialog .preview-img { width: 100%; max-height: 70vh; object-fit: contain; }
</style>
