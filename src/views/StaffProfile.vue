<template>
  <div class="staff-profile">
    <!-- 顶部导航 -->
    <div class="profile-header">
      <span class="header-title">个人中心</span>
    </div>

    <!-- 用户信息卡片 -->
    <div class="user-card">
      <div class="user-avatar">
        <el-avatar :size="70" :src="userInfo.avatar">
          <el-icon><UserFilled /></el-icon>
        </el-avatar>
        <div class="user-status" :class="userInfo.status">
          {{ userInfo.status === 'online' ? '在线' : '离线' }}
        </div>
      </div>
      <div class="user-info">
        <h3 class="user-name">{{ userInfo.name }}</h3>
        <p class="user-role">{{ userInfo.role }} | {{ userInfo.department }}</p>
        <p class="user-no">工号: {{ userInfo.employeeNo }}</p>
      </div>
      <el-icon class="edit-icon" @click="editProfile"><ArrowRight /></el-icon>
    </div>

    <!-- 本月统计 -->
    <div class="stats-section">
      <div class="stats-title">本月工作统计</div>
      <div class="stats-grid">
        <div class="stat-item">
          <span class="stat-number">{{ monthlyStats.workorders }}</span>
          <span class="stat-label">完成工单</span>
        </div>
        <div class="stat-item">
          <span class="stat-number">{{ monthlyStats.checkins }}</span>
          <span class="stat-label">外勤打卡</span>
        </div>
        <div class="stat-item">
          <span class="stat-number">{{ monthlyStats.hours }}</span>
          <span class="stat-label">工作时长(h)</span>
        </div>
        <div class="stat-item">
          <span class="stat-number">{{ monthlyStats.satisfaction }}%</span>
          <span class="stat-label">满意度</span>
        </div>
      </div>
    </div>

    <!-- 功能菜单 -->
    <div class="menu-section">
      <div class="menu-group">
        <div class="menu-title">工作相关</div>
        <div class="menu-list">
          <div class="menu-item" @click="goToMyWorkorders">
            <div class="menu-icon workorder">
              <el-icon><Document /></el-icon>
            </div>
            <span class="menu-text">我的工单</span>
            <el-tag v-if="myWorkorderCount > 0" type="danger" size="small" class="menu-badge">{{ myWorkorderCount }}</el-tag>
            <el-icon class="menu-arrow"><ArrowRight /></el-icon>
          </div>
          <div class="menu-item" @click="goToMyCheckins">
            <div class="menu-icon checkin">
              <el-icon><Calendar /></el-icon>
            </div>
            <span class="menu-text">我的打卡</span>
            <el-icon class="menu-arrow"><ArrowRight /></el-icon>
          </div>
          <div class="menu-item" @click="goToMyApproval" v-if="isApprover">
            <div class="menu-icon approval">
              <el-icon><Stamp /></el-icon>
            </div>
            <span class="menu-text">我的审批</span>
            <el-tag v-if="pendingApprovalCount > 0" type="danger" size="small" class="menu-badge">{{ pendingApprovalCount }}</el-tag>
            <el-icon class="menu-arrow"><ArrowRight /></el-icon>
          </div>
        </div>
      </div>

      <div class="menu-group">
        <div class="menu-title">设置</div>
        <div class="menu-list">
          <div class="menu-item" @click="showPasswordDialog = true">
            <div class="menu-icon password">
              <el-icon><Lock /></el-icon>
            </div>
            <span class="menu-text">修改密码</span>
            <el-icon class="menu-arrow"><ArrowRight /></el-icon>
          </div>
          <div class="menu-item" @click="showNotificationSettings = true">
            <div class="menu-icon notification">
              <el-icon><Bell /></el-icon>
            </div>
            <span class="menu-text">通知设置</span>
            <el-icon class="menu-arrow"><ArrowRight /></el-icon>
          </div>
          <div class="menu-item" @click="clearCache">
            <div class="menu-icon clear">
              <el-icon><Delete /></el-icon>
            </div>
            <span class="menu-text">清除缓存</span>
            <span class="cache-size">{{ cacheSize }}</span>
            <el-icon class="menu-arrow"><ArrowRight /></el-icon>
          </div>
          <div class="menu-item" @click="showAbout = true">
            <div class="menu-icon about">
              <el-icon><InfoFilled /></el-icon>
            </div>
            <span class="menu-text">关于我们</span>
            <span class="version">v{{ appVersion }}</span>
            <el-icon class="menu-arrow"><ArrowRight /></el-icon>
          </div>
        </div>
      </div>
    </div>

    <!-- 退出登录 -->
    <div class="logout-section">
      <el-button type="danger" size="large" round block @click="logout">
        退出登录
      </el-button>
    </div>

    <!-- 修改密码对话框 -->
    <el-dialog
      v-model="showPasswordDialog"
      title="修改密码"
      width="90%"
      class="mobile-dialog"
    >
      <el-form :model="passwordForm" label-position="top">
        <el-form-item label="当前密码">
          <el-input
            v-model="passwordForm.oldPassword"
            type="password"
            placeholder="请输入当前密码"
            show-password
          />
        </el-form-item>
        <el-form-item label="新密码">
          <el-input
            v-model="passwordForm.newPassword"
            type="password"
            placeholder="请输入新密码（6-20位）"
            show-password
          />
        </el-form-item>
        <el-form-item label="确认新密码">
          <el-input
            v-model="passwordForm.confirmPassword"
            type="password"
            placeholder="请再次输入新密码"
            show-password
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showPasswordDialog = false">取消</el-button>
        <el-button type="primary" @click="changePassword">确认修改</el-button>
      </template>
    </el-dialog>

    <!-- 通知设置对话框 -->
    <el-dialog
      v-model="showNotificationSettings"
      title="通知设置"
      width="90%"
      class="mobile-dialog"
    >
      <div class="notification-settings">
        <div class="setting-item">
          <span>工单提醒</span>
          <el-switch v-model="notificationSettings.workorder" />
        </div>
        <div class="setting-item">
          <span>打卡提醒</span>
          <el-switch v-model="notificationSettings.checkin" />
        </div>
        <div class="setting-item">
          <span>审批提醒</span>
          <el-switch v-model="notificationSettings.approval" />
        </div>
        <div class="setting-item">
          <span>系统消息</span>
          <el-switch v-model="notificationSettings.system" />
        </div>
      </div>
      <template #footer>
        <el-button type="primary" @click="saveNotificationSettings">保存设置</el-button>
      </template>
    </el-dialog>

    <!-- 关于我们对话框 -->
    <el-dialog
      v-model="showAbout"
      title="关于我们"
      width="90%"
      class="mobile-dialog"
    >
      <div class="about-content">
        <div class="about-logo">
          <el-avatar :size="80" src="">
            <span class="logo-text">售后</span>
          </el-avatar>
        </div>
        <h3>售后管理系统</h3>
        <p class="version-text">版本: v{{ appVersion }}</p>
        <p class="copyright">© 2026 售后管理系统 版权所有</p>
      </div>
    </el-dialog>

    <!-- 编辑个人信息对话框 -->
    <el-dialog
      v-model="showEditProfile"
      title="编辑个人信息"
      width="90%"
      class="mobile-dialog"
    >
      <el-form :model="editProfileForm" label-position="top">
        <el-form-item label="姓名">
          <el-input v-model="editProfileForm.name" placeholder="请输入姓名" />
        </el-form-item>
        <el-form-item label="手机号">
          <el-input v-model="editProfileForm.phone" placeholder="请输入手机号" />
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input v-model="editProfileForm.email" placeholder="请输入邮箱" />
        </el-form-item>
        <el-form-item label="部门">
          <el-input v-model="editProfileForm.department" placeholder="请输入部门" disabled />
        </el-form-item>
        <el-form-item label="职位">
          <el-input v-model="editProfileForm.role" placeholder="请输入职位" disabled />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showEditProfile = false">取消</el-button>
        <el-button type="primary" @click="saveProfile">保存</el-button>
      </template>
    </el-dialog>

    <!-- 底部导航栏 -->
    <div class="bottom-nav">
      <div class="nav-item" @click="goToHome">
        <el-icon><HomeFilled /></el-icon>
        <span>首页</span>
      </div>
      <div class="nav-item" @click="goToWorkorders">
        <el-icon><Document /></el-icon>
        <span>工单</span>
      </div>
      <div class="nav-item" @click="goToField">
        <el-icon><Calendar /></el-icon>
        <span>外勤</span>
      </div>
      <div class="nav-item active">
        <el-icon><User /></el-icon>
        <span>我的</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  UserFilled,
  ArrowRight,
  Document,
  Calendar,
  Stamp,
  Lock,
  Bell,
  Delete,
  InfoFilled,
  HomeFilled,
  User
} from '@element-plus/icons-vue'

