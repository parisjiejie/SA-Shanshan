<template>
  <div class="staff-field-checkin-list">
    <!-- 顶部导航 -->
    <div class="list-header">
      <el-button link @click="goBack">
        <el-icon><ArrowLeft /></el-icon>
        <span>返回</span>
      </el-button>
      <span class="header-title">外勤打卡</span>
      <span class="placeholder"></span>
    </div>

    <!-- 视图模式切换 -->
    <div class="view-mode-section">
      <div class="view-mode-tabs">
        <div 
          class="view-mode-tab" 
          :class="{ active: viewMode === 'today' }"
          @click="viewMode = 'today'"
        >今日</div>
        <div 
          class="view-mode-tab" 
          :class="{ active: viewMode === 'history' }"
          @click="viewMode = 'history'"
        >历史</div>
      </div>
    </div>

    <!-- 日期选择（今日模式） -->
    <div class="date-section" v-if="viewMode === 'today'">
      <div class="date-picker">
        <el-button link @click="changeDate(-1)">
          <el-icon><ArrowLeft /></el-icon>
        </el-button>
        <span class="current-date">{{ formatDate(currentDate) }}</span>
        <el-button link @click="changeDate(1)" :disabled="isToday">
          <el-icon><ArrowRight /></el-icon>
        </el-button>
      </div>
      <el-tag v-if="isToday" type="success" size="small">今天</el-tag>
    </div>

    <!-- 月选择（历史模式） -->
    <div class="date-section" v-if="viewMode === 'history'">
      <div class="date-picker">
        <el-button link @click="changeMonth(-1)">
          <el-icon><ArrowLeft /></el-icon>
        </el-button>
        <span class="current-date">{{ formatMonth(currentMonth) }}</span>
        <el-button link @click="changeMonth(1)">
          <el-icon><ArrowRight /></el-icon>
        </el-button>
      </div>
    </div>

    <!-- 状态筛选标签 -->
    <div class="filter-section">
      <div class="filter-tabs">
        <div 
          v-for="tab in filterTabs" 
          :key="tab.key"
          class="filter-tab"
          :class="{ active: currentFilter === tab.key }"
          @click="setFilter(tab.key)"
        >
          <span class="tab-name">{{ tab.name }}</span>
          <span v-if="tab.count > 0" class="tab-badge" :class="tab.badgeType">{{ tab.count }}</span>
        </div>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-cards">
      <div class="stat-card">
        <div class="stat-number">{{ filteredCheckinList.length }}</div>
        <div class="stat-label">{{ viewMode === 'today' ? '打卡次数' : '月记录' }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">{{ filteredCheckinList.filter(i => i.status === '已签到').length }}</div>
        <div class="stat-label">已签到</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">{{ filteredCheckinList.filter(i => i.checkoutTime || i.status === '已提交' || i.status === '已通过').length }}</div>
        <div class="stat-label">已签离</div>
      </div>
    </div>

    <!-- 打卡列表 -->
    <div class="checkin-list">
      <div
        v-for="item in filteredCheckinList"
        :key="item.id"
        class="checkin-card"
        :class="{ 
          'in-progress': item.status === '已签到' && !item.checkoutTime,
          'unsubmitted': item.status === '已签到' && item.checkoutTime,
          'pending-approval': item.status === '已提交'
        }"
        @click="openDetail(item)"
      >
        <div class="card-header">
          <div class="type-info">
            <el-tag :type="item.type === 'workorder' ? 'primary' : 'success'" size="small">{{ item.type === 'workorder' ? '工单打卡' : '日常打卡' }}</el-tag>
            <span class="checkin-time">{{ item.checkinTime }}</span>
          </div>
          <el-tag :type="getStatusType(item.status)" size="small">{{ item.status }}</el-tag>
        </div>
        
        <div class="card-body">
          <div class="info-row" v-if="item.customerName">
            <el-icon><OfficeBuilding /></el-icon>
            <span class="customer-name">{{ item.customerName }}</span>
          </div>
          <div class="info-row" v-if="item.workorderId">
            <el-icon><Document /></el-icon>
            <span class="workorder-id">{{ item.workorderId }}</span>
          </div>
          <div class="info-row">
            <el-icon><Location /></el-icon>
            <span class="location">{{ item.location }}</span>
          </div>
        </div>

        <div class="card-footer">
          <span class="view-detail-hint">点击查看详情</span>
          <template v-if="item.status === '已签到'">
            <el-button size="small" type="warning" @click.stop="handleCheckOut(item)">{{ item.checkoutTime ? '再次签离' : '签离' }}</el-button>
            <el-button v-if="item.checkoutTime" size="small" type="success" @click.stop="handleSubmitApproval(item)">提交审批</el-button>
          </template>
          <template v-else-if="item.status === '已提交'">
            <el-button v-if="isApprover" size="small" type="primary" @click.stop="handleApprove(item)">审批</el-button>
            <el-tag v-else type="info" size="small">待审批</el-tag>
          </template>
          <el-tag v-else-if="item.status === '已通过'" type="success" size="small">已通过</el-tag>
        </div>
      </div>

      <!-- 空状态 -->
      <div class="empty-state" v-if="checkinList.length === 0">
        <el-icon><Calendar /></el-icon>
        <p>当日暂无打卡记录</p>
        <p class="sub-text">点击下方按钮开始打卡</p>
      </div>
    </div>

    <!-- 打卡按钮 -->
    <div class="checkin-button" @click="goToCheckIn" v-if="isToday && viewMode === 'today'">
      <div class="button-content">
        <el-icon><Location /></el-icon>
        <span>打卡签到</span>
      </div>
    </div>

    <!-- 打卡详情 Drawer -->
    <el-drawer v-model="detailDrawer.visible" direction="btt" size="85%" :show-close="false">
      <template #header>
        <span class="drawer-title">打卡详情</span>
      </template>
      <div class="detail-content" v-if="detailDrawer.data">
        <!-- 打卡基本信息 -->
        <div class="detail-section">
          <h5 class="section-title">打卡信息</h5>
          <div class="detail-grid">
            <div class="detail-item"><span class="detail-label">打卡类型</span><el-tag :type="detailDrawer.data.type === 'workorder' ? 'primary' : 'success'" size="small">{{ detailDrawer.data.type === 'workorder' ? '工单打卡' : '日常打卡' }}</el-tag></div>
            <div class="detail-item"><span class="detail-label">状态</span><el-tag :type="getStatusType(detailDrawer.data.status)" size="small">{{ detailDrawer.data.status }}</el-tag></div>
            <div class="detail-item"><span class="detail-label">工程师</span><span class="detail-value">{{ detailDrawer.data.engineerName || '-' }}</span></div>
            <div class="detail-item"><span class="detail-label">客户名称</span><span class="detail-value">{{ detailDrawer.data.customerName || '-' }}</span></div>
          </div>
        </div>

        <!-- 签到/签离时间线 -->
        <div class="detail-section">
          <h5 class="section-title">时间信息</h5>
          <div class="detail-grid">
            <div class="detail-item"><span class="detail-label">签到时间</span><span class="detail-value highlight">{{ detailDrawer.data.checkinTime || '-' }}</span></div>
            <div class="detail-item"><span class="detail-label">签到地点</span><span class="detail-value">{{ detailDrawer.data.location || '-' }}</span></div>
          </div>
          <!-- 多次签离记录 -->
          <div v-if="detailDrawer.data.checkoutRecords && detailDrawer.data.checkoutRecords.length > 0" style="margin-top: 10px;">
            <div v-for="(record, idx) in detailDrawer.data.checkoutRecords" :key="idx" class="detail-grid" style="margin-bottom: 6px; padding: 6px 0; border-top: 1px dashed #ebeef5;">
              <div class="detail-item"><span class="detail-label">签离时间{{ detailDrawer.data.checkoutRecords.length > 1 ? `(${idx + 1})` : '' }}</span><span class="detail-value">{{ record.checkoutTime }}</span></div>
              <div class="detail-item"><span class="detail-label">签离地点{{ detailDrawer.data.checkoutRecords.length > 1 ? `(${idx + 1})` : '' }}</span><span class="detail-value">{{ record.checkOutLocation || '-' }}</span></div>
            </div>
          </div>
          <div v-else class="detail-grid">
            <div class="detail-item"><span class="detail-label">签离时间</span><span class="detail-value" :class="{ missing: !detailDrawer.data.checkoutTime }">{{ detailDrawer.data.checkoutTime || '未签离' }}</span></div>
            <div class="detail-item"><span class="detail-label">签离地点</span><span class="detail-value">{{ detailDrawer.data.checkOutLocation || '-' }}</span></div>
          </div>
        </div>

        <!-- 签离日报（已签离后显示） -->
        <div class="detail-section" v-if="detailDrawer.data.checkoutTime">
          <h5 class="section-title">签离日报</h5>
          <div class="detail-grid">
            <div class="detail-item" v-if="detailDrawer.data.departTime"><span class="detail-label">出发时间</span><span class="detail-value">{{ detailDrawer.data.departTime }}</span></div>
            <div class="detail-item" v-if="detailDrawer.data.workStartTime"><span class="detail-label">作业开始</span><span class="detail-value">{{ detailDrawer.data.workStartTime }}</span></div>
            <div class="detail-item" v-if="detailDrawer.data.returnTime"><span class="detail-label">返程时间</span><span class="detail-value">{{ detailDrawer.data.returnTime }}</span></div>
            <div class="detail-item" v-if="detailDrawer.data.workEndTime"><span class="detail-label">作业结束</span><span class="detail-value">{{ detailDrawer.data.workEndTime }}</span></div>
            <div class="detail-item" v-if="detailDrawer.data.coworker"><span class="detail-label">共同作业</span><span class="detail-value">{{ detailDrawer.data.coworker }}</span></div>
            <div class="detail-item" v-if="detailDrawer.data.deviceStopped !== null && detailDrawer.data.deviceStopped !== undefined">
              <span class="detail-label">设备停机</span>
              <span class="detail-value" :class="{ 'text-danger': detailDrawer.data.deviceStopped }">{{ detailDrawer.data.deviceStopped ? '是' : '否' }}</span>
            </div>
            <div class="detail-item full" v-if="detailDrawer.data.workContent"><span class="detail-label">作业内容</span><span class="detail-value">{{ detailDrawer.data.workContent }}</span></div>
            <div class="detail-item full" v-if="detailDrawer.data.faultAnalysis"><span class="detail-label">故障分析</span><span class="detail-value">{{ detailDrawer.data.faultAnalysis }}</span></div>
            <div class="detail-item" v-if="detailDrawer.data.bizFollowUps && detailDrawer.data.bizFollowUps.length">
              <span class="detail-label">业务跟进</span>
              <span class="detail-value">{{ detailDrawer.data.bizFollowUps.map(b => ({ quotation: '零部件报价', password: '密码申请', free_service: '无偿服务申请', other: '其他' }[b])).join('、') }}</span>
            </div>
            <div class="detail-item full" v-if="detailDrawer.data.pendingIssues"><span class="detail-label">遗留事项</span><span class="detail-value">{{ detailDrawer.data.pendingIssues }}</span></div>
            <div class="detail-item" v-if="detailDrawer.data.taskCompleted !== null && detailDrawer.data.taskCompleted !== undefined">
              <span class="detail-label">任务完成</span>
              <span class="detail-value" :class="{ 'text-danger': !detailDrawer.data.taskCompleted }">{{ detailDrawer.data.taskCompleted ? '是' : '否' }}</span>
            </div>
            <div class="detail-item full" v-if="!detailDrawer.data.taskCompleted && detailDrawer.data.incompleteReason">
              <span class="detail-label">未完成原因</span><span class="detail-value">{{ detailDrawer.data.incompleteReason }}</span>
            </div>
          </div>
        </div>

        <!-- 现场照片 -->
        <div class="detail-section" v-if="detailDrawer.data.photos && detailDrawer.data.photos.length > 0">
          <h5 class="section-title">现场照片</h5>
          <div class="photo-list-detail">
            <img v-for="(photo, index) in detailDrawer.data.photos" :key="index" :src="photo" class="photo-thumb-lg" @click="previewPhoto(photo)" />
          </div>
        </div>

        <!-- 关联工单（工单打卡时显示） -->
        <div class="detail-section" v-if="detailDrawer.data.workorderId && detailWorkorder">
          <h5 class="section-title">关联工单</h5>
          <div class="related-workorder" @click="goToWorkorderDetail(detailWorkorder)">
            <div class="detail-grid">
              <div class="detail-item"><span class="detail-label">工单号</span><span class="detail-value workorder-link">{{ detailWorkorder.workorderId || detailWorkorder.id }}</span></div>
              <div class="detail-item"><span class="detail-label">工单状态</span><el-tag :type="getStatusType(detailWorkorder.status === 'processing' ? '' : 'info')" size="small">{{ getWorkorderStatusText(detailWorkorder.status) }}</el-tag></div>
              <div class="detail-item"><span class="detail-label">客户名称</span><span class="detail-value">{{ detailWorkorder.customerName || '-' }}</span></div>
              <div class="detail-item"><span class="detail-label">设备型号</span><span class="detail-value">{{ detailWorkorder.deviceModel || '-' }}</span></div>
              <div class="detail-item"><span class="detail-label">序列号</span><span class="detail-value">{{ detailWorkorder.serialNumber || '-' }}</span></div>
              <div class="detail-item"><span class="detail-label">保修状态</span><span class="detail-value">{{ { in_warranty: '保内', out_warranty: '保外', unknown: '未知' }[detailWorkorder.warrantyStatus] || '-' }}</span></div>
              <div class="detail-item full" v-if="detailWorkorder.faultDescription"><span class="detail-label">故障描述</span><span class="detail-value">{{ detailWorkorder.faultDescription }}</span></div>
              <div class="detail-item full" v-if="detailWorkorder.address"><span class="detail-label">客户地址</span><span class="detail-value">{{ detailWorkorder.address }}</span></div>
            </div>
            <div class="workorder-jump-hint">点击查看工单详情 →</div>
          </div>
        </div>
        <div class="detail-section" v-else-if="detailDrawer.data.workorderId && !detailWorkorder">
          <h5 class="section-title">关联工单</h5>
          <div class="detail-grid">
            <div class="detail-item"><span class="detail-label">工单号</span><span class="detail-value">{{ detailDrawer.data.workorderId }}</span></div>
            <div class="detail-item"><span class="detail-label">设备型号</span><span class="detail-value">{{ detailDrawer.data.deviceModel || '-' }}</span></div>
          </div>
        </div>

        <!-- 底部操作按钮 -->
        <div class="detail-actions">
          <template v-if="detailDrawer.data.status === '已签到'">
            <el-button type="warning" size="large" round block @click="handleCheckOut(detailDrawer.data); detailDrawer.visible = false">{{ detailDrawer.data.checkoutTime ? '再次签离' : '签离' }}</el-button>
            <el-button v-if="detailDrawer.data.checkoutTime" type="success" size="large" round block @click="handleSubmitApproval(detailDrawer.data); detailDrawer.visible = false" style="margin-top:8px">提交审批</el-button>
          </template>
          <template v-else-if="detailDrawer.data.status === '已提交'">
            <el-button v-if="isApprover" type="primary" size="large" round block @click="handleApprove(detailDrawer.data); detailDrawer.visible = false">审批</el-button>
            <el-tag v-else type="info" size="large">待审批</el-tag>
          </template>
          <el-tag v-else-if="detailDrawer.data.status === '已通过'" type="success" size="large">已通过</el-tag>
        </div>
      </div>
    </el-drawer>

    <!-- 签离对话框（轻量化：只保留时间+定位） -->
    <el-dialog
      v-model="checkOutDialog.visible"
      title="签离"
      width="95%"
      :show-close="false"
      class="mobile-dialog"
    >
      <div class="checkout-form">
        <div class="form-item">
          <label class="form-label">签到时间</label>
          <div class="info-value">{{ checkOutDialog.data?.checkinTime }}</div>
        </div>
        <div class="form-item">
          <label class="form-label">签离时间（自动）</label>
          <div class="info-value">{{ checkOutDialog.checkoutTime }}</div>
        </div>
        <div class="form-item">
          <label class="form-label">签离地点</label>
          <div class="location-display">
            <el-icon><Location /></el-icon>
            <span>{{ checkOutDialog.form.location || '获取中...' }}</span>
            <el-button link @click="refreshCheckOutLocation"><el-icon><Refresh /></el-icon></el-button>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="checkOutDialog.visible = false">取消</el-button>
        <el-button type="primary" @click="submitCheckOut">确认签离</el-button>
      </template>
    </el-dialog>

    <!-- 提交审批对话框（包含日报字段） -->
    <el-dialog
      v-model="approvalSubmitDialog.visible"
      title="提交审批 & 填写日报"
      width="95%"
      :show-close="false"
      class="mobile-dialog"
    >
      <div class="checkout-form">
        <!-- 签到/签离信息摘要 -->
        <div class="form-item">
          <label class="form-label">签到时间</label>
          <div class="info-value">{{ approvalSubmitDialog.data?.checkinTime }}</div>
        </div>
        <div class="form-item" v-if="approvalSubmitDialog.data?.checkoutTime">
          <label class="form-label">签离时间</label>
          <div class="info-value">{{ approvalSubmitDialog.data.checkoutTime }}</div>
        </div>

        <!-- 工单打卡：完整日报 -->
        <template v-if="approvalSubmitDialog.data?.type === 'workorder'">
          <div class="divider"><span>日报信息</span></div>
          <div class="form-item">
            <label class="form-label">公司/驻地出发时间 <span class="required">*</span></label>
            <el-date-picker v-model="approvalSubmitDialog.form.departTime" type="datetime" format="YYYY-MM-DD HH:mm" value-format="YYYY-MM-DD HH:mm" placeholder="选择日期时间" style="width: 100%" />
          </div>
          <div class="form-item">
            <label class="form-label">现场作业开始时间 <span class="required">*</span></label>
            <el-date-picker v-model="approvalSubmitDialog.form.workStartTime" type="datetime" format="YYYY-MM-DD HH:mm" value-format="YYYY-MM-DD HH:mm" placeholder="选择日期时间" style="width: 100%" />
          </div>
          <div class="form-item">
            <label class="form-label">返程/抵达酒店时间 <span class="required">*</span></label>
            <el-date-picker v-model="approvalSubmitDialog.form.returnTime" type="datetime" format="YYYY-MM-DD HH:mm" value-format="YYYY-MM-DD HH:mm" placeholder="选择日期时间" style="width: 100%" />
          </div>
          <div class="form-item">
            <label class="form-label">现场作业结束时间 <span class="required">*</span></label>
            <el-date-picker v-model="approvalSubmitDialog.form.workEndTime" type="datetime" format="YYYY-MM-DD HH:mm" value-format="YYYY-MM-DD HH:mm" placeholder="选择日期时间" style="width: 100%" />
          </div>
          <div class="form-item">
            <label class="form-label">共同作业人员</label>
            <div class="coworker-select">
              <el-tag
                v-for="name in coworkerOptions"
                :key="name"
                class="coworker-tag"
                :effect="approvalSubmitDialog.form.coworker === name ? 'dark' : 'plain'"
                :type="approvalSubmitDialog.form.coworker === name ? 'primary' : 'info'"
                @click="approvalSubmitDialog.form.coworker = approvalSubmitDialog.form.coworker === name ? '' : name"
              >{{ name }}</el-tag>
            </div>
          </div>
          <div class="form-item">
            <label class="form-label">客户设备是否停机？ <span class="required">*</span></label>
            <el-radio-group v-model="approvalSubmitDialog.form.deviceStopped">
              <el-radio :value="true">是</el-radio>
              <el-radio :value="false">否</el-radio>
            </el-radio-group>
          </div>
          <div class="form-item">
            <label class="form-label">当日具体作业内容 <span class="required">*</span></label>
            <el-input v-model="approvalSubmitDialog.form.workContent" type="textarea" :rows="4" placeholder="当日具体作业内容" maxlength="500" show-word-limit />
          </div>
          <div class="form-item">
            <label class="form-label">业务跟进</label>
            <div class="followup-options">
              <el-checkbox v-model="approvalSubmitDialog.form.bizFollowUps" label="quotation">零部件报价</el-checkbox>
              <el-checkbox v-model="approvalSubmitDialog.form.bizFollowUps" label="password">密码申请</el-checkbox>
              <el-checkbox v-model="approvalSubmitDialog.form.bizFollowUps" label="free_service">无偿服务申请</el-checkbox>
              <el-checkbox v-model="approvalSubmitDialog.form.bizFollowUps" label="other">其他</el-checkbox>
            </div>
          </div>
          <div class="form-item">
            <label class="form-label">作业遗留事项</label>
            <el-input v-model="approvalSubmitDialog.form.pendingIssues" type="textarea" :rows="2" placeholder="无则填「无」" maxlength="300" show-word-limit />
          </div>
        </template>

        <!-- 日常打卡：简化日报 -->
        <template v-else>
          <div class="divider"><span>日报信息</span></div>
          <div class="form-item">
            <label class="form-label">共同作业人员</label>
            <div class="coworker-select">
              <el-tag
                v-for="name in coworkerOptions"
                :key="name"
                class="coworker-tag"
                :effect="approvalSubmitDialog.form.coworker === name ? 'dark' : 'plain'"
                :type="approvalSubmitDialog.form.coworker === name ? 'primary' : 'info'"
                @click="approvalSubmitDialog.form.coworker = approvalSubmitDialog.form.coworker === name ? '' : name"
              >{{ name }}</el-tag>
            </div>
          </div>
          <div class="form-item">
            <label class="form-label">当天具体作业内容 <span class="required">*</span></label>
            <div class="quick-tags" style="margin-bottom: 8px;">
              <el-tag class="quick-tag" effect="plain" @click="appendWorkContent('拜访')">拜访</el-tag>
              <el-tag class="quick-tag" effect="plain" @click="appendWorkContent('商谈')">商谈</el-tag>
            </div>
            <el-input v-model="approvalSubmitDialog.form.workContent" type="textarea" :rows="3" placeholder="请输入当天作业内容，也可点击上方快捷标签" maxlength="500" show-word-limit />
          </div>
          <div class="form-item">
            <label class="form-label">业务跟进</label>
            <div class="followup-options">
              <el-checkbox v-model="approvalSubmitDialog.form.bizFollowUps" label="quotation">零部件报价</el-checkbox>
              <el-checkbox v-model="approvalSubmitDialog.form.bizFollowUps" label="password">密码申请</el-checkbox>
              <el-checkbox v-model="approvalSubmitDialog.form.bizFollowUps" label="free_service">无偿服务申请</el-checkbox>
              <el-checkbox v-model="approvalSubmitDialog.form.bizFollowUps" label="other">其他</el-checkbox>
            </div>
          </div>
        </template>

        <div class="form-item">
          <label class="form-label">本次任务是否完成？ <span class="required">*</span></label>
          <el-radio-group v-model="approvalSubmitDialog.form.taskCompleted">
            <el-radio :value="true">是</el-radio>
            <el-radio :value="false">否</el-radio>
          </el-radio-group>
        </div>
        <div class="form-item" v-if="approvalSubmitDialog.form.taskCompleted === false">
          <label class="form-label">未完成原因 <span class="required">*</span></label>
          <el-input v-model="approvalSubmitDialog.form.incompleteReason" type="textarea" :rows="2" placeholder="请填写未完成原因" />
        </div>
      </div>
      <template #footer>
        <el-button @click="approvalSubmitDialog.visible = false">取消</el-button>
        <el-button type="primary" @click="submitApprovalWithReport" :disabled="!canSubmitApproval">确认提交审批</el-button>
      </template>
    </el-dialog>

    <!-- 审批对话框 -->
    <el-dialog
      v-model="approvalDialog.visible"
      title="审批打卡记录"
      width="95%"
      :show-close="false"
      class="mobile-dialog"
    >
      <div class="approval-detail" v-if="approvalDialog.data">
        <!-- 基本信息 -->
        <div class="detail-section">
          <h5 class="section-title">基本信息</h5>
          <div class="detail-grid">
            <div class="detail-item">
              <span class="detail-label">打卡类型</span>
              <el-tag :type="getTypeType(approvalDialog.data.type)" size="small">{{ approvalDialog.data.type === 'workorder' || approvalDialog.data.type === '工单打卡' ? '工单打卡' : '日常打卡' }}</el-tag>
            </div>
            <div class="detail-item" v-if="approvalDialog.data.workorderId">
              <span class="detail-label">关联工单</span>
              <span class="detail-value">{{ approvalDialog.data.workorderId }}</span>
            </div>
            <div class="detail-item" v-if="approvalDialog.data.customerName">
              <span class="detail-label">客户</span>
              <span class="detail-value">{{ approvalDialog.data.customerName }}</span>
            </div>
            <div class="detail-item" v-if="approvalDialog.data.deviceModel">
              <span class="detail-label">设备型号</span>
              <span class="detail-value">{{ approvalDialog.data.deviceModel }}</span>
            </div>
          </div>
        </div>

        <!-- 时间信息 -->
        <div class="detail-section">
          <h5 class="section-title">打卡时间</h5>
          <div class="detail-grid">
            <div class="detail-item">
              <span class="detail-label">签到时间</span>
              <span class="detail-value highlight">{{ approvalDialog.data.checkinTime || '-' }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">签离时间</span>
              <span class="detail-value highlight" :class="{ 'missing': !approvalDialog.data.checkoutTime }">{{ approvalDialog.data.checkoutTime || '未签离' }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">提交时间</span>
              <span class="detail-value">{{ approvalDialog.data.submitTime || '-' }}</span>
            </div>
          </div>
        </div>

        <!-- 位置信息 -->
        <div class="detail-section">
          <h5 class="section-title">位置信息</h5>
          <div class="detail-grid">
            <div class="detail-item">
              <span class="detail-label">签到地点</span>
              <span class="detail-value">{{ approvalDialog.data.location || '-' }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">签离地点</span>
              <span class="detail-value" :class="{ 'missing': !approvalDialog.data.checkOutLocation }">{{ approvalDialog.data.checkOutLocation || '未记录' }}</span>
            </div>
          </div>
        </div>

        <!-- 活动内容（活动打卡） -->
        <div class="detail-section" v-if="approvalDialog.data.content">
          <h5 class="section-title">活动内容</h5>
          <p class="activity-text">{{ approvalDialog.data.content }}</p>
        </div>

        <!-- 工时统计 -->
        <div class="detail-section" v-if="approvalDialog.data.checkinTime && approvalDialog.data.checkoutTime">
          <h5 class="section-title">工时统计</h5>
          <div class="work-duration-box">
            <el-icon><Clock /></el-icon>
            <span>工时：{{ calculateDuration(approvalDialog.data.checkinTime, approvalDialog.data.checkoutTime) }}</span>
          </div>
        </div>

        <!-- 现场照片 -->
        <div class="detail-section" v-if="approvalDialog.data.photos && approvalDialog.data.photos.length > 0">
          <h5 class="section-title">现场照片</h5>
          <div class="photo-list-detail">
            <img 
              v-for="(photo, index) in approvalDialog.data.photos" 
              :key="index" 
              :src="photo" 
              class="photo-thumb-lg"
              @click="previewPhoto(photo)"
            />
          </div>
        </div>

        <!-- 审批意见 -->
        <div class="detail-section">
          <h5 class="section-title">审批</h5>
          <el-input 
            v-model="approvalDialog.comment" 
            type="textarea" 
            :rows="2" 
            placeholder="输入审批意见（可选）"
          />
        </div>
      </div>
      <template #footer>
        <el-button @click="approvalDialog.visible = false">取消</el-button>
        <el-button type="primary" @click="confirmApprove">审批通过</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getCurrentPosition } from '../utils/gps'
import { addNotification, NotificationType } from '../stores/notificationStore'
import { state as workorderFlowState } from '../stores/workorderFlowStore.js'
import {
  ArrowLeft,
  ArrowRight,
  OfficeBuilding,
  Document,
  Location,
  Calendar,
  Camera,
  Close,
  Refresh,
  Monitor,
  Clock
} from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()

// 视图模式：today | history
const viewMode = ref('today')

// 当前日期
const currentDate = ref(new Date())

// 当前月份（历史模式）
const currentMonth = ref(new Date())

// 当前筛选状态
const currentFilter = ref('all')

// 按日期筛选后的列表（用于统计计数）
const dateFilteredList = computed(() => {
  let list = checkinList.value
  if (viewMode.value === 'today') {
    const todayStr = currentDate.value.toISOString().slice(0, 10)
    list = list.filter(item => item.checkinTime && item.checkinTime.slice(0, 10) === todayStr)
  } else {
    const monthStr = currentMonth.value.toISOString().slice(0, 7)
    list = list.filter(item => item.checkinTime && item.checkinTime.startsWith(monthStr))
  }
  return list
})

// 筛选标签配置
const filterTabs = computed(() => [
  { key: 'all', name: '全部', count: dateFilteredList.value.length, badgeType: '' },
  { key: 'in_progress', name: '进行中', count: dateFilteredList.value.filter(item => item.status === '已签到').length, badgeType: 'warning' },
  { key: 'unsubmitted', name: '未提交', count: dateFilteredList.value.filter(item => item.status === '已签到' && item.checkoutTime).length, badgeType: 'danger' },
  { key: 'pending_approval', name: '待审批', count: dateFilteredList.value.filter(item => item.status === '已提交').length, badgeType: 'primary' },
  { key: 'approved', name: '已通过', count: dateFilteredList.value.filter(item => item.status === '已通过').length, badgeType: 'success' }
])

// 进行中数量（已签到）
const inProgressCount = computed(() => {
  return dateFilteredList.value.filter(item => item.status === '已签到').length
})

// 未提交数量（已签离但未提交审批）
const unsubmittedCount = computed(() => {
  return dateFilteredList.value.filter(item => item.status === '已签到' && item.checkoutTime).length
})

// 待审批数量
const pendingApprovalCount = computed(() => {
  return dateFilteredList.value.filter(item => item.status === '已提交').length
})

// 已通过数量
const approvedCount = computed(() => {
  return dateFilteredList.value.filter(item => item.status === '已通过').length
})

// 筛选后的打卡列表
const filteredCheckinList = computed(() => {
  const list = dateFilteredList.value
  // 按状态筛选
  switch (currentFilter.value) {
    case 'in_progress': return list.filter(item => item.status === '已签到')
    case 'unsubmitted': return list.filter(item => item.status === '已签到' && item.checkoutTime)
    case 'pending_approval': return list.filter(item => item.status === '已提交')
    case 'approved': return list.filter(item => item.status === '已通过')
    default: return list
  }
})

// 设置筛选
const setFilter = (filter) => {
  currentFilter.value = filter
}

// 是否今天
const isToday = computed(() => {
  const today = new Date()
  return currentDate.value.toDateString() === today.toDateString()
})

// 是否为审批者（课长、部长、经理等角色）
const isApprover = computed(() => {
  const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
  return ['课长', '部长', '经理', '部门负责人', 'techLead', 'director'].includes(userInfo.role)
})

// 打卡列表数据（从localStorage加载）
const checkinList = ref([])

const loadCheckinData = () => {
  try {
    const records = JSON.parse(localStorage.getItem('checkinRecords') || '[]')
    checkinList.value = records
  } catch { checkinList.value = [] }
}

onMounted(() => {
  loadCheckinData()
  window.addEventListener('checkin-updated', loadCheckinData)
})

// 已完成数量（已签离/已提交/已通过）
const completedCount = computed(() => {
  return dateFilteredList.value.filter(item => 
    item.status === '已提交' || item.status === '已通过' ||
    (item.status === '已签到' && item.checkoutTime)
  ).length
})

// 签离对话框（轻量化：只保留时间+定位）
const checkOutDialog = ref({
  visible: false,
  data: null,
  checkoutTime: '',
  form: {
    location: ''
  }
})

// 提交审批对话框（包含日报字段）
const approvalSubmitDialog = ref({
  visible: false,
  data: null,
  form: {
    departTime: '', workStartTime: '', returnTime: '', workEndTime: '',
    coworker: '', deviceStopped: null,
    workContent: '', faultAnalysis: '', bizFollowUps: [], pendingIssues: '',
    taskCompleted: null, incompleteReason: ''
  }
})

// 共同作业人员选项（演示环境5人）
const coworkerOptions = ['王工程师', '陈工程师', '刘工程师', '赵工程师', '孙工程师']

// 签离不需要额外校验，只要有定位即可
const canCheckOut = computed(() => {
  return !!checkOutDialog.value.form.location
})

// 提交审批校验
const canSubmitApproval = computed(() => {
  const f = approvalSubmitDialog.value.form
  const type = approvalSubmitDialog.value.data?.type
  // 所有类型都必填：任务是否完成
  if (f.taskCompleted === null) return false
  if (f.taskCompleted === false && !f.incompleteReason) return false
  // 工单打卡：需要填完整日报
  if (type === 'workorder') {
    if (!f.departTime || !f.workStartTime || !f.returnTime || !f.workEndTime) return false
    if (!f.workContent || f.deviceStopped === null) return false
  } else {
    // 日常打卡：需要填作业内容
    if (!f.workContent) return false
  }
  return true
})

// 快捷标签追加作业内容
const appendWorkContent = (text) => {
  const current = approvalSubmitDialog.value.form.workContent
  if (current && !current.endsWith('\n') && !current.endsWith('，')) {
    approvalSubmitDialog.value.form.workContent = current + '，' + text
  } else {
    approvalSubmitDialog.value.form.workContent = (current || '') + text
  }
}

// 审批对话框
const approvalDialog = ref({
  visible: false,
  data: null,
  comment: ''
})

// 打卡详情 Drawer
const detailDrawer = ref({
  visible: false,
  data: null
})

// 关联工单数据
const detailWorkorder = computed(() => {
  if (!detailDrawer.value.data?.workorderId) return null
  const wid = detailDrawer.value.data.workorderId
  return workorderFlowState.workorders.find(w => w.workorderId === wid || w.id === wid) || null
})

const openDetail = (item) => {
  detailDrawer.value.data = item
  detailDrawer.value.visible = true
}

const getWorkorderStatusText = (s) => ({
  pending_assign: '待分配', pending_accept: '待接单', processing: '进行中',
  pending_sign: '待签字', techlead_confirm: '课长确认', assistant_confirm: '业务确认',
  completed: '已完成'
}[s] || s)

const goToWorkorderDetail = (wo) => {
  detailDrawer.value.visible = false
  router.push(`/staff-workorder-detail?id=${wo.id}`)
}

// 方法
const goBack = () => {
  // 返回前触发更新事件，确保工作台数据刷新
  window.dispatchEvent(new CustomEvent('checkin-updated'))
  router.back()
}

const changeDate = (days) => {
  const newDate = new Date(currentDate.value)
  newDate.setDate(newDate.getDate() + days)
  currentDate.value = newDate
}

const changeMonth = (months) => {
  const newMonth = new Date(currentMonth.value)
  newMonth.setMonth(newMonth.getMonth() + months)
  currentMonth.value = newMonth
}

const goToCheckIn = () => {
  router.push('/staff-checkin')
}

const handleCheckOut = (item) => {
  checkOutDialog.value.data = item
  const now = new Date()
  checkOutDialog.value.checkoutTime = now.toISOString().slice(0, 19).replace('T', ' ')
  checkOutDialog.value.form = {
    location: item.location || item.checkOutLocation || '定位中...'
  }
  // 先弹出对话框，定位在后台异步进行
  checkOutDialog.value.visible = true
  getCurrentPosition().then(pos => {
    checkOutDialog.value.form.location = pos.address
  }).catch(() => {
    checkOutDialog.value.form.location = item.location || item.checkOutLocation || '上海市浦东新区张江高科技园区'
  })
}

const refreshCheckOutLocation = async () => {
  try {
    const pos = await getCurrentPosition()
    checkOutDialog.value.form.location = pos.address
  } catch {
    checkOutDialog.value.form.location = checkOutDialog.value.form.location || '上海市浦东新区张江高科技园区'
  }
}

const submitCheckOut = () => {
  const item = checkOutDialog.value.data
  if (item) {
    // 支持多次签离：将签离记录追加到数组
    if (!item.checkoutRecords) {
      item.checkoutRecords = []
    }
    item.checkoutRecords.push({
      checkoutTime: checkOutDialog.value.checkoutTime,
      checkOutLocation: checkOutDialog.value.form.location
    })
    // 同时更新最新的签离时间和地点（兼容旧逻辑）
    item.checkoutTime = checkOutDialog.value.checkoutTime
    item.checkOutLocation = checkOutDialog.value.form.location
    item.status = '已签到'

    localStorage.setItem('checkinRecords', JSON.stringify(checkinList.value))
    window.dispatchEvent(new CustomEvent('checkin-updated'))
  }
  checkOutDialog.value.visible = false
  ElMessage.success('签离成功')
}

const handleSubmitApproval = (item) => {
  // 打开提交审批对话框，填写日报信息
  approvalSubmitDialog.value.data = item
  approvalSubmitDialog.value.form = {
    departTime: item.departTime || '', workStartTime: item.workStartTime || '',
    returnTime: item.returnTime || '', workEndTime: item.workEndTime || '',
    coworker: item.coworker || '', deviceStopped: item.deviceStopped ?? null,
    workContent: item.workContent || '', faultAnalysis: item.faultAnalysis || '',
    bizFollowUps: item.bizFollowUps || [], pendingIssues: item.pendingIssues || '',
    taskCompleted: null, incompleteReason: ''
  }
  approvalSubmitDialog.value.visible = true
}

// 提交审批（含日报信息）
const submitApprovalWithReport = () => {
  const item = approvalSubmitDialog.value.data
  if (!item) return

  const f = approvalSubmitDialog.value.form
  // 将日报信息写入打卡记录
  item.departTime = f.departTime
  item.workStartTime = f.workStartTime
  item.returnTime = f.returnTime
  item.workEndTime = f.workEndTime
  item.coworker = f.coworker
  item.deviceStopped = f.deviceStopped
  item.workContent = f.workContent
  item.faultAnalysis = f.faultAnalysis
  item.bizFollowUps = f.bizFollowUps
  item.pendingIssues = f.pendingIssues || '无'
  item.taskCompleted = f.taskCompleted
  item.incompleteReason = f.incompleteReason

  // 锁定打卡：更新状态为已提交，不可再修改
  item.status = '已提交'
  item.submitTime = new Date().toISOString().slice(0, 19).replace('T', ' ')
  // 确保签离信息完整
  if (!item.checkOutLocation) {
    item.checkOutLocation = item.location || '未记录'
  }

  // 保存到本地存储
  localStorage.setItem('checkinRecords', JSON.stringify(checkinList.value))

  // 触发自定义事件通知工作台更新
  window.dispatchEvent(new CustomEvent('checkin-updated'))

  // 通知中心 - 提交审批
  addNotification({
    type: NotificationType.CHECKIN_SUBMITTED,
    title: '打卡待审批',
    content: `${item.customerName || '员工'} 提交了${item.type === 'workorder' || item.type === '工单打卡' ? '工单打卡' : '日常打卡'}审批（${item.checkinTime} - ${item.checkoutTime || '未签离'}）`,
    targetRole: 'techLead',
    jumpPath: '/staff-field-checkin-list',
    jumpParams: { filter: 'pending_approval' }
  })

  approvalSubmitDialog.value.visible = false
  ElMessage.success('已提交审批，打卡记录已锁定')
}

// 审批打卡 - 打开审批对话框
const handleApprove = (item) => {
  approvalDialog.value.data = item
  approvalDialog.value.comment = ''
  approvalDialog.value.visible = true
}

// 确认审批通过
const confirmApprove = () => {
  const item = approvalDialog.value.data
  if (!item) return
  
  item.status = '已通过'
  item.approvalTime = new Date().toISOString().slice(0, 19).replace('T', ' ')
  item.approver = '课长'
  item.approvalComment = approvalDialog.value.comment || '审批通过'

  // 保存到本地存储
  localStorage.setItem('checkinRecords', JSON.stringify(checkinList.value))

  // 触发自定义事件通知工作台更新
  window.dispatchEvent(new CustomEvent('checkin-updated'))

  // 通知中心 - 审批通过
  addNotification({
    type: NotificationType.CHECKIN_APPROVED,
    title: '打卡审批通过',
    content: `您的${item.type === 'workorder' || item.type === '工单打卡' ? '工单打卡' : '日常打卡'}打卡（${item.checkinTime}）已通过审批`,
    targetRole: 'engineer',
    jumpPath: '/staff-field-checkin-list'
  })

  approvalDialog.value.visible = false
  ElMessage.success('审批通过')
}

const previewPhoto = (photo) => {
  // 预览照片
  console.log('预览照片:', photo)
}

const getTypeType = (type) => {
  return type === 'workorder' || type === '工单打卡' ? 'primary' : 'success'
}

const getStatusType = (status) => {
  const types = {
    '已签到': 'warning',
    '进行中': 'warning',
    '已签离': 'success',
    '已提交': 'info',
    '已通过': 'success',
    '已完成': 'success'
  }
  return types[status] || 'info'
}

const calculateDuration = (start, end) => {
  if (!start || !end) return '-'
  const [startHour, startMin] = start.split(':').map(Number)
  const [endHour, endMin] = end.split(':').map(Number)
  const duration = (endHour * 60 + endMin) - (startHour * 60 + startMin)
  const hours = Math.floor(duration / 60)
  const mins = duration % 60
  return hours > 0 ? `${hours}小时${mins}分钟` : `${mins}分钟`
}

const formatDate = (date) => {
  if (!date) return ''
  const d = new Date(date)
  const month = d.getMonth() + 1
  const day = d.getDate()
  const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  const weekDay = weekDays[d.getDay()]
  return `${month}月${day}日 ${weekDay}`
}

const formatMonth = (date) => {
  if (!date) return ''
  const d = new Date(date)
  return `${d.getFullYear()}年${d.getMonth() + 1}月`
}

</script>

<style scoped>
.staff-field-checkin-list {
  min-height: 100vh;
  background: #f5f7fa;
  padding-bottom: 100px;
  width: 100vw;
  max-width: 100%;
  overflow-x: hidden;
  box-sizing: border-box;
}

/* 顶部导航 */
.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 15px;
  background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
  color: white;
}

.list-header .el-button {
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

/* 视图模式切换 */
.view-mode-section {
  display: flex;
  justify-content: center;
  padding: 12px 15px 0;
  background: white;
}
.view-mode-tabs {
  display: flex;
  background: #f0f0f0;
  border-radius: 20px;
  padding: 3px;
  gap: 2px;
}
.view-mode-tab {
  padding: 6px 24px;
  border-radius: 18px;
  font-size: 13px;
  cursor: pointer;
  color: #666;
  transition: all 0.3s;
}
.view-mode-tab.active {
  background: white;
  color: #409EFF;
  font-weight: 600;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

/* 日期选择 */
.date-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  background: white;
  border-bottom: 1px solid #f0f0f0;
}

.date-picker {
  display: flex;
  align-items: center;
  gap: 15px;
}

.current-date {
  font-size: 16px;
  font-weight: 500;
  color: #262626;
}

/* 筛选区域 */
.filter-section {
  background: white;
  padding: 12px 15px;
  border-bottom: 1px solid #f0f0f0;
}

.filter-tabs {
  display: flex;
  gap: 10px;
  overflow-x: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.filter-tabs::-webkit-scrollbar {
  display: none;
}

.filter-tab {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: #f5f7fa;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.3s;
  white-space: nowrap;
  flex-shrink: 0;
}

.filter-tab.active {
  background: #1890ff;
  color: white;
}

.filter-tab .tab-name {
  font-size: 14px;
}

.filter-tab .tab-badge {
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 8px;
  font-weight: 500;
}

.filter-tab .tab-badge.warning {
  background: #faad14;
  color: white;
}

.filter-tab .tab-badge.danger {
  background: #ff4d4f;
  color: white;
}

.filter-tab .tab-badge.primary {
  background: #1890ff;
  color: white;
}

.filter-tab .tab-badge.success {
  background: #52c41a;
  color: white;
}

.filter-tab.active .tab-badge {
  background: rgba(255,255,255,0.9) !important;
  color: #1890ff !important;
}

/* 统计卡片 */
.stats-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  padding: 15px;
  background: white;
  margin-bottom: 15px;
}

.stat-card {
  background: #f5f7fa;
  border-radius: 10px;
  padding: 15px;
  text-align: center;
}

.stat-number {
  font-size: 24px;
  font-weight: 600;
  color: #1890ff;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 13px;
  color: #8c8c8c;
}

/* 打卡列表 */
.checkin-list {
  padding: 0 15px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.checkin-card {
  background: white;
  border-radius: 12px;
  padding: 15px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  border-left: 4px solid #d9d9d9;
}

.checkin-card.in-progress {
  border-left-color: #faad14;
}

.checkin-card.unsubmitted {
  border-left-color: #ff4d4f;
  background: linear-gradient(135deg, #fff 0%, #fff1f0 100%);
}

.checkin-card.pending-approval {
  border-left-color: #1890ff;
  background: linear-gradient(135deg, #fff 0%, #e6f7ff 100%);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.type-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.checkin-time {
  font-size: 16px;
  font-weight: 500;
  color: #262626;
}

.card-body {
  margin-bottom: 12px;
}

.info-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  font-size: 14px;
  color: #595959;
}

.info-row .el-icon {
  color: #8c8c8c;
  font-size: 16px;
}

.workorder-id {
  font-weight: 500;
  color: #1890ff;
}

.customer-name {
  font-weight: 500;
  color: #262626;
}

.activity-content {
  background: #f5f7fa;
  padding: 10px;
  border-radius: 8px;
  margin: 10px 0;
}

.activity-content p {
  margin: 0;
  font-size: 14px;
  color: #595959;
  line-height: 1.5;
}

.location {
  color: #8c8c8c;
  font-size: 13px;
}

.photo-list {
  display: flex;
  gap: 8px;
  margin-top: 10px;
  flex-wrap: wrap;
}

.photo-thumb {
  width: 60px;
  height: 60px;
  border-radius: 8px;
  object-fit: cover;
  cursor: pointer;
}

/* 时间线 */
.timeline {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 12px 0;
  border-top: 1px dashed #e8e8e8;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.timeline-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.timeline-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.timeline-dot.start {
  background: #52c41a;
}

.timeline-dot.end {
  background: #1890ff;
}

.timeline-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.timeline-content .time {
  font-size: 14px;
  font-weight: 500;
  color: #262626;
}

.timeline-content .label {
  font-size: 12px;
  color: #8c8c8c;
}

.work-duration {
  font-size: 13px;
  color: #1890ff;
  font-weight: 500;
}

.card-footer {
  display: flex;
  justify-content: flex-end;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}

/* 签离详情 */
.checkout-details {
  padding: 8px 0;
  border-top: 1px dashed #e8e8e8;
  margin-bottom: 8px;
}
.checkout-details .detail-row {
  display: flex;
  gap: 10px;
  margin-bottom: 4px;
  font-size: 13px;
}
.checkout-details .dl { color: #8c8c8c; min-width: 60px; }
.checkout-details .dv { color: #262626; }
.text-danger { color: #f56c6c !important; }

/* 工作内容截断 */
.work-content {
  font-size: 13px;
  color: #595959;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* 行程信息 */
.trip-info {
  font-size: 12px;
  color: #8c8c8c;
}

/* 遗留问题 */
.pending {
  font-size: 12px;
  color: #fa8c16;
}

.tags-row {
  gap: 6px;
  display: flex;
  align-items: center;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 60px 20px;
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

.empty-state .sub-text {
  font-size: 12px;
  margin-top: 8px;
}

/* 打卡按钮 */
.checkin-button {
  position: fixed;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 100;
}

.button-content {
  width: 120px;
  height: 120px;
  background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
  box-shadow: 0 4px 20px rgba(24, 144, 255, 0.4);
  cursor: pointer;
  transition: all 0.3s;
}

.button-content:active {
  transform: scale(0.95);
}

.button-content .el-icon {
  font-size: 32px;
  margin-bottom: 4px;
}

.button-content span {
  font-size: 14px;
  font-weight: 500;
}

/* 打卡表单 */
.checkin-form, .checkout-form {
  padding: 10px 0;
}

.form-item {
  margin-bottom: 20px;
}

.form-label {
  display: block;
  font-size: 14px;
  color: #262626;
  margin-bottom: 10px;
  font-weight: 500;
}

.divider {
  display: flex;
  align-items: center;
  margin: 20px 0 16px;
  color: #909399;
  font-size: 13px;
}

.divider::before, .divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: #e4e7ed;
}

.divider span {
  padding: 0 12px;
}

.followup-options {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.followup-options .el-checkbox {
  margin-right: 0;
}

.detail-row { display: flex; align-items: flex-start; margin-bottom: 4px; font-size: 13px; }
.detail-row .dl { color: #909399; min-width: 70px; flex-shrink: 0; }
.detail-row .dv { color: #303133; flex: 1; word-break: break-all; }
.text-danger { color: #f56c6c !important; }

.type-selector {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.type-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 20px;
  background: #f5f7fa;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s;
  border: 2px solid transparent;
}

.type-option.active {
  background: #e6f7ff;
  border-color: #1890ff;
  color: #1890ff;
}

.type-option .el-icon {
  font-size: 28px;
}

.type-option span {
  font-size: 14px;
}

.location-display {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 8px;
  font-size: 14px;
  color: #595959;
}

.location-display .el-icon {
  color: #1890ff;
}

.location-display span {
  flex: 1;
}

.info-value {
  padding: 12px;
  background: #f5f7fa;
  border-radius: 8px;
  font-size: 14px;
  color: #262626;
}

/* 照片上传 */
.photo-upload {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.photo-list {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.photo-item {
  position: relative;
  width: 80px;
  height: 80px;
}

.photo-item img {
  width: 100%;
  height: 100%;
  border-radius: 8px;
  object-fit: cover;
}

.remove-photo {
  position: absolute;
  top: -5px;
  right: -5px;
  background: #ff4d4f;
  color: white;
  border-radius: 50%;
  padding: 4px;
  font-size: 12px;
  cursor: pointer;
}

.upload-btn {
  width: 80px;
  height: 80px;
  border: 2px dashed #d9d9d9;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #8c8c8c;
  cursor: pointer;
  transition: all 0.3s;
}

.upload-btn:active {
  border-color: #1890ff;
  color: #1890ff;
}

.upload-btn .el-icon {
  font-size: 24px;
  margin-bottom: 4px;
}

.upload-btn span {
  font-size: 12px;
}

/* 工单选项 */
.workorder-option {
  padding: 8px 0;
}

.workorder-id {
  font-weight: 500;
  color: #1890ff;
  margin-bottom: 4px;
}

.workorder-info {
  font-size: 12px;
  color: #8c8c8c;
}

/* 手机端小屏幕适配 */
@media (max-width: 375px) {
  .stats-cards {
    gap: 8px;
    padding: 10px;
  }
  
  .stat-card {
    padding: 12px 8px;
  }
  
  .stat-number {
    font-size: 20px;
  }
  
  .checkin-card {
    padding: 12px;
  }
  
  .button-content {
    width: 100px;
    height: 100px;
  }
  
  .button-content .el-icon {
    font-size: 28px;
  }
}

/* 响应式适配 - 平板及以上 */
@media (min-width: 768px) {
  .staff-field-checkin-list {
    max-width: 414px;
    margin: 0 auto;
    border-left: 1px solid #e8e8e8;
    border-right: 1px solid #e8e8e8;
  }
}

/* 审批详情 */
.approval-detail {
  padding: 0 4px;
}

.detail-section {
  margin-bottom: 16px;
}

.detail-section .section-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 10px 0;
  padding-bottom: 6px;
  border-bottom: 1px solid #f0f0f0;
}

.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px 12px;
}

.detail-item {
  display: flex;
  flex-direction: column;
}

.detail-label {
  font-size: 12px;
  color: #909399;
  margin-bottom: 2px;
}

.detail-value {
  font-size: 13px;
  color: #303133;
  word-break: break-all;
}

.detail-value.highlight {
  font-size: 14px;
  font-weight: 600;
  color: #1890ff;
}

.detail-value.missing {
  color: #f5222d;
  font-style: italic;
}

.activity-text {
  font-size: 13px;
  color: #606266;
  line-height: 1.6;
  margin: 0;
  padding: 8px;
  background: #fafafa;
  border-radius: 6px;
}

.work-duration-box {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  background: #f6ffed;
  border: 1px solid #b7eb8f;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  color: #52c41a;
}

.work-duration-box .el-icon {
  font-size: 16px;
}

.photo-list-detail {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.photo-thumb-lg {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 6px;
  border: 1px solid #f0f0f0;
  cursor: pointer;
}

/* 卡片点击提示 */
.checkin-card { cursor: pointer; transition: box-shadow 0.2s; }
.checkin-card:active { box-shadow: 0 2px 12px rgba(0,0,0,0.15); }
.view-detail-hint { font-size: 12px; color: #c0c4cc; flex: 1; }

/* Drawer 详情 */
.drawer-title { font-size: 17px; font-weight: 600; color: #303133; }
.detail-content { padding: 0 4px 20px; }
.detail-section { margin-bottom: 16px; background: #f9fafb; border-radius: 10px; padding: 14px; }
.section-title { font-size: 14px; font-weight: 600; color: #303133; margin: 0 0 10px 0; padding-bottom: 6px; border-bottom: 1px solid #ebeef5; }
.detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 12px; }
.detail-item { display: flex; flex-direction: column; gap: 2px; }
.detail-item.full { grid-column: 1 / -1; }
.detail-label { font-size: 12px; color: #909399; }
.detail-value { font-size: 13px; color: #303133; word-break: break-all; }
.detail-value.highlight { color: #1890ff; font-weight: 600; }
.detail-value.missing { color: #f5222d; font-style: italic; }
.text-danger { color: #f56c6c !important; }

/* 关联工单 */
.related-workorder { cursor: pointer; }
.related-workorder:active { opacity: 0.8; }
.workorder-link { color: #1890ff; font-weight: 500; }
.workorder-jump-hint { text-align: right; font-size: 12px; color: #1890ff; margin-top: 8px; }

/* 现场照片 */
.photo-list-detail { display: flex; flex-wrap: wrap; gap: 8px; }
.photo-thumb-lg { width: 80px; height: 80px; object-fit: cover; border-radius: 6px; border: 1px solid #f0f0f0; cursor: pointer; }

/* 底部操作 */
.detail-actions { padding: 16px 0 0; }

/* 共同作业人员选择 */
.coworker-select {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.coworker-tag {
  cursor: pointer;
  transition: all 0.2s;
}
.coworker-tag:hover {
  opacity: 0.8;
}

/* 快捷标签 */
.quick-tags {
  display: flex;
  gap: 8px;
}
.quick-tag {
  cursor: pointer;
  transition: all 0.2s;
}
.quick-tag:hover {
  opacity: 0.8;
}
</style>
