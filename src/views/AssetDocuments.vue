<template>
  <div class="asset-documents">
    <!-- 顶部导航 -->
    <div class="page-header">
      <div class="header-left">
        <el-button link @click="goBack">
          <el-icon><ArrowLeft /></el-icon>
          <span>返回</span>
        </el-button>
        <span class="header-title">设备资料管理</span>
      </div>
      <div class="header-right" v-if="isStaffUser">
        <el-button type="primary" @click="showUploadDialog = true">
          <el-icon><Plus /></el-icon>
          <span>添加资料</span>
        </el-button>
      </div>
    </div>

    <!-- 设备信息卡片 -->
    <div class="device-info-card" v-if="deviceInfo">
      <div class="device-header">
        <div class="device-icon">
          <el-icon><Monitor /></el-icon>
        </div>
        <div class="device-title">
          <h3>{{ deviceInfo.model }}</h3>
          <p class="device-sn">序列号: {{ deviceInfo.serialNumber }}</p>
        </div>
      </div>
    </div>

    <!-- 资料列表 -->
    <div class="documents-content">
      <el-card class="documents-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <div class="header-title-section">
              <el-icon><Document /></el-icon>
              <span>资料清单</span>
              <el-tag type="info" size="small" style="margin-left: 8px;">{{ documents.length }} 个文件</el-tag>
            </div>
            <el-radio-group v-model="viewMode" size="small">
              <el-radio-button value="grid">
                <el-icon><Grid /></el-icon>
              </el-radio-button>
              <el-radio-button value="list">
                <el-icon><List /></el-icon>
              </el-radio-button>
            </el-radio-group>
          </div>
        </template>

        <!-- 空状态 -->
        <el-empty v-if="documents.length === 0" description="暂无资料文件">
          <template #description>
            <p>该设备暂无相关资料</p>
            <p v-if="isStaffUser" style="font-size: 12px; color: #909399; margin-top: 8px;">点击右上角"添加资料"按钮上传文件</p>
          </template>
        </el-empty>

        <!-- 网格视图 -->
        <div v-else-if="viewMode === 'grid'" class="documents-grid">
          <div
            v-for="doc in documents"
            :key="doc.id"
            class="document-card"
            @click="previewDocument(doc)"
          >
            <div class="document-icon" :class="getFileIconClass(doc.fileType)">
              <el-icon size="40">
                <component :is="getFileIcon(doc.fileType)" />
              </el-icon>
            </div>
            <div class="document-info">
              <h4 class="document-name" :title="doc.name">{{ doc.name }}</h4>
              <p class="document-meta">{{ formatFileSize(doc.size) }} · {{ formatDate(doc.uploadTime) }}</p>
              <p class="document-uploader">上传者: {{ doc.uploader }}</p>
            </div>
            <div class="document-actions" v-if="isStaffUser" @click.stop>
              <el-dropdown trigger="click">
                <el-button link>
                  <el-icon><MoreFilled /></el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item @click="downloadDocument(doc)">
                      <el-icon><Download /></el-icon>下载
                    </el-dropdown-item>
                    <el-dropdown-item @click="previewDocument(doc)">
                      <el-icon><View /></el-icon>预览
                    </el-dropdown-item>
                    <el-dropdown-item divided type="danger" @click="deleteDocument(doc)">
                      <el-icon><Delete /></el-icon>删除
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
            <div class="document-actions" v-else @click.stop>
              <el-button link @click="downloadDocument(doc)">
                <el-icon><Download /></el-icon>
              </el-button>
            </div>
          </div>
        </div>

        <!-- 列表视图 -->
        <div v-else class="documents-list">
          <div
            v-for="doc in documents"
            :key="doc.id"
            class="document-list-item"
            @click="previewDocument(doc)"
          >
            <div class="list-icon" :class="getFileIconClass(doc.fileType)">
              <el-icon size="24">
                <component :is="getFileIcon(doc.fileType)" />
              </el-icon>
            </div>
            <div class="list-info">
              <h4 class="list-name">{{ doc.name }}</h4>
              <p class="list-meta">{{ formatFileSize(doc.size) }} · {{ formatDate(doc.uploadTime) }} · 上传者: {{ doc.uploader }}</p>
            </div>
            <div class="list-actions" v-if="isStaffUser" @click.stop>
              <el-button link @click="downloadDocument(doc)">
                <el-icon><Download /></el-icon>
              </el-button>
              <el-button link @click="previewDocument(doc)">
                <el-icon><View /></el-icon>
              </el-button>
              <el-button link type="danger" @click="deleteDocument(doc)">
                <el-icon><Delete /></el-icon>
              </el-button>
            </div>
            <div class="list-actions" v-else @click.stop>
              <el-button link @click="downloadDocument(doc)">
                <el-icon><Download /></el-icon>
              </el-button>
            </div>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 上传对话框 -->
    <el-dialog
      v-model="showUploadDialog"
      title="添加资料"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form :model="uploadForm" label-position="top">
        <el-form-item label="文件名称" required>
          <el-input v-model="uploadForm.name" placeholder="请输入文件名称" />
        </el-form-item>
        <el-form-item label="文件类型" required>
          <el-select v-model="uploadForm.fileType" placeholder="请选择文件类型" style="width: 100%">
            <el-option label="PDF文档" value="pdf" />
            <el-option label="Excel表格" value="excel" />
            <el-option label="Word文档" value="word" />
            <el-option label="图片" value="image" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="选择文件" required>
          <el-upload
            ref="uploadRef"
            action="#"
            :auto-upload="false"
            :on-change="handleFileChange"
            :limit="1"
            drag
          >
            <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
            <div class="el-upload__text">
              拖拽文件到此处或 <em>点击上传</em>
            </div>
            <template #tip>
              <div class="el-upload__tip">
                支持 PDF、Excel、Word、图片等格式，单个文件不超过 50MB
              </div>
            </template>
          </el-upload>
        </el-form-item>
        <el-form-item label="备注说明">
          <el-input
            v-model="uploadForm.remark"
            type="textarea"
            :rows="3"
            placeholder="请输入备注说明（可选）"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showUploadDialog = false">取消</el-button>
        <el-button type="primary" @click="submitUpload" :loading="uploading">
          确认上传
        </el-button>
      </template>
    </el-dialog>

    <!-- 预览对话框 -->
    <el-dialog
      v-model="showPreviewDialog"
      title="文件预览"
      width="80%"
      :fullscreen="previewFullscreen"
    >
      <div class="preview-content">
        <div v-if="currentDocument" class="preview-info">
          <h3>{{ currentDocument.name }}</h3>
          <p>类型: {{ currentDocument.fileType }} | 大小: {{ formatFileSize(currentDocument.size) }} | 上传时间: {{ formatDate(currentDocument.uploadTime) }}</p>
        </div>
        <div class="preview-area">
          <!-- PDF 预览 -->
          <iframe
            v-if="currentDocument?.fileType === 'pdf'"
            :src="currentDocument?.url"
            class="preview-frame"
          ></iframe>
          <!-- 图片预览 -->
          <img
            v-else-if="currentDocument?.fileType === 'image'"
            :src="currentDocument?.url"
            class="preview-image"
            alt="预览图片"
          />
          <!-- 其他文件 -->
          <div v-else class="preview-other">
            <el-icon size="64" color="#909399"><Document /></el-icon>
            <p>该文件类型暂不支持在线预览</p>
            <el-button type="primary" @click="downloadDocument(currentDocument)">
              <el-icon><Download /></el-icon>下载查看
            </el-button>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  ArrowLeft,
  Monitor,
  Document,
  Plus,
  Grid,
  List,
  MoreFilled,
  Download,
  View,
  Delete,
  UploadFilled,
  DocumentChecked,
  DocumentCopy,
  Picture,
  Files
} from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()