const router = useRouter()

// 用户信息（默认空值，从 localStorage 加载）
const userInfo = ref({
  name: '',
  role: '',
  department: '技术服务部',
  employeeNo: '',
  avatar: '',
  status: 'online'
})

// 是否为审批者（课长、经理等角色）
// 支持中英文角色名：techLead=课长
const isApprover = computed(() => {
  return ['课长', '部长', '经理', '部门负责人', 'techLead', 'director'].includes(userInfo.value.role)
})

// 本月统计
const monthlyStats = ref({
  workorders: 12,
  checkins: 8,
  hours: 168,
  satisfaction: 98
})

// 我的工单数量
const myWorkorderCount = ref(3)

// 待审批数量
const pendingApprovalCount = ref(2)

// 缓存大小
const cacheSize = ref('12.5MB')

// 应用版本
const appVersion = ref('1.0.0')

// 对话框显示状态
const showPasswordDialog = ref(false)
const showNotificationSettings = ref(false)
const showAbout = ref(false)
const showEditProfile = ref(false)

// 密码表单
const passwordForm = ref({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

// 编辑个人信息表单
const editProfileForm = ref({
  name: '',
  phone: '',
  email: '',
  department: '',
  role: ''
})

// 通知设置
const notificationSettings = ref({
  workorder: true,
  checkin: true,
  approval: true,
  system: true
})

// 页面加载时获取数据
onMounted(() => {
  loadUserInfo()
  loadMonthlyStats()
  loadNotificationSettings()
})

// 加载用户信息
const loadUserInfo = () => {
  const saved = localStorage.getItem('userInfo')
  if (saved) {
    userInfo.value = { ...userInfo.value, ...JSON.parse(saved) }
  }
}

// 加载本月统计
const loadMonthlyStats = () => {
  // 从本地存储或API获取
  const saved = localStorage.getItem('monthlyStats')
  if (saved) {
    monthlyStats.value = JSON.parse(saved)
  }
}

// 加载通知设置
const loadNotificationSettings = () => {
  const saved = localStorage.getItem('notificationSettings')
  if (saved) {
    notificationSettings.value = JSON.parse(saved)
  }
}

// 编辑个人信息
const editProfile = () => {
  // 填充表单数据
  editProfileForm.value = {
    name: userInfo.value.name,
    phone: userInfo.value.phone || '',
    email: userInfo.value.email || '',
    department: userInfo.value.department,
    role: userInfo.value.role
  }
  showEditProfile.value = true
}

// 保存个人信息
const saveProfile = () => {
  if (!editProfileForm.value.name) {
    ElMessage.warning('请输入姓名')
    return
  }
  if (!editProfileForm.value.phone) {
    ElMessage.warning('请输入手机号')
    return
  }

  // 更新用户信息
  userInfo.value = {
    ...userInfo.value,
    name: editProfileForm.value.name,
    phone: editProfileForm.value.phone,
    email: editProfileForm.value.email
  }

  // 保存到本地存储
  localStorage.setItem('userInfo', JSON.stringify(userInfo.value))

  ElMessage.success('个人信息已更新')
  showEditProfile.value = false
}

// 跳转到我的工单
const goToMyWorkorders = () => {
  router.push('/staff-workorder-list?filter=all')
}

// 跳转到我的打卡
const goToMyCheckins = () => {
  router.push('/staff-field-checkin-list')
}

// 跳转到我的审批
const goToMyApproval = () => {
  router.push('/staff-field-checkin-list?filter=pending_approval')
}

// 修改密码
const changePassword = () => {
  if (!passwordForm.value.oldPassword) {
    ElMessage.warning('请输入当前密码')
    return
  }
  if (!passwordForm.value.newPassword || passwordForm.value.newPassword.length < 6) {
    ElMessage.warning('新密码长度不能少于6位')
    return
  }
  if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
    ElMessage.warning('两次输入的新密码不一致')
    return
  }

  ElMessage.success('密码修改成功')
  showPasswordDialog.value = false
  passwordForm.value = { oldPassword: '', newPassword: '', confirmPassword: '' }
}

// 保存通知设置
const saveNotificationSettings = () => {
  localStorage.setItem('notificationSettings', JSON.stringify(notificationSettings.value))
  ElMessage.success('通知设置已保存')
  showNotificationSettings.value = false
}

// 清除缓存
const clearCache = () => {
  ElMessageBox.confirm(
    '确定要清除缓存吗？清除后需要重新登录',
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    // 清除本地存储（保留用户信息及业务数据）
    const preserveKeys = ['userInfo', 'staffAuth', 'workorderFlowData', 'notifications', 'customerAuth', 'customerInfo', 'staffViewMode']
    const preserved = {}
    preserveKeys.forEach(k => { const v = localStorage.getItem(k); if (v) preserved[k] = v })
    localStorage.clear()
    Object.entries(preserved).forEach(([k, v]) => { localStorage.setItem(k, v) })
    cacheSize.value = '0MB'
    ElMessage.success('缓存已清除')
  }).catch(() => {})
}

