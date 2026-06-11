<template>
  <el-dialog
    :title="dialogTitle"
    v-model="dialogVisible"
    width="1000px"
    :fullscreen="isMobile"
    :close-on-click-modal="false"
    :destroy-on-close="true"
    class="quotation-edit-dialog"
    @close="handleClose"
  >
    <div class="quotation-edit">
      <!-- 头部信息卡片 -->
      <div class="header-card">
        <div class="header-left">
          <div class="quotation-title">
            <el-icon><DocumentAdd v-if="!isEdit" /><EditPen v-else /></el-icon>
            <span>{{ isEdit ? '编辑报价单' : '新建报价单' }}</span>
          </div>
          <div class="quotation-meta" v-if="isEdit && form.quotationNo">
            <span class="meta-item">
              <el-icon><Document /></el-icon>
              {{ form.quotationNo }}
            </span>
            <span class="meta-item version">
              <el-icon><Collection /></el-icon>
              V{{ form.version || 1 }}
            </span>
          </div>
        </div>
        <div class="header-right" v-if="form.totalAmount > 0">
          <div class="grand-total-display">
            <div class="label">预计总额</div>
            <div class="amount">¥{{ formatAmount(form.totalAmount) }}</div>
          </div>
        </div>
      </div>

      <!-- 基本信息区域 -->
      <el-card class="section-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <el-icon><InfoFilled /></el-icon>
            <span>基本信息</span>
          </div>
        </template>
        <el-form
          ref="formRef"
          :model="form"
          :rules="rules"
          label-width="100px"
          class="quotation-form"
        >
          <!-- 工单选择 -->
          <div class="form-grid">
            <el-form-item label="关联工单" prop="workorderId" class="form-item-full">
              <el-select
                v-model="form.workorderId"
                placeholder="请选择工单"
                style="width: 100%"
                filterable
                clearable
                @change="handleWorkorderChange"
              >
                <el-option
                  v-for="workorder in workorderList"
                  :key="workorder.id"
                  :label="`${workorder.workorderNo} - ${workorder.customerName}`"
                  :value="workorder.id"
                />
              </el-select>
              <div v-if="form.workorderNo" class="workorder-tag">
                <el-tag size="small" type="info">{{ form.workorderNo }}</el-tag>
              </div>
            </el-form-item>

            <el-form-item label="客户名称" prop="customerName">
              <el-input v-model="form.customerName" placeholder="请输入客户名称" :disabled="!!form.workorderId" />
            </el-form-item>

            <el-form-item label="联系人" prop="contactName">
              <el-input v-model="form.contactName" placeholder="请输入联系人姓名" :disabled="!!form.workorderId" />
            </el-form-item>

            <el-form-item label="联系电话" prop="contactPhone">
              <el-input v-model="form.contactPhone" placeholder="请输入联系电话" :disabled="!!form.workorderId" />
            </el-form-item>

            <el-form-item label="有效期" prop="validDays">
              <el-input-number v-model="form.validDays" :min="1" :max="90" style="width: 120px" />
              <span class="unit">天</span>
            </el-form-item>
          </div>
        </el-form>
      </el-card>

      <!-- 配件明细卡片 -->
      <el-card class="section-card items-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <el-icon><Box /></el-icon>
            <span>配件明细</span>
            <span class="item-count">共 {{ form.items?.length || 0 }} 项</span>
            <div class="header-actions">
              <el-button type="primary" link size="small" @click="handleImportExcel">
                <el-icon><Upload /></el-icon>
                Excel导入
              </el-button>
              <el-button type="success" link size="small" @click="handleDownloadTemplate">
                <el-icon><Download /></el-icon>
                下载模板
              </el-button>
              <el-button type="primary" size="small" @click="handleAddItem">
                <el-icon><Plus /></el-icon>
                添加配件
              </el-button>
            </div>
          </div>
        </template>

        <div class="table-wrapper">
          <el-table :data="form.items" border style="width: 100%" size="small">
            <el-table-column type="index" label="序号" width="50" align="center" />
            <el-table-column label="配件编码" width="110">
              <template #default="{ row }">
                <el-input v-model="row.partNumber" size="small" placeholder="编码" />
              </template>
            </el-table-column>
            <el-table-column label="配件名称" min-width="130">
              <template #default="{ row }">
                <el-input v-model="row.partName" size="small" placeholder="名称" />
              </template>
            </el-table-column>
            <el-table-column label="规格" width="100">
              <template #default="{ row }">
                <el-input v-model="row.specification" size="small" placeholder="规格" />
              </template>
            </el-table-column>
            <el-table-column label="单位" width="60" align="center">
              <template #default="{ row }">
                <el-input v-model="row.unit" size="small" placeholder="单位" />
              </template>
            </el-table-column>
            <el-table-column label="数量" width="120" align="center">
              <template #default="{ row }">
                <el-input-number
                  v-model="row.quantity"
                  :min="1"
                  :precision="0"
                  size="default"
                  class="quantity-input"
                  @change="calculateItemTotal(row)"
                />
              </template>
            </el-table-column>
            <el-table-column label="采购单价" width="140" align="center">
              <template #default="{ row }">
                <el-input
                  v-model="row.purchasePriceDisplay"
                  size="default"
                  class="price-input-with-thousands"
                  @blur="handlePriceBlur(row, 'purchasePrice')"
                  @focus="handlePriceFocus(row, 'purchasePrice')"
                />
              </template>
            </el-table-column>
            <el-table-column label="销售单价" width="140" align="center">
              <template #default="{ row }">
                <el-input
                  v-model="row.unitPriceDisplay"
                  size="default"
                  class="price-input-with-thousands"
                  @blur="handlePriceBlur(row, 'unitPrice')"
                  @focus="handlePriceFocus(row, 'unitPrice')"
                />
              </template>
            </el-table-column>
            <el-table-column label="采购金额" width="100" align="right">
              <template #default="{ row }">
                <span class="purchase-amount">¥{{ formatAmount(row.purchaseTotal) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="销售金额" width="100" align="right">
              <template #default="{ row }">
                <span class="amount">¥{{ formatAmount(row.totalPrice) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="利润" width="90" align="right">
              <template #default="{ row }">
                <span :class="getProfitClass(row.profit)">¥{{ formatAmount(row.profit) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="利润率" width="80" align="right">
              <template #default="{ row }">
                <span :class="getProfitRateClass(row.profitRate)">{{ formatProfitRate(row.profitRate) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="备注" min-width="100">
              <template #default="{ row }">
                <el-input v-model="row.remark" size="small" placeholder="备注" />
              </template>
            </el-table-column>
            <el-table-column label="操作" width="60" align="center" fixed="right">
              <template #default="{ $index }">
                <el-button type="danger" link size="small" @click="handleRemoveItem($index)">
                  <el-icon><Delete /></el-icon>
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <!-- 空状态提示 -->
        <el-empty v-if="form.items.length === 0" description="暂无配件，请点击上方按钮添加" />
      </el-card>

      <!-- 金额汇总卡片 -->
      <el-card class="section-card amount-card" shadow="hover">
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
              <div class="amount-value purchase">¥{{ formatAmount(form.purchaseTotal) }}</div>
            </div>
            <div class="amount-item">
              <div class="amount-label">销售小计</div>
              <div class="amount-value">¥{{ formatAmount(form.subtotal) }}</div>
            </div>
            <div class="amount-item">
              <div class="amount-label">税率</div>
              <div class="amount-control">
                <el-select v-model="form.taxRate" size="small" style="width: 80px" @change="calculateTotal">
                  <el-option label="0%" :value="0" />
                  <el-option label="3%" :value="0.03" />
                  <el-option label="6%" :value="0.06" />
                  <el-option label="9%" :value="0.09" />
                  <el-option label="13%" :value="0.13" />
                </el-select>
              </div>
              <div class="amount-value tax">¥{{ formatAmount(form.taxAmount) }}</div>
            </div>
            <div class="amount-item">
              <div class="amount-label">折扣</div>
              <div class="amount-control">
                <el-input-number
                  v-model="form.discount"
                  :min="0"
                  :precision="2"
                  size="small"
                  style="width: 100px"
                  @change="calculateTotal"
                />
              </div>
              <div class="amount-value discount" v-if="form.discount > 0">-¥{{ formatAmount(form.discount) }}</div>
            </div>
            <div class="amount-item">
              <div class="amount-label">利润合计</div>
              <div :class="['amount-value', getProfitClass(form.profitTotal)]">
                ¥{{ formatAmount(form.profitTotal) }}
                <span class="profit-rate">({{ formatProfitRate(form.profitRate) }})</span>
              </div>
            </div>
            <div class="amount-item grand">
              <div class="amount-label">报价总额</div>
              <div class="amount-value total">¥{{ formatAmount(form.totalAmount) }}</div>
            </div>
          </div>
        </div>
      </el-card>

      <!-- 其他信息卡片 -->
      <el-card class="section-card notes-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <el-icon><Document /></el-icon>
            <span>其他信息</span>
          </div>
        </template>
        <el-form :model="form" label-width="80px">
          <el-form-item label="备注">
            <el-input
              v-model="form.notes"
              type="textarea"
              :rows="2"
              placeholder="请输入备注信息"
            />
          </el-form-item>
          <el-form-item label="条款">
            <el-input
              v-model="form.terms"
              type="textarea"
              :rows="2"
              placeholder="请输入报价条款，如付款方式、交货期等"
            />
          </el-form-item>
        </el-form>
      </el-card>
    </div>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleClose" size="large">取消</el-button>
        <el-button type="primary" @click="handleSave" size="large" plain>
          <el-icon><DocumentChecked /></el-icon>
          保存草稿
        </el-button>
        <el-button type="success" @click="handleSubmit" size="large">
          <el-icon><Check /></el-icon>
          提交审核
        </el-button>
      </span>
    </template>

    <!-- Excel导入对话框 -->
    <ExcelImportDialog
      v-model:visible="importDialogVisible"
      @import="handleExcelImport"
    />
  </el-dialog>
</template>

<script>
import { ref, computed, watch, reactive, onMounted } from 'vue'
import { Plus, Delete, Upload, Download, DocumentAdd, EditPen, Document, Collection, InfoFilled, Box, PriceTag, DocumentChecked, Check } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import ExcelImportDialog from './ExcelImportDialog.vue'

export default {
  name: 'QuotationEditDialog',
  components: {
    Plus,
    Delete,
    Upload,
    Download,
    DocumentAdd,
    EditPen,
    Document,
    Collection,
    InfoFilled,
    Box,
    PriceTag,
    DocumentChecked,
    Check,
    ExcelImportDialog
  },
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    quotation: {
      type: Object,
      default: null
    },
    isEdit: {
      type: Boolean,
      default: false
    }
  },
  emits: ['update:visible', 'save', 'submit'],
  setup(props, { emit }) {
    const formRef = ref(null)
    const importDialogVisible = ref(false)

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
      workorderId: null,
      workorderNo: '',
      customerName: '',
      contactName: '',
      contactPhone: '',
      items: [],
      subtotal: 0,
      taxRate: 0.13,
      taxAmount: 0,
      discount: 0,
      totalAmount: 0,
      purchaseTotal: 0,
      profitTotal: 0,
      profitRate: 0,
      validDays: 30,
      notes: '',
      terms: ''
    })

    // 工单列表（模拟数据）
    const workorderList = ref([
      { id: 'WO001', workorderNo: 'WO20260331001', customerName: '上海某机械有限公司', contactName: '张先生', contactPhone: '13800138000' },
      { id: 'WO002', workorderNo: 'WO20260331002', customerName: '北京某科技有限公司', contactName: '李女士', contactPhone: '13900139000' },
      { id: 'WO003', workorderNo: 'WO20260331003', customerName: '广州某制造厂', contactName: '王先生', contactPhone: '13700137000' }
    ])

    // 表单验证规则
    const rules = {
      workorderId: [
        { required: true, message: '请选择关联工单', trigger: 'change' }
      ],
      customerName: [
        { required: true, message: '请输入客户名称', trigger: 'blur' }
      ],
      contactName: [
        { required: true, message: '请输入联系人姓名', trigger: 'blur' }
      ],
      contactPhone: [
        { required: true, message: '请输入联系电话', trigger: 'blur' },
        { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
      ],
      validDays: [
        { required: true, message: '请输入有效期', trigger: 'blur' }
      ]
    }

    // 对话框可见性
    const dialogVisible = computed({
      get: () => props.visible,
      set: (val) => emit('update:visible', val)
    })

    // 对话框标题
    const dialogTitle = computed(() => {
      if (props.isEdit) {
        return props.quotation ? `编辑报价单 - ${props.quotation.quotationNo}` : '编辑报价单'
      }
      return '新建报价单'
    })

    // 重置表单
    const resetForm = () => {
      Object.assign(form, {
        workorderId: null,
        workorderNo: '',
        customerName: '',
        contactName: '',
        contactPhone: '',
        items: [],
        subtotal: 0,
        taxRate: 0.13,
        taxAmount: 0,
        discount: 0,
        totalAmount: 0,
        purchaseTotal: 0,
        profitTotal: 0,
        profitRate: 0,
        validDays: 30,
        notes: '',
        terms: ''
      })
    }

    // 监听quotation变化，初始化表单数据
    watch(() => props.quotation, (newVal) => {
      if (newVal) {
        Object.assign(form, {
          workorderId: newVal.workorderId || null,
          workorderNo: newVal.workorderNo || '',
          customerName: newVal.customerName || '',
          contactName: newVal.contactName || '',
          contactPhone: newVal.contactPhone || '',
          items: newVal.items ? [...newVal.items.map(item => ({ ...item }))] : [],
          subtotal: newVal.subtotal || 0,
          taxRate: newVal.taxRate || 0.13,
          taxAmount: newVal.taxAmount || 0,
          discount: newVal.discount || 0,
          totalAmount: newVal.totalAmount || 0,
          purchaseTotal: newVal.purchaseTotal || 0,
          profitTotal: newVal.profitTotal || 0,
          profitRate: newVal.profitRate || 0,
          validDays: newVal.validDays || 30,
          notes: newVal.notes || '',
          terms: newVal.terms || ''
        })
      } else {
        resetForm()
      }
    }, { immediate: true })

    // 处理工单选择变化
    const handleWorkorderChange = (workorderId) => {
      if (workorderId) {
        const selectedWorkorder = workorderList.value.find(w => w.id === workorderId)
        if (selectedWorkorder) {
          form.workorderNo = selectedWorkorder.workorderNo
          form.customerName = selectedWorkorder.customerName
          form.contactName = selectedWorkorder.contactName
          form.contactPhone = selectedWorkorder.contactPhone
        }
      } else {
        form.workorderNo = ''
        form.customerName = ''
        form.contactName = ''
        form.contactPhone = ''
      }
    }

    // 格式化金额
    const formatAmount = (amount) => {
      return amount.toLocaleString('zh-CN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })
    }

    // 格式化利润率
    const formatProfitRate = (rate) => {
      if (rate === undefined || rate === null) return '0.00%'
      return (rate * 100).toFixed(2) + '%'
    }

    // 获取利润样式类
    const getProfitClass = (profit) => {
      if (profit > 0) return 'profit-positive'
      if (profit < 0) return 'profit-negative'
      return 'profit-zero'
    }

    // 获取利润率样式类
    const getProfitRateClass = (rate) => {
      if (rate > 0.3) return 'profit-rate-high'
      if (rate > 0.15) return 'profit-rate-normal'
      if (rate > 0) return 'profit-rate-low'
      if (rate < 0) return 'profit-rate-negative'
      return 'profit-rate-zero'
    }

    // 计算单项金额
    const calculateItemTotal = (item) => {
      item.purchaseTotal = (item.quantity || 0) * (item.purchasePrice || 0)
      item.totalPrice = (item.quantity || 0) * (item.unitPrice || 0)
      item.profit = (item.totalPrice || 0) - (item.purchaseTotal || 0)
      item.profitRate = item.purchaseTotal > 0 ? (item.profit / item.purchaseTotal) : 0
      // 更新显示值（带千分位）
      item.purchasePriceDisplay = formatNumberWithThousands(item.purchasePrice)
      item.unitPriceDisplay = formatNumberWithThousands(item.unitPrice)
      calculateTotal()
    }

    // 格式化数字为千分位显示
    const formatNumberWithThousands = (value) => {
      if (value === undefined || value === null || value === '') return '0.00'
      const num = parseFloat(value)
      if (isNaN(num)) return '0.00'
      return num.toLocaleString('zh-CN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })
    }

    // 解析千分位字符串为数字
    const parseNumberFromThousands = (str) => {
      if (!str) return 0
      // 移除所有逗号
      const cleanStr = str.toString().replace(/,/g, '')
      const num = parseFloat(cleanStr)
      return isNaN(num) ? 0 : num
    }

    // 处理价格输入框失焦 - 格式化为千分位
    const handlePriceBlur = (row, field) => {
      const displayField = field === 'purchasePrice' ? 'purchasePriceDisplay' : 'unitPriceDisplay'
      const value = parseNumberFromThousands(row[displayField])
      row[field] = value
      row[displayField] = formatNumberWithThousands(value)
      calculateItemTotal(row)
    }

    // 处理价格输入框聚焦 - 显示原始数字
    const handlePriceFocus = (row, field) => {
      const displayField = field === 'purchasePrice' ? 'purchasePriceDisplay' : 'unitPriceDisplay'
      // 聚焦时显示原始数字，不带千分位，方便编辑
      row[displayField] = row[field] ? row[field].toString() : '0'
    }

    // 计算总计
    const calculateTotal = () => {
      form.subtotal = form.items.reduce((sum, item) => sum + (item.totalPrice || 0), 0)
      form.purchaseTotal = form.items.reduce((sum, item) => sum + (item.purchaseTotal || 0), 0)
      form.profitTotal = form.subtotal - form.purchaseTotal
      form.profitRate = form.purchaseTotal > 0 ? (form.profitTotal / form.purchaseTotal) : 0
      form.taxAmount = form.subtotal * form.taxRate
      form.totalAmount = form.subtotal + form.taxAmount - (form.discount || 0)
    }

    // 添加配件项
    const handleAddItem = () => {
      form.items.push({
        id: Date.now().toString(),
        partNumber: '',
        partName: '',
        specification: '',
        unit: '个',
        quantity: 1,
        purchasePrice: 0,
        unitPrice: 0,
        purchasePriceDisplay: '0.00',
        unitPriceDisplay: '0.00',
        purchaseTotal: 0,
        totalPrice: 0,
        profit: 0,
        profitRate: 0,
        remark: ''
      })
      calculateTotal()
    }

    // 删除配件项
    const handleRemoveItem = (index) => {
      form.items.splice(index, 1)
      calculateTotal()
    }

    // Excel导入
    const handleImportExcel = () => {
      importDialogVisible.value = true
    }

    // 处理Excel导入的数据
    const handleExcelImport = (importedItems) => {
      importedItems.forEach(item => {
        const quantity = parseFloat(item.quantity) || 1
        const purchasePrice = parseFloat(item.purchasePrice) || 0
        const unitPrice = parseFloat(item.unitPrice) || 0
        const purchaseTotal = quantity * purchasePrice
        const totalPrice = quantity * unitPrice
        const profit = totalPrice - purchaseTotal
        form.items.push({
          id: Date.now().toString() + Math.random(),
          partNumber: item.partNumber || '',
          partName: item.partName || '',
          specification: item.specification || '',
          unit: item.unit || '个',
          quantity: quantity,
          purchasePrice: purchasePrice,
          unitPrice: unitPrice,
          purchasePriceDisplay: formatNumberWithThousands(purchasePrice),
          unitPriceDisplay: formatNumberWithThousands(unitPrice),
          purchaseTotal: purchaseTotal,
          totalPrice: totalPrice,
          profit: profit,
          profitRate: purchaseTotal > 0 ? (profit / purchaseTotal) : 0,
          remark: item.remark || ''
        })
      })
      calculateTotal()
      ElMessage.success(`成功导入 ${importedItems.length} 条配件数据`)
    }

    // 下载Excel模板
    const handleDownloadTemplate = () => {
      const templateData = [{
        partNumber: 'P001',
        partName: '零件A',
        specification: '规格A-100',
        unit: '个',
        quantity: 10,
        purchasePrice: 100,
        unitPrice: 150,
        remark: '示例数据，请删除后填写实际数据'
      }]

      const headers = ['配件编码', '配件名称', '规格', '单位', '数量', '采购单价', '销售单价', '备注']
      const rows = templateData.map(item => [
        item.partNumber, item.partName, item.specification, item.unit,
        item.quantity, item.purchasePrice, item.unitPrice, item.remark
      ])

      const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = '报价单配件导入模板.csv'
      link.click()

      ElMessage.success('模板下载成功')
    }

    // 关闭对话框
    const handleClose = () => {
      dialogVisible.value = false
      resetForm()
    }

    // 保存草稿
    const handleSave = async () => {
      const valid = await formRef.value.validate().catch(() => false)
      if (!valid) return

      if (form.items.length === 0) {
        ElMessage.warning('请至少添加一个配件')
        return
      }

      emit('save', { ...form })
    }

    // 提交审核
    const handleSubmit = async () => {
      const valid = await formRef.value.validate().catch(() => false)
      if (!valid) return

      if (form.items.length === 0) {
        ElMessage.warning('请至少添加一个配件')
        return
      }

      const incompleteItems = form.items.filter(item =>
        !item.partNumber || !item.partName || item.quantity <= 0 || item.unitPrice < 0
      )
      if (incompleteItems.length > 0) {
        ElMessage.warning('请完善所有配件的信息（编码、名称、数量、单价）')
        return
      }

      emit('submit', { ...form })
    }

    return {
      formRef,
      form,
      rules,
      dialogVisible,
      isMobile,
      dialogTitle,
      importDialogVisible,
      workorderList,
      formatAmount,
      formatProfitRate,
      getProfitClass,
      getProfitRateClass,
      calculateItemTotal,
      calculateTotal,
      handleAddItem,
      handleRemoveItem,
      handleImportExcel,
      handleExcelImport,
      handleDownloadTemplate,
      handleWorkorderChange,
      handleClose,
      handleSave,
      handleSubmit,
      handlePriceBlur,
      handlePriceFocus,
      formatNumberWithThousands
    }
  }
}
</script>

<style scoped>
/* 全屏弹窗样式优化 */
:deep(.quotation-edit-dialog.is-fullscreen) {
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

.quotation-edit {
  max-height: 650px;
  overflow-y: auto;
  padding: 0 10px;
}

:deep(.quotation-edit-dialog.is-fullscreen) .quotation-edit {
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

.quotation-title {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 12px;
}

.quotation-title .el-icon {
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

.item-count {
  margin-left: 8px;
  font-size: 13px;
  color: #909399;
  font-weight: normal;
}

.header-actions {
  margin-left: auto;
  display: flex;
  gap: 8px;
}

.section-card :deep(.el-card__body) {
  padding: 20px;
}

/* 表单网格布局 */
.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.form-item-full {
  grid-column: span 2;
}

.workorder-tag {
  margin-top: 8px;
}

.unit {
  margin-left: 8px;
  color: #606266;
}

/* 表格包装器 */
.table-wrapper {
  overflow-x: auto;
}

.table-wrapper :deep(.el-table) {
  min-width: 1100px;
}

/* 数量输入框样式优化 */
.quantity-input {
  width: 100px !important;
}

.quantity-input :deep(.el-input__wrapper) {
  padding: 0 8px;
}

.quantity-input :deep(.el-input__inner) {
  font-size: 14px;
  font-weight: 500;
  text-align: center;
}

/* 价格输入框样式优化 */
.price-input {
  width: 110px !important;
}

.price-input :deep(.el-input__wrapper) {
  padding: 0 8px;
}

.price-input :deep(.el-input__inner) {
  font-size: 14px;
  font-weight: 500;
  text-align: right;
}

/* 输入框聚焦状态 */
.quantity-input :deep(.el-input__wrapper.is-focus),
.price-input :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.3);
}

/* 调整表格单元格内边距 */
.table-wrapper :deep(.el-table .cell) {
  padding: 8px 4px;
}

/* 调整输入框按钮大小 */
.quantity-input :deep(.el-input-number__decrease),
.quantity-input :deep(.el-input-number__increase),
.price-input :deep(.el-input-number__decrease),
.price-input :deep(.el-input-number__increase) {
  width: 24px;
  font-size: 14px;
}

/* 带千分位的价格输入框样式 */
.price-input-with-thousands {
  width: 110px !important;
}

.price-input-with-thousands :deep(.el-input__wrapper) {
  padding: 0 8px;
}

.price-input-with-thousands :deep(.el-input__inner) {
  font-size: 14px;
  font-weight: 500;
  text-align: right;
  font-family: 'Courier New', monospace;
}

/* 输入框聚焦状态 */
.price-input-with-thousands :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.3);
}

/* 金额汇总卡片 */
.amount-card :deep(.el-card__header) {
  background-color: #f0f9ff;
  border-bottom: 1px solid #d9ecff;
}

.amount-card .card-header {
  color: #409eff;
}

.amount-summary {
  padding: 8px 0;
}

.amount-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 20px;
}

.amount-item {
  text-align: center;
  padding: 16px 12px;
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

.amount-control {
  margin-bottom: 8px;
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

.amount-value.tax {
  color: #e6a23c;
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

  .quotation-title {
    font-size: 18px;
  }

  .quotation-title .el-icon {
    font-size: 22px;
  }

  .quotation-meta {
    flex-wrap: wrap;
    gap: 8px;
    font-size: 12px;
  }

  .grand-total-display {
    padding: 12px 20px;
    width: 100%;
    text-align: center;
  }

  .grand-total-display .amount {
    font-size: 24px;
  }

  .section-card {
    margin-bottom: 16px;
  }

  .section-card :deep(.el-card__body) {
    padding: 12px;
  }

  .form-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .form-item-full {
    grid-column: span 1;
  }

  .header-actions {
    flex-wrap: wrap;
    justify-content: flex-end;
  }

  .header-actions .el-button {
    padding: 4px 8px;
    font-size: 12px;
  }

  .amount-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }

  .amount-item {
    padding: 12px 8px;
  }

  .amount-value {
    font-size: 14px;
  }

  .amount-value.total {
    font-size: 18px;
  }

  .table-wrapper :deep(.el-table) {
    min-width: 800px;
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
  .quotation-edit {
    padding: 0 8px;
  }

  .header-card {
    padding: 12px 16px;
    border-radius: 8px;
  }

  .quotation-title {
    font-size: 16px;
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
    text-align: left;
  }

  .amount-item.grand {
    flex-direction: column;
    text-align: center;
  }

  .amount-label {
    margin-bottom: 0;
    font-size: 13px;
  }

  .amount-control {
    margin-bottom: 0;
    margin-right: 8px;
  }

  .amount-value {
    font-size: 16px;
  }

  .section-card,
  .amount-card,
  .items-card,
  .notes-card {
    border-radius: 6px;
  }

  .card-header {
    flex-wrap: wrap;
    gap: 6px;
  }

  .header-actions {
    width: 100%;
    justify-content: flex-start;
    margin-top: 8px;
    margin-left: 0;
  }
}

@media (max-width: 375px) {
  .header-card {
    padding: 10px 12px;
  }

  .grand-total-display .amount {
    font-size: 20px;
  }

  .amount-value {
    font-size: 14px;
  }
}
</style>
