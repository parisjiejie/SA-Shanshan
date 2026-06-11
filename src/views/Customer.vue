<template>
  <div class="customer">
    <el-card shadow="hover" class="mb-4">
      <template #header>
        <div class="card-header">
          <span>客户管理</span>
          <el-button type="primary" @click="handleAddCustomer">
            <el-icon><Plus /></el-icon>
            <span>新增客户</span>
          </el-button>
        </div>
      </template>

      <!-- 快捷搜索栏 -->
      <div class="quick-search-bar">
        <el-input
          v-model="quickSearchKeyword"
          placeholder="搜索客户名称或联系人"
          clearable
          style="width: 300px"
          @keyup.enter="handleQuickSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-button type="primary" @click="handleQuickSearch">
          搜索
        </el-button>
        <el-button link @click="toggleAdvancedSearch">
          <el-icon>
            <ArrowDown v-if="!showAdvancedSearch" />
            <ArrowUp v-else />
          </el-icon>
          {{ showAdvancedSearch ? '收起筛选' : '高级筛选' }}
        </el-button>
      </div>

      <!-- 高级筛选条件 -->
      <el-collapse-transition>
        <div v-show="showAdvancedSearch" class="advanced-search-panel">
          <el-divider />
          <el-form :model="queryForm" inline class="query-form">
            <el-form-item label="客户名称">
              <el-input
                v-model="queryForm.customerName"
                placeholder="输入客户名称"
                clearable
                style="width: 200px"
              />
            </el-form-item>
            <el-form-item label="客户等级">
              <el-select
                v-model="queryForm.level"
                placeholder="选择等级"
                clearable
                style="width: 150px"
              >
                <el-option label="VIP" value="VIP" />
                <el-option label="普通" value="普通" />
                <el-option label="潜在" value="潜在" />
              </el-select>
            </el-form-item>
            <el-form-item label="联系电话">
              <el-input
                v-model="queryForm.phone"
                placeholder="输入联系电话"
                clearable
                style="width: 180px"
              />
            </el-form-item>
            <el-form-item label="创建日期">
              <el-date-picker
                v-model="queryForm.dateRange"
                type="daterange"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                value-format="YYYY-MM-DD"
                style="width: 240px"
              />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleQuery">
                <el-icon><Search /></el-icon>
                <span>查询</span>
              </el-button>
              <el-button @click="handleReset">
                <el-icon><Refresh /></el-icon>
                <span>重置</span>
              </el-button>
            </el-form-item>
          </el-form>
        </div>
      </el-collapse-transition>
      
      <!-- 使用可配置表格组件 -->
      <ConfigurableTable
        :data="filteredCustomers"
        :columns="tableColumns"
        storage-key="customer"
        :show-operation="true"
        operation-width="auto"
        :fixed-header="true"
        :table-height="tableHeight"
        @sort-change="handleSortChange"
        class="mt-4"
      >
        <template #level="{ row }">
          <el-tag :type="getLevelType(row.level)">{{ row.level }}</el-tag>
        </template>
        <template #operation="{ row }">
          <el-button type="primary" size="small" @click="handleViewCustomer(row)">
            查看
          </el-button>
          <el-button type="success" size="small" @click="handleEditCustomer(row)">
            编辑
          </el-button>
          <el-button type="danger" size="small" @click="handleDeleteCustomer(row.id)">
            删除
          </el-button>
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

    <!-- 新增/编辑客户对话框 -->
    <el-dialog
      :title="dialogTitle"
      v-model="dialogVisible"
      width="800px"
    >
      <el-form :model="form" label-width="120px">
        <el-form-item label="客户名称">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="客户等级">
          <el-select v-model="form.level">
            <el-option label="VIP" value="VIP" />
            <el-option label="普通" value="普通" />
            <el-option label="潜在" value="潜在" />
          </el-select>
        </el-form-item>
        <el-form-item label="统一社会信用代码">
          <el-input v-model="form.creditCode" />
        </el-form-item>
        <el-form-item label="注册地址">
          <el-input v-model="form.address" />
        </el-form-item>
        <el-form-item label="法人">
          <el-input v-model="form.legalPerson" />
        </el-form-item>
        <el-form-item label="联系人">
          <el-input v-model="form.contact" />
        </el-form-item>
        <el-form-item label="联系电话">
          <el-input v-model="form.phone" />
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input v-model="form.email" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <!-- 客户详情对话框 -->
    <el-dialog
      title="客户详情"
      v-model="detailVisible"
      width="1000px"
      :fullscreen="isMobile"
      class="customer-detail-dialog"
    >
      <div class="detail-container">
        <!-- 头部信息卡片 -->
        <div class="header-card">
          <div class="header-left">
            <div class="detail-title">
              <el-icon><OfficeBuilding /></el-icon>
              <span>{{ selectedCustomer.name }}</span>
              <el-tag :type="getCustomerLevelType(selectedCustomer.level)" size="small" effect="dark">
                {{ selectedCustomer.level }}
              </el-tag>
            </div>
            <div class="detail-meta">
              <span class="meta-item">
                <el-icon><User /></el-icon>
                {{ selectedCustomer.contact }}
              </span>
              <span class="meta-item">
                <el-icon><Phone /></el-icon>
                {{ selectedCustomer.phone }}
              </span>
              <span class="meta-item">
                <el-icon><Clock /></el-icon>
                {{ selectedCustomer.createTime }}
              </span>
            </div>
          </div>
        </div>

        <el-tabs class="detail-tabs">
          <el-tab-pane label="基本信息">
            <el-card class="section-card" shadow="hover">
              <template #header>
                <div class="card-header">
                  <el-icon><InfoFilled /></el-icon>
                  <span>基本信息</span>
                </div>
              </template>
              <div class="info-grid">
                <div class="info-item">
                  <span class="label">客户名称</span>
                  <span class="value">{{ selectedCustomer.name }}</span>
                </div>
                <div class="info-item">
                  <span class="label">客户等级</span>
                  <el-tag :type="getCustomerLevelType(selectedCustomer.level)" size="small">
                    {{ selectedCustomer.level }}
                  </el-tag>
                </div>
                <div class="info-item">
                  <span class="label">统一社会信用代码</span>
                  <span class="value">{{ selectedCustomer.creditCode || '-' }}</span>
                </div>
                <div class="info-item">
                  <span class="label">注册地址</span>
                  <span class="value">{{ selectedCustomer.address || '-' }}</span>
                </div>
                <div class="info-item">
                  <span class="label">法人</span>
                  <span class="value">{{ selectedCustomer.legalPerson || '-' }}</span>
                </div>
                <div class="info-item">
                  <span class="label">联系人</span>
                  <span class="value">{{ selectedCustomer.contact || '-' }}</span>
                </div>
                <div class="info-item">
                  <span class="label">联系电话</span>
                  <span class="value">{{ selectedCustomer.phone || '-' }}</span>
                </div>
                <div class="info-item">
                  <span class="label">邮箱</span>
                  <span class="value">{{ selectedCustomer.email || '-' }}</span>
                </div>
              </div>
            </el-card>
          </el-tab-pane>

          <el-tab-pane label="联系人管理">
            <el-card class="section-card" shadow="hover">
              <template #header>
                <div class="card-header">
                  <el-icon><User /></el-icon>
                  <span>联系人列表</span>
                  <span class="item-count">共 {{ selectedCustomer.contacts?.length || 0 }} 人</span>
                  <el-button type="primary" size="small" @click="handleAddContact" class="header-action">
                    <el-icon><Plus /></el-icon>
                    新增
                  </el-button>
                </div>
              </template>
              <div class="table-wrapper">
                <el-table :data="selectedCustomer.contacts" style="width: 100%; min-width: 600px;" size="small">
                  <el-table-column type="index" label="序号" width="50" align="center" />
                  <el-table-column prop="name" label="姓名" width="100" />
                  <el-table-column prop="position" label="职位" width="100" />
                  <el-table-column prop="phone" label="电话" width="120" />
                  <el-table-column prop="email" label="邮箱" min-width="150" show-overflow-tooltip />
                  <el-table-column label="操作" width="150" fixed="right">
                    <template #default="scope">
                      <el-button type="success" link size="small">编辑</el-button>
                      <el-button type="danger" link size="small">删除</el-button>
                    </template>
                  </el-table-column>
                </el-table>
              </div>
              <el-empty v-if="!selectedCustomer.contacts || selectedCustomer.contacts.length === 0" description="暂无联系人" />
            </el-card>
          </el-tab-pane>

          <el-tab-pane label="设备管理">
            <el-card class="section-card" shadow="hover">
              <template #header>
                <div class="card-header">
                  <el-icon><Box /></el-icon>
                  <span>设备列表</span>
                  <span class="item-count">共 {{ selectedCustomer.assets?.length || 0 }} 台</span>
                </div>
              </template>
              <div class="table-wrapper">
                <el-table :data="selectedCustomer.assets" style="width: 100%; min-width: 700px;" size="small">
                  <el-table-column type="index" label="序号" width="50" align="center" />
                  <el-table-column prop="serialNumber" label="设备序列号" width="140" />
                  <el-table-column prop="model" label="型号" width="120" />
                  <el-table-column prop="status" label="状态" width="90">
                    <template #default="scope">
                      <el-tag :type="scope.row.status === '运行中' ? 'success' : 'warning'" size="small">
                        {{ scope.row.status }}
                      </el-tag>
                    </template>
                  </el-table-column>
                  <el-table-column prop="installDate" label="安装日期" width="120" />
                  <el-table-column prop="warrantyEndDate" label="保修截止日" width="120" />
                  <el-table-column label="操作" width="80" fixed="right">
                    <template #default="scope">
                      <el-button type="primary" link size="small" @click="handleViewAsset(scope.row)">查看</el-button>
                    </template>
                  </el-table-column>
                </el-table>
              </div>
              <el-empty v-if="!selectedCustomer.assets || selectedCustomer.assets.length === 0" description="暂无设备" />
            </el-card>
          </el-tab-pane>

          <el-tab-pane label="服务历史">
            <el-card class="section-card" shadow="hover">
              <template #header>
                <div class="card-header">
                  <el-icon><Tools /></el-icon>
                  <span>服务历史</span>
                  <span class="item-count">共 {{ selectedCustomer.workorders?.length || 0 }} 单</span>
                </div>
              </template>
              <div class="table-wrapper">
                <el-table :data="selectedCustomer.workorders" style="width: 100%; min-width: 700px;" size="small">
                  <el-table-column type="index" label="序号" width="50" align="center" />
                  <el-table-column prop="id" label="工单号" width="120" />
                  <el-table-column prop="type" label="类型" width="90" />
                  <el-table-column prop="status" label="状态" width="90">
                    <template #default="scope">
                      <el-tag :type="scope.row.status === '已完成' ? 'success' : 'warning'" size="small">
                        {{ scope.row.status }}
                      </el-tag>
                    </template>
                  </el-table-column>
                  <el-table-column prop="createTime" label="创建时间" width="150" />
                  <el-table-column prop="finishTime" label="完成时间" width="150" />
                  <el-table-column label="操作" width="80" fixed="right">
                    <template #default="scope">
                      <el-button type="primary" link size="small" @click="handleViewWorkorder(scope.row)">查看</el-button>
                    </template>
                  </el-table-column>
                </el-table>
              </div>
              <el-empty v-if="!selectedCustomer.workorders || selectedCustomer.workorders.length === 0" description="暂无服务记录" />
            </el-card>
          </el-tab-pane>
        </el-tabs>
      </div>
    </el-dialog>
    
    <!-- 设备详情对话框 -->
    <el-dialog
      title="设备详情"
      v-model="assetDetailVisible"
      width="1000px"
      :fullscreen="isMobile"
      class="asset-detail-dialog"
    >
      <div class="detail-container">
        <!-- 头部信息卡片 -->
        <div class="header-card">
          <div class="header-left">
            <div class="detail-title">
              <el-icon><Box /></el-icon>
              <span>{{ selectedAsset.serialNumber }}</span>
              <el-tag :type="selectedAsset.status === '运行中' ? 'success' : 'warning'" size="small" effect="dark">
                {{ selectedAsset.status }}
              </el-tag>
            </div>
            <div class="detail-meta">
              <span class="meta-item">
                <el-icon><OfficeBuilding /></el-icon>
                {{ selectedAsset.customerName }}
              </span>
              <span class="meta-item">
                <el-icon><Box /></el-icon>
                {{ selectedAsset.model }}
              </span>
            </div>
          </div>
        </div>

        <el-tabs class="detail-tabs">
          <el-tab-pane label="基本信息">
            <el-card class="section-card" shadow="hover">
              <template #header>
                <div class="card-header">
                  <el-icon><InfoFilled /></el-icon>
                  <span>设备信息</span>
                </div>
              </template>
              <div class="info-grid">
                <div class="info-item">
                  <span class="label">设备序列号</span>
                  <span class="value">{{ selectedAsset.serialNumber }}</span>
                </div>
                <div class="info-item">
                  <span class="label">型号</span>
                  <span class="value">{{ selectedAsset.model }}</span>
                </div>
                <div class="info-item">
                  <span class="label">客户名称</span>
                  <span class="value">{{ selectedAsset.customerName }}</span>
                </div>
                <div class="info-item">
                  <span class="label">当前状态</span>
                  <el-tag :type="selectedAsset.status === '运行中' ? 'success' : 'warning'" size="small">
                    {{ selectedAsset.status }}
                  </el-tag>
                </div>
                <div class="info-item">
                  <span class="label">出厂日期</span>
                  <span class="value">{{ selectedAsset.manufactureDate || '-' }}</span>
                </div>
                <div class="info-item">
                  <span class="label">销售日期</span>
                  <span class="value">{{ selectedAsset.salesDate || '-' }}</span>
                </div>
                <div class="info-item">
                  <span class="label">安装日期</span>
                  <span class="value">{{ selectedAsset.installDate || '-' }}</span>
                </div>
                <div class="info-item">
                  <span class="label">保修截止日</span>
                  <span class="value">{{ selectedAsset.warrantyEndDate || '-' }}</span>
                </div>
                <div class="info-item">
                  <span class="label">是否EL</span>
                  <span class="value">{{ selectedAsset.isEL ? '是' : '否' }}</span>
                </div>
                <div class="info-item">
                  <span class="label">安装地址</span>
                  <span class="value">{{ selectedAsset.installAddress || '-' }}</span>
                </div>
              </div>
            </el-card>
          </el-tab-pane>

          <el-tab-pane label="维护历史">
            <el-card class="section-card" shadow="hover">
              <template #header>
                <div class="card-header">
                  <el-icon><Tools /></el-icon>
                  <span>维护记录</span>
                  <span class="item-count">共 {{ selectedAsset.maintenanceHistory?.length || 0 }} 条</span>
                </div>
              </template>
              <div class="table-wrapper">
                <el-table :data="selectedAsset.maintenanceHistory" style="width: 100%; min-width: 600px;" size="small">
                  <el-table-column type="index" label="序号" width="50" align="center" />
                  <el-table-column prop="date" label="维护日期" width="120" />
                  <el-table-column prop="type" label="维护类型" width="100" />
                  <el-table-column prop="content" label="维护内容" min-width="200" show-overflow-tooltip />
                  <el-table-column prop="engineer" label="工程师" width="100" />
                  <el-table-column prop="result" label="维护结果" width="100" />
                </el-table>
              </div>
              <el-empty v-if="!selectedAsset.maintenanceHistory || selectedAsset.maintenanceHistory.length === 0" description="暂无维护记录" />
            </el-card>
          </el-tab-pane>

          <el-tab-pane label="工单记录">
            <el-card class="section-card" shadow="hover">
              <template #header>
                <div class="card-header">
                  <el-icon><Document /></el-icon>
                  <span>工单记录</span>
                  <span class="item-count">共 {{ selectedAsset.workorders?.length || 0 }} 单</span>
                </div>
              </template>
              <div class="table-wrapper">
                <el-table :data="selectedAsset.workorders" style="width: 100%; min-width: 600px;" size="small">
                  <el-table-column type="index" label="序号" width="50" align="center" />
                  <el-table-column prop="id" label="工单号" width="120" />
                  <el-table-column prop="type" label="类型" width="100" />
                  <el-table-column prop="createTime" label="创建时间" width="150" />
                  <el-table-column prop="finishTime" label="完成时间" width="150" />
                  <el-table-column prop="status" label="状态" width="90">
                    <template #default="scope">
                      <el-tag :type="scope.row.status === '已完成' ? 'success' : 'warning'" size="small">
                        {{ scope.row.status }}
                      </el-tag>
                    </template>
                  </el-table-column>
                  <el-table-column label="操作" width="80" fixed="right">
                    <template #default="scope">
                      <el-button type="primary" link size="small" @click="handleViewWorkorder(scope.row)">查看</el-button>
                    </template>
                  </el-table-column>
                </el-table>
              </div>
              <el-empty v-if="!selectedAsset.workorders || selectedAsset.workorders.length === 0" description="暂无工单记录" />
            </el-card>
          </el-tab-pane>

          <el-tab-pane label="联系人">
            <el-card class="section-card" shadow="hover">
              <template #header>
                <div class="card-header">
                  <el-icon><User /></el-icon>
                  <span>联系人</span>
                  <span class="item-count">共 {{ selectedCustomerContacts?.length || 0 }} 人</span>
                  <el-button type="primary" size="small" @click="handleAddContact" class="header-action">
                    <el-icon><Plus /></el-icon>
                    添加
                  </el-button>
                </div>
              </template>
              <div class="table-wrapper">
                <el-table :data="selectedCustomerContacts" style="width: 100%; min-width: 700px;" size="small">
                  <el-table-column type="index" label="序号" width="50" align="center" />
                  <el-table-column prop="name" label="姓名" width="100" />
                  <el-table-column prop="phone" label="手机号" width="120" />
                  <el-table-column prop="email" label="邮箱" min-width="150" show-overflow-tooltip />
                  <el-table-column prop="position" label="职位" width="100" />
                  <el-table-column prop="approvalStatus" label="审核状态" width="90">
                    <template #default="scope">
                      <el-tag :type="getContactStatusType(scope.row.approvalStatus)" size="small">
                        {{ scope.row.approvalStatus || '未注册' }}
                      </el-tag>
                    </template>
                  </el-table-column>
                  <el-table-column prop="registerTime" label="注册时间" width="150" />
                  <el-table-column label="操作" width="180" fixed="right">
                    <template #default="scope">
                      <el-button type="primary" link size="small" @click="handleViewContact(scope.row)">查看</el-button>
                      <el-button type="success" link size="small" @click="handleEditContact(scope.row)">编辑</el-button>
                      <el-button type="danger" link size="small" @click="handleDeleteContact(scope.row.id)">删除</el-button>
                    </template>
                  </el-table-column>
                </el-table>
              </div>
              <el-empty v-if="!selectedCustomerContacts || selectedCustomerContacts.length === 0" description="暂无联系人" />
            </el-card>
          </el-tab-pane>
        </el-tabs>
      </div>
    </el-dialog>
    
    <!-- 工单详情对话框 -->
    <el-dialog
      title="工单详情"
      v-model="workorderDetailVisible"
      width="900px"
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
              <el-tag :type="selectedWorkorder.type === '维修' ? 'danger' : 'success'" size="small" effect="dark">
                {{ selectedWorkorder.type }}
              </el-tag>
            </div>
            <div class="detail-meta">
              <span class="meta-item">
                <el-icon><OfficeBuilding /></el-icon>
                {{ selectedWorkorder.customerName }}
              </span>
              <span class="meta-item">
                <el-icon><Clock /></el-icon>
                {{ selectedWorkorder.createTime }}
              </span>
            </div>
          </div>
          <div class="header-right">
            <el-tag :type="selectedWorkorder.status === '已完成' ? 'success' : 'warning'" size="large" effect="dark">
              {{ selectedWorkorder.status }}
            </el-tag>
          </div>
        </div>

        <!-- 基本信息卡片 -->
        <el-card class="section-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <el-icon><InfoFilled /></el-icon>
              <span>基本信息</span>
            </div>
          </template>
          <div class="info-grid">
            <div class="info-item">
              <span class="label">工单号</span>
              <span class="value">{{ selectedWorkorder.id }}</span>
            </div>
            <div class="info-item">
              <span class="label">工单类型</span>
              <el-tag :type="selectedWorkorder.type === '维修' ? 'danger' : 'success'" size="small">
                {{ selectedWorkorder.type }}
              </el-tag>
            </div>
            <div class="info-item">
              <span class="label">客户名称</span>
              <span class="value">{{ selectedWorkorder.customerName }}</span>
            </div>
            <div class="info-item">
              <span class="label">当前状态</span>
              <el-tag :type="selectedWorkorder.status === '已完成' ? 'success' : 'warning'" size="small">
                {{ selectedWorkorder.status }}
              </el-tag>
            </div>
            <div class="info-item">
              <span class="label">设备型号</span>
              <span class="value">{{ selectedWorkorder.deviceModel || '-' }}</span>
            </div>
            <div class="info-item">
              <span class="label">设备序列号</span>
              <span class="value">{{ selectedWorkorder.serialNumber || '-' }}</span>
            </div>
            <div class="info-item">
              <span class="label">创建时间</span>
              <span class="value">{{ selectedWorkorder.createTime }}</span>
            </div>
            <div class="info-item">
              <span class="label">完成时间</span>
              <span class="value">{{ selectedWorkorder.finishTime || '-' }}</span>
            </div>
            <div class="info-item">
              <span class="label">工程师</span>
              <span class="value">{{ selectedWorkorder.engineer || '-' }}</span>
            </div>
          </div>
        </el-card>

        <!-- 问题描述卡片 -->
        <el-card class="section-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <el-icon><Document /></el-icon>
              <span>问题描述</span>
            </div>
          </template>
          <div class="content-box">
            {{ selectedWorkorder.problemDescription || '暂无问题描述' }}
          </div>
        </el-card>

        <!-- 解决方案卡片 -->
        <el-card class="section-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <el-icon><Check /></el-icon>
              <span>解决方案</span>
            </div>
          </template>
          <div class="content-box">
            {{ selectedWorkorder.solution || '暂无解决方案' }}
          </div>
        </el-card>

        <!-- 使用配件卡片 -->
        <el-card v-if="selectedWorkorder.parts && selectedWorkorder.parts.length > 0" class="section-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <el-icon><Box /></el-icon>
              <span>使用配件</span>
              <span class="item-count">共 {{ selectedWorkorder.parts.length }} 项</span>
            </div>
          </template>
          <div class="table-wrapper">
            <el-table :data="selectedWorkorder.parts" style="width: 100%" size="small">
              <el-table-column type="index" label="序号" width="50" align="center" />
              <el-table-column prop="name" label="配件名称" min-width="150" />
              <el-table-column prop="model" label="型号" width="150" />
              <el-table-column prop="quantity" label="数量" width="80" align="right" />
              <el-table-column prop="unit" label="单位" width="80" />
            </el-table>
          </div>
        </el-card>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted } from 'vue'
