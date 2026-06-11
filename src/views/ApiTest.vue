<template>
  <div class="api-test">
    <h1>API 测试页面</h1>
    <p class="subtitle">用于测试后端API接口</p>

    <!-- 客户API测试 -->
    <el-card class="test-card">
      <template #header>
        <div class="card-header">
          <span>客户管理API测试</span>
          <el-button type="primary" @click="testCustomerApi" :loading="loading.customer">
            测试
          </el-button>
        </div>
      </template>
      <div class="test-result">
        <el-alert v-if="results.customer" :type="results.customer.success ? 'success' : 'error'" :closable="false">
          {{ results.customer.message }}
        </el-alert>
        <pre v-if="results.customer?.data">{{ JSON.stringify(results.customer.data, null, 2) }}</pre>
      </div>
    </el-card>

    <!-- 设备API测试 -->
    <el-card class="test-card">
      <template #header>
        <div class="card-header">
          <span>设备管理API测试</span>
          <el-button type="primary" @click="testAssetApi" :loading="loading.asset">
            测试
          </el-button>
        </div>
      </template>
      <div class="test-result">
        <el-alert v-if="results.asset" :type="results.asset.success ? 'success' : 'error'" :closable="false">
          {{ results.asset.message }}
        </el-alert>
        <pre v-if="results.asset?.data">{{ JSON.stringify(results.asset.data, null, 2) }}</pre>
      </div>
    </el-card>

    <!-- 工单API测试 -->
    <el-card class="test-card">
      <template #header>
        <div class="card-header">
          <span>工单管理API测试</span>
          <el-button type="primary" @click="testWorkorderApi" :loading="loading.workorder">
            测试
          </el-button>
        </div>
      </template>
      <div class="test-result">
        <el-alert v-if="results.workorder" :type="results.workorder.success ? 'success' : 'error'" :closable="false">
          {{ results.workorder.message }}
        </el-alert>
        <pre v-if="results.workorder?.data">{{ JSON.stringify(results.workorder.data, null, 2) }}</pre>
      </div>
    </el-card>

    <!-- 员工API测试 -->
    <el-card class="test-card">
      <template #header>
        <div class="card-header">
          <span>员工管理API测试</span>
          <el-button type="primary" @click="testEmployeeApi" :loading="loading.employee">
            测试
          </el-button>
        </div>
      </template>
      <div class="test-result">
        <el-alert v-if="results.employee" :type="results.employee.success ? 'success' : 'error'" :closable="false">
          {{ results.employee.message }}
        </el-alert>
        <pre v-if="results.employee?.data">{{ JSON.stringify(results.employee.data, null, 2) }}</pre>
      </div>
    </el-card>

    <!-- 配件API测试 -->
    <el-card class="test-card">
      <template #header>
        <div class="card-header">
          <span>配件管理API测试</span>
          <el-button type="primary" @click="testPartsApi" :loading="loading.parts">
            测试
          </el-button>
        </div>
      </template>
      <div class="test-result">
        <el-alert v-if="results.parts" :type="results.parts.success ? 'success' : 'error'" :closable="false">
          {{ results.parts.message }}
        </el-alert>
        <pre v-if="results.parts?.data">{{ JSON.stringify(results.parts.data, null, 2) }}</pre>
      </div>
    </el-card>

    <!-- 报价API测试 -->
    <el-card class="test-card">
      <template #header>
        <div class="card-header">
          <span>报价管理API测试</span>
          <el-button type="primary" @click="testQuotationApi" :loading="loading.quotation">
            测试
          </el-button>
        </div>
      </template>
      <div class="test-result">
        <el-alert v-if="results.quotation" :type="results.quotation.success ? 'success' : 'error'" :closable="false">
          {{ results.quotation.message }}
        </el-alert>
        <pre v-if="results.quotation?.data">{{ JSON.stringify(results.quotation.data, null, 2) }}</pre>
      </div>
    </el-card>

    <!-- 批量测试 -->
    <el-card class="test-card">
      <template #header>
        <div class="card-header">
          <span>批量测试所有API</span>
          <el-button type="success" @click="testAllApis" :loading="loading.all">
            全部测试
          </el-button>
        </div>
      </template>
      <div class="test-summary">
        <p>点击"全部测试"按钮测试所有API接口</p>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { customerApi } from '../api/customerApi.js'
import { assetApi } from '../api/assetApi.js'
import { workorderApi } from '../api/workorderApi.js'
import { employeeApi } from '../api/employeeApi.js'
import { partsApi } from '../api/partsApi.js'
import { quotationApi } from '../api/quotationApi.js'

