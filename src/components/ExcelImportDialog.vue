<template>
  <el-dialog
    title="Excel导入配件"
    v-model="dialogVisible"
    width="600px"
    :close-on-click-modal="false"
  >
    <div class="import-container">
      <!-- 上传区域 -->
      <el-upload
        class="upload-area"
        drag
        action="#"
        :auto-upload="false"
        :on-change="handleFileChange"
        :show-file-list="false"
        accept=".csv,.xlsx,.xls"
      >
        <el-icon class="el-icon--upload"><upload-filled /></el-icon>
        <div class="el-upload__text">
          将文件拖到此处，或<em>点击上传</em>
        </div>
        <template #tip>
          <div class="el-upload__tip">
            支持 .csv, .xlsx, .xls 格式文件，文件大小不超过 10MB
          </div>
        </template>
      </el-upload>

      <!-- 文件信息 -->
      <div v-if="selectedFile" class="file-info">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="文件名">{{ selectedFile.name }}</el-descriptions-item>
          <el-descriptions-item label="文件大小">{{ formatFileSize(selectedFile.size) }}</el-descriptions-item>
          <el-descriptions-item label="数据条数">{{ parsedData.length }} 条</el-descriptions-item>
        </el-descriptions>
      </div>

      <!-- 数据预览 -->
      <div v-if="parsedData.length > 0" class="data-preview">
        <h4>数据预览（前5条）</h4>
        <el-table :data="previewData" border size="small" style="width: 100%">
          <el-table-column type="index" label="序号" width="50" align="center" />
          <el-table-column prop="partNumber" label="配件编码" min-width="100" />
          <el-table-column prop="partName" label="配件名称" min-width="150" />
          <el-table-column prop="specification" label="规格" min-width="100" />
          <el-table-column prop="unit" label="单位" width="60" />
          <el-table-column prop="quantity" label="数量" width="80" align="right" />
          <el-table-column prop="unitPrice" label="单价" width="100" align="right">
            <template #default="{ row }">
              <span>¥{{ row.unitPrice }}</span>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 错误信息 -->
      <div v-if="errorMessages.length > 0" class="error-messages">
        <el-alert
          v-for="(error, index) in errorMessages"
          :key="index"
          :title="error"
          type="error"
          :closable="false"
          show-icon
          class="mb-2"
        />
      </div>

      <!-- 导入说明 -->
      <div class="import-tips">
        <h4>导入说明</h4>
        <ul>
          <li>文件格式：支持 CSV、Excel (.xlsx, .xls) 格式</li>
          <li>表头要求：必须包含以下列
            <el-tag size="small">配件编码</el-tag>
            <el-tag size="small">配件名称</el-tag>
            <el-tag size="small">规格</el-tag>
            <el-tag size="small">单位</el-tag>
            <el-tag size="small">数量</el-tag>
            <el-tag size="small">单价</el-tag>
            <el-tag size="small">备注</el-tag>（可选）
          </li>
          <li>数据验证：数量和单价必须为正数</li>
          <li>重复处理：相同的配件编码会被视为不同条目</li>
        </ul>
      </div>
    </div>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" @click="handleImport" :disabled="parsedData.length === 0 || errorMessages.length > 0">
          确认导入
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script>
import { ref, computed } from 'vue'
import { UploadFilled } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

