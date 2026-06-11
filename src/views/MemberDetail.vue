<template>
  <div class="member-detail">
    <!-- 顶部导航 -->
    <div class="detail-header">
      <el-button link @click="goBack">
        <el-icon><ArrowLeft /></el-icon>
        <span>返回</span>
      </el-button>
      <span class="header-title">成员详情</span>
      <span class="placeholder"></span>
    </div>

    <!-- 成员信息卡片 -->
    <div class="member-card" v-if="member">
      <div class="member-avatar">
        <el-avatar :size="80" :icon="UserIcon" />
        <div class="member-status" :class="member.status"></div>
      </div>
      <div class="member-info">
        <h3 class="member-name">{{ member.name }}</h3>
        <p class="member-role">{{ member.role }} | 技术服务部</p>
        <p class="member-status-text">{{ member.status === 'online' ? '在线' : '离线' }}</p>
      </div>
    </div>

    <!-- 工作统计 -->
    <div class="stats-section" v-if="member">
      <div class="section-title">工作统计</div>
      <div class="stats-grid">
        <div class="stat-item">
          <span class="stat-number">{{ member.todayWorkorders }}</span>
          <span class="stat-label">今日工单</span>
        </div>
        <div class="stat-item">
          <span class="stat-number">{{ member.completed }}</span>
          <span class="stat-label">累计完成</span>
        </div>
        <div class="stat-item">
          <span class="stat-number">{{ member.checkinCount || 0 }}</span>
          <span class="stat-label">本月打卡</span>
        </div>
        <div class="stat-item">
          <span class="stat-number">{{ member.workHours || 0 }}h</span>
          <span class="stat-label">本月工时</span>
        </div>
      </div>
    </div>

    <!-- 今日工单 -->
    <div class="workorder-section" v-if="member">
      <div class="section-header">
        <span class="section-title">今日工单</span>
        <el-tag type="primary" size="small">{{ todayWorkorders.length }}</el-tag>
      </div>
      <div class="workorder-list">
        <div v-if="todayWorkorders.length === 0" class="empty-state">
          <el-icon><Document /></el-icon>
          <p>今日暂无工单</p>
        </div>
        <div
          v-for="workorder in todayWorkorders"
          :key="workorder.id"
          class="workorder-item"
          @click="viewWorkorderDetail(workorder)"
        >
          <div class="workorder-header">
            <span class="workorder-id">{{ workorder.workorderId }}</span>
            <el-tag :type="getStatusType(workorder.status)" size="small">
              {{ getStatusText(workorder.status) }}
            </el-tag>
          </div>
          <div class="workorder-content">
            <p class="customer-name">{{ workorder.customerName }}</p>
            <p class="device-model">{{ workorder.deviceModel }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="action-section" v-if="member">
      <el-button type="primary" size="large" block @click="viewMemberWorkorders">
        查看全部工单
      </el-button>
      <el-button type="success" size="large" block @click="viewMemberCheckins" style="margin-top: 10px;">
        查看打卡记录
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  ArrowLeft,
  User as UserIcon,
  Document
} from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()

// 成员信息
const member = ref(null)

// 今日工单列表
const todayWorkorders = ref([
  {
    id: 1,
    workorderId: 'WO2024001',
    customerName: '某某科技有限公司',
    deviceModel: '激光切割机 LX-3000',
    status: 'processing'
  },
  {
    id: 2,
    workorderId: 'WO2024002',
    customerName: '某某制造厂',
    deviceModel: '数控折弯机 ZW-1500',
    status: 'assigned'
  }
])

