<template>
  <div class="asset">
    <el-card shadow="hover" class="mb-4">
      <template #header>
        <div class="card-header">
          <span>设备管理</span>
          <el-button type="primary" @click="handleAddAsset">
            <el-icon><Plus /></el-icon>
            <span>新增设备</span>
          </el-button>
        </div>
      </template>
      <div class="search-bar">
        <el-input
          v-model="searchQuery"
          placeholder="搜索设备序列号或型号"
          prefix-icon="el-icon-search"
          style="width: 300px; margin-right: 10px"
        />
        <el-select
          v-model="assetStatus"
          placeholder="设备状态"
          style="width: 150px; margin-right: 10px"
        >
          <el-option label="全部" value="" />
          <el-option label="运行中" value="运行中" />
          <el-option label="停机" value="停机" />
          <el-option label="维修中" value="维修中" />
          <el-option label="报废" value="报废" />
        </el-select>
        <el-button type="primary" @click="handleSearch">搜索</el-button>
      </div>
      <ConfigurableTable
        :data="assets"
        :columns="tableColumns"
        storage-key="asset"
        :show-operation="true"
        operation-width="auto"
        @sort-change="handleSortChange"
        class="mt-4"
      >
        <template #status="{ row }">
          <el-tag :type="getStatusType(row.status)">{{ row.status }}</el-tag>
        </template>
        <template #operation="{ row }">
          <el-button type="primary" size="small" @click="handleViewAsset(row)">
            查看
          </el-button>
          <el-button type="success" size="small" @click="handleEditAsset(row)">
            编辑
          </el-button>
          <el-button type="danger" size="small" @click="handleDeleteAsset(row.serialNumber)">
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
    </el-card>

    <!-- 新增/编辑设备对话框 -->
    <el-dialog
      :title="dialogTitle"
      v-model="dialogVisible"
      width="800px"
    >
      <el-form :model="form" label-width="120px">
        <el-form-item label="设备序列号">
          <el-input v-model="form.serialNumber" />
        </el-form-item>
        <el-form-item label="型号">
          <el-input v-model="form.model" />
        </el-form-item>
        <el-form-item label="客户名称">
          <el-select v-model="form.customerId">
            <el-option v-for="customer in customers" :key="customer.id" :label="customer.name" :value="customer.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="出厂日期">
          <el-date-picker v-model="form.manufactureDate" type="date" />
        </el-form-item>
        <el-form-item label="销售日期">
          <el-date-picker v-model="form.salesDate" type="date" />
        </el-form-item>
        <el-form-item label="安装日期">
          <el-date-picker v-model="form.installDate" type="date" />
        </el-form-item>
        <el-form-item label="保修截止日">
          <el-date-picker v-model="form.warrantyEndDate" type="date" />
        </el-form-item>
        <el-form-item label="当前状态">
          <el-select v-model="form.status">
            <el-option label="运行中" value="运行中" />
            <el-option label="停机" value="停机" />
            <el-option label="维修中" value="维修中" />
            <el-option label="报废" value="报废" />
          </el-select>
        </el-form-item>
        <el-form-item label="是否EL">
          <el-switch v-model="form.isEL" />
        </el-form-item>
        <el-form-item label="安装地址">
          <el-input v-model="form.installAddress" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit">确定</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 设备详情对话框 -->
    <el-dialog
      title="设备详情"
      v-model="detailVisible"
      width="1000px"
      :fullscreen="isMobile"
      class="asset-detail-dialog"
    >
      <div class="detail-container">
        <!-- 头部信息卡片 -->
        <div class="header-card">
          <div class="header-left">
            <div class="detail-title">
              <el-icon><Monitor /></el-icon>
              <span>{{ selectedAsset.serialNumber }}</span>
              <el-tag :type="selectedAsset.status === '运行中' ? 'success' : 'warning'" size="small" effect="dark">
                {{ selectedAsset.status }}
              </el-tag>
            </div>
            <div class="detail-meta">
              <span class="meta-item">
                <el-icon><OfficeBuilding /></el-icon>
                {{ selectedAsset.customerName }}
              </span>
              <span class="meta-item">
                <el-icon><Box /></el-icon>
                {{ selectedAsset.model }}
              </span>
            </div>
          </div>
        </div>

        <el-tabs class="detail-tabs">
          <el-tab-pane label="基本信息">
            <el-card class="section-card" shadow="hover">
              <template #header>
                <div class="card-header">
                  <el-icon><InfoFilled /></el-icon>
                  <span>设备信息</span>
                </div>
              </template>
              <div class="info-grid">
                <div class="info-item">
                  <span class="label">设备序列号</span>
                  <span class="value">{{ selectedAsset.serialNumber }}</span>
                </div>
                <div class="info-item">
                  <span class="label">型号</span>
                  <span class="value">{{ selectedAsset.model }}</span>
                </div>
                <div class="info-item">
                  <span class="label">客户名称</span>
                  <span class="value">{{ selectedAsset.customerName }}</span>
                </div>
                <div class="info-item">
                  <span class="label">当前状态</span>
                  <el-tag :type="selectedAsset.status === '运行中' ? 'success' : 'warning'" size="small">
                    {{ selectedAsset.status }}
                  </el-tag>
                </div>
                <div class="info-item">
                  <span class="label">出厂日期</span>
                  <span class="value">{{ selectedAsset.manufactureDate || '-' }}</span>
                </div>
                <div class="info-item">
                  <span class="label">销售日期</span>
                  <span class="value">{{ selectedAsset.salesDate || '-' }}</span>
                </div>
                <div class="info-item">
                  <span class="label">安装日期</span>
                  <span class="value">{{ selectedAsset.installDate || '-' }}</span>
                </div>
                <div class="info-item">
                  <span class="label">保修截止日</span>
                  <span class="value">{{ selectedAsset.warrantyEndDate || '-' }}</span>
                </div>
                <div class="info-item">
                  <span class="label">是否EL</span>
                  <span class="value">{{ selectedAsset.isEL ? '是' : '否' }}</span>
                </div>
                <div class="info-item">
                  <span class="label">安装地址</span>
                  <span class="value">{{ selectedAsset.installAddress || '-' }}</span>
                </div>
              </div>
              <div class="mt-4">
                <el-button v-if="!selectedAsset.hasQRCode" type="primary" @click="handleBindQRCode">
                  <el-icon><Camera /></el-icon>
                  绑定动态码
                </el-button>
                <el-button v-if="selectedAsset.hasQRCode" type="success" @click="handleViewQRCode">查看二维码</el-button>
              </div>
            </el-card>
          </el-tab-pane>
          <el-tab-pane label="维护历史">
            <el-card class="section-card" shadow="hover">
              <template #header>
                <div class="card-header">
                  <el-icon><Tools /></el-icon>
                  <span>维护记录</span>
                  <span class="item-count">共 {{ selectedAsset.maintenanceHistory?.length || 0 }} 条</span>
                </div>
              </template>
              <div class="table-wrapper">
                <el-table :data="selectedAsset.maintenanceHistory" style="width: 100%" size="small">
                  <el-table-column type="index" label="序号" width="50" align="center" />
                  <el-table-column prop="date" label="维护日期" width="120" />
                  <el-table-column prop="type" label="维护类型" width="100" />
                  <el-table-column prop="content" label="维护内容" min-width="200" show-overflow-tooltip />
                  <el-table-column prop="engineer" label="工程师" width="100" />
                  <el-table-column prop="result" label="维护结果" width="100" />
                </el-table>
              </div>
              <el-empty v-if="!selectedAsset.maintenanceHistory || selectedAsset.maintenanceHistory.length === 0" description="暂无维护记录" />
            </el-card>
          </el-tab-pane>
          <el-tab-pane label="工单记录">
            <el-card class="section-card" shadow="hover">
              <template #header>
                <div class="card-header">
                  <el-icon><Document /></el-icon>
                  <span>工单记录</span>
                  <span class="item-count">共 {{ selectedAsset.workorders?.length || 0 }} 单</span>
                </div>
              </template>
              <div class="table-wrapper">
                <el-table :data="selectedAsset.workorders" style="width: 100%" size="small">
                  <el-table-column type="index" label="序号" width="50" align="center" />
                  <el-table-column prop="id" label="工单号" width="120" />
                  <el-table-column prop="type" label="类型" width="100" />
                  <el-table-column prop="createTime" label="创建时间" width="150" />
                  <el-table-column prop="finishTime" label="完成时间" width="150" />
                  <el-table-column prop="status" label="状态" width="90">
                    <template #default="scope">
                      <el-tag :type="scope.row.status === '已完成' ? 'success' : 'warning'" size="small">
                        {{ scope.row.status }}
                      </el-tag>
                    </template>
                  </el-table-column>
                  <el-table-column label="操作" width="80" fixed="right">
                    <template #default="scope">
                      <el-button type="primary" link size="small">查看</el-button>
                    </template>
                  </el-table-column>
                </el-table>
              </div>
              <el-empty v-if="!selectedAsset.workorders || selectedAsset.workorders.length === 0" description="暂无工单记录" />
            </el-card>
          </el-tab-pane>
          <el-tab-pane label="相关资料">
            <el-card class="section-card" shadow="hover">
              <template #header>
                <div class="card-header">
                  <el-icon><Folder /></el-icon>
                  <span>资料清单</span>
                  <span class="item-count">共 {{ assetDocuments.length }} 个文件</span>
                </div>
              </template>

              <!-- 上传区域 -->
              <div class="upload-section">
                <el-upload
                  class="document-uploader"
                  action="#"
                  :auto-upload="false"
                  :on-change="handleDocumentChange"
                  :show-file-list="false"
                  accept=".pdf,.xlsx,.xls,.doc,.docx,.png,.jpg,.jpeg"
                >
                  <el-button type="primary">
                    <el-icon><Upload /></el-icon>
                    上传资料
                  </el-button>
                  <template #tip>
                    <div class="el-upload__tip">
                      支持 PDF、Excel、Word、图片等格式，单个文件不超过 50MB
                    </div>
                  </template>
                </el-upload>
              </div>

              <!-- 资料列表 -->
              <div class="document-list" v-if="assetDocuments.length > 0">
                <div
                  v-for="(doc, index) in assetDocuments"
                  :key="index"
                  class="document-item"
                >
                  <div class="document-info">
                    <el-icon class="document-icon" :size="24">
                      <Document v-if="doc.type === 'pdf'" />
                      <Tickets v-else-if="doc.type === 'excel'" />
                      <DocumentCopy v-else-if="doc.type === 'word'" />
                      <Picture v-else />
                    </el-icon>
                    <div class="document-details">
                      <span class="document-name">{{ doc.name }}</span>
                      <span class="document-meta">
                        {{ formatFileSize(doc.size) }} | {{ formatTime(doc.uploadTime) }}
                      </span>
                    </div>
                  </div>
                  <div class="document-actions">
                    <el-button type="primary" link size="small" @click="previewDocument(doc)">
                      <el-icon><View /></el-icon>
                      预览
                    </el-button>
                    <el-button type="danger" link size="small" @click="deleteDocument(index)">
                      <el-icon><Delete /></el-icon>
                      删除
                    </el-button>
                  </div>
                </div>
              </div>
              <el-empty v-else description="暂无资料文件" />
            </el-card>
          </el-tab-pane>
        </el-tabs>
      </div>
    </el-dialog>

    <!-- 二维码查看对话框 -->
    <el-dialog
      title="设备动态码"
      v-model="qrcodeVisible"
      width="400px"
    >
      <div class="qrcode-container">
        <img :src="qrcodeUrl" alt="设备动态码" class="qrcode" />
        <div class="qrcode-info">
          <p>设备序列号: {{ selectedAsset.serialNumber }}</p>
          <p>型号: {{ selectedAsset.model }}</p>
          <p v-if="selectedAsset.qrCodeContent">动态码: {{ selectedAsset.qrCodeContent }}</p>
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="qrcodeVisible = false">关闭</el-button>
          <el-button type="primary" @click="handleDownloadQRCode">下载</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted } from 'vue'
