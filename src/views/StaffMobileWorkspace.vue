<template>
  <div class="staff-mobile-workspace">
    <!-- 顶部用户信息 -->
    <div class="header-section">
      <div class="user-info">
        <el-avatar :size="50" :icon="UserFilled" />
        <div class="user-details">
          <h3>{{ staffInfo.name }}</h3>
          <p>{{ staffInfo.roleDisplay || staffInfo.role }} | {{ staffInfo.department }}</p>
        </div>
      </div>
      <div class="header-actions">
        <el-button circle @click="switchToDesktop" title="切换到电脑端">
          <el-icon><Monitor /></el-icon>
        </el-button>
      </div>
    </div>

    <!-- 部长：超时未分配工单提醒 -->
    <div v-if="directorPendingCount > 0" class="timeout-alert-section" @click="openAssignDialog(getDirectorPendingPool()[0])">
      <div class="alert-card alert-danger">
        <div class="alert-icon">
          <el-icon><Warning /></el-icon>
        </div>
        <div class="alert-content">
          <div class="alert-title">
            ⚠️ 有 {{ directorPendingCount }} 个工单超过2小时未分配
          </div>
          <div class="alert-desc">请及时分配处理，避免影响客户满意度</div>
        </div>
        <div class="alert-action">
          <el-button type="danger" size="small" round>分配</el-button>
          <el-icon class="arrow"><ArrowRight /></el-icon>
        </div>
      </div>
    </div>

    <!-- 课长/经理：团队概览统计（课长隐藏） -->
    <div v-if="hasTeamAccess" class="manager-stats-section">
      <div class="section-title">
        <el-icon><OfficeBuilding /></el-icon>
        <span>团队概览</span>
      </div>
      <div class="stats-grid manager">
        <div class="stat-item" @click="goToTeamWorkorders">
          <span class="stat-number">{{ teamStats.totalWorkorders }}</span>
          <span class="stat-label">团队工单</span>
        </div>
        <div class="stat-item" @click="goToPendingApprovals">
          <span class="stat-number">{{ teamStats.pendingApproval }}</span>
          <span class="stat-label">待审批</span>
        </div>
        <div class="stat-item" @click="goToTeamCheckins">
          <span class="stat-number">{{ teamStats.todayCheckins }}</span>
          <span class="stat-label">今日打卡</span>
        </div>
        <div class="stat-item">
          <span class="stat-number">{{ teamStats.onlineMembers }}</span>
          <span class="stat-label">在线人数</span>
        </div>
      </div>
    </div>

    <!-- 普通员工：今日任务统计 -->
    <div v-else class="stats-section">
      <div class="stats-grid">
        <div class="stat-item" @click="goToWorkorders('today')">
          <span class="stat-number">{{ stats.today }}</span>
          <span class="stat-label">今日工单</span>
        </div>
        <div class="stat-item" @click="goToWorkorders('pending_accept')">
          <span class="stat-number">{{ stats.pending }}</span>
          <span class="stat-label">待处理</span>
        </div>
        <div class="stat-item" @click="goToWorkorders('processing')">
          <span class="stat-number">{{ stats.processing }}</span>
          <span class="stat-label">进行中</span>
        </div>
        <div class="stat-item" @click="goToFieldCheckinList">
          <span class="stat-number">{{ stats.fieldService }}</span>
          <span class="stat-label">外勤</span>
        </div>
      </div>
    </div>

    <!-- 打卡提醒卡片 -->
    <div class="checkin-alert-section" v-if="hasCheckinAlerts">
      <!-- 未提交打卡提醒 -->
      <div 
        v-if="unsubmittedCheckins.length > 0" 
        class="alert-card alert-warning"
        @click="goToFieldCheckinListWithFilter('unsubmitted')"
      >
        <div class="alert-icon">
          <el-icon><Warning /></el-icon>
        </div>
        <div class="alert-content">
          <div class="alert-title">
            有 {{ unsubmittedCheckins.length }} 条打卡未提交
            <span class="alert-time">最早 {{ getEarliestCheckinTime(unsubmittedCheckins) }}</span>
          </div>
          <div class="alert-desc">请及时提交审批，避免影响考勤统计</div>
        </div>
        <div class="alert-action">
          <el-button type="warning" size="small" round>去提交</el-button>
          <el-icon class="arrow"><ArrowRight /></el-icon>
        </div>
      </div>

      <!-- 待审批打卡提醒（给审批者） -->
      <div 
        v-if="pendingApprovalCheckins.length > 0 && isApprover" 
        class="alert-card alert-info"
        @click="goToFieldCheckinListWithFilter('pending_approval')"
      >
        <div class="alert-icon">
          <el-icon><Bell /></el-icon>
        </div>
        <div class="alert-content">
          <div class="alert-title">
            有 {{ pendingApprovalCheckins.length }} 条打卡待审批
            <span class="alert-badge">待审批</span>
          </div>
          <div class="alert-desc">{{ getPendingApprovalDesc() }}</div>
        </div>
        <div class="alert-action">
          <el-button type="primary" size="small" round>去审批</el-button>
          <el-icon class="arrow"><ArrowRight /></el-icon>
        </div>
      </div>
    </div>

    <!-- 待处理工单提醒（按角色显示不同内容） -->
    <div v-if="myPendingItems.length > 0" class="pending-section">
      <div class="section-header">
        <h4>待处理</h4>
        <el-badge :value="myPendingItems.length" type="danger" />
      </div>
      <div
        v-for="item in myPendingItems.slice(0, 5)"
        :key="item.id + '-' + item.pendingType"
        class="pending-card"
        @click="handlePendingAction(item)"
      >
        <div class="pending-icon">
          <el-icon><Warning /></el-icon>
        </div>
        <div class="pending-content">
          <div class="pending-title">{{ item.pendingTitle }}</div>
          <div class="pending-desc">{{ item.customerName || '未知客户' }}</div>
        </div>
        <div class="pending-action">
          <el-button type="primary" size="small" round>{{ item.pendingAction }}</el-button>
          <el-icon class="arrow"><ArrowRight /></el-icon>
        </div>
      </div>
    </div>

    <!-- 课长：待审核报价单提醒 -->
    <div v-if="isManager && pendingQuotations.length > 0" class="pending-section">
      <div class="section-header">
        <h4>待审核报价单</h4>
        <el-badge :value="pendingQuotations.length" type="warning" />
      </div>
      <div
        v-for="quotation in pendingQuotations.slice(0, 3)"
        :key="quotation.id"
        class="pending-card quotation-card"
        @click="goToQuotationApproval"
      >
        <div class="pending-icon quotation-icon">
          <el-icon><Document /></el-icon>
        </div>
        <div class="pending-content">
          <div class="pending-title">报价单待审核</div>
          <div class="pending-desc">{{ quotation.quotationNo }} - {{ quotation.customerName }}</div>
        </div>
        <div class="pending-action">
          <el-button type="warning" size="small" round>去审核</el-button>
          <el-icon class="arrow"><ArrowRight /></el-icon>
        </div>
      </div>
    </div>

    <!-- 课长/经理：团队成员列表（课长隐藏） -->
    <div v-if="hasTeamAccess" class="team-section">
      <div class="section-header">
        <h4>团队成员</h4>
        <el-button link size="small" @click="goToTeamManagement">查看全部</el-button>
      </div>
      <div class="team-list">
        <div 
          v-for="member in teamMembers.slice(0, 4)" 
          :key="member.id" 
          class="team-member"
          @click="viewMemberDetail(member)"
        >
          <div class="member-avatar">
            <el-avatar :size="45" :icon="UserIcon" />
            <div class="member-status" :class="member.status"></div>
          </div>
          <div class="member-info">
            <span class="member-name">{{ member.name }}</span>
            <span class="member-stats">今日 {{ member.todayWorkorders }} 单 | 累计 {{ member.completed }} 单</span>
          </div>
          <el-icon class="member-arrow"><ArrowRight /></el-icon>
        </div>
      </div>
    </div>

    <!-- 快捷功能入口 -->
    <div class="quick-actions">
      <div class="action-grid" :key="currentUserRole">
        <!-- 管理员：工单管理、审批管理、打卡、BI数据 -->
        <template v-if="currentUserRole === 'admin'">
          <div class="action-item workorder" @click="goToWorkorderManage">
            <div class="action-icon"><el-icon><Document /></el-icon></div>
            <span class="action-label">工单管理</span>
            <span class="action-desc">管理所有工单</span>
          </div>
          <div class="action-item approval" @click="goToPendingApprovals">
            <div class="action-icon">
              <el-icon><CircleCheck /></el-icon>
              <el-badge v-if="teamStats.pendingApproval > 0" :value="teamStats.pendingApproval" class="action-badge" />
            </div>
            <span class="action-label">审批管理</span>
            <span class="action-desc">打卡审批处理</span>
          </div>
          <div class="action-item field" @click="goToFieldCheckinList">
            <div class="action-icon"><el-icon><MapLocation /></el-icon></div>
            <span class="action-label">打卡</span>
            <span class="action-desc">当日外勤打卡</span>
          </div>
          <div class="action-item bi" @click="goToBI">
            <div class="action-icon"><el-icon><TrendCharts /></el-icon></div>
            <span class="action-label">BI数据</span>
            <span class="action-desc">数据大屏分析</span>
          </div>
        </template>

        <!-- 业务助理：新建工单、我的工单、打卡、待签字 -->
        <template v-if="currentUserRole === 'assistant'">
          <div class="action-item create" @click="goToCreateWorkorder">
            <div class="action-icon"><el-icon><Plus /></el-icon></div>
            <span class="action-label">新建工单</span>
            <span class="action-desc">创建服务工单</span>
          </div>
          <div class="action-item workorder" @click="goToMyWorkorders">
            <div class="action-icon"><el-icon><Document /></el-icon></div>
            <span class="action-label">我的工单</span>
            <span class="action-desc">查看工单列表</span>
          </div>
          <div class="action-item field" @click="goToFieldCheckinList">
            <div class="action-icon"><el-icon><MapLocation /></el-icon></div>
            <span class="action-label">打卡</span>
            <span class="action-desc">当日外勤打卡</span>
          </div>
          <div class="action-item sign" @click="goToPendingSign">
            <div class="action-icon">
              <el-icon><EditPen /></el-icon>
              <el-badge v-if="stats.pendingSign > 0" :value="stats.pendingSign" class="action-badge" />
            </div>
            <span class="action-label">待签字</span>
            <span class="action-desc">客户签字确认</span>
          </div>
        </template>

        <!-- 课长：审批管理、工单管理、打卡、BI数据 -->
        <template v-if="currentUserRole === 'techLead'">
          <div class="action-item approval" @click="goToPendingApprovals">
            <div class="action-icon">
              <el-icon><CircleCheck /></el-icon>
              <el-badge v-if="teamStats.pendingApproval > 0" :value="teamStats.pendingApproval" class="action-badge" />
            </div>
            <span class="action-label">审批管理</span>
            <span class="action-desc">打卡审批处理</span>
          </div>
          <div class="action-item workorder" @click="goToTechLeadWorkorders">
            <div class="action-icon"><el-icon><Document /></el-icon></div>
            <span class="action-label">工单管理</span>
            <span class="action-desc">分配与确认工单</span>
          </div>
          <div class="action-item field" @click="goToFieldCheckinList">
            <div class="action-icon"><el-icon><MapLocation /></el-icon></div>
            <span class="action-label">打卡</span>
            <span class="action-desc">当日外勤打卡</span>
          </div>
          <div class="action-item bi" @click="goToBI">
            <div class="action-icon"><el-icon><TrendCharts /></el-icon></div>
            <span class="action-label">BI数据</span>
            <span class="action-desc">数据大屏分析</span>
          </div>
        </template>

        <!-- 部长：审批管理、工单管理、打卡、BI数据 -->
        <template v-if="currentUserRole === 'director'">
          <div class="action-item approval" @click="goToPendingApprovals">
            <div class="action-icon">
              <el-icon><CircleCheck /></el-icon>
              <el-badge v-if="teamStats.pendingApproval > 0" :value="teamStats.pendingApproval" class="action-badge" />
            </div>
            <span class="action-label">审批管理</span>
            <span class="action-desc">打卡审批处理</span>
          </div>
          <div class="action-item workorder" @click="goToWorkorderManage">
            <div class="action-icon"><el-icon><Document /></el-icon></div>
            <span class="action-label">工单管理</span>
            <span class="action-desc">管理所有工单</span>
          </div>
          <div class="action-item field" @click="goToFieldCheckinList">
            <div class="action-icon"><el-icon><MapLocation /></el-icon></div>
            <span class="action-label">打卡</span>
            <span class="action-desc">当日外勤打卡</span>
          </div>
          <div class="action-item bi" @click="goToBI">
            <div class="action-icon"><el-icon><TrendCharts /></el-icon></div>
            <span class="action-label">BI数据</span>
            <span class="action-desc">数据大屏分析</span>
          </div>
        </template>

        <!-- 工程师：扫码、我的工单、打卡、待签字 -->
        <template v-if="currentUserRole === 'engineer'">
          <div class="action-item scan" @click="openScan">
            <div class="action-icon"><el-icon><Camera /></el-icon></div>
            <span class="action-label">扫码</span>
            <span class="action-desc">设备/工单扫码</span>
          </div>
          <div class="action-item workorder" @click="goToMyWorkorders">
            <div class="action-icon"><el-icon><Document /></el-icon></div>
            <span class="action-label">我的工单</span>
            <span class="action-desc">查看工单列表</span>
          </div>
          <div class="action-item field" @click="goToFieldCheckinList">
            <div class="action-icon"><el-icon><MapLocation /></el-icon></div>
            <span class="action-label">打卡</span>
            <span class="action-desc">当日外勤打卡</span>
          </div>
          <div class="action-item sign" @click="goToPendingSign">
            <div class="action-icon">
              <el-icon><EditPen /></el-icon>
              <el-badge v-if="stats.pendingSign > 0" :value="stats.pendingSign" class="action-badge" />
            </div>
            <span class="action-label">待签字</span>
            <span class="action-desc">客户签字确认</span>
          </div>
        </template>
      </div>
    </div>

    <!-- 今日待办 -->
    <div class="todo-section" v-if="todayTodos.length > 0">
      <div class="section-header">
        <h4>今日待办</h4>
        <el-tag type="danger" size="small">{{ todayTodos.length }}</el-tag>
      </div>
      <div class="todo-list">
        <div 
          v-for="todo in todayTodos" 
          :key="todo.id" 
          class="todo-item"
          @click="handleTodoClick(todo)"
        >
          <div class="todo-time">
            <span class="time">{{ todo.time }}</span>
            <el-tag :type="getTodoType(todo.type)" size="small">{{ getTodoLabel(todo.type) }}</el-tag>
          </div>
          <div class="todo-content">
            <span class="todo-title">{{ todo.title }}</span>
            <span class="todo-address">
              <el-icon><Location /></el-icon>
              {{ todo.address }}
            </span>
          </div>
          <el-icon class="arrow"><ArrowRight /></el-icon>
        </div>
      </div>
    </div>

    <!-- 最近工单 -->
    <div class="workorder-section">
      <div class="section-header">
        <h4>我的工单</h4>
        <el-button link @click="goToWorkorders('all')">查看全部</el-button>
      </div>
      
      <!-- 工单分类标签 -->
      <div class="workorder-tabs">
        <div 
          v-for="tab in workorderTabs" 
          :key="tab.key"
          class="tab-item"
          :class="{ active: activeTab === tab.key }"
          @click="activeTab = tab.key"
        >
          {{ tab.name }}
          <el-badge 
            v-if="tab.count > 0" 
            :value="tab.count" 
            :type="tab.key === 'pending' ? 'danger' : 'primary'"
            class="tab-badge"
          />
        </div>
      </div>
      
      <div class="workorder-list">
        <div v-if="filteredWorkorders.length === 0" class="empty-state">
          <el-icon><Document /></el-icon>
          <p>暂无工单</p>
        </div>
        <div 
          v-for="order in filteredWorkorders" 
          :key="order.id" 
          class="workorder-card"
          @click="viewWorkorderDetail(order)"
        >
          <div class="card-header">
            <span class="order-no">{{ order.workorderId }}</span>
            <el-tag :type="getStatusType(order.status)" size="small">
              {{ getStatusText(order.status) }}
            </el-tag>
          </div>
          <div class="card-body">
            <p class="device-info">
              <el-icon><Monitor /></el-icon>
              {{ order.deviceModel || '设备型号未指定' }}
            </p>
            <p class="order-desc">{{ order.faultDescription || order.description }}</p>
            <p class="customer-info">
              <el-icon><User /></el-icon>
              {{ order.customerName }} | {{ order.customerPhone }}
            </p>
          </div>
          <div class="card-footer">
            <span class="order-time">{{ formatDate(order.createTime) }}</span>
            <div class="action-buttons">
              <!-- 待分配：课长/管理员/部长(超2h)分配 -->
              <el-button v-if="order.status === 'pending_assign' && (isTechLead || currentUserRole === 'techLead' || currentUserRole === 'admin' || (currentUserRole === 'director'))" type="primary" size="small" @click.stop="openAssignDialog(order)">分配</el-button>
              <!-- 待接单：工程师/管理员接单弃单 -->
              <el-button v-if="order.status === 'pending_accept' && (isEngineer || currentUserRole === 'admin')" type="primary" size="small" @click.stop="acceptWorkorder(order)">接单</el-button>
              <el-button v-if="order.status === 'pending_accept' && (isEngineer || currentUserRole === 'admin')" type="warning" size="small" @click.stop="rejectWorkorderMobile(order)">弃单</el-button>
              <!-- 进行中：工程师/管理员打卡+完成 -->
              <el-button v-if="order.status === 'processing' && (isEngineer || currentUserRole === 'admin')" type="primary" size="small" :disabled="hasCheckedIn(order)" @click.stop="goToCheckInFromWorkorder(order)">{{ hasCheckedIn(order) ? '已打卡' : '打卡' }}</el-button>
              <el-button v-if="order.status === 'processing' && (isEngineer || currentUserRole === 'admin')" type="success" size="small" @click.stop="completeWorkorder(order)">完成</el-button>
              <!-- 待签字：查看详情 -->
              <el-button v-if="order.status === 'pending_sign'" type="primary" size="small" @click.stop="viewWorkorderDetail(order)">签字</el-button>
              <!-- 课长确认：课长/管理员 -->
              <el-button v-if="order.status === 'techlead_confirm' && (isTechLead || currentUserRole === 'techLead' || currentUserRole === 'admin')" type="primary" size="small" @click.stop="techLeadConfirmMobile(order)">课长确认</el-button>
              <!-- 业务确认：业务助理/管理员 -->
              <el-button v-if="order.status === 'assistant_confirm' && (isAssistant || currentUserRole === 'assistant' || currentUserRole === 'admin')" type="primary" size="small" @click.stop="assistantConfirmMobile(order)">业务确认</el-button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 分配工程师对话框 -->
    <el-dialog
      v-model="assignDialogVisible"
      title="分配工程师"
      width="95%"
      :show-close="false"
      class="mobile-dialog assign-mobile-dialog"
      :fullscreen="true"
    >
      <template #header>
        <div class="repair-dialog-header">
          <span class="repair-title">分配工程师</span>
          <el-button link @click="assignDialogVisible = false">
            <el-icon><Close /></el-icon>
          </el-button>
        </div>
      </template>
      <div v-if="assignWorkorderData" class="assign-dialog-content">
        <!-- 工单基础信息 -->
        <div class="assign-info-section">
          <div class="assign-section-title">工单信息</div>
          <div class="assign-info-row"><span class="label">工单号</span><span class="value">{{ assignWorkorderData.workorderId }}</span></div>
          <div class="assign-info-row"><span class="label">工单类型</span><span class="value">{{ getCategoryText(assignWorkorderData.category) }}{{ assignWorkorderData.subType ? '·' + getSubTypeText(assignWorkorderData.subType) : '' }}</span></div>
          <div class="assign-info-row"><span class="label">客户公司</span><span class="value">{{ assignWorkorderData.customerName }}</span></div>
          <div class="assign-info-row"><span class="label">联系电话</span><span class="value">{{ assignWorkorderData.customerPhone }}</span></div>
          <div class="assign-info-row"><span class="label">地址</span><span class="value">{{ assignWorkorderData.address }}</span></div>
          <div class="assign-info-pair">
            <div class="assign-info-item"><span class="label">设备型号</span><span class="value">{{ assignWorkorderData.deviceModel || '-' }}</span></div>
            <div class="assign-info-item"><span class="label">序列号</span><span class="value">{{ assignWorkorderData.serialNumber || '-' }}</span></div>
          </div>
          <div class="assign-info-row"><span class="label">保修状态</span><span class="value"><el-tag :type="getWarrantyTagType(assignWorkorderData.warrantyStatus)" size="small">{{ getWarrantyText(assignWorkorderData.warrantyStatus) }}</el-tag></span></div>
          <div class="assign-info-desc"><span class="label">故障描述</span><div class="value">{{ assignWorkorderData.faultDescription }}</div></div>
        </div>

        <el-divider />

        <el-form label-position="top">
          <el-form-item label="选择工程师" required>
            <el-select
              v-model="assignFormData.selectedEngineerIds"
              multiple
              placeholder="请选择工程师（可多选）"
              style="width: 100%"
              filterable
            >
              <el-option
                v-for="eng in engineerList"
                :key="eng.id"
                :label="`${eng.name}（${eng.department}·${eng.specialty}）`"
                :value="eng.id"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="工作内容">
            <el-input v-model="assignFormData.workContent" type="textarea" :rows="3" placeholder="请填写工作内容" />
          </el-form-item>
          <el-form-item label="工作开始时间">
            <el-date-picker
              v-model="assignFormData.workStartTime"
              type="datetime"
              placeholder="选择开始时间"
              format="YYYY-MM-DD HH:mm"
              value-format="YYYY-MM-DDTHH:mm:ss"
              style="width: 100%"
            />
          </el-form-item>
          <el-form-item label="预定完成时间">
            <el-date-picker
              v-model="assignFormData.workEndTime"
              type="datetime"
              placeholder="选择完成时间"
              format="YYYY-MM-DD HH:mm"
              value-format="YYYY-MM-DDTHH:mm:ss"
              style="width: 100%"
            />
          </el-form-item>
          <el-form-item label="使用车辆">
            <el-radio-group v-model="assignFormData.vehicle">
              <el-radio label="self">自备</el-radio>
              <el-radio label="company">公司车辆</el-radio>
              <el-radio label="public">公共交通</el-radio>
            </el-radio-group>
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <div class="repair-footer">
          <el-button size="large" @click="assignDialogVisible = false">取消</el-button>
          <el-button type="primary" size="large" @click="confirmAssign" :disabled="assignFormData.selectedEngineerIds.length === 0">确认分配</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 底部导航 -->
    <div class="bottom-nav">
      <div 
        v-for="nav in bottomNavs" 
        :key="nav.key"
        class="nav-item"
        :class="{ active: currentNav === nav.key }"
        @click="switchNav(nav.key)"
      >
        <el-icon><component :is="nav.icon" /></el-icon>
        <span>{{ nav.name }}</span>
      </div>
    </div>

    <!-- 扫码全屏页面 -->
    <div v-if="scanDialog.visible" class="scan-fullscreen-page">
      <!-- 顶部导航 -->
      <div class="scan-header">
        <el-button link @click="scanDialog.visible = false; stopScan()">
          <el-icon><ArrowLeft /></el-icon>
          <span>返回</span>
        </el-button>
        <span class="header-title">扫码</span>
        <span class="placeholder"></span>
      </div>
      
      <!-- 扫码内容区 -->
      <div class="scan-content">
        <div class="scan-area" v-if="scanDialog.isScanning">
          <video ref="videoRef" class="scan-video" playsinline autoplay muted></video>
          <canvas ref="canvasRef" style="display: none;"></canvas>
          <div class="scan-frame">
            <div class="corner top-left"></div>
            <div class="corner top-right"></div>
            <div class="corner bottom-left"></div>
            <div class="corner bottom-right"></div>
            <div class="scan-line"></div>
          </div>
          <p class="scan-tip">将二维码放入框内</p>
          <el-button type="primary" @click="stopScan" size="large" round>停止扫描</el-button>
        </div>
        <div class="scan-start" v-else-if="canUseCamera">
          <div class="scan-icon">
            <el-icon><Camera /></el-icon>
          </div>
          <p class="scan-tip">点击开始扫描</p>
          <el-button type="primary" @click="startScan" size="large" round>开始扫码</el-button>
        </div>
        <div class="scan-unavailable" v-else>
          <div class="scan-icon unavailable">
            <el-icon><Camera /></el-icon>
          </div>
          <p class="scan-tip">摄像头暂不可用</p>
          <p class="scan-reason">{{ cameraUnavailableReason }}</p>
          <el-button type="primary" @click="showManualInputDialog" size="large" round style="margin-top: 20px;">
            手动输入编号
          </el-button>
        </div>
      </div>
    </div>

    <!-- 手动输入对话框 -->
    <el-dialog
      v-model="manualInputDialog.visible"
      title="手动输入设备/工单编号"
      width="90%"
      :show-close="false"
      class="mobile-dialog"
    >
      <div class="manual-input-form">
        <p class="input-tip">请输入设备序列号或工单编号</p>
        <el-input
          v-model="manualInputDialog.code"
          placeholder="例如：SN123456 或 WO2024001"
          size="large"
          clearable
        />
      </div>
      <template #footer>
        <el-button @click="manualInputDialog.visible = false" size="large">取消</el-button>
        <el-button type="primary" @click="submitManualInput" size="large">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  UserFilled,
  Camera,
  Document,
  MapLocation,
  EditPen,
  ArrowRight,
  Monitor,
  Location,
  HomeFilled,
  List,
  User,
  Calendar,
  Warning,
  Bell,
  OfficeBuilding,
  User as UserIcon,
  TrendCharts,
  CircleCheck,
  Plus,
  Close
} from '@element-plus/icons-vue'
import { getTechLeadPendingWorkorders, getTechLeadPendingPool, state as workorderFlowState, acceptWorkorder as storeAcceptWorkorder, submitForSign, rejectWorkorder, techLeadConfirm, assistantConfirm, getVisibleWorkorders, getDirectorPendingPool, isTimeoutUnassigned, engineerList, assignWorkorder } from '../stores/workorderFlowStore.js'