// 设备信息
const deviceInfo = ref({
  serialNumber: '',
  model: ''
})

// 是否职员用户（控制编辑权限）
const isStaffUser = computed(() => {
  try {
    const staffAuth = JSON.parse(localStorage.getItem('staffAuth') || '{}')
    return staffAuth.role && staffAuth.role !== 'customer'
  } catch (e) {
    return false
  }
})

// 资料列表
const documents = ref([])

// 视图模式
const viewMode = ref('grid')

// 上传对话框
const showUploadDialog = ref(false)
const uploading = ref(false)
const uploadRef = ref(null)
const uploadForm = ref({
  name: '',
  fileType: '',
  remark: '',
  file: null
})

// 预览对话框
const showPreviewDialog = ref(false)
const previewFullscreen = ref(false)
const currentDocument = ref(null)

// 返回上一页
const goBack = () => {
  router.back()
}

// 获取文件图标
const getFileIcon = (fileType) => {
  const iconMap = {
    'pdf': Document,
    'excel': DocumentCopy,
    'word': DocumentChecked,
    'image': Picture,
    'other': Files
  }
  return iconMap[fileType] || Files
}

// 获取文件图标样式类
const getFileIconClass = (fileType) => {
  const classMap = {
    'pdf': 'file-pdf',
    'excel': 'file-excel',
    'word': 'file-word',
    'image': 'file-image',
    'other': 'file-other'
  }
  return classMap[fileType] || 'file-other'
}

