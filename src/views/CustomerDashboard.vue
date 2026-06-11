<template>
  <div class="customer-dashboard">
    <!-- 顶部导航栏 -->
    <el-header class="dashboard-header">
      <div class="header-content">
        <div class="logo">
          <span>售后管理系统</span>
        </div>
        <div class="user-info">
          <el-dropdown @command="handleCommand">
            <span class="user-name">
              {{ customerStore.customerInfo?.name }}
              <el-icon class="el-icon--right"><arrow-down /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">个人中心</el-dropdown-item>
                <el-dropdown-item command="company">企业信息</el-dropdown-item>
                <el-dropdown-item divided command="logout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>
    </el-header>

    <!-- 主体内容 -->
    <el-container class="dashboard-container">
      <!-- 侧边栏 -->
      <el-aside width="200px" class="dashboard-sidebar">
        <el-menu
          :default-active="activeMenu"
          class="el-menu-vertical"
          @select="handleMenuSelect"
        >
          <el-menu-item index="dashboard">
            <el-icon><HomeFilled /></el-icon>
            <span>首页</span>
          </el-menu-item>
          <el-menu-item index="devices">
            <el-icon><Monitor /></el-icon>
            <span>我的设备</span>
          </el-menu-item>
          <el-menu-item index="workorders">
            <el-icon><Tickets /></el-icon>
            <span>我的工单</span>
          </el-menu-item>
          <el-menu-item index="profile">
            <el-icon><User /></el-icon>
            <span>个人中心</span>
          </el-menu-item>
        </el-menu>
      </el-aside>

      <!-- 内容区 -->
      <el-main class="dashboard-main">
        <!-- 首页内容 -->
        <div v-if="activeMenu === 'dashboard'" class="dashboard-content">
          <el-row :gutter="20">
            <el-col :span="8">
              <el-card shadow="hover" class="stat-card">
                <div class="stat-item">
                  <div class="stat-icon device">
                    <el-icon><Monitor /></el-icon>
                  </div>
                  <div class="stat-info">
                    <div class="stat-value">{{ deviceCount }}</div>
                    <div class="stat-label">我的设备</div>
                  </div>
                </div>
              </el-card>
            </el-col>
            <el-col :span="8">
              <el-card shadow="hover" class="stat-card">
                <div class="stat-item">
                  <div class="stat-icon workorder">
                    <el-icon><Tickets /></el-icon>
                  </div>
                  <div class="stat-info">
                    <div class="stat-value">{{ workorderCount }}</div>
                    <div class="stat-label">我的工单</div>
                  </div>
                </div>
              </el-card>
            </el-col>
            <el-col :span="8">
              <el-card shadow="hover" class="stat-card">
                <div class="stat-item">
                  <div class="stat-icon pending">
                    <el-icon><Timer /></el-icon>
                  </div>
                  <div class="stat-info">
                    <div class="stat-value">{{ pendingCount }}</div>
                    <div class="stat-label">待处理</div>
                  </div>
                </div>
              </el-card>
            </el-col>
          </el-row>

          <!-- 快捷操作 -->
          <el-card shadow="hover" class="mt-4">
            <template #header>
              <div class="card-header">
                <span>快捷操作</span>
              </div>
            </template>
            <div class="quick-actions">
              <el-button type="primary" size="large" @click="createWorkorder">
                <el-icon><Plus /></el-icon>
                发起服务工单
              </el-button>
              <el-button size="large" @click="scanDevice">
                <el-icon><FullScreen /></el-icon>
                扫码查看设备
              </el-button>
              <el-button size="large" @click="viewHistory">
                <el-icon><Clock /></el-icon>
                查看服务历史
              </el-button>
            </div>
          </el-card>

          <!-- 最近工单 -->
          <el-card shadow="hover" class="mt-4">
            <template #header>
              <div class="card-header">
                <span>最近工单</span>
                <el-button type="primary" link @click="activeMenu = 'workorders'">
                  查看全部
                </el-button>
              </div>
            </template>
            <el-table :data="recentWorkorders" style="width: 100%">
              <el-table-column prop="id" label="工单编号" width="120" />
              <el-table-column prop="deviceName" label="设备名称" />
              <el-table-column prop="type" label="工单类型" width="100" />
              <el-table-column prop="status" label="状态" width="100">
                <template #default="{ row }">
                  <el-tag :type="getStatusType(row.status)">{{ row.status }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="createTime" label="创建时间" width="180" />
              <el-table-column label="操作" width="100">
                <template #default="{ row }">
                  <el-button type="primary" link @click="viewWorkorder(row)">
                    查看
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </el-card>
        </div>

        <!-- 我的设备 -->
        <div v-else-if="activeMenu === 'devices'" class="dashboard-content">
          <el-card shadow="hover">
            <template #header>
              <div class="card-header">
                <span>我的设备</span>
              </div>
            </template>
            <el-empty description="设备列表功能开发中..." />
          </el-card>
        </div>

        <!-- 我的工单 -->
        <div v-else-if="activeMenu === 'workorders'" class="dashboard-content">
          <el-card shadow="hover">
            <template #header>
              <div class="card-header">
                <span>我的工单</span>
                <el-button type="primary" @click="createWorkorder">
                  <el-icon><Plus /></el-icon>
                  发起工单
                </el-button>
              </div>
            </template>
            <el-empty description="工单列表功能开发中..." />
          </el-card>
        </div>

        <!-- 个人中心 -->
        <div v-else-if="activeMenu === 'profile'" class="dashboard-content">
          <el-card shadow="hover">
            <template #header>
              <div class="card-header">
                <span>个人中心</span>
              </div>
            </template>
            <el-descriptions :column="2" border>
              <el-descriptions-item label="姓名">{{ customerStore.customerInfo?.name }}</el-descriptions-item>
              <el-descriptions-item label="手机号">{{ customerStore.customerInfo?.phone }}</el-descriptions-item>
              <el-descriptions-item label="邮箱">{{ customerStore.customerInfo?.email || '-' }}</el-descriptions-item>
              <el-descriptions-item label="职位">{{ customerStore.customerInfo?.position }}</el-descriptions-item>
              <el-descriptions-item label="所属企业">{{ customerStore.customerInfo?.companyName }}</el-descriptions-item>
              <el-descriptions-item label="企业ID">{{ customerStore.customerInfo?.companyId }}</el-descriptions-item>
            </el-descriptions>
          </el-card>
        </div>
      </el-main>
    </el-container>
  </div>
</template>

<script>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  HomeFilled,
  Monitor,
  Tickets,
  User,
  ArrowDown,
  Plus,
  FullScreen,
  Clock,
  Timer
} from '@element-plus/icons-vue'
import { useCustomerStore } from '../stores/customerStore'

