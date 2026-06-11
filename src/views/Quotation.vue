<template>
  <div class="quotation">
    <el-card shadow="hover" class="mb-4">
      <template #header>
        <div class="card-header">
          <span>配件报价单管理</span>
          <el-button type="primary" @click="handleCreateQuotation">
            <el-icon><Plus /></el-icon>
            <span>新建报价单</span>
          </el-button>
        </div>
      </template>

      <!-- 搜索栏 -->
      <div class="search-bar">
        <el-input
          v-model="searchQuery"
          placeholder="搜索报价单号或客户名称"
          style="width: 250px; margin-right: 10px"
          clearable
        />
        <el-select
          v-model="statusFilter"
          placeholder="报价单状态"
          style="width: 150px; margin-right: 10px"
          clearable
        >
          <el-option label="草稿" value="draft" />
          <el-option label="待审核" value="pending" />
          <el-option label="审核中" value="reviewing" />
          <el-option label="已通过" value="approved" />
          <el-option label="已驳回" value="rejected" />
          <el-option label="已发送" value="sent" />
          <el-option label="已确认" value="confirmed" />
        </el-select>
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          style="margin-right: 10px"
        />
        <el-button type="primary" @click="handleSearch">搜索</el-button>
        <el-button @click="handleReset">重置</el-button>
      </div>

      <!-- 报价单列表 -->
      <ConfigurableTable
        :data="filteredQuotations"
        :columns="tableColumns"
        storage-key="quotation"
        :show-operation="true"
        operation-width="auto"
        @sort-change="handleSortChange"
        class="mt-4"
      >
        <template #status="{ row }">
          <el-tag :type="getStatusType(row.status)">
            {{ getStatusText(row.status) }}
          </el-tag>
        </template>
        <template #totalAmount="{ row }">
          <span class="amount">¥{{ formatAmount(row.totalAmount) }}</span>
        </template>
        <template #validity="{ row }">
          <el-tag :type="getValidityStatus(row).type" size="small">
            {{ getValidityStatus(row).text }}
          </el-tag>
        </template>
        <template #workorderNo="{ row }">
          <el-link v-if="row.workorderNo" type="primary" @click="handleViewWorkorder(row.workorderId)">
            {{ row.workorderNo }}
          </el-link>
          <span v-else>-</span>
        </template>
        <template #operation="{ row }">
          <el-button type="primary" size="small" @click="handleView(row)">
            查看
          </el-button>
          <el-button 
            v-if="canEdit(row)"
            type="success" 
            size="small" 
            @click="handleEdit(row)"
          >
            编辑
          </el-button>
          <el-button 
            v-if="canSubmit(row)"
            type="warning" 
            size="small" 
            @click="handleSubmit(row)"
          >
            提交审核
          </el-button>
          <el-button 
            v-if="canApprove(row)"
            type="primary" 
            size="small" 
            @click="handleApprove(row)"
          >
            审核
          </el-button>
          <el-button 
            v-if="canSend(row)"
            type="success" 
            size="small" 
            @click="handleSend(row)"
          >
            发送客户
          </el-button>
          <el-button 
            v-if="canCreateVersion(row)"
            type="info" 
            size="small" 
            @click="handleCreateVersion(row)"
          >
            新版本
          </el-button>
        </template>
      </ConfigurableTable>

      <!-- 分页 -->
      <div class="pagination mt-4">
        <el-pagination
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
          :current-page="currentPage"
          :page-sizes="[10, 20, 50, 100]"
          :page-size="pageSize"
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
        />
      </div>
    </el-card>

    <!-- 报价单编辑/创建对话框 -->
    <QuotationEditDialog
      v-model:visible="editDialogVisible"
      :quotation="currentQuotation"
      :is-edit="isEdit"
      @save="handleSaveQuotation"
      @submit="handleSubmitQuotation"
    />

    <!-- 报价单查看对话框 -->
    <QuotationViewDialog
      v-model:visible="viewDialogVisible"
      :quotation="currentQuotation"
      @edit="handleEditFromView"
      @submit="handleSubmitFromView"
      @approve="handleApproveFromView"
      @send="handleSendFromView"
      @switch-version="handleSwitchVersionFromView"
      @upload="handleUploadFromView"
      @create-version="handleCreateVersionFromView"
      @convert-to-order="handleConvertToOrderFromView"
      @view-workorder="handleViewWorkorderFromView"
    />

    <!-- 审核对话框 -->
    <QuotationApproveDialog
      v-model:visible="approveDialogVisible"
      :quotation="currentQuotation"
      @approve="handleApproveConfirm"
      @reject="handleRejectConfirm"
    />
  </div>
