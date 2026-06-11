<template>
  <div class="customer-login">
    <el-card shadow="hover" class="login-card">
      <template #header>
        <div class="card-header">
          <span>客户登录</span>
        </div>
      </template>

      <div class="login-form">
        <h3 class="section-title">
          <el-icon><User /></el-icon>
          欢迎回来
        </h3>
        <p class="section-desc">请使用注册时的手机号登录</p>

        <el-form
          ref="formRef"
          :model="form"
          :rules="rules"
          label-width="0"
          class="mt-4"
        >
          <el-form-item prop="phone">
            <el-input
              v-model="form.phone"
              placeholder="请输入手机号"
              size="large"
              clearable
            >
              <template #prefix>
                <el-icon><Iphone /></el-icon>
              </template>
            </el-input>
          </el-form-item>

          <el-form-item prop="smsCode">
            <el-row :gutter="10">
              <el-col :span="14">
                <el-input
                  v-model="form.smsCode"
                  placeholder="请输入短信验证码"
                  size="large"
                  maxlength="6"
                >
                  <template #prefix>
                    <el-icon><Message /></el-icon>
                  </template>
                </el-input>
              </el-col>
              <el-col :span="10">
                <el-button
                  type="primary"
                  size="large"
                  :disabled="smsCountdown > 0 || !form.phone"
                  @click="sendSmsCode"
                  :loading="smsSending"
                  style="width: 100%"
                >
                  {{ smsCountdown > 0 ? `${smsCountdown}秒` : '获取验证码' }}
                </el-button>
              </el-col>
            </el-row>
          </el-form-item>

          <el-form-item>
            <el-button
              type="primary"
              size="large"
              @click="handleLogin"
              :loading="logging"
              style="width: 100%"
            >
              登录
            </el-button>
          </el-form-item>

          <el-form-item>
            <div class="login-options">
              <el-button link @click="goToRegister">
                还没有账号？立即注册
              </el-button>
            </div>
          </el-form-item>
        </el-form>

        <!-- 其他登录方式 -->
        <div class="other-login">
          <el-divider>其他登录方式</el-divider>
          <div class="login-methods">
            <el-button circle size="large" @click="wechatLogin">
              <el-icon><ChatDotRound /></el-icon>
            </el-button>
            <span class="method-label">微信登录</span>
          </div>
        </div>
      </div>
    </el-card>

    <!-- 登录成功提示 -->
    <el-dialog
      title="登录成功"
      v-model="loginSuccessVisible"
      width="400px"
      :show-close="false"
      :close-on-click-modal="false"
    >
      <el-result
        icon="success"
        title="登录成功"
        :sub-title="`欢迎回来，${customerName}`"
      >
        <template #extra>
          <el-button type="primary" @click="goToDashboard">进入系统</el-button>
        </template>
      </el-result>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Iphone, Message, ChatDotRound } from '@element-plus/icons-vue'
import { useCustomerStore } from '../stores/customerStore'