// 退出登录
const logout = () => {
  ElMessageBox.confirm(
    '确定要退出登录吗？',
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    // 清除所有登录相关信息
    localStorage.removeItem('staffAuth')
    localStorage.removeItem('userInfo')
    localStorage.removeItem('staffViewMode')
    ElMessage.success('已退出登录')
    // 强制刷新跳转到登录页
    window.location.href = '/staff-login'
  }).catch(() => {})
}

// 底部导航
const goToHome = () => {
  router.push('/staff-mobile-workspace')
}

const goToWorkorders = () => {
  router.push('/staff-workorder-list?filter=all')
}

const goToField = () => {
  router.push('/staff-field-checkin-list')
}
</script>

<style scoped>
.staff-profile {
  min-height: 100vh;
  background: #f5f7fa;
  padding-bottom: 70px;
}

/* 顶部导航 */
.profile-header {
  background: linear-gradient(135deg, #1890ff 0%, #36cfc9 100%);
  padding: 50px 20px 30px;
  text-align: center;
}

.header-title {
  font-size: 18px;
  font-weight: 500;
  color: white;
}

/* 用户信息卡片 */
.user-card {
  margin: -20px 15px 15px;
  background: white;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 15px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.1);
  position: relative;
}

.user-avatar {
  position: relative;
}