const router = useRouter()

// 职员信息（默认空值，必须从 localStorage 加载）
const staffInfo = reactive({
  name: '',
  role: '',
  roleDisplay: '',
  department: '技术服务部'
})

// 从 localStorage 加载用户信息
const loadUserInfo = () => {
  const savedUserInfo = localStorage.getItem('userInfo')
  console.log('加载用户信息:', savedUserInfo)
  if (savedUserInfo) {
    try {
      const parsed = JSON.parse(savedUserInfo)
      console.log('解析后的用户信息:', parsed)
      staffInfo.name = parsed.name || staffInfo.name
      staffInfo.role = parsed.role || staffInfo.role
      staffInfo.roleDisplay = parsed.roleDisplay || parsed.role || staffInfo.roleDisplay
      staffInfo.department = parsed.department || staffInfo.department
      console.log('更新后的 staffInfo:', staffInfo)
    } catch (e) {
      console.error('解析用户信息失败:', e)
    }
  }
  // 兜底：从 staffAuth 获取英文 role（确保角色判断正确）
  if (!['admin', 'assistant', 'engineer', 'techLead', 'director'].includes(staffInfo.role)) {
    try {
      const staffAuth = JSON.parse(localStorage.getItem('staffAuth') || '{}')
      if (staffAuth.role && ['admin', 'assistant', 'engineer', 'techLead', 'director'].includes(staffAuth.role)) {
        console.log('从 staffAuth 兜底获取 role:', staffAuth.role)
        staffInfo.role = staffAuth.role
      }
    } catch (e) {}
  }
}