// 加载成员信息
const loadMemberInfo = () => {
  const memberId = route.query.id
  if (!memberId) {
    ElMessage.warning('成员ID不能为空')
    return
  }

  // 从本地存储或API获取成员信息
  // 这里使用模拟数据
  const members = [
    { id: 1, name: '张工程师', role: '工程师', status: 'online', todayWorkorders: 2, completed: 15, checkinCount: 8, workHours: 168 },
    { id: 2, name: '王工程师', role: '工程师', status: 'online', todayWorkorders: 1, completed: 12, checkinCount: 6, workHours: 144 },
    { id: 3, name: '李工程师', role: '工程师', status: 'offline', todayWorkorders: 0, completed: 18, checkinCount: 10, workHours: 192 },
    { id: 4, name: '赵工程师', role: '工程师', status: 'online', todayWorkorders: 3, completed: 10, checkinCount: 5, workHours: 120 },
    { id: 5, name: '陈工程师', role: '工程师', status: 'offline', todayWorkorders: 0, completed: 8, checkinCount: 4, workHours: 96 }
  ]

  const found = members.find(m => m.id === parseInt(memberId))
  if (found) {
    member.value = found
  } else {
    ElMessage.warning('成员不存在')
  }
}

// 返回上一页
const goBack = () => {
  router.push('/staff-mobile-workspace')
}

// 查看工单详情
const viewWorkorderDetail = (workorder) => {
  router.push(`/staff-workorder-detail?id=${workorder.id}`)
}

// 查看成员全部工单
const viewMemberWorkorders = () => {
  router.push(`/staff-workorder-list?filter=all&memberId=${member.value.id}`)
}

// 查看成员打卡记录
const viewMemberCheckins = () => {
  router.push(`/staff-field-checkin-list?filter=all&memberId=${member.value.id}`)
}

// 获取状态类型
const getStatusType = (status) => {
  const types = {
    assigned: 'info',
    processing: 'warning',
    pending_sign: 'danger',
    completed: 'success'
  }
  return types[status] || 'info'
}

// 获取状态文本
const getStatusText = (status) => {
  const texts = {
    assigned: '待接单',
    processing: '进行中',
    pending_sign: '待签字',
    completed: '已完成'
  }
  return texts[status] || status
}

onMounted(() => {
  loadMemberInfo()
})
</script>

<style scoped>
.member-detail {
  min-height: 100vh;
  background: #f5f7fa;
  padding-bottom: 20px;
}

/* 顶部导航 */
.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 15px;
  background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
  color: white;
}

.detail-header .el-button {
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

/* 成员信息卡片 */
.member-card {
  margin: 15px;
  background: white;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 15px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.member-avatar {
  position: relative;
}

.member-status {
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 14px;
  height: 14px;
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
}

.member-name {
  font-size: 18px;
  font-weight: 600;
  color: #262626;
  margin: 0 0 6px;
}

.member-role {
  font-size: 13px;
  color: #8c8c8c;
  margin: 0 0 4px;
}

.member-status-text {
  font-size: 12px;
  color: #52c41a;
  margin: 0;
}

/* 统计区域 */
.stats-section {
  margin: 0 15px 15px;
  background: white;
  border-radius: 12px;
  padding: 15px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.section-title {
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

/* 工单区域 */
.workorder-section {
  margin: 0 15px 15px;
  background: white;
  border-radius: 12px;
  padding: 15px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.workorder-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.empty-state {
  text-align: center;
  padding: 30px 20px;
  color: #bfbfbf;
}

.empty-state .el-icon {
  font-size: 36px;
  margin-bottom: 8px;
}

.empty-state p {
  margin: 0;
  font-size: 14px;
}

.workorder-item {
  padding: 12px;
  background: #f5f7fa;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
}

.workorder-item:active {
  background: #e8e8e8;
}

.workorder-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.workorder-id {
  font-size: 14px;
  font-weight: 500;
  color: #1890ff;
}

.workorder-content {
  font-size: 13px;
  color: #595959;
}

.customer-name {
  margin: 0 0 4px;
}

.device-model {
  margin: 0;
  color: #8c8c8c;
}

/* 操作按钮区域 */
.action-section {
  margin: 0 15px;
  padding: 15px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

/* 手机端小屏幕适配 */
@media (max-width: 375px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 15px;
  }

  .stat-number {
    font-size: 18px;
  }
}
</style>
