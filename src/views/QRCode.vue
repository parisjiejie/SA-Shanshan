<template>
  <div class="qrcode">
    <el-card shadow="hover" class="mb-4">
      <template #header>
        <div class="card-header">
          <span>二维码管理</span>
          <el-button type="primary" @click="handleGenerateBatch">
            <el-icon><Plus /></el-icon>
            <span>批量生成空白码</span>
          </el-button>
        </div>
      </template>
      <el-tabs>
        <el-tab-pane label="空白码池">
          <div class="search-bar">
            <el-input
              v-model="searchQuery"
              placeholder="搜索二维码Token"
              prefix-icon="el-icon-search"
              style="width: 300px; margin-right: 10px"
            />
            <el-select
              v-model="qrcodeStatus"
              placeholder="状态"
              style="width: 150px; margin-right: 10px"
            >
              <el-option label="全部" value="" />
              <el-option label="未绑定" value="未绑定" />
              <el-option label="已绑定" value="已绑定" />
            </el-select>
            <el-button type="primary" @click="handleSearch">搜索</el-button>
            <el-button type="success" @click="handleDownloadBatch">批量下载</el-button>
          </div>
          <el-table :data="qrcodes" style="width: 100%" class="mt-4">
            <el-table-column prop="id" label="ID" width="80" />
            <el-table-column prop="token" label="Token" />
            <el-table-column prop="status" label="状态" width="100" />
            <el-table-column prop="bindAsset" label="绑定设备" />
            <el-table-column prop="createTime" label="创建时间" width="180" />
            <el-table-column prop="bindTime" label="绑定时间" width="180" />
            <el-table-column label="操作" width="150" fixed="right">
              <template #default="scope">
                <el-button type="primary" size="small" @click="handleViewQRCode(scope.row)">
                  查看
                </el-button>
                <el-button type="success" size="small" @click="handleBindAsset(scope.row)" v-if="scope.row.status === '未绑定'">
                  绑定
                </el-button>
              </template>
            </el-table-column>
          </el-table>
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
        <el-tab-pane label="绑定管理">
          <div class="search-bar">
            <el-input
              v-model="bindSearchQuery"
              placeholder="搜索设备序列号或Token"
              prefix-icon="el-icon-search"
              style="width: 300px; margin-right: 10px"
            />
            <el-button type="primary" @click="handleBindSearch">搜索</el-button>
          </div>
          <el-table :data="bindRecords" style="width: 100%" class="mt-4">
            <el-table-column prop="id" label="ID" width="80" />
            <el-table-column prop="token" label="Token" />
            <el-table-column prop="assetSerialNumber" label="设备序列号" />
            <el-table-column prop="assetModel" label="设备型号" />
            <el-table-column prop="customerName" label="客户名称" />
            <el-table-column prop="bindTime" label="绑定时间" width="180" />
            <el-table-column label="操作" width="150" fixed="right">
              <template #default="scope">
                <el-button type="primary" size="small" @click="handleViewBindDetail(scope.row)">
                  查看
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
        <el-tab-pane label="防伪验证">
          <div class="verify-container">
            <el-form :model="verifyForm" label-width="120px" class="mt-4">
              <el-form-item label="二维码Token">
                <el-input v-model="verifyForm.token" />
              </el-form-item>
              <el-form-item label="设备序列号">
                <el-input v-model="verifyForm.assetSerialNumber" />
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="handleVerify">验证</el-button>
              </el-form-item>
            </el-form>
            <div v-if="verifyResult" class="verify-result mt-4">
              <el-alert
                :title="verifyResult.status === 'valid' ? '验证通过' : '验证失败'"
                :type="verifyResult.status === 'valid' ? 'success' : 'error'"
                description="{{ verifyResult.message }}"
                show-icon
              />
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <!-- 批量生成空白码对话框 -->
    <el-dialog
      title="批量生成空白码"
      v-model="generateVisible"
      width="600px"
    >
      <el-form :model="generateForm" label-width="120px">
        <el-form-item label="生成数量">
          <el-input v-model.number="generateForm.count" type="number" min="1" max="1000" />
        </el-form-item>
        <el-form-item label="批次名称">
          <el-input v-model="generateForm.batchName" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="generateVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmitGenerate">确定</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 二维码查看对话框 -->
    <el-dialog
      title="二维码查看"
      v-model="viewVisible"
      width="400px"
    >
      <div class="qrcode-container">
        <img :src="currentQRCodeUrl" alt="二维码" class="qrcode-image" />
        <div class="qrcode-info">
          <p>Token: {{ currentQRCode.token }}</p>
          <p>状态: {{ currentQRCode.status }}</p>
          <p v-if="currentQRCode.bindAsset">绑定设备: {{ currentQRCode.bindAsset }}</p>
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="viewVisible = false">关闭</el-button>
          <el-button type="primary" @click="handleDownloadQRCode">下载</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 绑定设备对话框 -->
    <el-dialog
      title="绑定设备"
      v-model="bindVisible"
      width="600px"
    >
      <el-form :model="bindForm" label-width="120px">
        <el-form-item label="二维码Token">
          <el-input v-model="bindForm.token" readonly />
        </el-form-item>
        <el-form-item label="设备序列号">
          <el-select v-model="bindForm.assetSerialNumber">
            <el-option v-for="asset in assets" :key="asset.serialNumber" :label="asset.serialNumber" :value="asset.serialNumber" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="bindVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmitBind">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive } from 'vue'