</template>

<script>
import { ref, computed, reactive, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { Plus } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import ConfigurableTable from '../components/ConfigurableTable.vue'
import QuotationEditDialog from '../components/QuotationEditDialog.vue'
import QuotationViewDialog from '../components/QuotationViewDialog.vue'
import QuotationApproveDialog from '../components/QuotationApproveDialog.vue'
import {
  state,
  quotationList,
  createQuotation,
  updateQuotation,
  submitForApproval,
  approveQuotation,
  sendQuotation,
  createNewVersion,
  uploadCustomerPDF,
  QuotationStatus,
  setCurrentQuotation,
  getQuotationVersions,
  convertToWorkorderData,
  saveQuotations
} from '../stores/quotationStore.js'
import {
  checkAndUpdateExpiredQuotations,
  getValidityStatus,
  formatValidityPeriod
} from '../utils/quotationUtils.js'

export default {
  name: 'Quotation',
  components: {
    Plus,
    ConfigurableTable,
    QuotationEditDialog,
    QuotationViewDialog,
    QuotationApproveDialog
  },
  setup() {
    const route = useRoute()

    // 搜索和筛选
    const searchQuery = ref('')
    const statusFilter = ref('')
    const dateRange = ref([])
    const currentPage = ref(1)
    const pageSize = ref(10)
    const total = computed(() => filteredQuotations.value.length)

    // 对话框控制
    const editDialogVisible = ref(false)
    const viewDialogVisible = ref(false)
    const approveDialogVisible = ref(false)
    const isEdit = ref(false)
    const currentQuotation = ref(null)

    // 表格列配置
    // 报价单表格列配置 - 优化宽度适配
    const tableColumns = [
      { prop: 'quotationNo', label: '报价单号', width: 150, sortable: true },
      { prop: 'customerName', label: '客户名称', minWidth: 160, sortable: true },
      { prop: 'contactName', label: '联系人', width: 100 },
      { prop: 'totalAmount', label: '总金额', width: 120, sortable: true, slot: true },
      { prop: 'status', label: '状态', width: 100, sortable: true, slot: true },
      { prop: 'validity', label: '有效期', width: 120, slot: true },
      { prop: 'workorderNo', label: '关联工单', width: 150, slot: true },
      { prop: 'version', label: '版本', width: 85 },
      { prop: 'createdBy', label: '创建人', width: 100 },
      { prop: 'createdAt', label: '创建时间', width: 170, sortable: true }
    ]

    // 筛选后的报价单列表
    const filteredQuotations = computed(() => {
      let result = [...quotationList.value]

      // 搜索关键词
      if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase()
        result = result.filter(q =>
          q.quotationNo.toLowerCase().includes(query) ||
          q.customerName.toLowerCase().includes(query)
        )
      }

      // 状态筛选
      if (statusFilter.value) {
        result = result.filter(q => q.status === statusFilter.value)
      }

      // 日期范围
      if (dateRange.value && dateRange.value.length === 2) {
        result = result.filter(q => {
          const createdAt = new Date(q.createdAt)
          return createdAt >= dateRange.value[0] && createdAt <= dateRange.value[1]
        })
      }

      return result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
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
      return amount.toLocaleString('zh-CN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })
    }

    // 页面加载时检查过期报价单
    const checkExpiredQuotations = () => {
      const expiredIds = checkAndUpdateExpiredQuotations(quotationList.value)
      if (expiredIds.length > 0) {
        ElMessage.warning(`已自动标记 ${expiredIds.length} 个过期报价单`)
      }
    }

    // 组件挂载时检查过期和处理URL参数
    onMounted(() => {
      checkExpiredQuotations()

      // 处理从工单页面跳转过来的编辑请求
      if (route.query.edit === 'true' && route.query.quotationId) {
        const quotation = quotationList.value.find(q => q.id === route.query.quotationId)
        if (quotation) {
          isEdit.value = true
          currentQuotation.value = { ...quotation }
          setCurrentQuotation(quotation)
          editDialogVisible.value = true
        } else {
          ElMessage.error('报价单不存在')
        }
      }

      // 处理从工单页面跳转过来的新建报价单请求
      if (route.query.fromWorkorder === 'true' && route.query.workorderId) {
        // 预填充工单信息
        const workorderInfo = {
          workorderId: route.query.workorderId,
          workorderNo: route.query.workorderNo || route.query.workorderId,
          customerName: route.query.customerName || ''
        }
        
        isEdit.value = false
        // 创建带有工单关联信息的报价单初始数据
        currentQuotation.value = {
          ...workorderInfo,
          // 预填充客户名称
          customerName: workorderInfo.customerName
        }
        setCurrentQuotation(currentQuotation.value)
        editDialogVisible.value = true
        
        ElMessage.success('已自动关联工单信息')
      }
    })

    // 权限判断
    const canEdit = (row) => {
      return row.status === QuotationStatus.DRAFT ||
             row.status === QuotationStatus.REJECTED
    }

    const canSubmit = (row) => {
      return row.status === QuotationStatus.DRAFT ||
             row.status === QuotationStatus.REJECTED
    }

    const canApprove = (row) => {
      return row.status === QuotationStatus.PENDING ||
             row.status === QuotationStatus.REVIEWING
    }

    const canSend = (row) => {
      return row.status === QuotationStatus.APPROVED
    }

    const canCreateVersion = (row) => {
      return row.status === QuotationStatus.SENT ||
             row.status === QuotationStatus.CONFIRMED ||
             row.status === QuotationStatus.EXPIRED
    }

    // 操作方法
    const handleCreateQuotation = () => {
      isEdit.value = false
      currentQuotation.value = null
      setCurrentQuotation(null)
      editDialogVisible.value = true
    }

    const handleEdit = (row) => {
      isEdit.value = true
      currentQuotation.value = { ...row }
      setCurrentQuotation(row)
      editDialogVisible.value = true
    }

    const handleView = (row) => {
      currentQuotation.value = { ...row }
      setCurrentQuotation(row)
      viewDialogVisible.value = true
    }

    const handleSubmit = (row) => {
      ElMessageBox.confirm(
        '确定要提交此报价单进行审核吗？',
        '确认提交',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      ).then(() => {
        try {
          submitForApproval(row.id)
          ElMessage.success('报价单已提交审核')
        } catch (error) {
          ElMessage.error(error.message)
        }
      })
    }

    const handleApprove = (row) => {
      currentQuotation.value = { ...row }
      setCurrentQuotation(row)
      approveDialogVisible.value = true
    }

    const handleSend = (row) => {
      ElMessageBox.confirm(
        '确定要将此报价单发送给客户吗？',
        '确认发送',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      ).then(() => {
        try {
          sendQuotation(row.id)
          ElMessage.success('报价单已发送给客户')
        } catch (error) {
          ElMessage.error(error.message)
        }
      })
    }

    const handleViewWorkorder = (workorderId) => {
      if (workorderId) {
        // 可以跳转到工单详情页
        // router.push(`/workorder?id=${workorderId}`)
        ElMessage.info(`查看工单: ${workorderId}`)
      }
    }

    const handleCreateVersion = (row) => {
      ElMessageBox.confirm(
        '确定要基于此报价单创建新版本吗？',
        '确认创建新版本',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      ).then(() => {
        const newVersion = createNewVersion(row.id)
        if (newVersion) {
          ElMessage.success(`新版本 ${newVersion.quotationNo} 已创建`)
          // 打开编辑对话框
          isEdit.value = true
          currentQuotation.value = { ...newVersion }
          setCurrentQuotation(newVersion)
          editDialogVisible.value = true
        }
      })
    }

    // 对话框回调
    const handleSaveQuotation = (data) => {
      try {
        if (isEdit.value && currentQuotation.value) {
          updateQuotation(currentQuotation.value.id, data)
          ElMessage.success('报价单已保存')
        } else {
          const newQuotation = createQuotation(data)
          ElMessage.success(`报价单 ${newQuotation.quotationNo} 已创建`)
        }
        editDialogVisible.value = false
      } catch (error) {
        ElMessage.error(error.message)
      }
    }

    const handleSubmitQuotation = (data) => {
      try {
        let quotationId
        if (isEdit.value && currentQuotation.value) {
          updateQuotation(currentQuotation.value.id, data)
          quotationId = currentQuotation.value.id
        } else {
          const newQuotation = createQuotation(data)
          quotationId = newQuotation.id
        }
        submitForApproval(quotationId)
        ElMessage.success('报价单已提交审核')
        editDialogVisible.value = false
      } catch (error) {
        ElMessage.error(error.message)
      }
    }

    const handleEditFromView = () => {
      viewDialogVisible.value = false
      isEdit.value = true
      editDialogVisible.value = true
    }

    const handleSubmitFromView = () => {
      handleSubmit(currentQuotation.value)
    }

    const handleApproveFromView = () => {
      viewDialogVisible.value = false
      approveDialogVisible.value = true
    }

    const handleSendFromView = (sendData) => {
      try {
        sendQuotation(currentQuotation.value.id, sendData)

        // 添加客户通知
        try {
          const customerNotifications = JSON.parse(localStorage.getItem('customerNotifications') || '[]')
          customerNotifications.push({
            id: 'CNOTIFY_' + Date.now(),
            type: 'quotation_received',
            title: '新报价单待确认',
            message: `您有一份新的报价单 ${currentQuotation.value.quotationNo} 需要确认，请查看`,
            quotationId: currentQuotation.value.id,
            quotationNo: currentQuotation.value.quotationNo,
            customerId: currentQuotation.value.customerId,
            customerName: currentQuotation.value.customerName,
            createTime: new Date().toISOString(),
            isRead: false
          })
          localStorage.setItem('customerNotifications', JSON.stringify(customerNotifications))

          // 触发客户通知更新事件
          window.dispatchEvent(new CustomEvent('customer-notification-updated', {
            detail: { type: 'quotation_received', quotationId: currentQuotation.value.id }
          }))
        } catch (e) {
          console.error('添加客户通知失败:', e)
        }

        ElMessage.success('报价单已发送给客户')
        viewDialogVisible.value = false
      } catch (error) {
        ElMessage.error(error.message)
      }
    }

    const handleUploadFromView = (uploadData) => {
      try {
        uploadCustomerPDF(currentQuotation.value.id, uploadData)
        ElMessage.success('客户回传PDF上传成功')
        viewDialogVisible.value = false
      } catch (error) {
        ElMessage.error(error.message)
      }
    }

    const handleSwitchVersionFromView = (version) => {
      // 切换到指定版本
      currentQuotation.value = version
      ElMessage.success(`已切换到 V${version.version}`)
    }

    const handleConvertToOrderFromView = (orderData) => {
      // 使用选择的配件数据创建工单
      if (orderData) {
        // 构建工单数据
        const workorderData = {
          workorderNo: generateWorkorderNo(),
          type: '配件销售',
          customerId: orderData.customerId,
          customerName: orderData.customerName,
          contactName: orderData.contactName,
          contactPhone: orderData.contactPhone,
          sourceQuotationId: orderData.quotationId,
          sourceQuotationNo: orderData.quotationNo,
          items: orderData.items.map(item => ({
            partNumber: item.partNumber,
            partName: item.partName,
            specification: item.specification,
            unit: item.unit,
            quantity: item.quantity,
            costPrice: item.purchasePrice,
            salePrice: item.unitPrice,
            costAmount: item.purchaseTotal,
            saleAmount: item.totalPrice,
            profitMargin: item.purchaseTotal > 0 ? ((item.totalPrice - item.purchaseTotal) / item.purchaseTotal * 100).toFixed(2) : 0,
            remark: item.remark
          })),
          totalCostAmount: orderData.items.reduce((sum, item) => sum + item.purchaseTotal, 0),
          totalSaleAmount: orderData.totalAmount,
          totalProfitMargin: 0,
          status: '待派单',
          createdAt: new Date().toISOString()
        }

        // 计算总利润率
        if (workorderData.totalSaleAmount > 0) {
          workorderData.totalProfitMargin = ((workorderData.totalSaleAmount - workorderData.totalCostAmount) / workorderData.totalSaleAmount * 100).toFixed(2)
        }

        // 这里可以调用工单store的创建方法
        // 例如：createWorkorder(workorderData)
        console.log('创建工单数据:', workorderData)

        // 更新报价单配件的已订单数量
        try {
          const quotation = state.quotations.find(q => q.id === orderData.quotationId)
          if (quotation && quotation.items) {
            orderData.items.forEach(orderItem => {
              const quotationItem = quotation.items.find(item => item.id === orderItem.id)
              if (quotationItem) {
                // 累加已订单数量
                quotationItem.orderedQuantity = (quotationItem.orderedQuantity || 0) + orderItem.quantity
                // 添加订单日期
                quotationItem.orderDate = new Date().toISOString().split('T')[0]
              }
            })
            // 保存更新后的报价单
            saveQuotations()
            // 触发更新事件
            window.dispatchEvent(new CustomEvent('quotation-updated'))
          }
        } catch (e) {
          console.error('更新报价单配件订单数量失败:', e)
        }

        ElMessage.success(`已成功创建配件销售工单，包含 ${orderData.items.length} 项配件`)
        viewDialogVisible.value = false

        // 可以跳转到工单页面
        // router.push('/workorder')
      }
    }

    // 生成工单编号
    const generateWorkorderNo = () => {
      const date = new Date()
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const random = String(Math.floor(Math.random() * 1000)).padStart(3, '0')
      return `WO${year}${month}${day}${random}`
    }

    const handleViewWorkorderFromView = (workorderId) => {
      // 跳转到工单详情页
      viewDialogVisible.value = false
      // 使用 router 跳转到工单页面
      // router.push(`/workorder?id=${workorderId}`)
      ElMessage.info(`查看工单: ${workorderId}`)
    }

    const handleCreateVersionFromView = () => {
      handleCreateVersion(currentQuotation.value)
    }

    const handleApproveConfirm = (data) => {
      try {
        approveQuotation(currentQuotation.value.id, {
          ...data,
          action: 'approve'
        })
        ElMessage.success('报价单已审核通过')
        approveDialogVisible.value = false
      } catch (error) {
        ElMessage.error(error.message)
      }
    }

    const handleRejectConfirm = (data) => {
      try {
        approveQuotation(currentQuotation.value.id, {
          ...data,
          action: 'reject'
        })
        ElMessage.success('报价单已驳回')
        approveDialogVisible.value = false
      } catch (error) {
        ElMessage.error(error.message)
      }
    }

    // 搜索和分页
    const handleSearch = () => {
      currentPage.value = 1
    }

    const handleReset = () => {
      searchQuery.value = ''
      statusFilter.value = ''
      dateRange.value = []
      currentPage.value = 1
    }

    const handleSizeChange = (size) => {
      pageSize.value = size
    }

    const handleCurrentChange = (current) => {
      currentPage.value = current
    }

    const handleSortChange = ({ prop, order }) => {
      console.log('排序', prop, order)
    }

    return {
      searchQuery,
      statusFilter,
      dateRange,
      currentPage,
      pageSize,
      total,
      filteredQuotations,
      tableColumns,
      editDialogVisible,
      viewDialogVisible,
      approveDialogVisible,
      isEdit,
      currentQuotation,
      getStatusType,
      getStatusText,
      formatAmount,
      getValidityStatus,
      canEdit,
      canSubmit,
      canApprove,
      canSend,
      canCreateVersion,
      handleCreateQuotation,
      handleEdit,
      handleView,
      handleSubmit,
      handleApprove,
      handleSend,
      handleCreateVersion,
      handleSaveQuotation,
      handleSubmitQuotation,
      handleEditFromView,
      handleSubmitFromView,
      handleApproveFromView,
      handleSendFromView,
      handleUploadFromView,
      handleSwitchVersionFromView,
      handleConvertToOrderFromView,
      handleViewWorkorderFromView,
      handleCreateVersionFromView,
      handleApproveConfirm,
      handleRejectConfirm,
      handleSearch,
      handleReset,
      handleSizeChange,
      handleCurrentChange,
      handleSortChange
    }
  }
}
</script>

<style scoped>
.quotation {
  padding: 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.search-bar {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 10px;
}

.amount {
  color: #f56c6c;
  font-weight: bold;
}

.pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}

.mt-4 {
  margin-top: 20px;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .search-bar {
    flex-direction: column;
    align-items: stretch;
  }

  .search-bar .el-input,
  .search-bar .el-select,
  .search-bar .el-date-picker {
    width: 100% !important;
    margin-right: 0 !important;
  }

  .pagination {
    justify-content: center;
  }
}
</style>