// 格式化文件大小
const formatFileSize = (size) => {
  if (!size) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  let index = 0
  while (size >= 1024 && index < units.length - 1) {
    size /= 1024
    index++
  }
  return size.toFixed(2) + ' ' + units[index]
}

// 格式化日期
const formatDate = (date) => {
  if (!date) return '-'
  const d = new Date(date)
  return d.toLocaleDateString('zh-CN')
}

// 加载资料列表
const loadDocuments = () => {
  try {
    const allDocuments = JSON.parse(localStorage.getItem('assetDocuments') || '{}')
    const deviceDocs = allDocuments[deviceInfo.value.serialNumber] || []
    documents.value = deviceDocs.sort((a, b) => new Date(b.uploadTime) - new Date(a.uploadTime))
  } catch (e) {
    console.error('加载资料失败:', e)
    documents.value = []
  }
}

// 文件选择变化
const handleFileChange = (file) => {
  uploadForm.value.file = file.raw
  // 自动识别文件类型
  const ext = file.name.split('.').pop().toLowerCase()
  if (ext === 'pdf') {
    uploadForm.value.fileType = 'pdf'
  } else if (['xls', 'xlsx'].includes(ext)) {
    uploadForm.value.fileType = 'excel'
  } else if (['doc', 'docx'].includes(ext)) {
    uploadForm.value.fileType = 'word'
  } else if (['jpg', 'jpeg', 'png', 'gif'].includes(ext)) {
    uploadForm.value.fileType = 'image'
  } else {
    uploadForm.value.fileType = 'other'
  }
  // 如果没有填写名称，使用文件名
  if (!uploadForm.value.name) {
    uploadForm.value.name = file.name.replace(/\.[^/.]+$/, '')
  }
}

// 提交上传
const submitUpload = () => {
  if (!uploadForm.value.name) {
    ElMessage.warning('请输入文件名称')
    return
  }
  if (!uploadForm.value.fileType) {
    ElMessage.warning('请选择文件类型')
    return
  }
  if (!uploadForm.value.file) {
    ElMessage.warning('请选择要上传的文件')
    return
  }

  uploading.value = true

  // 读取文件为 base64
  const reader = new FileReader()
  reader.onload = (e) => {
    const documentData = {
      id: 'DOC_' + Date.now(),
      name: uploadForm.value.name,
      fileType: uploadForm.value.fileType,
      size: uploadForm.value.file.size,
      url: e.target.result,
      remark: uploadForm.value.remark,
      uploader: getCurrentUserName(),
      uploadTime: new Date().toISOString()
    }

    // 保存到 localStorage
    try {
      const allDocuments = JSON.parse(localStorage.getItem('assetDocuments') || '{}')
      if (!allDocuments[deviceInfo.value.serialNumber]) {
        allDocuments[deviceInfo.value.serialNumber] = []
      }
      allDocuments[deviceInfo.value.serialNumber].push(documentData)
      localStorage.setItem('assetDocuments', JSON.stringify(allDocuments))

      ElMessage.success('上传成功')
      showUploadDialog.value = false
      resetUploadForm()
      loadDocuments()
    } catch (err) {
      console.error('保存失败:', err)
      ElMessage.error('保存失败')
    }

    uploading.value = false
  }
  reader.readAsDataURL(uploadForm.value.file)
}

// 获取当前用户名
const getCurrentUserName = () => {
  try {
    const staffAuth = JSON.parse(localStorage.getItem('staffAuth') || '{}')
    return staffAuth.name || staffAuth.username || '未知用户'
  } catch (e) {
    return '未知用户'
  }
}

// 重置上传表单
const resetUploadForm = () => {
  uploadForm.value = {
    name: '',
    fileType: '',
    remark: '',
    file: null
  }
  if (uploadRef.value) {
    uploadRef.value.clearFiles()
  }
}

// 预览文档
const previewDocument = (doc) => {
  currentDocument.value = doc
  showPreviewDialog.value = true
}

// 下载文档
const downloadDocument = (doc) => {
  if (!doc.url) {
    ElMessage.warning('文件不存在')
    return
  }
  const link = document.createElement('a')
  link.href = doc.url
  link.download = doc.name + '.' + getFileExtension(doc.fileType)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

// 获取文件扩展名
const getFileExtension = (fileType) => {
  const extMap = {
    'pdf': 'pdf',
    'excel': 'xlsx',
    'word': 'docx',
    'image': 'png',
    'other': 'txt'
  }
  return extMap[fileType] || 'txt'
}

// 删除文档
const deleteDocument = (doc) => {
  ElMessageBox.confirm(
    `确定要删除文件 "${doc.name}" 吗？`,
    '确认删除',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    try {
      const allDocuments = JSON.parse(localStorage.getItem('assetDocuments') || '{}')
      if (allDocuments[deviceInfo.value.serialNumber]) {
        allDocuments[deviceInfo.value.serialNumber] = allDocuments[deviceInfo.value.serialNumber].filter(
          d => d.id !== doc.id
        )
        localStorage.setItem('assetDocuments', JSON.stringify(allDocuments))
        ElMessage.success('删除成功')
        loadDocuments()
      }
    } catch (e) {
      console.error('删除失败:', e)
      ElMessage.error('删除失败')
    }
  }).catch(() => {})
}

