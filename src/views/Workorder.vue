<template>
  <div class="workorder">
    <el-card shadow="hover" class="mb-4">
      <template #header>
        <div class="card-header">
          <span>工单管理</span>
          <el-button type="primary" @click="handleAddWorkorder">
            <el-icon><Plus /></el-icon>
            <span>新增工单</span>
          </el-button>
        </div>
      </template>

      <!-- 联系人审核状态提示 -->
      <el-alert
        v-if="currentContact && currentContact.approvalStatus !== '已通过'"
        :title="getApprovalAlertTitle"
        :type="getApprovalAlertType"
        :closable="false"
        show-icon
        class="mb-4"
      >
        <template #default>
          <span v-if="currentContact.approvalStatus === '待审核'">
            您的注册申请正在审核中，审核通过后才能发起工单。请耐心等待或联系管理员。
          </span>
          <span v-else-if="currentContact.approvalStatus === '已拒绝'">
            您的注册申请未通过审核，无法发起工单。请联系管理员了解详情。
          </span>
          <span v-else>
            您需要先完成注册并通过审核才能发起工单。
            <el-button type="primary" link @click="goToRegister">立即注册</el-button>
          </span>
        </template>
      </el-alert>
      <div class="search-bar">
        <el-input
          v-model="searchQuery"
          placeholder="搜索工单号或客户名称"
          prefix-icon="el-icon-search"
          style="width: 300px; margin-right: 10px"
        />
        <el-select
          v-model="workorderStatus"
          placeholder="工单状态"
          style="width: 150px; margin-right: 10px"
        >
          <el-option label="全部" value="" />
          <el-option v-if="showPendingAssignOption" label="待分配" value="pending_assign" />
          <el-option label="待接单" value="pending_accept" />
          <el-option label="进行中" value="processing" />
          <el-option label="待签字" value="pending_sign" />
          <el-option label="课长确认" value="techlead_confirm" />
          <el-option label="业务确认" value="assistant_confirm" />
          <el-option label="已完成" value="completed" />
        </el-select>
        <el-button type="primary" @click="handleSearch">搜索</el-button>
      </div>
      <ConfigurableTable
        :data="filteredWorkorders"
        :columns="tableColumns"
        storage-key="workorder"
        :show-operation="true"
        operation-width="140"
        @sort-change="handleSortChange"
        class="mt-4"
      >
        <template #id="{ row }">
          <span class="workorder-id-link" @click.stop="handleViewWorkorder(row)">{{ row.id }}</span>
        </template>
        <template #type="{ row }">
          <el-tag :type="getCategoryTagType(row.category)">{{ getCategoryText(row) }}</el-tag>
        </template>
        <template #flowStatus="{ row }">
          <el-tag :type="getFlowStatusType(row.flowStatus || 'created')" size="small">
            {{ getFlowStatusText(row.flowStatus || 'created') }}
          </el-tag>
        </template>
        <template #createTime="{ row }">
          {{ formatDateTime(row.createTime) }}
        </template>
        <template #operation="{ row }">
          <!-- 待分配：课长/管理员/部长(超2h)可分配，管理员可编辑删除 -->
          <template v-if="row.flowStatus === 'pending_assign'">
            <el-button v-if="canAssignWorkorder(currentUserRole, row)" type="primary" size="small" @click="handleQuickAssign(row)">分配</el-button>
            <el-button v-if="currentUserRole === 'admin'" type="success" size="small" @click="handleEditWorkorder(row)">编辑</el-button>
            <el-button v-if="currentUserRole === 'admin'" type="danger" size="small" @click="handleDeleteWorkorder(row.id)">删除</el-button>
          </template>
          <!-- 待接单：工程师/管理员可接单弃单 -->
          <template v-if="row.flowStatus === 'pending_accept'">
            <el-button v-if="canAcceptWorkorder(currentUserRole, row, currentUserId)" type="success" size="small" @click="handleQuickAccept(row)">接单</el-button>
            <el-button v-if="canRejectWorkorder(currentUserRole, row, currentUserId)" type="warning" size="small" @click="handleQuickReject(row)">弃单</el-button>
          </template>
          <!-- 进行中：工程师/管理员可完成 -->
          <template v-if="row.flowStatus === 'processing'">
            <el-button v-if="canSubmitForSign(currentUserRole, row, currentUserId)" type="success" size="small" @click="handleQuickComplete(row)">完成</el-button>
          </template>
          <!-- 课长确认：课长/管理员 -->
          <el-button v-if="row.flowStatus === 'techlead_confirm' && canTechLeadConfirm(currentUserRole)" type="primary" size="small" @click="handleQuickTLConfirm(row)">课长确认</el-button>
          <!-- 业务确认：业务助理/管理员 -->
          <el-button v-if="row.flowStatus === 'assistant_confirm' && canAssistantConfirm(currentUserRole)" type="primary" size="small" @click="handleQuickAsstConfirm(row)">业务确认</el-button>
        </template>
      </ConfigurableTable>
      <div class="pagination mt-4">
        <el-pagination
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
          :current-page="currentPage"
          :page-sizes="[10, 20, 50, 100]"
          :page-size="pageSize"
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
        />
      </div>
    </el-card>

    <!-- 新增/编辑工单对话框 -->
    <el-dialog
      :title="dialogTitle"
      v-model="dialogVisible"
      width="900px"
      :close-on-click-modal="false"
      class="workorder-edit-dialog"
    >
      <div class="workorder-edit">
        <!-- 头部信息卡片 -->
        <div class="header-card">
          <div class="header-left">
            <div class="workorder-title">
              <el-icon><Plus v-if="dialogTitle === '新增工单'" /><EditPen v-else /></el-icon>
              <span>{{ dialogTitle === '新增工单' ? '新建工单' : '编辑工单' }}</span>
            </div>
            <div class="workorder-meta" v-if="dialogTitle !== '新增工单' && form.id">
              <span class="meta-item">
                <el-icon><Document /></el-icon>
                {{ form.id }}
              </span>
              <span class="meta-item" :class="form.category">
                <el-icon><Collection /></el-icon>
                {{ getCategoryText(form) }}
              </span>
            </div>
        </div>
        </div>

        <!-- 基本信息 -->
        <el-card class="section-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <el-icon><InfoFilled /></el-icon>
              <span>基本信息</span>
            </div>
          </template>
          <el-form :model="form" label-width="100px" class="workorder-form">
            <div class="form-grid">
              <el-form-item v-if="!filterCategory" label="工单类型" class="form-item-full">
                <el-select v-model="form.category" style="width: 100%" placeholder="选择工单大类" @change="onFormCategoryChange">
                  <el-option label="安装工单" value="installation" />
                  <el-option label="服务工单" value="service" />
                </el-select>
              </el-form-item>
              <el-form-item v-else label="工单类型" class="form-item-full">
                <el-tag :type="form.category === 'installation' ? '' : 'success'" size="large">
                  {{ form.category === 'installation' ? '安装工单' : '服务工单' }}
                </el-tag>
              </el-form-item>
              <el-form-item v-if="form.category === 'service'" label="服务子类">
                <el-select v-model="form.subType" style="width: 100%" placeholder="选择服务子类">
                  <el-option label="维修" value="repair" />
                  <el-option label="试加工" value="trial_processing" />
                  <el-option label="改造" value="refitting" />
                </el-select>
              </el-form-item>
            </div>
          </el-form>
        </el-card>

        <!-- 客户信息 -->
        <el-card class="section-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <el-icon><OfficeBuilding /></el-icon>
              <span>客户信息</span>
            </div>
          </template>
          <el-form :model="form" label-width="100px" class="workorder-form">
            <div class="form-grid">
              <el-form-item label="客户" required>
                <el-select v-model="form.customerId" style="width: 100%" placeholder="搜索选择客户公司" filterable @change="onFormCustomerChange">
                  <el-option v-for="customer in customers" :key="customer.id" :label="customer.name" :value="customer.id" />
                </el-select>
              </el-form-item>
              <el-form-item label="电话">
                <el-input v-model="form.customerPhone" disabled placeholder="选择客户后自动带入" />
              </el-form-item>
              <el-form-item label="地址" class="form-item-full">
                <el-input v-model="form.customerAddress" disabled placeholder="选择客户后自动带入" />
              </el-form-item>
            </div>
          </el-form>
        </el-card>

        <!-- 设备信息 -->
        <el-card class="section-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <el-icon><Monitor /></el-icon>
              <span>设备信息</span>
            </div>
          </template>
          <el-form :model="form" label-width="100px" class="workorder-form">
            <div class="form-grid">
              <el-form-item label="型号">
                <el-select v-model="form.assetModel" style="width: 100%" placeholder="选择设备型号" clearable :disabled="!form.customerId">
                  <el-option v-for="model in customerModels" :key="model" :label="model" :value="model" />
                </el-select>
              </el-form-item>
              <el-form-item label="序列号" required>
                <el-select v-model="form.assetSerialNumber" style="width: 100%" placeholder="选择序列号" :disabled="!form.customerId" @change="onFormSNChange">
                  <el-option v-for="asset in customerSNs" :key="asset.serialNumber" :label="`${asset.serialNumber}（${asset.model}）`" :value="asset.serialNumber" />
                </el-select>
              </el-form-item>
              <el-form-item label="保修状态">
                <el-tag v-if="form.warrantyStatus" :type="WarrantyStatusType[form.warrantyStatus]" size="large">
                  {{ WarrantyStatusText[form.warrantyStatus] }}
                </el-tag>
                <span v-else style="color: #999">选择序列号后自动带入</span>
              </el-form-item>
            </div>
          </el-form>
        </el-card>

        <!-- 故障描述 -->
        <el-card class="section-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <el-icon><EditPen /></el-icon>
              <span>故障描述</span>
            </div>
          </template>
          <el-form :model="form" label-width="100px" class="workorder-form">
            <div class="fault-tags" style="margin-bottom: 12px; padding-left: 100px;">
              <span style="color: #909399; font-size: 13px; margin-right: 8px;">常见故障：</span>
              <el-tag v-for="tag in commonFaultTags" :key="tag.label" class="fault-tag" effect="plain" style="cursor: pointer; margin-right: 6px;" @click="onFaultTagClick(tag)">
                {{ tag.label }}
              </el-tag>
            </div>
            <el-form-item label="描述" class="form-item-full">
              <el-input v-model="form.description" type="textarea" :rows="3" placeholder="请输入故障描述，也可点击上方标签快速填入" />
            </el-form-item>
          </el-form>
        </el-card>

        <!-- 编辑模式下的额外字段 -->
        <el-card v-if="dialogTitle !== '新增工单'" class="section-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <el-icon><Setting /></el-icon>
              <span>工单进展</span>
            </div>
          </template>
          <el-form :model="form" label-width="100px" class="workorder-form">
            <div class="form-grid">
              <el-form-item label="当前状态">
                <el-tag :type="getFlowStatusType(form.status)" size="large">
                  {{ getFlowStatusText(form.status) }}
                </el-tag>
              </el-form-item>
              <el-form-item v-if="form.assignEngineer" label="指派工程师">
                <span>{{ form.assignEngineer }}</span>
              </el-form-item>
            </div>
          </el-form>
        </el-card>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button native-type="button" @click.stop="dialogVisible = false">取消</el-button>
          <el-button native-type="button" type="primary" @click.stop="handleSubmit">确定</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 工单详情对话框 -->
    <el-dialog
      title="工单详情"
      v-model="detailVisible"
      width="1000px"
      :fullscreen="isMobile"
      class="workorder-detail-dialog"
    >
      <div class="detail-container">
        <!-- 头部信息卡片 -->
        <div class="header-card">
          <div class="header-left">
            <div class="detail-title">
              <el-icon><Tools /></el-icon>
              <span>{{ selectedWorkorder.id }}</span>
              <el-tag :type="getCategoryTagType(selectedWorkorder.category)" size="small" effect="dark">
                {{ getCategoryText(selectedWorkorder) }}
              </el-tag>
            </div>
            <div class="detail-meta">
              <span class="meta-item">
                <el-icon><OfficeBuilding /></el-icon>
                {{ selectedWorkorder.customerName }}
              </span>
              <span class="meta-item">
                <el-icon><Clock /></el-icon>
                {{ formatDateTime(selectedWorkorder.createTime) }}
              </span>
            </div>
          </div>
          <div class="header-right">
            <el-tag :type="getFlowStatusType(selectedWorkorder.flowStatus)" size="large" effect="dark">
              {{ getFlowStatusText(selectedWorkorder.flowStatus) }}
            </el-tag>
          </div>
        </div>

        <!-- 角色操作按钮 -->
        <div class="flow-action-bar" v-if="detailActions.length > 0">
          <el-button
            v-for="action in detailActions"
            :key="action.key"
            :type="action.type"
            :icon="action.icon"
            @click="detailActionHandlers[action.key]()"
          >
            {{ action.label }}
          </el-button>
        </div>
        <div class="flow-action-bar" v-if="canCompleteDirectly(currentUserRole) && selectedWorkorder.status === 'processing'">
          <el-button type="success" size="small" @click="handleDirectComplete">直接完成</el-button>
        </div>

        <el-tabs class="detail-tabs">
          <el-tab-pane label="基本信息">
            <!-- 基本信息卡片 -->
            <el-card class="section-card" shadow="hover">
              <template #header>
                <div class="card-header">
                  <el-icon><InfoFilled /></el-icon>
                  <span>工单信息</span>
                </div>
              </template>
              <div class="info-grid">
                <div class="info-item">
                  <span class="label">工单号</span>
                  <span class="value">{{ selectedWorkorder.id }}</span>
                </div>
                <div class="info-item">
                  <span class="label">类型</span>
                  <el-tag :type="getCategoryTagType(selectedWorkorder.category)" size="small">
                    {{ getCategoryText(selectedWorkorder) }}
                  </el-tag>
                </div>
                <div class="info-item">
                  <span class="label">客户名称</span>
                  <span class="value">{{ selectedWorkorder.customerName }}</span>
                </div>
                <div class="info-item">
                  <span class="label">设备序列号</span>
                  <span class="value">{{ selectedWorkorder.assetSerialNumber || '-' }}</span>
                </div>
                <div class="info-item">
                  <span class="label">状态</span>
                  <el-tag :type="getFlowStatusType(selectedWorkorder.flowStatus)" size="small">
                    {{ getFlowStatusText(selectedWorkorder.flowStatus) }}
                  </el-tag>
                </div>
                <div class="info-item">
                  <span class="label">指派工程师</span>
                  <span class="value">{{ selectedWorkorder.assignEngineer || '-' }}</span>
                </div>
                <div class="info-item">
                  <span class="label">创建时间</span>
                  <span class="value">{{ formatDateTime(selectedWorkorder.createTime) }}</span>
                </div>
                <div class="info-item">
                  <span class="label">完成时间</span>
                  <span class="value">{{ selectedWorkorder.finishTime || '-' }}</span>
                </div>
                <!-- 配件销售工单特有字段 -->
                <template v-if="selectedWorkorder.category === 'parts_sales'">
                  <div class="info-item">
                    <span class="label">总采购金额</span>
                    <span class="value purchase">¥{{ formatAmount(selectedWorkorder.totalCostAmount) }}</span>
                  </div>
                  <div class="info-item">
                    <span class="label">总销售金额</span>
                    <span class="value amount">¥{{ formatAmount(selectedWorkorder.totalSaleAmount) }}</span>
                  </div>
                  <div class="info-item">
                    <span class="label">总利润率</span>
                    <span class="value">{{ selectedWorkorder.totalProfitMargin }}%</span>
                  </div>
                </template>
              </div>
              
              <!-- 工单描述 -->
              <div class="description-section">
                <div class="section-label">工单描述</div>
                <div class="content-box">{{ selectedWorkorder.description || '暂无描述' }}</div>
              </div>
            </el-card>
            
            <!-- 作业报告书PDF下载区域 -->
            <el-card v-if="selectedWorkorder.reportPDF" class="section-card" shadow="hover">
              <template #header>
                <div class="card-header">
                  <el-icon><Document /></el-icon>
                  <span>作业报告书</span>
                </div>
              </template>
              <div class="pdf-card-content" v-if="selectedWorkorder.reportPdf">
                <div class="pdf-info">
                  <el-icon :size="40" color="#409EFF"><Document /></el-icon>
                  <div class="pdf-details">
                    <div class="pdf-name">{{ selectedWorkorder.id }}_服务报告书.pdf</div>
                    <div class="pdf-time">点击按钮预览或下载PDF</div>
                  </div>
                </div>
                <div class="pdf-actions">
                  <el-button type="primary" @click="previewReportPDF">
                    <el-icon><View /></el-icon>
                    预览
                  </el-button>
                  <el-button type="success" @click="downloadReportPDF">
                    <el-icon><Download /></el-icon>
                    下载
                  </el-button>
                </div>
              </div>
              <el-empty v-else description="暂无作业报告书" :image-size="80" />
            </el-card>
          </el-tab-pane>
          
          <el-tab-pane label="工单流转">
            <el-card class="section-card" shadow="hover" v-if="selectedWorkorder">
              <el-steps :active="getCurrentStepIndex(selectedWorkorder.status)" finish-status="success" align-center :space="120">
                <el-step v-for="s in WorkorderFlowSteps" :key="s.key" :title="s.title" />
              </el-steps>
            </el-card>
          </el-tab-pane>
          
          <el-tab-pane label="处理记录">
            <el-card class="section-card" shadow="hover">
              <template #header>
                <div class="card-header">
                  <el-icon><Clock /></el-icon>
                  <span>处理记录</span>
                </div>
              </template>
              <el-timeline v-if="selectedWorkorder.processRecords && selectedWorkorder.processRecords.length > 0">
                <el-timeline-item
                  v-for="(record, index) in selectedWorkorder.processRecords"
                  :key="index"
                  :timestamp="record.time"
                >
                  <div class="timeline-content">
                    <h4 class="timeline-title">{{ record.title }}</h4>
                    <p class="timeline-desc">{{ record.content }}</p>
                    <p v-if="record.operator" class="timeline-operator">操作人: {{ record.operator }}</p>
                  </div>
                </el-timeline-item>
              </el-timeline>
              <el-empty v-else description="暂无处理记录" />
            </el-card>
          </el-tab-pane>
          
          <el-tab-pane label="配件清单" v-if="false">
            <el-card class="section-card" shadow="hover">
              <template #header>
                <div class="card-header">
                  <el-icon><Box /></el-icon>
                  <span>配件清单</span>
                  <span class="item-count">共 {{ selectedWorkorder.partsList?.length || 0 }} 项</span>
                </div>
              </template>
              <div class="table-wrapper">
                <el-table :data="selectedWorkorder.partsList" style="width: 100%" size="small">
                  <el-table-column type="index" label="序号" width="50" align="center" />
                  <el-table-column prop="partName" label="配件名" min-width="120" />
                  <el-table-column prop="model" label="型号" width="120" />
                  <el-table-column prop="quantity" label="数量" width="70" align="right" />
                  <el-table-column prop="costPrice" label="采购单价" width="100" align="right" />
                  <el-table-column prop="salePrice" label="销售单价" width="100" align="right" />
                  <el-table-column prop="costAmount" label="采购金额" width="100" align="right" />
                  <el-table-column prop="saleAmount" label="销售金额" width="100" align="right" />
                  <el-table-column prop="profitMargin" label="利润率" width="90" align="right" />
                </el-table>
              </div>
              <el-empty v-if="!selectedWorkorder.partsList || selectedWorkorder.partsList.length === 0" description="暂无配件清单" />
            </el-card>
          </el-tab-pane>
          
          <!-- 报价记录（维修工单和配件销售工单都显示） -->
          <el-tab-pane label="报价记录" v-if="selectedWorkorder.category === 'service'">
            <el-card class="section-card" shadow="hover">
              <template #header>
                <div class="card-header">
                  <el-icon><PriceTag /></el-icon>
                  <span>报价记录</span>
                  <span class="item-count">共 {{ workorderQuotations?.length || 0 }} 条</span>
                  <!-- 待报价状态显示上传按钮 -->
                  <template v-if="selectedWorkorder.status === '待报价'">
                    <el-button type="primary" size="small" @click="handleUploadQuotationPDF" class="header-action">
                      <el-icon><Upload /></el-icon>
                      上传报价单
                    </el-button>
                  </template>
                  <!-- 配件销售工单显示发起报价按钮 -->
                  <el-button type="primary" size="small" @click="handleCreateQuotation" class="header-action">
                      <el-icon><Plus /></el-icon>
                      发起报价
                    </el-button>
                </div>
              </template>
              
              <!-- 待报价状态提示 -->
              <div v-if="selectedWorkorder.status === '待报价' && workorderQuotations.length === 0" class="quotation-pending-tip">
                <el-alert
                  title="当前工单处于待报价状态"
                  description="请上传报价单PDF文件，提交后将通知课长审核"
                  type="warning"
                  :closable="false"
                  show-icon
                />
              </div>
              
              <div class="table-wrapper" v-if="workorderQuotations.length > 0">
                <el-table :data="workorderQuotations" style="width: 100%" size="small">
                  <el-table-column type="index" label="序号" width="50" align="center" />
                  <el-table-column prop="quotationNo" label="报价单号" width="140" />
                  <el-table-column prop="version" label="版本" width="70" />
                  <el-table-column prop="totalAmount" label="总金额" width="120" align="right">
                    <template #default="{ row }">
                      <span class="amount">¥{{ formatAmount(row.totalAmount) }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="status" label="状态" width="100">
                    <template #default="{ row }">
                      <el-tag :type="getQuotationStatusType(row.status)" size="small">{{ getQuotationStatusText(row.status) }}</el-tag>
                    </template>
                  </el-table-column>
                  <el-table-column prop="createdAt" label="创建时间" width="150">
                    <template #default="{ row }">
                      {{ formatDateTime(row.createdAt) }}
                    </template>
                  </el-table-column>
                  <el-table-column label="操作" width="250" fixed="right">
                    <template #default="{ row }">
                      <el-button type="primary" link size="small" @click="handleViewQuotation(row)">查看</el-button>
                      <el-button v-if="row.pdfUrl" type="success" link size="small" @click="handleViewQuotationPDF(row)">PDF</el-button>
                      <el-button v-if="row.customerPdfUrl" type="warning" link size="small" @click="handleViewCustomerPDF(row)">客户回传</el-button>
                      <!-- 待审核状态显示提交审核按钮 -->
                      <el-button v-if="row.status === 'draft' && selectedWorkorder.status === '待报价'" type="primary" link size="small" @click="handleSubmitQuotationForApproval(row)">
                        提交审核
                      </el-button>
                    </template>
                  </el-table-column>
                </el-table>
              </div>
              <el-empty v-else-if="selectedWorkorder.status !== '待报价'" description="暂无报价记录" />
            </el-card>
          </el-tab-pane>

          <el-tab-pane label="PDF报告">
            <el-card class="section-card" shadow="hover">
              <template #header>
                <div class="card-header">
                  <el-icon><Document /></el-icon>
                  <span>PDF报告</span>
                </div>
              </template>
              <div class="pdf-container">
                <el-button type="primary" @click="handleGeneratePDF">
                  <el-icon><Plus /></el-icon>
                  生成PDF报告
                </el-button>
                <el-button type="success" @click="handleViewPDF">
                  <el-icon><View /></el-icon>
                  查看PDF报告
                </el-button>
                <el-button type="info" @click="handleSendPDF">
                  <el-icon><Message /></el-icon>
                  发送PDF报告
                </el-button>
              </div>
            </el-card>
          </el-tab-pane>
        </el-tabs>
      </div>
    </el-dialog>

    <!-- 上传报价单PDF对话框 -->
    <el-dialog
      title="上传报价单"
      v-model="uploadQuotationDialogVisible"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form :model="uploadQuotationForm" label-width="100px">
        <el-form-item label="报价单PDF" required>
          <el-upload
            class="quotation-uploader"
            action="#"
            :auto-upload="false"
            :on-change="handleQuotationFileChange"
            :limit="1"
            accept=".pdf"
          >
            <el-button type="primary">
              <el-icon><Upload /></el-icon>
              选择文件
            </el-button>
            <template #tip>
              <div class="el-upload__tip">
                请上传PDF格式的报价单文件，大小不超过10MB
              </div>
            </template>
          </el-upload>
          <div v-if="uploadQuotationForm.fileName" class="file-selected">
            <el-icon><Document /></el-icon>
            <span>{{ uploadQuotationForm.fileName }}</span>
          </div>
        </el-form-item>
        <el-form-item label="备注说明">
          <el-input
            v-model="uploadQuotationForm.remarks"
            type="textarea"
            :rows="3"
            placeholder="请输入报价单的备注说明（可选）"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="uploadQuotationDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitQuotationPDF" :disabled="!uploadQuotationForm.file">
          上传
        </el-button>
      </template>
    </el-dialog>

    <!-- 分配工程师对话框 -->
    <el-dialog
      v-model="assignDialogVisible"
      title="分配工程师"
      width="560px"
      :close-on-click-modal="false"
    >
      <div v-if="assignWorkorderData" class="assign-dialog-content">
        <!-- 工单基础信息 -->
        <div class="assign-info-section">
          <div class="assign-section-title">工单信息</div>
          <div class="assign-info-row"><span class="label">工单号</span><span class="value">{{ assignWorkorderData.workorderId }}</span></div>
          <div class="assign-info-row"><span class="label">工单类型</span><span class="value">{{ getCategoryTextByCode(assignWorkorderData.category) }}{{ assignWorkorderData.subType ? '·' + getSubTypeText(assignWorkorderData.subType) : '' }}</span></div>
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

        <!-- 选择工程师 -->
        <el-form label-position="top">
          <el-form-item label="选择工程师" required>
            <el-select
              v-model="selectedEngineerIds"
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
        <el-button @click="assignDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmAssign" :disabled="selectedEngineerIds.length === 0">确认分配</el-button>
      </template>
    </el-dialog>

    <!-- 报价单详情对话框 -->
    <QuotationViewDialog
      v-model:visible="quotationViewVisible"
      :quotation="currentQuotation"
      @edit="handleEditQuotationFromView"
      @submit="handleSubmitQuotationFromView"
      @approve="handleApproveQuotationFromView"
      @send="handleSendQuotationFromView"
      @upload="handleUploadQuotationFromView"
      @create-version="handleCreateVersionFromView"
      @view-workorder="handleViewWorkorderFromQuotation"
    />
  </div>
</template>

<script>
import { ref, reactive, watch, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Plus, Tools, OfficeBuilding, Clock, InfoFilled, Box, Document, View, Download, PriceTag, Message, Check, Close, Upload, Delete, EditPen, Collection } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import ConfigurableTable from '../components/ConfigurableTable.vue'
import QuotationViewDialog from '../components/QuotationViewDialog.vue'
import {
  getWorkorderQuotationsByWorkorder,
  getQuotationsByWorkorder,
  QuotationStatus,
  createWorkorderQuotation,
  submitWorkorderQuotationForApproval,
  approveWorkorderQuotation
} from '../stores/quotationStore.js'
import { WorkorderCategory, WorkorderCategoryText, WorkorderSubType, WorkorderSubTypeText, WorkorderStatus, WorkorderStatusText, WorkorderStatusType, WorkorderFlowSteps, getCurrentStepIndex, getFlowStatusText, getFlowStatusType, state as workorderFlowState, createNotification, createWorkorder, saveToStorage, rejectWorkorder, assignWorkorder, acceptWorkorder, completeWorkorder, techLeadConfirm as doTechLeadConfirm, assistantConfirm as doAssistantConfirm, canAssignWorkorder, canAcceptWorkorder, canRejectWorkorder, canSubmitForSign, canSignWorkorder, canTechLeadConfirm, canAssistantConfirm, canCompleteDirectly, engineerList } from '../stores/workorderFlowStore.js'

export default {
  name: 'Workorder',
  components: {
    Plus,
    Tools,
    OfficeBuilding,
    Clock,
    InfoFilled,
    Box,
    Document,
    View,
    Download,
    PriceTag,
    Message,
    Check,
    Close,
    Upload,
    Delete,
    EditPen,
    Collection,
    ConfigurableTable,
    QuotationViewDialog,
  },
  setup() {
    const router = useRouter()
    const route = useRoute()
    const searchQuery = ref('')
    const filterCategory = ref('')
    const filterSubType = ref('')
    const workorderStatus = ref('')
    const currentPage = ref(1)
    const pageSize = ref(10)
    const total = ref(100)
    const dialogVisible = ref(false)
    const detailVisible = ref(false)
    const dialogTitle = ref('新增工单')

    // 是否移动端
    const isMobile = ref(false)

    // 检测是否为移动端
    const checkMobile = () => {
      isMobile.value = window.innerWidth <= 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    }

    // 处理工单流程更新事件
    const handleWorkorderFlowUpdate = (event) => {
      console.log('Workorder.vue 收到工单流程更新:', event.detail)
      loadWorkordersFromStore()
    }

    // 监听窗口大小变化
    onMounted(() => {
      checkMobile()
      window.addEventListener('resize', checkMobile)
      // 加载工单数据
      loadWorkordersFromStore()
      // 监听工单更新事件
      window.addEventListener('workorder-flow-updated', handleWorkorderFlowUpdate)
    })

    onUnmounted(() => {
      window.removeEventListener('resize', checkMobile)
      window.removeEventListener('workorder-flow-updated', handleWorkorderFlowUpdate)
    })

    // 表格列配置
    const tableColumns = [
      { prop: 'id', label: '工单号', width: 120, sortable: true, slot: true },
      { prop: 'type', label: '类型', width: 100, sortable: true, slot: true },
      { prop: 'customerName', label: '客户公司', minWidth: 150, sortable: true },
      { prop: 'assetSerialNumber', label: '设备序列号', width: 150, sortable: true },
      { prop: 'flowStatus', label: '流转状态', width: 120, sortable: true, slot: true },
      { prop: 'createTime', label: '创建时间', width: 180, sortable: true, slot: true },
      { prop: 'assignEngineer', label: '指派工程师', width: 120, sortable: true }
    ]

    // 获取类型标签类型
    const getCategoryTagType = (category) => category === 'installation' ? 'success' : 'warning'

    // 获取类型文本
    const getCategoryText = (row) => {
      if (row.category === 'installation') return '安装工单'
      if (row.subType) return '服务工单-' + (WorkorderSubTypeText[row.subType] || row.subType)
      return '服务工单'
    }

    // 获取状态标签类型
    const getStatusType = (status) => WorkorderStatusType[status] || 'info'

    // 获取工单类型标签类型（兼容旧引用）
    const getWorkorderTypeTag = (category) => category === 'installation' ? 'success' : 'warning'

    // 处理排序变化
    const handleSortChange = ({ prop, order }) => {
      console.log('排序', prop, order)
    }
    const form = reactive({
      id: '',
      category: 'service',
      subType: 'repair',
      customerId: '',
      customerPhone: '',
      customerAddress: '',
      assetModel: '',
      assetSerialNumber: '',
      warrantyStatus: '',
      description: '',
      assignEngineer: '',
      status: 'pending_assign',
      totalCostAmount: 0,
      totalSaleAmount: 0,
      totalProfitMargin: 0,
      partsList: []
    })

    // 客户选择变化时，自动带入电话、地址，并重置设备相关字段
    const onFormCustomerChange = (customerId) => {
      const customer = customers.value.find(c => c.id === customerId)
      if (customer) {
        form.customerPhone = customer.phone || ''
        form.customerAddress = customer.address || ''
      } else {
        form.customerPhone = ''
        form.customerAddress = ''
      }
      form.assetModel = ''
      form.assetSerialNumber = ''
      form.warrantyStatus = ''
    }

    // SN选择变化时，自动带入保修状态和型号
    const onFormSNChange = (sn) => {
      const asset = assets.value.find(a => a.serialNumber === sn && a.customerId === form.customerId)
      if (asset) {
        form.warrantyStatus = asset.warrantyStatus || ''
        if (!form.assetModel && asset.model) {
          form.assetModel = asset.model
        }
      } else {
        form.warrantyStatus = ''
      }
    }

    // 故障标签点击
    const onFaultTagClick = (tag) => {
      if (form.description) {
        form.description += '；' + tag.description
      } else {
        form.description = tag.description
      }
    }
    const onFormCategoryChange = (cat) => {
      if (cat === 'installation') form.subType = null
      else if (!form.subType) form.subType = 'repair'
    }
    const selectedWorkorder = ref({
      id: '',
      type: '',
      customerName: '',
      assetSerialNumber: '',
      description: '',
      status: '',
      createTime: '',
      assignEngineer: '',
      finishTime: '',
      processRecords: [],
      partsList: []
    })

    // 工单的报价记录列表 - 根据工单类型从不同数据源获取
    const workorderQuotations = computed(() => {
      // 使用 rawId（原始ID）查询关联数据，如果没有则使用 id
      const workorderId = selectedWorkorder.value?.rawId || selectedWorkorder.value?.id
      console.log('workorderQuotations computed:', {
        workorderId,
        rawId: selectedWorkorder.value?.rawId,
        id: selectedWorkorder.value?.id,
        type: selectedWorkorder.value?.type
      })
      if (workorderId) {
        return getWorkorderQuotationsByWorkorder(workorderId)
      }
      return []
    })

    // 报价单详情对话框
    const quotationViewVisible = ref(false)
    const currentQuotation = ref(null)

    // 获取工单的报价记录（现在使用 computed，此方法保留用于兼容）
    const loadWorkorderQuotations = (workorderId) => {
      // 已由 computed 属性自动处理
      console.log('加载工单报价记录:', workorderId)
    }

    const customers = ref([
      { id: 'cust_001', name: '上海某机械有限公司', phone: '021-55551234', address: '上海市浦东新区张江高科技园区XX路88号', contactPerson: '张经理' },
      { id: 'cust_002', name: '北京某设备制造有限公司', phone: '010-66667890', address: '北京市朝阳区望京科技园YY路12号', contactPerson: '李总' },
      { id: 'cust_003', name: '广州某工业设备有限公司', phone: '020-77773456', address: '广州市黄埔区开发区ZZ路56号', contactPerson: '王工' }
    ])

    const assets = ref([
      { id: 'asset_001', customerId: 'cust_001', model: 'CNC-A100', serialNumber: 'SN001', warrantyStatus: 'in_warranty', warrantyExpiry: '2027-03-15', installDate: '2025-03-15' },
      { id: 'asset_002', customerId: 'cust_001', model: 'CNC-A100', serialNumber: 'SN002', warrantyStatus: 'out_of_warranty', warrantyExpiry: '2026-01-10', installDate: '2024-01-10' },
      { id: 'asset_003', customerId: 'cust_001', model: 'LASER-B200', serialNumber: 'SN003', warrantyStatus: 'in_warranty', warrantyExpiry: '2027-06-20', installDate: '2025-06-20' },
      { id: 'asset_004', customerId: 'cust_002', model: 'PRESS-C300', serialNumber: 'SN004', warrantyStatus: 'expired', warrantyExpiry: '2025-02-01', installDate: '2023-02-01' },
      { id: 'asset_005', customerId: 'cust_002', model: 'CNC-A100', serialNumber: 'SN005', warrantyStatus: 'in_warranty', warrantyExpiry: '2027-09-01', installDate: '2025-09-01' },
      { id: 'asset_006', customerId: 'cust_003', model: 'LASER-B200', serialNumber: 'SN006', warrantyStatus: 'in_warranty', warrantyExpiry: '2027-12-01', installDate: '2025-12-01' },
      { id: 'asset_007', customerId: 'cust_003', model: 'PRESS-C300', serialNumber: 'SN007', warrantyStatus: 'out_of_warranty', warrantyExpiry: '2026-04-15', installDate: '2024-04-15' }
    ])

    const WarrantyStatusText = { in_warranty: '保内', out_of_warranty: '保外', expired: '过保' }
    const WarrantyStatusType = { in_warranty: 'success', out_of_warranty: 'warning', expired: 'danger' }

    const commonFaultTags = [
      { label: '无法启动', description: '设备无法正常启动，通电后无响应' },
      { label: '异响', description: '设备运行过程中出现异常响声' },
      { label: '漏油', description: '设备存在漏油现象，需检查密封件' },
      { label: '精度异常', description: '设备加工精度超出允许偏差范围' },
      { label: '过热报警', description: '设备运行中触发过热报警保护' }
    ]

    // 级联：客户 → 设备型号列表
    const customerModels = computed(() => {
      if (!form.customerId) return []
      const models = [...new Set(assets.value.filter(a => a.customerId === form.customerId).map(a => a.model))]
      return models
    })

    // 级联：客户+型号 → SN列表
    const customerSNs = computed(() => {
      if (!form.customerId) return []
      let filtered = assets.value.filter(a => a.customerId === form.customerId)
      if (form.assetModel) {
        filtered = filtered.filter(a => a.model === form.assetModel)
      }
      return filtered
    })

    // 获取当前用户角色（必须在 filteredWorkorders 之前定义）
    const currentUserRole = computed(() => {
      try {
        const staff = JSON.parse(localStorage.getItem('staffAuth') || '{}')
        return staff.role || 'admin'
      } catch { return 'admin' }
    })
    // 工程师不展示"待分配"筛选选项
    const showPendingAssignOption = computed(() => {
      return currentUserRole.value !== 'engineer'
    })

    // 工单列表（单一 computed，直接从 store reactive 数组读取，自动响应变化）
    // workorders: 直接引用 store 数据，供操作函数使用
    const workorders = computed(() => workorderFlowState.workorders)

    const filteredWorkorders = computed(() => {
      const source = workorderFlowState.workorders
      let list = [...source]
        .sort((a, b) => new Date(b.createTime) - new Date(a.createTime))
        .map(w => ({
          id: w.workorderId || w.id,
          rawId: w.id,
          category: w.category || 'service',
          subType: w.subType || 'repair',
          customerName: w.customerName || '',
          assetSerialNumber: w.serialNumber || '',
          status: w.status,
          flowStatus: w.status,
          createTime: w.createTime,
          assignEngineer: w.engineerName || '',
          faultDescription: w.faultDescription,
          address: w.address,
          customerPhone: w.customerPhone,
          warrantyStatus: w.warrantyStatus,
          processRecords: w.processRecords || [],
          createdBy: w.createdBy || { role: 'customer', name: w.customerName },
          partsList: w.partsList || [],
          totalCostAmount: w.totalCostAmount || 0,
          totalSaleAmount: w.totalSaleAmount || 0,
          totalProfitMargin: w.totalProfitMargin || 0,
          reportPdf: w.reportPdf
        }))

      // 工程师不展示待分配工单
      if (currentUserRole.value === 'engineer') {
        list = list.filter(w => w.status !== 'pending_assign')
      }

      if (filterCategory.value) {
        list = list.filter(w => w.category === filterCategory.value)
        if (filterSubType.value && filterCategory.value === 'service') {
          list = list.filter(w => w.subType === filterSubType.value)
        }
      }
      if (workorderStatus.value) {
        list = list.filter(w => w.status === workorderStatus.value)
      }
      if (searchQuery.value) {
        const q = searchQuery.value.toLowerCase()
        list = list.filter(w => (w.id && w.id.toLowerCase().includes(q)) || (w.customerName && w.customerName.includes(q)))
      }

      return list
    })

    // 用 watch 更新 total，避免在 computed 中产生副作用
    watch(filteredWorkorders, (newList) => {
      total.value = newList.length
    }, { immediate: true })

    const loadWorkordersFromStore = () => {
      // computed 已自动响应 store 变化，此函数保留仅用于接口兼容
    }

    // 监听路由变化，更新当前工单类型筛选
    watch(() => route.query.type, (newType) => {
      if (newType === 'installation' || newType === 'service') {
        filterCategory.value = newType
        filterSubType.value = ''
      }
    }, { immediate: true })


    const addPart = () => {
      form.partsList.push({
        partName: '',
        model: '',
        quantity: 1,
        costPrice: 0,
        salePrice: 0,
        costAmount: 0,
        saleAmount: 0,
        profitMargin: 0
      })
    }

    const removePart = (index) => {
      form.partsList.splice(index, 1)
    }

    const calculatePartAmounts = () => {
      form.partsList.forEach(part => {
        part.costAmount = part.quantity * part.costPrice
        part.saleAmount = part.quantity * part.salePrice
        if (part.saleAmount > 0) {
          part.profitMargin = ((part.saleAmount - part.costAmount) / part.saleAmount * 100).toFixed(2)
        } else {
          part.profitMargin = 0
        }
      })
      
      // 计算总金额和总利润率
      form.totalCostAmount = form.partsList.reduce((sum, part) => sum + part.costAmount, 0)
      form.totalSaleAmount = form.partsList.reduce((sum, part) => sum + part.saleAmount, 0)
      if (form.totalSaleAmount > 0) {
        form.totalProfitMargin = ((form.totalSaleAmount - form.totalCostAmount) / form.totalSaleAmount * 100).toFixed(2)
      } else {
        form.totalProfitMargin = 0
      }
    }

    // 当前联系人信息（模拟数据，实际应从登录信息或API获取）
    const currentContact = ref({
      id: 'C001',
      name: '张三',
      phone: '13800138000',
      email: 'zhangsan@example.com',
      companyName: '上海某机械有限公司',
      approvalStatus: '已通过', // 待审核/已通过/已拒绝/null
      approvalTime: '2026-01-15 10:30:00'
    })

    // 计算审核提示标题
    const getApprovalAlertTitle = computed(() => {
      const status = currentContact.value?.approvalStatus
      if (status === '待审核') return '注册申请审核中'
      if (status === '已拒绝') return '注册申请未通过'
      return '需要完成注册'
    })

    // 计算审核提示类型
    const getApprovalAlertType = computed(() => {
      const status = currentContact.value?.approvalStatus
      if (status === '待审核') return 'warning'
      if (status === '已拒绝') return 'error'
      return 'info'
    })

    const currentUserName = computed(() => {
      try {
        const staff = JSON.parse(localStorage.getItem('staffAuth') || '{}')
        return staff.name || staff.nickname || '管理员'
      } catch { return '管理员' }
    })
    const currentUserId = computed(() => {
      try {
        const staff = JSON.parse(localStorage.getItem('staffAuth') || '{}')
        return staff.id || staff.userId || staff.username || ''
      } catch { return '' }
    })

    // 检查是否可以编辑删除工单（仅待分配 + 创建人）
    const canEditWorkorder = (row) => {
      const role = currentUserRole.value
      if (role === 'admin') return true
      if (row.createdBy && row.createdBy.role === role) return true
      return false
    }

    // 检查是否可以创建工单
    const canCreateWorkorder = computed(() => {
      return currentContact.value?.approvalStatus === '已通过'
    })

    // 跳转到注册页面
    const goToRegister = () => {
      router.push('/contact-register')
    }

    const handleAddWorkorder = () => {
      if (!canCreateWorkorder.value) {
        ElMessage.warning('您需要先完成注册并通过审核才能发起工单')
        return
      }

      dialogTitle.value = '新增工单'
      Object.keys(form).forEach(key => {
        form[key] = ''
      })
      form.category = filterCategory.value || 'service'
      if (form.category === 'service') {
        form.subType = 'repair'
      } else {
        form.subType = null
      }
      form.status = 'pending_assign'
      form.totalCostAmount = 0
      form.totalSaleAmount = 0
      form.totalProfitMargin = 0
      form.partsList = []
      dialogVisible.value = true
    }

    const handleEditWorkorder = (row) => {
      dialogTitle.value = '编辑工单'
      // 从 store 中找到原始工单数据
      const rawWo = workorderFlowState.workorders.find(w => w.id === row.rawId || w.workorderId === row.id || w.id === row.id)
      if (rawWo) {
        const customer = customers.value.find(c => c.name === rawWo.customerName || c.id === rawWo.customerId)
        form.id = rawWo.workorderId || rawWo.id
        form.category = rawWo.category || 'service'
        form.subType = rawWo.subType || 'repair'
        form.customerId = customer ? customer.id : (rawWo.customerId || '')
        form.customerPhone = rawWo.customerPhone || (customer ? customer.phone : '')
        form.customerAddress = rawWo.address || (customer ? customer.address : '')
        form.assetModel = rawWo.deviceModel || ''
        form.assetSerialNumber = rawWo.serialNumber || ''
        form.warrantyStatus = rawWo.warrantyStatus || ''
        form.description = rawWo.faultDescription || ''
        form.assignEngineer = rawWo.engineerName || ''
        form.status = rawWo.status || 'pending_assign'
        form.totalCostAmount = rawWo.totalCostAmount || 0
        form.totalSaleAmount = rawWo.totalSaleAmount || 0
        form.totalProfitMargin = rawWo.totalProfitMargin || 0
        form.partsList = rawWo.partsList || []
      } else {
        // fallback：从 row 映射
        form.id = row.id
        form.category = row.category || 'service'
        form.subType = row.subType || 'repair'
        form.customerId = row.customerId || ''
        form.customerPhone = row.customerPhone || ''
        form.customerAddress = row.address || ''
        form.assetModel = row.assetModel || ''
        form.assetSerialNumber = row.assetSerialNumber || ''
        form.warrantyStatus = row.warrantyStatus || ''
        form.description = row.faultDescription || row.description || ''
        form.assignEngineer = row.assignEngineer || ''
        form.status = row.flowStatus || row.status || 'pending_assign'
        form.partsList = row.partsList || []
      }
      dialogVisible.value = true
    }

    const handleViewWorkorder = (row) => {
      console.log('handleViewWorkorder row:', { id: row.id, rawId: row.rawId, type: row.type })
      // 模拟数据
      selectedWorkorder.value = {
        ...row,
        description: '设备出现故障，需要维修',
        finishTime: row.flowStatus === 'completed' ? '2026-02-02 16:00:00' : '',
        flowStatus: row.flowStatus || WorkorderStatus.PENDING_ASSIGN,
        // 模拟报告数据（实际应从后端获取）
        report: row.report || {
          reportNo: 'SR' + row.id,
          serviceDate: '2026-02-01',
          faultDescription: '设备运行异常，出现异响和振动',
          solution: '更换轴承，调整皮带张力，清洁散热器',
          parts: [
            { name: '轴承', model: '6205-2RS', quantity: 2 },
            { name: '皮带', model: 'B-1200', quantity: 1 }
          ],
          result: '已修复',
          remark: '建议定期保养'
        },
        processRecords: row.processRecords || [
          { time: '2026-02-01 10:00:00', title: '工单创建', content: '客服创建维修工单', operator: '客服小王' },
          { time: '2026-02-01 10:30:00', title: '工单分配', content: '分配给王工程师', operator: '调度员' },
          { time: '2026-02-01 14:00:00', title: '开始维修', content: '工程师到达现场开始维修', operator: '王工程师' },
          { time: '2026-02-02 16:00:00', title: '维修完成', content: '设备故障已修复', operator: '王工程师' }
        ],
        partsList: row.partsList || [],
        totalCostAmount: 0,
        totalSaleAmount: 0,
        totalProfitMargin: 0
      }
      // 加载该工单的报价记录（使用原始ID查询关联数据）
      loadWorkorderQuotations(row.rawId || row.id)
      detailVisible.value = true
    }

    // 更新选中的工单（用于配置化流程）
    const updateSelectedWorkorder = (updatedWorkorder) => {
      // 更新选中的工单
      selectedWorkorder.value = { ...selectedWorkorder.value, ...updatedWorkorder }
      
      // 更新 store 中的对应工单
      const index = workorders.value.findIndex(w => w.id === updatedWorkorder.id || w.workorderId === updatedWorkorder.id)
      if (index !== -1) {
        Object.assign(workorders.value[index], updatedWorkorder)
        saveToStorage()
      }
      
      ElMessage.success(`工单状态已更新：${getFlowStatusText(updatedWorkorder.flowStatus)}`)
    }
    
    // 刷新数据（computed 已自动响应 store 变化）
    const handleRefresh = () => {
      ElMessage.success('数据已刷新')
    }

    // 管理员直接完成工单
    const handleDirectComplete = () => {
      const wo = workorderFlowState.workorders.find(w => w.workorderId === selectedWorkorder.value.id || w.id === selectedWorkorder.value.rawId)
      if (wo) {
        wo.status = 'completed'
        wo.completeTime = new Date().toISOString()
        saveToStorage()
        ElMessage.success('工单已完成')
        detailVisible.value = false
      }
    }

    // 角色操作按钮定义（按角色权限显示）
    const detailActions = computed(() => {
      const workorder = selectedWorkorder.value
      if (!workorder || !workorder.flowStatus) return []
      const role = currentUserRole.value
      const uid = currentUserId.value
      const actions = []

      if (canAssignWorkorder(role, workorder)) {
        actions.push({ key: 'assign', label: '分配工程师', type: 'primary' })
      }
      if (canAcceptWorkorder(role, workorder, uid)) {
        actions.push({ key: 'accept', label: '接单', type: 'success' })
      }
      if (canRejectWorkorder(role, workorder, uid)) {
        actions.push({ key: 'reject', label: '弃单', type: 'danger' })
      }
      if (canSubmitForSign(role, workorder, uid)) {
        actions.push({ key: 'complete', label: '完成', type: 'success' })
      }
      if (canTechLeadConfirm(role)) {
        actions.push({ key: 'tlConfirm', label: '课长确认', type: 'primary' })
      }
      if (canAssistantConfirm(role)) {
        actions.push({ key: 'asstConfirm', label: '业务确认', type: 'primary' })
      }
      return actions
    })

    const detailActionHandlers = {
      assign: async () => {
        try {
          const { value: engineerName } = await ElMessageBox.prompt('请输入工程师姓名', '分配工程师')
          if (engineerName) {
            const wo = workorderFlowState.workorders.find(w => w.workorderId === selectedWorkorder.value.id || w.id === selectedWorkorder.value.rawId)
            if (wo) {
              assignWorkorder(wo.id, `eng_${Date.now()}`, engineerName, '')
              ElMessage.success(`已分配给 ${engineerName}`)
              loadWorkordersFromStore()
              detailVisible.value = false
            }
          }
        } catch { /* 取消 */ }
      },
      accept: () => {
        ElMessageBox.confirm('确认接单？', '接单确认', { type: 'info' }).then(() => {
          const wo = workorderFlowState.workorders.find(w => w.workorderId === selectedWorkorder.value.id || w.id === selectedWorkorder.value.rawId)
          if (wo) acceptWorkorder(wo.id)
          ElMessage.success('已接单')
          loadWorkordersFromStore()
          detailVisible.value = false
        }).catch(() => {})
      },
      reject: () => {
        ElMessageBox.prompt('请输入弃单原因', '弃单', { type: 'warning' }).then(({ value: reason }) => {
          const wo = workorderFlowState.workorders.find(w => w.workorderId === selectedWorkorder.value.id || w.id === selectedWorkorder.value.rawId)
          if (wo) {
            rejectWorkorder(wo.id, reason)
            ElMessage.success('已弃单，工单返回待分配')
            loadWorkordersFromStore()
            detailVisible.value = false
          }
        }).catch(() => {})
      },
      tlConfirm: () => {
        ElMessageBox.confirm('确认此工单已完成？', '课长确认', { type: 'info' }).then(() => {
          const wo = workorderFlowState.workorders.find(w => w.workorderId === selectedWorkorder.value.id || w.id === selectedWorkorder.value.rawId)
          if (wo) doTechLeadConfirm(wo.id)
          ElMessage.success('课长已确认')
          loadWorkordersFromStore()
          detailVisible.value = false
        }).catch(() => {})
      },
      asstConfirm: () => {
        ElMessageBox.confirm('确认此工单？', '业务确认', { type: 'info' }).then(() => {
          const wo = workorderFlowState.workorders.find(w => w.workorderId === selectedWorkorder.value.id || w.id === selectedWorkorder.value.rawId)
          if (wo) doAssistantConfirm(wo.id)
          ElMessage.success('业务已确认，工单完成')
          loadWorkordersFromStore()
          detailVisible.value = false
        }).catch(() => {})
      },
      complete: () => {
        ElMessageBox.confirm('确认完成此工单？', '完成确认', { type: 'info' }).then(() => {
          const wo = workorderFlowState.workorders.find(w => w.workorderId === selectedWorkorder.value.id || w.id === selectedWorkorder.value.rawId)
          if (wo) completeWorkorder(wo.id)
          ElMessage.success('工单已提交签字')
          loadWorkordersFromStore()
          detailVisible.value = false
        }).catch(() => {})
      },
    }

    // 处理工单流转状态变化（旧版，保留兼容性）
    const handleFlowStatusChange = ({ action, workorder, newStatus, data }) => {
      // 更新工单状态
      const index = workorders.value.findIndex(w => w.id === workorder.id || w.workorderId === workorder.id)
      if (index !== -1) {
        workorders.value[index].status = newStatus

        // 更新选中的工单
        selectedWorkorder.value.flowStatus = newStatus
        selectedWorkorder.value.status = newStatus

        // 如果有额外数据，更新到工单
        if (data) {
          if (data.engineer) {
            workorders.value[index].engineerName = data.engineer
            selectedWorkorder.value.assignEngineer = data.engineer
          }
          
          // 处理外勤打卡联动数据
          if (data.fieldServiceData) {
            const fieldData = data.fieldServiceData
            
            // 保存外勤打卡记录ID到工单，便于关联
            if (!workorders.value[index].fieldServiceRecords) {
              workorders.value[index].fieldServiceRecords = []
            }
            
            // 根据操作类型处理
            if (action === 'arrive') {
              // 到场打卡 - 创建外勤打卡记录
              const checkInRecord = {
                id: `CK${Date.now()}`,
                workorderId: workorder.id,
                type: '工单打卡',
                customerName: fieldData.customerName,
                checkInTime: fieldData.checkInTime,
                checkInLocation: fieldData.checkInLocation,
                photos: fieldData.photos,
                remark: fieldData.remark,
                status: '进行中',
                createTime: new Date().toISOString()
              }
              workorders.value[index].fieldServiceRecords.push(checkInRecord)
              selectedWorkorder.value.fieldServiceRecords = [...workorders.value[index].fieldServiceRecords]
              
              // 同时保存当前打卡记录ID，用于后续签离关联
              workorders.value[index].currentCheckInId = checkInRecord.id
              selectedWorkorder.value.currentCheckInId = checkInRecord.id
              
              console.log('外勤打卡记录已创建:', checkInRecord)
            } else if (action === 'complete') {
              // 完工打卡 - 更新外勤签离信息
              const currentCheckInId = workorders.value[index].currentCheckInId
              if (currentCheckInId) {
                const recordIndex = workorders.value[index].fieldServiceRecords.findIndex(
                  r => r.id === currentCheckInId
                )
                if (recordIndex !== -1) {
                  workorders.value[index].fieldServiceRecords[recordIndex].checkOutTime = fieldData.checkOutTime
                  workorders.value[index].fieldServiceRecords[recordIndex].checkOutLocation = fieldData.checkOutLocation
                  workorders.value[index].fieldServiceRecords[recordIndex].duration = fieldData.duration
                  workorders.value[index].fieldServiceRecords[recordIndex].workContent = fieldData.workContent
                  workorders.value[index].fieldServiceRecords[recordIndex].status = '已签离'
                  
                  selectedWorkorder.value.fieldServiceRecords = [...workorders.value[index].fieldServiceRecords]
                  
                  console.log('外勤签离记录已更新:', workorders.value[index].fieldServiceRecords[recordIndex])
                }
              }
              
              // 更新工单完成时间
              workorders.value[index].finishTime = fieldData.checkOutTime
              selectedWorkorder.value.finishTime = fieldData.checkOutTime
            }
          }
          
          // 处理报告数据
          if (data.report) {
            workorders.value[index].report = data.report
            selectedWorkorder.value.report = data.report
          }
          
          // 触发外勤数据同步事件（供外勤管理页面监听）
          if (data.fieldServiceData) {
            window.dispatchEvent(new CustomEvent('workorder-fieldservice-sync', {
              detail: {
                workorderId: workorder.id,
                action: action,
                fieldData: data.fieldServiceData
              }
            }))
          }
        }
      }
      
      // 处理PDF保存（独立处理，不依赖工单状态更新）
      if (action === 'saveReportPDF' && data) {
        const index = workorders.value.findIndex(w => w.id === workorder.id || w.workorderId === workorder.id)
        if (index !== -1) {
          workorders.value[index].reportPDF = {
            signImage: data.signImage,
            pdfDataUrl: data.pdfDataUrl,
            generatedAt: data.generatedAt,
            fileName: `作业报告书_${workorder.id}_${new Date().toISOString().split('T')[0]}.html`
          }
          selectedWorkorder.value.reportPDF = { ...workorders.value[index].reportPDF }
          saveToStorage()
          ElMessage.success('作业报告书PDF已保存到工单')
        }
        return
      }
      
      ElMessage.success(`工单状态已更新：${getFlowStatusText(newStatus)}`)
      saveToStorage()
    }

    // 预览作业报告书PDF
    const previewReportPDF = () => {
      if (!selectedWorkorder.value.reportPdf) {
        ElMessage.warning('报告PDF不存在')
        return
      }
      const win = window.open('', '_blank')
      if (win) {
        win.document.write(`<iframe src="${selectedWorkorder.value.reportPdf}" width="100%" height="100%" frameborder="0"></iframe>`)
      } else {
        ElMessage.warning('请允许弹出窗口以预览PDF')
      }
    }

    // 下载作业报告书PDF
    const downloadReportPDF = () => {
      if (!selectedWorkorder.value.reportPdf) {
        ElMessage.warning('报告PDF不存在')
        return
      }
      const link = document.createElement('a')
      link.href = selectedWorkorder.value.reportPdf
      link.download = `服务报告书_${selectedWorkorder.value.id}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      ElMessage.success('PDF下载中')
    }

    const handleDeleteWorkorder = (id) => {
      const index = workorders.value.findIndex(w => w.id === id || w.workorderId === id)
      if (index !== -1) {
        workorders.value.splice(index, 1)
        saveToStorage()
        ElMessage.success('工单已删除')
      }
    }

    // ========== 快速操作按钮处理 ==========
    const assignDialogVisible = ref(false)
    const assignTargetId = ref('')
    const selectedEngineerIds = ref([])
    const assignWorkorderData = ref(null)
    const assignFormData = reactive({
      workContent: '',
      workStartTime: null,
      workEndTime: null,
      vehicle: 'self'
    })

    const getCategoryTextByCode = (cat) => {
      const map = { installation: '安装工单', service: '服务工单' }
      return map[cat] || cat
    }
    const getSubTypeText = (sub) => {
      const map = { repair: '维修', trial_processing: '试加工', refitting: '改造' }
      return map[sub] || sub
    }
    const getWarrantyText = (ws) => {
      const map = { in_warranty: '保内', out_of_warranty: '保外', expired: '过保', unknown: '未知' }
      return map[ws] || ws
    }
    const getWarrantyTagType = (ws) => {
      const map = { in_warranty: 'success', out_of_warranty: 'warning', expired: 'danger', unknown: 'info' }
      return map[ws] || 'info'
    }

    const handleQuickAssign = (row) => {
      const rawId = row.rawId || row.id
      assignTargetId.value = rawId
      selectedEngineerIds.value = []
      assignFormData.workContent = ''
      assignFormData.workStartTime = null
      assignFormData.workEndTime = null
      assignFormData.vehicle = 'self'
      // 获取工单完整数据
      const wo = workorderFlowState.workorders.find(w => w.id === rawId)
      assignWorkorderData.value = wo || null
      assignDialogVisible.value = true
    }

    const confirmAssign = () => {
      if (selectedEngineerIds.value.length === 0) {
        ElMessage.warning('请选择工程师')
        return
      }
      // 第一个工程师作为主工程师
      const primaryEng = engineerList.find(e => e.id === selectedEngineerIds.value[0])
      if (!primaryEng) return
      const engineers = selectedEngineerIds.value.map(id => {
        const eng = engineerList.find(e => e.id === id)
        return eng ? { id: eng.id, name: eng.name, phone: eng.phone } : null
      }).filter(Boolean)
      assignWorkorder(assignTargetId.value, primaryEng.id, primaryEng.name, primaryEng.phone, {
        engineers,
        workContent: assignFormData.workContent,
        workStartTime: assignFormData.workStartTime || '',
        workEndTime: assignFormData.workEndTime || '',
        vehicle: assignFormData.vehicle
      })
      ElMessage.success(`已分配给 ${primaryEng.name}${engineers.length > 1 ? ` 等${engineers.length}人` : ''}`)
      assignDialogVisible.value = false
      loadWorkordersFromStore()
    }

    const handleQuickAccept = (row) => {
      const rawId = row.rawId || row.id
      ElMessageBox.confirm('确认接单？', '接单确认', { type: 'info' }).then(() => {
        acceptWorkorder(rawId)
        ElMessage.success('已接单')
        loadWorkordersFromStore()
      }).catch(() => {})
    }

    const handleQuickReject = (row) => {
      const rawId = row.rawId || row.id
      ElMessageBox.prompt('请输入弃单原因', '弃单', { type: 'warning' }).then(({ value: reason }) => {
        rejectWorkorder(rawId, reason)
        ElMessage.success('已弃单，工单返回待分配')
        loadWorkordersFromStore()
      }).catch(() => {})
    }

    const handleQuickTLConfirm = (row) => {
      const rawId = row.rawId || row.id
      ElMessageBox.confirm('确认此工单已完成？', '课长确认', { type: 'info' }).then(() => {
        doTechLeadConfirm(rawId)
        ElMessage.success('课长已确认')
        loadWorkordersFromStore()
      }).catch(() => {})
    }

    const handleQuickAsstConfirm = (row) => {
      const rawId = row.rawId || row.id
      ElMessageBox.confirm('确认此工单？', '业务确认', { type: 'info' }).then(() => {
        doAssistantConfirm(rawId)
        ElMessage.success('业务已确认，工单完成')
        loadWorkordersFromStore()
      }).catch(() => {})
    }

    const handleQuickComplete = (row) => {
      const rawId = row.rawId || row.id
      ElMessageBox.confirm('确认完成此工单？', '完成确认', { type: 'info' }).then(() => {
        completeWorkorder(rawId)
        ElMessage.success('工单已提交签字')
        loadWorkordersFromStore()
      }).catch(() => {})
    }

    const handleSubmit = () => {
      console.log('[Workorder] handleSubmit 开始')
      try {
        if (form.category === 'parts_sales') {
          calculatePartAmounts()
        }

        if (dialogTitle.value === '新增工单') {
          const customer = customers.value.find(c => c.id === form.customerId)
          createWorkorder({
            category: form.category,
            subType: form.category === 'service' ? form.subType : null,
            customerId: form.customerId,
            customerName: customer ? customer.name : '未知',
            customerPhone: form.customerPhone || '',
            address: form.customerAddress || '',
            deviceModel: form.assetModel || '',
            serialNumber: form.assetSerialNumber || '',
            warrantyStatus: form.warrantyStatus || '',
            faultDescription: form.description || '',
            partsList: form.partsList || [],
            totalCostAmount: form.totalCostAmount || 0,
            totalSaleAmount: form.totalSaleAmount || 0,
            totalProfitMargin: form.totalProfitMargin || 0
          }, currentUserRole.value, currentUserName.value)
          console.log('[Workorder] createWorkorder 完成, store 中共', workorderFlowState.workorders.length, '条工单')
          ElMessage.success('工单创建成功')
          loadWorkordersFromStore()
        } else {
          const idx = workorderFlowState.workorders.findIndex(w => w.id === form.id || w.workorderId === form.id)
          if (idx !== -1) {
            const customer = customers.value.find(c => c.id === form.customerId)
            workorderFlowState.workorders[idx].customerName = customer ? customer.name : ''
            workorderFlowState.workorders[idx].category = form.category
            workorderFlowState.workorders[idx].subType = form.subType
            workorderFlowState.workorders[idx].engineerName = form.assignEngineer
            workorderFlowState.workorders[idx].status = form.status
            workorderFlowState.workorders[idx].faultDescription = form.description
            saveToStorage()
            console.log('[Workorder] 工单编辑已保存, store 中共', workorderFlowState.workorders.length, '条')
            ElMessage.success('工单更新成功')
            loadWorkordersFromStore()
          }
        }
      } catch (e) {
        console.error('[Workorder] handleSubmit 异常:', e)
        ElMessage.error('提交失败: ' + (e.message || '未知错误'))
        return
      }
      setTimeout(() => { dialogVisible.value = false }, 0)
    }

    const handleSearch = () => {
      // 模拟搜索
      console.log('搜索', searchQuery.value, filterCategory.value, workorderStatus.value)
    }

    const handleSizeChange = (size) => {
      pageSize.value = size
    }

    const handleCurrentChange = (current) => {
      currentPage.value = current
    }

    const handleGeneratePDF = () => {
      // 模拟生成PDF
      console.log('生成PDF报告')
    }

    const handleViewPDF = () => {
      // 模拟查看PDF
      console.log('查看PDF报告')
    }

    const handleSendPDF = () => {
      // 模拟发送PDF
      console.log('发送PDF报告')
    }

    // 报价单状态相关函数
    const getQuotationStatusType = (status) => {
      const typeMap = {
        [QuotationStatus.DRAFT]: 'info',
        [QuotationStatus.PENDING]: 'warning',
        [QuotationStatus.REVIEWING]: 'warning',
        [QuotationStatus.APPROVED]: 'success',
        [QuotationStatus.REJECTED]: 'danger',
        [QuotationStatus.SENT]: 'primary',
        [QuotationStatus.CONFIRMED]: 'success',
        [QuotationStatus.EXPIRED]: 'info',
        [QuotationStatus.CANCELLED]: 'info'
      }
      return typeMap[status] || 'info'
    }

    const getQuotationStatusText = (status) => {
      const textMap = {
        [QuotationStatus.DRAFT]: '草稿',
        [QuotationStatus.PENDING]: '待审核',
        [QuotationStatus.REVIEWING]: '审核中',
        [QuotationStatus.APPROVED]: '已通过',
        [QuotationStatus.REJECTED]: '已驳回',
        [QuotationStatus.SENT]: '已发送',
        [QuotationStatus.CONFIRMED]: '已确认',
        [QuotationStatus.EXPIRED]: '已过期',
        [QuotationStatus.CANCELLED]: '已取消'
      }
      return textMap[status] || status
    }

    // 格式化金额
    const formatAmount = (amount) => {
      if (amount === undefined || amount === null) return '0.00'
      return amount.toLocaleString('zh-CN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })
    }

    // 格式化日期时间
    const formatDateTime = (dateStr) => {
      if (!dateStr) return '-'
      const date = new Date(dateStr)
      return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    }

    // 上传报价单PDF对话框
    const uploadQuotationDialogVisible = ref(false)
    const uploadQuotationForm = reactive({
      file: null,
      fileName: '',
      fileUrl: '',
      remarks: ''
    })

    // 处理上传报价单PDF
    const handleUploadQuotationPDF = () => {
      uploadQuotationForm.file = null
      uploadQuotationForm.fileName = ''
      uploadQuotationForm.fileUrl = ''
      uploadQuotationForm.remarks = ''
      uploadQuotationDialogVisible.value = true
    }

    // 处理文件选择
    const handleQuotationFileChange = (file) => {
      uploadQuotationForm.file = file
      uploadQuotationForm.fileName = file.name
      // 模拟上传，生成URL
      uploadQuotationForm.fileUrl = URL.createObjectURL(file.raw)
    }

    // 提交报价单PDF - 使用维修工单专用的 quotationStore 方法
    const submitQuotationPDF = () => {
      if (!uploadQuotationForm.file) {
        ElMessage.warning('请先选择报价单PDF文件')
        return
      }

      // 使用 createWorkorderQuotation 创建维修工单报价单
      const quotationData = {
        customerId: selectedWorkorder.value.customerId || '',
        customerName: selectedWorkorder.value.customerName,
        workorderId: selectedWorkorder.value.id,
        workorderNo: selectedWorkorder.value.id,
        contactName: selectedWorkorder.value.contactName || selectedWorkorder.value.customerName,
        contactPhone: selectedWorkorder.value.contactPhone || '',
        pdfUrl: uploadQuotationForm.fileUrl,
        fileName: uploadQuotationForm.fileName,
        remark: uploadQuotationForm.remarks,
        totalAmount: 0, // 可以从PDF中识别或手动填写
        validDays: 7
      }

      // 创建维修工单报价单
      const quotation = createWorkorderQuotation(quotationData)

      if (quotation) {
        ElMessage.success('报价单上传成功，请提交审核')
        uploadQuotationDialogVisible.value = false
      } else {
        ElMessage.error('报价单创建失败')
      }
    }

    // 保存工单报价记录到 localStorage（保留用于兼容，实际由 quotationStore 管理）
    const saveWorkorderQuotations = () => {
      // 已由 quotationStore 统一管理，此方法保留用于兼容
      console.log('报价单已由 quotationStore 统一管理')
    }

    // 提交报价单审核 - 使用维修工单专用的 quotationStore 方法
    const handleSubmitQuotationForApproval = (quotation) => {
      ElMessageBox.confirm(
        '提交后将通知课长审核，是否继续？',
        '确认提交',
        {
          confirmButtonText: '确认提交',
          cancelButtonText: '取消',
          type: 'warning'
        }
      ).then(() => {
        try {
          // 使用维修工单专用的提交审核方法
          submitWorkorderQuotationForApproval(quotation.id)

          // 创建通知给课长
          createNotification({
            type: 'quotation_pending',
            title: '报价单待审核',
            content: `工单 ${selectedWorkorder.value.id} 的报价单已提交，请审核`,
            targetRole: 'techLead',
            workorderId: selectedWorkorder.value.id,
            quotationId: quotation.id,
            createdAt: new Date().toISOString()
          })

          // 更新工单状态为审核中
          updateWorkorderStatus(selectedWorkorder.value.id, 'quotation_approving')

          ElMessage.success('报价单已提交审核，等待课长审批')
        } catch (error) {
          ElMessage.error(error.message || '提交审核失败')
        }
      }).catch(() => {
        // 取消提交
      })
    }

    // 更新工单状态
    const updateWorkorderStatus = (workorderId, newStatus) => {
      const workorder = workorders.value.find(w => w.id === workorderId || w.workorderId === workorderId)
      if (workorder) {
        workorder.status = newStatus
        workorder.flowStatus = newStatus
        workorder.updateTime = new Date().toISOString()
        
        // 添加流程记录
        if (!workorder.processRecords) {
          workorder.processRecords = []
        }
        workorder.processRecords.push({
          time: new Date().toISOString(),
          title: '报价单提交审核',
          content: '业务助理已上传报价单并提交审核',
          operator: '业务助理',
          operatorType: 'assistant'
        })

        // 保存到 store
        const storeWorkorder = workorderFlowState.workorders.find(w => w.id === workorderId || w.workorderId === workorderId)
        if (storeWorkorder) {
          storeWorkorder.status = newStatus
          storeWorkorder.updateTime = workorder.updateTime
          storeWorkorder.processRecords = workorder.processRecords
        }

        // 触发事件通知其他组件
        window.dispatchEvent(new CustomEvent('workorder-flow-updated', {
          detail: { workorderId, status: newStatus }
        }))
      }
    }

    // 从工单发起报价单
    const handleCreateQuotation = () => {
      // 跳转到报价单页面，并传递工单ID
      router.push({
        path: '/quotation',
        query: {
          workorderId: selectedWorkorder.value.id,
          workorderNo: selectedWorkorder.value.id,
          customerName: selectedWorkorder.value.customerName,
          fromWorkorder: 'true'
        }
      })
    }

    // 查看报价单详情
    const handleViewQuotation = (quotation) => {
      currentQuotation.value = quotation
      quotationViewVisible.value = true
    }

    // 从报价单详情编辑报价单
    const handleEditQuotationFromView = () => {
      quotationViewVisible.value = false
      detailVisible.value = false
      // 跳转到报价单页面并传递编辑参数
      router.push({
        path: '/quotation',
        query: {
          edit: 'true',
          quotationId: currentQuotation.value?.id,
          fromWorkorder: 'true'
        }
      })
    }

    // 从报价单详情提交审核 - 使用维修工单专用的 quotationStore 方法
    const handleSubmitQuotationFromView = () => {
      try {
        if (currentQuotation.value?.id) {
          submitWorkorderQuotationForApproval(currentQuotation.value.id)
          ElMessage.success('报价单已提交审核')
          quotationViewVisible.value = false
        }
      } catch (error) {
        ElMessage.error(error.message || '提交审核失败')
      }
    }

    // 从报价单详情审核 - 显示审核对话框
    const handleApproveQuotationFromView = () => {
      // 检查当前用户是否是课长或部长
      const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
      const isTechLead = userInfo.role === '课长' || userInfo.role === '部长' || userInfo.role === 'techLead' || userInfo.role === 'director' || userInfo.isManager

      if (!isTechLead) {
        ElMessage.warning('只有课长或部长可以审核报价单')
        return
      }

      // 显示审核对话框
      ElMessageBox.confirm(
        '请选择审核结果：',
        '报价单审核',
        {
          distinguishCancelAndClose: true,
          confirmButtonText: '通过',
          cancelButtonText: '驳回',
          confirmButtonClass: 'el-button--success',
          cancelButtonClass: 'el-button--danger',
          type: 'warning'
        }
      ).then(() => {
        // 通过审核
        approveQuotationLocal(currentQuotation.value)
      }).catch((action) => {
        if (action === 'cancel') {
          // 驳回审核
          rejectQuotationLocal(currentQuotation.value)
        }
      })
    }

    // 通过报价单审核 - 使用维修工单专用的 quotationStore 方法
    const approveQuotationLocal = (quotation) => {
      if (!quotation) return

      try {
        // 使用维修工单专用的审批方法
        approveWorkorderQuotation(quotation.id, {
          action: 'approve',
          operator: '课长',
          comment: '审核通过'
        })

        // 更新工单状态为待发送
        updateWorkorderStatusForQuotation(selectedWorkorder.value?.id, 'quotation_approved')

        // 创建通知给业务助理
        createNotification({
          type: 'quotation_approved',
          title: '报价单审核通过',
          content: `工单 ${selectedWorkorder.value?.id} 的报价单已通过课长审核，请发送给客户`,
          targetRole: 'assistant',
          workorderId: selectedWorkorder.value?.id,
          quotationId: quotation.id,
          createdAt: new Date().toISOString()
        })

        ElMessage.success('报价单已通过审核')
        quotationViewVisible.value = false
      } catch (error) {
        ElMessage.error(error.message || '审核失败')
      }
    }

    // 驳回报价单审核 - 使用维修工单专用的 quotationStore 方法
    const rejectQuotationLocal = (quotation) => {
      if (!quotation) return

      try {
        // 使用维修工单专用的审批方法
        approveWorkorderQuotation(quotation.id, {
          action: 'reject',
          operator: '课长',
          comment: '审核不通过'
        })

        // 更新工单状态为待重新报价
        updateWorkorderStatusForQuotation(selectedWorkorder.value?.id, 'quotation_rejected')

        // 创建通知给业务助理
        createNotification({
          type: 'quotation_rejected',
          title: '报价单被驳回',
          content: `工单 ${selectedWorkorder.value?.id} 的报价单未通过审核，请修改后重新提交`,
          targetRole: 'assistant',
          workorderId: selectedWorkorder.value?.id,
          quotationId: quotation.id,
          createdAt: new Date().toISOString()
        })

        ElMessage.warning('报价单已驳回')
        quotationViewVisible.value = false
      } catch (error) {
        ElMessage.error(error.message || '驳回失败')
      }
    }

    // 更新工单报价状态
    const updateWorkorderStatusForQuotation = (workorderId, newStatus) => {
      if (!workorderId) return

      const workorder = workorders.value.find(w => w.id === workorderId || w.workorderId === workorderId)
      if (workorder) {
        const statusMap = {
          'quotation_approved': '报价已通过',
          'quotation_rejected': '报价被驳回',
          'quotation_sent': '报价已发送',
          'quotation_confirmed': '报价已确认'
        }

        workorder.status = statusMap[newStatus] || workorder.status
        workorder.flowStatus = newStatus
        workorder.updateTime = new Date().toISOString()

        // 添加流程记录
        if (!workorder.processRecords) {
          workorder.processRecords = []
        }

        const recordMap = {
          'quotation_approved': {
            title: '报价单审核通过',
            content: '课长已通过报价单审核',
            operator: '课长',
            operatorType: 'techLead'
          },
          'quotation_rejected': {
            title: '报价单审核驳回',
            content: '课长驳回报价单，请修改后重新提交',
            operator: '课长',
            operatorType: 'techLead'
          },
          'quotation_sent': {
            title: '报价单发送客户',
            content: '业务助理已将报价单发送给客户',
            operator: '业务助理',
            operatorType: 'assistant'
          },
          'quotation_confirmed': {
            title: '客户确认报价',
            content: '客户已确认报价单',
            operator: '客户',
            operatorType: 'customer'
          }
        }

        const record = recordMap[newStatus]
        if (record) {
          workorder.processRecords.push({
            time: new Date().toISOString(),
            ...record
          })
        }

        // 保存到 store
        const storeWorkorder = workorderFlowState.workorders.find(w => w.id === workorderId || w.workorderId === workorderId)
        if (storeWorkorder) {
          storeWorkorder.status = newStatus
          storeWorkorder.updateTime = workorder.updateTime
          storeWorkorder.processRecords = workorder.processRecords
        }

        // 触发事件通知其他组件
        window.dispatchEvent(new CustomEvent('workorder-flow-updated', {
          detail: { workorderId, status: newStatus }
        }))
      }
    }

    // 从报价单详情发送客户
    const handleSendQuotationFromView = () => {
      if (!currentQuotation.value) {
        ElMessage.warning('请先选择报价单')
        return
      }

      // 检查报价单状态
      if (currentQuotation.value.status !== QuotationStatus.APPROVED) {
        ElMessage.warning('报价单未通过审核，无法发送给客户')
        return
      }

      ElMessageBox.confirm(
        '发送后客户将收到报价单并可以进行签字确认，是否继续？',
        '确认发送',
        {
          confirmButtonText: '确认发送',
          cancelButtonText: '取消',
          type: 'info'
        }
      ).then(() => {
        // 更新报价单状态
        currentQuotation.value.status = QuotationStatus.SENT
        currentQuotation.value.sentAt = new Date().toISOString()
        currentQuotation.value.updatedAt = new Date().toISOString()

        // 保存到 localStorage
        saveWorkorderQuotations()

        // 更新工单状态
        updateWorkorderStatusForQuotation(selectedWorkorder.value?.id, 'quotation_sent')

        // 创建通知给客户
        createNotification({
          type: 'quotation_sent',
          title: '报价单待确认',
          content: `您有一个报价单待确认，请查看并签字`,
          targetRole: 'customer',
          workorderId: selectedWorkorder.value?.id,
          quotationId: currentQuotation.value.id,
          createdAt: new Date().toISOString()
        })

        ElMessage.success('报价单已发送给客户，等待客户确认')
        quotationViewVisible.value = false
      }).catch(() => {
        // 取消发送
      })
    }

    // 从报价单详情上传回传（客户签字确认）
    const handleUploadQuotationFromView = () => {
      if (!currentQuotation.value) {
        ElMessage.warning('请先选择报价单')
        return
      }

      // 检查报价单状态
      if (currentQuotation.value.status !== QuotationStatus.SENT) {
        ElMessage.warning('报价单未发送给客户，无法确认')
        return
      }

      ElMessageBox.confirm(
        '确认客户已签字同意该报价单？',
        '客户确认',
        {
          confirmButtonText: '确认签字',
          cancelButtonText: '取消',
          type: 'success'
        }
      ).then(() => {
        // 更新报价单状态
        currentQuotation.value.status = QuotationStatus.CONFIRMED
        currentQuotation.value.confirmedAt = new Date().toISOString()
        currentQuotation.value.updatedAt = new Date().toISOString()

        // 保存到 localStorage
        saveWorkorderQuotations()

        // 更新工单状态为已确认，可以继续后续流程
        updateWorkorderStatusForQuotation(selectedWorkorder.value?.id, 'quotation_confirmed')

        // 创建通知给业务助理
        createNotification({
          type: 'quotation_confirmed',
          title: '客户已确认报价',
          content: `工单 ${selectedWorkorder.value?.id} 的报价单已获得客户确认`,
          targetRole: 'assistant',
          workorderId: selectedWorkorder.value?.id,
          quotationId: currentQuotation.value.id,
          createdAt: new Date().toISOString()
        })

        ElMessage.success('客户已确认报价单，可以继续后续服务流程')
        quotationViewVisible.value = false
      }).catch(() => {
        // 取消确认
      })
    }

    // 从报价单详情创建新版本
    const handleCreateVersionFromView = () => {
      ElMessage.info('创建新版本功能')
      quotationViewVisible.value = false
    }

    // 从报价单详情查看关联工单
    const handleViewWorkorderFromQuotation = (workorderId) => {
      ElMessage.info(`查看工单: ${workorderId}`)
      quotationViewVisible.value = false
    }

    // 查看报价单PDF
    const handleViewQuotationPDF = (quotation) => {
      if (quotation.pdfUrl) {
        window.open(quotation.pdfUrl, '_blank')
      }
    }

    // 查看客户回传PDF
    const handleViewCustomerPDF = (quotation) => {
      if (quotation.customerPdfUrl) {
        window.open(quotation.customerPdfUrl, '_blank')
      }
    }

    return {
      searchQuery,
      filterCategory,
      filterSubType,
      workorderStatus,
      currentPage,
      pageSize,
      total,
      dialogVisible,
      detailVisible,
      isMobile,
      dialogTitle,
      form,
      selectedWorkorder,
      workorderQuotations,
      quotationViewVisible,
      currentQuotation,
      customers,
      assets,
      filteredWorkorders,
      tableColumns,
      currentContact,
      getApprovalAlertTitle,
      getApprovalAlertType,
      canCreateWorkorder,
      canEditWorkorder,
      currentUserRole,
      showPendingAssignOption,
      currentUserId,
      detailActions,
      detailActionHandlers,
      getCategoryTagType,
      getCategoryText,
      onFormCategoryChange,
      onFormCustomerChange,
      onFormSNChange,
      onFaultTagClick,
      WarrantyStatusText,
      WarrantyStatusType,
      commonFaultTags,
      customerModels,
      customerSNs,
      getStatusType,
      getWorkorderTypeTag,
      getQuotationStatusType,
      getQuotationStatusText,
      formatAmount,
      formatDateTime,
      addPart,
      removePart,
      calculatePartAmounts,
      goToRegister,
      handleAddWorkorder,
      handleEditWorkorder,
      handleViewWorkorder,
      handleDeleteWorkorder,
      handleQuickAssign,
      assignDialogVisible,
      selectedEngineerIds,
      assignWorkorderData,
      assignFormData,
      getCategoryTextByCode,
      getSubTypeText,
      getWarrantyText,
      getWarrantyTagType,
      confirmAssign,
      engineerList,
      handleQuickAccept,
      handleQuickReject,
      handleQuickTLConfirm,
      handleQuickAsstConfirm,
      handleQuickComplete,
      handleSubmit,
      handleSearch,
      handleSizeChange,
      handleCurrentChange,
      handleSortChange,
      handleGeneratePDF,
      handleViewPDF,
      handleSendPDF,
      handleCreateQuotation,
      handleViewQuotation,
      handleEditQuotationFromView,
      handleSubmitQuotationFromView,
      handleApproveQuotationFromView,
      handleSendQuotationFromView,
      handleUploadQuotationFromView,
      handleCreateVersionFromView,
      handleViewWorkorderFromQuotation,
      handleViewQuotationPDF,
      handleViewCustomerPDF,
      handleFlowStatusChange,
      updateSelectedWorkorder,
      handleRefresh,
      previewReportPDF,
      downloadReportPDF,
      loadWorkordersFromStore,
      // 报价单相关
      uploadQuotationDialogVisible,
      uploadQuotationForm,
      handleUploadQuotationPDF,
      handleQuotationFileChange,
      submitQuotationPDF,
      handleSubmitQuotationForApproval,
      // 审核相关
      approveQuotationLocal,
      rejectQuotationLocal,
      updateWorkorderStatusForQuotation,
      WorkorderStatus,
      getCurrentStepIndex,
      getFlowStatusText,
      getFlowStatusType,
      // 权限函数
      canAssignWorkorder,
      canAcceptWorkorder,
      canRejectWorkorder,
      canSubmitForSign,
      canSignWorkorder,
      canTechLeadConfirm,
      canAssistantConfirm,
      canCompleteDirectly,
      handleDirectComplete
    }
  }
}
</script>

<style scoped>
.workorder {
  padding: 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.search-bar {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
}

.pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}

.mt-4 {
  margin-top: 20px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.pdf-container {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}

.quotation-section {
  padding: 10px 0;
}

.quotation-toolbar {
  margin-bottom: 15px;
  display: flex;
  justify-content: flex-end;
}

.amount {
  color: #f56c6c;
  font-weight: bold;
}

/* 工单编辑对话框样式 */
.workorder-id-link {
  color: var(--el-color-primary);
  cursor: pointer;
  text-decoration: underline;
}
.workorder-id-link:hover {
  color: var(--el-color-primary-dark-2);
}

.workorder-edit-dialog :deep(.el-dialog__body) {
  padding: 0;
}

.workorder-edit {
  padding: 20px;
}

/* 头部信息卡片 */
.header-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: white;
}

.header-left {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.workorder-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 20px;
  font-weight: 600;
}

.workorder-title .el-icon {
  font-size: 24px;
}

.workorder-meta {
  display: flex;
  gap: 15px;
  font-size: 13px;
  opacity: 0.9;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 5px;
  background: rgba(255, 255, 255, 0.2);
  padding: 4px 10px;
  border-radius: 4px;
}

.meta-item.安装 {
  background: rgba(103, 194, 58, 0.3);
}

.meta-item.维修 {
  background: rgba(230, 162, 60, 0.3);
}

.meta-item.巡检 {
  background: rgba(64, 158, 255, 0.3);
}

.meta-item.配件销售 {
  background: rgba(245, 108, 108, 0.3);
}

.grand-total-display {
  text-align: right;
}

.grand-total-display .label {
  font-size: 12px;
  opacity: 0.8;
  margin-bottom: 4px;
}

.grand-total-display .amount {
  font-size: 28px;
  font-weight: 700;
  color: white;
}

/* 区域卡片样式 */
.section-card {
  margin-bottom: 20px;
}

.section-card :deep(.el-card__header) {
  padding: 15px 20px;
  background: #f5f7fa;
  border-bottom: 1px solid #e4e7ed;
}

.section-card .card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #303133;
}

.section-card .card-header .el-icon {
  font-size: 18px;
  color: #409eff;
}

/* 表单网格布局 */
.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.form-item-full {
  grid-column: span 2;
}

/* 配件明细表格样式 */
.parts-list {
  padding: 0;
}

.parts-table-wrapper {
  margin-bottom: 15px;
}

.items-card :deep(.el-card__header) {
  padding: 12px 20px;
}

.items-card .card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.items-card .header-left {
  flex-direction: row;
  align-items: center;
  gap: 8px;
}

.items-card .header-left span {
  font-weight: 600;
}

.parts-summary-bar {
  display: flex;
  justify-content: flex-end;
  gap: 30px;
  padding: 15px 20px;
  background: #f5f7fa;
  border-radius: 4px;
  margin-top: 15px;
}

.summary-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.summary-item .label {
  color: #606266;
  font-size: 14px;
}

.summary-item .value {
  font-size: 16px;
  font-weight: 600;
}

.summary-item .value.cost {
  color: #f56c6c;
}

.summary-item .value.sale {
  color: #67c23a;
}

.summary-item .value.profit {
  color: #67c23a;
}

.summary-item .value.loss {
  color: #f56c6c;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .search-bar {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .search-bar .el-input {
    width: 100% !important;
    margin-right: 0 !important;
  }
  
  .search-bar .el-select {
    width: 100% !important;
    margin-right: 0 !important;
  }
  
  .search-bar .el-button {
    width: 100%;
  }
  
  .el-table {
    font-size: 12px;
  }
  
  .el-table th,
  .el-table td {
    padding: 8px 4px;
  }
  
  .el-table-column {
    min-width: 80px;
  }
  
  .pagination {
    justify-content: center;
  }
  
  .el-dialog {
    width: 90% !important;
    margin: 10px auto !important;
  }
  
  .el-form-item {
    margin-bottom: 10px;
  }
  
  .el-form-item__label {
    font-size: 12px;
    width: 100px !important;
  }
  
  .el-form-item__content {
    margin-left: 110px !important;
  }
  
  .el-descriptions {
    font-size: 12px;
  }
  
  .el-descriptions__label {
    font-size: 12px;
  }
  
  .el-tabs__item {
    font-size: 12px;
    padding: 0 8px;
  }
  
  .pdf-container {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .pdf-container .el-button {
    width: 100%;
  }
  
  .el-timeline-item {
    padding-bottom: 20px;
  }
  
  .el-timeline-item__content {
    padding-top: 0;
  }
}

@media (max-width: 480px) {
  .el-form-item__label {
    width: 80px !important;
  }
  
  .el-form-item__content {
    margin-left: 90px !important;
  }
  
  .el-descriptions {
    column-count: 1 !important;
  }
  
  .el-button {
    font-size: 12px;
    padding: 6px 12px;
  }
  
  .el-button span {
    font-size: 12px;
  }
  
  .el-timeline-item {
    padding-bottom: 15px;
  }
}

/* 作业报告书PDF区域样式 */
.report-pdf-section {
  margin-top: 20px;
}

.pdf-card {
  background-color: #f5f7fa;
}

.pdf-info {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 15px;
}

.pdf-details {
  flex: 1;
}

.pdf-name {
  font-size: 16px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 5px;
}

.pdf-time {
  font-size: 13px;
  color: #909399;
}

.pdf-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.pdf-actions .el-button {
  display: flex;
  align-items: center;
  gap: 5px;
}

/* ==================== 移动端适配 ==================== */

/* 竖屏手机适配 (portrait) - 基础 */
@media (max-width: 768px) and (orientation: portrait) {
  /* 详情对话框全屏显示 */
  .workorder :deep(.el-dialog) {
    width: 100% !important;
    margin: 0 !important;
    height: 100vh;
    max-height: 100vh;
    border-radius: 0;
    display: flex;
    flex-direction: column;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
  }
  
  .workorder :deep(.el-dialog__header) {
    padding: 12px 15px;
    flex-shrink: 0;
    border-bottom: 1px solid #e4e7ed;
  }
  
  .workorder :deep(.el-dialog__title) {
    font-size: 16px;
    font-weight: 600;
  }
  
  .workorder :deep(.el-dialog__body) {
    flex: 1;
    overflow-y: auto;
    padding: 10px;
    -webkit-overflow-scrolling: touch;
    max-height: calc(100vh - 55px);
  }
  
  /* 标签页适配 - 可横向滚动 */
  .workorder :deep(.el-tabs__header) {
    margin-bottom: 12px;
  }
  
  .workorder :deep(.el-tabs__nav-wrap) {
    overflow-x: auto;
    overflow-y: hidden;
  }
  
  .workorder :deep(.el-tabs__nav) {
    white-space: nowrap;
    display: flex;
  }
  
  .workorder :deep(.el-tabs__item) {
    font-size: 13px;
    padding: 0 12px;
    height: 36px;
    line-height: 36px;
    flex-shrink: 0;
  }
  
  /* 描述列表 - 每行一个字段 */
  .workorder :deep(.el-descriptions) {
    font-size: 14px;
    width: 100% !important;
  }
  
  .workorder :deep(.el-descriptions__header) {
    margin-bottom: 12px;
  }
  
  .workorder :deep(.el-descriptions__title) {
    font-size: 15px;
    font-weight: 600;
  }
  
  /* 强制单列显示 - 关键样式 */
  .workorder :deep(.el-descriptions__body) {
    width: 100% !important;
  }
  
  .workorder :deep(.el-descriptions__body .el-descriptions__table) {
    width: 100% !important;
    table-layout: fixed !important;
    display: block !important;
  }
  
  .workorder :deep(.el-descriptions__body .el-descriptions__table tbody) {
    display: block !important;
    width: 100% !important;
  }
  
  .workorder :deep(.el-descriptions__body .el-descriptions__table tr) {
    display: block !important;
    width: 100% !important;
  }
  
  .workorder :deep(.el-descriptions__body .el-descriptions__table td) {
    display: flex !important;
    flex-direction: row !important;
    align-items: flex-start !important;
    padding: 10px 0 !important;
    border-bottom: 1px solid #ebeef5 !important;
    width: 100% !important;
    box-sizing: border-box !important;
  }
  
  .workorder :deep(.el-descriptions-item) {
    display: flex !important;
    flex-direction: row !important;
    align-items: flex-start !important;
    width: 100% !important;
  }
  
  .workorder :deep(.el-descriptions-item__cell) {
    display: flex !important;
    flex-direction: row !important;
    width: 100% !important;
  }
  
  .workorder :deep(.el-descriptions-item__label) {
    width: 90px !important;
    min-width: 90px !important;
    max-width: 90px !important;
    font-size: 13px !important;
    color: #606266 !important;
    padding: 0 !important;
    line-height: 1.5 !important;
    display: inline-block !important;
    flex-shrink: 0 !important;
  }
  
  .workorder :deep(.el-descriptions-item__content) {
    flex: 1 !important;
    font-size: 14px !important;
    color: #303133 !important;
    padding: 0 !important;
    line-height: 1.5 !important;
    word-break: break-all !important;
    overflow-wrap: break-word !important;
    display: inline-block !important;
  }
  
  /* 表格横向滚动 */
  .workorder :deep(.el-table) {
    font-size: 12px;
    width: 100%;
  }
  
  .workorder :deep(.el-table__body-wrapper) {
    overflow-x: auto;
  }
  
  .workorder :deep(.el-table th),
  .workorder :deep(.el-table td) {
    padding: 8px 6px;
    white-space: nowrap;
  }
  
  /* PDF卡片适配 */
  .report-pdf-section {
    margin-top: 15px;
  }
  
  .pdf-card {
    padding: 12px;
  }
  
  .pdf-info {
    flex-direction: row;
    align-items: center;
    gap: 10px;
    margin-bottom: 12px;
  }
  
  .pdf-name {
    font-size: 14px;
    line-height: 1.4;
  }
  
  .pdf-time {
    font-size: 12px;
  }
  
  .pdf-actions {
    flex-direction: row;
    gap: 8px;
  }
  
  .pdf-actions .el-button {
    flex: 1;
    justify-content: center;
    padding: 8px 12px;
    font-size: 13px;
  }
  
  /* 时间线适配 */
  .workorder :deep(.el-timeline) {
    padding-left: 5px;
  }
  
  .workorder :deep(.el-timeline-item) {
    padding-bottom: 15px;
  }
  
  .workorder :deep(.el-timeline-item__node) {
    width: 10px;
    height: 10px;
  }
  
  .workorder :deep(.el-timeline-item__wrapper) {
    padding-left: 12px;
  }
  
  .workorder :deep(.el-timeline-item__timestamp) {
    font-size: 12px;
    margin-bottom: 5px;
  }
  
  .workorder :deep(.el-card) {
    padding: 10px;
  }
  
  .workorder :deep(.el-card h4) {
    font-size: 14px;
    margin: 0 0 5px 0;
  }
  
  .workorder :deep(.el-card p) {
    font-size: 13px;
    margin: 3px 0;
  }
}

/* 横屏手机适配 (landscape) */
@media (max-width: 896px) and (orientation: landscape) {
  .workorder :deep(.el-dialog) {
    width: 100% !important;
    margin: 0 !important;
    height: 100vh;
    max-height: 100vh;
    border-radius: 0;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
  }
  
  .workorder :deep(.el-dialog__body) {
    padding: 15px;
    max-height: calc(100vh - 55px);
    overflow-y: auto;
  }
  
  /* 横屏时描述列表可以两列 */
  .workorder :deep(.el-descriptions) {
    font-size: 13px;
  }
  
  .workorder :deep(.el-descriptions__body table) {
    width: 100%;
  }
  
  .workorder :deep(.el-descriptions-row) {
    display: table-row;
  }
  
  .workorder :deep(.el-descriptions-item) {
    display: table-cell;
    padding: 8px;
  }
  
  .workorder :deep(.el-descriptions-item__label) {
    font-size: 12px;
    width: auto;
    min-width: 100px;
  }
  
  .workorder :deep(.el-descriptions-item__content) {
    font-size: 13px;
  }
  
  /* 标签页适配 */
  .workorder :deep(.el-tabs__item) {
    font-size: 13px;
    padding: 0 15px;
  }
}

/* 小屏幕手机竖屏适配 */
@media (max-width: 480px) and (orientation: portrait) {
  .workorder :deep(.el-dialog__body) {
    padding: 8px;
  }
  
  .workorder :deep(.el-tabs__item) {
    font-size: 12px;
    padding: 0 10px;
    height: 32px;
    line-height: 32px;
  }
  
  .workorder :deep(.el-descriptions) {
    font-size: 13px;
  }
  
  .workorder :deep(.el-descriptions-item__label) {
    width: 80px !important;
    min-width: 80px;
    font-size: 12px;
  }
  
  .workorder :deep(.el-descriptions-item__content) {
    font-size: 13px;
  }
  
  .workorder :deep(.el-descriptions-item) {
    padding: 8px 0;
  }
  
  /* 表格 */
  .workorder :deep(.el-table) {
    font-size: 11px;
  }
  
  .workorder :deep(.el-table th),
  .workorder :deep(.el-table td) {
    padding: 6px 4px;
  }
  
  /* 按钮 */
  .workorder :deep(.el-button) {
    padding: 6px 10px;
    font-size: 12px;
  }
  
  .pdf-actions .el-button {
    padding: 6px 10px;
    font-size: 12px;
  }
}

/* 超小屏幕适配 */
@media (max-width: 360px) and (orientation: portrait) {
  .workorder :deep(.el-descriptions-item__label) {
    width: 70px !important;
    min-width: 70px;
    font-size: 11px;
  }
  
  .workorder :deep(.el-descriptions-item__content) {
    font-size: 12px;
  }
  
  .workorder :deep(.el-tabs__item) {
    font-size: 11px;
    padding: 0 8px;
  }
}

/* 详情弹窗统一样式 */
:deep(.workorder-detail-dialog.is-fullscreen) {
  .el-dialog__body {
    padding: 10px;
    overflow-y: auto;
  }

  .el-dialog__header {
    padding: 15px 20px;
    border-bottom: 1px solid #e4e7ed;
  }

  .el-dialog__headerbtn {
    top: 15px;
    right: 15px;
  }
}

/* 头部信息卡片 */
:deep(.workorder-detail-dialog) .header-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  padding: 24px 32px;
  margin-bottom: 24px;
  color: white;
  box-shadow: 0 4px 20px rgba(102, 126, 234, 0.3);
}

:deep(.workorder-detail-dialog) .header-left {
  flex: 1;
}

:deep(.workorder-detail-dialog) .detail-title {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 12px;
}

:deep(.workorder-detail-dialog) .detail-title .el-icon {
  font-size: 28px;
}

:deep(.workorder-detail-dialog) .detail-meta {
  display: flex;
  gap: 24px;
  font-size: 14px;
  opacity: 0.9;
}

:deep(.workorder-detail-dialog) .meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

:deep(.workorder-detail-dialog) .header-right {
  text-align: right;
}

/* 通用卡片样式 */
:deep(.workorder-detail-dialog) .section-card {
  margin-bottom: 24px;
  border-radius: 8px;
}

:deep(.workorder-detail-dialog) .section-card .el-card__header {
  padding: 12px 16px;
  background-color: #f5f7fa;
  border-bottom: 1px solid #e4e7ed;
}

:deep(.workorder-detail-dialog) .card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #303133;
}

:deep(.workorder-detail-dialog) .item-count {
  margin-left: 8px;
  font-size: 13px;
  color: #909399;
  font-weight: normal;
}

:deep(.workorder-detail-dialog) .header-action {
  margin-left: auto;
}

:deep(.workorder-detail-dialog) .section-card .el-card__body {
  padding: 20px;
}

/* 信息网格 */
:deep(.workorder-detail-dialog) .info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

:deep(.workorder-detail-dialog) .info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background-color: #f5f7fa;
  border-radius: 6px;
}

:deep(.workorder-detail-dialog) .info-item .label {
  color: #909399;
  font-size: 13px;
}

:deep(.workorder-detail-dialog) .info-item .value {
  color: #303133;
  font-weight: 500;
  font-size: 14px;
}

:deep(.workorder-detail-dialog) .info-item .value.amount {
  color: #f56c6c;
  font-weight: bold;
}

:deep(.workorder-detail-dialog) .info-item .value.purchase {
  color: #409eff;
  font-weight: bold;
}

/* 描述部分 */
:deep(.workorder-detail-dialog) .description-section {
  margin-top: 20px;
}

:deep(.workorder-detail-dialog) .section-label {
  font-weight: 600;
  color: #303133;
  margin-bottom: 10px;
  font-size: 14px;
}

:deep(.workorder-detail-dialog) .content-box {
  padding: 16px;
  background-color: #f5f7fa;
  border-radius: 6px;
  color: #606266;
  line-height: 1.8;
  min-height: 60px;
}

/* 表格包装器 */
:deep(.workorder-detail-dialog) .table-wrapper {
  overflow-x: auto;
}

/* 时间线内容 */
:deep(.workorder-detail-dialog) .timeline-content {
  padding: 12px 16px;
  background-color: #f5f7fa;
  border-radius: 8px;
  margin-top: 8px;
}

:deep(.workorder-detail-dialog) .timeline-title {
  font-weight: bold;
  color: #303133;
  margin-bottom: 8px;
}

:deep(.workorder-detail-dialog) .timeline-desc {
  color: #606266;
  font-size: 13px;
  line-height: 1.6;
}

:deep(.workorder-detail-dialog) .timeline-operator {
  color: #909399;
  font-size: 12px;
  margin-top: 8px;
}

/* PDF卡片内容 */
:deep(.workorder-detail-dialog) .pdf-card-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}

:deep(.workorder-detail-dialog) .pdf-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

:deep(.workorder-detail-dialog) .pdf-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

:deep(.workorder-detail-dialog) .pdf-name {
  font-weight: 600;
  color: #303133;
}

:deep(.workorder-detail-dialog) .pdf-time {
  font-size: 12px;
  color: #909399;
}

:deep(.workorder-detail-dialog) .pdf-actions {
  display: flex;
  gap: 10px;
}

/* 移动端适配 */
@media (max-width: 768px) {
  :deep(.workorder-detail-dialog) .header-card {
    flex-direction: column;
    gap: 16px;
    padding: 16px 20px;
    margin-bottom: 16px;
  }

  :deep(.workorder-detail-dialog) .detail-title {
    font-size: 18px;
  }

  :deep(.workorder-detail-dialog) .detail-title .el-icon {
    font-size: 22px;
  }

  :deep(.workorder-detail-dialog) .detail-meta {
    flex-wrap: wrap;
    gap: 8px;
    font-size: 12px;
  }

  :deep(.workorder-detail-dialog) .section-card {
    margin-bottom: 16px;
  }

  :deep(.workorder-detail-dialog) .section-card .el-card__body {
    padding: 12px;
  }

  :deep(.workorder-detail-dialog) .info-grid {
    grid-template-columns: 1fr;
    gap: 10px;
  }

  :deep(.workorder-detail-dialog) .info-item {
    padding: 10px;
  }

  :deep(.workorder-detail-dialog) .card-header {
    flex-wrap: wrap;
  }

  :deep(.workorder-detail-dialog) .header-action {
    margin-left: 0;
    margin-top: 8px;
    width: 100%;
  }

  :deep(.workorder-detail-dialog) .pdf-card-content {
    flex-direction: column;
    align-items: flex-start;
  }

  :deep(.workorder-detail-dialog) .pdf-actions {
    width: 100%;
  }

  :deep(.workorder-detail-dialog) .pdf-actions .el-button {
    flex: 1;
  }
}

@media (max-width: 480px) {
  :deep(.workorder-detail-dialog) .header-card {
    padding: 12px 16px;
    border-radius: 8px;
  }

  :deep(.workorder-detail-dialog) .detail-title {
    font-size: 16px;
  }

  :deep(.workorder-detail-dialog) .detail-meta {
    flex-direction: column;
    gap: 6px;
  }

  :deep(.workorder-detail-dialog) .section-card {
    border-radius: 6px;
  }

  :deep(.workorder-detail-dialog) .card-header {
    font-size: 14px;
  }

  :deep(.workorder-detail-dialog) .content-box {
    padding: 12px;
  }

  :deep(.workorder-detail-dialog) .timeline-content {
    padding: 10px 12px;
  }
}

/* ==================== 报价单上传样式 ==================== */

/* 待报价提示 */
.quotation-pending-tip {
  background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%);
  border: 1px solid #ffcc80;
  border-radius: 8px;
  padding: 16px 20px;
  margin: 16px 0;
  display: flex;
  align-items: center;
  gap: 12px;
}

.quotation-pending-tip .el-icon {
  font-size: 24px;
  color: #ff9800;
  flex-shrink: 0;
}

.quotation-pending-tip span {
  color: #e65100;
  font-size: 14px;
  line-height: 1.5;
}

/* 报价单上传组件 */
.quotation-uploader {
  width: 100%;
}

.quotation-uploader :deep(.el-upload) {
  width: 100%;
}

.quotation-uploader :deep(.el-upload-dragger) {
  width: 100%;
  height: 180px;
  border: 2px dashed #dcdfe6;
  border-radius: 8px;
  background-color: #fafafa;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.quotation-uploader :deep(.el-upload-dragger:hover) {
  border-color: #409eff;
  background-color: #f0f9ff;
}

.quotation-uploader :deep(.el-upload-dragger .el-icon) {
  font-size: 48px;
  color: #909399;
  margin-bottom: 12px;
}

.quotation-uploader :deep(.el-upload__text) {
  color: #606266;
  font-size: 14px;
  text-align: center;
}

.quotation-uploader :deep(.el-upload__text em) {
  color: #409eff;
  font-style: normal;
}

.quotation-uploader :deep(.el-upload__tip) {
  text-align: center;
  color: #909399;
  font-size: 12px;
  margin-top: 8px;
}

/* 已选文件显示 */
.file-selected {
  background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
  border: 1px solid #a5d6a7;
  border-radius: 8px;
  padding: 16px 20px;
  margin-top: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.file-selected .el-icon {
  font-size: 24px;
  color: #4caf50;
  flex-shrink: 0;
}

.file-selected span {
  color: #2e7d32;
  font-size: 14px;
  font-weight: 500;
  flex: 1;
  word-break: break-all;
}

/* 报价单状态标签 */
.quotation-status-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

/* 报价单表格操作按钮 */
.quotation-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.quotation-actions .el-button {
  padding: 4px 8px;
  font-size: 12px;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .quotation-pending-tip {
    padding: 12px 16px;
    flex-direction: column;
    text-align: center;
    gap: 8px;
  }

  .quotation-pending-tip .el-icon {
    font-size: 32px;
  }

  .quotation-pending-tip span {
    font-size: 13px;
  }

  .quotation-uploader :deep(.el-upload-dragger) {
    height: 150px;
  }

  .quotation-uploader :deep(.el-upload-dragger .el-icon) {
    font-size: 36px;
  }

  .quotation-uploader :deep(.el-upload__text) {
    font-size: 13px;
  }

  .file-selected {
    padding: 12px 16px;
    flex-direction: column;
    text-align: center;
  }

  .file-selected .el-icon {
    font-size: 28px;
  }

  .quotation-actions {
    flex-direction: column;
    width: 100%;
  }

  .quotation-actions .el-button {
    width: 100%;
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .quotation-uploader :deep(.el-upload-dragger) {
    height: 130px;
  }

  .quotation-uploader :deep(.el-upload-dragger .el-icon) {
    font-size: 28px;
  }

  .quotation-uploader :deep(.el-upload__text) {
    font-size: 12px;
    padding: 0 10px;
  }
}

.assign-dialog-content {
  max-height: 65vh;
  overflow-y: auto;
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