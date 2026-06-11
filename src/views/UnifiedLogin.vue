<template>
  <div class="unified-login">
    <!-- 顶部标题栏（移动端显示） -->
    <div class="mobile-header">
      <div class="mobile-logo">
        <el-icon size="32"><Service /></el-icon>
      </div>
      <span class="mobile-title">售后管理系统</span>
    </div>

    <div class="login-container">
      <!-- 左侧品牌区域（桌面端显示） -->
      <div class="brand-section">
        <div class="brand-content">
          <div class="logo">
            <el-icon size="64"><Service /></el-icon>
          </div>
          <h1 class="brand-title">售后管理系统</h1>
          <p class="brand-desc">专业、高效、智能的售后服务管理平台</p>
          <div class="brand-features">
            <div class="feature-item">
              <el-icon><Check /></el-icon>
              <span>工单全流程管理</span>
            </div>
            <div class="feature-item">
              <el-icon><Check /></el-icon>
              <span>配件报价审批</span>
            </div>
            <div class="feature-item">
              <el-icon><Check /></el-icon>
              <span>外勤签到打卡</span>
            </div>
            <div class="feature-item">
              <el-icon><Check /></el-icon>
              <span>客户自助服务</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧登录区域 -->
      <div class="login-section">
        <div class="login-box">
          <!-- 系统介绍 - 放大显示 -->
          <div class="system-intro-large">
            <h2 class="intro-title">欢迎登录</h2>
            <p class="intro-desc">专业、高效、智能的售后服务管理平台</p>
            <div class="intro-features-large">
              <div class="feature-item-large">
                <el-icon size="24" color="#409eff"><Document /></el-icon>
                <span>工单全流程管理</span>
              </div>
              <div class="feature-item-large">
                <el-icon size="24" color="#67c23a"><Money /></el-icon>
                <span>配件报价审批</span>
              </div>
              <div class="feature-item-large">
                <el-icon size="24" color="#e6a23c"><Location /></el-icon>
                <span>外勤签到打卡</span>
              </div>
              <div class="feature-item-large">
                <el-icon size="24" color="#f56c6c"><User /></el-icon>
                <span>客户自助服务</span>
              </div>
            </div>
          </div>

          <!-- 底部操作区域 -->
          <div class="login-bottom-section">
            <!-- 登录按钮 -->
            <el-button
              type="primary"
              size="large"
              class="login-btn"
              :loading="logging"
              :disabled="!selectedRole"
              @click="handleLogin"
            >
              <el-icon><UserFilled /></el-icon>
              <span>立即登录</span>
            </el-button>

            <!-- 角色选择 - 紧凑横向列表 -->
            <div class="role-section">
              <p class="role-section-title">选择角色</p>
              <div class="role-list">
                <div
                  v-for="role in roles"
                  :key="role.key"
                  class="role-item"
                  :class="{ active: selectedRole === role.key }"
                  @click="selectRole(role.key)"
                >
                  <div class="role-dot" :style="{ background: role.color }"></div>
                  <span class="role-name">{{ role.name }}</span>
                </div>
              </div>
            </div>

            <!-- 测试账号快速登录 -->
            <div class="test-accounts">
              <el-divider content-position="center">
                <span class="divider-text">测试账号</span>
              </el-divider>
              <div class="account-list">
                <div
                  v-for="role in roles"
                  :key="role.key"
                  class="account-item"
                  @click="quickLogin(role.key)"
                >
                  <span class="account-role" :style="{ color: role.color }">{{ role.name }}</span>
                  <span class="account-name">{{ role.account }}</span>
                </div>
              </div>
              <p class="password-hint">密码：123456</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  Service,
  Check,
  UserFilled,
  CircleCheckFilled,
  User,
  OfficeBuilding,
  Tools,
  Avatar,
  Document,
  Money,
  Location
} from '@element-plus/icons-vue'

const router = useRouter()
const selectedRole = ref('')
const logging = ref(false)

