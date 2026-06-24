<template>
  <div class="customer-profile">
    <!-- 顶部导航栏 -->
    <div class="profile-nav">
      <el-button link @click="goBack">
        <el-icon><ArrowLeft /></el-icon>
        <span>返回</span>
      </el-button>
      <span class="nav-title">个人中心</span>
      <span class="placeholder"></span>
    </div>

    <!-- 顶部用户信息卡片 -->
    <div class="profile-header">
      <div class="user-card">
        <el-avatar :size="70" :icon="UserFilled" class="user-avatar" />
        <div class="user-info">
          <h3>{{ userInfo.name }}</h3>
          <p>{{ userInfo.company }}</p>
        </div>
      </div>
    </div>

    <!-- 功能菜单 -->
    <div class="menu-section">
      <div class="menu-group">
        <div class="menu-item" @click="goToMyDevices">
          <div class="menu-icon device">
            <el-icon><Monitor /></el-icon>
          </div>
          <span class="menu-text">我的设备</span>
          <el-icon class="menu-arrow"><ArrowRight /></el-icon>
        </div>
        <div class="menu-item" @click="goToMyWorkorders">
          <div class="menu-icon workorder">
            <el-icon><Document /></el-icon>
          </div>
          <span class="menu-text">我的工单</span>
          <el-icon class="menu-arrow"><ArrowRight /></el-icon>
        </div>
        <div class="menu-item" @click="goToMyQuotations">
          <div class="menu-icon quotation">
            <el-icon><PriceTag /></el-icon>
          </div>
          <span class="menu-text">我的报价</span>
          <el-icon class="menu-arrow"><ArrowRight /></el-icon>
        </div>
      </div>
    </div>

    <!-- 退出登录 -->
    <div class="logout-section">
      <el-button type="danger" plain size="large" round block @click="handleLogout">
        退出登录
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useCustomerStore } from '../stores/customerStore'
import {
  UserFilled,
  Monitor,
  Document,
  PriceTag,
  ArrowRight,
  ArrowLeft
} from '@element-plus/icons-vue'

const router = useRouter()
const customerStore = useCustomerStore()

// 用户信息
const userInfo = ref({
  name: '',
  company: '',
  role: '企业客户',
  phone: '',
  email: ''
})

// 加载用户信息
const loadUserInfo = () => {
  // 优先从 staffAuth 读取（统一登录写入）
  try {
    const auth = JSON.parse(localStorage.getItem('staffAuth') || '{}')
    if (auth.role === 'customer') {
      userInfo.value = {
        name: auth.name || '',
        company: auth.companyName || '',
        role: auth.roleName || '企业客户',
        phone: auth.phone || '',
        email: ''
      }
      return
    }
  } catch (e) {}

  // 回退到 customerStore
  const customer = customerStore.customerInfo
  if (customer) {
    userInfo.value = {
      name: customer.name || '',
      company: customer.companyName || '',
      role: '企业客户',
      phone: customer.phone || '',
      email: customer.email || ''
    }
  }
}

onMounted(() => {
  loadUserInfo()
})

// 返回首页
const goBack = () => {
  router.push('/customer-workspace')
}

// 我的设备
const goToMyDevices = () => {
  router.push('/customer-device-list')
}

// 我的工单
const goToMyWorkorders = () => {
  router.push('/customer-workorder-list')
}

// 我的报价
const goToMyQuotations = () => {
  ElMessage.info('我的报价功能开发中')
}

// 退出登录
const handleLogout = () => {
  ElMessageBox.confirm('确定要退出登录吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    // 调用 store 的退出登录方法
    customerStore.logout()
    // 清除员工登录状态（如果有）
    localStorage.removeItem('staffAuth')
    localStorage.removeItem('userInfo')
    ElMessage.success('已退出登录')
    // 跳转到统一登录页
    window.location.href = '/login'
  }).catch(() => {})
}
</script>

<style scoped>
.customer-profile {
  min-height: 100vh;
  background: #f5f7fa;
  padding-bottom: 20px;
  width: 100vw;
  max-width: 100%;
  overflow-x: hidden;
  box-sizing: border-box;
  /* 隐藏滚动条但保留滚动功能 */
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.customer-profile::-webkit-scrollbar {
  display: none;
}

/* 顶部导航栏 */
.profile-nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 15px;
  background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
  color: white;
}

.profile-nav .el-button {
  color: white;
  font-size: 14px;
}

.nav-title {
  font-size: 17px;
  font-weight: 500;
}

.placeholder {
  width: 60px;
}

/* 顶部用户信息 */
.profile-header {
  background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
  padding: 10px 20px 30px;
}

.user-card {
  display: flex;
  align-items: center;
  gap: 15px;
}

.user-avatar {
  background: white;
  color: #1890ff;
  font-size: 35px;
}

.user-info h3 {
  margin: 0 0 5px;
  font-size: 20px;
  color: white;
  font-weight: 500;
}

.user-info p {
  margin: 0;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.9);
}

/* 功能菜单 */
.menu-section {
  padding: 0 15px;
}

.menu-group {
  background: white;
  border-radius: 12px;
  margin-bottom: 15px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 15px;
  cursor: pointer;
  transition: all 0.3s;
  border-bottom: 1px solid #f5f5f5;
}

.menu-item:last-child {
  border-bottom: none;
}

.menu-item:active {
  background: #f5f5f5;
}

.menu-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  font-size: 20px;
}

.menu-icon.device {
  background: #e6f7ff;
  color: #1890ff;
}

.menu-icon.workorder {
  background: #f6ffed;
  color: #52c41a;
}

.menu-icon.quotation {
  background: #fff7e6;
  color: #fa8c16;
}

.menu-text {
  flex: 1;
  font-size: 15px;
  color: #262626;
}

.menu-arrow {
  color: #bfbfbf;
  font-size: 16px;
}

/* 退出登录 */
.logout-section {
  padding: 20px 15px;
}

/* 小屏幕适配 */
@media (max-width: 375px) {
  .profile-header {
    padding: 20px 15px;
  }

  .user-info h3 {
    font-size: 18px;
  }

  .menu-section {
    padding: 0 10px;
  }

  .menu-item {
    padding: 12px;
  }

  .menu-icon {
    width: 36px;
    height: 36px;
    font-size: 18px;
  }

  .menu-text {
    font-size: 14px;
  }
}

/* 平板及以上 */
@media (min-width: 768px) {
  .customer-profile {
    max-width: 414px;
    margin: 0 auto;
    border-left: 1px solid #e8e8e8;
    border-right: 1px solid #e8e8e8;
  }
}
</style>
