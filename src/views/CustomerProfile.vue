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
          <el-tag size="small" type="success">{{ userInfo.role }}</el-tag>
        </div>
      </div>
    </div>

    <!-- 数据统计 -->
    <div class="stats-section">
      <div class="stats-grid">
        <div class="stat-item" @click="goToWorkorders('all')">
          <span class="stat-number">{{ stats.total }}</span>
          <span class="stat-label">全部工单</span>
        </div>
        <div class="stat-item" @click="goToWorkorders('processing')">
          <span class="stat-number">{{ stats.processing }}</span>
          <span class="stat-label">进行中</span>
        </div>
        <div class="stat-item" @click="goToWorkorders('pending')">
          <span class="stat-number">{{ stats.pending }}</span>
          <span class="stat-label">待确认</span>
        </div>
        <div class="stat-item" @click="goToWorkorders('completed')">
          <span class="stat-number">{{ stats.completed }}</span>
          <span class="stat-label">已完成</span>
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

      <div class="menu-group">
        <div class="menu-item" @click="goToContactInfo">
          <div class="menu-icon contact">
            <el-icon><User /></el-icon>
          </div>
          <span class="menu-text">联系信息</span>
          <el-icon class="menu-arrow"><ArrowRight /></el-icon>
        </div>
        <div class="menu-item" @click="goToAddressManage">
          <div class="menu-icon address">
            <el-icon><Location /></el-icon>
          </div>
          <span class="menu-text">地址管理</span>
          <el-icon class="menu-arrow"><ArrowRight /></el-icon>
        </div>
      </div>

      <div class="menu-group">
        <div class="menu-item" @click="goToHelp">
          <div class="menu-icon help">
            <el-icon><QuestionFilled /></el-icon>
          </div>
          <span class="menu-text">帮助中心</span>
          <el-icon class="menu-arrow"><ArrowRight /></el-icon>
        </div>
        <div class="menu-item" @click="goToFeedback">
          <div class="menu-icon feedback">
            <el-icon><ChatDotRound /></el-icon>
          </div>
          <span class="menu-text">意见反馈</span>
          <el-icon class="menu-arrow"><ArrowRight /></el-icon>
        </div>
        <div class="menu-item" @click="goToAbout">
          <div class="menu-icon about">
            <el-icon><InfoFilled /></el-icon>
          </div>
          <span class="menu-text">关于我们</span>
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

    <!-- 联系信息对话框 -->
    <el-dialog
      v-model="contactDialog.visible"
      title="联系信息"
      width="90%"
      class="mobile-dialog"
      :show-close="false"
    >
      <el-form :model="contactDialog.form" label-position="top">
        <el-form-item label="联系人">
          <el-input v-model="contactDialog.form.name" placeholder="请输入联系人姓名" />
        </el-form-item>
        <el-form-item label="联系电话">
          <el-input v-model="contactDialog.form.phone" placeholder="请输入联系电话" />
        </el-form-item>
        <el-form-item label="电子邮箱">
          <el-input v-model="contactDialog.form.email" placeholder="请输入电子邮箱" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="contactDialog.visible = false">取消</el-button>
        <el-button type="primary" @click="saveContactInfo">保存</el-button>
      </template>
    </el-dialog>

    <!-- 意见反馈对话框 -->
    <el-dialog
      v-model="feedbackDialog.visible"
      title="意见反馈"
      width="90%"
      class="mobile-dialog"
      :show-close="false"
    >
      <el-form :model="feedbackDialog.form" label-position="top">
        <el-form-item label="反馈类型">
          <el-radio-group v-model="feedbackDialog.form.type">
            <el-radio label="功能建议">功能建议</el-radio>
            <el-radio label="问题反馈">问题反馈</el-radio>
            <el-radio label="其他">其他</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="反馈内容">
          <el-input
            v-model="feedbackDialog.form.content"
            type="textarea"
            :rows="4"
            placeholder="请输入您的意见或建议"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="feedbackDialog.visible = false">取消</el-button>
        <el-button type="primary" @click="submitFeedback">提交</el-button>
      </template>
    </el-dialog>

    <!-- 关于我们对话框 -->
    <el-dialog
      v-model="aboutDialog.visible"
      title="关于我们"
      width="90%"
      class="mobile-dialog"
      :show-close="false"
    >
      <div class="about-content">
        <div class="app-logo">
          <el-avatar :size="80" :icon="Setting" />
          <h3>售后管理系统</h3>
          <p>版本：v1.0.0</p>
        </div>
        <div class="about-info">
          <p>专业的售后服务管理平台，为您提供便捷的工单管理、设备维护、配件购买等服务。</p>
          <p>客服电话：400-xxx-xxxx</p>
          <p>服务时间：周一至周五 9:00-18:00</p>
        </div>
      </div>
      <template #footer>
        <el-button @click="aboutDialog.visible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useCustomerStore } from '../stores/customerStore'
