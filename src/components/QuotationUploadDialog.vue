<template>
  <el-dialog
    :title="dialogTitle"
    v-model="dialogVisible"
    width="600px"
    :close-on-click-modal="false"
    :destroy-on-close="true"
    @close="handleClose"
  >
    <div class="upload-container">
      <!-- 报价单信息摘要 -->
      <el-alert
        :title="`报价单号：${quotation?.quotationNo}`"
        type="info"
        :closable="false"
        class="mb-4"
      >
        <template #default>
          <div class="quotation-info">
            <div>客户：{{ quotation?.customerName }}</div>
            <div>联系人：{{ quotation?.contactName }}</div>
            <div>发送时间：{{ formatDateTime(quotation?.sentAt) }}</div>
            <div v-if="quotation?.sendRecord">
              发送至：{{ quotation.sendRecord.toEmail }}
            </div>
          </div>
        </template>
      </el-alert>

      <!-- 上传表单 -->
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="120px"
      >
        <el-form-item label="上传类型" prop="uploadType">
          <el-radio-group v-model="form.uploadType">
            <el-radio value="signed">客户签字版PDF</el-radio>
            <el-radio value="order">客户订单PDF</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="文件上传" prop="file">
          <el-upload
            class="upload-area"
            drag
            action="#"
            :auto-upload="false"
            :on-change="handleFileChange"
            :on-remove="handleFileRemove"
            :limit="1"
            accept=".pdf"
          >
            <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
            <div class="el-upload__text">
              拖拽文件到此处或 <em>点击上传</em>
            </div>
            <template #tip>
              <div class="el-upload__tip">
                只能上传PDF文件，且不超过10MB
              </div>
            </template>
          </el-upload>
        </el-form-item>

        <el-form-item label="备注说明" prop="remark">
          <el-input
            v-model="form.remark"
            type="textarea"
            :rows="3"
            placeholder="请输入备注说明（可选）"
          />
        </el-form-item>

        <el-form-item v-if="form.uploadType === 'order'" label="订单确认">
          <el-checkbox v-model="form.confirmOrder">
            确认客户已下单
          </el-checkbox>
          <el-tooltip content="勾选后，报价单状态将变更为已确认">
            <el-icon class="info-icon"><InfoFilled /></el-icon>
          </el-tooltip>
        </el-form-item>
      </el-form>

      <!-- 上传提示 -->
      <el-alert
        v-if="uploadStatus.message"
        :title="uploadStatus.message"
        :type="uploadStatus.type"
        :closable="false"
        class="mt-4"
        show-icon
      />
    </div>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button
          type="primary"
          @click="handleUpload"
          :loading="uploading"
          :disabled="!form.file"
        >
          <el-icon><Upload /></el-icon>
          确认上传
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script>
import { ref, computed, reactive } from 'vue'
import { UploadFilled, InfoFilled, Upload } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

export default {
  name: 'QuotationUploadDialog',
  components: {
    UploadFilled,
    InfoFilled,
    Upload
  },
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    quotation: {
      type: Object,
      default: null
    }
  },
  emits: ['update:visible', 'upload'],
  setup(props, { emit }) {
    const formRef = ref(null)
    const uploading = ref(false)

    // 上传状态
    const uploadStatus = reactive({
      type: '',
      message: ''
    })

    // 表单数据
    const form = reactive({
      uploadType: 'signed',
      file: null,
      remark: '',
      confirmOrder: false
    })

    // 表单验证规则
    const rules = {
      uploadType: [
        { required: true, message: '请选择上传类型', trigger: 'change' }
      ],
      file: [
        { required: true, message: '请上传PDF文件', trigger: 'change' }
      ]
    }

    // 对话框可见性
    const dialogVisible = computed({
      get: () => props.visible,
      set: (val) => emit('update:visible', val)
    })

    // 对话框标题
    const dialogTitle = computed(() => {
      return '上传客户回传PDF'
    })

    // 格式化日期时间
    const formatDateTime = (dateStr) => {
      if (!dateStr) return '-'
      const date = new Date(dateStr)
      return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    }

    // 文件变更处理
    const handleFileChange = (file) => {
      // 检查文件类型
      if (file.raw.type !== 'application/pdf') {
        ElMessage.error('只能上传PDF文件')
        return false
      }
      // 检查文件大小（10MB）
      if (file.raw.size > 10 * 1024 * 1024) {
        ElMessage.error('文件大小不能超过10MB')
        return false
      }
      form.file = file.raw
      uploadStatus.type = ''
      uploadStatus.message = ''
    }

    // 文件移除处理
    const handleFileRemove = () => {
      form.file = null
    }

    // 关闭对话框
    const handleClose = () => {
      dialogVisible.value = false
      resetForm()
    }

    // 重置表单
    const resetForm = () => {
      form.uploadType = 'signed'
      form.file = null
      form.remark = ''
      form.confirmOrder = false
      uploadStatus.type = ''
      uploadStatus.message = ''
    }

    // 上传文件
    const handleUpload = async () => {
      const valid = await formRef.value.validate().catch(() => false)
      if (!valid) return

      if (!form.file) {
        ElMessage.warning('请先选择要上传的文件')
        return
      }

      uploading.value = true
      uploadStatus.type = 'info'
      uploadStatus.message = '正在上传文件，请稍候...'

      try {
        // 模拟上传延迟
        await new Promise(resolve => setTimeout(resolve, 1500))

        // 生成文件URL（实际项目中应该上传到服务器）
        const fileUrl = URL.createObjectURL(form.file)

        // 触发上传事件
        emit('upload', {
          quotationId: props.quotation?.id,
          uploadType: form.uploadType,
          fileName: form.file.name,
          fileUrl: fileUrl,
          fileSize: form.file.size,
          remark: form.remark,
          confirmOrder: form.confirmOrder,
          uploadedAt: new Date().toISOString()
        })

        uploadStatus.type = 'success'
        uploadStatus.message = '文件上传成功！'

        ElMessage.success('客户回传PDF上传成功')

        // 2秒后关闭对话框
        setTimeout(() => {
          handleClose()
        }, 2000)
      } catch (error) {
        uploadStatus.type = 'error'
        uploadStatus.message = '文件上传失败：' + error.message
        ElMessage.error('文件上传失败：' + error.message)
      } finally {
        uploading.value = false
      }
    }

    return {
      formRef,
      form,
      rules,
      dialogVisible,
      dialogTitle,
      uploading,
      uploadStatus,
      formatDateTime,
      handleFileChange,
      handleFileRemove,
      handleClose,
      handleUpload
    }
  }
}
</script>

<style scoped>
.upload-container {
  max-height: 500px;
  overflow-y: auto;
}

.mb-4 {
  margin-bottom: 20px;
}

.mt-4 {
  margin-top: 20px;
}

.quotation-info {
  margin-top: 10px;
}

.quotation-info div {
  margin-bottom: 5px;
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

.info-icon {
  margin-left: 8px;
  color: #909399;
  cursor: help;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .upload-area :deep(.el-upload-dragger) {
    height: 150px;
  }
}
</style>