// 是否为审批者（课长、部长、经理等角色）
const isApprover = computed(() => {
  if (['techLead', 'director', 'admin'].includes(staffInfo.role)) return true
  if (['课长', '部长', '经理', '部门负责人', '系统管理员'].includes(staffInfo.role)) return true
  return false
})

// 是否为课长（分配工单、课长确认权限）
const isTechLead = computed(() => {
  if (['techLead', 'admin'].includes(staffInfo.role)) return true
  if (['课长', '系统管理员'].includes(staffInfo.role)) return true
  return false
})

// 是否为工程师（接单弃单权限）
const isEngineer = computed(() => {
  if (['engineer', 'admin'].includes(staffInfo.role)) return true
  if (['工程师', '系统管理员'].includes(staffInfo.role)) return true
  // 兼容旧数据：角色名为具体工程师名（如"王工程师"）
  if (staffInfo.role && staffInfo.role.includes('工程师') && !['课长', '部长'].some(k => staffInfo.role.includes(k))) return true
  return false
})

// 是否为业务助理（业务确认权限）
const isAssistant = computed(() => {
  return ['业务助理', 'assistant', '系统管理员', 'admin'].includes(staffInfo.role)
})

// 当前用户英文角色（从staffAuth获取）
const auth = JSON.parse(localStorage.getItem('staffAuth') || '{}')
const currentUserRole = auth.role || ''

