<template>
  <div class="parts">
    <el-card shadow="hover" class="mb-4">
      <template #header>
        <div class="card-header">
          <span>配件管理</span>
          <el-button type="primary" @click="handleAddPart">
            <el-icon><Plus /></el-icon>
            <span>新增配件</span>
          </el-button>
        </div>
      </template>
      <el-tabs>
        <el-tab-pane label="配件库存">
          <div class="search-bar">
            <el-input
              v-model="searchQuery"
              placeholder="搜索配件编码或名称"
              prefix-icon="el-icon-search"
              style="width: 300px; margin-right: 10px"
            />
            <el-button type="primary" @click="handleSearch">搜索</el-button>
          </div>
          <ConfigurableTable
            :data="parts"
            :columns="partsTableColumns"
            storage-key="parts_inventory"
            :show-operation="true"
            operation-width="auto"
            @sort-change="handlePartsSortChange"
            class="mt-4"
          >
            <template #operation="{ row }">
              <el-button type="primary" size="small" @click="handleViewPart(row)">
                查看
              </el-button>
              <el-button type="success" size="small" @click="handleEditPart(row)">
                编辑
              </el-button>
              <el-button type="danger" size="small" @click="handleDeletePart(row.partNumber)">
                删除
              </el-button>
            </template>
          </ConfigurableTable>
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
        </el-tab-pane>
        <el-tab-pane label="配件销售记录">
          <div class="search-bar">
            <el-date-picker
              v-model="saleDateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              style="margin-right: 10px"
            />
            <el-input
              v-model="saleSearchQuery"
              placeholder="搜索客户名称或工单号"
              prefix-icon="el-icon-search"
              style="width: 300px; margin-right: 10px"
            />
            <el-button type="primary" @click="handleSaleSearch">搜索</el-button>
          </div>
          <ConfigurableTable
            :data="saleRecords"
            :columns="saleTableColumns"
            storage-key="parts_sale"
            :show-operation="false"
            @sort-change="handleSaleSortChange"
            class="mt-4"
          />
          <div class="pagination mt-4">
            <el-pagination
              @size-change="handleSaleSizeChange"
              @current-change="handleSaleCurrentChange"
              :current-page="saleCurrentPage"
              :page-sizes="[10, 20, 50, 100]"
              :page-size="salePageSize"
              layout="total, sizes, prev, pager, next, jumper"
              :total="saleTotal"
            />
          </div>
        </el-tab-pane>
        <el-tab-pane label="配件采购管理">
          <div class="search-bar">
            <el-date-picker
              v-model="purchaseDateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              style="margin-right: 10px"
            />
            <el-input
              v-model="purchaseSearchQuery"
              placeholder="搜索供应商或配件编码"
              prefix-icon="el-icon-search"
              style="width: 300px; margin-right: 10px"
            />
            <el-button type="primary" @click="handlePurchaseSearch">搜索</el-button>
            <el-button type="success" @click="handleAddPurchase">新增采购</el-button>
          </div>
          <ConfigurableTable
            :data="purchaseRecords"
            :columns="purchaseTableColumns"
            storage-key="parts_purchase"
            :show-operation="false"
            @sort-change="handlePurchaseSortChange"
            class="mt-4"
          >
            <template #status="{ row }">
              <el-tag :type="getPurchaseStatusType(row.status)">{{ row.status }}</el-tag>
            </template>
          </ConfigurableTable>
          <div class="pagination mt-4">
            <el-pagination
              @size-change="handlePurchaseSizeChange"
              @current-change="handlePurchaseCurrentChange"
              :current-page="purchaseCurrentPage"
              :page-sizes="[10, 20, 50, 100]"
              :page-size="purchasePageSize"
              layout="total, sizes, prev, pager, next, jumper"
              :total="purchaseTotal"
            />
          </div>
        </el-tab-pane>
        <el-tab-pane label="配件报价查询">
          <div class="search-bar">
            <el-input
              v-model="quoteSearchQuery"
              placeholder="搜索配件编码或客户名称"
              prefix-icon="el-icon-search"
              style="width: 300px; margin-right: 10px"
            />
            <el-button type="primary" @click="handleQuoteSearch">搜索</el-button>
          </div>
          <ConfigurableTable
            :data="quoteRecords"
            :columns="quoteTableColumns"
            storage-key="parts_quote"
            :show-operation="false"
            @sort-change="handleQuoteSortChange"
            class="mt-4"
          />
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <!-- 新增/编辑配件对话框 -->
    <el-dialog
      :title="dialogTitle"
      v-model="dialogVisible"
      width="600px"
    >
      <el-form :model="form" label-width="120px">
        <el-form-item label="配件编码">
          <el-input v-model="form.partNumber" />
        </el-form-item>
        <el-form-item label="配件名称">
          <el-input v-model="form.partName" />
        </el-form-item>
        <el-form-item label="适用型号">
          <el-input v-model="form.model" />
        </el-form-item>
        <el-form-item label="库存数量">
          <el-input v-model.number="form.stock" type="number" />
        </el-form-item>
        <el-form-item label="单位">
          <el-input v-model="form.unit" />
        </el-form-item>
        <el-form-item label="成本价">
          <el-input v-model.number="form.costPrice" type="number" />
        </el-form-item>
        <el-form-item label="销售价">
          <el-input v-model.number="form.salePrice" type="number" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit">确定</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 配件详情对话框 -->
    <el-dialog
      title="配件详情"
      v-model="detailVisible"
      width="800px"
    >
      <el-descriptions :column="2" border>
        <el-descriptions-item label="配件编码">{{ selectedPart.partNumber }}</el-descriptions-item>
        <el-descriptions-item label="配件名称">{{ selectedPart.partName }}</el-descriptions-item>
        <el-descriptions-item label="适用型号">{{ selectedPart.model }}</el-descriptions-item>
        <el-descriptions-item label="库存数量">{{ selectedPart.stock }}</el-descriptions-item>
        <el-descriptions-item label="单位">{{ selectedPart.unit }}</el-descriptions-item>
        <el-descriptions-item label="成本价">{{ selectedPart.costPrice }}</el-descriptions-item>
        <el-descriptions-item label="销售价">{{ selectedPart.salePrice }}</el-descriptions-item>
        <el-descriptions-item label="利润率">{{ selectedPart.profitMargin }}</el-descriptions-item>
      </el-descriptions>
      <el-tab-pane label="关联设备" class="mt-4">
        <el-table :data="selectedPart.relatedAssets" style="width: 100%">
          <el-table-column prop="serialNumber" label="设备序列号" />
          <el-table-column prop="model" label="设备型号" />
          <el-table-column prop="customerName" label="客户名称" />
        </el-table>
      </el-tab-pane>
    </el-dialog>

    <!-- 新增采购对话框 -->
    <el-dialog
      title="新增采购"
      v-model="purchaseVisible"
      width="600px"
    >
      <el-form :model="purchaseForm" label-width="120px">
        <el-form-item label="供应商">
          <el-input v-model="purchaseForm.supplier" />
        </el-form-item>
        <el-form-item label="配件编码">
          <el-select v-model="purchaseForm.partNumber">
            <el-option v-for="part in parts" :key="part.partNumber" :label="part.partNumber" :value="part.partNumber" />
          </el-select>
        </el-form-item>
        <el-form-item label="采购数量">
          <el-input v-model.number="purchaseForm.quantity" type="number" />
        </el-form-item>
        <el-form-item label="采购价">
          <el-input v-model.number="purchaseForm.purchasePrice" type="number" />
        </el-form-item>
        <el-form-item label="采购日期">
          <el-date-picker v-model="purchaseForm.purchaseDate" type="date" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="purchaseVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmitPurchase">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, computed } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import ConfigurableTable from '../components/ConfigurableTable.vue'

