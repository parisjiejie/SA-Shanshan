<template>
  <div class="quotation-item-query">
    <el-card shadow="hover" class="mb-4">
      <template #header>
        <div class="card-header">
          <span>报价配件明细查询</span>
          <div class="header-actions">
            <el-button type="success" @click="handleExport" :disabled="!tableData.length">
              <el-icon><Download /></el-icon>
              <span>导出Excel</span>
            </el-button>
          </div>
        </div>
      </template>

      <!-- 快捷搜索栏 -->
      <div class="quick-search-bar">
        <el-input
          v-model="quickSearchKeyword"
          placeholder="搜索客户名称、配件名称或配件型号"
          clearable
          style="width: 300px"
          @keyup.enter="handleQuickSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-button type="primary" @click="handleQuickSearch">
          搜索
        </el-button>
        <el-button link @click="toggleAdvancedSearch">
          <el-icon>
            <ArrowDown v-if="!showAdvancedSearch" />
            <ArrowUp v-else />
          </el-icon>
          {{ showAdvancedSearch ? '收起筛选' : '高级筛选' }}
        </el-button>
      </div>

      <!-- 高级筛选条件 -->
      <el-collapse-transition>
        <div v-show="showAdvancedSearch" class="advanced-search-panel">
          <el-divider />
          <el-form :model="queryForm" inline class="query-form">
            <el-form-item label="客户名称">
              <el-select
                v-model="queryForm.customerName"
                placeholder="选择客户"
                clearable
                filterable
                style="width: 180px"
              >
                <el-option
                  v-for="customer in customerOptions"
                  :key="customer"
                  :label="customer"
                  :value="customer"
                />
              </el-select>
            </el-form-item>

            <el-form-item label="配件名称">
              <el-input
                v-model="queryForm.partName"
                placeholder="输入配件名称"
                clearable
                style="width: 150px"
              />
            </el-form-item>

            <el-form-item label="配件型号">
              <el-input
                v-model="queryForm.specification"
                placeholder="输入型号/规格"
                clearable
                style="width: 150px"
              />
            </el-form-item>

            <el-form-item label="订单状态">
              <el-select
                v-model="queryForm.orderStatus"
                placeholder="选择状态"
                clearable
                style="width: 130px"
              >
                <el-option label="全部" value="" />
                <el-option label="未订单" value="未订单" />
                <el-option label="已订单" value="已订单" />
                <el-option label="部分订单" value="部分订单" />
              </el-select>
            </el-form-item>

            <el-form-item label="报价日期">
              <el-date-picker
                v-model="queryForm.quoteDateRange"
                type="daterange"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                value-format="YYYY-MM-DD"
                style="width: 240px"
              />
            </el-form-item>

            <el-form-item label="订单日期">
              <el-date-picker
                v-model="queryForm.orderDateRange"
                type="daterange"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                value-format="YYYY-MM-DD"
                style="width: 240px"
              />
            </el-form-item>

            <el-form-item>
              <el-button type="primary" @click="handleQuery">
                <el-icon><Search /></el-icon>
                <span>查询</span>
              </el-button>
              <el-button @click="handleReset">
                <el-icon><Refresh /></el-icon>
                <span>重置</span>
              </el-button>
            </el-form-item>
          </el-form>
        </div>
      </el-collapse-transition>

      <!-- 统计信息 -->
      <div class="statistics-bar">
        <el-row :gutter="20">
          <el-col :span="6">
            <div class="stat-item">
              <div class="stat-label">总配件项</div>
              <div class="stat-value">{{ statistics.total }}</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="stat-item">
              <div class="stat-label">未订单</div>
              <div class="stat-value text-warning">{{ statistics.unordered }}</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="stat-item">
              <div class="stat-label">已订单</div>
              <div class="stat-value text-success">{{ statistics.ordered }}</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="stat-item">
              <div class="stat-label">部分订单</div>
              <div class="stat-value text-info">{{ statistics.partial }}</div>
            </div>
          </el-col>
        </el-row>
      </div>

      <!-- 数据表格 -->
      <el-table
        :data="tableData"
        border
        stripe
        style="width: 100%"
        v-loading="loading"
        :header-cell-style="{ background: '#f5f7fa' }"
      >
        <el-table-column type="index" label="序号" width="50" align="center" />
        <el-table-column prop="quotationNo" label="报价单号" width="130" sortable />
        <el-table-column prop="customerName" label="客户名称" min-width="150" sortable />
        <el-table-column prop="partNumber" label="配件编码" width="100" />
        <el-table-column prop="partName" label="配件名称" min-width="120" />
        <el-table-column prop="specification" label="规格型号" width="120" />
        <el-table-column prop="quantity" label="报价数量" width="90" align="right" />
        <el-table-column prop="unitPrice" label="报价单价" width="100" align="right">
          <template #default="{ row }">
            ¥{{ formatAmount(row.unitPrice) }}
          </template>
        </el-table-column>
        <el-table-column prop="orderStatus" label="订单状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag
              :type="getOrderStatusType(row.orderStatus)"
              size="small"
            >
              {{ row.orderStatus }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="orderedQuantity" label="已下单数" width="90" align="right" />
        <el-table-column prop="unorderedQuantity" label="未下单数" width="90" align="right">
          <template #default="{ row }">
            <span :class="{ 'text-danger': row.unorderedQuantity > 0 }">
              {{ row.unorderedQuantity }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="workorderNo" label="关联工单号" width="130" />
        <el-table-column prop="orderDate" label="订单日期" width="120" sortable />
        <el-table-column prop="quoteDate" label="报价日期" width="120" sortable />
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-button
              type="primary"
              link
              size="small"
              @click="handleViewQuotation(row)"
            >
              查看报价
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination mt-4">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 报价单详情对话框 -->
    <QuotationViewDialog
      v-model:visible="viewDialogVisible"
      :quotation="currentQuotation"
    />
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { Download, Search, Refresh, ArrowDown, ArrowUp } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { quotationList } from '../stores/quotationStore.js'
import QuotationViewDialog from '../components/QuotationViewDialog.vue'

export default {
  name: 'QuotationItemQuery',
  components: {
    Download,
    Search,
    Refresh,
    ArrowDown,
    ArrowUp,
    QuotationViewDialog
  },
  setup() {

    // 快捷搜索
    const quickSearchKeyword = ref('')
    const showAdvancedSearch = ref(false)

    // 查询表单
    const queryForm = reactive({
      customerName: '',
      partName: '',
      specification: '',
      orderStatus: '',
      quoteDateRange: [],
      orderDateRange: []
    })

    // 表格数据
    const tableData = ref([])
    const loading = ref(false)
    const currentPage = ref(1)
    const pageSize = ref(20)
    const total = ref(0)

    // 报价单详情对话框
    const viewDialogVisible = ref(false)
    const currentQuotation = ref(null)

    // 客户选项（从报价单中提取）
    const customerOptions = computed(() => {
      const customers = new Set()
      quotationList.value.forEach(q => {
        if (q.customerName) {
          customers.add(q.customerName)
        }
      })
      return Array.from(customers).sort()
    })

    // 统计数据
    const statistics = computed(() => {
      const stats = {
        total: tableData.value.length,
        unordered: 0,
        ordered: 0,
        partial: 0
      }
      tableData.value.forEach(item => {
        if (item.orderStatus === '未订单') {
          stats.unordered++
        } else if (item.orderStatus === '已订单') {
          stats.ordered++
        } else if (item.orderStatus === '部分订单') {
          stats.partial++
        }
      })
      return stats
    })

    // 格式化金额
    const formatAmount = (amount) => {
      if (amount === undefined || amount === null) return '0.00'
      return amount.toLocaleString('zh-CN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })
    }

    // 获取订单状态标签类型
    const getOrderStatusType = (status) => {
      const types = {
        '未订单': 'info',
        '已订单': 'success',
        '部分订单': 'warning'
      }
      return types[status] || 'info'
    }

    // 构建查询数据
    const buildQueryData = () => {
      const data = []

      quotationList.value.forEach(quotation => {
        if (!quotation.items || !quotation.items.length) return

        quotation.items.forEach(item => {
          // 计算订单状态
          const quotedQty = item.quantity || 0
          const orderedQty = item.orderedQuantity || 0
          let orderStatus = '未订单'
          if (orderedQty >= quotedQty && quotedQty > 0) {
            orderStatus = '已订单'
          } else if (orderedQty > 0 && orderedQty < quotedQty) {
            orderStatus = '部分订单'
          }

          data.push({
            quotationId: quotation.id,
            quotationNo: quotation.quotationNo,
            customerId: quotation.customerId,
            customerName: quotation.customerName,
            partId: item.id,
            partNumber: item.partNumber,
            partName: item.partName,
            specification: item.specification,
            unit: item.unit,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
            orderStatus: orderStatus,
            orderedQuantity: orderedQty,
            unorderedQuantity: quotedQty - orderedQty,
            workorderId: item.workorderId || null,
            workorderNo: item.workorderNo || null,
            orderDate: item.orderDate || null,
            quoteDate: quotation.createdAt ? quotation.createdAt.split('T')[0] : null
          })
        })
      })

      return data
    }

    // 切换高级搜索显示
    const toggleAdvancedSearch = () => {
      showAdvancedSearch.value = !showAdvancedSearch.value
    }

    // 快捷搜索
    const handleQuickSearch = () => {
      loading.value = true

      try {
        let data = buildQueryData()
        const keyword = quickSearchKeyword.value.trim().toLowerCase()

        if (keyword) {
          data = data.filter(item =>
            (item.customerName && item.customerName.toLowerCase().includes(keyword)) ||
            (item.partName && item.partName.toLowerCase().includes(keyword)) ||
            (item.specification && item.specification.toLowerCase().includes(keyword))
          )
        }

        tableData.value = data
        total.value = data.length

        if (data.length === 0) {
          ElMessage.info('未找到符合条件的数据')
        } else {
          ElMessage.success(`查询完成，共找到 ${data.length} 条记录`)
        }
      } catch (error) {
        console.error('查询失败:', error)
        ElMessage.error('查询失败')
      } finally {
        loading.value = false
      }
    }

    // 执行查询
    const handleQuery = () => {
      loading.value = true

      try {
        let data = buildQueryData()

        // 客户名称筛选
        if (queryForm.customerName) {
          data = data.filter(item =>
            item.customerName === queryForm.customerName
          )
        }

        // 配件名称筛选
        if (queryForm.partName) {
          data = data.filter(item =>
            item.partName.toLowerCase().includes(queryForm.partName.toLowerCase())
          )
        }

        // 配件型号筛选
        if (queryForm.specification) {
          data = data.filter(item =>
            item.specification.toLowerCase().includes(queryForm.specification.toLowerCase())
          )
        }

        // 订单状态筛选
        if (queryForm.orderStatus) {
          data = data.filter(item => item.orderStatus === queryForm.orderStatus)
        }

        // 报价日期范围筛选
        if (queryForm.quoteDateRange && queryForm.quoteDateRange.length === 2) {
          const startDate = queryForm.quoteDateRange[0]
          const endDate = queryForm.quoteDateRange[1]
          data = data.filter(item => {
            if (!item.quoteDate) return false
            return item.quoteDate >= startDate && item.quoteDate <= endDate
          })
        }

        // 订单日期范围筛选
        if (queryForm.orderDateRange && queryForm.orderDateRange.length === 2) {
          const startDate = queryForm.orderDateRange[0]
          const endDate = queryForm.orderDateRange[1]
          data = data.filter(item => {
            if (!item.orderDate) return false
            return item.orderDate >= startDate && item.orderDate <= endDate
          })
        }

        tableData.value = data
        total.value = data.length

        if (data.length === 0) {
          ElMessage.info('未找到符合条件的数据')
        } else {
          ElMessage.success(`查询完成，共找到 ${data.length} 条记录`)
        }
      } catch (error) {
        console.error('查询失败:', error)
        ElMessage.error('查询失败')
      } finally {
        loading.value = false
      }
    }

    // 重置查询
    const handleReset = () => {
      quickSearchKeyword.value = ''
      queryForm.customerName = ''
      queryForm.partName = ''
      queryForm.specification = ''
      queryForm.orderStatus = ''
      queryForm.quoteDateRange = []
      queryForm.orderDateRange = []
      handleQuery()
    }

    // 导出Excel
    const handleExport = () => {
      if (!tableData.value.length) {
        ElMessage.warning('没有可导出的数据')
        return
      }

      // 构建导出数据
      const exportData = tableData.value.map(item => ({
        '报价单号': item.quotationNo,
        '客户名称': item.customerName,
        '配件编码': item.partNumber,
        '配件名称': item.partName,
        '规格型号': item.specification,
        '报价数量': item.quantity,
        '报价单价': item.unitPrice,
        '订单状态': item.orderStatus,
        '已下单数量': item.orderedQuantity,
        '未下单数量': item.unorderedQuantity,
        '关联工单号': item.workorderNo || '-',
        '订单日期': item.orderDate || '-',
        '报价日期': item.quoteDate || '-'
      }))

      // 转换为CSV
      const headers = Object.keys(exportData[0])
      const csvContent = [
        headers.join(','),
        ...exportData.map(row =>
          headers.map(header => {
            const value = row[header]
            // 处理包含逗号的值
            if (typeof value === 'string' && value.includes(',')) {
              return `"${value}"`
            }
            return value
          }).join(',')
        )
      ].join('\n')

      // 添加BOM以支持中文
      const BOM = '\uFEFF'
      const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' })

      // 下载文件
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `报价配件明细_${new Date().toISOString().split('T')[0]}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      ElMessage.success('导出成功')
    }

    // 查看报价单 - 在当前页面弹框显示
    const handleViewQuotation = (row) => {
      const quotation = quotationList.value.find(q => q.id === row.quotationId)
      if (quotation) {
        currentQuotation.value = quotation
        viewDialogVisible.value = true
      } else {
        ElMessage.error('报价单不存在')
      }
    }

    // 分页处理
    const handleSizeChange = (val) => {
      pageSize.value = val
      handleQuery()
    }

    const handleCurrentChange = (val) => {
      currentPage.value = val
    }

    // 监听报价单更新事件，实时刷新列表
    const handleQuotationUpdated = () => {
      handleQuery()
    }

    // 组件挂载时自动查询
    onMounted(() => {
      handleQuery()
      window.addEventListener('quotation-updated', handleQuotationUpdated)
    })

    // 组件卸载时移除事件监听
    onUnmounted(() => {
      window.removeEventListener('quotation-updated', handleQuotationUpdated)
    })

    return {
      queryForm,
      quickSearchKeyword,
      showAdvancedSearch,
      tableData,
      loading,
      currentPage,
      pageSize,
      total,
      customerOptions,
      statistics,
      viewDialogVisible,
      currentQuotation,
      formatAmount,
      getOrderStatusType,
      toggleAdvancedSearch,
      handleQuickSearch,
      handleQuery,
      handleReset,
      handleExport,
      handleViewQuotation,
      handleSizeChange,
      handleCurrentChange
    }
  }
}
</script>

<style scoped>
.quotation-item-query {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.query-form {
  margin-bottom: 20px;
}

.quick-search-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.advanced-search-panel {
  margin-top: 10px;
}

.statistics-bar {
  margin-bottom: 20px;
  padding: 15px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.stat-item {
  text-align: center;
}

.stat-label {
  font-size: 14px;
  color: #606266;
  margin-bottom: 5px;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
}

.text-success {
  color: #67c23a;
}

.text-warning {
  color: #e6a23c;
}

.text-info {
  color: #409eff;
}

.text-danger {
  color: #f56c6c;
}

.pagination {
  display: flex;
  justify-content: flex-end;
}

:deep(.el-table .cell) {
  white-space: nowrap;
}

/* ==================== 移动端适配 ==================== */

/* 竖屏手机适配 (portrait) */
@media (max-width: 768px) and (orientation: portrait) {
  .quotation-item-query {
    padding: 10px;
  }
  
  /* 卡片头部适配 */
  .card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .header-actions {
    width: 100%;
  }
  
  .header-actions .el-button {
    width: 100%;
    justify-content: center;
  }
  
  /* 快捷搜索栏适配 */
  .quick-search-bar {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
  }
  
  .quick-search-bar .el-input {
    width: 100% !important;
  }
  
  .quick-search-bar .el-button {
    width: 100%;
  }
  
  /* 高级搜索面板 */
  .advanced-search-panel {
    margin-top: 10px;
  }
  
  .query-form {
    margin-bottom: 0;
  }
  
  .query-form .el-form-item {
    width: 100%;
    margin-right: 0;
    margin-bottom: 10px;
  }
  
  .query-form .el-form-item__content {
    width: 100%;
  }
  
  .query-form .el-input,
  .query-form .el-select,
  .query-form .el-date-picker {
    width: 100% !important;
  }
  
  /* 统计栏适配 */
  .statistics-bar {
    padding: 10px;
    margin-bottom: 15px;
  }
  
  .statistics-bar :deep(.el-row) {
    display: flex;
    flex-wrap: wrap;
  }
  
  .statistics-bar :deep(.el-col) {
    width: 50%;
    flex: 0 0 50%;
    max-width: 50%;
    margin-bottom: 10px;
  }
  
  .stat-label {
    font-size: 12px;
  }
  
  .stat-value {
    font-size: 18px;
  }
  
  /* 表格横向滚动 */
  .quotation-item-query :deep(.el-table) {
    font-size: 12px;
    width: 100%;
  }
  
  .quotation-item-query :deep(.el-table__body-wrapper) {
    overflow-x: auto;
  }
  
  .quotation-item-query :deep(.el-table th),
  .quotation-item-query :deep(.el-table td) {
    padding: 6px 4px;
  }
  
  /* 分页居中 */
  .pagination {
    justify-content: center;
  }
  
  /* 详情对话框全屏 */
  .quotation-item-query :deep(.el-dialog) {
    width: 100% !important;
    margin: 0 !important;
    height: 100vh;
    max-height: 100vh;
    border-radius: 0;
    display: flex;
    flex-direction: column;
  }
  
  .quotation-item-query :deep(.el-dialog__header) {
    padding: 12px 15px;
    flex-shrink: 0;
    border-bottom: 1px solid #e4e7ed;
  }
  
  .quotation-item-query :deep(.el-dialog__body) {
    flex: 1;
    overflow-y: auto;
    padding: 10px;
    -webkit-overflow-scrolling: touch;
    max-height: calc(100vh - 55px);
  }
}

/* 横屏手机适配 (landscape) */
@media (max-width: 896px) and (orientation: landscape) {
  .quotation-item-query :deep(.el-dialog) {
    width: 100% !important;
    margin: 0 !important;
    height: 100vh;
    max-height: 100vh;
    border-radius: 0;
  }
  
  .quotation-item-query :deep(.el-dialog__body) {
    padding: 15px;
    max-height: calc(100vh - 55px);
    overflow-y: auto;
  }
  
  .statistics-bar :deep(.el-col) {
    width: 25%;
    flex: 0 0 25%;
    max-width: 25%;
  }
}

/* 小屏幕手机竖屏适配 */
@media (max-width: 480px) and (orientation: portrait) {
  .quotation-item-query {
    padding: 8px;
  }
  
  .statistics-bar :deep(.el-col) {
    width: 50%;
    flex: 0 0 50%;
    max-width: 50%;
    margin-bottom: 8px;
  }
  
  .stat-value {
    font-size: 16px;
  }
  
  .quotation-item-query :deep(.el-table) {
    font-size: 11px;
  }
  
  .quotation-item-query :deep(.el-table th),
  .quotation-item-query :deep(.el-table td) {
    padding: 4px 3px;
  }
}

/* 超小屏幕适配 */
@media (max-width: 360px) and (orientation: portrait) {
  .stat-value {
    font-size: 14px;
  }
  
  .stat-label {
    font-size: 11px;
  }
}
</style>