const loading = reactive({
  customer: false,
  asset: false,
  workorder: false,
  employee: false,
  parts: false,
  quotation: false,
  all: false
})

const results = reactive({
  customer: null,
  asset: null,
  workorder: null,
  employee: null,
  parts: null,
  quotation: null
})

// 测试客户API
const testCustomerApi = async () => {
  loading.customer = true
  try {
    const data = await customerApi.getList({ page: 1, pageSize: 5 })
    results.customer = {
      success: true,
      message: `获取成功，共 ${data.total} 条数据`,
      data: data.list.slice(0, 2) // 只显示前2条
    }
    ElMessage.success('客户API测试通过')
  } catch (error) {
    results.customer = {
      success: false,
      message: error.message || '请求失败',
      data: null
    }
    ElMessage.error('客户API测试失败')
  } finally {
    loading.customer = false
  }
}

// 测试设备API
const testAssetApi = async () => {
  loading.asset = true
  try {
    const data = await assetApi.getList({ page: 1, pageSize: 5 })
    results.asset = {
      success: true,
      message: `获取成功，共 ${data.total} 条数据`,
      data: data.list.slice(0, 2)
    }
    ElMessage.success('设备API测试通过')
  } catch (error) {
    results.asset = {
      success: false,
      message: error.message || '请求失败',
      data: null
    }
    ElMessage.error('设备API测试失败')
  } finally {
    loading.asset = false
  }
}

// 测试工单API
const testWorkorderApi = async () => {
  loading.workorder = true
  try {
    const data = await workorderApi.getList({ page: 1, pageSize: 5 })
    results.workorder = {
      success: true,
      message: `获取成功，共 ${data.total} 条数据`,
      data: data.list.slice(0, 2)
    }
    ElMessage.success('工单API测试通过')
  } catch (error) {
    results.workorder = {
      success: false,
      message: error.message || '请求失败',
      data: null
    }
    ElMessage.error('工单API测试失败')
  } finally {
    loading.workorder = false
  }
}

// 测试员工API
const testEmployeeApi = async () => {
  loading.employee = true
  try {
    const data = await employeeApi.getList({ page: 1, pageSize: 5 })
    results.employee = {
      success: true,
      message: `获取成功，共 ${data.total} 条数据`,
      data: data.list.slice(0, 2)
    }
    ElMessage.success('员工API测试通过')
  } catch (error) {
    results.employee = {
      success: false,
      message: error.message || '请求失败',
      data: null
    }
    ElMessage.error('员工API测试失败')
  } finally {
    loading.employee = false
  }
}

// 测试配件API
const testPartsApi = async () => {
  loading.parts = true
  try {
    const data = await partsApi.getList({ page: 1, pageSize: 5 })
    results.parts = {
      success: true,
      message: `获取成功，共 ${data.total} 条数据`,
      data: data.list.slice(0, 2)
    }
    ElMessage.success('配件API测试通过')
  } catch (error) {
    results.parts = {
      success: false,
      message: error.message || '请求失败',
      data: null
    }
    ElMessage.error('配件API测试失败')
  } finally {
    loading.parts = false
  }
}

// 测试报价API
const testQuotationApi = async () => {
  loading.quotation = true
  try {
    const data = await quotationApi.getList({ page: 1, pageSize: 5 })
    results.quotation = {
      success: true,
      message: `获取成功，共 ${data.total} 条数据`,
      data: data.list.slice(0, 2)
    }
    ElMessage.success('报价API测试通过')
  } catch (error) {
    results.quotation = {
      success: false,
      message: error.message || '请求失败',
      data: null
    }
    ElMessage.error('报价API测试失败')
  } finally {
    loading.quotation = false
  }
}

// 测试所有API
const testAllApis = async () => {
  loading.all = true
  await Promise.all([
    testCustomerApi(),
    testAssetApi(),
    testWorkorderApi(),
    testEmployeeApi(),
    testPartsApi(),
    testQuotationApi()
  ])
  loading.all = false
  
  const successCount = Object.values(results).filter(r => r?.success).length
  ElMessage.success(`测试完成，${successCount}/6 个API通过`)
}
</script>

<style scoped>
.api-test {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

h1 {
  text-align: center;
  margin-bottom: 10px;
  color: #303133;
}

.subtitle {
  text-align: center;
  color: #909399;
  margin-bottom: 30px;
}

.test-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.test-result {
  margin-top: 15px;
}

.test-result pre {
  background: #f5f7fa;
  padding: 15px;
  border-radius: 4px;
  overflow-x: auto;
  font-size: 12px;
  margin-top: 10px;
  max-height: 300px;
  overflow-y: auto;
}

.test-summary {
  color: #606266;
}
</style>
