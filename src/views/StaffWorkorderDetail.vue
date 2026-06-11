<template>
  <div class="staff-workorder-detail">
    <!-- 顶部导航 -->
    <div class="detail-header">
      <el-button link @click="goBack">
        <el-icon><ArrowLeft /></el-icon>
        <span>返回</span>
      </el-button>
      <span class="header-title">工单详情</span>
      <span class="placeholder"></span>
    </div>

    <template v-if="workorder">
      <!-- 状态 + 操作速览 -->
      <div class="status-bar">
        <el-tag :type="getStatusType(workorder.status)" size="large">
          {{ getStatusText(workorder.status) }}
        </el-tag>
        <span class="status-sub">创建人：{{ workorder.createdBy?.name || workorder.customerName }}</span>
      </div>

      <!-- 基本信息 -->
      <div class="info-card">
        <div class="card-title">基本信息</div>
        <div class="info-item"><span class="label">工单号</span><span class="value">{{ workorder.workorderId }}</span></div>
        <div class="info-item"><span class="label">类型</span><span class="value">{{ getTypeText(workorder.type) }}</span></div>
        <div class="info-item"><span class="label">创建时间</span><span class="value">{{ formatDateTime(workorder.createTime) }}</span></div>
        <div class="info-item" v-if="workorder.engineerName"><span class="label">工程师</span><span class="value">{{ workorder.engineerName }}</span></div>
      </div>

      <!-- 客户信息 -->
      <div class="info-card">
        <div class="card-title">客户信息</div>
        <div class="info-item"><span class="label">客户</span><span class="value">{{ workorder.customerName }}</span></div>
        <div class="info-item">
          <span class="label">电话</span>
          <span class="value"><a :href="'tel:'+workorder.customerPhone" class="phone-link">{{ workorder.customerPhone }} <el-icon><Phone /></el-icon></a></span>
        </div>
        <div class="info-item"><span class="label">地址</span><span class="value">{{ workorder.address }}</span></div>
      </div>

      <!-- 设备信息 -->
      <div class="info-card">
        <div class="card-title">设备信息</div>
        <div class="info-item"><span class="label">型号</span><span class="value">{{ workorder.deviceModel || '-' }}</span></div>
        <div class="info-item"><span class="label">序列号</span><span class="value">{{ workorder.serialNumber || '-' }}</span></div>
        <div class="info-item"><span class="label">保修状态</span><span class="value">{{ workorder.warrantyStatus === 'in' ? '保内' : '保外' }}</span></div>
      </div>

      <!-- 问题描述 -->
      <div class="info-card">
        <div class="card-title">故障描述</div>
        <div class="description-content">{{ workorder.faultDescription }}</div>
      </div>

      <!-- ===== 进行中：服务报告表单 ===== -->
      <div class="info-card" v-if="workorder.status === 'processing' && isEngineer">
        <div class="card-title">服务报告（可暂存）</div>
        <el-form label-position="top" size="small">
          <el-form-item label="维修内容 / 处理过程">
            <el-input v-model="reportForm.repairContent" type="textarea" :rows="3" placeholder="描述维修/处理过程" />
          </el-form-item>
          <el-form-item label="更换配件">
            <el-input v-model="reportForm.replacedPartsStr" placeholder="多个配件用逗号分隔" />
          </el-form-item>
          <el-form-item label="处理结果">
            <el-input v-model="reportForm.testResult" type="textarea" :rows="2" placeholder="设备运行状态、测试结果" />
          </el-form-item>
        </el-form>
        <div style="display:flex;gap:10px;margin-top:8px">
          <el-button size="small" @click="saveReportDraft">暂存</el-button>
        </div>
      </div>

      <!-- 已有服务报告（进行中暂存后显示） -->
      <div class="info-card" v-if="workorder.serviceReport && (workorder.status === 'processing' || workorder.status === 'pending_sign')">
        <div class="card-title">服务报告</div>
        <div class="info-item"><span class="label">维修内容</span><span class="value">{{ workorder.serviceReport.repairContent || '-' }}</span></div>
        <div class="info-item"><span class="label">更换配件</span><span class="value">{{ (workorder.serviceReport.replacedParts || []).join('、') || '无' }}</span></div>
        <div class="info-item"><span class="label">处理结果</span><span class="value">{{ workorder.serviceReport.testResult || '-' }}</span></div>
      </div>

      <!-- 已生成的PDF报告 -->
      <div class="info-card" v-if="workorder.reportPdf">
        <div class="card-title">服务报告书PDF</div>
        <el-button type="primary" size="small" @click="viewPdf">查看PDF报告</el-button>
        <el-button type="success" size="small" @click="downloadPdf">下载PDF</el-button>
      </div>

      <!-- 处理记录 -->
      <div class="info-card" v-if="workorder.processRecords && workorder.processRecords.length > 0">
        <div class="card-title">处理记录</div>
        <div class="record-list">
          <div v-for="(r, i) in workorder.processRecords" :key="i" class="record-item">
            <div class="record-time">{{ formatDateTime(r.time) }}</div>
            <div class="record-content">{{ r.title }}：{{ r.content }}</div>
            <div class="record-operator">{{ r.operator }}</div>
          </div>
        </div>
      </div>

      <!-- ===== 底部操作栏 ===== -->
      <div class="action-bar">
        <!-- 待分配：课长分配 -->
        <template v-if="workorder.status === 'pending_assign' && isTechLead">
          <el-button type="primary" size="large" round block @click="showAssignDialog">分配工程师</el-button>
        </template>
        <!-- 待接单：只有工程师能接单弃单 -->
        <template v-if="workorder.status === 'pending_accept' && isEngineer">
          <el-button type="primary" size="large" round block @click="doAccept">接单</el-button>
          <el-button type="warning" size="large" round block @click="doReject" style="margin-top:8px">弃单</el-button>
        </template>
        <!-- 进行中：只有工程师能提交 -->
        <template v-else-if="workorder.status === 'processing' && isEngineer">
          <el-button type="success" size="large" round block @click="submitForSignAction">提交并请客户签字</el-button>
        </template>
        <!-- 待签字：只有工程师能操作签字 -->
        <template v-else-if="workorder.status === 'pending_sign' && isEngineer">
          <el-button type="warning" size="large" round block @click="openSignDialog('engineer')">客户签字 / 工程师代签</el-button>
        </template>
        <!-- 课长确认 -->
        <template v-else-if="workorder.status === 'techlead_confirm' && isTechLead">
          <el-button type="primary" size="large" round block @click="doTechLeadConfirm">课长确认</el-button>
        </template>
        <!-- 业务确认 -->
        <template v-else-if="workorder.status === 'assistant_confirm' && isAssistant">
          <el-button type="primary" size="large" round block @click="doAssistantConfirm">业务确认</el-button>
        </template>
        <!-- 完成 -->
        <template v-else-if="workorder.status === 'completed'">
          <el-button type="info" size="large" round block disabled>工单已完成</el-button>
        </template>
      </div>
    </template>

    <!-- ===== 签字全屏页面 ===== -->
    <div v-if="signDialog.visible" class="sign-fullscreen-page">
      <div class="sign-header">
        <el-button link @click="signDialog.visible = false"><el-icon><ArrowLeft /></el-icon>返回</el-button>
        <span class="header-title">签字确认</span>
        <span class="placeholder"></span>
      </div>
      <div class="sign-content">
        <div class="sign-info-card">
          <h4>服务报告书签字</h4>
          <div class="info-row"><span class="label">工单号：</span>{{ workorder?.workorderId }}</div>
          <div class="info-row"><span class="label">设备：</span>{{ workorder?.deviceModel }}</div>
          <div class="info-row"><span class="label">客户：</span>{{ workorder?.customerName }}</div>
          <div class="info-row"><span class="label">角色：</span>{{ signDialog.signRole === 'customer' ? '客户签字' : '工程师代签' }}</div>
        </div>
        <div class="sign-area">
          <p class="sign-tip">请在下方空白区域手写签名</p>
          <canvas ref="signCanvas" class="sign-canvas"
            @touchstart="handleTouchStart" @touchmove="handleTouchMove" @touchend="handleTouchEnd"
            @mousedown="handleMouseDown" @mousemove="handleMouseMove" @mouseup="handleMouseUp"
          ></canvas>
        </div>
      </div>
      <div class="sign-footer">
        <el-button size="large" @click="clearSignature"><el-icon><Delete /></el-icon>清除重写</el-button>
        <el-button type="primary" size="large" @click="confirmSignature" :loading="signLoading">
          <el-icon><Check /></el-icon>确认签字（生成PDF）
        </el-button>
      </div>
    </div>

    <!-- PDF预览弹框 -->
    <el-dialog v-model="pdfPreviewVisible" title="服务报告书" width="90%" fullscreen>
      <iframe :src="pdfPreviewUrl" style="width:100%;height:70vh;border:none;"></iframe>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowLeft, Phone, Delete, Check } from '@element-plus/icons-vue'
