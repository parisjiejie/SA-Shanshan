<template>
  <div class="tianyancha-test">
    <el-card class="test-card">
      <template #header>
        <div class="card-header">
          <h2>天眼查API测试</h2>
          <el-tag v-if="configLoaded" :type="enabled ? 'success' : 'info'">
            {{ enabled ? '已启用' : '未启用' }}
          </el-tag>
        </div>
      </template>

      <!-- 配置信息 -->
      <el-descriptions title="配置信息" :column="2" border v-if="configLoaded">
        <el-descriptions-item label="API Key">
          {{ apiKey ? apiKey.substring(0, 8) + '...' : '未配置' }}
        </el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="enabled ? 'success' : 'info'">
            {{ enabled ? '已启用' : '未启用' }}
          </el-tag>
        </el-descriptions-item>
      </el-descriptions>

      <!-- 企业搜索测试 -->
      <div class="test-section">
        <h3>1. 企业搜索</h3>
        <el-form :inline="true" @submit.prevent="testSearch">
          <el-form-item>
            <el-input
              v-model="searchKeyword"
              placeholder="输入企业名称"
              style="width: 300px"
              @keyup.enter="testSearch"
            />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="testSearch" :loading="searchLoading">
              搜索
            </el-button>
          </el-form-item>
        </el-form>

        <!-- 搜索结果 -->
        <div v-if="searchResult" class="result-section">
          <el-alert
            :title="searchSuccess ? '搜索成功' : '搜索失败'"
            :type="searchSuccess ? 'success' : 'error'"
            :closable="false"
            show-icon
          />
          <pre class="json-result">{{ formatJson(searchResult) }}</pre>
        </div>
      </div>

      <el-divider />

      <!-- 企业详情测试 -->
      <div class="test-section">
        <h3>2. 企业详情</h3>
        <el-form :inline="true" @submit.prevent="testDetail">
          <el-form-item>
            <el-input
              v-model="detailName"
              placeholder="输入企业全称"
              style="width: 300px"
              @keyup.enter="testDetail"
            />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="testDetail" :loading="detailLoading">
              查询详情
            </el-button>
          </el-form-item>
        </el-form>

        <!-- 详情结果 -->
        <div v-if="detailResult" class="result-section">
          <el-alert
            :title="detailSuccess ? '查询成功' : '查询失败'"
            :type="detailSuccess ? 'success' : 'error'"
            :closable="false"
            show-icon
          />
          <pre class="json-result">{{ formatJson(detailResult) }}</pre>
        </div>
      </div>

      <!-- 使用说明 -->
      <el-divider />
      <div class="test-section">
        <h3>使用说明</h3>
        <el-alert
          title="测试步骤"
          type="info"
          :closable="false"
        >
          <template #default>
            <ol>
              <li>确保后端服务已启动（端口8080）</li>
              <li>在上方输入框中输入企业名称</li>
              <li>点击"搜索"或"查询详情"按钮</li>
              <li>查看返回的JSON结果</li>
            </ol>
          </template>
        </el-alert>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import { ElMessage } from 'element-plus'

// 配置信息
const configLoaded = ref(false)
const enabled = ref(false)
const apiKey = ref('')

// 搜索相关
const searchKeyword = ref('阿里巴巴')
const searchLoading = ref(false)
const searchResult = ref(null)
const searchSuccess = ref(false)

// 详情相关
const detailName = ref('阿里巴巴（中国）有限公司')
const detailLoading = ref(false)
const detailResult = ref(null)
const detailSuccess = ref(false)

// API基础URL
const API_BASE = '/api'

// 页面加载时获取配置
onMounted(async () => {
  try {
    // 这里可以通过一个接口获取配置状态
    // 暂时假设配置正确
    configLoaded.value = true
    enabled.value = true
    apiKey.value = '已配置'
  } catch (error) {
    console.error('获取配置失败:', error)
  }
})

// 测试企业搜索
const testSearch = async () => {
  if (!searchKeyword.value) {
    ElMessage.warning('请输入企业名称')
    return
  }

  searchLoading.value = true
  searchResult.value = null

  try {
    const response = await axios.post(`${API_BASE}/third-party/tianyancha/search`, {
      keyword: searchKeyword.value,
      pageNum: 1,
      pageSize: 10
    })

    searchResult.value = response.data
    searchSuccess.value = response.data.code === 200

    if (searchSuccess.value) {
      ElMessage.success('搜索成功')
    } else {
      ElMessage.error(response.data.message || '搜索失败')
    }
  } catch (error) {
    console.error('搜索失败:', error)
    searchResult.value = {
      error: error.message,
      response: error.response?.data
    }
    searchSuccess.value = false
    ElMessage.error('请求失败: ' + (error.response?.data?.message || error.message))
  } finally {
    searchLoading.value = false
  }
}

// 测试企业详情
const testDetail = async () => {
  if (!detailName.value) {
    ElMessage.warning('请输入企业全称')
    return
  }

  detailLoading.value = true
  detailResult.value = null

  try {
    const response = await axios.post(`${API_BASE}/third-party/tianyancha/detail`, {
      name: detailName.value
    })

    detailResult.value = response.data
    detailSuccess.value = response.data.code === 200

    if (detailSuccess.value) {
      ElMessage.success('查询成功')
    } else {
      ElMessage.error(response.data.message || '查询失败')
    }
  } catch (error) {
    console.error('查询失败:', error)
    detailResult.value = {
      error: error.message,
      response: error.response?.data
    }
    detailSuccess.value = false
    ElMessage.error('请求失败: ' + (error.response?.data?.message || error.message))
  } finally {
    detailLoading.value = false
  }
}

// 格式化JSON
const formatJson = (data) => {
  try {
    return JSON.stringify(data, null, 2)
  } catch {
    return String(data)
  }
}
</script>

<style scoped>
.tianyancha-test {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.test-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h2 {
  margin: 0;
}

.test-section {
  margin: 20px 0;
}

.test-section h3 {
  margin-bottom: 15px;
  color: #303133;
}

.result-section {
  margin-top: 15px;
}

.json-result {
  background-color: #f5f7fa;
  padding: 15px;
  border-radius: 4px;
  overflow-x: auto;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  line-height: 1.5;
  max-height: 400px;
  overflow-y: auto;
}
</style>