.user-status {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 2px solid white;
}

.user-status.online {
  background: #52c41a;
}

.user-status.offline {
  background: #bfbfbf;
}

.user-info {
  flex: 1;
}

.user-name {
  font-size: 18px;
  font-weight: 600;
  color: #262626;
  margin: 0 0 6px;
}

.user-role {
  font-size: 13px;
  color: #8c8c8c;
  margin: 0 0 4px;
}

.user-no {
  font-size: 12px;
  color: #bfbfbf;
  margin: 0;
}

.edit-icon {
  color: #bfbfbf;
  font-size: 20px;
}

/* 本月统计 */
.stats-section {
  margin: 0 15px 15px;
  background: white;
  border-radius: 12px;
  padding: 15px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.stats-title {
  font-size: 15px;
  font-weight: 500;
  color: #262626;
  margin-bottom: 15px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}

.stat-item {
  text-align: center;
}

.stat-number {
  display: block;
  font-size: 20px;
  font-weight: 600;
  color: #1890ff;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 12px;
  color: #8c8c8c;
}

/* 功能菜单 */
.menu-section {
  margin: 0 15px 15px;
}

.menu-group {
  margin-bottom: 15px;
}

.menu-title {
  font-size: 13px;
  color: #8c8c8c;
  margin-bottom: 10px;
  padding-left: 5px;
}

.menu-list {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 15px;
  cursor: pointer;
  transition: background 0.3s;
  border-bottom: 1px solid #f0f0f0;
}

.menu-item:last-child {
  border-bottom: none;
}

.menu-item:active {
  background: #f5f7fa;
}

.menu-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  font-size: 18px;
}

.menu-icon.workorder {
  background: #e6f7ff;
  color: #1890ff;
}

.menu-icon.checkin {
  background: #f6ffed;
  color: #52c41a;
}

.menu-icon.approval {
  background: #fff7e6;
  color: #fa8c16;
}

.menu-icon.password {
  background: #fff1f0;
  color: #ff4d4f;
}

.menu-icon.notification {
  background: #e6fffb;
  color: #13c2c2;
}

.menu-icon.clear {
  background: #f9f0ff;
  color: #722ed1;
}

.menu-icon.about {
  background: #f0f5ff;
  color: #2f54eb;
}

.menu-text {
  flex: 1;
  font-size: 15px;
  color: #262626;
}

.menu-badge {
  margin-right: 8px;
}

.cache-size,
.version {
  font-size: 13px;
  color: #8c8c8c;
  margin-right: 8px;
}

.menu-arrow {
  color: #bfbfbf;
  font-size: 16px;
}

/* 退出登录 */
.logout-section {
  margin: 30px 15px;
}

/* 通知设置 */
.notification-settings {
  padding: 10px 0;
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 0;
  border-bottom: 1px solid #f0f0f0;
}

.setting-item:last-child {
  border-bottom: none;
}

.setting-item span {
  font-size: 15px;
  color: #262626;
}

/* 关于我们 */
.about-content {
  text-align: center;
  padding: 20px;
}

.about-logo {
  margin-bottom: 15px;
}

.logo-text {
  font-size: 24px;
  font-weight: bold;
  color: #1890ff;
}

.about-content h3 {
  font-size: 18px;
  color: #262626;
  margin: 0 0 10px;
}

.version-text {
  font-size: 14px;
  color: #8c8c8c;
  margin: 0 0 20px;
}

.copyright {
  font-size: 12px;
  color: #bfbfbf;
  margin: 0;
}

/* 底部导航栏 */
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  display: flex;
  justify-content: space-around;
  padding: 8px 0;
  box-shadow: 0 -2px 10px rgba(0,0,0,0.05);
  z-index: 100;
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  color: #8c8c8c;
  font-size: 12px;
}

.nav-item .el-icon {
  font-size: 22px;
}

.nav-item.active {
  color: #1890ff;
}
</style>