// 部长超时待分配工单数
const directorPendingCount = computed(() => {
  if (currentUserRole !== 'director' && currentUserRole !== 'admin') return 0
  return getDirectorPendingPool().length
})

// 是否为课长/部长/经理（审批相关权限）
const isManager = computed(() => {
  return ['课长', '部长', '经理', 'techLead', 'director', '系统管理员', 'admin'].includes(staffInfo.role)
})

// 是否有团队管理权限（课长、部长不包含团队管理功能）
const hasTeamAccess = computed(() => {
  return ['经理'].includes(staffInfo.role) || (isManager.value && staffInfo.role !== '课长' && staffInfo.role !== 'techLead' && staffInfo.role !== '部长' && staffInfo.role !== 'director')
})

// 团队成员列表
const teamMembers = ref([
  { id: 1, name: '张工程师', role: '工程师', status: 'online', todayWorkorders: 2, completed: 15 },
  { id: 2, name: '王工程师', role: '工程师', status: 'online', todayWorkorders: 1, completed: 12 },
  { id: 3, name: '李工程师', role: '工程师', status: 'offline', todayWorkorders: 0, completed: 18 },
  { id: 4, name: '赵工程师', role: '工程师', status: 'online', todayWorkorders: 3, completed: 10 },
  { id: 5, name: '陈工程师', role: '工程师', status: 'offline', todayWorkorders: 0, completed: 8 }
])

// 团队统计数据
const teamStats = computed(() => {
  const totalWorkorders = teamMembers.value.reduce((sum, m) => sum + m.todayWorkorders, 0)
  const onlineMembers = teamMembers.value.filter(m => m.status === 'online').length
  const pendingApproval = pendingApprovalCheckins.value.length + pendingQuotations.value.length
  const todayCheckins = todayCheckinList.value.length

  return {
    totalWorkorders,
    onlineMembers,
    pendingApproval,
    todayCheckins
  }
})

// 未提交打卡列表（已签离但未提交审批）
const unsubmittedCheckins = ref([])

// 待审批打卡列表（给审批者看的）
const pendingApprovalCheckins = ref([])

// 是否有打卡提醒
const hasCheckinAlerts = computed(() => {
  return unsubmittedCheckins.value.length > 0 || 
         (pendingApprovalCheckins.value.length > 0 && isApprover.value)
})

// 当日打卡记录（从localStorage加载）
const todayCheckinList = ref([])

// 统计数据 - 根据实际数据动态计算
const stats = computed(() => {
  const today = new Date()
  const todayStr = today.toDateString()

  // 今日工单：创建时间是今天的工单
  const todayWorkorders = recentWorkorders.value.filter(w => {
    const createDate = new Date(w.createTime)
    return createDate.toDateString() === todayStr
  })

  // 外勤：今日打卡记录数量（使用与打卡列表相同的数据）
  const todayCheckins = todayCheckinList.value.filter(r => {
    // 检查checkinTime是否为时间字符串格式（如 "09:00"）
    if (typeof r.checkinTime === 'string' && r.checkinTime.includes(':')) {
      // 如果是今天的打卡记录，这里简化处理，假设列表中的都是今日数据
      return true
    }
    // 如果是日期对象，检查是否为今天
    const checkinDate = new Date(r.checkinTime)
    return checkinDate.toDateString() === todayStr
  })

  return {
    today: todayWorkorders.length,
    pending: recentWorkorders.value.filter(w => w.status === 'pending_accept').length,
    processing: recentWorkorders.value.filter(w => w.status === 'processing').length,
    fieldService: todayCheckins.length,
    pendingSign: recentWorkorders.value.filter(w => w.status === 'pending_sign').length
  }
})

// 今日待办 - 根据工单状态动态计算，只显示未完成的工单
const todayTodos = computed(() => {
  // 未完成的工单状态：待接单(assigned)、进行中(processing)、待签字(pending_sign)、待报价(quotation_pending)
  const unfinishedStatuses = ['pending_accept', 'processing', 'pending_sign']

  // 从最近工单中筛选出今日未完成工单
  return recentWorkorders.value
    .filter(w => {
      // 检查是否为今日工单（创建时间是今天或状态为未完成）
      const isToday = new Date(w.createTime).toDateString() === new Date().toDateString()
      const isUnfinished = unfinishedStatuses.includes(w.status)
      return isUnfinished
    })
    .map(w => ({
      id: w.id,
      type: w.type,
      time: new Date(w.createTime).getHours().toString().padStart(2, '0') + ':00',
      title: `${w.deviceModel || w.description || '服务'} - ${w.customerName}`,
      address: w.address,
      workorderId: w.workorderId,
      status: w.status
    }))
})

// 最近工单
// 工单列表 - 从 store 加载
const recentWorkorders = ref([])

// 加载工单数据
const loadWorkorders = () => {
  // 从 staffAuth 获取用户信息（英文 key，用于权限过滤）
  const auth = JSON.parse(localStorage.getItem('staffAuth') || '{}')
  const enRole = auth.role || 'engineer'
  
  // 使用权限过滤获取可见工单
  const visibleWorkorders = getVisibleWorkorders({
    role: enRole,
    id: auth.id || auth.userId || '',
    name: auth.name || staffInfo.name || ''
  })
  
  console.log('StaffMobileWorkspace 加载工单:', { role: enRole, count: visibleWorkorders.length })
  
  // 转换为组件需要的格式
  recentWorkorders.value = visibleWorkorders.map(w => ({
    id: w.id,
    workorderId: w.workorderId,
    deviceModel: w.deviceModel,
    faultDescription: w.faultDescription,
    description: w.faultDescription,
    status: w.status,
    customerName: w.customerName,
    customerPhone: w.customerPhone,
    address: w.address,
    engineerName: w.engineerName,
    category: w.category,
    subType: w.subType,
    serialNumber: w.serialNumber,
    warrantyStatus: w.warrantyStatus,
    createTime: new Date(w.createTime),
    type: 'workorder'
  }))
}

// 工单分类标签（根据角色动态生成，工程师不展示"待分配"）
const activeTab = ref('all')

// 是否应该展示"待分配"标签
const showPendingAssignTab = computed(() => {
  return ['admin', 'assistant', 'techLead', 'director', 'customer'].includes(currentUserRole)
})