import { getWorkorderById, acceptWorkorder, rejectWorkorder, submitForSign, signWorkorder, techLeadConfirm, assistantConfirm, saveServiceReportDraft, saveReportPdf, assignWorkorder } from '../stores/workorderFlowStore.js'
import { generateReportPdf } from '../utils/reportPdf.js'

const router = useRouter()
const route = useRoute()

const workorder = ref(null)
const staffInfo = ref({ name: '工程师' })
const signLoading = ref(false)
const pdfPreviewVisible = ref(false)
const pdfPreviewUrl = ref('')

// 服务报告表单
const reportForm = reactive({
  repairContent: '',
  replacedPartsStr: '',
  testResult: '',
})

const signDialog = reactive({
  visible: false,
  signRole: 'customer',
})

const signCanvas = ref(null)
let isDrawing = false
let ctx = null

// 当前用户角色
const currentRole = computed(() => staffInfo.value?.role || '')
const isEngineer = computed(() => currentRole.value === 'engineer' || currentRole.value === 'admin')
const isTechLead = computed(() => currentRole.value === 'techLead' || currentRole.value === 'admin' || currentRole.value === 'director')
const isAssistant = computed(() => currentRole.value === 'assistant' || currentRole.value === 'admin')

// 加载工单
const loadWorkorder = () => {
  const id = route.query.id
  staffInfo.value = JSON.parse(localStorage.getItem('staffAuth') || '{}')

  if (id) {
    const wo = getWorkorderById(id)
    if (wo) {
      // 权限检查：工程师只能看分配给自己或自己创建的工单
      const role = staffInfo.value?.role || ''
      const name = staffInfo.value?.name || ''
      if (role === 'engineer' && (wo.engineerName !== name && wo.engineerId !== name && !(wo.createdBy && wo.createdBy.name === name))) {
        ElMessage.error('无权查看此工单')
        goBack()
        return
      }
      workorder.value = wo
      // 回填报告表单
      if (wo.serviceReport) {
        reportForm.repairContent = wo.serviceReport.repairContent || ''
        reportForm.replacedPartsStr = (wo.serviceReport.replacedParts || []).join('、')
        reportForm.testResult = wo.serviceReport.testResult || ''
      }
    } else {
      // fallback: from localStorage
      const saved = JSON.parse(localStorage.getItem('workorders') || '[]')
      const found = saved.find(w => w.id === parseInt(id) || w.workorderId === id)
      if (found) workorder.value = found
    }
  }

  // auto-open
  const action = route.query.action
  if (action === 'sign' && workorder.value?.status === 'pending_sign') {
    nextTick(() => openSignDialog('customer'))
  }
}