export default {
  name: 'CustomerLogin',
  components: {
    User,
    Iphone,
    Message,
    ChatDotRound
  },
  setup() {
    const router = useRouter()
    const route = useRoute()
    const formRef = ref(null)
    const customerStore = useCustomerStore()

    const logging = ref(false)
    const loginSuccessVisible = ref(false)
    const customerName = ref('')

    // 表单数据
    const form = reactive({
      phone: '',
      smsCode: ''
    })

    // 短信验证码相关
    const smsCountdown = ref(0)
    const smsSending = ref(false)
    let smsTimer = null

    // 验证手机号格式
    const validatePhone = (rule, value, callback) => {
      const phoneRegex = /^1[3-9]\d{9}$/
      if (!phoneRegex.test(value)) {
        callback(new Error('请输入正确的手机号码'))
      } else {
        callback()
      }
    }

    // 验证短信验证码
    const validateSmsCode = (rule, value, callback) => {
      if (!value) {
        callback(new Error('请输入短信验证码'))
      } else if (value.length !== 6) {
        callback(new Error('验证码为6位数字'))
      } else {
        callback()
      }
    }

    // 表单验证规则
    const rules = {
      phone: [
        { required: true, message: '请输入手机号', trigger: 'blur' },
        { validator: validatePhone, trigger: 'blur' }
      ],
      smsCode: [
        { required: true, validator: validateSmsCode, trigger: 'blur' }
      ]
    }

    // 发送短信验证码
    const sendSmsCode = async () => {
      if (!form.phone) {
        ElMessage.warning('请先输入手机号')
        return
      }

      const phoneRegex = /^1[3-9]\d{9}$/
      if (!phoneRegex.test(form.phone)) {
        ElMessage.warning('请输入正确的手机号码')
        return
      }

      smsSending.value = true

      // 模拟发送短信验证码
      setTimeout(() => {
        smsSending.value = false
        smsCountdown.value = 60

        ElMessage.success(`验证码已发送至 ${form.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')}`)

        // 开始倒计时
        smsTimer = setInterval(() => {
          smsCountdown.value--
          if (smsCountdown.value <= 0) {
            clearInterval(smsTimer)
          }
        }, 1000)
      }, 1000)
    }

    // 处理登录
    const handleLogin = async () => {
      if (!formRef.value) return

      try {
        await formRef.value.validate()

        logging.value = true

        // 模拟登录验证
        setTimeout(() => {
          // 查找客户
          const customer = customerStore.findCustomerByPhone(form.phone)

          if (!customer) {
            ElMessage.error('该手机号未注册，请先注册')
            logging.value = false
            return
          }

          if (customer.status === 'pending') {
            ElMessage.warning('您的账号正在审核中，请耐心等待')
            logging.value = false
            return
          }

          if (customer.status === 'rejected') {
            ElMessage.error('您的注册申请未通过审核，请联系客服')
            logging.value = false
            return
          }

          // 登录成功
          customerStore.login(customer)
          customerName.value = customer.name
          loginSuccessVisible.value = true
          logging.value = false

          ElMessage.success('登录成功')
        }, 1500)
      } catch (error) {
        ElMessage.error('请检查表单填写是否正确')
      }
    }

    // 跳转到注册页面
    const goToRegister = () => {
      router.push('/contact-register')
    }

    // 微信登录
    const wechatLogin = () => {
      ElMessage.info('微信登录功能开发中...')
    }

    // 进入系统
    const goToDashboard = () => {
      loginSuccessVisible.value = false

      // 检查是否有跳转目标
      const redirectUrl = sessionStorage.getItem('redirectUrl')
      if (redirectUrl) {
        sessionStorage.removeItem('redirectUrl')
        router.push(redirectUrl)
      } else {
        // 客户登录后跳转到客户工作台（手机端界面）
        router.push('/customer-workspace')
      }
    }

    // 清理定时器
    onUnmounted(() => {
      if (smsTimer) {
        clearInterval(smsTimer)
      }
    })

    return {
      formRef,
      form,
      rules,
      logging,
      loginSuccessVisible,
      customerName,
      smsCountdown,
      smsSending,
      sendSmsCode,
      handleLogin,
      goToRegister,
      wechatLogin,
      goToDashboard
    }
  }
}
</script>

<style scoped>
.customer-login {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.login-card {
  width: 100%;
  max-width: 420px;
  border-radius: 12px;
}

.card-header {
  text-align: center;
  font-size: 20px;
  font-weight: 600;
  color: #303133;
}

.login-form {
  padding: 10px 0;
}

.section-title {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin: 0 0 10px 0;
  color: #303133;
  font-size: 22px;
  font-weight: 600;
}

.section-title .el-icon {
  font-size: 26px;
  color: #409eff;
}

.section-desc {
  text-align: center;
  color: #606266;
  font-size: 14px;
  margin-bottom: 25px;
}

.mt-4 {
  margin-top: 20px;
}

.login-options {
  display: flex;
  justify-content: center;
  width: 100%;
}

.other-login {
  margin-top: 30px;
}

.login-methods {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  margin-top: 15px;
}

.method-label {
  font-size: 12px;
  color: #606266;
}

:deep(.el-input__wrapper) {
  padding: 4px 11px;
}

:deep(.el-input__inner) {
  height: 44px;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .customer-login {
    padding: 10px;
    background: #f5f7fa;
  }

  .login-card {
    border-radius: 8px;
  }

  .section-title {
    font-size: 20px;
  }
}
</style>
