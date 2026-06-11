<template>
  <el-dialog
    :title="dialogTitle"
    v-model="dialogVisible"
    width="1000px"
    :fullscreen="isMobile"
    :close-on-click-modal="false"
    :destroy-on-close="true"
    :append-to-body="true"
    class="quotation-view-dialog"
    @close="handleClose"
  >
    <div class="quotation-view">
      <!-- 头部信息卡片 -->
      <div class="header-card">
        <div class="header-left">
          <div class="quotation-no">
            <el-icon><Document /></el-icon>
            <span>{{ quotation?.quotationNo }}</span>
            <el-tag size="small" :type="getStatusType(quotation?.status)" effect="dark">
              {{ getStatusText(quotation?.status) }}
            </el-tag>
          </div>
          <div class="quotation-meta">
            <span class="meta-item">
              <el-icon><User /></el-icon>
              {{ quotation?.createdBy }}
            </span>
            <span class="meta-item">
              <el-icon><Clock /></el-icon>
              {{ formatDateTime(quotation?.createdAt) }}
            </span>
            <span class="meta-item version">
              <el-icon><Collection /></el-icon>
              V{{ quotation?.version }}
            </span>
          </div>
        </div>
        <div class="header-right">
          <div class="grand-total-display">
            <div class="label">报价总额</div>
            <div class="amount">¥{{ formatAmount(quotation?.totalAmount) }}</div>
          </div>
        </div>
      </div>

      <!-- 基本信息区域 -->
      <div class="info-section">
        <div class="info-grid">
          <!-- 客户信息 -->
          <el-card class="info-card" shadow="hover">
            <template #header>
              <div class="card-header">
                <el-icon><OfficeBuilding /></el-icon>
                <span>客户信息</span>
              </div>
            </template>
            <div class="info-content">
              <div class="info-row">
                <span class="label">客户名称</span>
                <span class="value">{{ quotation?.customerName }}</span>
              </div>
              <div class="info-row">
                <span class="label">关联工单</span>
                <el-link v-if="quotation?.workorderNo" type="primary" @click="handleViewWorkorder">
                  {{ quotation?.workorderNo }}
                </el-link>
                <span v-else class="value empty">无</span>
              </div>
            </div>
          </el-card>

          <!-- 联系人信息 -->
          <el-card class="info-card" shadow="hover">
            <template #header>
              <div class="card-header">
                <el-icon><Message /></el-icon>
                <span>联系人信息</span>
              </div>
            </template>
            <div class="info-content">
              <div class="info-row">
                <span class="label">联系人</span>
                <span class="value">{{ quotation?.contactName }}</span>
              </div>
              <div class="info-row">
                <span class="label">联系电话</span>
                <span class="value">{{ quotation?.contactPhone || '-' }}</span>
              </div>
            </div>
          </el-card>

          <!-- 业务信息 -->
          <el-card class="info-card" shadow="hover">
            <template #header>
              <div class="card-header">
                <el-icon><Timer /></el-icon>
                <span>业务信息</span>
              </div>
            </template>
            <div class="info-content">
              <div class="info-row">
                <span class="label">报价日期</span>
                <span class="value">{{ quotation?.quoteDate ? formatDateTime(quotation?.quoteDate) : '-' }}</span>
              </div>
              <div class="info-row">
                <span class="label">有效期</span>
                <span class="value">
                  {{ quotation?.validDays ? `${quotation.validDays} 天` : '-' }}
                  <span v-if="quotation?.validUntil" class="valid-until">
                    (至 {{ formatDate(quotation?.validUntil) }})
                  </span>
                </span>
              </div>
            </div>
          </el-card>
        </div>
      </div>

      <!-- 金额汇总卡片 -->
      <el-card class="amount-summary-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <el-icon><PriceTag /></el-icon>
            <span>金额汇总</span>
          </div>
        </template>
        <div class="amount-summary">
          <div class="amount-grid">
            <div class="amount-item">
              <div class="amount-label">采购成本</div>
              <div class="amount-value purchase">¥{{ formatAmount(quotation?.purchaseTotal) }}</div>
            </div>
            <div class="amount-item">
              <div class="amount-label">销售小计</div>
              <div class="amount-value">¥{{ formatAmount(quotation?.subtotal) }}</div>
            </div>
            <div class="amount-item">
              <div class="amount-label">税额 ({{ (quotation?.taxRate * 100).toFixed(0) }}%)</div>
              <div class="amount-value">¥{{ formatAmount(quotation?.taxAmount) }}</div>
            </div>
            <div class="amount-item" v-if="quotation?.discount > 0">
              <div class="amount-label">折扣</div>
              <div class="amount-value discount">-¥{{ formatAmount(quotation?.discount) }}</div>
            </div>
            <div class="amount-item">
              <div class="amount-label">利润合计</div>
              <div :class="['amount-value', getProfitClass(quotation?.profitTotal)]">
                ¥{{ formatAmount(quotation?.profitTotal) }}
                <span class="profit-rate">({{ formatProfitRate(quotation?.profitRate) }})</span>
              </div>
            </div>
            <div class="amount-item grand">
              <div class="amount-label">报价总额</div>
              <div class="amount-value total">¥{{ formatAmount(quotation?.totalAmount) }}</div>
            </div>
          </div>
        </div>
      </el-card>

      <!-- 配件明细 -->
      <el-card class="items-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <el-icon><Box /></el-icon>
            <span>配件明细</span>
            <span class="item-count">共 {{ quotation?.items?.length || 0 }} 项</span>
          </div>
        </template>
        <el-table :data="quotation?.items" border style="width: 100%" size="small">
          <el-table-column type="index" label="序号" width="50" align="center" />
          <el-table-column prop="partNumber" label="配件编码" width="110" />
          <el-table-column prop="partName" label="配件名称" min-width="130" show-overflow-tooltip />
          <el-table-column prop="specification" label="规格" width="100" show-overflow-tooltip />
          <el-table-column prop="unit" label="单位" width="60" align="center" />
          <el-table-column prop="quantity" label="数量" width="70" align="right" />
          <el-table-column prop="purchasePrice" label="采购单价" width="100" align="right">
            <template #default="{ row }">
              <span class="purchase-price">¥{{ formatAmount(row.purchasePrice) }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="unitPrice" label="销售单价" width="100" align="right">
            <template #default="{ row }">
              <span>¥{{ formatAmount(row.unitPrice) }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="purchaseTotal" label="采购金额" width="100" align="right">
            <template #default="{ row }">
              <span class="purchase-amount">¥{{ formatAmount(row.purchaseTotal) }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="totalPrice" label="销售金额" width="100" align="right">
            <template #default="{ row }">
              <span class="amount">¥{{ formatAmount(row.totalPrice) }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="profit" label="利润" width="90" align="right">
            <template #default="{ row }">
              <span :class="getProfitClass(row.profit)">¥{{ formatAmount(row.profit) }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="profitRate" label="利润率" width="80" align="right">
            <template #default="{ row }">
              <span :class="getProfitRateClass(row.profitRate)">{{ formatProfitRate(row.profitRate) }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="remark" label="备注" min-width="100" show-overflow-tooltip />
        </el-table>
      </el-card>

      <!-- 备注和条款 -->
      <div class="notes-section" v-if="quotation?.notes || quotation?.terms">
        <el-card class="notes-card" v-if="quotation?.notes" shadow="hover">
          <template #header>
            <div class="card-header">
              <el-icon><Document /></el-icon>
              <span>备注</span>
            </div>
          </template>
          <div class="notes-content">
            {{ quotation?.notes }}
          </div>
        </el-card>

        <el-card class="terms-card" v-if="quotation?.terms" shadow="hover">
          <template #header>
            <div class="card-header">
              <el-icon><Tickets /></el-icon>
              <span>条款</span>
            </div>
          </template>
          <div class="terms-content">
            {{ quotation?.terms }}
          </div>
        </el-card>
      </div>

      <!-- 审核记录 -->
      <el-card v-if="approvalRecords.length > 0" class="approval-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <el-icon><Stamp /></el-icon>
            <span>审核记录</span>
          </div>
        </template>
        <el-timeline>
          <el-timeline-item
            v-for="record in approvalRecords"
            :key="record.id"
            :type="record.action === 'approve' ? 'success' : record.action === 'reject' ? 'danger' : 'primary'"
            :timestamp="formatDateTime(record.createdAt)"
          >
            <div class="timeline-content">
              <div class="timeline-title">
                <el-tag size="small" :type="getActionType(record.action)">
                  {{ record.actionName }}
                </el-tag>
                <span class="operator">{{ record.operator }}</span>
                <span class="level">({{ record.levelName }})</span>
              </div>
              <div v-if="record.comment" class="timeline-comment">
                {{ record.comment }}
              </div>
            </div>
          </el-timeline-item>
        </el-timeline>
      </el-card>

      <!-- 客户签字确认 -->
      <el-card v-if="quotation?.customerSign" class="customer-sign-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <el-icon><CircleCheckFilled /></el-icon>
            <span>客户确认签字</span>
            <el-tag v-if="quotation?.confirmTime" size="small" type="success" style="margin-left: auto;">
              {{ formatDateTime(quotation.confirmTime) }}
            </el-tag>
          </div>
        </template>
        <div class="customer-sign-content">
          <img :src="quotation.customerSign" alt="客户签字" class="customer-sign-image" />
          <div class="customer-sign-info">
            <p><strong>客户名称：</strong>{{ quotation.customerName }}</p>
            <p v-if="quotation.confirmTime"><strong>确认时间：</strong>{{ formatDateTime(quotation.confirmTime) }}</p>
          </div>
        </div>
      </el-card>

      <!-- 签字确认区域（未签字时显示） -->
      <el-card v-else-if="quotation?.status === 'sent' || quotation?.status === 'approved' || quotation?.status === 'confirmed'" class="signature-pending-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <el-icon><EditPen /></el-icon>
            <span>客户确认签字</span>
            <el-tag size="small" type="warning" style="margin-left: auto;">待确认</el-tag>
          </div>
        </template>
        <div class="signature-pending-content">
          <el-empty description="等待客户签字确认" :image-size="80">
            <template #description>
              <p>客户尚未签字确认</p>
              <p style="font-size: 12px; color: #909399; margin-top: 8px;">报价单已发送给客户，等待客户确认签字</p>
            </template>
          </el-empty>
        </div>
      </el-card>
    </div>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleClose">关闭</el-button>
        <el-button
          v-if="canPreviewPDF"
          type="info"
          @click="handlePreviewPDF"
        >
          <el-icon><View /></el-icon>
          预览PDF
        </el-button>
        <el-button
          v-if="canDownloadPDF"
          type="success"
          @click="handleDownloadPDF"
        >
          <el-icon><Download /></el-icon>
          下载PDF
        </el-button>
        <el-button
          v-if="canSendEmail"
          type="warning"
          @click="handleSendEmail"
        >
          <el-icon><Message /></el-icon>
          发送客户
        </el-button>
        <el-button
          v-if="canUploadReturn"
          type="info"
          @click="handleUploadReturn"
        >
          <el-icon><Upload /></el-icon>
          上传回传
        </el-button>
        <el-button
          v-if="canEdit"
          type="primary"
          @click="handleEdit"
        >
          编辑
        </el-button>
        <el-button
          v-if="canSubmit"
          type="warning"
          @click="handleSubmit"
        >
          提交审核
        </el-button>
        <el-button
          v-if="canApprove"
          type="success"
          @click="handleApprove"
        >
          审核
        </el-button>

        <el-button
          v-if="canConvertToOrder"
          type="success"
          @click="handleConvertToOrder"
        >
          <el-icon><DocumentChecked /></el-icon>
          转工单
        </el-button>
        <el-button
          v-if="canShowVersions"
          type="info"
          @click="handleShowVersions"
        >
          <el-icon><Collection /></el-icon>
          版本管理
        </el-button>
      </span>
    </template>

    <!-- 发送邮件对话框 -->
    <QuotationSendDialog
      v-if="sendDialogVisible"
      v-model:visible="sendDialogVisible"
      :quotation="quotation"
      @send="handleSend"
    />

    <!-- 上传回传对话框 -->
    <QuotationUploadDialog
      v-if="uploadDialogVisible"
      v-model:visible="uploadDialogVisible"
      :quotation="quotation"
      @upload="handleUpload"
    />

    <!-- 版本管理对话框 -->
    <QuotationVersionDialog
      v-if="versionDialogVisible"
      v-model:visible="versionDialogVisible"
      :current-quotation="quotation"
      :version-list="versionList"
      @view="handleViewVersion"
      @switch="handleSwitchVersion"
      @create-version="handleCreateVersionFromDialog"
    />

    <!-- 转订单对话框 -->
    <QuotationConvertDialog
      v-if="convertDialogVisible"
      v-model:visible="convertDialogVisible"
      :quotation="quotation"
      @confirm="handleConvertConfirm"
    />
  </el-dialog>
</template>

<script>
import { computed, ref, onMounted } from 'vue'
import { View, Download, Message, Upload, Collection, DocumentChecked, Document, User, Clock, OfficeBuilding, Timer, PriceTag, Box, Stamp, Tickets, CircleCheckFilled, EditPen } from '@element-plus/icons-vue'
import { getApprovalRecords, QuotationStatus, getQuotationVersions } from '../stores/quotationStore.js'
import { generateQuotationPDF, generatePDFBlobUrl } from '../utils/pdfGenerator.js'
import { ElMessage, ElMessageBox } from 'element-plus'
import QuotationSendDialog from './QuotationSendDialog.vue'
import QuotationUploadDialog from './QuotationUploadDialog.vue'
import QuotationConvertDialog from './QuotationConvertDialog.vue'
import QuotationVersionDialog from './QuotationVersionDialog.vue'

export default {
  name: 'QuotationViewDialog',
  components: {
    View,
    Download,
    Message,
    Upload,
    Collection,
    DocumentChecked,
    Document,
    User,
    Clock,
    OfficeBuilding,
    Timer,
    PriceTag,
    Box,
    Stamp,
    Tickets,
    CircleCheckFilled,
    EditPen,
    QuotationSendDialog,
    QuotationUploadDialog,
    QuotationConvertDialog,
    QuotationVersionDialog
  },
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    quotation: {
      type: Object,
      default: null
    }
  },
  emits: ['update:visible', 'edit', 'submit', 'approve', 'send', 'upload', 'create-version', 'switch-version', 'convert-to-order', 'view-workorder'],
  setup(props, { emit }) {
    // 对话框可见性
    const dialogVisible = computed({
      get: () => props.visible,
      set: (val) => emit('update:visible', val)
    })

    // 是否移动端
    const isMobile = ref(false)

    // 检测是否为移动端
    const checkMobile = () => {
      isMobile.value = window.innerWidth <= 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    }

    // 监听窗口大小变化
    onMounted(() => {
      checkMobile()
      window.addEventListener('resize', checkMobile)
    })

    // 对话框标题
    const dialogTitle = computed(() => {
      if (props.quotation) {
        return `报价单详情 - ${props.quotation.quotationNo}`
      }
      return '报价单详情'
    })

    // 审核记录
    const approvalRecords = computed(() => {
      if (!props.quotation) return []
      return getApprovalRecords(props.quotation.id)
    })

    // 权限判断
    const canEdit = computed(() => {
      if (!props.quotation) return false
      return props.quotation.status === QuotationStatus.DRAFT ||
             props.quotation.status === QuotationStatus.REJECTED
    })

    const canSubmit = computed(() => {
      if (!props.quotation) return false
      return props.quotation.status === QuotationStatus.DRAFT ||
             props.quotation.status === QuotationStatus.REJECTED
    })

    const canApprove = computed(() => {
      if (!props.quotation) return false
      return props.quotation.status === QuotationStatus.PENDING ||
             props.quotation.status === QuotationStatus.REVIEWING
    })

    // 发送邮件权限（已通过审核后可以发送）
    const canSendEmail = computed(() => {
      if (!props.quotation) return false
      return props.quotation.status === QuotationStatus.APPROVED
    })

    // 发送邮件对话框
    const sendDialogVisible = ref(false)

    // 上传回传权限（已发送或已确认状态可以上传）
    const canUploadReturn = computed(() => {
      if (!props.quotation) return false
      return props.quotation.status === QuotationStatus.SENT ||
             props.quotation.status === QuotationStatus.CONFIRMED
    })

    // 创建新版本权限（已发送、已确认、已过期状态可以创建新版本）
    const canCreateVersion = computed(() => {
      if (!props.quotation) return false
      return props.quotation.status === QuotationStatus.SENT ||
             props.quotation.status === QuotationStatus.CONFIRMED ||
             props.quotation.status === QuotationStatus.EXPIRED
    })

    // 转化为工单权限（已确认状态可以转工单）
    const canConvertToOrder = computed(() => {
      if (!props.quotation) return false
      return props.quotation.status === QuotationStatus.CONFIRMED
    })

    // 显示版本管理权限（有版本历史时显示）
    const canShowVersions = computed(() => {
      if (!props.quotation) return false
      return true // 所有报价单都可以查看版本管理
    })

    // 版本管理对话框
    const versionDialogVisible = ref(false)
    const versionList = ref([])

    // 上传回传对话框
    const uploadDialogVisible = ref(false)

    // 转订单对话框
    const convertDialogVisible = ref(false)

    // PDF预览权限（已审核通过后可以预览）
    const canPreviewPDF = computed(() => {
      if (!props.quotation) return false
      return props.quotation.status === QuotationStatus.APPROVED ||
             props.quotation.status === QuotationStatus.SENT ||
             props.quotation.status === QuotationStatus.CONFIRMED
    })

    // PDF下载权限（已审核通过后可以下载）
    const canDownloadPDF = computed(() => {
      if (!props.quotation) return false
      return props.quotation.status === QuotationStatus.APPROVED ||
             props.quotation.status === QuotationStatus.SENT ||
             props.quotation.status === QuotationStatus.CONFIRMED
    })

    // PDF预览窗口
    const pdfPreviewVisible = ref(false)
    const pdfPreviewUrl = ref('')

    // 状态标签类型
    const getStatusType = (status) => {
      const typeMap = {
        [QuotationStatus.DRAFT]: 'info',
        [QuotationStatus.PENDING]: 'warning',
        [QuotationStatus.REVIEWING]: 'warning',
        [QuotationStatus.APPROVED]: 'success',
        [QuotationStatus.REJECTED]: 'danger',
        [QuotationStatus.SENT]: 'primary',
        [QuotationStatus.CONFIRMED]: 'success',
        [QuotationStatus.EXPIRED]: 'info',
        [QuotationStatus.CANCELLED]: 'info'
      }
      return typeMap[status] || 'info'
    }

    // 状态文本
    const getStatusText = (status) => {
      const textMap = {
        [QuotationStatus.DRAFT]: '草稿',
        [QuotationStatus.PENDING]: '待审核',
        [QuotationStatus.REVIEWING]: '审核中',
        [QuotationStatus.APPROVED]: '已通过',
        [QuotationStatus.REJECTED]: '已驳回',
        [QuotationStatus.SENT]: '已发送',
        [QuotationStatus.CONFIRMED]: '已确认',
        [QuotationStatus.EXPIRED]: '已过期',
        [QuotationStatus.CANCELLED]: '已取消'
      }
      return textMap[status] || status
    }

    // 操作类型
    const getActionType = (action) => {
      const typeMap = {
        submit: 'primary',
        approve: 'success',
        reject: 'danger'
      }
      return typeMap[action] || 'info'
    }

    // 格式化金额
    const formatAmount = (amount) => {
      if (amount === undefined || amount === null) return '0.00'
      return amount.toLocaleString('zh-CN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })
    }

    // 格式化利润率
    const formatProfitRate = (rate) => {
      if (rate === undefined || rate === null) return '0.00%'
      return rate.toFixed(2) + '%'
    }

    // 获取利润样式类
    const getProfitClass = (profit) => {
      if (profit === undefined || profit === null) return 'profit-zero'
      if (profit > 0) return 'profit-positive'
      if (profit < 0) return 'profit-negative'
      return 'profit-zero'
    }

    // 获取利润率样式类
    const getProfitRateClass = (rate) => {
      if (rate === undefined || rate === null) return 'profit-rate-zero'
      if (rate > 30) return 'profit-rate-high'
      if (rate > 15) return 'profit-rate-normal'
      if (rate > 0) return 'profit-rate-low'
      if (rate < 0) return 'profit-rate-negative'
      return 'profit-rate-zero'
    }

    // 格式化日期时间
    const formatDateTime = (dateStr) => {
      if (!dateStr) return '-'
      const date = new Date(dateStr)
      return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    }

    // 格式化日期（仅日期部分）
    const formatDate = (dateStr) => {
      if (!dateStr) return '-'
      const date = new Date(dateStr)
      return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      })
    }

    // 操作方法
    const handleClose = () => {
      dialogVisible.value = false
    }

    const handleEdit = () => {
      emit('edit')
    }

    // 查看关联工单
    const handleViewWorkorder = () => {
      if (props.quotation?.workorderId) {
        emit('view-workorder', props.quotation.workorderId)
      }
    }

    const handleSubmit = () => {
      emit('submit')
    }

    const handleApprove = () => {
      emit('approve')
    }

    // 打开发送邮件对话框
    const handleSendEmail = () => {
      sendDialogVisible.value = true
    }

    // 处理发送邮件
    const handleSend = (sendData) => {
      emit('send', sendData)
    }

    // 打开上传回传对话框
    const handleUploadReturn = () => {
      uploadDialogVisible.value = true
    }

    // 处理上传回传
    const handleUpload = (uploadData) => {
      emit('upload', uploadData)
    }

    // 打开版本管理对话框
    const handleShowVersions = () => {
      // 加载版本列表
      versionList.value = getQuotationVersions(props.quotation?.quotationNo)
      versionDialogVisible.value = true
    }

    // 查看版本详情
    const handleViewVersion = (version) => {
      // 可以打开新的详情对话框查看历史版本
      ElMessage.info(`查看 V${version.version} 详情`)
    }

    // 切换版本
    const handleSwitchVersion = (version) => {
      emit('switch-version', version)
    }

    // 从版本管理创建新版本
    const handleCreateVersionFromDialog = () => {
      emit('create-version')
    }

    const handleCreateVersion = () => {
      emit('create-version')
    }

    // 转化为工单 - 打开配件选择对话框
    const handleConvertToOrder = () => {
      convertDialogVisible.value = true
    }

    // 确认转订单
    const handleConvertConfirm = (orderData) => {
      emit('convert-to-order', orderData)
    }

    // 预览PDF
    const handlePreviewPDF = async () => {
      if (!props.quotation) return
      try {
        const result = await generateQuotationPDF(props.quotation, {
          companyName: '某某科技有限公司',
          companyAddress: '某某市某某区某某路123号',
          companyPhone: '400-123-4567',
          companyEmail: 'sales@example.com'
        })
        if (result.success) {
          ElMessage.success('PDF生成成功，正在打开...')
        }
      } catch (error) {
        ElMessage.error('PDF生成失败：' + error.message)
      }
    }

    // 下载PDF
    const handleDownloadPDF = () => {
      if (!props.quotation) return
      try {
        const pdfUrl = generatePDFBlobUrl(props.quotation, {
          companyName: '某某科技有限公司',
          companyAddress: '某某市某某区某某路123号',
          companyPhone: '400-123-4567',
          companyEmail: 'sales@example.com'
        })
        // 打开新窗口下载
        window.open(pdfUrl, '_blank')
        ElMessage.success('PDF下载窗口已打开')
      } catch (error) {
        ElMessage.error('PDF下载失败：' + error.message)
      }
    }

    return {
      dialogVisible,
      isMobile,
      dialogTitle,
      approvalRecords,
      canEdit,
      canSubmit,
      canApprove,
      canCreateVersion,
      canConvertToOrder,
      canShowVersions,
      canPreviewPDF,
      canDownloadPDF,
      canSendEmail,
      canUploadReturn,
      sendDialogVisible,
      uploadDialogVisible,
      versionDialogVisible,
      versionList,
      pdfPreviewVisible,
      pdfPreviewUrl,
      getStatusType,
      getStatusText,
      getActionType,
      formatAmount,
      formatProfitRate,
      getProfitClass,
      getProfitRateClass,
      formatDateTime,
      formatDate,
      handleClose,
      handleEdit,
      handleSubmit,
      handleApprove,
      handleSend,
      handleCreateVersion,
      handlePreviewPDF,
      handleDownloadPDF,
      handleSendEmail,
      handleUploadReturn,
      handleUpload,
      handleShowVersions,
      handleViewVersion,
      handleSwitchVersion,
      handleCreateVersionFromDialog,
      handleConvertToOrder,
      handleConvertConfirm,
      handleViewWorkorder,
      convertDialogVisible
    }
  }
}
</script>

<style scoped>
/* 全屏弹窗样式优化 */
:deep(.quotation-view-dialog.is-fullscreen) {
  .el-dialog__body {
    padding: 10px;
    overflow-y: auto;
  }

  .el-dialog__header {
    padding: 15px 20px;
    border-bottom: 1px solid #e4e7ed;
  }

  .el-dialog__headerbtn {
    top: 15px;
    right: 15px;
  }

  .el-dialog__footer {
    padding: 15px 20px;
    border-top: 1px solid #e4e7ed;
  }
}

.quotation-view {
  max-height: 650px;
  overflow-y: auto;
  padding: 0 10px;
}

/* 全屏模式下调整最大高度 */
:deep(.quotation-view-dialog.is-fullscreen) .quotation-view {
  max-height: calc(100vh - 120px);
}

/* 头部信息卡片 */
.header-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  padding: 24px 32px;
  margin-bottom: 24px;
  color: white;
  box-shadow: 0 4px 20px rgba(102, 126, 234, 0.3);
}

.header-left {
  flex: 1;
}

.quotation-no {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 12px;
}

.quotation-no .el-icon {
  font-size: 28px;
}

.quotation-meta {
  display: flex;
  gap: 24px;
  font-size: 14px;
  opacity: 0.9;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.meta-item.version {
  background: rgba(255, 255, 255, 0.2);
  padding: 4px 12px;
  border-radius: 20px;
  font-weight: 500;
}

.header-right {
  text-align: right;
}

.grand-total-display {
  background: rgba(255, 255, 255, 0.15);
  padding: 16px 24px;
  border-radius: 8px;
  backdrop-filter: blur(10px);
}

.grand-total-display .label {
  font-size: 14px;
  opacity: 0.9;
  margin-bottom: 4px;
}

.grand-total-display .amount {
  font-size: 32px;
  font-weight: bold;
  color: #fff;
}

/* 基本信息区域 */
.info-section {
  margin-bottom: 24px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.info-card {
  border-radius: 8px;
}

.info-card :deep(.el-card__header) {
  padding: 12px 16px;
  background-color: #f5f7fa;
  border-bottom: 1px solid #e4e7ed;
}

.info-card .card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #303133;
}

.info-card :deep(.el-card__body) {
  padding: 16px;
}

.info-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.info-row .label {
  color: #909399;
  font-size: 13px;
}

.info-row .value {
  color: #303133;
  font-weight: 500;
  font-size: 14px;
}

.info-row .value.empty {
  color: #c0c4cc;
}

.info-row .valid-until {
  color: #909399;
  font-size: 12px;
  margin-left: 4px;
}

/* 金额汇总卡片 */
.amount-summary-card {
  margin-bottom: 24px;
  border-radius: 8px;
}

.amount-summary-card :deep(.el-card__header) {
  padding: 12px 16px;
  background-color: #f0f9ff;
  border-bottom: 1px solid #d9ecff;
}

.amount-summary-card .card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #409eff;
}

.amount-summary {
  padding: 8px 0;
}

.amount-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 20px;
}

.amount-item {
  text-align: center;
  padding: 12px;
  background-color: #f5f7fa;
  border-radius: 8px;
  transition: all 0.3s;
}

.amount-item:hover {
  background-color: #e4e7ed;
  transform: translateY(-2px);
}

.amount-item.grand {
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%);
  color: white;
}

.amount-item.grand:hover {
  background: linear-gradient(135deg, #ff5252 0%, #e53935 100%);
}

.amount-label {
  font-size: 12px;
  color: #909399;
  margin-bottom: 8px;
}

.amount-item.grand .amount-label {
  color: rgba(255, 255, 255, 0.9);
}

.amount-value {
  font-size: 18px;
  font-weight: bold;
  color: #303133;
}

.amount-value.purchase {
  color: #409eff;
}

.amount-value.discount {
  color: #67c23a;
}

.amount-value.total {
  font-size: 24px;
  color: white;
}

.profit-rate {
  font-size: 12px;
  margin-left: 4px;
  opacity: 0.8;
}

/* 配件明细卡片 */
.items-card {
  margin-bottom: 24px;
  border-radius: 8px;
}

.items-card :deep(.el-card__header) {
  padding: 12px 16px;
  background-color: #f5f7fa;
  border-bottom: 1px solid #e4e7ed;
}

.items-card .card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #303133;
}

.item-count {
  margin-left: auto;
  font-size: 13px;
  color: #909399;
  font-weight: normal;
}

/* 备注和条款 */
.notes-section {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.notes-card,
.terms-card {
  border-radius: 8px;
}

.notes-card :deep(.el-card__header),
.terms-card :deep(.el-card__header) {
  padding: 12px 16px;
  background-color: #f5f7fa;
  border-bottom: 1px solid #e4e7ed;
}

.notes-card .card-header,
.terms-card .card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #303133;
}

.notes-content,
.terms-content {
  padding: 8px;
  color: #606266;
  line-height: 1.8;
  white-space: pre-wrap;
  font-size: 14px;
}

/* 审核记录卡片 */
.approval-card {
  margin-bottom: 24px;
  border-radius: 8px;
}

.approval-card :deep(.el-card__header) {
  padding: 12px 16px;
  background-color: #f5f7fa;
  border-bottom: 1px solid #e4e7ed;
}

.approval-card .card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #303133;
}