const workorderTabs = computed(() => {
  const tabs = [
    { key: 'all', name: '全部', count: recentWorkorders.value.length },
  ]
  if (showPendingAssignTab.value) {
    tabs.push({ key: 'pending_assign', name: '待分配', count: recentWorkorders.value.filter(w => w.status === 'pending_assign').length })
  }
  tabs.push(
    { key: 'pending_accept', name: '待接单', count: recentWorkorders.value.filter(w => w.status === 'pending_accept').length },
    { key: 'processing', name: '进行中', count: recentWorkorders.value.filter(w => w.status === 'processing').length },
    { key: 'pending_sign', name: '待签字', count: recentWorkorders.value.filter(w => w.status === 'pending_sign').length },
    { key: 'techlead_confirm', name: '课长确认', count: recentWorkorders.value.filter(w => w.status === 'techlead_confirm').length },
    { key: 'assistant_confirm', name: '业务确认', count: recentWorkorders.value.filter(w => w.status === 'assistant_confirm').length },
    { key: 'completed', name: '已完成', count: recentWorkorders.value.filter(w => w.status === 'completed').length }
  )
  return tabs
})

// 筛选后的工单列表
const filteredWorkorders = computed(() => {
  const sortByTime = (arr) => [...arr].sort((a, b) => new Date(b.createTime) - new Date(a.createTime))
  // 工程师在"全部"视图中不展示待分配工单
  const baseList = currentUserRole === 'engineer'
    ? recentWorkorders.value.filter(w => w.status !== 'pending_assign')
    : recentWorkorders.value
  switch (activeTab.value) {
    case 'pending_assign':
      return sortByTime(baseList.filter(w => w.status === 'pending_assign'))
    case 'pending_accept':
      return sortByTime(baseList.filter(w => w.status === 'pending_accept'))
    case 'processing':
      return sortByTime(baseList.filter(w => w.status === 'processing'))
    case 'pending_sign':
      return sortByTime(baseList.filter(w => w.status === 'pending_sign'))
    case 'techlead_confirm':
      return sortByTime(baseList.filter(w => w.status === 'techlead_confirm'))
    case 'assistant_confirm':
      return sortByTime(baseList.filter(w => w.status === 'assistant_confirm'))
    case 'completed':
      return sortByTime(baseList.filter(w => w.status === 'completed'))
    default:
      return sortByTime(baseList)
  }
})

// 待分配工单列表（按角色过滤）
const pendingWorkorders = computed(() => {
  if (currentUserRole === 'techLead') {
    // 课长：只看自己课室的待分配池
    const subDept = auth.subDepartment || ''
    return getTechLeadPendingPool(subDept)
  } else if (currentUserRole === 'director') {
    // 部长：只看超2小时未分配的
    return getDirectorPendingPool()
  } else if (currentUserRole === 'admin' || currentUserRole === 'assistant') {
    // 管理员/业务助理：看全部待分配
    return recentWorkorders.value.filter(w => w.status === 'pending_assign')
  } else if (currentUserRole === 'customer') {
    // 客户：只看自己创建的待分配
    const customerName = auth.name || ''
    return recentWorkorders.value.filter(w => w.status === 'pending_assign' && (w.createdBy?.name === customerName || w.customerName === customerName))
  }
  return []
})

// 待接单工单列表（工程师 - 演示环境看全部待接单）
const pendingAcceptWorkorders = computed(() => {
  if (currentUserRole !== 'engineer' && currentUserRole !== 'admin') return []
  return recentWorkorders.value.filter(w => w.status === 'pending_accept')
})

// 待业务确认工单列表（业务助理）
const pendingAssistantConfirmWorkorders = computed(() => {
  if (currentUserRole !== 'assistant' && currentUserRole !== 'admin') return []
  return recentWorkorders.value.filter(w => w.status === 'assistant_confirm')
})

// 待签字工单列表（工程师 - 演示环境看全部待签字）
const pendingSignWorkorders = computed(() => {
  if (currentUserRole !== 'engineer' && currentUserRole !== 'admin') return []
  return recentWorkorders.value.filter(w => w.status === 'pending_sign')
})

// 课长确认工单列表（课长）
const pendingTechLeadConfirmWorkorders = computed(() => {
  if (currentUserRole !== 'techLead' && currentUserRole !== 'admin') return []
  return recentWorkorders.value.filter(w => w.status === 'techlead_confirm')
})

// 统一的待处理列表（按角色聚合）
const myPendingItems = computed(() => {
  const items = []
  // 课长/部长/管理员 → 待分配
  if (isManager.value || currentUserRole === 'admin') {
    pendingWorkorders.value.forEach(w => {
      items.push({ ...w, pendingType: 'assign', pendingTitle: '新工单待分配', pendingAction: '分配', pendingActionFn: 'openAssignDialog' })
    })
  }
  // 课长 → 课长确认
  if (currentUserRole === 'techLead' || currentUserRole === 'admin') {
    pendingTechLeadConfirmWorkorders.value.forEach(w => {
      items.push({ ...w, pendingType: 'techlead_confirm', pendingTitle: '工单待确认', pendingAction: '去确认', pendingActionFn: 'goToWorkorderConfirm' })
    })
  }
  // 工程师 → 待接单
  pendingAcceptWorkorders.value.forEach(w => {
    items.push({ ...w, pendingType: 'accept', pendingTitle: '工单待接单', pendingAction: '去接单', pendingActionFn: 'goToAcceptList' })
  })
  // 工程师 → 待签字
  pendingSignWorkorders.value.forEach(w => {
    items.push({ ...w, pendingType: 'sign', pendingTitle: '工单待签字', pendingAction: '去签字', pendingActionFn: 'goToSignList' })
  })
  // 业务助理 → 待业务确认
  if (currentUserRole === 'assistant' || currentUserRole === 'admin') {
    pendingAssistantConfirmWorkorders.value.forEach(w => {
      items.push({ ...w, pendingType: 'assistant_confirm', pendingTitle: '工单待业务确认', pendingAction: '去确认', pendingActionFn: 'goToAssistantConfirmList' })
    })
  }
  return items
})

import { getPendingWorkorderQuotations } from '../stores/quotationStore.js'

// 待审核报价单列表（用于课长审核提醒）
const pendingQuotations = computed(() => {
  // 使用 quotationStore 获取待审核的维修工单报价单
  return getPendingWorkorderQuotations()
})

// 跳转到报价单审核页面
const goToQuotationApproval = () => {
  router.push('/quotation-item-query')
}

// 底部导航
const currentNav = ref('home')
const bottomNavs = [
  { key: 'home', name: '首页', icon: HomeFilled },
  { key: 'workorder', name: '工单', icon: List },
  { key: 'field', name: '外勤', icon: Calendar },
  { key: 'my', name: '我的', icon: User }
]

// 扫码对话框
const scanDialog = reactive({
  visible: false,
  isScanning: false
})
const videoRef = ref(null)
const canvasRef = ref(null)
let scanStream = null

// 摄像头可用性检测
const canUseCamera = computed(() => {
  const isSecureContext = window.isSecureContext || window.location.protocol === 'https:' || window.location.hostname === 'localhost'
  const hasMediaDevices = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
  return isSecureContext && hasMediaDevices
})

const cameraUnavailableReason = computed(() => {
  if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
    return '需要在 HTTPS 环境下使用'
  }
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    return '浏览器不支持摄像头'
  }
  return '摄像头暂不可用'
})

// 方法
const switchToDesktop = () => {
  localStorage.setItem('staffViewMode', 'desktop')
  router.push('/dashboard')
}

const goToWorkorders = (filter) => {
  router.push(`/staff-workorder-list?filter=${filter}`)
}

// 处理工单按钮点击
const handleWorkorderClick = () => {
  if (hasTeamAccess.value || isManager.value) {
    // 课长/经理查看团队工单
    router.push('/staff-workorder-list?filter=all')
  } else {
    // 工程师查看自己的工单
    router.push('/staff-workorder-list?filter=mine')
  }
}

const goToFieldCheckinList = () => {
  router.push('/staff-field-checkin-list')
}

const goToWorkorderManage = () => {
  router.push('/workorder')
}

const goToMyWorkorders = () => {
  router.push('/staff-workorder-list?filter=all')
}

const goToCreateWorkorder = () => {
  router.push('/staff-workorder-create')
}

const goToBI = () => {
  window.location.href = 'http://bi-demo.fastma.com.cn/bi_akl/akl_home.html'
}

const goToFieldCheckinListWithFilter = (filter) => {
  router.push(`/staff-field-checkin-list?filter=${filter}`)
}

const getEarliestCheckinTime = (checkins) => {
  if (!checkins || checkins.length === 0) return ''
  const times = checkins.map(c => c.checkinTime)
  return times.sort()[0]
}

const getPendingApprovalDesc = () => {
  const count = pendingApprovalCheckins.value.length
  if (count === 0) return ''
  const firstItem = pendingApprovalCheckins.value[0]
  return `${firstItem.engineerName} 等提交了 ${count} 条打卡记录`
}