import { Plus, Camera, Box, OfficeBuilding, InfoFilled, Tools, Document, Clock, Monitor, Folder, Upload, Tickets, DocumentCopy, Picture, View, Delete } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import ConfigurableTable from '../components/ConfigurableTable.vue'
import { allAssets, addAsset, updateAsset, deleteAsset as storeDeleteAsset, getAssetBySerialNumber, bindQRCode, unboundQRCodes } from '../stores/assetStore'

export default {
  name: 'Asset',
  components: {
    Plus,
    Camera,
    Box,
    OfficeBuilding,
    InfoFilled,
    Tools,
    Document,
    Clock,
    Monitor,
    ConfigurableTable
  },
  setup() {
    const searchQuery = ref('')
    const assetStatus = ref('')
    const currentPage = ref(1)
    const pageSize = ref(10)
    const dialogVisible = ref(false)
    const detailVisible = ref(false)
    const qrcodeVisible = ref(false)
    const dialogTitle = ref('新增设备')
    const qrcodeUrl = ref('')

    // 从 assetStore 读取数据
    const assets = computed(() => allAssets.value)
    const total = computed(() => allAssets.value.length)

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
    const form = reactive({
      serialNumber: '',
      model: '',
      customerId: '',
      manufactureDate: '',
      salesDate: '',
      installDate: '',
      warrantyEndDate: '',
      status: '运行中',
      isEL: false,
      installAddress: ''
    })
    const selectedAsset = ref({
      serialNumber: '',
      model: '',
      customerName: '',
      status: '',
      manufactureDate: '',
      salesDate: '',
      installDate: '',
      warrantyEndDate: '',
      isEL: false,
      installAddress: '',
      maintenanceHistory: [],
      workorders: [],
      hasQRCode: false,
      qrCodeContent: ''
    })

    // 设备资料列表
    const assetDocuments = ref([])

    // 加载设备资料
    const loadAssetDocuments = () => {
      try {
        const allDocs = JSON.parse(localStorage.getItem('assetDocuments') || '{}')
        const serialNumber = selectedAsset.value.serialNumber
        if (serialNumber && allDocs[serialNumber]) {
          assetDocuments.value = allDocs[serialNumber]
        } else {
          assetDocuments.value = []
        }
      } catch (e) {
        console.error('加载设备资料失败:', e)
        assetDocuments.value = []
      }
    }

    // 保存设备资料
    const saveAssetDocuments = () => {
      try {
        const allDocs = JSON.parse(localStorage.getItem('assetDocuments') || '{}')
        const serialNumber = selectedAsset.value.serialNumber
        if (serialNumber) {
          allDocs[serialNumber] = assetDocuments.value
          localStorage.setItem('assetDocuments', JSON.stringify(allDocs))
        }
      } catch (e) {
        console.error('保存设备资料失败:', e)
      }
    }

    // 处理文档上传
    const handleDocumentChange = (file) => {
      // 检查文件大小（限制50MB）
      const maxSize = 50 * 1024 * 1024
      if (file.size > maxSize) {
        ElMessage.warning('文件大小不能超过50MB')
        return false
      }

      // 读取文件
      const reader = new FileReader()
      reader.onload = (e) => {
        const fileType = getFileType(file.name)
        const doc = {
          name: file.name,
          type: fileType,
          size: file.size,
          data: e.target.result,
          uploadTime: new Date().toISOString()
        }
        assetDocuments.value.push(doc)
        saveAssetDocuments()
        ElMessage.success('资料上传成功')
      }
      reader.readAsDataURL(file.raw)

      return false // 阻止自动上传
    }

    // 获取文件类型
    const getFileType = (filename) => {
      const ext = filename.split('.').pop().toLowerCase()
      if (['pdf'].includes(ext)) return 'pdf'
      if (['xlsx', 'xls'].includes(ext)) return 'excel'
      if (['doc', 'docx'].includes(ext)) return 'word'
      if (['png', 'jpg', 'jpeg', 'gif', 'bmp'].includes(ext)) return 'image'
      return 'other'
    }

    // 格式化文件大小
    const formatFileSize = (bytes) => {
      if (bytes === 0) return '0 B'
      const k = 1024
      const sizes = ['B', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }

    // 格式化时间
    const formatTime = (time) => {
      if (!time) return ''
      const date = new Date(time)
      return date.toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
    }

    // 预览文档
    const previewDocument = (doc) => {
      if (doc.type === 'image') {
        // 图片直接在新窗口打开
        window.open(doc.data, '_blank')
      } else if (doc.type === 'pdf') {
        // PDF在新窗口打开
        window.open(doc.data, '_blank')
      } else {
        // 其他类型下载
        const link = document.createElement('a')
        link.href = doc.data
        link.download = doc.name
        link.click()
        ElMessage.success('开始下载')
      }
    }

    // 删除文档
    const deleteDocument = (index) => {
      ElMessageBox.confirm(
        '确定要删除这个资料文件吗？',
        '确认删除',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      ).then(() => {
        assetDocuments.value.splice(index, 1)
        saveAssetDocuments()
        ElMessage.success('资料已删除')
      }).catch(() => {})
    }

    // 表格列配置
    const tableColumns = [
      { prop: 'serialNumber', label: '设备序列号', width: 120, sortable: true },
      { prop: 'model', label: '型号', width: 120, sortable: true },
      { prop: 'customerName', label: '客户名称', minWidth: 180, sortable: true },
      { prop: 'status', label: '状态', width: 100, sortable: true, slot: true },
      { prop: 'installDate', label: '安装日期', width: 150, sortable: true },
      { prop: 'warrantyEndDate', label: '保修截止日', width: 150, sortable: true },
      { prop: 'installAddress', label: '安装地址', minWidth: 200, sortable: true }
    ]

    // 获取状态标签类型
    const getStatusType = (status) => {
      const statusMap = {
        '运行中': 'success',
        '停机': 'danger',
        '维修中': 'warning',
        '报废': 'info'
      }
      return statusMap[status] || 'info'
    }

    // 处理排序变化
    const handleSortChange = ({ prop, order }) => {
      console.log('排序', prop, order)
    }

    const customers = ref([
      { id: 'C001', name: '上海某机械有限公司' },
      { id: 'C002', name: '北京某设备制造有限公司' },
      { id: 'C003', name: '广州某工业设备有限公司' }
    ])

    const handleAddAsset = () => {
      dialogTitle.value = '新增设备'
      Object.keys(form).forEach(key => {
        form[key] = ''
      })
      form.status = '运行中'
      form.isEL = false
      dialogVisible.value = true
    }

    const handleEditAsset = (row) => {
      dialogTitle.value = '编辑设备'
      Object.assign(form, row)
      dialogVisible.value = true
    }

    const handleViewAsset = (row) => {
      const asset = getAssetBySerialNumber(row.serialNumber)
      selectedAsset.value = {
        ...row,
        manufactureDate: asset?.manufactureDate || row.manufactureDate || '2025-12-01',
        salesDate: asset?.saleDate || row.salesDate || '2026-01-05',
        isEL: asset?.isEL !== undefined ? asset.isEL : true,
        hasQRCode: asset?.hasQRCode || false,
        qrCodeContent: asset?.qrCodeToken || '',
        maintenanceHistory: [
          { date: '2026-02-01', type: '例行维护', content: '设备检查', engineer: '王工程师', result: '正常' },
          { date: '2026-03-01', type: '故障维修', content: '更换零件', engineer: '李工程师', result: '已修复' }
        ],
        workorders: [
          { id: 'WO001', type: '维修', createTime: '2026-02-01', finishTime: '2026-02-02', status: '已完成' },
          { id: 'WO002', type: '巡检', createTime: '2026-03-01', finishTime: '2026-03-01', status: '已完成' }
        ]
      }
      // 加载设备资料
      loadAssetDocuments()
      detailVisible.value = true
    }

    const handleDeleteAsset = (serialNumber) => {
      storeDeleteAsset(serialNumber)
    }

    const handleSubmit = () => {
      const customer = customers.value.find(c => c.id === form.customerId)
      if (dialogTitle.value === '新增设备') {
        const newAsset = {
          ...form,
          customerName: customer ? customer.name : '',
          companyId: form.customerId
        }
        addAsset(newAsset)
      } else {
        const updatedData = {
          ...form,
          customerName: customer ? customer.name : '',
          companyId: form.customerId
        }
        updateAsset(form.serialNumber, updatedData)
      }
      dialogVisible.value = false
    }

    const handleSearch = () => {
      // 模拟搜索
      console.log('搜索', searchQuery.value, assetStatus.value)
    }

    const handleSizeChange = (size) => {
      pageSize.value = size
    }

    const handleCurrentChange = (current) => {
      currentPage.value = current
    }

    // 处理绑定动态码 - 从assetStore中选取未绑定的二维码
    const handleBindQRCode = async () => {
      const availableCodes = unboundQRCodes.value
      if (availableCodes.length === 0) {
        ElMessage.warning('没有可用的空白码，请先在二维码管理中生成')
        return
      }
      // 选取第一个未绑定的二维码
      const token = availableCodes[0].token
      bindQRCode(token, selectedAsset.value.serialNumber)
      selectedAsset.value.hasQRCode = true
      selectedAsset.value.qrCodeContent = token
      ElMessage.success('动态码绑定成功')
    }

    const handleViewQRCode = () => {
      // 二维码内容为完整URL，扫码后可直接打开报修页面
      const token = selectedAsset.value.qrCodeContent || ''
      const scanUrl = token
        ? `${window.location.origin}/scan-result?token=${token}`
        : `${window.location.origin}/scan-result?serial=${selectedAsset.value.serialNumber}`
      qrcodeUrl.value = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(scanUrl)}`
      qrcodeVisible.value = true
    }

    const handleDownloadQRCode = () => {
      // 模拟下载二维码
      console.log('下载二维码')
    }

    return {
      searchQuery,
      assetStatus,
      currentPage,
      pageSize,
      total,
      dialogVisible,
      detailVisible,
      isMobile,
      qrcodeVisible,
      dialogTitle,
      qrcodeUrl,
      form,
      selectedAsset,
      customers,
      assets,
      tableColumns,
      assetDocuments,
      getStatusType,
      handleAddAsset,
      handleEditAsset,
      handleViewAsset,
      handleDeleteAsset,
      handleSubmit,
      handleSearch,
      handleSizeChange,
      handleCurrentChange,
      handleSortChange,
      handleBindQRCode,
      handleViewQRCode,
      handleDownloadQRCode,
      handleDocumentChange,
      previewDocument,
      deleteDocument,
      formatFileSize,
      formatTime
    }
  }
}
</script>

<style scoped>
.asset {
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

.qrcode-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
}

.qrcode {
  width: 200px;
  height: 200px;
}

/* 资料管理样式 */
.upload-section {
  margin-bottom: 20px;
}

.document-uploader {
  display: flex;
  flex-direction: column;
}

.document-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.document-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 15px;
  background: #f5f7fa;
  border-radius: 8px;
  border: 1px solid #e4e7ed;
}

.document-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
}

.document-icon {
  color: #409eff;
  flex-shrink: 0;
}

.document-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
  min-width: 0;
}

.document-name {
  font-size: 14px;
  color: #303133;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.document-meta {
  font-size: 12px;
  color: #909399;
}

.document-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.qrcode-info {
  text-align: center;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .search-bar {
    flex-direction: column;
    align-items: stretch;
  }
  
  .search-bar .el-input,
  .search-bar .el-select {
    width: 100% !important;
    margin-right: 0 !important;
    margin-bottom: 10px;
  }
  
  .card-header {
    flex-direction: column;
    gap: 10px;
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
  
  .qrcode {
    width: 150px;
    height: 150px;
    margin-bottom: 15px;
  }
  
  .qrcode-container {
    padding: 15px;
  }
  
  /* 详情对话框全屏 */
  .asset :deep(.el-dialog) {
    width: 100% !important;
    margin: 0 !important;
    height: 100vh;
    max-height: 100vh;
    border-radius: 0;
    display: flex;
    flex-direction: column;
  }
  
  .asset :deep(.el-dialog__header) {
    padding: 12px 15px;
    flex-shrink: 0;
    border-bottom: 1px solid #e4e7ed;
  }
  
  .asset :deep(.el-dialog__body) {
    flex: 1;
    overflow-y: auto;
    padding: 10px;
    -webkit-overflow-scrolling: touch;
    max-height: calc(100vh - 55px);
  }
  
  /* 描述列表 - 每行一个字段 */
  .asset :deep(.el-descriptions) {
    font-size: 14px;
    width: 100% !important;
  }
  
  .asset :deep(.el-descriptions__body .el-descriptions__table) {
    width: 100% !important;
    table-layout: fixed !important;
    display: block !important;
  }
  
  .asset :deep(.el-descriptions__body .el-descriptions__table tbody) {
    display: block !important;
    width: 100% !important;
  }
  
  .asset :deep(.el-descriptions__body .el-descriptions__table tr) {
    display: block !important;
    width: 100% !important;
  }
  
  .asset :deep(.el-descriptions__body .el-descriptions__table td) {
    display: flex !important;
    flex-direction: row !important;
    align-items: flex-start !important;
    padding: 10px 0 !important;
    border-bottom: 1px solid #ebeef5 !important;
    width: 100% !important;
    box-sizing: border-box !important;
  }
  
  .asset :deep(.el-descriptions-item) {
    display: flex !important;
    flex-direction: row !important;
    align-items: flex-start !important;
    width: 100% !important;
  }
  
  .asset :deep(.el-descriptions-item__cell) {
    display: flex !important;
    flex-direction: row !important;
    width: 100% !important;
  }
  
  .asset :deep(.el-descriptions-item__label) {
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
  
  .asset :deep(.el-descriptions-item__content) {
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
  
  .qrcode {
    width: 120px;
    height: 120px;
    margin-bottom: 10px;
  }
  
  .qrcode-container {
    padding: 10px;
  }
}

/* 详情弹窗统一样式 */
.detail-container {
  max-height: 650px;
  overflow-y: auto;
  padding: 0 10px;
}

:deep(.asset-detail-dialog.is-fullscreen) .detail-container {
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

.detail-title {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 12px;
}

.detail-title .el-icon {
  font-size: 28px;
}

.detail-meta {
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

/* 表格包装器 */
.table-wrapper {
  overflow-x: auto;
}

/* 详情标签页 */
.detail-tabs :deep(.el-tabs__header) {
  margin-bottom: 20px;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .header-card {
    flex-direction: column;
    gap: 16px;
    padding: 16px 20px;
    margin-bottom: 16px;
  }

  .detail-title {
    font-size: 18px;
  }

  .detail-title .el-icon {
    font-size: 22px;
  }

  .detail-meta {
    flex-wrap: wrap;
    gap: 8px;
    font-size: 12px;
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

  .card-header {
    flex-wrap: wrap;
  }
}

@media (max-width: 480px) {
  .detail-container {
    padding: 0 8px;
  }

  .header-card {
    padding: 12px 16px;
    border-radius: 8px;
  }

  .detail-title {
    font-size: 16px;
  }

  .detail-meta {
    flex-direction: column;
    gap: 6px;
  }

  .section-card {
    border-radius: 6px;
  }

  .card-header {
    font-size: 14px;
  }
}
</style>