export default {
  name: 'Parts',
  components: {
    Plus,
    ConfigurableTable
  },
  setup() {
    const searchQuery = ref('')
    const currentPage = ref(1)
    const pageSize = ref(10)
    const total = ref(100)
    const dialogVisible = ref(false)
    const detailVisible = ref(false)
    const purchaseVisible = ref(false)
    const dialogTitle = ref('新增配件')
    const form = reactive({
      partNumber: '',
      partName: '',
      model: '',
      stock: 0,
      unit: '',
      costPrice: 0,
      salePrice: 0
    })
    const selectedPart = ref({
      partNumber: '',
      partName: '',
      model: '',
      stock: 0,
      unit: '',
      costPrice: 0,
      salePrice: 0,
      profitMargin: '',
      relatedAssets: []
    })
    const purchaseForm = reactive({
      supplier: '',
      partNumber: '',
      quantity: 0,
      purchasePrice: 0,
      purchaseDate: ''
    })

    // 销售记录相关
    const saleDateRange = ref([])
    const saleSearchQuery = ref('')
    const saleCurrentPage = ref(1)
    const salePageSize = ref(10)
    const saleTotal = ref(50)

    // 采购记录相关
    const purchaseDateRange = ref([])
    const purchaseSearchQuery = ref('')
    const purchaseCurrentPage = ref(1)
    const purchasePageSize = ref(10)
    const purchaseTotal = ref(30)

    // 报价记录相关
    const quoteSearchQuery = ref('')

    // 配件库存表格列配置
    // 配件库存表格列配置 - 优化宽度适配
    const partsTableColumns = [
      { prop: 'partNumber', label: '配件编码', width: 120, sortable: true },
      { prop: 'partName', label: '配件名称', minWidth: 150, sortable: true },
      { prop: 'model', label: '适用型号', minWidth: 150, sortable: true },
      { prop: 'stock', label: '库存数量', width: 100, sortable: true },
      { prop: 'unit', label: '单位', width: 85, sortable: true },
      { prop: 'costPrice', label: '成本价', width: 100, sortable: true },
      { prop: 'salePrice', label: '销售价', width: 100, sortable: true }
    ]

    // 销售记录表格列配置 - 优化宽度适配
    const saleTableColumns = [
      { prop: 'id', label: '销售ID', width: 90, sortable: true },
      { prop: 'workorderId', label: '工单号', width: 110, sortable: true },
      { prop: 'customerName', label: '客户名称', minWidth: 160, sortable: true },
      { prop: 'partNumber', label: '配件编码', width: 120, sortable: true },
      { prop: 'partName', label: '配件名称', minWidth: 150, sortable: true },
      { prop: 'quantity', label: '数量', width: 85, sortable: true },
      { prop: 'salePrice', label: '销售价', width: 100, sortable: true },
      { prop: 'totalAmount', label: '总金额', width: 100, sortable: true },
      { prop: 'saleDate', label: '销售日期', width: 170, sortable: true }
    ]

    // 采购记录表格列配置 - 优化宽度适配
    const purchaseTableColumns = [
      { prop: 'id', label: '采购ID', width: 90, sortable: true },
      { prop: 'supplier', label: '供应商', minWidth: 150, sortable: true },
      { prop: 'partNumber', label: '配件编码', width: 120, sortable: true },
      { prop: 'partName', label: '配件名称', minWidth: 150, sortable: true },
      { prop: 'quantity', label: '数量', width: 85, sortable: true },
      { prop: 'purchasePrice', label: '采购价', width: 100, sortable: true },
      { prop: 'totalAmount', label: '总金额', width: 100, sortable: true },
      { prop: 'purchaseDate', label: '采购日期', width: 170, sortable: true },
      { prop: 'status', label: '状态', width: 100, sortable: true, slot: true }
    ]

    // 报价记录表格列配置 - 优化宽度适配
    const quoteTableColumns = [
      { prop: 'id', label: '报价ID', width: 90, sortable: true },
      { prop: 'customerName', label: '客户名称', minWidth: 160, sortable: true },
      { prop: 'partNumber', label: '配件编码', width: 120, sortable: true },
      { prop: 'partName', label: '配件名称', minWidth: 150, sortable: true },
      { prop: 'quotePrice', label: '报价', width: 100, sortable: true },
      { prop: 'quoteDate', label: '报价日期', width: 180, sortable: true },
      { prop: 'validUntil', label: '有效期至', width: 180, sortable: true }
    ]

    // 获取采购状态标签类型
    const getPurchaseStatusType = (status) => {
      const statusMap = {
        '已完成': 'success',
        '进行中': 'warning',
        '待付款': 'danger'
      }
      return statusMap[status] || 'info'
    }

    // 处理配件排序变化
    const handlePartsSortChange = ({ prop, order }) => {
      console.log('配件排序', prop, order)
    }

    // 处理销售记录排序变化
    const handleSaleSortChange = ({ prop, order }) => {
      console.log('销售记录排序', prop, order)
    }

    // 处理采购记录排序变化
    const handlePurchaseSortChange = ({ prop, order }) => {
      console.log('采购记录排序', prop, order)
    }

    // 处理报价记录排序变化
    const handleQuoteSortChange = ({ prop, order }) => {
      console.log('报价记录排序', prop, order)
    }

    const parts = ref([
      {
        partNumber: 'P001',
        partName: '零件A',
        model: 'Model A',
        stock: 50,
        unit: '个',
        costPrice: 100,
        salePrice: 150
      },
      {
        partNumber: 'P002',
        partName: '零件B',
        model: 'Model B',
        stock: 30,
        unit: '个',
        costPrice: 200,
        salePrice: 280
      },
      {
        partNumber: 'P003',
        partName: '零件C',
        model: 'Model A, Model B',
        stock: 20,
        unit: '个',
        costPrice: 150,
        salePrice: 220
      }
    ])

    const saleRecords = ref([
      {
        id: 1,
        workorderId: 'WO004',
        customerName: '上海某机械有限公司',
        partNumber: 'P001',
        partName: '零件A',
        quantity: 2,
        salePrice: 150,
        totalAmount: 300,
        saleDate: '2026-02-25 11:00:00'
      },
      {
        id: 2,
        workorderId: 'WO004',
        customerName: '上海某机械有限公司',
        partNumber: 'P002',
        partName: '零件B',
        quantity: 1,
        salePrice: 280,
        totalAmount: 280,
        saleDate: '2026-02-25 11:00:00'
      }
    ])

    const purchaseRecords = ref([
      {
        id: 1,
        supplier: '供应商A',
        partNumber: 'P001',
        partName: '零件A',
        quantity: 100,
        purchasePrice: 90,
        totalAmount: 9000,
        purchaseDate: '2026-01-01',
        status: '已完成'
      },
      {
        id: 2,
        supplier: '供应商B',
        partNumber: 'P002',
        partName: '零件B',
        quantity: 50,
        purchasePrice: 180,
        totalAmount: 9000,
        purchaseDate: '2026-01-02',
        status: '已完成'
      }
    ])

    const quoteRecords = ref([
      {
        id: 1,
        customerName: '上海某机械有限公司',
        partNumber: 'P001',
        partName: '零件A',
        quotePrice: 150,
        quoteDate: '2026-02-20',
        validUntil: '2026-03-20'
      },
      {
        id: 2,
        customerName: '北京某设备制造有限公司',
        partNumber: 'P002',
        partName: '零件B',
        quotePrice: 270,
        quoteDate: '2026-02-22',
        validUntil: '2026-03-22'
      }
    ])

    const handleAddPart = () => {
      dialogTitle.value = '新增配件'
      Object.keys(form).forEach(key => {
        form[key] = ''
      })
      form.stock = 0
      form.costPrice = 0
      form.salePrice = 0
      dialogVisible.value = true
    }

    const handleEditPart = (row) => {
      dialogTitle.value = '编辑配件'
      Object.assign(form, row)
      dialogVisible.value = true
    }

    const handleViewPart = (row) => {
      // 模拟数据
      selectedPart.value = {
        ...row,
        profitMargin: `${Math.round((row.salePrice - row.costPrice) / row.costPrice * 100)}%`,
        relatedAssets: [
          { serialNumber: 'SN001', model: 'Model A', customerName: '上海某机械有限公司' },
          { serialNumber: 'SN002', model: 'Model B', customerName: '北京某设备制造有限公司' }
        ]
      }
      detailVisible.value = true
    }

    const handleDeletePart = (partNumber) => {
      // 模拟删除
      const index = parts.value.findIndex(p => p.partNumber === partNumber)
      if (index !== -1) {
        parts.value.splice(index, 1)
      }
    }

    const handleSubmit = () => {
      // 模拟提交
      if (dialogTitle.value === '新增配件') {
        parts.value.push({ ...form })
      } else {
        const index = parts.value.findIndex(p => p.partNumber === form.partNumber)
        if (index !== -1) {
          parts.value[index] = { ...form }
        }
      }
      dialogVisible.value = false
    }

    const handleSearch = () => {
      // 模拟搜索
      console.log('搜索', searchQuery.value)
    }

    const handleSizeChange = (size) => {
      pageSize.value = size
    }

    const handleCurrentChange = (current) => {
      currentPage.value = current
    }

    const handleSaleSearch = () => {
      // 模拟搜索
      console.log('销售记录搜索', saleDateRange.value, saleSearchQuery.value)
    }

    const handleSaleSizeChange = (size) => {
      salePageSize.value = size
    }

    const handleSaleCurrentChange = (current) => {
      saleCurrentPage.value = current
    }

    const handlePurchaseSearch = () => {
      // 模拟搜索
      console.log('采购记录搜索', purchaseDateRange.value, purchaseSearchQuery.value)
    }

    const handlePurchaseSizeChange = (size) => {
      purchasePageSize.value = size
    }

    const handlePurchaseCurrentChange = (current) => {
      purchaseCurrentPage.value = current
    }

    const handleQuoteSearch = () => {
      // 模拟搜索
      console.log('报价记录搜索', quoteSearchQuery.value)
    }

    const handleAddPurchase = () => {
      purchaseVisible.value = true
    }

    const handleSubmitPurchase = () => {
      // 模拟提交采购
      purchaseVisible.value = false
    }

    return {
      searchQuery,
      currentPage,
      pageSize,
      total,
      dialogVisible,
      detailVisible,
      purchaseVisible,
      dialogTitle,
      form,
      selectedPart,
      purchaseForm,
      saleDateRange,
      saleSearchQuery,
      saleCurrentPage,
      salePageSize,
      saleTotal,
      purchaseDateRange,
      purchaseSearchQuery,
      purchaseCurrentPage,
      purchasePageSize,
      purchaseTotal,
      quoteSearchQuery,
      parts,
      saleRecords,
      purchaseRecords,
      quoteRecords,
      partsTableColumns,
      saleTableColumns,
      purchaseTableColumns,
      quoteTableColumns,
      getPurchaseStatusType,
      handleAddPart,
      handleEditPart,
      handleViewPart,
      handleDeletePart,
      handleSubmit,
      handleSearch,
      handleSizeChange,
      handleCurrentChange,
      handleSaleSearch,
      handleSaleSizeChange,
      handleSaleCurrentChange,
      handlePurchaseSearch,
      handlePurchaseSizeChange,
      handlePurchaseCurrentChange,
      handleQuoteSearch,
      handleAddPurchase,
      handleSubmitPurchase,
      handlePartsSortChange,
      handleSaleSortChange,
      handlePurchaseSortChange,
      handleQuoteSortChange
    }
  }
}
</script>