.timeline-content {
  padding: 12px 16px;
  background-color: #f5f7fa;
  border-radius: 8px;
  margin-top: 8px;
}

.timeline-title {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.timeline-title .operator {
  font-weight: bold;
  color: #303133;
}

.timeline-title .level {
  color: #909399;
  font-size: 12px;
}

.timeline-comment {
  color: #606266;
  font-size: 13px;
  line-height: 1.6;
  padding-top: 8px;
  border-top: 1px dashed #dcdfe6;
}

/* 客户签字卡片 */
.customer-sign-card {
  margin-bottom: 24px;
  border-radius: 8px;
}

.customer-sign-card :deep(.el-card__header) {
  padding: 12px 16px;
  background: linear-gradient(135deg, #67c23a 0%, #85ce61 100%);
  border-bottom: none;
  color: white;
}

.customer-sign-card .card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}

.customer-sign-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.customer-sign-image {
  max-width: 300px;
  max-height: 150px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 10px;
  background: #f5f7fa;
  align-self: center;
}

.customer-sign-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 14px;
  color: #606266;
}

.customer-sign-info strong {
  color: #303133;
}

/* 待签字卡片 */
.signature-pending-card {
  margin-bottom: 24px;
  border-radius: 8px;
}

.signature-pending-card :deep(.el-card__header) {
  padding: 12px 16px;
  background-color: #fdf6ec;
  border-bottom: 1px solid #f5dab1;
}