onMounted(loadWorkorder)

const goBack = () => {
  const from = route.query.from
  router.push(from === 'workspace' ? '/staff-mobile-workspace' : '/staff-workorder-list')
}

// ===== 操作 =====
const showAssignDialog = () => {
  ElMessageBox.prompt('请输入工程师姓名', '分配工程师').then(({ value: engineerName }) => {
    if (workorder.value && engineerName) {
      assignWorkorder(workorder.value.id || workorder.value.rawId, `eng_${Date.now()}`, engineerName, '')
      ElMessage.success(`已分配给 ${engineerName}`)
      loadWorkorder()
    }
  }).catch(() => {})
}

const doAccept = () => {
  ElMessageBox.confirm('确认接单？', '接单确认', { type: 'info' }).then(() => {
    if (workorder.value) {
      acceptWorkorder(workorder.value.id || workorder.value.rawId)
      loadWorkorder()
      ElMessage.success('已接单')
    }
  }).catch(() => {})
}

const doReject = () => {
  ElMessageBox.prompt('弃单原因', '弃单', { type: 'warning' }).then(({ value }) => {
    if (workorder.value) {
      rejectWorkorder(workorder.value.id || workorder.value.rawId, value)
      ElMessage.success('已弃单')
      goBack()
    }
  }).catch(() => {})
}

