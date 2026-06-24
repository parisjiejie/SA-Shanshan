<template>
  <div class="app-container" :class="{ 'customer-page-container': isCustomerPage }">
    <!-- 公开页面（登录页等）不显示侧边栏 -->
    <template v-if="!isPublicPage">
      <!-- 客户页面使用客户布局 -->
      <template v-if="isCustomerPage">
        <router-view />
      </template>
      
      <!-- 员工页面使用标准布局 -->
      <template v-else>
        <!-- 电脑端侧边栏 - 工程师和课长访问移动端页面时隐藏 -->
        <div v-if="!isMobileWorkspacePage" class="desktop-sidebar">
          <el-aside width="200px" class="sidebar">
            <div class="logo">
              <span>售后管理系统</span>
            </div>
            <el-menu
              :default-active="activeMenu"
              class="el-menu-vertical-demo"
              router
              @select="handleMenuSelect"
            >
              <el-menu-item v-if="isMenuVisible('/bi-dashboard')" index="/bi-dashboard">
                <el-icon><DataLine /></el-icon>
                <span>BI大屏</span>
              </el-menu-item>
              <el-sub-menu v-if="isMenuVisible('workorder')" index="workorder">
                <template #title>
                  <el-icon><Document /></el-icon>
                  <span>工单管理</span>
                </template>
                <el-menu-item index="/workorder?type=installation">
                  <span>安装工单</span>
                </el-menu-item>
                <el-menu-item index="/workorder?type=service">
                  <span>服务工单</span>
                </el-menu-item>
              </el-sub-menu>
              <el-menu-item v-if="isMenuVisible('/customer')" index="/customer">
                <el-icon><User /></el-icon>
                <span>客户管理</span>
              </el-menu-item>
              <el-menu-item v-if="isMenuVisible('/contact')" index="/contact">
                <el-icon><Phone /></el-icon>
                <span>联系人管理</span>
              </el-menu-item>
              <el-menu-item v-if="isMenuVisible('/asset')" index="/asset">
                <el-icon><Monitor /></el-icon>
                <span>设备管理</span>
              </el-menu-item>
              <el-menu-item v-if="isMenuVisible('/product-library')" index="/product-library">
                <el-icon><Goods /></el-icon>
                <span>产品库</span>
              </el-menu-item>
              <el-menu-item v-if="isMenuVisible('/field-service')" index="/field-service">
                <el-icon><Location /></el-icon>
                <div class="menu-item-content">
                  <span>外勤管理</span>
                  <el-badge v-if="pendingApprovalCount > 0" :value="pendingApprovalBadge" class="menu-badge" type="danger" />
                </div>
              </el-menu-item>
              <el-menu-item v-if="isMenuVisible('/user-approval')" index="/user-approval">
                <el-icon><CircleCheck /></el-icon>
                <div class="menu-item-content">
                  <span>用户审核</span>
                  <el-badge v-if="pendingUserApprovalCount > 0" :value="pendingUserApprovalCount" class="menu-badge" type="danger" />
                </div>
              </el-menu-item>
              <el-menu-item v-if="isMenuVisible('/quotation')" index="/quotation">
                <el-icon><Money /></el-icon>
                <div class="menu-item-content">
                  <span>报价单</span>
                  <el-badge v-if="quotationPendingCount > 0" :value="quotationPendingCount" class="menu-badge" type="danger" />
                </div>
              </el-menu-item>
              <el-menu-item v-if="isMenuVisible('/quotation-item-query')" index="/quotation-item-query">
                <el-icon><Search /></el-icon>
                <span>报价项目查询</span>
              </el-menu-item>
              <el-menu-item v-if="isMenuVisible('/report-template')" index="/report-template">
                <el-icon><DocumentChecked /></el-icon>
                <span>报告模板</span>
              </el-menu-item>
              <el-menu-item v-if="isMenuVisible('/qrcode')" index="/qrcode">
                <el-icon><Document /></el-icon>
                <span>二维码管理</span>
              </el-menu-item>
              <el-sub-menu v-if="isMenuVisible('system')" index="system">
                <template #title>
                  <el-icon><Setting /></el-icon>
                  <span>系统管理</span>
                </template>
                <el-menu-item index="/organization">
                  <span>组织结构</span>
                </el-menu-item>
                <el-menu-item index="/employee">
                  <span>员工账号</span>
                </el-menu-item>
                <el-menu-item index="/workflow-config">
                  <span>流程配置</span>
                </el-menu-item>
                <el-sub-menu index="field-config">
                  <template #title>
                    <span>字段配置</span>
                  </template>
                  <el-menu-item index="/field-config">
                    <span>字段管理</span>
                  </el-menu-item>
                  <el-menu-item index="/field-template-manager">
                    <span>模板管理</span>
                  </el-menu-item>
                  <el-menu-item index="/field-designer">
                    <span>字段设计器</span>
                  </el-menu-item>
                  <el-menu-item index="/customer-field-config">
                    <span>客户配置</span>
                  </el-menu-item>
                </el-sub-menu>
              </el-sub-menu>
            </el-menu>
          </el-aside>
        </div>
        
        <!-- 手机端侧边栏 -->
        <div class="mobile-sidebar-wrapper" :class="{ 'open': isSidebarOpen }">
          <el-aside width="200px" class="sidebar">
            <div class="logo">
              <span>售后管理系统</span>
            </div>
            <el-menu
              :default-active="activeMenu"
              class="el-menu-vertical-demo"
              router
              @select="handleMobileMenuSelect"
            >
              <el-menu-item v-if="isMenuVisible('/bi-dashboard')" index="/bi-dashboard">
                <el-icon><DataLine /></el-icon>
                <span>BI大屏</span>
              </el-menu-item>
              <el-sub-menu v-if="isMenuVisible('workorder')" index="workorder">
                <template #title>
                  <el-icon><Document /></el-icon>
                  <span>工单管理</span>
                </template>
                <el-menu-item index="/workorder?type=installation">
                  <span>安装工单</span>
                </el-menu-item>
                <el-menu-item index="/workorder?type=service">
                  <span>服务工单</span>
                </el-menu-item>
                <el-menu-item index="/workorder?type=parts">
                  <span>配件销售</span>
                </el-menu-item>
              </el-sub-menu>
              <el-menu-item v-if="isMenuVisible('/customer')" index="/customer">
                <el-icon><User /></el-icon>
                <span>客户管理</span>
              </el-menu-item>
              <el-menu-item v-if="isMenuVisible('/contact')" index="/contact">
                <el-icon><Phone /></el-icon>
                <span>联系人管理</span>
              </el-menu-item>
              <el-menu-item v-if="isMenuVisible('/asset')" index="/asset">
                <el-icon><Monitor /></el-icon>
                <span>设备管理</span>
              </el-menu-item>
              <el-menu-item v-if="isMenuVisible('/product-library')" index="/product-library">
                <el-icon><Goods /></el-icon>
                <span>产品库</span>
              </el-menu-item>
              <el-menu-item v-if="isMenuVisible('/field-service')" index="/field-service">
                <el-icon><Location /></el-icon>
                <span>外勤管理</span>
                <el-badge v-if="pendingApprovalCount > 0" :value="pendingApprovalBadge" class="menu-badge" type="danger" />
              </el-menu-item>
              <el-menu-item v-if="isMenuVisible('/user-approval')" index="/user-approval">
                <el-icon><CircleCheck /></el-icon>
                <span>用户审核</span>
                <el-badge v-if="pendingUserApprovalCount > 0" :value="pendingUserApprovalCount" class="menu-badge" type="danger" />
              </el-menu-item>
              <el-menu-item v-if="isMenuVisible('/quotation')" index="/quotation">
                <el-icon><Money /></el-icon>
                <span>报价单</span>
              </el-menu-item>
              <el-menu-item v-if="isMenuVisible('/quotation-item-query')" index="/quotation-item-query">
                <el-icon><Search /></el-icon>
                <span>报价项目查询</span>
              </el-menu-item>
              <el-menu-item v-if="isMenuVisible('/report-template')" index="/report-template">
                <el-icon><DocumentChecked /></el-icon>
                <span>报告模板</span>
              </el-menu-item>
              <el-menu-item v-if="isMenuVisible('/qrcode')" index="/qrcode">
                <el-icon><Document /></el-icon>
                <span>二维码管理</span>
              </el-menu-item>
              <el-sub-menu v-if="isMenuVisible('system')" index="system">
                <template #title>
                  <el-icon><Setting /></el-icon>
                  <span>系统管理</span>
                </template>
                <el-menu-item index="/organization">
                  <span>组织结构</span>
                </el-menu-item>
                <el-menu-item index="/employee">
                  <span>员工账号</span>
                </el-menu-item>
                <el-menu-item index="/workflow-config">
                  <span>流程配置</span>
                </el-menu-item>
                <el-sub-menu index="field-config">
                  <template #title>
                    <span>字段配置</span>
                  </template>
                  <el-menu-item index="/field-config">
                    <span>字段管理</span>
                  </el-menu-item>
                  <el-menu-item index="/field-template-manager">
                    <span>模板管理</span>
                  </el-menu-item>
                  <el-menu-item index="/field-designer">
                    <span>字段设计器</span>
                  </el-menu-item>
                  <el-menu-item index="/customer-field-config">
                    <span>客户配置</span>
                  </el-menu-item>
                </el-sub-menu>
              </el-sub-menu>
            </el-menu>
          </el-aside>
        </div>
        
        <!-- 遮罩层 - 侧边栏打开时显示，点击可关闭侧边栏 -->
        <div 
          v-if="isSidebarOpen" 
          class="sidebar-overlay"
          @click="toggleSidebar"
        ></div>
        
        <!-- 主内容区 -->
        <div class="main-container" :class="{ 'full-width': isMobileWorkspacePage }">
          <el-header v-if="!isMobileView" class="header">
            <div class="header-left">
              <el-button v-if="!isMobileWorkspacePage" link class="menu-toggle" @click="toggleSidebar">
                <el-icon><Menu /></el-icon>
              </el-button>
            </div>
            <div class="user-info">
              <span>欢迎，{{ currentUser.name }}</span>
              
              <!-- 通知小喇叭 -->
              <el-badge :value="notificationUnreadCount" :hidden="notificationUnreadCount === 0" :max="99" class="notification-bell">
                <el-button link class="bell-btn" @click="showNotifications = true">
                  <el-icon :size="20"><Bell /></el-icon>
                </el-button>
              </el-badge>
              
              <!-- 设备切换按钮 -->
              <button
                v-if="showDeviceSwitch"
                class="device-switch-btn-raw"
                @click="toggleDeviceView"
                :title="isMobileView ? '切换到电脑端' : '切换到手机端'"
              >
                {{ isMobileView ? '电脑端' : '手机端' }}
              </button>
              <el-dropdown>
                <el-button type="primary">
                  <el-icon><Setting /></el-icon>
                  <span>设置</span>
                  <el-icon class="el-icon--right"><ArrowDown /></el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item>个人中心</el-dropdown-item>
                    <el-dropdown-item @click="handleLogout">退出登录</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
              <!-- 角色切换按钮已隐藏，通过登录页面选择角色 -->
              <!-- <el-select v-model="currentUser.role" @change="handleRoleChange" style="width: 120px; margin-left: 10px;">
                <el-option label="系统管理员" value="admin" />
                <el-option label="业务助理" value="assistant" />
                <el-option label="部长" value="director" />
                <el-option label="工程师" value="engineer" />
                <el-option label="课长" value="techLead" />
                <el-option label="客户" value="customer" />
              </el-select> -->
            </div>
          </el-header>
          <el-main class="main">
            <router-view :key="viewRefreshKey" />
          </el-main>
        </div>
      </template>
    </template>
    
    <!-- 公开页面直接显示内容 -->
    <template v-else>
      <router-view />
    </template>

    <!-- 通知面板 -->
    <NotificationPanel 
      v-model:visible="showNotifications" 
      :currentRole="currentUser.role" 
      v-if="isPublicPage"
    />
    <NotificationPanel 
      v-model:visible="showNotifications" 
      :currentRole="currentUser.role" 
      v-else-if="currentUser.role"
    />
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { 
  PieChart, User, Monitor, Document, Location, Box, 
  Setting, ArrowDown, Menu, Phone, CircleCheck, Money, Search, DocumentChecked, Camera,
  Cellphone, Monitor as MonitorIcon, Bell, DataLine, Goods
} from '@element-plus/icons-vue'
import { pendingApprovalCount } from './stores/approvalStore'
import { pendingApprovalCount as pendingUserApprovalCount } from './stores/userApprovalStore'
import { totalPendingApprovalCount } from './stores/quotationStore'
import { notifications, getUnreadCountByRole } from './stores/notificationStore'
import NotificationPanel from './components/NotificationPanel.vue'

