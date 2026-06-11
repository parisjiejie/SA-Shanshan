<template>
  <div class="team-management">
    <!-- 顶部导航 -->
    <div class="page-header">
      <el-button link @click="goBack">
        <el-icon><ArrowLeft /></el-icon>
        <span>返回</span>
      </el-button>
      <span class="header-title">团队管理</span>
      <span class="placeholder"></span>
    </div>

    <!-- 团队概览 -->
    <div class="team-overview">
      <div class="overview-card">
        <div class="overview-item">
          <span class="overview-number">{{ teamMembers.length }}</span>
          <span class="overview-label">团队成员</span>
        </div>
        <div class="overview-item">
          <span class="overview-number">{{ onlineCount }}</span>
          <span class="overview-label">在线</span>
        </div>
        <div class="overview-item">
          <span class="overview-number">{{ todayWorkorders }}</span>
          <span class="overview-label">今日工单</span>
        </div>
      </div>
    </div>

    <!-- 成员列表 -->
    <div class="member-section">
      <div class="section-header">
        <span class="section-title">成员列表</span>
        <el-button link size="small" @click="showAddMember = true">
          <el-icon><Plus /></el-icon>
          添加成员
        </el-button>
      </div>
      
      <div class="member-list">
        <div 
          v-for="member in teamMembers" 
          :key="member.id" 
          class="member-card"
          @click="viewMemberDetail(member)"
        >
          <div class="member-avatar">
            <el-avatar :size="50" :icon="UserFilled" />
            <div class="member-status" :class="member.status"></div>
          </div>
          <div class="member-info">
            <div class="member-name-row">
              <span class="member-name">{{ member.name }}</span>
              <el-tag size="small" :type="getRoleType(member.role)">{{ member.role }}</el-tag>
            </div>
            <div class="member-stats">
              <span>今日 {{ member.todayWorkorders }} 单</span>
              <span class="divider">|</span>
              <span>累计 {{ member.completed }} 单</span>
            </div>
            <div class="member-contact">
              <el-icon><Phone /></el-icon>
              <span>{{ member.phone }}</span>
            </div>
          </div>
          <el-icon class="member-arrow"><ArrowRight /></el-icon>
        </div>
      </div>
    </div>

    <!-- 成员详情对话框 -->
    <el-dialog
      v-model="memberDetailVisible"
      title="成员详情"
      width="95%"
      class="mobile-dialog"
    >
      <div v-if="selectedMember" class="member-detail">
        <div class="detail-header">
          <el-avatar :size="80" :icon="UserFilled" />
          <h3>{{ selectedMember.name }}</h3>
          <el-tag :type="getRoleType(selectedMember.role)">{{ selectedMember.role }}</el-tag>
        </div>
        
        <div class="detail-info">
          <div class="info-item">
            <span class="label">手机号</span>
            <span class="value">{{ selectedMember.phone }}</span>
          </div>
          <div class="info-item">
            <span class="label">状态</span>
            <el-tag :type="selectedMember.status === 'online' ? 'success' : 'info'" size="small">
              {{ selectedMember.status === 'online' ? '在线' : '离线' }}
            </el-tag>
          </div>
          <div class="info-item">
            <span class="label">今日工单</span>
            <span class="value">{{ selectedMember.todayWorkorders }} 单</span>
          </div>
          <div class="info-item">
            <span class="label">累计完成</span>
            <span class="value">{{ selectedMember.completed }} 单</span>
          </div>
          <div class="info-item">
            <span class="label">本月工时</span>
            <span class="value">{{ selectedMember.monthlyHours || 0 }} 小时</span>
          </div>
        </div>

        <div class="detail-actions">
          <el-button type="primary" @click="callMember(selectedMember.phone)">
            <el-icon><Phone /></el-icon>
            拨打电话
          </el-button>
          <el-button @click="viewMemberWorkorders(selectedMember)">
            <el-icon><Document /></el-icon>
            查看工单
          </el-button>
        </div>
      </div>
    </el-dialog>

    <!-- 添加成员对话框 -->
    <el-dialog
      v-model="showAddMember"
      title="添加成员"
      width="95%"
      class="mobile-dialog"
    >
      <el-form :model="newMemberForm" label-position="top">
        <el-form-item label="姓名">
          <el-input v-model="newMemberForm.name" placeholder="请输入姓名" />
        </el-form-item>
        <el-form-item label="手机号">
          <el-input v-model="newMemberForm.phone" placeholder="请输入手机号" />
        </el-form-item>
        <el-form-item label="角色">
          <el-select v-model="newMemberForm.role" placeholder="请选择角色" style="width: 100%">
            <el-option label="工程师" value="工程师" />
            <el-option label="课长" value="课长" />
            <el-option label="业务助理" value="业务助理" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddMember = false">取消</el-button>
        <el-button type="primary" @click="addMember">确认添加</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  ArrowLeft,
  UserFilled,
  Phone,
  ArrowRight,
  Plus,
  Document
} from '@element-plus/icons-vue'

const router = useRouter()

