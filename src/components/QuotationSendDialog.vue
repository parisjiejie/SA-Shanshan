<template>
  <el-dialog
    :title="dialogTitle"
    v-model="dialogVisible"
    width="600px"
    :close-on-click-modal="false"
    :destroy-on-close="true"
    @close="handleClose"
  >
    <div class="send-container">
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
            <div>销售金额：¥{{ formatAmount(quotation?.totalAmount) }}</div>
            <div>有效期：{{ quotation?.validDays }} 天</div>
          </div>
        </template>
      </el-alert>

      <!-- 发送表单 -->
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
      >
        <el-form-item label="收件人邮箱" prop="toEmail">
          <el-input
            v-model="form.toEmail"
            placeholder="请输入客户邮箱地址"
            clearable
          >
            <template #prefix>
              <el-icon><Message /></el-icon>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item label="抄送" prop="ccEmail">
          <el-input
            v-model="form.ccEmail"
            placeholder="多个邮箱用逗号分隔（可选）"
            clearable
          >
            <template #prefix>
              <el-icon><CopyDocument /></el-icon>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item label="邮件主题" prop="subject">
          <el-input
            v-model="form.subject"
            placeholder="请输入邮件主题"
            clearable
          />
        </el-form-item>

        <el-form-item label="邮件正文" prop="content">
          <el-input
            v-model="form.content"
            type="textarea"
            :rows="6"
            placeholder="请输入邮件正文"
          />
        </el-form-item>

        <el-form-item label="附件">
          <div class="attachment-info">
            <el-icon><Document /></el-icon>
            <span class="filename">报价单_{{ quotation?.quotationNo }}.pdf</span>
            <el-tag size="small" type="success">已生成</el-tag>
          </div>
        </el-form-item>

        <el-form-item label="发送选项">
          <el-checkbox v-model="form.needSignature">
            需要客户签字确认
          </el-checkbox>
          <el-tooltip content="勾选后，客户收到邮件需要签字回传">
            <el-icon class="info-icon"><InfoFilled /></el-icon>
          </el-tooltip>
        </el-form-item>

        <el-form-item v-if="form.needSignature" label="签字截止日期">
          <el-date-picker
            v-model="form.signatureDeadline"
            type="date"
            placeholder="选择签字截止日期"
            :disabled-date="disabledDate"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>

      <!-- 发送提示 -->
      <el-alert
        v-if="sendStatus.message"
        :title="sendStatus.message"
        :type="sendStatus.type"
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
          @click="handleSend"
          :loading="sending"
          :disabled="!form.toEmail"
        >
          <el-icon><Promotion /></el-icon>
          发送邮件
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script>
import { ref, computed, reactive, watch } from 'vue'
import { Message, CopyDocument, Document, InfoFilled, Promotion } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

export default {
  name: 'QuotationSendDialog',
  components: {
    Message,
    CopyDocument,
    Document,
    InfoFilled,
    Promotion
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
  emits: ['update:visible', 'send'],
  setup(props, { emit }) {
    const formRef = ref(null)
    const sending = ref(false)

    // 发送状态
    const sendStatus = reactive({
      type: '',
      message: ''
    })

    // 表单数据
    const form = reactive({
      toEmail: '',
      ccEmail: '',
      subject: '',
      content: '',
      needSignature: false,
      signatureDeadline: null
    })

    // 表单验证规则
    const rules = {
      toEmail: [
        { required: true, message: '请输入收件人邮箱', trigger: 'blur' },
        { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
      ],
      subject: [
        { required: true, message: '请输入邮件主题', trigger: 'blur' }
      ],
      content: [
        { required: true, message: '请输入邮件正文', trigger: 'blur' }
      ]
    }

    // 对话框可见性
    const dialogVisible = computed({
      get: () => props.visible,
      set: (val) => emit('update:visible', val)
    })

    // 对话框标题
    const dialogTitle = computed(() => {
      return '发送报价单给客户'
    })

    // 格式化金额
    const formatAmount = (amount) => {
      if (amount === undefined || amount === null) return '0.00'
      return amount.toLocaleString('zh-CN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })
    }

    // 生成邮件正文
    const generateEmailContent = (quotation) => {
      const validUntil = quotation.validUntil
        ? new Date(quotation.validUntil).toLocaleDateString('zh-CN')
        : `自报价日起 ${quotation.validDays} 天`

      return `尊敬的 ${quotation.contactName || '客户'}：

您好！

感谢贵公司对我司的信任与支持。根据贵司的需求，我司特提供以下报价：

报价单号：${quotation.quotationNo}
报价金额：¥${formatAmount(quotation.totalAmount)}
有效期至：${validUntil}

详细报价信息请查看附件PDF文件。

如有任何疑问，请随时与我们联系。

顺祝商祺！

此致
敬礼

某某科技有限公司
销售部
${new Date().toLocaleDateString('zh-CN')}`
    }

    // 监听quotation变化，初始化表单数据
    watch(() => props.quotation, (newVal) => {
      if (newVal) {
        // 自动填充客户邮箱（如果有）
        form.toEmail = newVal.contactEmail || ''

        // 自动生成邮件主题
        form.subject = `报价单 - ${newVal.quotationNo} - ${newVal.customerName}`

        // 自动生成邮件正文
        form.content = generateEmailContent(newVal)

        // 重置其他字段
        form.ccEmail = ''
        form.needSignature = false
        form.signatureDeadline = null

        // 清除发送状态
        sendStatus.type = ''
        sendStatus.message = ''
      }
    }, { immediate: true })

    // 禁用过去的日期
    const disabledDate = (time) => {
      return time.getTime() < Date.now() - 8.64e7
    }

    // 关闭对话框
    const handleClose = () => {
      dialogVisible.value = false
      resetForm()
    }

    // 重置表单
    const resetForm = () => {
      form.toEmail = ''
      form.ccEmail = ''
      form.subject = ''
      form.content = ''
      form.needSignature = false
      form.signatureDeadline = null
      sendStatus.type = ''
      sendStatus.message = ''
    }

    // 发送邮件
    const handleSend = async () => {
      const valid = await formRef.value.validate().catch(() => false)
      if (!valid) return

      sending.value = true
      sendStatus.type = 'info'
      sendStatus.message = '正在发送邮件，请稍候...'

      try {
        // 模拟发送延迟
        await new Promise(resolve => setTimeout(resolve, 1500))

        // 触发发送事件
        emit('send', {
          quotationId: props.quotation?.id,
          toEmail: form.toEmail,
          ccEmail: form.ccEmail,
          subject: form.subject,
          content: form.content,
          needSignature: form.needSignature,
          signatureDeadline: form.signatureDeadline,
          sentAt: new Date().toISOString()
        })

        sendStatus.type = 'success'
        sendStatus.message = '邮件发送成功！'

        ElMessage.success('报价单邮件已发送给客户')

        // 2秒后关闭对话框
        setTimeout(() => {
          handleClose()
        }, 2000)
      } catch (error) {
        sendStatus.type = 'error'
        sendStatus.message = '邮件发送失败：' + error.message
        ElMessage.error('邮件发送失败：' + error.message)
      } finally {
        sending.value = false
      }
    }

    return {
      formRef,
      form,
      rules,
      dialogVisible,
      dialogTitle,
      sending,
      sendStatus,
      formatAmount,
      disabledDate,
      handleClose,
      handleSend
    }
  }
}
</script>

<style scoped>
.send-container {
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

.attachment-info {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.attachment-info .filename {
  flex: 1;
  color: #606266;
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
  .attachment-info {
    flex-wrap: wrap;
  }
}
</style>
