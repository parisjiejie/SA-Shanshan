import { createRouter, createWebHistory } from 'vue-router'
import { useCustomerStore } from '../stores/customerStore'
import { ElMessage } from 'element-plus'

const routes = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/login',
    name: 'UnifiedLogin',
    component: () => import('../views/UnifiedLogin.vue'),
    meta: { public: true }
  },
  {
    path: '/staff-login',
    name: 'StaffLogin',
    component: () => import('../views/StaffLogin.vue'),
    meta: { public: true }
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('../views/Dashboard.vue')
  },
  {
    path: '/customer',
    name: 'Customer',
    component: () => import('../views/Customer.vue')
  },
  {
    path: '/asset',
    name: 'Asset',
    component: () => import('../views/Asset.vue')
  },
  {
    path: '/workorder',
    name: 'Workorder',
    component: () => import('../views/Workorder.vue')
  },
  {
    path: '/field-service',
    name: 'FieldService',
    component: () => import('../views/FieldService.vue')
  },
  {
    path: '/parts',
    name: 'Parts',
    component: () => import('../views/Parts.vue')
  },
  {
    path: '/qrcode',
    name: 'QRCode',
    component: () => import('../views/QRCode.vue')
  },
  {
    path: '/scan',
    name: 'Scan',
    component: () => import('../views/Scan.vue')
  },
  {
    path: '/contact',
    name: 'Contact',
    component: () => import('../views/Contact.vue')
  },
  {
    path: '/user-approval',
    name: 'UserApproval',
    component: () => import('../views/UserApproval.vue')
  },
  {
    path: '/contact-register',
    name: 'ContactRegister',
    component: () => import('../views/ContactRegister.vue'),
    meta: { public: true }
  },
  {
    path: '/customer-login',
    name: 'CustomerLogin',
    component: () => import('../views/CustomerLogin.vue'),
    meta: { public: true }
  },
  {
    path: '/quotation',
    name: 'Quotation',
    component: () => import('../views/Quotation.vue')
  },
  {
    path: '/quotation-item-query',
    name: 'QuotationItemQuery',
    component: () => import('../views/QuotationItemQuery.vue')
  },
  {
    path: '/report-template',
    name: 'ReportTemplate',
    component: () => import('../views/ReportTemplate.vue')
  },
  {
    path: '/customer-workspace',
    name: 'CustomerMobileWorkspace',
    component: () => import('../views/CustomerMobileWorkspace.vue'),
    meta: { public: true }
  },
  {
    path: '/asset-detail',
    name: 'AssetDetail',
    component: () => import('../views/AssetDetail.vue'),
    meta: { public: true }
  },
  {
    path: '/customer-workorder-detail',
    name: 'CustomerWorkorderDetail',
    component: () => import('../views/CustomerWorkorderDetail.vue'),
    meta: { public: true }
  },
  {
    path: '/customer-profile',
    name: 'CustomerProfile',
    component: () => import('../views/CustomerProfile.vue'),
    meta: { public: true }
  },
  {
    path: '/customer-workorder-list',
    name: 'CustomerWorkorderList',
    component: () => import('../views/CustomerWorkorderList.vue'),
    meta: { public: true }
  },
  {
    path: '/customer-device-list',
    name: 'CustomerDeviceList',
    component: () => import('../views/CustomerDeviceList.vue'),
    meta: { public: true }
  },
  {
    path: '/customer-quotation-sign',
    name: 'CustomerQuotationSign',
    component: () => import('../views/CustomerQuotationSign.vue'),
    meta: { public: true }
  },
  {
    path: '/asset-install-report',
    name: 'AssetInstallReport',
    component: () => import('../views/AssetInstallReport.vue'),
    meta: { public: true }
  },
  {
    path: '/asset-install-record',
    name: 'AssetInstallRecord',
    component: () => import('../views/AssetInstallRecord.vue'),
    meta: { public: true }
  },
  {
    path: '/asset-documents',
    name: 'AssetDocuments',
    component: () => import('../views/AssetDocuments.vue'),
    meta: { public: true }
  },
  {
    path: '/customer-dashboard',
    name: 'CustomerDashboard',
    redirect: '/customer-workspace' // 重定向到客户工作台
  },
  {
    path: '/staff-mobile-workspace',
    name: 'StaffMobileWorkspace',
    component: () => import('../views/StaffMobileWorkspace.vue')
  },
  {
    path: '/staff-workorder-list',
    name: 'StaffWorkorderList',
    component: () => import('../views/StaffWorkorderList.vue')
  },
  {
    path: '/staff-workorder-detail',
    name: 'StaffWorkorderDetail',
    component: () => import('../views/StaffWorkorderDetail.vue')
  },
  {
    path: '/staff-workorder-create',
    name: 'StaffWorkorderCreate',
    component: () => import('../views/StaffWorkorderCreate.vue')
  },
  {
    path: '/staff-field-checkin-list',
    name: 'StaffFieldCheckinList',
    component: () => import('../views/StaffFieldCheckinList.vue')
  },
  {
    path: '/staff-checkin',
    name: 'StaffCheckIn',
    component: () => import('../views/StaffCheckIn.vue')
  },
  {
    path: '/staff-profile',
    name: 'StaffProfile',
    component: () => import('../views/StaffProfile.vue')
  },
  {
    path: '/staff-profile-desktop',
    name: 'StaffProfileDesktop',
    component: () => import('../views/StaffProfileDesktop.vue')
  },
  {
    path: '/techlead-workorder-manage',
    name: 'TechLeadWorkorderManage',
    component: () => import('../views/TechLeadWorkorderManage.vue'),
    meta: { public: true }
  },
  {
    path: '/engineer-workorder-handle',
    name: 'EngineerWorkorderHandle',
    component: () => import('../views/EngineerWorkorderHandle.vue'),
    meta: { public: true }
  },
  {
    path: '/customer-workorder-sign',
    name: 'CustomerWorkorderSign',
    component: () => import('../views/CustomerWorkorderSign.vue'),
    meta: { public: true }
  },
  {
    path: '/customer-satisfaction-survey',
    name: 'CustomerSatisfactionSurvey',
    component: () => import('../views/CustomerSatisfactionSurvey.vue'),
    meta: { public: true }
  },
  {
    path: '/team-management',
    name: 'TeamManagement',
    component: () => import('../views/TeamManagement.vue')
  },
  {
    path: '/team-statistics',
    name: 'TeamStatistics',
    component: () => import('../views/TeamStatistics.vue')
  },
  {
    path: '/member-detail',
    name: 'MemberDetail',
    component: () => import('../views/MemberDetail.vue')
  },
  {
    path: '/organization',
    name: 'Organization',
    component: () => import('../views/Organization.vue')
  },
  {
    path: '/employee',
    name: 'Employee',
    component: () => import('../views/Employee.vue')
  },
  {
    path: '/workflow-config',
    name: 'WorkflowConfig',
    component: () => import('../views/WorkflowConfig.vue'),
    meta: { title: '流程配置' }
  },
  {
    path: '/field-config',
    name: 'FieldConfigManager',
    component: () => import('../views/FieldConfigManager.vue'),
    meta: { title: '字段配置管理' }
  },
  {
    path: '/field-designer',
    name: 'FieldDesigner',
    component: () => import('../views/FieldDesigner.vue'),
    meta: { title: '字段设计器' }
  },
  {
    path: '/field-template-manager',
    name: 'FieldTemplateManager',
    component: () => import('../views/FieldTemplateManager.vue'),
    meta: { title: '字段模板管理' }
  },
  {
    path: '/customer-field-config',
    name: 'CustomerFieldConfig',
    component: () => import('../views/CustomerFieldConfig.vue'),
    meta: { title: '客户字段配置' }
  },
  {
    path: '/api-test',
    name: 'ApiTest',
    component: () => import('../views/ApiTest.vue'),
    meta: { title: 'API测试', public: true }
  },
  {
    path: '/tianyancha-test',
    name: 'TianyanchaTest',
    component: () => import('../views/TianyanchaTest.vue'),
    meta: { title: '天眼查API测试', public: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 角色权限配置
const rolePermissions = {
  admin: ['/', '/dashboard', '/customer', '/asset', '/workorder', '/field-service', '/parts', '/qrcode', '/scan', '/contact', '/user-approval', '/quotation', '/quotation-item-query', '/report-template', '/employee', '/organization', '/workflow-config', '/field-config', '/field-designer', '/field-template-manager', '/customer-field-config', '/team-management', '/team-statistics', '/member-detail', '/staff-mobile-workspace', '/staff-workorder-list', '/staff-workorder-detail', '/staff-workorder-create', '/staff-field-checkin-list', '/staff-checkin', '/staff-profile', '/staff-profile-desktop'],
  assistant: ['/', '/dashboard', '/customer', '/asset', '/workorder', '/field-service', '/parts', '/qrcode', '/scan', '/contact', '/quotation', '/quotation-item-query', '/report-template', '/staff-mobile-workspace', '/staff-workorder-list', '/staff-workorder-detail', '/staff-workorder-create', '/staff-field-checkin-list', '/staff-checkin', '/staff-profile', '/staff-profile-desktop'],
  engineer: ['/', '/staff-mobile-workspace', '/staff-workorder-list', '/staff-workorder-detail', '/staff-field-checkin-list', '/staff-checkin', '/staff-profile', '/staff-profile-desktop', '/field-service', '/parts', '/qrcode', '/scan'],
  techLead: ['/', '/dashboard', '/customer', '/asset', '/workorder', '/field-service', '/parts', '/qrcode', '/scan', '/contact', '/quotation', '/quotation-item-query', '/report-template', '/staff-mobile-workspace', '/staff-workorder-list', '/staff-workorder-detail', '/staff-profile', '/staff-profile-desktop'],
  director: ['/', '/dashboard', '/customer', '/asset', '/workorder', '/field-service', '/parts', '/qrcode', '/scan', '/contact', '/quotation', '/quotation-item-query', '/report-template', '/staff-mobile-workspace', '/staff-workorder-list', '/staff-workorder-detail', '/staff-profile', '/staff-profile-desktop'],
  customer: ['/', '/customer-workspace', '/customer-workorder-list', '/customer-workorder-detail', '/customer-profile', '/customer-device-list', '/asset-detail', '/customer-quotation-sign', '/customer-dashboard']
}

// 获取当前用户角色
function getCurrentRole() {
  try {
    const staffAuth = JSON.parse(localStorage.getItem('staffAuth') || '{}')
    return staffAuth.role || null
  } catch (e) {
    return null
  }
}

// 检查是否有权限访问页面
function hasPermission(path, role) {
  if (!role) return false
  const allowedPaths = rolePermissions[role] || []
  // 检查路径是否以允许的路径开头
  return allowedPaths.some(allowedPath => path.startsWith(allowedPath))
}

// 路由守卫
router.beforeEach((to, from, next) => {
  // 公开页面，无需登录
  if (to.meta.public) {
    return next()
  }

  // 获取当前角色
  const currentRole = getCurrentRole()

  // 未登录，跳转到登录页
  if (!currentRole) {
    return next('/login')
  }

  // 需要客户登录的页面
  if (to.meta.requiresCustomerAuth) {
    const customerStore = useCustomerStore()
    const isLoggedIn = customerStore.checkLoginStatus()

    if (!isLoggedIn) {
      sessionStorage.setItem('redirectUrl', to.fullPath)
      return next('/customer-login')
    }

    const customerStatus = customerStore.customerStatus
    if (customerStatus === 'pending') {
      return next('/contact-register?status=pending')
    }

    if (customerStatus === 'rejected') {
      return next('/contact-register?status=rejected')
    }

    return next()
  }

  // 检查角色权限
  if (!hasPermission(to.path, currentRole)) {
    ElMessage.warning('您没有权限访问该页面')
    // 根据角色跳转到对应首页
    const roleHomePage = {
      admin: '/dashboard',
      assistant: '/dashboard',
      engineer: '/staff-mobile-workspace',
      techLead: '/dashboard',
      director: '/dashboard',
      customer: '/customer-workspace'
    }
    return next(roleHomePage[currentRole] || '/login')
  }

  next()
})

export default router