const goToPendingSign = () => {
  // 查找第一个待签字工单
  const pendingSignWorkorders = recentWorkorders.value.filter(w => w.status === 'pending_sign')
  if (pendingSignWorkorders.length > 0) {
    // 直接跳转到第一个待签字工单的详情页
    const firstWorkorder = pendingSignWorkorders[0]
    router.push(`/staff-workorder-detail?id=${firstWorkorder.id}`)
  } else {
    // 没有待签字工单，跳转到工单列表
    router.push('/staff-workorder-list?filter=pending_sign')
  }
}

const viewWorkorderDetail = (order) => {
  sessionStorage.setItem('workspace_activeTab', activeTab.value)
  router.push(`/staff-workorder-detail?id=${order.id}`)
}

const acceptWorkorder = (order) => {
  storeAcceptWorkorder(order.id)
  ElMessage.success(`已接单: ${order.workorderId}`)
}

const completeWorkorder = (order) => {
  submitForSign(order.id, { repairContent: '', replacedParts: [], testResult: '' })
  ElMessage.success(`工单完成: ${order.workorderId}`)
}

// 判断工单是否已打卡签到
const hasCheckedIn = (order) => {
  try {
    const records = JSON.parse(localStorage.getItem('checkinRecords') || '[]')
    const wid = order.workorderId || order.id
    return records.some(r => r.workorderId === wid && r.status === '已签到')
  } catch { return false }
}

const goToCheckInFromWorkorder = (order) => {
  router.push({
    path: '/staff-checkin',
    query: {
      from: 'workorder',
      workorderId: order.workorderId || order.id,
      customerName: order.customerName || ''
    }
  })
}

const rejectWorkorderMobile = (order) => {
  rejectWorkorder(order.id, '工程师弃单')
  ElMessage.success(`已弃单: ${order.workorderId}`)
}

// 分配工程师对话框
const assignDialogVisible = ref(false)
const assignWorkorderData = ref(null)
const assignFormData = reactive({
  selectedEngineerIds: [],
  workContent: '',
  workStartTime: null,
  workEndTime: null,
  vehicle: 'self'
})

const getCategoryText = (cat) => {
  const map = { installation: '安装工单', service: '服务工单' }
  return map[cat] || cat
}
const getSubTypeText = (sub) => {
  const map = { repair: '维修', trial_processing: '试加工', refitting: '改造' }
  return map[sub] || sub
}
const getWarrantyText = (ws) => {
  const map = { in_warranty: '保内', out_of_warranty: '保外', expired: '过保', in: '保内', out: '保外', unknown: '未知' }
  return map[ws] || ws
}
const getWarrantyTagType = (ws) => {
  const map = { in_warranty: 'success', out_of_warranty: 'warning', expired: 'danger', in: 'success', out: 'danger', unknown: 'info' }
  return map[ws] || 'info'
}

const openAssignDialog = (workorder) => {
  // 从 store 获取完整工单数据
  const fullWo = workorderFlowState.workorders.find(w => w.id === (workorder.id || workorder.rawId))
  assignWorkorderData.value = fullWo || workorder
  assignFormData.selectedEngineerIds = []
  assignFormData.workContent = ''
  assignFormData.workStartTime = null
  assignFormData.workEndTime = null
  assignFormData.vehicle = 'self'
  assignDialogVisible.value = true
}

const confirmAssign = () => {
  if (assignFormData.selectedEngineerIds.length === 0) {
    ElMessage.warning('请选择工程师')
    return
  }
  const primaryEng = engineerList.find(e => e.id === assignFormData.selectedEngineerIds[0])
  if (!primaryEng) return
  const selectedEngineers = assignFormData.selectedEngineerIds.map(id => {
    const eng = engineerList.find(e => e.id === id)
    return eng ? { id: eng.id, name: eng.name, phone: eng.phone } : null
  }).filter(Boolean)

  assignWorkorder(assignWorkorderData.value.id || assignWorkorderData.value.rawId, primaryEng.id, primaryEng.name, primaryEng.phone, {
    engineers: selectedEngineers,
    workContent: assignFormData.workContent,
    workStartTime: assignFormData.workStartTime || '',
    workEndTime: assignFormData.workEndTime || '',
    vehicle: assignFormData.vehicle
  })
  ElMessage.success(`已分配给 ${primaryEng.name}${selectedEngineers.length > 1 ? ` 等${selectedEngineers.length}人` : ''}`)
  assignDialogVisible.value = false
  loadWorkorders()
}

const techLeadConfirmMobile = (order) => {
  techLeadConfirm(order.id)
  ElMessage.success(`课长已确认: ${order.workorderId}`)
}

const assistantConfirmMobile = (order) => {
  assistantConfirm(order.id)
  ElMessage.success(`业务已确认: ${order.workorderId}`)
}

const handleTodoClick = (todo) => {
  // 根据待办类型跳转到对应页面
  switch (todo.type) {
    case 'workorder':
    case 'install':
      // 跳转到工单详情，标记来源为工作台
      router.push(`/staff-workorder-detail?id=${todo.workorderId}&from=workspace`)
      break
    case 'checkin':
      // 跳转到打卡页面
      router.push('/staff-checkin')
      break
    case 'approval':
      // 跳转到审批页面
      router.push('/staff-field-checkin-list?filter=pending_approval')
      break
    default:
      // 默认跳转到工单详情，标记来源为工作台
      router.push(`/staff-workorder-detail?id=${todo.workorderId}&from=workspace`)
  }
}

// 课长专属方法
const goToTeamManagement = () => {
  router.push('/team-management')
}

const goToTeamWorkorders = () => {
  router.push('/staff-workorder-list?filter=all&scope=team')
}

const goToPendingApprovals = () => {
  router.push('/staff-field-checkin-list?filter=pending_approval')
}

const goToTeamCheckins = () => {
  router.push('/staff-field-checkin-list?filter=all&scope=team')
}

const goToTeamStatistics = () => {
  router.push('/team-statistics')
}

const goToTechLeadWorkorders = () => {
  router.push('/techlead-workorder-manage')
}

// 待处理卡片点击跳转
const handlePendingAction = (item) => {
  switch (item.pendingActionFn) {
    case 'openAssignDialog':
      openAssignDialog(item)
      break
    case 'goToWorkorderConfirm':
      router.push(`/staff-workorder-detail?id=${item.id || item.workorderId}&action=confirm`)
      break
    case 'goToAcceptList':
      router.push(`/staff-workorder-detail?id=${item.id || item.workorderId}&action=accept`)
      break
    case 'goToSignList':
      router.push(`/staff-workorder-detail?id=${item.id || item.workorderId}&action=sign`)
      break
    case 'goToAssistantConfirmList':
      router.push(`/staff-workorder-detail?id=${item.id || item.workorderId}&action=confirm`)
      break
    default:
      router.push('/staff-workorder-list')
  }
}

const viewMemberDetail = (member) => {
  router.push(`/member-detail?id=${member.id}`)
}

const openScan = () => {
  scanDialog.visible = true
  scanDialog.isScanning = false
}

const startScan = async () => {
  try {
    // 检查浏览器支持
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      ElMessage.warning('浏览器不支持摄像头功能，请使用手动输入')
      // 显示手动输入对话框
      showManualInputDialog()
      return
    }

    // 检查协议（开发环境允许 HTTP）
    const isSecureContext = window.isSecureContext || window.location.protocol === 'https:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    if (!isSecureContext) {
      ElMessage.warning('需要在 HTTPS 环境下使用摄像头，请使用手动输入')
      showManualInputDialog()
      return
    }

    // 请求摄像头权限
    scanStream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: 'environment',
        width: { ideal: 1280 },
        height: { ideal: 720 }
      }
    })

    if (videoRef.value) {
      videoRef.value.srcObject = scanStream
      scanDialog.isScanning = true

      // 模拟扫码成功（实际项目中这里应该使用二维码扫描库）
      setTimeout(() => {
        ElMessage.success('扫码成功')
        stopScan()
        scanDialog.visible = false
        // 根据扫码结果跳转
        router.push('/asset-detail?serial=SN123456')
      }, 3000)
    }
  } catch (error) {
    console.error('摄像头启动失败:', error)
    let errorMsg = '摄像头启动失败'

    // 根据错误类型显示不同的提示
    if (error.name === 'NotAllowedError') {
      errorMsg = '摄像头权限被拒绝，请在浏览器设置中允许使用摄像头，或使用手动输入'
    } else if (error.name === 'NotFoundError') {
      errorMsg = '未找到摄像头设备，请使用手动输入'
    } else if (error.name === 'NotReadableError') {
      errorMsg = '摄像头被其他应用占用，请关闭其他应用后重试'
    } else if (error.name === 'OverconstrainedError') {
      errorMsg = '摄像头不支持指定的分辨率，请使用手动输入'
    }

    ElMessage.warning(errorMsg)
    // 显示手动输入对话框
    showManualInputDialog()
  }
}

// 手动输入对话框
const manualInputDialog = reactive({
  visible: false,
  code: ''
})

const showManualInputDialog = () => {
  manualInputDialog.code = ''
  manualInputDialog.visible = true
}