import {
  UserFilled,
  Monitor,
  Document,
  PriceTag,
  User,
  Location,
  QuestionFilled,
  ChatDotRound,
  InfoFilled,
  ArrowRight,
  Setting,
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

// 工单列表数据（与CustomerWorkorderList保持一致）
const workorders = ref([
  {
    id: 1,
    workorderId: 'WO2024001',
    type: 'service',
    deviceModel: '激光切割机 LX-3000',
    faultDescription: '设备无法正常启动，显示屏报错E01',
    status: 'pending_sign',
    createTime: new Date(Date.now() - 86400000 * 2)
  },
  {
    id: 2,
    workorderId: 'WO2024002',
    type: 'service',
    deviceModel: '数控折弯机 ZW-1500',
    faultDescription: '液压系统压力不足',
    status: 'processing',
    createTime: new Date(Date.now() - 86400000 * 5)
  },
  {
    id: 3,
    workorderId: 'WO2024003',
    type: 'parts',
    description: '购买激光切割头保护镜片',
    status: 'quotation_pending',
    createTime: new Date(Date.now() - 86400000)
  },
  {
    id: 4,
    workorderId: 'WO2024004',
    type: 'service',
    deviceModel: '激光切割机 LX-3000',
    faultDescription: '定期保养维护',
    status: 'completed',
    createTime: new Date(Date.now() - 86400000 * 10)
  }
])

// 统计数据 - 根据工单数据动态计算
const stats = computed(() => ({
  total: workorders.value.length,
  processing: workorders.value.filter(w => ['processing', 'assigned', 'accepted'].includes(w.status)).length,
  pending: workorders.value.filter(w => ['pending_sign', 'quotation_pending'].includes(w.status)).length,
  completed: workorders.value.filter(w => ['completed', 'closed'].includes(w.status)).length
}))

// 联系信息对话框
const contactDialog = reactive({
  visible: false,
  form: {
    name: '张经理',
    phone: '13800138000',
    email: 'zhang@example.com'
  }
})

// 意见反馈对话框
const feedbackDialog = reactive({
  visible: false,
  form: {
    type: '功能建议',
    content: ''
  }
})

// 关于我们对话框
const aboutDialog = reactive({
  visible: false
})

// 返回首页
const goBack = () => {
  router.push('/customer-workspace')
}

// 跳转到工单列表
const goToWorkorders = (type) => {
  router.push(`/customer-workorder-list?filter=${type}`)
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

// 联系信息
const goToContactInfo = () => {
  contactDialog.visible = true
}

// 保存联系信息
const saveContactInfo = () => {
  ElMessage.success('联系信息保存成功')
  contactDialog.visible = false
}

// 地址管理
const goToAddressManage = () => {
  ElMessage.info('地址管理功能开发中')
}

// 帮助中心
const goToHelp = () => {
  ElMessage.info('帮助中心功能开发中')
}

// 意见反馈
const goToFeedback = () => {
  feedbackDialog.visible = true
  feedbackDialog.form.content = ''
}

// 提交反馈
const submitFeedback = () => {
  if (!feedbackDialog.form.content.trim()) {
    ElMessage.warning('请输入反馈内容')
    return
  }
  ElMessage.success('感谢您的反馈，我们会尽快处理')
  feedbackDialog.visible = false
}

// 关于我们
const goToAbout = () => {
  aboutDialog.visible = true
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
  margin: 0 0 8px;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.9);
}

/* 数据统计 */
.stats-section {
  margin: -20px 15px 15px;
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  position: relative;
  z-index: 1;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  padding: 10px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
}

.stat-item:active {
  background: #f5f5f5;
}

.stat-number {
  font-size: 24px;
  font-weight: 600;
  color: #1890ff;
}

.stat-label {
  font-size: 12px;
  color: #8c8c8c;
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

.menu-icon.contact {
  background: #f9f0ff;
  color: #722ed1;
}

.menu-icon.address {
  background: #fff1f0;
  color: #f5222d;
}

.menu-icon.help {
  background: #e6fffb;
  color: #13c2c2;
}

.menu-icon.feedback {
  background: #fff2e8;
  color: #fa541c;
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

.menu-arrow {
  color: #bfbfbf;
  font-size: 16px;
}

/* 退出登录 */
.logout-section {
  padding: 20px 15px;
}

/* 关于我们内容 */
.about-content {
  text-align: center;
  padding: 20px;
}

.app-logo {
  margin-bottom: 20px;
}

.app-logo .el-avatar {
  background: #1890ff;
  color: white;
  font-size: 40px;
  margin-bottom: 15px;
}

.app-logo h3 {
  margin: 0 0 5px;
  font-size: 18px;
  color: #262626;
}

.app-logo p {
  margin: 0;
  font-size: 14px;
  color: #8c8c8c;
}

.about-info {
  text-align: left;
  color: #595959;
  line-height: 1.8;
}

.about-info p {
  margin: 10px 0;
}

/* 对话框样式 */
:deep(.mobile-dialog) {
  border-radius: 12px 12px 0 0;
  margin: 0;
  margin-top: auto;
}

:deep(.mobile-dialog .el-dialog__body) {
  padding: 15px;
}

/* 小屏幕适配 */
@media (max-width: 375px) {
  .profile-header {
    padding: 20px 15px;
  }

  .user-info h3 {
    font-size: 18px;
  }

  .stats-section {
    margin: -15px 10px 10px;
    padding: 15px;
  }

  .stat-number {
    font-size: 20px;
  }

  .stat-label {
    font-size: 11px;
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