import { Plus, Search, ArrowDown, ArrowUp, Refresh, User, OfficeBuilding, Tools, InfoFilled, Box, Phone, Clock, Document, Check, Close } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import ConfigurableTable from '../components/ConfigurableTable.vue'

export default {
  name: 'Customer',
  components: {
    Plus,
    Search,
    ArrowDown,
    ArrowUp,
    Refresh,
    User,
    OfficeBuilding,
    Tools,
    InfoFilled,
    Box,
    Phone,
    Clock,
    Document,
    Check,
    Close,
    ConfigurableTable
  },
  setup() {
    // 快捷搜索
    const quickSearchKeyword = ref('')
    const showAdvancedSearch = ref(false)

    // 查询表单
    const queryForm = reactive({
      customerName: '',
      level: '',
      phone: '',
      dateRange: []
    })

    const searchQuery = ref('')
    const customerLevel = ref('')
    const currentPage = ref(1)
    const pageSize = ref(10)
    const total = ref(100)
    const dialogVisible = ref(false)
    const detailVisible = ref(false)
    const dialogTitle = ref('新增客户')

    // 是否移动端
    const isMobile = ref(false)

    // 检测是否为移动端
    const checkMobile = () => {
      isMobile.value = window.innerWidth <= 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    }

    // 监听窗口大小变化
    onMounted(() => {
      checkMobile()
      window.addEventListener('resize', checkMobile)
    })
    
    // 表格列配置 - 优化宽度适配
    const tableColumns = [
      { prop: 'id', label: '客户ID', width: 90, sortable: true },
      { prop: 'name', label: '客户名称', minWidth: 140, sortable: true },
      { prop: 'level', label: '客户等级', width: 110, sortable: true, slot: true },
      { prop: 'contact', label: '联系人', width: 110, sortable: true },
      { prop: 'phone', label: '联系电话', width: 140, sortable: true },
      { prop: 'address', label: '地址', minWidth: 180, sortable: true },
      { prop: 'createTime', label: '创建时间', width: 170, sortable: true }
    ]
    
    const selectedCustomer = ref({
      id: '',
      name: '',
      level: '',
      creditCode: '',
      address: '',
      legalPerson: '',
      contact: '',
      phone: '',
      email: '',
      createTime: '',
      contacts: [],
      assets: [],
      workorders: []
    })
    
    // 设备详情相关
    const assetDetailVisible = ref(false)
    const selectedAsset = ref({
      serialNumber: '',
      model: '',
      customerName: '',
      status: '',
      manufactureDate: '',
      salesDate: '',
      installDate: '',
      warrantyEndDate: '',
      isEL: false,
      installAddress: '',
      maintenanceHistory: [],
      workorders: []
    })
    
    // 工单详情相关
    const workorderDetailVisible = ref(false)
    const selectedWorkorder = ref({
      id: '',
      type: '',
      status: '',
      createTime: '',
      finishTime: '',
      customerName: '',
      deviceModel: '',
      serialNumber: '',
      problemDescription: '',
      solution: '',
      engineer: '',
      parts: []
    })
    
    const form = reactive({
      id: '',
      name: '',
      level: '普通',
      creditCode: '',
      address: '',
      legalPerson: '',
      contact: '',
      phone: '',
      email: ''
    })
    
    // 模拟客户数据
    const customers = ref([
      {
        id: 'C001',
        name: '上海某机械有限公司',
        level: 'VIP',
        contact: '张经理',
        phone: '13800138001',
        address: '上海市浦东新区张江高科技园区',
        createTime: '2024-01-15 10:30:00',
        creditCode: '91310000XXXXXXXXXX',
        legalPerson: '张三',
        email: 'zhang@example.com',
        contacts: [
          { id: 'CT001', name: '张经理', position: '总经理', phone: '13800138001', email: 'zhang@example.com', approvalStatus: '已通过', registerTime: '2024-01-10 09:00:00' },
          { id: 'CT002', name: '李工程师', position: '技术负责人', phone: '13800138002', email: 'li@example.com', approvalStatus: '已通过', registerTime: '2024-01-12 14:30:00' }
        ],
        assets: [
          { serialNumber: 'SN001', model: 'Model A', status: '运行中', installDate: '2026-01-10', warrantyEndDate: '2027-01-10' },
          { serialNumber: 'SN002', model: 'Model B', status: '运行中', installDate: '2026-01-15', warrantyEndDate: '2027-01-15' }
        ],
        workorders: [
          { id: 'WO001', type: '维修', status: '已完成', createTime: '2026-02-01', finishTime: '2026-02-02' },
          { id: 'WO002', type: '巡检', status: '已完成', createTime: '2026-02-15', finishTime: '2026-02-15' }
        ]
      },
      {
        id: 'C002',
        name: '北京某设备制造有限公司',
        level: '普通',
        contact: '李经理',
        phone: '13900139001',
        address: '北京市朝阳区建国路88号',
        createTime: '2024-02-20 14:20:00',
        creditCode: '91110000XXXXXXXXXX',
        legalPerson: '李四',
        email: 'li@example.com',
        contacts: [
          { id: 'CT003', name: '李经理', position: '采购经理', phone: '13900139001', email: 'li@example.com', approvalStatus: '待审核', registerTime: '2024-03-15 10:00:00' }
        ],
        assets: [
          { serialNumber: 'SN003', model: 'Model C', status: '运行中', installDate: '2026-02-01', warrantyEndDate: '2027-02-01' }
        ],
        workorders: [
          { id: 'WO003', type: '保养', status: '已完成', createTime: '2026-03-01', finishTime: '2026-03-01' }
        ]
      },
      {
        id: 'C003',
        name: '广州某工业设备有限公司',
        level: 'VIP',
        contact: '王经理',
        phone: '13700137001',
        address: '广州市天河区珠江新城',
        createTime: '2024-03-10 09:15:00',
        creditCode: '91440000XXXXXXXXXX',
        legalPerson: '王五',
        email: 'wang@example.com',
        contacts: [
          { id: 'CT004', name: '王经理', position: '设备主管', phone: '13700137001', email: 'wang@example.com', approvalStatus: '已通过', registerTime: '2024-02-20 11:00:00' }
        ],
        assets: [
          { serialNumber: 'SN004', model: 'Model A', status: '运行中', installDate: '2026-03-01', warrantyEndDate: '2027-03-01' }
        ],
        workorders: []
      }
    ])
    
    const handleAddCustomer = () => {
      dialogTitle.value = '新增客户'
      Object.keys(form).forEach(key => {
        form[key] = ''
      })
      form.level = '普通'
      dialogVisible.value = true
    }
    
    const handleEditCustomer = (row) => {
      dialogTitle.value = '编辑客户'
      Object.assign(form, row)
      dialogVisible.value = true
    }
    
    const handleViewCustomer = (row) => {
      selectedCustomer.value = row
      detailVisible.value = true
    }
    
    const handleDeleteCustomer = (id) => {
      // 模拟删除
      console.log('删除客户:', id)
    }
    
    const handleSubmit = () => {
      // 模拟提交
      console.log('提交表单:', form)
      dialogVisible.value = false
    }
    
    const handleSearch = () => {
      // 模拟搜索
      console.log('搜索:', searchQuery.value, customerLevel.value)
    }

    // 切换高级搜索显示
    const toggleAdvancedSearch = () => {
      showAdvancedSearch.value = !showAdvancedSearch.value
    }

    // 快捷搜索
    const handleQuickSearch = () => {
      const keyword = quickSearchKeyword.value.trim().toLowerCase()
      if (!keyword) {
        handleQuery()
        return
      }
      
      // 简单搜索逻辑
      console.log('快捷搜索:', keyword)
    }

    // 执行查询
    const handleQuery = () => {
      console.log('高级查询:', queryForm)
    }

    // 重置查询
    const handleReset = () => {
      quickSearchKeyword.value = ''
      queryForm.customerName = ''
      queryForm.level = ''
      queryForm.phone = ''
      queryForm.dateRange = []
      handleQuery()
    }

    // 计算过滤后的客户列表
    const filteredCustomers = computed(() => {
      let result = customers.value
      
      // 快捷搜索过滤
      const keyword = quickSearchKeyword.value.trim().toLowerCase()
      if (keyword) {
        result = result.filter(customer =>
          (customer.name && customer.name.toLowerCase().includes(keyword)) ||
          (customer.contact && customer.contact.toLowerCase().includes(keyword))
        )
      }
      
      // 高级筛选
      if (queryForm.customerName) {
        result = result.filter(customer =>
          customer.name.toLowerCase().includes(queryForm.customerName.toLowerCase())
        )
      }
      if (queryForm.level) {
        result = result.filter(customer => customer.level === queryForm.level)
      }
      if (queryForm.phone) {
        result = result.filter(customer =>
          customer.phone.includes(queryForm.phone)
        )
      }
      if (queryForm.dateRange && queryForm.dateRange.length === 2) {
        const startDate = queryForm.dateRange[0]
        const endDate = queryForm.dateRange[1]
        result = result.filter(customer => {
          const createTime = customer.createTime.split(' ')[0]
          return createTime >= startDate && createTime <= endDate
        })
      }
      
      return result
    })

    // 计算表格高度
    const tableHeight = computed(() => {
      const baseHeight = 300
      const rowCount = filteredCustomers.value.length
      const rowHeight = 50
      const maxHeight = window.innerHeight - 300
      
      const calculatedHeight = baseHeight + (rowCount * rowHeight)
      return Math.min(calculatedHeight, maxHeight)
    })
    
    const handleSizeChange = (size) => {
      pageSize.value = size
    }
    
    const handleCurrentChange = (current) => {
      currentPage.value = current
    }
    
    // 计算当前选中客户的联系人列表
    const selectedCustomerContacts = computed(() => {
      return selectedCustomer.value?.contacts || []
    })

    // 获取联系人状态标签类型
    const getContactStatusType = (status) => {
      const statusMap = {
        '已通过': 'success',
        '待审核': 'warning',
        '已拒绝': 'danger'
      }
      return statusMap[status] || 'info'
    }

    const handleAddContact = () => {
      // 模拟添加联系人
      console.log('添加联系人')
      ElMessage.info('添加联系人功能开发中...')
    }

    const handleViewContact = (contact) => {
      console.log('查看联系人:', contact)
      ElMessage.info(`查看联系人: ${contact.name}`)
    }

    const handleEditContact = (contact) => {
      console.log('编辑联系人:', contact)
      ElMessage.info(`编辑联系人: ${contact.name}`)
    }

    const handleDeleteContact = (contactId) => {
      console.log('删除联系人:', contactId)
      ElMessage.success('联系人删除成功')
    }
    
    // 查看设备详情
    const handleViewAsset = (asset) => {
      // 打开设备详情对话框
      selectedAsset.value = {
        ...asset,
        customerName: selectedCustomer.value.name,
        manufactureDate: asset.manufactureDate || '2025-12-01',
        salesDate: asset.salesDate || '2026-01-05',
        maintenanceHistory: [
          { date: '2026-02-15', type: '定期保养', content: '更换润滑油，检查各部件', engineer: '王工程师', result: '正常' },
          { date: '2026-01-20', type: '故障维修', content: '更换轴承', engineer: '李工程师', result: '修复' }
        ],
        workorders: [
          { id: 'WO001', type: '维修', createTime: '2026-02-01', finishTime: '2026-02-02', status: '已完成' },
          { id: 'WO002', type: '巡检', createTime: '2026-02-15', finishTime: '2026-02-15', status: '已完成' }
        ]
      }
      assetDetailVisible.value = true
    }
    
    // 查看工单详情
    const handleViewWorkorder = (workorder) => {
      // 根据工单类型生成不同的详情数据
      const workorderDetails = {
        'WO001': {
          ...workorder,
          customerName: selectedCustomer.value.name,
          deviceModel: 'Model A',
          serialNumber: 'SN001',
          engineer: '王工程师',
          problemDescription: '设备运行过程中出现异常噪音，经检查发现轴承磨损严重，需要更换。',
          solution: '更换主轴承，调整皮带张力，清洁设备内部，添加润滑油。设备已恢复正常运行。',
          parts: [
            { name: '主轴承', model: '6205-2RS', quantity: 2, unit: '个' },
            { name: '润滑油', model: 'ISO VG68', quantity: 5, unit: '升' }
          ]
        },
        'WO002': {
          ...workorder,
          customerName: selectedCustomer.value.name,
          deviceModel: 'Model B',
          serialNumber: 'SN002',
          engineer: '李工程师',
          problemDescription: '定期巡检，设备运行正常，无异常现象。',
          solution: '完成定期巡检，清洁设备表面，检查各连接部位，紧固松动的螺丝。设备运行状态良好。',
          parts: []
        },
        'WO003': {
          ...workorder,
          customerName: selectedCustomer.value.name,
          deviceModel: 'Model C',
          serialNumber: 'SN003',
          engineer: '张工程师',
          problemDescription: '定期保养，更换易损件。',
          solution: '更换滤芯，清洁散热器，检查电气系统，补充冷却液。',
          parts: [
            { name: '滤芯', model: 'FL-100', quantity: 1, unit: '个' },
            { name: '冷却液', model: 'CL-50', quantity: 2, unit: '升' }
          ]
        }
      }
      
      selectedWorkorder.value = workorderDetails[workorder.id] || {
        ...workorder,
        customerName: selectedCustomer.value.name,
        deviceModel: '未知型号',
        serialNumber: '未知序列号',
        engineer: '未知工程师',
        problemDescription: '暂无问题描述',
        solution: '暂无解决方案',
        parts: []
      }
      workorderDetailVisible.value = true
    }
    
    // 获取客户等级标签类型
    const getLevelType = (level) => {
      const typeMap = {
        'VIP': 'danger',
        '普通': 'info',
        '潜在': 'warning'
      }
      return typeMap[level] || 'info'
    }
    
    // 处理排序变化
    const handleSortChange = ({ prop, order }) => {
      console.log('排序:', prop, order)
      // 实际项目中这里会调用API进行排序
    }
    
    // 获取客户等级标签类型
    const getCustomerLevelType = (level) => {
      const typeMap = {
        'VIP': 'danger',
        '重要': 'warning',
        '普通': 'info',
        '潜在客户': 'success'
      }
      return typeMap[level] || 'info'
    }

    return {
      searchQuery,
      customerLevel,
      quickSearchKeyword,
      showAdvancedSearch,
      queryForm,
      currentPage,
      pageSize,
      total,
      dialogVisible,
      detailVisible,
      isMobile,
      dialogTitle,
      tableColumns,
      customers,
      filteredCustomers,
      tableHeight,
      form,
      selectedCustomer,
      selectedAsset,
      selectedWorkorder,
      assetDetailVisible,
      workorderDetailVisible,
      selectedCustomerContacts,
      getContactStatusType,
      getLevelType,
      getCustomerLevelType,
      handleSortChange,
      handleAddCustomer,
      handleEditCustomer,
      handleViewCustomer,
      handleDeleteCustomer,
      handleSubmit,
      handleSearch,
      toggleAdvancedSearch,
      handleQuickSearch,
      handleQuery,
      handleReset,
      handleSizeChange,
      handleCurrentChange,
      handleAddContact,
      handleViewContact,
      handleEditContact,
      handleDeleteContact,
      handleViewAsset,
      handleViewWorkorder
    }
  }
}
</script>