const submitManualInput = () => {
  const code = manualInputDialog.code.trim()
  if (!code) {
    ElMessage.warning('请输入设备编号或工单号')
    return
  }

  // 关闭对话框
  manualInputDialog.visible = false
  scanDialog.visible = false

  // 根据输入内容判断跳转页面
  if (code.toUpperCase().startsWith('WO')) {
    // 工单号跳转到工单详情
    router.push(`/staff-workorder-detail?id=${code}`)
  } else {
    // 设备序列号跳转到设备详情
    router.push(`/asset-detail?serial=${code}`)
  }
}

const stopScan = () => {
  scanDialog.isScanning = false
  if (scanStream) {
    scanStream.getTracks().forEach(track => track.stop())
    scanStream = null
  }
  if (videoRef.value) {
    videoRef.value.srcObject = null
  }
}

const switchNav = (key) => {
  currentNav.value = key
  switch (key) {
    case 'home':
      // 已在首页
      break
    case 'workorder':
      router.push('/staff-workorder-list?filter=all')
      break
    case 'field':
      router.push('/staff-field-checkin-list')
      break
    case 'my':
      // 跳转到职员个人中心
      router.push('/staff-profile')
      break
  }
}

const getStatusType = (status) => {
  const types = {
    pending_assign: 'danger',
    pending_accept: 'info',
    processing: 'primary',
    pending_sign: 'danger',
    techlead_confirm: 'warning',
    assistant_confirm: 'warning',
    completed: 'success'
  }
  return types[status] || 'info'
}

const getStatusText = (status) => {
  const texts = {
    pending_assign: '待分配', pending_accept: '待接单', processing: '进行中',
    pending_sign: '待签字', techlead_confirm: '课长确认', assistant_confirm: '业务确认',
    completed: '已完成'
  }
  return texts[status] || status
}

const getTodoType = (type) => {
  const types = {
    service: 'warning',
    install: 'success',
    repair: 'danger'
  }
  return types[type] || 'info'
}

const getTodoLabel = (type) => {
  const labels = {
    service: '维修',
    install: '安装',
    repair: '抢修'
  }
  return labels[type] || type
}

const formatDate = (date) => {
  if (!date) return ''
  const d = new Date(date)
  return `${d.getMonth() + 1}月${d.getDate()}日`
}

// 从本地存储加载打卡记录
const loadCheckinRecords = () => {
  const records = JSON.parse(localStorage.getItem('checkinRecords') || '[]')

  // 始终使用本地存储的数据更新列表
  todayCheckinList.value = records

  // 筛选出未提交的打卡记录（已签离但未提交审批）
  unsubmittedCheckins.value = todayCheckinList.value.filter(r =>
    r.status === '已签到' && r.checkoutTime
  )

  // 筛选出待审批的打卡记录
  pendingApprovalCheckins.value = todayCheckinList.value.filter(r =>
    r.status === '已提交'
  )
}

// 监听打卡更新事件
const handleCheckinUpdate = () => {
  loadCheckinRecords()
}

// 处理工单更新事件
const handleWorkorderUpdate = (event) => {
  console.log('StaffMobileWorkspace 收到工单更新:', event.detail)
  loadWorkorders()
}

onMounted(() => {
  // 加载用户信息
  loadUserInfo()

  // 加载打卡记录
  loadCheckinRecords()

  // 加载工单数据
  loadWorkorders()

  // 恢复上次离开时的Tab状态
  const savedTab = sessionStorage.getItem('workspace_activeTab')
  if (savedTab) {
    activeTab.value = savedTab
  }

  // 监听打卡更新事件
  window.addEventListener('checkin-updated', handleCheckinUpdate)
  
  // 监听工单更新事件
  window.addEventListener('workorder-flow-updated', handleWorkorderUpdate)

  // 监听用户信息更新事件（当顶部切换角色时）
  window.addEventListener('user-info-updated', loadUserInfo)

  // 监听页面可见性变化，当页面重新可见时刷新数据
  document.addEventListener('visibilitychange', handleVisibilityChange)

  // 监听页面重新获得焦点事件（从其他页面返回时）
  window.addEventListener('focus', handleWindowFocus)
})

onUnmounted(() => {
  // 移除事件监听
  window.removeEventListener('checkin-updated', handleCheckinUpdate)
  window.removeEventListener('workorder-flow-updated', handleWorkorderUpdate)
  window.removeEventListener('user-info-updated', loadUserInfo)
  document.removeEventListener('visibilitychange', handleVisibilityChange)
  window.removeEventListener('focus', handleWindowFocus)
})

// 处理页面可见性变化
const handleVisibilityChange = () => {
  if (document.visibilityState === 'visible') {
    // 页面重新可见时刷新打卡记录
    loadCheckinRecords()
  }
}

// 处理窗口获得焦点
const handleWindowFocus = () => {
  // 窗口获得焦点时刷新打卡记录
  loadCheckinRecords()
}
</script>

<style scoped>
.staff-mobile-workspace {
  min-height: 100vh;
  background: #f5f7fa;
  padding-bottom: 70px;
  width: 100vw;
  max-width: 100%;
  overflow-x: hidden;
  overflow-y: auto;
  box-sizing: border-box;
}

/* 顶部用户信息 */
.header-section {
  background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: white;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-details h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 500;
}

.user-details p {
  margin: 4px 0 0;
  font-size: 14px;
  opacity: 0.9;
}

.header-actions .el-button {
  color: white;
  border-color: rgba(255,255,255,0.3);
}

/* 课长：团队概览区域 */
.manager-stats-section {
  margin: -20px 15px 15px;
  background: white;
  border-radius: 12px;
  padding: 15px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.manager-stats-section .section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 500;
  color: #262626;
  margin-bottom: 15px;
}

.manager-stats-section .section-title .el-icon {
  color: #1890ff;
  font-size: 18px;
}

/* 统计区域 */
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
  gap: 6px;
  cursor: pointer;
  padding: 10px 5px;
  border-radius: 8px;
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
  font-size: 13px;
  color: #595959;
}