onMounted(() => {
  // 获取路由参数
  const serialNumber = route.query.serial
  const model = route.query.model

  if (serialNumber) {
    deviceInfo.value.serialNumber = serialNumber
  }
  if (model) {
    deviceInfo.value.model = decodeURIComponent(model)
  }

  // 加载资料列表
  loadDocuments()
})
</script>

<style scoped>
.asset-documents {
  min-height: 100vh;
  background: #f5f7fa;
  padding-bottom: 20px;
}

/* 顶部导航 */
.page-header {
  background: white;
  padding: 12px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #e8e8e8;
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-title {
  font-size: 17px;
  font-weight: 500;
  color: #262626;
}

/* 设备信息卡片 */
.device-info-card {
  background: white;
  margin: 15px;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.device-header {
  display: flex;
  align-items: center;
  gap: 15px;
}

.device-icon {
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 30px;
}

.device-title {
  flex: 1;
}

.device-title h3 {
  margin: 0 0 6px;
  font-size: 18px;
  color: #262626;
}

.device-sn {
  margin: 0;
  font-size: 13px;
  color: #8c8c8c;
  font-family: monospace;
}

/* 资料内容 */
.documents-content {
  margin: 15px;
}

.documents-card {
  border-radius: 12px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-title-section {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #303133;
}

/* 网格视图 */
.documents-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}

.document-card {
  background: #fafafa;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.3s;
  position: relative;
}

.document-card:hover {
  border-color: #1890ff;
  box-shadow: 0 2px 8px rgba(24, 144, 255, 0.15);
}

.document-icon {
  width: 60px;
  height: 60px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
}

.file-pdf { background: #fff1f0; color: #ff4d4f; }
.file-excel { background: #f6ffed; color: #52c41a; }
.file-word { background: #e6f7ff; color: #1890ff; }
.file-image { background: #fff7e6; color: #fa8c16; }
.file-other { background: #f5f5f5; color: #8c8c8c; }

.document-info {
  margin-bottom: 8px;
}

.document-name {
  margin: 0 0 6px;
  font-size: 14px;
  color: #262626;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.document-meta {
  margin: 0 0 4px;
  font-size: 12px;
  color: #8c8c8c;
}

.document-uploader {
  margin: 0;
  font-size: 11px;
  color: #bfbfbf;
}

.document-actions {
  position: absolute;
  top: 8px;
  right: 8px;
}

/* 列表视图 */
.documents-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.document-list-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #fafafa;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
}

.document-list-item:hover {
  border-color: #1890ff;
  background: #f0f7ff;
}

.list-icon {
  width: 40px;
  height: 40px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.list-info {
  flex: 1;
  min-width: 0;
}

.list-name {
  margin: 0 0 4px;
  font-size: 14px;
  color: #262626;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.list-meta {
  margin: 0;
  font-size: 12px;
  color: #8c8c8c;
}

.list-actions {
  display: flex;
  gap: 4px;
}

/* 预览对话框 */
.preview-content {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.preview-info {
  padding: 16px;
  background: #f5f7fa;
  border-bottom: 1px solid #e8e8e8;
}

.preview-info h3 {
  margin: 0 0 8px;
  font-size: 16px;
  color: #262626;
}

.preview-info p {
  margin: 0;
  font-size: 13px;
  color: #8c8c8c;
}

.preview-area {
  flex: 1;
  padding: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fafafa;
  min-height: 400px;
}

.preview-frame {
  width: 100%;
  height: 600px;
  border: none;
}

.preview-image {
  max-width: 100%;
  max-height: 600px;
  object-fit: contain;
}

.preview-other {
  text-align: center;
  color: #8c8c8c;
}

.preview-other p {
  margin: 16px 0;
}

/* 响应式适配 */
@media (max-width: 768px) {
  .documents-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 480px) {
  .documents-grid {
    grid-template-columns: 1fr;
  }

  .page-header {
    flex-wrap: wrap;
    gap: 10px;
  }

  .header-right {
    width: 100%;
  }

  .header-right .el-button {
    width: 100%;
  }
}
</style>