// 团队成员列表
const teamMembers = ref([
  { id: 1, name: '张工程师', role: '工程师', status: 'online', todayWorkorders: 2, completed: 15, phone: '13800138001', monthlyHours: 168 },
  { id: 2, name: '王工程师', role: '工程师', status: 'online', todayWorkorders: 1, completed: 12, phone: '13800138002', monthlyHours: 160 },
  { id: 3, name: '李工程师', role: '工程师', status: 'offline', todayWorkorders: 0, completed: 18, phone: '13800138003', monthlyHours: 172 },
  { id: 4, name: '赵工程师', role: '工程师', status: 'online', todayWorkorders: 3, completed: 10, phone: '13800138004', monthlyHours: 155 },
  { id: 5, name: '陈工程师', role: '工程师', status: 'offline', todayWorkorders: 0, completed: 8, phone: '13800138005', monthlyHours: 140 }
])

// 计算属性
const onlineCount = computed(() => {
  return teamMembers.value.filter(m => m.status === 'online').length
})

const todayWorkorders = computed(() => {
  return teamMembers.value.reduce((sum, m) => sum + m.todayWorkorders, 0)
})

// 选中的成员
const selectedMember = ref(null)
const memberDetailVisible = ref(false)
const showAddMember = ref(false)

// 新成员表单
const newMemberForm = ref({
  name: '',
  phone: '',
  role: '工程师'
})

// 方法
const goBack = () => {
  router.back()
}

const getRoleType = (role) => {
  const types = {
    '工程师': '',
    '课长': 'success',
    '业务助理': 'warning',
    '经理': 'danger'
  }
  return types[role] || ''
}

const viewMemberDetail = (member) => {
  selectedMember.value = member
  memberDetailVisible.value = true
}

const callMember = (phone) => {
  window.location.href = `tel:${phone}`
}

const viewMemberWorkorders = (member) => {
  router.push(`/staff-workorder-list?filter=all&member=${member.id}`)
  memberDetailVisible.value = false
}

const addMember = () => {
  if (!newMemberForm.value.name || !newMemberForm.value.phone) {
    ElMessage.warning('请填写完整信息')
    return
  }
  
  const newMember = {
    id: Date.now(),
    name: newMemberForm.value.name,
    phone: newMemberForm.value.phone,
    role: newMemberForm.value.role,
    status: 'offline',
    todayWorkorders: 0,
    completed: 0,
    monthlyHours: 0
  }
  
  teamMembers.value.push(newMember)
  showAddMember.value = false
  newMemberForm.value = { name: '', phone: '', role: '工程师' }
  ElMessage.success('添加成功')
}

onMounted(() => {
  // 从本地存储加载团队成员数据
  const saved = localStorage.getItem('teamMembers')
  if (saved) {
    teamMembers.value = JSON.parse(saved)
  }
})
</script>

<style scoped>
.team-management {
  min-height: 100vh;
  background: #f5f7fa;
  padding-bottom: 20px;
  width: 100vw;
  max-width: 100%;
  overflow-x: hidden;
  box-sizing: border-box;
}

/* 顶部导航 */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 15px;
  background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
  color: white;
}

.page-header .el-button {
  color: white;
  font-size: 14px;
}

.header-title {
  font-size: 17px;
  font-weight: 500;
}

.placeholder {
  width: 60px;
}

/* 团队概览 */
.team-overview {
  padding: 15px;
}

.overview-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  justify-content: space-around;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.overview-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.overview-number {
  font-size: 28px;
  font-weight: 600;
  color: #1890ff;
}

.overview-label {
  font-size: 13px;
  color: #8c8c8c;
}

/* 成员列表 */
.member-section {
  padding: 0 15px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.section-title {
  font-size: 16px;
  font-weight: 500;
  color: #262626;
}

.member-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.member-card {
  background: white;
  border-radius: 12px;
  padding: 15px;
  display: flex;
  align-items: center;
  gap: 15px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  cursor: pointer;
  transition: all 0.3s;
}

.member-card:active {
  transform: scale(0.98);
}

.member-avatar {
  position: relative;
}

.member-status {
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid white;
}

.member-status.online {
  background: #52c41a;
}

.member-status.offline {
  background: #bfbfbf;
}

.member-info {
  flex: 1;
  min-width: 0;
}

.member-name-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.member-name {
  font-size: 16px;
  font-weight: 500;
  color: #262626;
}

.member-stats {
  font-size: 13px;
  color: #8c8c8c;
  margin-bottom: 6px;
}

.member-stats .divider {
  margin: 0 8px;
  color: #d9d9d9;
}

.member-contact {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #1890ff;
}

.member-arrow {
  color: #bfbfbf;
  font-size: 18px;
}

/* 成员详情 */
.member-detail {
  padding: 10px 0;
}

.detail-header {
  text-align: center;
  margin-bottom: 20px;
}

.detail-header h3 {
  margin: 12px 0 8px;
  font-size: 20px;
  color: #262626;
}

.detail-info {
  background: #f5f7fa;
  border-radius: 12px;
  padding: 15px;
  margin-bottom: 20px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #e8e8e8;
}

.info-item:last-child {
  border-bottom: none;
}

.info-item .label {
  font-size: 14px;
  color: #8c8c8c;
}

.info-item .value {
  font-size: 14px;
  color: #262626;
  font-weight: 500;
}

.detail-actions {
  display: flex;
  gap: 12px;
}

.detail-actions .el-button {
  flex: 1;
}

/* 响应式适配 */
@media (min-width: 768px) {
  .team-management {
    max-width: 414px;
    margin: 0 auto;
    border-left: 1px solid #e8e8e8;
    border-right: 1px solid #e8e8e8;
  }
}
</style>