const saveReportDraft = () => {
  if (!workorder.value) return
  const id = workorder.value.id || workorder.value.rawId
  saveServiceReportDraft(id, {
    repairContent: reportForm.repairContent,
    replacedParts: reportForm.replacedPartsStr.split(/[,，、]/).map(s => s.trim()).filter(Boolean),
    testResult: reportForm.testResult,
  })
  loadWorkorder()
  ElMessage.success('已暂存')
}

const submitForSignAction = () => {
  // 先暂存再提交
  saveReportDraft()
  if (!workorder.value) return
  ElMessageBox.confirm('确认提交并进入待签字状态？客户会收到签字通知。', '提交确认', { type: 'info' }).then(() => {
    const id = workorder.value.id || workorder.value.rawId
    submitForSign(id, {
      repairContent: reportForm.repairContent,
      replacedParts: reportForm.replacedPartsStr.split(/[,，、]/).map(s => s.trim()).filter(Boolean),
      testResult: reportForm.testResult,
    })
    loadWorkorder()
    ElMessage.success('已提交，等待签字')
  }).catch(() => {})
}

const doTechLeadConfirm = () => {
  ElMessageBox.confirm('确认工单无误？', '课长确认', { type: 'info' }).then(() => {
    if (workorder.value) {
      techLeadConfirm(workorder.value.id || workorder.value.rawId)
      loadWorkorder()
      ElMessage.success('课长已确认')
    }
  }).catch(() => {})
}

const doAssistantConfirm = () => {
  ElMessageBox.confirm('确认工单无误？', '业务确认', { type: 'info' }).then(() => {
    if (workorder.value) {
      assistantConfirm(workorder.value.id || workorder.value.rawId)
      loadWorkorder()
      ElMessage.success('工单已完成')
    }
  }).catch(() => {})
}

// ===== 签字 =====
const openSignDialog = (role) => {
  signDialog.signRole = role || 'customer'
  signDialog.visible = true
  nextTick(initCanvas)
}

const initCanvas = () => {
  if (!signCanvas.value) return
  const c = signCanvas.value
  c.width = c.getBoundingClientRect().width
  c.height = c.getBoundingClientRect().height
  ctx = c.getContext('2d')
  ctx.strokeStyle = '#000'; ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.lineJoin = 'round'
}

const getTouchPos = (e) => { const r = signCanvas.value.getBoundingClientRect(); return { x: e.touches[0].clientX - r.left, y: e.touches[0].clientY - r.top } }
const getMousePos = (e) => { const r = signCanvas.value.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top } }
const handleTouchStart = (e) => { isDrawing = true; const p = getTouchPos(e); ctx.beginPath(); ctx.moveTo(p.x, p.y) }
const handleTouchMove = (e) => { if (!isDrawing) return; e.preventDefault(); const p = getTouchPos(e); ctx.lineTo(p.x, p.y); ctx.stroke() }
const handleTouchEnd = () => { isDrawing = false }
const handleMouseDown = (e) => { isDrawing = true; const p = getMousePos(e); ctx.beginPath(); ctx.moveTo(p.x, p.y) }
const handleMouseMove = (e) => { if (!isDrawing) return; const p = getMousePos(e); ctx.lineTo(p.x, p.y); ctx.stroke() }
const handleMouseUp = () => { isDrawing = false }
const clearSignature = () => { if (ctx && signCanvas.value) ctx.clearRect(0, 0, signCanvas.value.width, signCanvas.value.height) }

const confirmSignature = async () => {
  if (!workorder.value || !signCanvas.value) return
  const signImage = signCanvas.value.toDataURL('image/png')
  signLoading.value = true

  try {
    // 生成PDF
    const pdfBase64 = await generateReportPdf(workorder.value, signImage, signDialog.signRole)

    // 签字流转
    const id = workorder.value.id || workorder.value.rawId
    signWorkorder(id, signImage, signDialog.signRole)

    // 保存PDF
    saveReportPdf(id, pdfBase64)

    ElMessage.success('签字完成，PDF报告已生成')
    signDialog.visible = false
    loadWorkorder()
  } catch (e) {
    ElMessage.error('PDF生成失败，但签字已记录')
    const id = workorder.value.id || workorder.value.rawId
    signWorkorder(id, signImage, signDialog.signRole)
    signDialog.visible = false
    loadWorkorder()
  } finally {
    signLoading.value = false
  }
}