// 角色配置
const roles = [
  {
    key: 'admin',
    name: '管理员',
    mockName: '李管理员',
    account: 'admin',
    desc: '系统配置、用户管理',
    icon: 'OfficeBuilding',
    color: '#409eff',
    tagType: 'primary',
    redirect: '/dashboard'
  },
  {
    key: 'assistant',
    name: '业务助理',
    mockName: '赵业务助理',
    account: 'assistant',
    desc: '客户管理、报价审批',
    icon: 'User',
    color: '#67c23a',
    tagType: 'success',
    redirect: '/dashboard'
  },
  {
    key: 'engineer',
    name: '工程师',
    mockName: '王工程师',
    account: 'engineer',
    desc: '工单处理、外勤打卡',
    icon: 'Tools',
    color: '#e6a23c',
    tagType: 'warning',
    redirect: '/staff-mobile-workspace'
  },
  {
    key: 'techLead',
    name: '课长',
    mockName: '张工程课课长',
    account: 'techlead',
    desc: '技术支持、团队管理',
    icon: 'Avatar',
    color: '#f56c6c',
    tagType: 'danger',
    redirect: '/dashboard'
  },
  {
    key: 'director',
    name: '部长',
    mockName: '钱部长',
    account: 'director',
    desc: '部门管理、流程审核',
    icon: 'Monitor',
    color: '#9254de',
    tagType: '',
    redirect: '/dashboard'
  },
  {
    key: 'customer',
    name: '客户',
    mockName: '王客户',
    account: 'customer',
    desc: '工单查询、报价确认',
    icon: 'UserFilled',
    color: '#909399',
    tagType: 'info',
    redirect: '/customer-workspace'
  }
]

// 选择角色
const selectRole = (roleKey) => {
  selectedRole.value = roleKey
}

// 处理登录
const handleLogin = async () => {
  if (!selectedRole.value) {
    ElMessage.warning('请选择登录角色')
    return
  }

  logging.value = true

  const role = roles.find(r => r.key === selectedRole.value)

  // 模拟登录延迟
  setTimeout(() => {
    // 保存登录状态
    const displayName = role.mockName || role.name
    const userInfo = {
      username: role.account,
      name: displayName,
      role: role.key,
      roleName: role.name,
      loginTime: new Date().toISOString()
    }

    localStorage.setItem('staffAuth', JSON.stringify(userInfo))
    localStorage.setItem('userInfo', JSON.stringify({
      name: displayName,
      role: role.name,
      department: role.key === 'customer' ? '' : '技术服务部'
    }))

    ElMessage.success(`欢迎回来，${displayName}`)

    // 根据角色跳转到对应页面
    router.push(role.redirect)
  }, 800)
}

// 快速登录
const quickLogin = (roleKey) => {
  selectedRole.value = roleKey
  setTimeout(() => {
    handleLogin()
  }, 100)
}
</script>

<style scoped>
.unified-login {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f7fa;
}

/* 移动端顶部标题栏 */
.mobile-header {
  display: none;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 12px 20px;
  align-items: center;
  gap: 12px;
  color: white;
}

.mobile-logo {
  width: 36px;
  height: 36px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.mobile-title {
  font-size: 16px;
  font-weight: 600;
}

.login-container {
  display: flex;
  flex: 1;
  width: 100%;
}

/* 左侧品牌区域 */
.brand-section {
  flex: 1;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
  color: white;
}

.brand-content {
  max-width: 480px;
  text-align: center;
}

.logo {
  width: 100px;
  height: 100px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 30px;
  backdrop-filter: blur(10px);
}

.brand-title {
  font-size: 36px;
  font-weight: 700;
  margin: 0 0 16px;
  letter-spacing: 2px;
}

.brand-desc {
  font-size: 18px;
  opacity: 0.9;
  margin-bottom: 40px;
}

.brand-features {
  display: flex;
  flex-direction: column;
  gap: 16px;
  align-items: flex-start;
  max-width: 280px;
  margin: 0 auto;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 16px;
  opacity: 0.95;
}

.feature-item .el-icon {
  font-size: 20px;
  color: #67c23a;
}

/* 右侧登录区域 */
.login-section {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px 40px;
  background: #fff;
}

.login-box {
  width: 100%;
  max-width: 450px;
  display: flex;
  flex-direction: column;
  min-height: 500px;
}

/* 系统介绍 - 放大显示 */
.system-intro-large {
  flex: 1;
  text-align: center;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 20px 0;
}

.intro-title {
  font-size: 32px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 12px;
}

.intro-desc {
  font-size: 16px;
  color: #606266;
  margin: 0 0 30px;
}

.intro-features-large {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  max-width: 360px;
  margin: 0 auto;
}

.feature-item-large {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 12px;
  font-size: 14px;
  color: #303133;
}

/* 底部操作区域 */
.login-bottom-section {
  margin-top: auto;
  padding-top: 20px;
}

/* 登录按钮 */
.login-btn {
  width: 100%;
  height: 44px;
  font-size: 15px;
  margin-bottom: 16px;
  border-radius: 6px;
}

/* 角色选择区域 - 紧凑横向列表 */
.role-section {
  margin-bottom: 16px;
}

.role-section-title {
  font-size: 12px;
  color: #909399;
  text-align: center;
  margin: 0 0 10px;
}

.role-list {
  display: flex;
  justify-content: center;
  gap: 8px;
  flex-wrap: wrap;
}

.role-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border: 1px solid #dcdfe6;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.2s;
  background: #fff;
}