export default {
  name: 'CustomerDashboard',
  components: {
    HomeFilled,
    Monitor,
    Tickets,
    User,
    ArrowDown,
    Plus,
    FullScreen,
    Clock,
    Timer
  },
  setup() {
    const router = useRouter()
    const customerStore = useCustomerStore()
    const activeMenu = ref('dashboard')

    // 统计数据
    const deviceCount = ref(5)
    const workorderCount = ref(12)
    const pendingCount = ref(3)

    // 最近工单
    const recentWorkorders = ref([
      {
        id: 'WO001',
        deviceName: '设备A-001',
        type: '维修',
        status: '处理中',
        createTime: '2024-01-15 10:30:00'
      },
      {
        id: 'WO002',
        deviceName: '设备B-002',
        type: '保养',
        status: '待处理',
        createTime: '2024-01-14 15:20:00'
      },
      {
        id: 'WO003',
        deviceName: '设备C-003',
        type: '故障',
        status: '已完成',
        createTime: '2024-01-13 09:15:00'
      }
    ])

    // 获取状态标签类型
    const getStatusType = (status) => {
      const statusMap = {
        '待处理': 'warning',
        '处理中': 'primary',
        '已完成': 'success',
        '已关闭': 'info'
      }
      return statusMap[status] || 'info'
    }

    // 菜单选择
    const handleMenuSelect = (index) => {
      activeMenu.value = index
    }

    // 用户下拉菜单
    const handleCommand = (command) => {
      switch (command) {
        case 'profile':
          activeMenu.value = 'profile'
          break
        case 'company':
          ElMessage.info('企业信息功能开发中...')
          break
        case 'logout':
          handleLogout()
          break
      }
    }

    // 退出登录
    const handleLogout = () => {
      ElMessageBox.confirm('确定要退出登录吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        customerStore.logout()
        ElMessage.success('已退出登录')
        router.push('/customer-login')
      }).catch(() => {})
    }

    // 发起工单
    const createWorkorder = () => {
      ElMessage.info('发起工单功能开发中...')
    }

    // 扫码查看设备
    const scanDevice = () => {
      router.push('/scan')
    }

    // 查看服务历史
    const viewHistory = () => {
      ElMessage.info('服务历史功能开发中...')
    }

    // 查看工单详情
    const viewWorkorder = (row) => {
      ElMessage.info(`查看工单 ${row.id} 详情`)
    }

    return {
      customerStore,
      activeMenu,
      deviceCount,
      workorderCount,
      pendingCount,
      recentWorkorders,
      getStatusType,
      handleMenuSelect,
      handleCommand,
      createWorkorder,
      scanDevice,
      viewHistory,
      viewWorkorder
    }
  }
}
</script>

<style scoped>
.customer-dashboard {
  min-height: 100vh;
  background-color: #f5f7fa;
}

.dashboard-header {
  background-color: #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 0;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 60px;
  padding: 0 20px;
}

.logo {
  font-size: 20px;
  font-weight: 600;
  color: #409eff;
}

.user-info {
  cursor: pointer;
}

.user-name {
  display: flex;
  align-items: center;
  gap: 5px;
  color: #606266;
}

.dashboard-container {
  padding-top: 60px;
  min-height: 100vh;
}

.dashboard-sidebar {
  background-color: #fff;
  border-right: 1px solid #e4e7ed;
  position: fixed;
  left: 0;
  top: 60px;
  bottom: 0;
  z-index: 99;
}

.el-menu-vertical {
  border-right: none;
}

.dashboard-main {
  margin-left: 200px;
  padding: 20px;
  min-height: calc(100vh - 60px);
}

.dashboard-content {
  max-width: 1200px;
}

.stat-card {
  margin-bottom: 0;
}

.stat-item {
  display: flex;
  align-items: center;
  padding: 10px;
}

.stat-icon {
  width: 50px;
  height: 50px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  margin-right: 15px;
}

.stat-icon.device {
  background-color: #ecf5ff;
  color: #409eff;
}

.stat-icon.workorder {
  background-color: #f0f9eb;
  color: #67c23a;
}

.stat-icon.pending {
  background-color: #fdf6ec;
  color: #e6a23c;
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
  line-height: 1.2;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-top: 4px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.mt-4 {
  margin-top: 20px;
}

.quick-actions {
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .dashboard-sidebar {
    display: none;
  }

  .dashboard-main {
    margin-left: 0;
    padding: 10px;
  }

  .quick-actions {
    flex-direction: column;
  }

  .quick-actions .el-button {
    width: 100%;
  }
}
</style>