export default {
  name: 'App',
  components: {
    PieChart,
    User,
    Monitor,
    DataLine,
    Document,
    Location,
    Box,
    Setting,
    ArrowDown,
    Menu,
    Phone,
    CircleCheck,
    Money,
    Search,
    DocumentChecked,
    Camera,
    Cellphone,
    MonitorIcon,
    Bell,
    Goods,
    NotificationPanel
  },
  setup() {
    const router = useRouter()
    const route = useRoute()
    const activeMenu = ref('/bi-dashboard')
    const viewRefreshKey = ref(0)
    const isSidebarOpen = ref(false)
    const showNotifications = ref(false)
    const notificationUnreadCount = computed(() => 
      getUnreadCountByRole(currentUser.value.role)
    )
    const currentUser = ref({
      name: '管理员',
      role: 'admin'
    })

    // 公开页面列表
    const publicPages = ['/staff-login', '/customer-login', '/contact-register', '/api-test', '/tianyancha-test']
    
    // 判断是否公开页面
    const isPublicPage = computed(() => {
      return publicPages.includes(route.path) || route.meta?.public
    })
    
    // 判断是否客户页面
    const isCustomerPage = computed(() => {
      if (route.path.startsWith('/customer-') || route.meta?.requiresCustomerAuth) return true
      // 客户角色访问产品库和产品详情时也使用客户布局（无侧边栏）
      if (route.path === '/product-library' || route.path === '/customer-product-detail') {
        try {
          const auth = JSON.parse(localStorage.getItem('staffAuth') || '{}')
          if (auth.role === 'customer') return true
        } catch (e) {}
      }
      return false
    })

    // 判断是否需要显示设备切换按钮（工程师、课长和部长需要）
    const showDeviceSwitch = computed(() => {
      return currentUser.value.role === 'admin' || currentUser.value.role === 'engineer' || currentUser.value.role === 'techLead' || currentUser.value.role === 'director' || currentUser.value.role === 'assistant'
    })

    // 判断是否访问移动端工作台页面（工程师/课长在电脑端访问移动端页面时隐藏左侧菜单）
    const isMobileWorkspacePage = computed(() => {
      return route.path === '/staff-mobile-workspace' ||
             route.path.startsWith('/staff-workorder') ||
             route.path.startsWith('/staff-field') ||
             route.path.startsWith('/staff-checkin') ||
             route.path.startsWith('/staff-profile')
    })

    // 判断当前是否手机端视图（基于路由，刷新页面也不会错）
    const isMobileView = computed(() => {
      return isMobileWorkspacePage.value ||
             isCustomerPage.value
    })

    // 角色菜单权限配置
    const roleMenus = {
      admin: [
        '/bi-dashboard',
        'workorder',
        '/customer',
        '/contact',
        '/asset',
        '/product-library',
        '/field-service',
        '/user-approval',
        '/quotation',
        '/quotation-item-query',
        '/report-template',
        '/qrcode',
        'system',
        '/organization',
        '/employee',
        '/workflow-config',
        'field-config',
        '/field-config',
        '/field-template-manager',
        '/field-designer',
        '/customer-field-config'
      ],
      sales: [
        '/bi-dashboard',
        'workorder',
        '/customer',
        '/contact',
        '/asset',
        '/product-library',
        '/quotation',
        '/quotation-item-query',
        '/qrcode'
      ],
      assistant: [
        '/bi-dashboard',
        'workorder',
        '/customer',
        '/contact',
        '/asset',
        '/product-library',
        '/field-service',
        '/user-approval',
        '/quotation',
        '/quotation-item-query',
        '/report-template',
        '/qrcode'
      ],
      engineer: [
        '/bi-dashboard',
        'workorder',
        '/customer',
        '/contact',
        '/asset',
        '/product-library',
        '/field-service'
      ],
      techLead: [
        '/bi-dashboard',
        'workorder',
        '/customer',
        '/contact',
        '/asset',
        '/product-library',
        '/field-service',
        '/user-approval',
        '/quotation',
        '/quotation-item-query',
        '/report-template',
        '/qrcode'
      ],
      director: [
        '/bi-dashboard',
        'workorder',
        '/customer',
        '/contact',
        '/asset',
        '/product-library',
        '/field-service',
        '/user-approval',
        '/quotation',
        '/quotation-item-query',
        '/report-template',
        '/qrcode'
      ],
      customer: [
        '/product-library',
        'workorder'
      ]
    }

    // 计算待审批数量显示文本
    const pendingApprovalBadge = computed(() => {
      return pendingApprovalCount.value > 99 ? '99+' : String(pendingApprovalCount.value)
    })

    // 计算报价单待审核数量
    const quotationPendingCount = computed(() => {
      return totalPendingApprovalCount.value
    })

    // 检查菜单是否对当前角色可见
    const isMenuVisible = (menuKey) => {
      return roleMenus[currentUser.value.role]?.includes(menuKey) || false
    }

    // 打开BI大屏（新标签页）
    const openBIDashboard = () => {
      window.open('http://bi-demo.fastma.com.cn/bi_akl/akl_home.html', '_blank')
    }

    // PC端菜单选择处理
    const handleMenuSelect = (key) => {
      if (key === '/bi-dashboard') {
        window.location.href = 'http://bi-demo.fastma.com.cn/bi_akl/akl_home.html'
        return false
      }
    }

    const handleMobileMenuSelect = (key) => {
      if (key === '/bi-dashboard') {
        window.location.href = 'http://bi-demo.fastma.com.cn/bi_akl/akl_home.html'
        return false
      }
      isSidebarOpen.value = false
    }

    const toggleSidebar = () => {
      isSidebarOpen.value = !isSidebarOpen.value
    }

    const handleRoleChange = (role) => {
      const roleNames = {
          admin: '管理员',
          assistant: '业务助理',
          engineer: '工程师',
          techLead: '课长',
          director: '部长',
          customer: '客户'
        }
      currentUser.value.name = roleNames[role]
      currentUser.value.role = role

      // 保存用户信息到 localStorage，供手机端页面使用
      localStorage.setItem('userInfo', JSON.stringify({
        name: roleNames[role],
        role: role,
        department: '技术服务部'
      }))

      // 触发自定义事件通知其他组件更新
      window.dispatchEvent(new CustomEvent('user-info-updated'))

      // 客户角色自动跳转到手机端工作台
      if (role === 'customer') {
        // 强制跳转到客户手机端工作台，替换当前历史记录
        window.location.href = '/customer-workspace'
      } else {
        // 其他角色跳转到手机端首页
        router.push('/staff-mobile-workspace')
      }
    }

    // 各角色的首页配置
    const roleHomePages = {
      customer: { desktop: '/customer-workspace', mobile: '/customer-workspace' },
      engineer: { desktop: '/bi-dashboard', mobile: '/staff-mobile-workspace' },
      techLead: { desktop: '/workorder?type=service', mobile: '/staff-mobile-workspace' },
      admin: { desktop: '/workorder?type=service', mobile: '/staff-mobile-workspace' },
      assistant: { desktop: '/workorder?type=service', mobile: '/staff-mobile-workspace' },
      director: { desktop: '/workorder?type=service', mobile: '/staff-mobile-workspace' }
    }

    const toggleDeviceView = () => {
      const role = currentUser.value.role
      const homePages = roleHomePages[role] || roleHomePages.admin
      const isMobile = isMobileView.value
      const target = isMobile ? homePages.desktop : homePages.mobile
      router.push(target)
    }

    // 退出登录
    const handleLogout = () => {
      // 清除登录状态
      localStorage.removeItem('staffAuth')
      localStorage.removeItem('userInfo')
      localStorage.removeItem('customerToken')
      localStorage.removeItem('customerInfo')
      
      // 显示提示
      ElMessage.success('已退出登录')
      
      // 跳转到登录页面
      window.location.href = '/login'
    }

    const loadUserFromStorage = () => {
      try {
        const staffAuth = JSON.parse(localStorage.getItem('staffAuth') || '{}')
        if (staffAuth.role) {
          currentUser.value.role = staffAuth.role
          currentUser.value.name = staffAuth.name || staffAuth.roleName || '用户'
          return
        }
        const customerAuth = JSON.parse(localStorage.getItem('customerAuth') || '{}')
        if (customerAuth.customerId) {
          currentUser.value.role = 'customer'
          currentUser.value.name = customerAuth.name || customerAuth.companyName || '客户'
        }
      } catch (e) {
        console.error('读取用户信息失败:', e)
      }
    }

    // 监听路由变化，更新激活菜单和视图刷新key（解决 pushState 导航不触发重渲染的问题）
    watch(() => route.fullPath, (newFullPath) => {
      activeMenu.value = newFullPath
      viewRefreshKey.value++
      if (!publicPages.includes(route.path) && !route.meta?.public) {
        loadUserFromStorage()
      }
    })

    onMounted(() => {
      activeMenu.value = route.fullPath
      loadUserFromStorage()
    })

    return {
      activeMenu,
      viewRefreshKey,
      handleMobileMenuSelect,
      isSidebarOpen,
      toggleSidebar,
      currentUser,
      isMenuVisible,
      openBIDashboard,
      handleMenuSelect,
      handleRoleChange,
      pendingApprovalCount,
      pendingApprovalBadge,
      pendingUserApprovalCount,
      quotationPendingCount,
      isPublicPage,
      isCustomerPage,
      isMobileView,
      toggleDeviceView,
      showDeviceSwitch,
      isMobileWorkspacePage,
      handleLogout,
      showNotifications,
      notificationUnreadCount,
      Bell,
      Cellphone,
      MonitorIcon,
      Goods
    }
  }
}
</script>