<style scoped>
.customer {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.quick-search-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.query-form {
  margin-bottom: 20px;
}

.advanced-search-panel {
  margin-top: 10px;
}

.search-bar {
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}

.section-title {
  margin: 20px 0 10px;
  padding-bottom: 10px;
  border-bottom: 1px solid #e8e8e8;
}

.contact-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.mb-4 {
  margin-bottom: 16px;
}

.mt-4 {
  margin-top: 16px;
}

.mb-2 {
  margin-bottom: 8px;
}

.workorder-section {
  margin: 20px 0;
}

.workorder-section h4 {
  color: #303133;
  margin-bottom: 10px;
  font-size: 16px;
}

.workorder-section p {
  color: #606266;
  line-height: 1.8;
  padding: 10px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

/* 详情弹窗统一样式 */
.detail-container {
  max-height: 650px;
  overflow-y: auto;
  padding: 0 10px;
}

:deep(.customer-detail-dialog.is-fullscreen) .detail-container,
:deep(.asset-detail-dialog.is-fullscreen) .detail-container,
:deep(.workorder-detail-dialog.is-fullscreen) .detail-container {
  max-height: calc(100vh - 120px);
}

/* 头部信息卡片 */
.header-card {
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

.header-left {
  flex: 1;
}

.detail-title {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 12px;
}

.detail-title .el-icon {
  font-size: 28px;
}

.detail-meta {
  display: flex;
  gap: 24px;
  font-size: 14px;
  opacity: 0.9;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.header-right {
  text-align: right;
}

.amount-display {
  background: rgba(255, 255, 255, 0.15);
  padding: 16px 24px;
  border-radius: 8px;
  backdrop-filter: blur(10px);
}

.amount-display .label {
  font-size: 14px;
  opacity: 0.9;
  margin-bottom: 4px;
}

.amount-display .amount {
  font-size: 28px;
  font-weight: bold;
  color: #fff;
}

/* 通用卡片样式 */
.section-card {
  margin-bottom: 24px;
  border-radius: 8px;
}

.section-card :deep(.el-card__header) {
  padding: 12px 16px;
  background-color: #f5f7fa;
  border-bottom: 1px solid #e4e7ed;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #303133;
}

.item-count {
  margin-left: 8px;
  font-size: 13px;
  color: #909399;
  font-weight: normal;
}

.header-action {
  margin-left: auto;
}

.section-card :deep(.el-card__body) {
  padding: 20px;
}

/* 信息网格 */
.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background-color: #f5f7fa;
  border-radius: 6px;
}

.info-item .label {
  color: #909399;
  font-size: 13px;
}

.info-item .value {
  color: #303133;
  font-weight: 500;
  font-size: 14px;
}

.info-item .value.amount {
  color: #f56c6c;
  font-weight: bold;
}

.info-item .value.purchase {
  color: #409eff;
  font-weight: bold;
}

/* 内容盒子 */
.content-box {
  padding: 16px;
  background-color: #f5f7fa;
  border-radius: 6px;
  color: #606266;
  line-height: 1.8;
  min-height: 60px;
}

/* 表格包装器 */
.table-wrapper {
  overflow-x: auto;
}

/* 详情标签页 */
.detail-tabs :deep(.el-tabs__header) {
  margin-bottom: 20px;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .search-bar {
    flex-direction: column;
    align-items: stretch;
  }
  
  .search-bar .el-input,
  .search-bar .el-select {
    width: 100% !important;
    margin-right: 0 !important;
    margin-bottom: 10px;
  }
  
  .card-header {
    flex-direction: column;
    gap: 10px;
  }
  
  .pagination {
    justify-content: center;
  }
  
  .el-pagination {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
  }
  
  /* 详情对话框全屏 */
  .customer :deep(.el-dialog) {
    width: 100% !important;
    margin: 0 !important;
    height: 100vh;
    max-height: 100vh;
    border-radius: 0;
    display: flex;
    flex-direction: column;
  }
  
  .customer :deep(.el-dialog__header) {
    padding: 12px 15px;
    flex-shrink: 0;
    border-bottom: 1px solid #e4e7ed;
  }
  
  .customer :deep(.el-dialog__body) {
    flex: 1;
    overflow-y: auto;
    padding: 10px;
    -webkit-overflow-scrolling: touch;
    max-height: calc(100vh - 55px);
  }
  
  /* 描述列表 - 每行一个字段 */
  .customer :deep(.el-descriptions) {
    font-size: 14px;
    width: 100% !important;
  }
  
  .customer :deep(.el-descriptions__body .el-descriptions__table) {
    width: 100% !important;
    table-layout: fixed !important;
    display: block !important;
  }
  
  .customer :deep(.el-descriptions__body .el-descriptions__table tbody) {
    display: block !important;
    width: 100% !important;
  }
  
  .customer :deep(.el-descriptions__body .el-descriptions__table tr) {
    display: block !important;
    width: 100% !important;
  }
  
  .customer :deep(.el-descriptions__body .el-descriptions__table td) {
    display: flex !important;
    flex-direction: row !important;
    align-items: flex-start !important;
    padding: 10px 0 !important;
    border-bottom: 1px solid #ebeef5 !important;
    width: 100% !important;
    box-sizing: border-box !important;
  }
  
  .customer :deep(.el-descriptions-item) {
    display: flex !important;
    flex-direction: row !important;
    align-items: flex-start !important;
    width: 100% !important;
  }
  
  .customer :deep(.el-descriptions-item__cell) {
    display: flex !important;
    flex-direction: row !important;
    width: 100% !important;
  }
  
  .customer :deep(.el-descriptions-item__label) {
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
  
  .customer :deep(.el-descriptions-item__content) {
    flex: 1 !important;
    font-size: 14px !important;
    color: #303133 !important;
    padding: 0 !important;
    line-height: 1.5 !important;
    word-break: break-all !important;
    overflow-wrap: break-word !important;
    display: inline-block !important;
  }

  /* 详情弹窗移动端适配 */
  .header-card {
    flex-direction: column;
    gap: 16px;
    padding: 16px 20px;
    margin-bottom: 16px;
  }

  .detail-title {
    font-size: 18px;
  }

  .detail-title .el-icon {
    font-size: 22px;
  }

  .detail-meta {
    flex-wrap: wrap;
    gap: 8px;
    font-size: 12px;
  }

  .amount-display {
    padding: 12px 20px;
    width: 100%;
    text-align: center;
  }

  .amount-display .amount {
    font-size: 22px;
  }

  .section-card {
    margin-bottom: 16px;
  }

  .section-card :deep(.el-card__body) {
    padding: 12px;
  }

  .info-grid {
    grid-template-columns: 1fr;
    gap: 10px;
  }

  .info-item {
    padding: 10px;
  }

  .card-header {
    flex-wrap: wrap;
  }

  .header-action {
    margin-left: 0;
    margin-top: 8px;
    width: 100%;
  }
}

@media (max-width: 480px) {
  .detail-container {
    padding: 0 8px;
  }

  .header-card {
    padding: 12px 16px;
    border-radius: 8px;
  }

  .detail-title {
    font-size: 16px;
  }

  .detail-meta {
    flex-direction: column;
    gap: 6px;
  }

  .section-card {
    border-radius: 6px;
  }

  .card-header {
    font-size: 14px;
  }

  .content-box {
    padding: 12px;
  }
}

@media (max-width: 480px) {
  .el-form-item__label {
    width: 80px !important;
  }
  
  .el-form-item__content {
    margin-left: 80px !important;
  }
  
  .el-descriptions__label {
    font-size: 12px;
  }
  
  .el-tabs__item {
    font-size: 12px;
    padding: 0 8px;
  }
  
  .workorder-section {
    margin: 15px 0;
  }
  
  .workorder-section h4 {
    font-size: 14px;
    margin-bottom: 8px;
  }
  
  .workorder-section p {
    font-size: 12px;
    line-height: 1.6;
  }
}
</style>
