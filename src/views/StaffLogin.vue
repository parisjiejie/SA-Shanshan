<template>
  <div class="staff-login">
    <el-card shadow="hover" class="login-card">
      <template #header>
        <div class="card-header">
          <span>员工登录</span>
        </div>
      </template>

      <div class="login-form">
        <h3 class="section-title">
          <el-icon><User /></el-icon>
          欢迎登录售后管理系统
        </h3>
        <p class="section-desc">请使用员工账号登录</p>

        <el-form
          ref="formRef"
          :model="form"
          :rules="rules"
          label-width="0"
          class="mt-4"
        >
          <el-form-item prop="username">
            <el-input
              v-model="form.username"
              placeholder="请输入用户名"
              size="large"
              clearable
            >
              <template #prefix>
                <el-icon><User /></el-icon>
              </template>
            </el-input>
          </el-form-item>

          <el-form-item prop="password">
            <el-input
              v-model="form.password"
              type="password"
              placeholder="请输入密码"
              size="large"
              show-password
            >
              <template #prefix>
                <el-icon><Lock /></el-icon>
              </template>
            </el-input>
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
              <el-checkbox v-model="form.remember">记住我</el-checkbox>
              <el-button link type="primary" @click="forgotPassword">
                忘记密码？
              </el-button>
            </div>
          </el-form-item>
        </el-form>

        <!-- 快速登录（用于测试） -->
        <el-divider>快速登录（测试用）</el-divider>
        <div class="quick-login">
          <el-button size="small" @click="quickLogin('admin')">管理员</el-button>
          <el-button size="small" @click="quickLogin('assistant')">业务助理</el-button>
          <el-button size="small" @click="quickLogin('engineer')">工程师</el-button>
          <el-button size="small" @click="quickLogin('techLead')">工程课课长</el-button>
          <el-button size="small" @click="quickLogin('director')">部长</el-button>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock } from '@element-plus/icons-vue'

export default {
  name: 'StaffLogin',
  components: {
    User,
    Lock
  },
  setup() {
    const router = useRouter()
    const formRef = ref(null)
    const logging = ref(false)

    // 表单数据
    const form = reactive({
      username: '',
      password: '',
      remember: false
    })

    // 表单验证规则
    const rules = {
      username: [
        { required: true, message: '请输入用户名', trigger: 'blur' }
      ],
      password: [
        { required: true, message: '请输入密码', trigger: 'blur' },
        { min: 6, message: '密码长度至少6位', trigger: 'blur' }
      ]
    }

    // 处理登录
    const handleLogin = async () => {
      if (!formRef.value) return

      try {
        await formRef.value.validate()

        logging.value = true

        // 模拟登录验证
        setTimeout(() => {
          // 模拟验证（实际应该调用后端API）
          const staffAccounts = {
            'admin': { name: '李管理员', role: 'admin' },
            'assistant': { name: '赵业务助理', role: 'assistant' },
            'engineer': { name: '王工程师', role: 'engineer' },
            'techLead': { name: '张工程课课长', role: 'techLead' },
            'director': { name: '钱部长', role: 'director' }
          }

          const account = staffAccounts[form.username]
          if (account && form.password === '123456') {
            // 保存登录状态
            localStorage.setItem('staffAuth', JSON.stringify({
              username: form.username,
              name: account.name,
              role: account.role,
              loginTime: new Date().toISOString()
            }))

            // 同时保存 userInfo 供手机端工作台使用
            const roleMapping = {
              'admin': '李管理员',
              'assistant': '赵业务助理',
              'engineer': '王工程师',
              'techLead': '张工程课课长',
              'director': '钱部长'
            }
            localStorage.setItem('userInfo', JSON.stringify({
              name: account.name,
              role: account.role,
              roleDisplay: roleMapping[account.role],
              department: '技术服务部'
            }))

            ElMessage.success(`欢迎回来，${account.name}`)
            // 使用 window.location.href 强制刷新页面，确保 App.vue 重新加载用户信息
            window.location.href = '/dashboard'
          } else {
            ElMessage.error('用户名或密码错误')
          }

          logging.value = false
        }, 1000)
      } catch (error) {
        ElMessage.error('请检查表单填写是否正确')
      }
    }

    // 快速登录（测试用）
    const quickLogin = (role) => {
      const roleMap = {
        'admin': { username: 'admin', name: '李管理员', role: 'admin' },
        'assistant': { username: 'assistant', name: '赵业务助理', role: 'assistant' },
        'engineer': { username: 'engineer', name: '王工程师', role: 'engineer' },
        'techLead': { username: 'techLead', name: '张工程课课长', role: 'techLead' },
        'director': { username: 'director', name: '钱部长', role: 'director' }
      }

      const account = roleMap[role]
      form.username = account.username
      form.password = '123456'

      // 自动登录
      setTimeout(() => {
        handleLogin()
      }, 100)
    }

    // 忘记密码
    const forgotPassword = () => {
      ElMessage.info('请联系管理员重置密码')
    }

    return {
      formRef,
      form,
      rules,
      logging,
      handleLogin,
      quickLogin,
      forgotPassword
    }
  }
}
</script>

<style scoped>
.staff-login {
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
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.quick-login {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: center;
  margin-top: 15px;
}

:deep(.el-input__wrapper) {
  padding: 4px 11px;
}

:deep(.el-input__inner) {
  height: 44px;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .staff-login {
    padding: 10px;
    background: #f5f7fa;
  }

  .login-card {
    border-radius: 8px;
  }

  .section-title {
    font-size: 18px;
  }
}
</style>