/* 课长：团队成员区域 */
.team-section {
  margin: 0 15px 15px;
  background: white;
  border-radius: 12px;
  padding: 15px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.team-section .section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.team-section .section-header h4 {
  margin: 0;
  font-size: 15px;
  font-weight: 500;
  color: #262626;
}

.team-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.team-member {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s;
}

.team-member:active {
  background: #e8e8e8;
}

.member-avatar {
  position: relative;
}

.member-status {
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 10px;
  height: 10px;
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
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.member-name {
  font-size: 15px;
  font-weight: 500;
  color: #262626;
}

.member-stats {
  font-size: 12px;
  color: #8c8c8c;
}

.member-arrow {
  color: #bfbfbf;
  font-size: 16px;
}

/* 快捷功能入口 */
.quick-actions {
  padding: 0 15px 15px;
}

.action-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.action-item {
  background: white;
  border-radius: 12px;
  padding: 20px 15px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  cursor: pointer;
  transition: all 0.3s;
  position: relative;
}

.action-item:active {
  transform: scale(0.98);
}

.action-icon {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 12px;
  font-size: 28px;
  position: relative;
}

.action-grid.manager-grid {
  grid-template-columns: repeat(3, 1fr);
}

.action-item.scan .action-icon {
  background: #e6f7ff;
  color: #1890ff;
}

.action-item.workorder .action-icon {
  background: #f6ffed;
  color: #52c41a;
}

.action-item.field .action-icon {
  background: #fff2e8;
  color: #fa8c16;
}

/* 课长专属功能按钮 */
.action-item.team .action-icon {
  background: #f0f5ff;
  color: #2f54eb;
}

.action-item.approval .action-icon {
  background: #fff7e6;
  color: #fa8c16;
}

.action-item.statistics .action-icon {
  background: #e6fffb;
  color: #13c2c2;
}

.action-item.sign .action-icon {
  background: #fff1f0;
  color: #f5222d;
}

.action-label {
  display: block;
  font-size: 16px;
  font-weight: 500;
  color: #262626;
  margin-bottom: 4px;
}

.action-desc {
  display: block;
  font-size: 12px;
  color: #8c8c8c;
}

.action-badge {
  position: absolute;
  top: -5px;
  right: -5px;
}

/* 打卡提醒区域 */
.checkin-alert-section {
  padding: 0 15px 15px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* 超时提醒区域 */
.timeout-alert-section {
  padding: 15px 15px 0;
}

.alert-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 15px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s;
}

.alert-card:active {
  transform: scale(0.98);
}

.alert-card.alert-warning {
  background: linear-gradient(135deg, #fff7e6 0%, #fff1f0 100%);
  border: 1px solid #ffbb96;
}

.alert-card.alert-info {
  background: linear-gradient(135deg, #e6f7ff 0%, #f0f5ff 100%);
  border: 1px solid #91d5ff;
}

.alert-card.alert-danger {
  background: linear-gradient(135deg, #fff1f0 0%, #fff2f0 100%);
  border: 1px solid #ffa39e;
}

.alert-icon {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  flex-shrink: 0;
}

.alert-warning .alert-icon {
  background: #fa8c16;
  color: white;
}

.alert-info .alert-icon {
  background: #1890ff;
  color: white;
}

.alert-danger .alert-icon {
  background: #ff4d4f;
  color: white;
}

.alert-content {
  flex: 1;
  min-width: 0;
}

.alert-title {
  font-size: 15px;
  font-weight: 500;
  color: #262626;
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.alert-time {
  font-size: 12px;
  color: #8c8c8c;
  font-weight: normal;
}

.alert-badge {
  font-size: 11px;
  color: #1890ff;
  background: #e6f7ff;
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: normal;
}

.alert-desc {
  font-size: 13px;
  color: #8c8c8c;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.alert-action {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.alert-action .arrow {
  color: #bfbfbf;
  font-size: 16px;
}

/* 今日待办 */
.todo-section {
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

.section-header h4 {
  margin: 0;
  font-size: 16px;
  color: #262626;
}

.todo-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.todo-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 15px;
  background: #f5f7fa;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s;
}

.todo-item:active {
  background: #e8e8e8;
}

.todo-time {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  min-width: 60px;
}

.todo-time .time {
  font-size: 18px;
  font-weight: 600;
  color: #1890ff;
}

.todo-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.todo-title {
  font-size: 15px;
  color: #262626;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.todo-address {
  font-size: 13px;
  color: #8c8c8c;
  display: flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 工单区域 */
.workorder-section {
  margin: 0 15px 15px;
  background: white;
  border-radius: 12px;
  padding: 15px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.workorder-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.workorder-card {
  padding: 15px;
  background: #f5f7fa;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s;
}

.workorder-card:active {
  background: #e8e8e8;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.order-no {
  font-size: 15px;
  font-weight: 500;
  color: #1890ff;
}

.card-body {
  margin-bottom: 10px;
}

.device-info,
.customer-info {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: #595959;
  margin-bottom: 6px;
}

.order-desc {
  font-size: 14px;
  color: #262626;
  margin: 8px 0;
  line-height: 1.5;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.order-time {
  font-size: 13px;
  color: #8c8c8c;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #bfbfbf;
}

.empty-state .el-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.empty-state p {
  margin: 0;
  font-size: 14px;
}

/* 底部导航 */
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
  padding: 4px 20px;
  cursor: pointer;
  color: #8c8c8c;
  transition: all 0.3s;
}

.nav-item .el-icon {
  font-size: 24px;
}

.nav-item span {
  font-size: 12px;
}

.nav-item.active {
  color: #1890ff;
}

/* 扫码对话框 */
.scan-container {
  text-align: center;
}

.scan-area {
  padding: 20px;
  position: relative;
}

.scan-video {
  width: 250px;
  height: 250px;
  object-fit: cover;
  border-radius: 8px;
  margin-bottom: 15px;
}

.scan-start {
  padding: 30px 20px;
}

.scan-icon {
  width: 80px;
  height: 80px;
  background: #e6f7ff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 15px;
  font-size: 40px;
  color: #1890ff;
}

.scan-icon.unavailable {
  background: #f5f5f5;
  color: #bfbfbf;
}

.scan-unavailable {
  padding: 30px 20px;
  text-align: center;
}

.scan-reason {
  font-size: 13px;
  color: #8c8c8c;
  margin: 8px 0 0;
}

.scan-frame {
  width: 250px;
  height: 250px;
  margin: 0 auto 20px;
  position: relative;
  border: 2px solid #1890ff;
  border-radius: 8px;
}

.corner {
  position: absolute;
  width: 20px;
  height: 20px;
  border-color: #1890ff;
  border-style: solid;
}

.corner.top-left {
  top: -2px;
  left: -2px;
  border-width: 4px 0 0 4px;
}

.corner.top-right {
  top: -2px;
  right: -2px;
  border-width: 4px 4px 0 0;
}

.corner.bottom-left {
  bottom: -2px;
  left: -2px;
  border-width: 0 0 4px 4px;
}

.corner.bottom-right {
  bottom: -2px;
  right: -2px;
  border-width: 0 4px 4px 0;
}

.scan-line {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent, #1890ff, transparent);
  animation: scan 2s linear infinite;
}

@keyframes scan {
  0% { top: 0; }
  50% { top: 100%; }
  100% { top: 0; }
}

.scan-tip {
  color: #8c8c8c;
  font-size: 14px;
}

/* 扫码全屏页面 */
.scan-fullscreen-page {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: #f5f7fa;
  z-index: 1000;
  display: flex;
  flex-direction: column;
}

.scan-header {
  background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
  padding: 15px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: white;
  flex-shrink: 0;
}

.scan-header .el-button {
  color: white;
  font-size: 14px;
}

.scan-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 20px;
  overflow-y: auto;
}

/* 手动输入表单 */
.manual-input-form {
  padding: 20px 10px;
}

.manual-input-form .input-tip {
  font-size: 14px;
  color: #8c8c8c;
  margin-bottom: 15px;
  text-align: center;
}

/* 手机端小屏幕适配 */
@media (max-width: 375px) {
  .header-section {
    padding: 15px;
  }
  
  .user-details h3 {
    font-size: 16px;
  }
  
  .stats-grid {
    gap: 5px;
  }
  
  .stat-number {
    font-size: 20px;
  }
  
  .action-grid {
    gap: 8px;
  }
  
  .action-item {
    padding: 15px 10px;
  }
  
  .action-icon {
    width: 48px;
    height: 48px;
    font-size: 24px;
  }
}

/* 响应式适配 - 平板及以上 */
@media (min-width: 768px) {
  .staff-mobile-workspace {
    max-width: 414px;
    margin: 0 auto;
    border-left: 1px solid #e8e8e8;
    border-right: 1px solid #e8e8e8;
  }
  
  .bottom-nav {
    max-width: 414px;
    left: 50%;
    transform: translateX(-50%);
  }
}

/* 待处理工单区域 */
.pending-section {
  margin: 0 15px 15px;
  background: white;
  border-radius: 12px;
  padding: 15px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.pending-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 15px;
  background: linear-gradient(135deg, #fff1f0 0%, #fff7e6 100%);
  border: 1px solid #ffbb96;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s;
  margin-bottom: 10px;
}

.pending-card:last-child {
  margin-bottom: 0;
}

.pending-card:active {
  transform: scale(0.98);
}

.pending-icon {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: #ff4d4f;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  flex-shrink: 0;
}

.pending-content {
  flex: 1;
  min-width: 0;
}

.pending-title {
  font-size: 15px;
  font-weight: 500;
  color: #262626;
  margin-bottom: 4px;
}

.pending-desc {
  font-size: 13px;
  color: #8c8c8c;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.pending-action {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.pending-action .arrow {
  color: #bfbfbf;
  font-size: 16px;
}

/* 报价单待审核卡片样式 */
.pending-card.quotation-card {
  background: linear-gradient(135deg, #fff7e6 0%, #fffbe6 100%);
  border: 1px solid #ffd591;
}

.pending-card.quotation-card .pending-icon.quotation-icon {
  background: #faad14;
}

/* 工单分类标签 */
.workorder-tabs {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
  overflow-x: auto;
  padding-bottom: 5px;
}

.tab-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: #f5f5f5;
  border-radius: 20px;
  font-size: 14px;
  color: #595959;
  cursor: pointer;
  transition: all 0.3s;
  white-space: nowrap;
  flex-shrink: 0;
}

.tab-item.active {
  background: #1890ff;
  color: white;
}

.tab-badge {
  margin-left: 2px;
}

.tab-badge :deep(.el-badge__content) {
  font-size: 11px;
  height: 18px;
  line-height: 18px;
  padding: 0 6px;
}

/* 分配工程师对话框 */
.assign-mobile-dialog .assign-dialog-content {
  max-height: calc(100vh - 140px);
  overflow-y: auto;
}
.assign-info-section {
  background: #f5f7fa;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 12px;
}
.assign-section-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 10px;
  padding-left: 8px;
  border-left: 3px solid #409eff;
}
.assign-info-row {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 13px;
  margin-bottom: 6px;
}
.assign-info-row .label {
  color: #909399;
  white-space: nowrap;
  min-width: 56px;
  flex-shrink: 0;
}
.assign-info-row .value {
  color: #303133;
  word-break: break-all;
}
.assign-info-pair {
  display: flex;
  gap: 16px;
  margin-bottom: 6px;
}
.assign-info-pair .assign-info-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  flex: 1;
}
.assign-info-pair .assign-info-item .label {
  color: #909399;
  white-space: nowrap;
  min-width: 50px;
}
.assign-info-pair .assign-info-item .value {
  color: #303133;
  word-break: break-all;
}
.assign-info-desc {
  margin-top: 8px;
  font-size: 13px;
}
.assign-info-desc .label {
  color: #909399;
  display: block;
  margin-bottom: 4px;
}
.assign-info-desc .value {
  color: #303133;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-all;
}
</style>