const viewPdf = () => {
  if (workorder.value?.reportPdf) {
    pdfPreviewUrl.value = workorder.value.reportPdf
    pdfPreviewVisible.value = true
  }
}

const downloadPdf = () => {
  if (workorder.value?.reportPdf) {
    const link = document.createElement('a')
    link.href = workorder.value.reportPdf
    link.download = `服务报告书_${workorder.value.workorderId}.pdf`
    link.click()
  }
}

// ===== helpers =====
const getStatusType = (s) => ({ pending_assign: 'warning', pending_accept: 'info', processing: '', pending_sign: 'danger', techlead_confirm: 'warning', assistant_confirm: 'warning', completed: 'success' }[s] || 'info')
const getStatusText = (s) => ({ pending_assign: '待分配', pending_accept: '待接单', processing: '进行中', pending_sign: '待签字', techlead_confirm: '课长确认', assistant_confirm: '业务确认', completed: '已完成' }[s] || s)
const getTypeText = (t) => ({ service: '维修', install: '安装', parts: '配件', maintenance: '保养' }[t] || t || '维修')
const formatDateTime = (d) => { if (!d) return ''; const t = new Date(d); return `${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,'0')}-${String(t.getDate()).padStart(2,'0')} ${String(t.getHours()).padStart(2,'0')}:${String(t.getMinutes()).padStart(2,'0')}` }
</script>

<style scoped>
.staff-workorder-detail { min-height: 100vh; background: #f5f7fa; padding: 0 0 90px 0; width: 100vw; max-width: 100%; overflow-x: hidden; box-sizing: border-box; }
.detail-header { display: flex; justify-content: space-between; align-items: center; padding: 10px 16px; background: #fff; position: sticky; top: 0; z-index: 10; border-bottom: 1px solid #eee; }
.header-title { font-size: 16px; font-weight: 600; }
.placeholder { width: 60px; }

.status-bar { display: flex; align-items: center; gap: 12px; padding: 12px 16px; background: #fff; margin-bottom: 8px; border-bottom: 1px solid #f0f0f0; }
.status-sub { font-size: 13px; color: #999; }

.info-card { margin: 8px 12px; background: #fff; border-radius: 8px; padding: 12px 16px; box-shadow: 0 1px 3px rgba(0,0,0,.05); }
.card-title { font-size: 15px; font-weight: 600; margin-bottom: 10px; padding-bottom: 8px; border-bottom: 1px solid #f0f0f0; }
.info-item { display: flex; justify-content: space-between; align-items: center; padding: 6px 0; font-size: 14px; }
.info-item .label { color: #999; flex-shrink: 0; }
.info-item .value { color: #333; text-align: right; }
.phone-link { color: #409eff; text-decoration: none; }
.description-content { font-size: 14px; color: #333; line-height: 1.6; white-space: pre-wrap; }

.record-item { padding: 8px 0; border-bottom: 1px solid #f5f5f5; }
.record-time { font-size: 12px; color: #999; }
.record-content { font-size: 14px; color: #333; margin: 4px 0; }
.record-operator { font-size: 12px; color: #666; }

.action-bar { position: fixed; bottom: 0; left: 0; right: 0; padding: 10px 16px; background: #fff; border-top: 1px solid #eee; z-index: 10; }

/* 签字全屏 */
.sign-fullscreen-page { position: fixed; inset: 0; background: #f5f7fa; z-index: 100; display: flex; flex-direction: column; }
.sign-header { display: flex; align-items: center; padding: 10px 16px; background: #fff; }
.sign-content { flex: 1; overflow-y: auto; padding: 12px; }
.sign-info-card { background: #fff; border-radius: 8px; padding: 16px; margin-bottom: 12px; }
.sign-info-card h4 { margin: 0 0 10px 0; }
.info-row { padding: 4px 0; font-size: 14px; }
.info-row .label { color: #999; }
.sign-area { background: #fff; border-radius: 8px; padding: 16px; }
.sign-tip { font-size: 13px; color: #999; margin-bottom: 10px; }
.sign-canvas { width: 100%; height: 200px; border: 2px dashed #ccc; border-radius: 8px; background: #fafafa; touch-action: none; }
.sign-footer { display: flex; gap: 12px; padding: 12px 16px; background: #fff; border-top: 1px solid #eee; }
.sign-footer .el-button { flex: 1; }
</style>