<style scoped>
.parts {
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
}

.pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}

.mt-4 {
  margin-top: 20px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
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
    align-items: flex-start;
    gap: 10px;
  }
  
  .search-bar .el-input {
    width: 100% !important;
    margin-right: 0 !important;
  }
  
  .search-bar .el-date-picker {
    width: 100% !important;
    margin-right: 0 !important;
  }
  
  .search-bar .el-button {
    width: 100%;
  }
  
  .el-table {
    font-size: 12px;
  }
  
  .el-table th,
  .el-table td {
    padding: 8px 4px;
  }
  
  .el-table-column {
    min-width: 80px;
  }
  
  .pagination {
    justify-content: center;
  }
  
  .el-dialog {
    width: 90% !important;
    margin: 10px auto !important;
  }
  
  .el-form-item {
    margin-bottom: 10px;
  }
  
  .el-form-item__label {
    font-size: 12px;
    width: 100px !important;
  }
  
  .el-form-item__content {
    margin-left: 110px !important;
  }
  
  .el-descriptions {
    font-size: 12px;
  }
  
  .el-descriptions__label {
    font-size: 12px;
  }
  
  .el-tabs__item {
    font-size: 12px;
    padding: 0 8px;
  }
  
  /* 详情对话框全屏 */
  .parts :deep(.el-dialog) {
    width: 100% !important;
    margin: 0 !important;
    height: 100vh;
    max-height: 100vh;
    border-radius: 0;
    display: flex;
    flex-direction: column;
  }
  
  .parts :deep(.el-dialog__header) {
    padding: 12px 15px;
    flex-shrink: 0;
    border-bottom: 1px solid #e4e7ed;
  }
  
  .parts :deep(.el-dialog__body) {
    flex: 1;
    overflow-y: auto;
    padding: 10px;
    -webkit-overflow-scrolling: touch;
    max-height: calc(100vh - 55px);
  }
  
  /* 描述列表 - 每行一个字段 */
  .parts :deep(.el-descriptions) {
    font-size: 14px;
    width: 100% !important;
  }
  
  .parts :deep(.el-descriptions__body .el-descriptions__table) {
    width: 100% !important;
    table-layout: fixed !important;
    display: block !important;
  }
  
  .parts :deep(.el-descriptions__body .el-descriptions__table tbody) {
    display: block !important;
    width: 100% !important;
  }
  
  .parts :deep(.el-descriptions__body .el-descriptions__table tr) {
    display: block !important;
    width: 100% !important;
  }
  
  .parts :deep(.el-descriptions__body .el-descriptions__table td) {
    display: flex !important;
    flex-direction: row !important;
    align-items: flex-start !important;
    padding: 10px 0 !important;
    border-bottom: 1px solid #ebeef5 !important;
    width: 100% !important;
    box-sizing: border-box !important;
  }
  
  .parts :deep(.el-descriptions-item) {
    display: flex !important;
    flex-direction: row !important;
    align-items: flex-start !important;
    width: 100% !important;
  }
  
  .parts :deep(.el-descriptions-item__cell) {
    display: flex !important;
    flex-direction: row !important;
    width: 100% !important;
  }
  
  .parts :deep(.el-descriptions-item__label) {
    width: 90px !important;
    min-width: 90px !important;
    max-width: 90px !important;
    font-size: 13px !important;
    color: #606266 !important;
    padding: 0 !important;
    line-height: 1.5 !important;
    display: inline-block !important;
    flex-shrink: 0 !important;
  }
  
  .parts :deep(.el-descriptions-item__content) {
    flex: 1 !important;
    font-size: 14px !important;
    color: #303133 !important;
    padding: 0 !important;
    line-height: 1.5 !important;
    word-break: break-all !important;
    overflow-wrap: break-word !important;
    display: inline-block !important;
  }
}

@media (max-width: 480px) {
  .el-form-item__label {
    width: 80px !important;
  }
  
  .el-form-item__content {
    margin-left: 90px !important;
  }
  
  .el-descriptions {
    column-count: 1 !important;
  }
  
  .el-button {
    font-size: 12px;
    padding: 6px 12px;
  }
  
  .el-button span {
    font-size: 12px;
  }
}
</style>