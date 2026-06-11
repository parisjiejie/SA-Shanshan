<template>
  <el-dialog
    :title="dialogTitle"
    v-model="dialogVisible"
    width="700px"
    :fullscreen="isMobile"
    :close-on-click-modal="false"
    :destroy-on-close="true"
    class="quotation-approve-dialog"
    @close="handleClose"
  >
    <div class="approve-view">
      <!-- 头部信息卡片 -->
      <div class="header-card">
        <div class="header-left">
          <div class="approve-title">
            <el-icon><Stamp /></el-icon>
            <span>审核报价单</span>
          </div>
          <div class="quotation-meta">
            <span class="meta-item">
              <el-icon><Document /></el-icon>
              {{ quotation?.quotationNo }}
            </span>
            <span class="meta-item">
              <el-icon><OfficeBuilding /></el-icon>
              {{ quotation?.customerName }}
            </span>
          </div>
        </div>
        <div class="header-right">
          <div class="amount-display">
            <div class="label">报价总额</div>
            <div class="amount">¥{{ formatAmount(quotation?.totalAmount) }}</div>
          </div>
        </div>
      </div>

      <!-- 报价信息卡片 -->
      <el-card class="section-card info-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <el-icon><InfoFilled /></el-icon>
            <span>报价信息</span>
          </div>
        </template>
        <div class="info-grid">
          <div class="info-item">
            <span class="label">客户名称</span>
            <span class="value">{{ quotation?.customerName }}</span>
          </div>
          <div class="info-item">
            <span class="label">联系人</span>
            <span class="value">{{ quotation?.contactName }}</span>
          </div>
          <div class="info-item">
            <span class="label">采购金额</span>
            <span class="value purchase">¥{{ formatAmount(quotation?.purchaseTotal) }}</span>
          </div>
          <div class="info-item">
            <span class="label">销售金额</span>
            <span class="value amount">¥{{ formatAmount(quotation?.subtotal) }}</span>
          </div>
          <div class="info-item">
            <span class="label">利润合计</span>
            <span :class="['value', getProfitClass(quotation?.profitTotal)]">
              ¥{{ formatAmount(quotation?.profitTotal) }}
            </span>
          </div>
          <div class="info-item">
            <span class="label">总利润率</span>
            <span :class="['value', getProfitRateClass(quotation?.profitRate)]">
              {{ formatProfitRate(quotation?.profitRate) }}
            </span>
          </div>
          <div class="info-item">
            <span class="label">当前审核级别</span>
            <el-tag size="small">{{ currentLevelName }}</el-tag>
          </div>
          <div class="info-item">
            <span class="label">所需审核级别</span>
            <el-tag size="small" type="warning">{{ requiredLevelName }}</el-tag>
          </div>
        </div>
      </el-card>

      <!-- 配件明细卡片 -->
      <el-card v-if="quotation?.items && quotation.items.length > 0" class="section-card items-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <el-icon><Goods /></el-icon>
            <span>配件明细</span>
            <el-tag size="small" type="info" style="margin-left: 8px;">{{ quotation.items.length }}项</el-tag>
          </div>
        </template>
        <div class="items-list">
          <div v-for="(item, index) in quotation.items" :key="index" class="item-row">
            <div class="item-info">
              <span class="item-index">{{ index + 1 }}</span>
              <span class="item-name">{{ item.name }}</span>
            </div>
            <div class="item-details">
              <span class="item-quantity">数量: {{ item.quantity }}</span>
              <span class="item-price purchase">采购: ¥{{ formatAmount(item.purchasePrice) }}</span>
              <span class="item-price sale">销售: ¥{{ formatAmount(item.salePrice) }}</span>
              <span class="item-profit" :class="getProfitClass(item.profit)">利润: ¥{{ formatAmount(item.profit) }}</span>
            </div>
          </div>
        </div>
      </el-card>

      <!-- 审核表单卡片 -->
      <el-card class="section-card form-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <el-icon><EditPen /></el-icon>
            <span>审核操作</span>
          </div>
        </template>
        <el-form
          ref="formRef"
          :model="form"
          :rules="rules"
          label-width="100px"
          class="approve-form"
        >
          <el-form-item label="审核结果" prop="action">
            <el-radio-group v-model="form.action" size="large">
              <el-radio-button value="approve">
                <el-icon><Check /></el-icon>
                通过
              </el-radio-button>
              <el-radio-button value="reject">
                <el-icon><Close /></el-icon>
                驳回
              </el-radio-button>
            </el-radio-group>
          </el-form-item>

          <el-form-item 
            label="审核意见" 
            prop="comment"
            :rules="form.action === 'reject' ? { required: true, message: '驳回时必须填写审核意见', trigger: 'blur' } : {}"
          >
            <el-input
              v-model="form.comment"
              type="textarea"
              :rows="4"
              :placeholder="form.action === 'approve' ? '请输入审核意见（可选）' : '请输入驳回原因（必填）'"
            />
          </el-form-item>

          <!-- 下一级审核人（通过时显示） -->
          <el-form-item v-if="form.action === 'approve' && needNextLevel">
            <el-alert
              title="此报价单需要多级审核"
              type="warning"
              :closable="false"
              show-icon
            >
              <template #default>
                通过后将提交给 <strong>{{ nextLevelName }}</strong> 进行审核
              </template>
            </el-alert>
          </el-form-item>
        </el-form>
      </el-card>

      <!-- 审核历史卡片 -->
      <el-card v-if="approvalRecords.length > 0" class="section-card history-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <el-icon><Timer /></el-icon>
            <span>审核历史</span>
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
    </div>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleClose" size="large">取消</el-button>
        <el-button 
          type="primary" 
          @click="handleConfirm"
          :disabled="!form.action"
          size="large"
        >
          <el-icon><Check /></el-icon>
          确认
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script>
import { ref, computed, reactive, onMounted } from 'vue'
import { Check, Close, Stamp, Document, OfficeBuilding, InfoFilled, EditPen, Timer, Goods } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { 
  getApprovalRecords, 
  ApprovalLevel, 
  approvalLevelConfig,
  QuotationStatus 
} from '../stores/quotationStore.js'