<style>
/* 全局样式 */
html, body {
  margin: 0;
  padding: 0;
  height: 100%;
  width: 100%;
}

#app {
  height: 100%;
  width: 100%;
}

/* 移动端页面隐藏滚动条但保留滑动功能 */
.mobile-page {
  overflow-y: auto;
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE 10+ */
}

.mobile-page::-webkit-scrollbar {
  display: none;
  width: 0;
  height: 0;
}
</style>

<style scoped>
.app-container {
  height: 100vh;
  width: 100vw;
  position: relative;
}

/* 仅对员工页面（非客户页面）应用滚动限制 */
.app-container:not(.customer-page-container) {
  overflow: hidden;
  display: flex;
}

/* 客户页面容器样式 - 允许滚动 */
.app-container.customer-page-container {
  overflow-y: auto;
  overflow-x: hidden;
}

/* 电脑端侧边栏 */
.desktop-sidebar {
  display: block;
  width: 200px;
  height: 100vh;
  position: fixed;
  left: 0;
  top: 0;
  z-index: 100;
}

.sidebar {
  background-color: #001529;
  color: white;
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-width: thin;
  scrollbar-color: rgba(255,255,255,0.2) transparent;
}

/* 侧边栏滚动条样式 - Webkit浏览器 */
.sidebar::-webkit-scrollbar {
  width: 4px;
}