.role-item:hover {
  border-color: #409eff;
  background: #f5f7fa;
}

.role-item.active {
  border-color: #409eff;
  background: #ecf5ff;
}

.role-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.role-name {
  font-size: 13px;
  color: #303133;
}

/* 测试账号 */
.test-accounts {
  text-align: center;
}

.divider-text {
  font-size: 11px;
  color: #909399;
}

.account-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  justify-content: center;
  margin-bottom: 6px;
}

.account-item {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background: #f5f7fa;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 11px;
}

.account-item:hover {
  background: #e4e7ed;
}

.account-role {
  font-weight: 600;
}

.account-name {
  color: #606266;
  font-family: monospace;
}

.password-hint {
  font-size: 10px;
  color: #909399;
  margin: 0;
}

/* 响应式适配 - 平板 */
@media (max-width: 968px) {
  .brand-section {
    display: none;
  }

  .mobile-header {
    display: flex;
  }

  .login-section {
    padding: 20px;
    align-items: flex-start;
    padding-top: 24px;
  }

  .login-box {
    max-width: 100%;
    min-height: auto;
  }

  .system-intro-large {
    padding: 10px 0;
  }

  .intro-title {
    font-size: 26px;
  }

  .intro-desc {
    font-size: 14px;
    margin-bottom: 20px;
  }

  .intro-features-large {
    gap: 12px;
  }

  .feature-item-large {
    padding: 12px;
    font-size: 13px;
  }
}

/* 响应式适配 - 手机 */
@media (max-width: 480px) {
  .mobile-header {
    padding: 10px 16px;
  }

  .mobile-logo {
    width: 32px;
    height: 32px;
  }

  .mobile-title {
    font-size: 15px;
  }

  .login-section {
    padding: 16px;
    padding-top: 20px;
  }

  .login-box {
    min-height: auto;
  }

  .system-intro-large {
    padding: 10px 0;
  }

  .intro-title {
    font-size: 24px;
    margin-bottom: 8px;
  }

  .intro-desc {
    font-size: 13px;
    margin-bottom: 16px;
  }

  .intro-features-large {
    grid-template-columns: 1fr;
    gap: 8px;
    max-width: 280px;
  }

  .feature-item-large {
    padding: 10px 12px;
    font-size: 12px;
  }

  .login-bottom-section {
    padding-top: 16px;
  }

  .login-btn {
    height: 40px;
    font-size: 14px;
    margin-bottom: 12px;
  }

  .role-section {
    margin-bottom: 12px;
  }

  .role-section-title {
    font-size: 11px;
    margin-bottom: 8px;
  }

  .role-list {
    gap: 6px;
  }

  .role-item {
    padding: 5px 10px;
  }

  .role-dot {
    width: 6px;
    height: 6px;
  }

  .role-name {
    font-size: 12px;
  }

  .account-list {
    gap: 4px;
  }

  .account-item {
    padding: 3px 6px;
    font-size: 10px;
  }

  .password-hint {
    font-size: 9px;
  }
}

/* 超小屏幕 */
@media (max-width: 360px) {
  .role-list {
    gap: 5px;
  }

  .role-item {
    padding: 4px 8px;
  }

  .role-name {
    font-size: 11px;
  }
}
</style>