export default {
  name: 'QuotationApproveDialog',
  components: {
    Check,
    Close,
    Stamp,
    Document,
    OfficeBuilding,
    InfoFilled,
    EditPen,
    Timer,
    Goods
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
  emits: ['update:visible', 'approve', 'reject'],
  setup(props, { emit }) {
    const formRef = ref(null)

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

    // 表单数据
    const form = reactive({
      action: 'approve',
      comment: ''
    })

    // 表单验证规则
    const rules = {
      action: [
        { required: true, message: '请选择审核结果', trigger: 'change' }
      ]
    }

    // 对话框可见性
    const dialogVisible = computed({
      get: () => props.visible,
      set: (val) => emit('update:visible', val)
    })

    // 对话框标题
    const dialogTitle = computed(() => {
      return '审核报价单'
    })

    // 当前审核级别
    const currentLevel = computed(() => {
      if (!props.quotation) return ApprovalLevel.NONE
      return props.quotation.currentApprovalLevel || ApprovalLevel.SALES_SUPERVISOR
    })

    // 当前审核级别名称
    const currentLevelName = computed(() => {
      return approvalLevelConfig[currentLevel.value]?.name || '未知'
    })

    // 所需审核级别
    const requiredLevel = computed(() => {
      if (!props.quotation) return ApprovalLevel.SALES_SUPERVISOR
      return props.quotation.requiredApprovalLevel || ApprovalLevel.SALES_SUPERVISOR
    })

    // 所需审核级别名称
    const requiredLevelName = computed(() => {
      return approvalLevelConfig[requiredLevel.value]?.name || '未知'
    })

    // 是否需要下一级审核
    const needNextLevel = computed(() => {
      return currentLevel.value < requiredLevel.value
    })

    // 下一级审核名称
    const nextLevelName = computed(() => {
      const nextLevel = currentLevel.value + 1
      return approvalLevelConfig[nextLevel]?.name || '未知'
    })

    // 审核记录
    const approvalRecords = computed(() => {
      if (!props.quotation) return []
      return getApprovalRecords(props.quotation.id)
    })

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

    // 操作类型
    const getActionType = (action) => {
      const typeMap = {
        submit: 'primary',
        approve: 'success',
        reject: 'danger'
      }
      return typeMap[action] || 'info'
    }

    // 关闭对话框
    const handleClose = () => {
      dialogVisible.value = false
      resetForm()
    }

    // 重置表单
    const resetForm = () => {
      form.action = 'approve'
      form.comment = ''
    }

    // 确认审核
    const handleConfirm = async () => {
      const valid = await formRef.value.validate().catch(() => false)
      if (!valid) return

      if (form.action === 'approve') {
        emit('approve', {
          level: currentLevel.value,
          comment: form.comment,
          operator: '当前用户'
        })
      } else {
        emit('reject', {
          level: currentLevel.value,
          comment: form.comment,
          operator: '当前用户'
        })
      }

      handleClose()
    }

    return {
      formRef,
      form,
      rules,
      dialogVisible,
      isMobile,
      dialogTitle,
      currentLevelName,
      requiredLevelName,
      needNextLevel,
      nextLevelName,
      approvalRecords,
      formatAmount,
      formatProfitRate,
      getProfitClass,
      getProfitRateClass,
      formatDateTime,
      getActionType,
      handleClose,
      handleConfirm
    }
  }
}
</script>

<style scoped>
/* 全屏弹窗样式优化 */
:deep(.quotation-approve-dialog.is-fullscreen) {
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

.approve-view {
  max-height: 600px;
  overflow-y: auto;
  padding: 0 10px;
}

:deep(.quotation-approve-dialog.is-fullscreen) .approve-view {
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

.approve-title {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 12px;
}

.approve-title .el-icon {
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

.header-right {
  text-align: right;
}

.amount-display {
  background: rgba(255, 255, 255, 0.15);
  padding: 16px 24px;
  border-radius: 8px;
  backdrop-filter: blur(10px);
}

.amount-display .label {
  font-size: 14px;
  opacity: 0.9;
  margin-bottom: 4px;
}

.amount-display .amount {
  font-size: 28px;
  font-weight: bold;
  color: #fff;
}

/* 通用卡片样式 */
.section-card {
  margin-bottom: 24px;
  border-radius: 8px;
}

.section-card :deep(.el-card__header) {
  padding: 12px 16px;
  background-color: #f5f7fa;
  border-bottom: 1px solid #e4e7ed;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #303133;
}

.section-card :deep(.el-card__body) {
  padding: 20px;
}

/* 信息网格 */
.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background-color: #f5f7fa;
  border-radius: 6px;
}

.info-item .label {
  color: #909399;
  font-size: 13px;
}

.info-item .value {
  color: #303133;
  font-weight: 500;
  font-size: 14px;
}

.info-item .value.amount {
  color: #f56c6c;
  font-weight: bold;
}

.info-item .value.purchase {
  color: #409eff;
  font-weight: bold;
}

/* 表单卡片 */
.form-card :deep(.el-card__header) {
  background-color: #f0f9ff;
  border-bottom: 1px solid #d9ecff;
}

.form-card .card-header {
  color: #409eff;
}

.approve-form :deep(.el-radio-group) {
  display: flex;
  gap: 16px;
}

.approve-form :deep(.el-radio-button__inner) {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 12px 24px;
}

/* 配件明细卡片 */
.items-card :deep(.el-card__header) {
  background-color: #f6ffed;
  border-bottom: 1px solid #b7eb8f;
}

.items-card .card-header {
  color: #52c41a;
}

.items-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.item-row {
  display: flex;
  flex-direction: column;
  padding: 12px;
  background-color: #f5f7fa;
  border-radius: 8px;
  gap: 8px;
}

.item-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.item-index {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #1890ff;
  color: white;
  border-radius: 50%;
  font-size: 12px;
  font-weight: bold;
}

.item-name {
  font-weight: 500;
  color: #303133;
  font-size: 14px;
}

.item-details {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  padding-left: 34px;
  font-size: 13px;
}

.item-quantity {
  color: #606266;
}

.item-price {
  font-weight: 500;
}

.item-price.purchase {
  color: #409eff;
}

.item-price.sale {
  color: #f56c6c;
}

.item-profit {
  font-weight: 500;
}

/* 历史卡片 */
.history-card :deep(.el-card__header) {
  background-color: #fdf6ec;
  border-bottom: 1px solid #faecd8;
}

.history-card .card-header {
  color: #e6a23c;
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

/* 金额样式 */
.amount {
  color: #f56c6c;
  font-weight: bold;
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

/* 底部按钮 */
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  flex-wrap: wrap;
}

.dialog-footer .el-button {
  min-width: 100px;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .header-card {
    flex-direction: column;
    gap: 16px;
    padding: 16px 20px;
    margin-bottom: 16px;
  }

  .approve-title {
    font-size: 18px;
  }

  .approve-title .el-icon {
    font-size: 22px;
  }

  .quotation-meta {
    flex-wrap: wrap;
    gap: 8px;
    font-size: 12px;
  }

  .amount-display {
    padding: 12px 20px;
    width: 100%;
    text-align: center;
  }

  .amount-display .amount {
    font-size: 22px;
  }

  .section-card {
    margin-bottom: 16px;
  }

  .section-card :deep(.el-card__body) {
    padding: 12px;
  }

  .info-grid {
    grid-template-columns: 1fr;
    gap: 10px;
  }

  .info-item {
    padding: 10px;
  }

  .approve-form :deep(.el-radio-group) {
    width: 100%;
  }

  .approve-form :deep(.el-radio-button) {
    flex: 1;
  }

  .approve-form :deep(.el-radio-button__inner) {
    width: 100%;
    justify-content: center;
  }

  .timeline-title {
    flex-wrap: wrap;
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
  .approve-view {
    padding: 0 8px;
  }

  .header-card {
    padding: 12px 16px;
    border-radius: 8px;
  }

  .approve-title {
    font-size: 16px;
  }

  .quotation-meta {
    flex-direction: column;
    gap: 6px;
  }

  .section-card,
  .info-card,
  .form-card,
  .history-card {
    border-radius: 6px;
  }

  .card-header {
    font-size: 14px;
  }
}

@media (max-width: 375px) {
  .header-card {
    padding: 10px 12px;
  }

  .amount-display .amount {
    font-size: 20px;
  }
}
</style>