import { Plus } from '@element-plus/icons-vue'

export default {
  name: 'QRCode',
  components: {
    Plus
  },
  setup() {
    const searchQuery = ref('')
    const qrcodeStatus = ref('')
    const currentPage = ref(1)
    const pageSize = ref(10)
    const total = ref(100)
    const generateVisible = ref(false)
    const viewVisible = ref(false)
    const bindVisible = ref(false)
    const currentQRCode = ref({})
    const currentQRCodeUrl = ref('')
    const generateForm = reactive({
      count: 10,
      batchName: ''
    })
    const bindForm = reactive({
      token: '',
      assetSerialNumber: ''
    })
    const verifyForm = reactive({
      token: '',
      assetSerialNumber: ''
    })
    const verifyResult = ref(null)

    // 绑定管理相关
    const bindSearchQuery = ref('')

    const qrcodes = ref([
      {
        id: 1,
        token: 'TOKEN001',
        status: '未绑定',
        bindAsset: '',
        createTime: '2026-03-01 10:00:00',
        bindTime: ''
      },
      {
        id: 2,
        token: 'TOKEN002',
        status: '已绑定',
        bindAsset: 'SN001',
        createTime: '2026-03-01 10:00:00',
        bindTime: '2026-03-02 14:00:00'
      },
      {
        id: 3,
        token: 'TOKEN003',
        status: '未绑定',
        bindAsset: '',
        createTime: '2026-03-01 10:00:00',
        bindTime: ''
      }
    ])

    const bindRecords = ref([
      {
        id: 1,
        token: 'TOKEN002',
        assetSerialNumber: 'SN001',
        assetModel: 'Model A',
        customerName: '上海某机械有限公司',
        bindTime: '2026-03-02 14:00:00'
      }
    ])

    const assets = ref([
      { serialNumber: 'SN001', model: 'Model A' },
      { serialNumber: 'SN002', model: 'Model B' },
      { serialNumber: 'SN003', model: 'Model C' }
    ])

    const handleGenerateBatch = () => {
      generateVisible.value = true
    }

    const handleSubmitGenerate = () => {
      // 模拟生成
      generateVisible.value = false
    }

    const handleViewQRCode = (row) => {
      currentQRCode.value = row
      currentQRCodeUrl.value = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${row.token}`
      viewVisible.value = true
    }

    const handleBindAsset = (row) => {
      bindForm.token = row.token
      bindVisible.value = true
    }

    const handleSubmitBind = () => {
      // 模拟绑定
      const index = qrcodes.value.findIndex(q => q.token === bindForm.token)
      if (index !== -1) {
        qrcodes.value[index].status = '已绑定'
        qrcodes.value[index].bindAsset = bindForm.assetSerialNumber
        qrcodes.value[index].bindTime = new Date().toLocaleString()
      }
      bindVisible.value = false
    }

    const handleDownloadQRCode = () => {
      // 模拟下载
      console.log('下载二维码')
    }

    const handleDownloadBatch = () => {
      // 模拟批量下载
      console.log('批量下载二维码')
    }

    const handleSearch = () => {
      // 模拟搜索
      console.log('搜索', searchQuery.value, qrcodeStatus.value)
    }

    const handleSizeChange = (size) => {
      pageSize.value = size
    }

    const handleCurrentChange = (current) => {
      currentPage.value = current
    }

    const handleBindSearch = () => {
      // 模拟搜索
      console.log('绑定记录搜索', bindSearchQuery.value)
    }

    const handleViewBindDetail = (row) => {
      // 模拟查看详情
      console.log('查看绑定详情', row)
    }

    const handleVerify = () => {
      // 模拟验证
      if (verifyForm.token && verifyForm.assetSerialNumber) {
        verifyResult.value = {
          status: 'valid',
          message: '验证通过，二维码与设备绑定关系正常'
        }
      } else {
        verifyResult.value = {
          status: 'invalid',
          message: '验证失败，二维码与设备绑定关系不存在'
        }
      }
    }

    return {
      searchQuery,
      qrcodeStatus,
      currentPage,
      pageSize,
      total,
      generateVisible,
      viewVisible,
      bindVisible,
      currentQRCode,
      currentQRCodeUrl,
      generateForm,
      bindForm,
      verifyForm,
      verifyResult,
      bindSearchQuery,
      qrcodes,
      bindRecords,
      assets,
      handleGenerateBatch,
      handleSubmitGenerate,
      handleViewQRCode,
      handleBindAsset,
      handleSubmitBind,
      handleDownloadQRCode,
      handleDownloadBatch,
      handleSearch,
      handleSizeChange,
      handleCurrentChange,
      handleBindSearch,
      handleViewBindDetail,
      handleVerify
    }
  }
}
</script>

<style scoped>
.qrcode {
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

.qrcode-image {
  width: 200px;
  height: 200px;
  margin-bottom: 20px;
}

.qrcode-info {
  text-align: center;
}

.verify-container {
  padding: 20px;
}

.verify-result {
  margin-top: 20px;
}
</style>