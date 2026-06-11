<template>
  <el-dialog
    :title="dialogTitle"
    v-model="dialogVisible"
    width="900px"
    :close-on-click-modal="false"
    :destroy-on-close="true"
    @close="handleClose"
  >
    <div class="version-container">
      <!-- 当前版本信息 -->
      <el-alert
        :title="`当前版本：V${currentQuotation?.version}`"
        type="success"
        :closable="false"
        class="mb-4"
      >
        <template #default>
          <div class="current-version-info">
            <div>报价单号：{{ currentQuotation?.quotationNo }}</div>
            <div>客户：{{ currentQuotation?.customerName }}</div>
            <div>状态：<el-tag :type="getStatusType(currentQuotation?.status)" size="small">{{ getStatusText(currentQuotation?.status) }}</el-tag></div>
            <div>创建时间：{{ formatDateTime(currentQuotation?.createdAt) }}</div>
          </div>
        </template>
      </el-alert>

      <!-- 版本历史列表 -->
      <div class="section-title">版本历史</div>
      <el-timeline>
        <el-timeline-item
          v-for="version in versionList"
          :key="version.id"
          :type="version.id === currentQuotation?.id ? 'primary' : 'info'"
          :timestamp="formatDateTime(version.createdAt)"
          placement="top"
        >
          <el-card :class="['version-card', { 'current': version.id === currentQuotation?.id }]">
            <div class="version-header">
              <div class="version-info">
                <span class="version-tag">V{{ version.version }}</span>
                <el-tag :type="getStatusType(version.status)" size="small">
                  {{ getStatusText(version.status) }}
                </el-tag>
                <span v-if="version.id === currentQuotation?.id" class="current-badge">当前</span>
              </div>
              <div class="version-amount">
                金额：¥{{ formatAmount(version.totalAmount) }}
              </div>
            </div>

            <div class="version-details">
              <div class="detail-row">
                <span class="label">报价单号：</span>
                <span class="value">{{ version.quotationNo }}</span>
              </div>
              <div class="detail-row">
                <span class="label">配件数量：</span>
                <span class="value">{{ version.items?.length || 0 }} 项</span>
              </div>
              <div class="detail-row">
                <span class="label">销售金额：</span>
                <span class="value amount">¥{{ formatAmount(version.subtotal) }}</span>
              </div>
              <div class="detail-row">
                <span class="label">利润：</span>
                <span :class="['value', getProfitClass(version.profitTotal)]">
                  ¥{{ formatAmount(version.profitTotal) }} ({{ formatProfitRate(version.profitRate) }})
                </span>
              </div>
              <div v-if="version.sendRecord" class="detail-row">
                <span class="label">发送记录：</span>
                <span class="value">{{ formatDateTime(version.sendRecord.sentAt) }} 发送至 {{ version.sendRecord.toEmail }}</span>
              </div>
            </div>

            <div class="version-actions">
              <el-button type="primary" size="small" @click="handleViewVersion(version)">
                <el-icon><View /></el-icon>
                查看详情
              </el-button>
              <el-button
                v-if="version.id !== currentQuotation?.id"
                type="success"
                size="small"
                @click="handleCompareVersion(version)"
              >
                <el-icon><Sort /></el-icon>
                对比差异
              </el-button>
              <el-button
                v-if="version.id !== currentQuotation?.id && version.status === 'draft'"
                type="warning"
                size="small"
                @click="handleSwitchVersion(version)"
              >
                <el-icon><Switch /></el-icon>
                切换到此版本
              </el-button>
            </div>
          </el-card>
        </el-timeline-item>
      </el-timeline>

      <!-- 版本对比 -->
      <div v-if="compareVersion" class="compare-section">
        <div class="section-title">版本对比 (V{{ compareVersion.version }} vs V{{ currentQuotation?.version }})</div>
        <el-table :data="compareData" border size="small">
          <el-table-column prop="field" label="对比项" width="150" />
          <el-table-column label="V{{ compareVersion.version }}" min-width="200">
            <template #default="{ row }">
              <span :class="{ 'highlight': row.changed }">{{ row.oldValue }}</span>
            </template>
          </el-table-column>
          <el-table-column label="V{{ currentQuotation?.version }}" min-width="200">
            <template #default="{ row }">
              <span :class="{ 'highlight': row.changed }">{{ row.newValue }}</span>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleClose">关闭</el-button>
        <el-button
          v-if="canCreateNewVersion"
          type="primary"
          @click="handleCreateNewVersion"
        >
          <el-icon><Plus /></el-icon>
          创建新版本
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script>
import { ref, computed, watch } from 'vue'
import { View, Sort, Switch, Plus } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { QuotationStatus } from '../stores/quotationStore.js'

