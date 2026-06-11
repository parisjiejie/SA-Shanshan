<template>
  <div class="staff-profile-desktop">
    <el-card class="profile-card">
      <template #header>
        <div class="card-header">
          <span>个人中心</span>
        </div>
      </template>

      <div class="profile-content">
        <!-- 用户信息 -->
        <div class="user-info-section">
          <div class="user-avatar">
            <el-avatar :size="100" :src="userInfo.avatar">
              <el-icon :size="50"><UserFilled /></el-icon>
            </el-avatar>
          </div>
          <div class="user-details">
            <h2 class="user-name">{{ userInfo.name || '未设置' }}</h2>
            <p class="user-role">{{ userInfo.role || '未设置' }}</p>
            <p class="user-dept">{{ userInfo.department }}</p>
            <p class="user-no" v-if="userInfo.employeeNo">工号: {{ userInfo.employeeNo }}</p>
          </div>
        </div>

        <el-divider />

        <!-- 本月统计 -->
        <div class="stats-section">
          <h3>本月工作统计</h3>
          <el-row :gutter="20">
            <el-col :span="6">
              <div class="stat-card">
                <div class="stat-number">{{ monthlyStats.workorders }}</div>
                <div class="stat-label">完成工单</div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="stat-card">
                <div class="stat-number">{{ monthlyStats.checkins }}</div>
                <div class="stat-label">外勤打卡</div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="stat-card">
                <div class="stat-number">{{ monthlyStats.hours }}</div>
                <div class="stat-label">工作时长(h)</div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="stat-card">
                <div class="stat-number">{{ monthlyStats.satisfaction }}%</div>
                <div class="stat-label">满意度</div>
              </div>
            </el-col>
          </el-row>
        </div>

        <el-divider />

        <!-- 功能菜单 -->
        <div class="menu-section">
          <h3>功能菜单</h3>
          <div class="menu-grid">
            <div class="menu-item" @click="goToMyWorkorders">
              <el-icon><Document /></el-icon>
              <span>我的工单</span>
              <el-tag v-if="myWorkorderCount > 0" type="danger" size="small">{{ myWorkorderCount }}</el-tag>
            </div>
            <div class="menu-item" @click="goToMyCheckins">
              <el-icon><Calendar /></el-icon>
              <span>我的打卡</span>
            </div>
            <div class="menu-item" @click="goToMyApproval" v-if="isApprover">
              <el-icon><Stamp /></el-icon>
              <span>我的审批</span>
              <el-tag v-if="pendingApprovalCount > 0" type="danger" size="small">{{ pendingApprovalCount }}</el-tag>
            </div>
            <div class="menu-item" @click="showPasswordDialog = true">
              <el-icon><Lock /></el-icon>
              <span>修改密码</span>
            </div>
          </div>
        </div>
      </div>
    </el-card>

    <!-- 修改密码对话框 -->
    <el-dialog
      v-model="showPasswordDialog"
      title="修改密码"
      width="400px"
    >
      <el-form :model="passwordForm" label-width="100px">
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
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  UserFilled,
  Document,
  Calendar,
  Stamp,
  Lock
} from '@element-plus/icons-vue'

const router = useRouter()

// 用户信息
const userInfo = ref({
  name: '',
  role: '',
  department: '技术服务部',
  employeeNo: '',
  avatar: ''
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

// 对话框显示状态
const showPasswordDialog = ref(false)

// 密码表单
const passwordForm = ref({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

// 页面加载时获取数据
onMounted(() => {
  loadUserInfo()
  loadMonthlyStats()
})

// 加载用户信息
const loadUserInfo = () => {
  const saved = localStorage.getItem('userInfo')
  if (saved) {
    try {
      const parsed = JSON.parse(saved)
      userInfo.value = { ...userInfo.value, ...parsed }
    } catch (e) {
      console.error('解析用户信息失败', e)
    }
  }
  // 同时从 staffAuth 获取更多信息
  const staffAuth = localStorage.getItem('staffAuth')
  if (staffAuth) {
    try {
      const parsed = JSON.parse(staffAuth)
      userInfo.value.name = parsed.name || userInfo.value.name
      // role 使用 userInfo 中的中文角色名
    } catch (e) {
      console.error('解析 staffAuth 失败', e)
    }
  }
}

// 加载本月统计
const loadMonthlyStats = () => {
  const saved = localStorage.getItem('monthlyStats')
  if (saved) {
    try {
      monthlyStats.value = JSON.parse(saved)
    } catch (e) {
      console.error('解析统计数据失败', e)
    }
  }
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
</script>

<style scoped>
.staff-profile-desktop {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.profile-card {
  min-height: calc(100vh - 140px);
}

.card-header {
  font-size: 18px;
  font-weight: 600;
}

.profile-content {
  padding: 20px 0;
}

/* 用户信息 */
.user-info-section {
  display: flex;
  align-items: center;
  gap: 30px;
  padding: 20px;
}

.user-avatar {
  flex-shrink: 0;
}

.user-details {
  flex: 1;
}

.user-name {
  font-size: 24px;
  font-weight: 600;
  color: #262626;
  margin: 0 0 10px;
}

.user-role {
  font-size: 16px;
  color: #1890ff;
  margin: 0 0 8px;
}

.user-dept {
  font-size: 14px;
  color: #8c8c8c;
  margin: 0 0 5px;
}

.user-no {
  font-size: 13px;
  color: #bfbfbf;
  margin: 0;
}

/* 统计 */
.stats-section {
  padding: 20px;
}

.stats-section h3 {
  font-size: 16px;
  font-weight: 500;
  color: #262626;
  margin-bottom: 20px;
}

.stat-card {
  background: #f5f7fa;
  border-radius: 8px;
  padding: 20px;
  text-align: center;
}

.stat-number {
  font-size: 28px;
  font-weight: 600;
  color: #1890ff;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 14px;
  color: #8c8c8c;
}

/* 菜单 */
.menu-section {
  padding: 20px;
}

.menu-section h3 {
  font-size: 16px;
  font-weight: 500;
  color: #262626;
  margin-bottom: 20px;
}

.menu-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 15px;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px;
  background: #f5f7fa;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
}

.menu-item:hover {
  background: #e6f7ff;
  transform: translateY(-2px);
}

.menu-item .el-icon {
  font-size: 24px;
  color: #1890ff;
}

.menu-item span {
  flex: 1;
  font-size: 15px;
  color: #262626;
}
</style>