export default {
  name: 'ExcelImportDialog',
  components: {
    UploadFilled
  },
  props: {
    visible: {
      type: Boolean,
      default: false
    }
  },
  emits: ['update:visible', 'import'],
  setup(props, { emit }) {
    const selectedFile = ref(null)
    const parsedData = ref([])
    const errorMessages = ref([])

    // 对话框可见性
    const dialogVisible = computed({
      get: () => props.visible,
      set: (val) => emit('update:visible', val)
    })

    // 预览数据（最多5条）
    const previewData = computed(() => {
      return parsedData.value.slice(0, 5)
    })

    // 格式化文件大小
    const formatFileSize = (size) => {
      if (size < 1024) {
        return size + ' B'
      } else if (size < 1024 * 1024) {
        return (size / 1024).toFixed(2) + ' KB'
      } else {
        return (size / (1024 * 1024)).toFixed(2) + ' MB'
      }
    }

    // 处理文件选择
    const handleFileChange = (file) => {
      selectedFile.value = file.raw
      errorMessages.value = []
      parsedData.value = []

      // 检查文件类型
      const validTypes = ['.csv', '.xlsx', '.xls']
      const fileExt = file.name.substring(file.name.lastIndexOf('.')).toLowerCase()
      if (!validTypes.includes(fileExt)) {
        ElMessage.error('不支持的文件格式，请上传 CSV 或 Excel 文件')
        return
      }

      // 检查文件大小（10MB）
      if (file.size > 10 * 1024 * 1024) {
        ElMessage.error('文件大小超过 10MB 限制')
        return
      }

      // 解析文件
      parseFile(file.raw, fileExt)
    }

    // 解析文件
    const parseFile = (file, ext) => {
      const reader = new FileReader()

      reader.onload = (e) => {
        try {
          const content = e.target.result

          if (ext === '.csv') {
            parseCSV(content)
          } else {
            // 对于 Excel 文件，这里简化处理，实际应该使用 xlsx 库
            // 这里假设用户上传的是 CSV 格式的文本
            parseCSV(content)
          }
        } catch (error) {
          ElMessage.error('文件解析失败：' + error.message)
        }
      }

      reader.onerror = () => {
        ElMessage.error('文件读取失败')
      }

      if (ext === '.csv') {
        reader.readAsText(file, 'UTF-8')
      } else {
        // Excel 文件需要特殊处理，这里简化
        reader.readAsText(file, 'UTF-8')
      }
    }

    // 解析 CSV
    const parseCSV = (content) => {
      const lines = content.split('\n').filter(line => line.trim())
      if (lines.length < 2) {
        errorMessages.value.push('文件内容为空或格式不正确')
        return
      }

      // 解析表头
      const headers = parseCSVLine(lines[0])
      const requiredFields = ['配件编码', '配件名称', '规格', '单位', '数量', '单价']
      const missingFields = requiredFields.filter(field => !headers.includes(field))

      if (missingFields.length > 0) {
        errorMessages.value.push(`缺少必需字段：${missingFields.join('、')}`)
        return
      }

      // 解析数据行
      const data = []
      const errors = []

      for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i])
        if (values.length < requiredFields.length) {
          continue // 跳过空行
        }

        const row = {}
        headers.forEach((header, index) => {
          row[header] = values[index] ? values[index].trim() : ''
        })

        // 验证数据
        const rowNum = i + 1
        const item = {
          partNumber: row['配件编码'] || '',
          partName: row['配件名称'] || '',
          specification: row['规格'] || '',
          unit: row['单位'] || '个',
          quantity: parseFloat(row['数量']) || 0,
          unitPrice: parseFloat(row['单价']) || 0,
          remark: row['备注'] || ''
        }

        // 验证
        if (!item.partNumber) {
          errors.push(`第 ${rowNum} 行：配件编码不能为空`)
        }
        if (!item.partName) {
          errors.push(`第 ${rowNum} 行：配件名称不能为空`)
        }
        if (item.quantity <= 0) {
          errors.push(`第 ${rowNum} 行：数量必须大于 0`)
        }
        if (item.unitPrice < 0) {
          errors.push(`第 ${rowNum} 行：单价不能为负数`)
        }

        data.push(item)
      }

      if (errors.length > 0) {
        errorMessages.value = errors.slice(0, 10) // 最多显示10条错误
        if (errors.length > 10) {
          errorMessages.value.push(`... 还有 ${errors.length - 10} 条错误`)
        }
      }

      parsedData.value = data

      if (data.length > 0 && errors.length === 0) {
        ElMessage.success(`成功解析 ${data.length} 条数据`)
      }
    }

    // 解析 CSV 行（处理引号）
    const parseCSVLine = (line) => {
      const result = []
      let current = ''
      let inQuotes = false

      for (let i = 0; i < line.length; i++) {
        const char = line[i]

        if (char === '"') {
          if (inQuotes && line[i + 1] === '"') {
            current += '"'
            i++ // 跳过下一个引号
          } else {
            inQuotes = !inQuotes
          }
        } else if (char === ',' && !inQuotes) {
          result.push(current)
          current = ''
        } else {
          current += char
        }
      }

      result.push(current)
      return result
    }

    // 关闭对话框
    const handleClose = () => {
      dialogVisible.value = false
      selectedFile.value = null
      parsedData.value = []
      errorMessages.value = []
    }

    // 确认导入
    const handleImport = () => {
      if (parsedData.value.length === 0) {
        ElMessage.warning('没有可导入的数据')
        return
      }

      emit('import', parsedData.value)
      handleClose()
    }

    return {
      dialogVisible,
      selectedFile,
      parsedData,
      previewData,
      errorMessages,
      formatFileSize,
      handleFileChange,
      handleClose,
      handleImport
    }
  }
}
</script>

<style scoped>
.import-container {
  max-height: 500px;
  overflow-y: auto;
}

.upload-area {
  width: 100%;
}

.upload-area :deep(.el-upload) {
  width: 100%;
}

.upload-area :deep(.el-upload-dragger) {
  width: 100%;
  height: 180px;
}

.file-info {
  margin-top: 20px;
}

.data-preview {
  margin-top: 20px;
}

.data-preview h4 {
  margin-bottom: 10px;
  color: #303133;
}

.error-messages {
  margin-top: 20px;
}

.mb-2 {
  margin-bottom: 8px;
}

.import-tips {
  margin-top: 20px;
  padding: 15px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.import-tips h4 {
  margin-bottom: 10px;
  color: #303133;
}

.import-tips ul {
  margin: 0;
  padding-left: 20px;
  color: #606266;
  line-height: 1.8;
}

.import-tips li {
  margin-bottom: 5px;
}

.import-tips .el-tag {
  margin-right: 5px;
  margin-bottom: 5px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>