export default {
  name: 'QuotationVersionDialog',
  components: {
    View,
    Sort,
    Switch,
    Plus
  },
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    currentQuotation: {
      type: Object,
      default: null
    },
    versionList: {
      type: Array,
      default: () => []
    }
  },
  emits: ['update:visible', 'view', 'switch', 'create-version'],
  setup(props, { emit }) {
    // 对比的版本
    const compareVersion = ref(null)
    const compareData = ref([])

    // 对话框可见性
    const dialogVisible = computed({
      get: () => props.visible,
      set: (val) => emit('update:visible', val)
    })

    // 对话框标题
    const dialogTitle = computed(() => {
      return '报价单版本管理'
    })

    // 是否可以创建新版本
    const canCreateNewVersion = computed(() => {
      if (!props.currentQuotation) return false
      return ['sent', 'confirmed', 'expired'].includes(props.currentQuotation.status)
    })

    // 监听版本列表变化，清除对比
    watch(() => props.versionList, () => {
      compareVersion.value = null
      compareData.value = []
    })

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
      if (profit === undefined || profit === null) return ''
      return profit >= 0 ? 'profit-positive' : 'profit-negative'
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

    // 查看版本详情
    const handleViewVersion = (version) => {
      emit('view', version)
    }

    // 对比版本差异
    const handleCompareVersion = (version) => {
      compareVersion.value = version
      generateCompareData(version, props.currentQuotation)
    }

    // 生成对比数据
    const generateCompareData = (oldVersion, newVersion) => {
      const data = []

      // 对比基本信息
      data.push({
        field: '报价单号',
        oldValue: oldVersion.quotationNo,
        newValue: newVersion.quotationNo,
        changed: oldVersion.quotationNo !== newVersion.quotationNo
      })

      data.push({
        field: '状态',
        oldValue: getStatusText(oldVersion.status),
        newValue: getStatusText(newVersion.status),
        changed: oldVersion.status !== newVersion.status
      })

      data.push({
        field: '配件数量',
        oldValue: (oldVersion.items?.length || 0) + ' 项',
        newValue: (newVersion.items?.length || 0) + ' 项',
        changed: (oldVersion.items?.length || 0) !== (newVersion.items?.length || 0)
      })

      data.push({
        field: '采购金额',
        oldValue: '¥' + formatAmount(oldVersion.purchaseTotal),
        newValue: '¥' + formatAmount(newVersion.purchaseTotal),
        changed: oldVersion.purchaseTotal !== newVersion.purchaseTotal
      })

      data.push({
        field: '销售金额',
        oldValue: '¥' + formatAmount(oldVersion.subtotal),
        newValue: '¥' + formatAmount(newVersion.subtotal),
        changed: oldVersion.subtotal !== newVersion.subtotal
      })

      data.push({
        field: '税额',
        oldValue: '¥' + formatAmount(oldVersion.taxAmount),
        newValue: '¥' + formatAmount(newVersion.taxAmount),
        changed: oldVersion.taxAmount !== newVersion.taxAmount
      })

      data.push({
        field: '折扣',
        oldValue: '¥' + formatAmount(oldVersion.discount),
        newValue: '¥' + formatAmount(newVersion.discount),
        changed: oldVersion.discount !== newVersion.discount
      })

      data.push({
        field: '合计金额',
        oldValue: '¥' + formatAmount(oldVersion.totalAmount),
        newValue: '¥' + formatAmount(newVersion.totalAmount),
        changed: oldVersion.totalAmount !== newVersion.totalAmount
      })

      data.push({
        field: '利润',
        oldValue: '¥' + formatAmount(oldVersion.profitTotal) + ' (' + formatProfitRate(oldVersion.profitRate) + ')',
        newValue: '¥' + formatAmount(newVersion.profitTotal) + ' (' + formatProfitRate(newVersion.profitRate) + ')',
        changed: oldVersion.profitTotal !== newVersion.profitTotal
      })

      compareData.value = data
    }

    // 切换版本
    const handleSwitchVersion = (version) => {
      ElMessageBox.confirm(
        `确定要切换到此版本（V${version.version}）吗？`,
        '确认切换版本',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      ).then(() => {
        emit('switch', version)
        ElMessage.success(`已切换到 V${version.version}`)
      })
    }

    // 创建新版本
    const handleCreateNewVersion = () => {
      emit('create-version')
      handleClose()
    }

    // 关闭对话框
    const handleClose = () => {
      dialogVisible.value = false
      compareVersion.value = null
      compareData.value = []
    }

    return {
      dialogVisible,
      dialogTitle,
      canCreateNewVersion,
      compareVersion,
      compareData,
      getStatusType,
      getStatusText,
      formatAmount,
      formatProfitRate,
      getProfitClass,
      formatDateTime,
      handleViewVersion,
      handleCompareVersion,
      handleSwitchVersion,
      handleCreateNewVersion,
      handleClose
    }
  }
}
</script>

<style scoped>
.version-container {
  max-height: 600px;
  overflow-y: auto;
}

.mb-4 {
  margin-bottom: 20px;
}

.current-version-info {
  margin-top: 10px;
}

.current-version-info div {
  margin-bottom: 5px;
}

.section-title {
  margin: 20px 0 15px;
  font-size: 16px;
  font-weight: bold;
  color: #303133;
  border-left: 4px solid #409eff;
  padding-left: 10px;
}

.version-card {
  margin-bottom: 10px;
}

.version-card.current {
  border: 2px solid #409eff;
}

.version-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #ebeef5;
}

.version-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.version-tag {
  font-size: 16px;
  font-weight: bold;
  color: #409eff;
}

.current-badge {
  background-color: #67c23a;
  color: white;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.version-amount {
  font-size: 16px;
  font-weight: bold;
  color: #f56c6c;
}

.version-details {
  margin-bottom: 15px;
}

.detail-row {
  display: flex;
  margin-bottom: 8px;
}

.detail-row .label {
  width: 100px;
  color: #909399;
}

.detail-row .value {
  flex: 1;
  color: #606266;
}

.detail-row .value.amount {
  color: #f56c6c;
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

.version-actions {
  display: flex;
  gap: 10px;
}

.compare-section {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 2px solid #ebeef5;
}

.highlight {
  background-color: #fdf6ec;
  color: #e6a23c;
  font-weight: bold;
  padding: 2px 5px;
  border-radius: 3px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .version-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .version-actions {
    flex-wrap: wrap;
  }

  .detail-row {
    flex-direction: column;
  }

  .detail-row .label {
    width: 100%;
    margin-bottom: 5px;
  }
}
</style>