.signature-pending-card .card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #e6a23c;
}

.signature-pending-content {
  padding: 20px 0;
}

/* 金额样式 */
.amount {
  color: #f56c6c;
  font-weight: bold;
}

.purchase-price {
  color: #409eff;
}

.purchase-amount {
  color: #409eff;
  font-weight: bold;
}

.profit-positive {
  color: #67c23a;
  font-weight: bold;
}

.profit-negative {
  color: #f56c6c;
  font-weight: bold;
}

.profit-zero {
  color: #909399;
}

.profit-rate-high {
  color: #67c23a;
  font-weight: bold;
}

.profit-rate-normal {
  color: #409eff;
  font-weight: bold;
}

.profit-rate-low {
  color: #e6a23c;
  font-weight: bold;
}

.profit-rate-negative {
  color: #f56c6c;
  font-weight: bold;
}

.profit-rate-zero {
  color: #909399;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  flex-wrap: wrap;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .header-card {
    flex-direction: column;
    gap: 16px;
    padding: 16px 20px;
    margin-bottom: 16px;
  }

  .quotation-no {
    font-size: 16px;
    flex-wrap: wrap;
  }

  .quotation-no .el-icon {
    font-size: 20px;
  }

  .quotation-meta {
    flex-wrap: wrap;
    gap: 8px;
    font-size: 12px;
  }

  .meta-item {
    gap: 4px;
  }

  .grand-total-display {
    padding: 12px 16px;
    width: 100%;
    text-align: center;
  }

  .grand-total-display .amount {
    font-size: 20px;
  }

  .info-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .info-card :deep(.el-card__header) {
    padding: 10px 12px;
  }

  .info-card :deep(.el-card__body) {
    padding: 12px;
  }

  .info-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }

  .amount-summary-card {
    margin-bottom: 16px;
  }

  .amount-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }

  .amount-item {
    padding: 10px 8px;
  }

  .amount-value {
    font-size: 14px;
  }

  .amount-value.total {
    font-size: 18px;
  }

  .items-card {
    margin-bottom: 16px;
  }

  .items-card :deep(.el-card__body) {
    padding: 0;
    overflow-x: auto;
  }

  .items-card :deep(.el-table) {
    min-width: 800px;
  }

  .notes-section {
    grid-template-columns: 1fr;
    gap: 12px;
    margin-bottom: 16px;
  }

  .approval-card {
    margin-bottom: 16px;
  }

  .timeline-content {
    padding: 10px 12px;
  }

  .timeline-title {
    flex-wrap: wrap;
    gap: 6px;
  }

  .dialog-footer {
    flex-direction: column;
    gap: 8px;
  }

  .dialog-footer .el-button {
    width: 100%;
    margin: 0;
  }
}

@media (max-width: 480px) {
  .quotation-view {
    padding: 0 8px;
  }

  .header-card {
    padding: 12px 16px;
    border-radius: 8px;
  }

  .quotation-no {
    font-size: 14px;
  }

  .quotation-meta {
    flex-direction: column;
    gap: 6px;
  }

  .amount-grid {
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .amount-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 12px;
  }

  .amount-item.grand {
    flex-direction: column;
    text-align: center;
  }

  .amount-label {
    margin-bottom: 0;
    font-size: 13px;
  }

  .amount-value {
    font-size: 16px;
  }

  .info-card,
  .amount-summary-card,
  .items-card,
  .notes-card,
  .terms-card,
  .approval-card {
    border-radius: 6px;
  }
}

/* 小屏幕手机适配 */
@media (max-width: 375px) {
  .header-card {
    padding: 10px 12px;
  }

  .grand-total-display .amount {
    font-size: 18px;
  }

  .amount-value {
    font-size: 14px;
  }
}
</style>