.sidebar::-webkit-scrollbar-track {
  background: transparent;
}

.sidebar::-webkit-scrollbar-thumb {
  background: rgba(255,255,255,0.2);
  border-radius: 2px;
}

.sidebar::-webkit-scrollbar-thumb:hover {
  background: rgba(255,255,255,0.3);
}

/* 隐藏侧边栏水平滚动条 */
.sidebar::-webkit-scrollbar-horizontal {
  display: none;
}

.logo {
  height: 60px;
  line-height: 60px;
  text-align: center;
  font-size: 18px;
  font-weight: bold;
  background-color: #001529;
  color: white;
}

/* 手机端侧边栏 */
.mobile-sidebar-wrapper {
  position: fixed;
  top: 0;
  left: -200px;
  width: 200px;
  height: 100vh;
  z-index: 1000;
  transition: left 0.3s ease;
  display: none;
}

.mobile-sidebar-wrapper.open {
  left: 0;
}

/* 遮罩层 */
.sidebar-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 999;
  display: none;
}

/* 主内容区 */
.main-container {
  flex: 1;
  height: 100vh;
  margin-left: 200px;
  transition: all 0.3s ease;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.header {
  background-color: white;
  border-bottom: 1px solid #e8e8e8;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
}

.header-left {
  display: flex;
  align-items: center;
}

.menu-toggle {
  font-size: 20px;
  margin-right: 20px;
  color: #001529;
  display: none;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 20px;
}

/* 设备切换按钮 */
.device-switch-btn-raw {
  background: none;
  border: 1px solid #409eff;
  color: #409eff;
  padding: 6px 14px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  margin: 0 8px;
}
.device-switch-btn-raw:hover {
  background: #ecf5ff;
  color: #66b1ff;
  border-color: #66b1ff;
}

/* 设备切换按钮样式 */
.device-switch-btn {
  font-size: 18px;
  color: #409eff;
  padding: 8px 12px;
  border-radius: 4px;
  transition: all 0.3s ease;
}

.device-switch-btn:hover {
  background-color: #ecf5ff;
  color: #66b1ff;
}

.device-switch-text {
  margin-left: 4px;
  font-size: 14px;
}

/* 通知小喇叭 */
.notification-bell {
  margin: 0 4px;
}

.bell-btn {
  font-size: 20px;
  color: #606266;
  padding: 4px 8px;
  border-radius: 50%;
  transition: all 0.2s;
}

.bell-btn:hover {
  background-color: #f0f0f0;
  color: #1890ff;
}

.main {
  padding: 20px;
  background-color: #f5f5f5;
  height: calc(100vh - 60px);
  overflow-y: auto;
}

.el-menu-vertical-demo {
  width: 200px;
  min-height: 400px;
}

.el-menu {
  background-color: #001529;
  border-right: none;
  width: 100%;
}

/* 确保菜单不溢出 */
.el-menu :deep(.el-sub-menu__title),
.el-menu :deep(.el-menu-item) {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 子菜单标题文字颜色 */
.el-menu :deep(.el-sub-menu__title span) {
  color: white !important;
}

.el-menu-item {
  color: white;
  position: relative;
}

.el-menu-item:hover {
  background-color: rgba(255, 255, 255, 0.1);
  color: white;
}

.el-menu-item.is-active {
  background-color: #1890ff;
  color: white;
}

/* 菜单项内容容器 */
.menu-item-content {
  display: flex;
  align-items: center;
  gap: 5px;
}

/* 菜单徽章样式 */
.menu-badge {
  position: relative;
  top: -16px;
  margin-left: 5px;
}

.menu-badge :deep(.el-badge__content) {
  border: none;
  font-size: 11px;
  height: 16px;
  line-height: 16px;
  padding: 0 5px;
}

/* 确保子菜单标题颜色为白色 */
.el-menu :deep(.el-sub-menu__title) {
  color: white !important;
}

.el-menu :deep(.el-sub-menu__title:hover) {
  color: white !important;
  background-color: rgba(255, 255, 255, 0.1);
}

/* 子菜单项样式 */
.el-menu :deep(.el-sub-menu .el-menu-item) {
  color: rgba(255, 255, 255, 0.65) !important;
  background-color: #001529 !important;
}

.el-menu :deep(.el-sub-menu .el-menu-item:hover) {
  background-color: rgba(255, 255, 255, 0.1) !important;
  color: white !important;
}

.el-menu :deep(.el-sub-menu .el-menu-item.is-active) {
  background-color: #1890ff !important;
  color: white !important;
}

/* 子菜单展开后的背景 */
.el-menu :deep(.el-sub-menu) {
  background-color: #001529 !important;
}

.el-menu :deep(.el-menu--inline) {
  background-color: #001529 !important;
}

/* 移动端工作台页面全宽样式 */
.main-container.full-width {
  margin-left: 0;
  width: 100vw;
  max-width: 100vw;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .app-container {
    flex-direction: column;
    width: 100vw;
    min-width: 100vw;
    max-width: 100vw;
    overflow-x: hidden;
  }

  .desktop-sidebar {
    display: none;
  }

  .main-container {
    margin-left: 0;
    width: 100vw;
    min-width: 100vw;
    max-width: 100vw;
    overflow-x: hidden;
  }

  .mobile-sidebar-wrapper {
    display: block;
  }

  .sidebar-overlay {
    display: block;
  }

  .menu-toggle {
    display: block;
  }

  .main {
    padding: 10px;
    width: 100%;
    min-width: 100%;
    max-width: 100%;
    overflow-x: hidden;
    box-sizing: border-box;
  }

  .header {
    padding: 0 10px;
    width: 100%;
    box-sizing: border-box;
  }

  .user-info {
    gap: 10px;
  }

  .user-info span {
    font-size: 14px;
  }

  .el-button {
    padding: 8px 12px;
    font-size: 14px;
  }

  .el-button span {
    display: none;
  }

  .menu-toggle {
    margin-right: 10px;
  }

  /* 移动端设备切换按钮适配 */
  .device-switch-btn {
    font-size: 16px;
    padding: 6px 8px;
  }

  .device-switch-text {
    display: none;
  }
}

@media (max-width: 480px) {
  .app-container {
    overflow: auto;
  }
  
  .main {
    padding: 5px;
  }
}
</style>
