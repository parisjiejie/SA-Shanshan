<template>
  <el-dialog
    title="选择配件转订单"
    v-model="dialogVisible"
    width="900px"
    :close-on-click-modal="false"
    :destroy-on-close="true"
    class="quotation-convert-dialog"
  >
    <div class="convert-info">
      <el-alert
        title="请勾选需要下单的配件，可以修改下单数量"
        type="info"
        :closable="false"
        show-icon
      />
    </div>

    <!-- 配件选择表格 -->
    <el-table
      :data="quotationItems"
      border
      style="width: 100%"
      @selection-change="handleSelectionChange"
    >
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column type="index" label="序号" width="50" align="center" />
      <el-table-column prop="partNumber" label="配件编码" width="100" />
      <el-table-column prop="partName" label="配件名称" min-width="120" />
      <el-table-column prop="specification" label="规格" width="100" />
      <el-table-column prop="unit" label="单位" width="60" />
      <el-table-column label="报价数量" width="80" align="right">
        <template #default="{ row }">
          {{ row.quantity }}
        </template>
      </el-table-column>
      <el-table-column label="下单数量" width="120" align="center">
        <template #default="{ row }">
          <el-input-number
            v-model="row.orderQuantity"
            :min="1"
            :max="row.quantity"
            :disabled="!isSelected(row)"
            size="small"
            style="width: 100px"
          />
        </template>
      </el-table-column>
      <el-table-column prop="unitPrice" label="单价" width="100" align="right">
        <template #default="{ row }">
          ¥{{ formatAmount(row.unitPrice) }}
        </template>
      </el-table-column>
      <el-table-column label="小计" width="100" align="right">
        <template #default="{ row }">
          <span class="amount">
            ¥{{ formatAmount(row.orderQuantity * row.unitPrice) }}
          </span>
        </template>
      </el-table-column>
    </el-table>

    <!-- 金额汇总 -->
    <div class="amount-summary">
      <div class="summary-row">
        <span class="label">已选配件：</span>
        <span class="value">{{ selectedItems.length }} 项</span>
      </div>
      <div class="summary-row">
        <span class="label">数量合计：</span>
        <span class="value">{{ totalQuantity }} 件</span>
      </div>
      <div class="summary-row">
        <span class="label">金额合计：</span>
        <span class="value amount">¥{{ formatAmount(totalAmount) }}</span>
      </div>
    </div>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button
          type="primary"
          :disabled="selectedItems.length === 0"
          @click="handleConfirm"
        >
          确认转订单
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script>
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'

export default {
  name: 'QuotationConvertDialog',
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
  emits: ['update:visible', 'confirm'],
  setup(props, { emit }) {
    // 对话框可见性
    const dialogVisible = computed({
      get: () => props.visible,
      set: (val) => emit('update:visible', val)
    })

    // 报价单配件列表（添加orderQuantity字段）
    const quotationItems = ref([])

    // 选中的配件
    const selectedItems = ref([])

    // 初始化配件列表
    const initItems = () => {
      if (props.quotation?.items) {
        quotationItems.value = props.quotation.items.map(item => ({
          ...item,
          orderQuantity: item.quantity // 默认下单数量等于报价数量
        }))
      } else {
        quotationItems.value = []
      }
      selectedItems.value = []
    }

    // 监听对话框打开
    watch(() => props.visible, (newVal) => {
      if (newVal) {
        initItems()
      }
    })

    // 监听quotation变化
    watch(() => props.quotation, () => {
      if (props.visible) {
        initItems()
      }
    }, { immediate: true })

    // 判断是否选中
    const isSelected = (row) => {
      return selectedItems.value.some(item => item.id === row.id)
    }

    // 选择变化处理
    const handleSelectionChange = (selection) => {
      selectedItems.value = selection
    }

    // 计算总数量
    const totalQuantity = computed(() => {
      return selectedItems.value.reduce((sum, item) => sum + (item.orderQuantity || 0), 0)
    })

    // 计算总金额
    const totalAmount = computed(() => {
      return selectedItems.value.reduce((sum, item) => {
        return sum + (item.orderQuantity || 0) * (item.unitPrice || 0)
      }, 0)
    })

    // 格式化金额
    const formatAmount = (amount) => {
      if (amount === undefined || amount === null) return '0.00'
      return amount.toLocaleString('zh-CN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })
    }

    // 关闭对话框
    const handleClose = () => {
      dialogVisible.value = false
    }

    // 确认转订单
    const handleConfirm = () => {
      if (selectedItems.value.length === 0) {
        ElMessage.warning('请至少选择一项配件')
        return
      }

      // 构建订单数据
      const orderData = {
        quotationId: props.quotation?.id,
        quotationNo: props.quotation?.quotationNo,
        customerId: props.quotation?.customerId,
        customerName: props.quotation?.customerName,
        contactName: props.quotation?.contactName,
        contactPhone: props.quotation?.contactPhone,
        items: selectedItems.value.map(item => ({
          id: item.id,
          partNumber: item.partNumber,
          partName: item.partName,
          specification: item.specification,
          unit: item.unit,
          quantity: item.orderQuantity,
          unitPrice: item.unitPrice,
          totalPrice: item.orderQuantity * item.unitPrice,
          purchasePrice: item.purchasePrice,
          purchaseTotal: item.orderQuantity * (item.purchasePrice || 0),
          profit: (item.orderQuantity * item.unitPrice) - (item.orderQuantity * (item.purchasePrice || 0)),
          remark: item.remark
        })),
        totalQuantity: totalQuantity.value,
        totalAmount: totalAmount.value
      }

      emit('confirm', orderData)
      dialogVisible.value = false
    }

    return {
      dialogVisible,
      quotationItems,
      selectedItems,
      totalQuantity,
      totalAmount,
      isSelected,
      handleSelectionChange,
      formatAmount,
      handleClose,
      handleConfirm
    }
  }
}
</script>

<style scoped>
.convert-info {
  margin-bottom: 20px;
}

.amount-summary {
  margin-top: 20px;
  padding: 15px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.summary-row {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  margin-bottom: 8px;
}

.summary-row:last-child {
  margin-bottom: 0;
  padding-top: 8px;
  border-top: 1px solid #dcdfe6;
}

.summary-row .label {
  color: #606266;
  margin-right: 10px;
}

.summary-row .value {
  color: #303133;
  font-weight: 500;
  min-width: 100px;
  text-align: right;
}

.summary-row .amount {
  color: #f56c6c;
  font-size: 16px;
  font-weight: bold;
}

:deep(.el-table .el-input-number.is-disabled) {
  opacity: 0.5;
}
</style>
