<template>
  <div class="user-approval">
    <!-- 统计看板 -->
    <el-row :gutter="20" class="stats-board">
      <el-col :xs="12" :sm="12" :md="6" :lg="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-item">
            <div class="stat-icon pending">
              <el-icon><Timer /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ pendingCount }}</div>
              <div class="stat-label">今日待审核</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="12" :md="6" :lg="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-item">
            <div class="stat-icon week">
              <el-icon><Calendar /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ weekPendingCount }}</div>
              <div class="stat-label">本周待审核</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="12" :md="6" :lg="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-item">
            <div class="stat-icon overdue">
              <el-icon><Warning /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ overdueCount }}</div>
              <div class="stat-label">超期未审核</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="12" :md="6" :lg="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-item">
            <div class="stat-icon rate">
              <el-icon><TrendCharts /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ approvalRate }}%</div>
              <div class="stat-label">审核通过率</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-card shadow="hover" class="mb-4">
      <template #header>
        <div class="card-header">
          <span>用户审核管理</span>
          <div class="header-actions">
            <el-button type="primary" @click="handleBatchAssign" v-if="selectedRows.length > 0">
              批量分配 ({{ selectedRows.length }})
            </el-button>
          </div>
        </div>
      </template>

      <!-- 搜索栏 -->
      <div class="search-bar">
        <el-input
          v-model="searchQuery"
          placeholder="搜索姓名、手机号或公司名称"
          style="width: 300px; margin-right: 10px"
          clearable
        />
        <el-select
          v-model="filterStatus"
          placeholder="审核状态"
          style="width: 150px; margin-right: 10px"
          clearable
        >
          <el-option label="全部" value="" />
          <el-option label="待审核" value="待审核" />
          <el-option label="待补充" value="待补充" />
          <el-option label="已通过" value="已通过" />
          <el-option label="已拒绝" value="已拒绝" />
        </el-select>
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          style="margin-right: 10px"
        />
        <el-button type="primary" @click="handleSearch">搜索</el-button>
        <el-button @click="resetSearch">重置</el-button>
      </div>

      <!-- 审核列表 -->
      <ConfigurableTable
        :data="filteredApprovals"
        :columns="tableColumns"
        storage-key="user-approval"
        :show-operation="true"
        :operation-width="280"
        @sort-change="handleSortChange"
        @selection-change="handleSelectionChange"
        class="mt-4"
      >
        <template #status="{ row }">
          <el-tag :type="getStatusType(row.status)">{{ row.status }}</el-tag>
        </template>
        <template #similarityWarning="{ row }">
          <el-tag v-if="row.similarCompanies && row.similarCompanies.length > 0" type="danger" size="small">
            <el-icon><Warning /></el-icon>
            相似企业
          </el-tag>
          <span v-else>-</span>
        </template>
        <template #operation="{ row }">
          <div class="operation-buttons">
            <el-button type="primary" size="small" @click="handleViewDetail(row)">
              查看
            </el-button>
            <template v-if="row.status === '待审核'">
              <el-button type="success" size="small" @click="handleApprove(row)">
                通过
              </el-button>
              <el-button type="warning" size="small" @click="handleRequestMoreInfo(row)">
                补充
              </el-button>
              <el-button type="danger" size="small" @click="handleReject(row)">
                拒绝
              </el-button>
            </template>
            <template v-if="row.status === '待补充'">
              <el-button type="primary" size="small" @click="handleViewDetail(row)">
                查看补充
              </el-button>
            </template>
            <el-button v-if="row.status !== '待审核'" type="info" size="small" @click="handleViewHistory(row)">
              记录
            </el-button>
          </div>
        </template>
      </ConfigurableTable>

      <!-- 分页 -->
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

    <!-- 审核详情对话框 -->
    <el-dialog
      title="审核详情"
      v-model="detailVisible"
      width="800px"
    >
      <!-- 相似企业警告 -->
      <el-alert
        v-if="selectedApproval && selectedApproval.similarCompanies && selectedApproval.similarCompanies.length > 0"
        title="发现相似企业，请仔细核对"
        type="warning"
        :closable="false"
        class="mb-4"
      >
        <div class="similar-companies-list">
          <div
            v-for="company in selectedApproval.similarCompanies"
            :key="company.id"
            class="similar-company-item"
          >
            <span class="company-name">{{ company.name }}</span>
            <el-tag size="small" :type="company.similarity > 0.9 ? 'danger' : 'warning'">
              {{ (company.similarity * 100).toFixed(0) }}% 相似
            </el-tag>
            <el-button type="primary" link size="small" @click="handleMergeCompany(company)">
              合并到此企业
            </el-button>
          </div>
        </div>
      </el-alert>

      <el-descriptions :column="2" border v-if="selectedApproval">
        <el-descriptions-item label="申请编号">{{ selectedApproval.id }}</el-descriptions-item>
        <el-descriptions-item label="申请时间">{{ selectedApproval.submitTime }}</el-descriptions-item>
        <el-descriptions-item label="审核状态">
          <el-tag :type="getStatusType(selectedApproval.status)">{{ selectedApproval.status }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="审核时间" v-if="selectedApproval.approvalTime">
          {{ selectedApproval.approvalTime }}
        </el-descriptions-item>
      </el-descriptions>

      <h4 class="section-title">个人信息</h4>
      <el-descriptions :column="2" border v-if="selectedApproval">
        <el-descriptions-item label="姓名">{{ selectedApproval.name }}</el-descriptions-item>
        <el-descriptions-item label="手机号">{{ selectedApproval.phone }}</el-descriptions-item>
        <el-descriptions-item label="邮箱">{{ selectedApproval.email || '-' }}</el-descriptions-item>
        <el-descriptions-item label="职位">{{ selectedApproval.position }}</el-descriptions-item>
      </el-descriptions>

      <h4 class="section-title">公司信息</h4>
      <el-descriptions :column="1" border v-if="selectedApproval">
        <el-descriptions-item label="公司名称">{{ selectedApproval.companyName }}</el-descriptions-item>
        <el-descriptions-item label="统一社会信用代码">{{ selectedApproval.creditCode || '未填写' }}</el-descriptions-item>
        <el-descriptions-item label="公司地址">{{ selectedApproval.companyAddress }}</el-descriptions-item>
        <el-descriptions-item label="公司电话">{{ selectedApproval.companyPhone || '未填写' }}</el-descriptions-item>
        <el-descriptions-item label="行业类型">{{ selectedApproval.industry || '未填写' }}</el-descriptions-item>
      </el-descriptions>

      <!-- 天眼查信息对比（如有） -->
      <template v-if="tianyanchaInfo">
        <h4 class="section-title">天眼查信息对比</h4>
        <el-descriptions :column="1" border>
          <el-descriptions-item label="企业名称">{{ tianyanchaInfo.name }}</el-descriptions-item>
          <el-descriptions-item label="统一社会信用代码">{{ tianyanchaInfo.creditCode }}</el-descriptions-item>
          <el-descriptions-item label="注册地址">{{ tianyanchaInfo.address }}</el-descriptions-item>
          <el-descriptions-item label="法人代表">{{ tianyanchaInfo.legalPerson }}</el-descriptions-item>
          <el-descriptions-item label="企业状态">{{ tianyanchaInfo.status }}</el-descriptions-item>
        </el-descriptions>
        <el-alert
          title="以上信息来自天眼查，仅供参考"
          type="info"
          :closable="false"
          class="mt-2"
        />
      </template>

      <!-- 公司是否存在提示 -->
      <el-alert
        v-if="selectedApproval && selectedApproval.status === '待审核' && !selectedApproval.similarCompanies?.length"
        :title="companyExists ? '该公司已存在于系统中' : '该公司未在系统中注册，审核通过后将自动创建'"
        :type="companyExists ? 'info' : 'warning'"
        :closable="false"
        class="mt-4"
      />

      <template #footer v-if="selectedApproval && (selectedApproval.status === '待审核' || selectedApproval.status === '待补充')">
        <span class="dialog-footer">
          <el-button @click="detailVisible = false">取消</el-button>
          <el-button type="danger" @click="handleReject(selectedApproval)">拒绝</el-button>
          <el-button type="warning" @click="handleRequestMoreInfo(selectedApproval)">要求补充</el-button>
          <el-button v-if="!companyExists && !selectedApproval.similarCompanies?.length" type="success" @click="handleApprove(selectedApproval)">
            通过
          </el-button>
          <el-button v-if="selectedApproval.similarCompanies?.length" type="primary" @click="showMergeOptions">
            合并企业
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 审核操作对话框 -->
    <el-dialog
      :title="approvalDialogTitle"
      v-model="approvalDialogVisible"
      width="500px"
    >
      <el-form :model="approvalForm" label-width="100px">
        <el-form-item label="联系人">
          <span>{{ selectedApproval?.name }}</span>
        </el-form-item>
        <el-form-item label="公司名称">
          <span>{{ selectedApproval?.companyName }}</span>
        </el-form-item>
        
        <!-- 通过审核时显示分配业务助理 -->
        <el-form-item label="分配业务助理" v-if="approvalAction === 'approve'">
          <el-select v-model="approvalForm.assignedSales" placeholder="选择业务助理" style="width: 100%">
            <el-option
              v-for="sales in salesList"
              :key="sales.id"
              :label="sales.name"
              :value="sales.id"
            />
          </el-select>
        </el-form-item>
        
        <!-- 要求补充信息时显示补充项 -->
        <el-form-item label="补充项" v-if="approvalAction === 'requestMoreInfo'">
          <el-checkbox-group v-model="approvalForm.requestItems">
            <el-checkbox label="businessLicense">营业执照</el-checkbox>
            <el-checkbox label="detailedAddress">详细地址</el-checkbox>
            <el-checkbox label="companyWebsite">企业官网</el-checkbox>
            <el-checkbox label="other">其他材料</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        
        <el-form-item :label="approvalRemarkLabel" prop="remark">
          <el-input
            v-model="approvalForm.remark"
            type="textarea"
            :rows="3"
            :placeholder="approvalRemarkPlaceholder"
          />
        </el-form-item>
        
        <el-form-item v-if="approvalAction === 'reject'" label="通知方式">
          <el-checkbox-group v-model="approvalForm.notifyMethods">
            <el-checkbox label="sms">短信通知</el-checkbox>
            <el-checkbox label="email">邮件通知</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="approvalDialogVisible = false">取消</el-button>
          <el-button 
            :type="approvalActionType" 
            @click="confirmApproval"
            :loading="approving"
          >
            {{ approvalConfirmText }}
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 合并企业对话框 -->
    <el-dialog
      title="合并到已有企业"
      v-model="mergeDialogVisible"
      width="600px"
    >
      <el-alert
        title="请选择要合并到的已有企业"
        description="合并后，该联系人将关联到已有企业，新企业申请将被废弃。"
        type="warning"
        :closable="false"
        class="mb-4"
      />
      <el-table :data="selectedApproval?.similarCompanies || []" style="width: 100%">
        <el-table-column prop="name" label="企业名称" />
        <el-table-column prop="creditCode" label="统一社会信用代码" width="180" />
        <el-table-column label="相似度" width="100">
          <template #default="{ row }">
            <el-tag :type="row.similarity > 0.9 ? 'danger' : 'warning'">
              {{ (row.similarity * 100).toFixed(0) }}%
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="confirmMerge(row)">
              选择
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>

    <!-- 批量分配对话框 -->
    <el-dialog
      title="批量分配审核任务"
      v-model="batchAssignVisible"
      width="500px"
    >
      <el-form label-width="100px">
        <el-form-item label="已选任务">
          <span>{{ selectedRows.length }} 个审核任务</span>
        </el-form-item>
        <el-form-item label="分配给">
          <el-select v-model="batchAssignTo" placeholder="选择审核人" style="width: 100%">
            <el-option
              v-for="user in reviewerList"
              :key="user.id"
              :label="user.name"
              :value="user.id"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="batchAssignVisible = false">取消</el-button>
          <el-button type="primary" @click="confirmBatchAssign" :loading="batchAssigning">
            确认分配
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 审核历史对话框 -->
    <el-dialog
      title="审核历史记录"
      v-model="historyVisible"
      width="600px"
    >
      <el-timeline v-if="selectedApproval && selectedApproval.history">
        <el-timeline-item
          v-for="(record, index) in selectedApproval.history"
          :key="index"
          :type="record.type"
          :timestamp="record.time"
        >
          <h4>{{ record.title }}</h4>
          <p>{{ record.content }}</p>
          <p v-if="record.operator"><small>操作人: {{ record.operator }}</small></p>
        </el-timeline-item>
      </el-timeline>
      <el-empty v-else description="暂无审核历史记录" />
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, computed, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Timer, Calendar, Warning, TrendCharts } from '@element-plus/icons-vue'
import ConfigurableTable from '../components/ConfigurableTable.vue'
import { state as userApprovalState, setApprovalRecords, updateApprovalRecordStatus } from '../stores/userApprovalStore'

export default {
  name: 'UserApproval',
  components: {
    ConfigurableTable,
    Timer,
    Calendar,
    Warning,
    TrendCharts
  },
  setup() {
    // 搜索和筛选
    const searchQuery = ref('')
    const filterStatus = ref('')
    const dateRange = ref(null)
    const currentPage = ref(1)
    const pageSize = ref(10)
    const total = ref(0)

    // 对话框控制
    const detailVisible = ref(false)
    const approvalDialogVisible = ref(false)
    const historyVisible = ref(false)
    const mergeDialogVisible = ref(false)
    const batchAssignVisible = ref(false)
    const approving = ref(false)
    const batchAssigning = ref(false)

    // 当前选中的审核记录
    const selectedApproval = ref(null)
    const approvalAction = ref('') // 'approve' | 'reject' | 'requestMoreInfo'
    const companyExists = ref(false)
    const tianyanchaInfo = ref(null)

    // 批量选择
    const selectedRows = ref([])
    const batchAssignTo = ref('')

    // 审核表单
    const approvalForm = reactive({
      remark: '',
      notifyMethods: ['sms', 'email'],
      assignedSales: '',
      requestItems: []
    })

    // 业务助理列表（模拟数据）
    const salesList = ref([
      { id: 'SALES001', name: '张业务助理' },
      { id: 'SALES002', name: '李业务助理' },
      { id: 'SALES003', name: '王业务助理' }
    ])

    // 审核人列表（模拟数据）
    const reviewerList = ref([
      { id: 'REVIEWER001', name: '审核专员A' },
      { id: 'REVIEWER002', name: '审核专员B' },
      { id: 'REVIEWER003', name: '客服主管' }
    ])

    // 表格列配置
    // 用户审核表格列配置 - 优化宽度适配
    const tableColumns = [
      { type: 'selection', width: 55 },
      { prop: 'id', label: '申请编号', width: 150, sortable: true },
      { prop: 'name', label: '姓名', width: 100, sortable: true },
      { prop: 'phone', label: '手机号', width: 130, sortable: true },
      { prop: 'companyName', label: '公司名称', minWidth: 180, sortable: true },
      { prop: 'position', label: '职位', width: 110, sortable: true },
      { prop: 'status', label: '审核状态', width: 100, sortable: true, slot: true },
      { prop: 'similarityWarning', label: '重复警告', width: 100, slot: true },
      { prop: 'submitTime', label: '申请时间', width: 170, sortable: true }
    ]

    // 从全局 store 初始化审核数据
    const approvals = ref([...userApprovalState.approvalRecords])

    // 同步审核数据到全局 store
    watch(approvals, (newRecords) => {
      setApprovalRecords(newRecords)
    }, { deep: true, immediate: true })

    // 计算统计数据
    const pendingCount = computed(() => approvals.value.filter(a => a.status === '待审核').length)
    const approvedCount = computed(() => approvals.value.filter(a => a.status === '已通过').length)
    const rejectedCount = computed(() => approvals.value.filter(a => a.status === '已拒绝').length)
    
    // 本周待审核数量
    const weekPendingCount = computed(() => {
      const now = new Date()
      const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay())
      return approvals.value.filter(a => {
        const submitDate = new Date(a.submitTime)
        return a.status === '待审核' && submitDate >= weekStart
      }).length
    })
    
    // 超期未审核数量（超过3个工作日）
    const overdueCount = computed(() => {
      const now = new Date()
      return approvals.value.filter(a => {
        if (a.status !== '待审核') return false
        const submitDate = new Date(a.submitTime)
        const diffDays = Math.floor((now - submitDate) / (1000 * 60 * 60 * 24))
        return diffDays > 3
      }).length
    })
    
    // 审核通过率
    const approvalRate = computed(() => {
      const total = approvedCount.value + rejectedCount.value
      if (total === 0) return 0
      return Math.round((approvedCount.value / total) * 100)
    })

    // 对话框标题和按钮文本计算
    const approvalDialogTitle = computed(() => {
      const titles = {
        'approve': '通过审核',
        'reject': '拒绝审核',
        'requestMoreInfo': '要求补充信息'
      }
      return titles[approvalAction.value] || '审核操作'
    })
    
    const approvalActionType = computed(() => {
      const types = {
        'approve': 'success',
        'reject': 'danger',
        'requestMoreInfo': 'warning'
      }
      return types[approvalAction.value] || 'primary'
    })
    
    const approvalConfirmText = computed(() => {
      const texts = {
        'approve': '确认通过',
        'reject': '确认拒绝',
        'requestMoreInfo': '确认退回'
      }
      return texts[approvalAction.value] || '确认'
    })
    
    const approvalRemarkLabel = computed(() => {
      const labels = {
        'approve': '审核备注',
        'reject': '拒绝原因',
        'requestMoreInfo': '补充说明'
      }
      return labels[approvalAction.value] || '备注'
    })
    
    const approvalRemarkPlaceholder = computed(() => {
      const placeholders = {
        'approve': '请输入审核备注（可选）',
        'reject': '请输入拒绝原因',
        'requestMoreInfo': '请输入需要补充的信息说明'
      }
      return placeholders[approvalAction.value] || '请输入备注'
    })

    // 过滤后的审核列表
    const filteredApprovals = computed(() => {
      let result = approvals.value

      // 搜索过滤
      if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase()
        result = result.filter(a => 
          a.name.toLowerCase().includes(query) ||
          a.phone.includes(query) ||
          a.companyName.toLowerCase().includes(query)
        )
      }

      // 状态过滤
      if (filterStatus.value) {
        result = result.filter(a => a.status === filterStatus.value)
      }

      // 日期过滤
      if (dateRange.value && dateRange.value.length === 2) {
        const startDate = new Date(dateRange.value[0])
        const endDate = new Date(dateRange.value[1])
        result = result.filter(a => {
          const submitDate = new Date(a.submitTime)
          return submitDate >= startDate && submitDate <= endDate
        })
      }

      total.value = result.length
      return result
    })

    // 获取状态标签类型
    const getStatusType = (status) => {
      const statusMap = {
        '待审核': 'warning',
        '待补充': 'info',
        '已通过': 'success',
        '已拒绝': 'danger'
      }
      return statusMap[status] || 'info'
    }

    // 查看详情
    const handleViewDetail = (row) => {
      selectedApproval.value = row
      // 检查公司是否已存在（模拟）
      companyExists.value = ['上海某机械有限公司', '北京某设备制造有限公司'].includes(row.companyName)
      // 模拟天眼查信息
      if (row.creditCode) {
        tianyanchaInfo.value = {
          name: row.companyName,
          creditCode: row.creditCode,
          address: row.companyAddress,
          legalPerson: '张三',
          status: '存续'
        }
      } else {
        tianyanchaInfo.value = null
      }
      detailVisible.value = true
    }

    // 通过审核
    const handleApprove = (row) => {
      selectedApproval.value = row
      approvalAction.value = 'approve'
      approvalForm.remark = ''
      approvalForm.assignedSales = ''
      approvalDialogVisible.value = true
    }

    // 拒绝审核
    const handleReject = (row) => {
      selectedApproval.value = row
      approvalAction.value = 'reject'
      approvalForm.remark = ''
      approvalDialogVisible.value = true
    }

    // 要求补充信息
    const handleRequestMoreInfo = (row) => {
      selectedApproval.value = row
      approvalAction.value = 'requestMoreInfo'
      approvalForm.remark = ''
      approvalForm.requestItems = []
      approvalDialogVisible.value = true
    }

    // 确认审核操作
    const confirmApproval = async () => {
      if (approvalAction.value === 'reject' && !approvalForm.remark) {
        ElMessage.error('请输入拒绝原因')
        return
      }
      
      if (approvalAction.value === 'requestMoreInfo' && approvalForm.requestItems.length === 0) {
        ElMessage.error('请至少选择一项需要补充的信息')
        return
      }

      approving.value = true

      // 模拟API调用
      setTimeout(() => {
        const approval = selectedApproval.value
        const now = new Date().toLocaleString()

        if (approvalAction.value === 'approve') {
          // 更新状态为已通过
          approval.status = '已通过'
          approval.approvalTime = now

          // 添加历史记录
          approval.history.push({
            title: '审核通过',
            content: approvalForm.remark || '管理员审核通过',
            time: now,
            type: 'success',
            operator: '管理员'
          })

          // 自动创建联系人和客户记录（模拟）
          if (!companyExists.value) {
            approval.history.push({
              title: '自动创建客户',
              content: `系统自动创建客户记录：${approval.companyName}`,
              time: now,
              type: 'success',
              operator: '系统自动'
            })
          }

          approval.history.push({
            title: '自动创建联系人',
            content: `系统自动创建联系人记录：${approval.name}`,
            time: now,
            type: 'success',
            operator: '系统自动'
          })
          
          // 分配业务助理
          if (approvalForm.assignedSales) {
            const sales = salesList.value.find(s => s.id === approvalForm.assignedSales)
            approval.history.push({
              title: '分配业务助理',
              content: `分配业务助理：${sales?.name || '未指定'}`,
              time: now,
              type: 'info',
              operator: '系统自动'
            })
          }

          ElMessage.success('审核通过，已自动创建联系人和客户记录')
        } else if (approvalAction.value === 'reject') {
          // 更新状态为已拒绝
          approval.status = '已拒绝'
          approval.approvalTime = now

          // 添加历史记录
          approval.history.push({
            title: '审核拒绝',
            content: approvalForm.remark,
            time: now,
            type: 'danger',
            operator: '管理员'
          })

          ElMessage.success('已拒绝该注册申请')
        } else if (approvalAction.value === 'requestMoreInfo') {
          // 更新状态为待补充
          approval.status = '待补充'

          // 添加历史记录
          const items = {
            'businessLicense': '营业执照',
            'detailedAddress': '详细地址',
            'companyWebsite': '企业官网',
            'other': '其他材料'
          }
          const requestItemNames = approvalForm.requestItems.map(item => items[item]).join('、')
          
          approval.history.push({
            title: '要求补充信息',
            content: `需要补充：${requestItemNames}。${approvalForm.remark}`,
            time: now,
            type: 'warning',
            operator: '管理员'
          })

          ElMessage.success('已退回，等待用户补充信息')
        }

        approving.value = false
        approvalDialogVisible.value = false
        detailVisible.value = false
      }, 1500)
    }

    // 显示合并选项
    const showMergeOptions = () => {
      mergeDialogVisible.value = true
    }

    // 合并企业
    const handleMergeCompany = (company) => {
      ElMessageBox.confirm(
        `确定要将该联系人合并到 "${company.name}" 吗？`,
        '合并企业',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      ).then(() => {
        confirmMerge(company)
      }).catch(() => {})
    }

    // 确认合并
    const confirmMerge = (company) => {
      const approval = selectedApproval.value
      const now = new Date().toLocaleString()
      
      approval.status = '已通过'
      approval.approvalTime = now
      approval.mergedTo = company.id
      
      approval.history.push({
        title: '合并到已有企业',
        content: `该联系人已合并到已有企业：${company.name}`,
        time: now,
        type: 'success',
        operator: '管理员'
      })

      ElMessage.success('合并成功，联系人已关联到已有企业')
      mergeDialogVisible.value = false
      detailVisible.value = false
    }

    // 批量分配
    const handleBatchAssign = () => {
      if (selectedRows.value.length === 0) {
        ElMessage.warning('请先选择要分配的审核任务')
        return
      }
      batchAssignVisible.value = true
    }

    // 确认批量分配
    const confirmBatchAssign = () => {
      if (!batchAssignTo.value) {
        ElMessage.warning('请选择审核人')
        return
      }
      
      batchAssigning.value = true
      
      setTimeout(() => {
        const reviewer = reviewerList.value.find(r => r.id === batchAssignTo.value)
        selectedRows.value.forEach(row => {
          row.assignedTo = batchAssignTo.value
          row.assignedToName = reviewer?.name
          row.history.push({
            title: '任务分配',
            content: `审核任务分配给：${reviewer?.name}`,
            time: new Date().toLocaleString(),
            type: 'info',
            operator: '管理员'
          })
        })
        
        ElMessage.success(`已成功分配 ${selectedRows.value.length} 个审核任务给 ${reviewer?.name}`)
        batchAssigning.value = false
        batchAssignVisible.value = false
        selectedRows.value = []
      }, 1000)
    }

    // 表格选择变化
    const handleSelectionChange = (selection) => {
      selectedRows.value = selection
    }

    // 查看审核历史
    const handleViewHistory = (row) => {
      selectedApproval.value = row
      historyVisible.value = true
    }

    // 搜索
    const handleSearch = () => {
      currentPage.value = 1
      ElMessage.success('搜索完成')
    }

    // 重置搜索
    const resetSearch = () => {
      searchQuery.value = ''
      filterStatus.value = ''
      dateRange.value = null
      currentPage.value = 1
      ElMessage.success('已重置搜索条件')
    }

    // 分页
    const handleSizeChange = (size) => {
      pageSize.value = size
    }

    const handleCurrentChange = (current) => {
      currentPage.value = current
    }

    // 排序
    const handleSortChange = ({ prop, order }) => {
      console.log('排序', prop, order)
    }

    return {
      searchQuery,
      filterStatus,
      dateRange,
      currentPage,
      pageSize,
      total,
      detailVisible,
      approvalDialogVisible,
      historyVisible,
      mergeDialogVisible,
      batchAssignVisible,
      approving,
      batchAssigning,
      selectedApproval,
      approvalAction,
      companyExists,
      tianyanchaInfo,
      selectedRows,
      batchAssignTo,
      approvalForm,
      salesList,
      reviewerList,
      tableColumns,
      approvals,
      pendingCount,
      approvedCount,
      rejectedCount,
      weekPendingCount,
      overdueCount,
      approvalRate,
      approvalDialogTitle,
      approvalActionType,
      approvalConfirmText,
      approvalRemarkLabel,
      approvalRemarkPlaceholder,
      filteredApprovals,
      getStatusType,
      handleViewDetail,
      handleApprove,
      handleReject,
      handleRequestMoreInfo,
      confirmApproval,
      showMergeOptions,
      handleMergeCompany,
      confirmMerge,
      handleBatchAssign,
      confirmBatchAssign,
      handleSelectionChange,
      handleViewHistory,
      handleSearch,
      resetSearch,
      handleSizeChange,
      handleCurrentChange,
      handleSortChange
    }
  }
}
</script>

<style scoped>
.user-approval {
  padding: 0;
}

/* 统计看板样式 */
.stats-board {
  margin-bottom: 20px;
}

.stat-card {
  margin-bottom: 15px;
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

.stat-icon.pending {
  background-color: #fdf6ec;
  color: #e6a23c;
}

.stat-icon.week {
  background-color: #f0f9ff;
  color: #409eff;
}

.stat-icon.overdue {
  background-color: #fef0f0;
  color: #f56c6c;
}

.stat-icon.rate {
  background-color: #f0f9eb;
  color: #67c23a;
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

.header-actions {
  display: flex;
  gap: 10px;
}

.search-bar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 20px;
}

.section-title {
  margin: 20px 0 15px 0;
  padding-bottom: 10px;
  border-bottom: 1px solid #e4e7ed;
  color: #303133;
  font-size: 16px;
  font-weight: 600;
}

.mt-4 {
  margin-top: 16px;
}

.mb-4 {
  margin-bottom: 20px;
}

.pagination {
  display: flex;
  justify-content: flex-end;
}

/* 相似企业列表样式 */
.similar-companies-list {
  margin-top: 10px;
}

.similar-company-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 0;
  border-bottom: 1px solid #ebeef5;
}

.similar-company-item:last-child {
  border-bottom: none;
}

.similar-company-item .company-name {
  flex: 1;
  font-size: 14px;
}

:deep(.el-timeline-item__node) {
  background-color: transparent;
}

/* 操作按钮样式 */
.operation-buttons {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: nowrap;
}

.operation-buttons :deep(.el-button) {
  padding: 4px 8px;
  font-size: 12px;
  height: 24px;
}

/* ==================== 移动端适配 ==================== */

/* 竖屏手机适配 (portrait) */
@media (max-width: 768px) and (orientation: portrait) {
  .user-approval {
    padding: 0;
  }
  
  /* 统计看板适配 */
  .stats-board {
    margin-bottom: 10px;
  }
  
  .stat-card {
    margin-bottom: 10px;
  }
  
  .stat-item {
    padding: 8px;
  }
  
  .stat-icon {
    width: 40px;
    height: 40px;
    font-size: 20px;
    margin-right: 10px;
  }
  
  .stat-value {
    font-size: 20px;
  }
  
  .stat-label {
    font-size: 12px;
  }
  
  /* 卡片头部适配 */
  .card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .header-actions {
    width: 100%;
  }
  
  /* 搜索栏适配 */
  .search-bar {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
  }
  
  .search-bar .el-input,
  .search-bar .el-select,
  .search-bar .el-date-picker {
    width: 100% !important;
    margin-right: 0 !important;
  }
  
  /* 分页居中 */
  .pagination {
    justify-content: center;
  }
  
  /* 详情对话框全屏 */
  .user-approval :deep(.el-dialog) {
    width: 100% !important;
    margin: 0 !important;
    height: 100vh;
    max-height: 100vh;
    border-radius: 0;
    display: flex;
    flex-direction: column;
  }
  
  .user-approval :deep(.el-dialog__header) {
    padding: 12px 15px;
    flex-shrink: 0;
    border-bottom: 1px solid #e4e7ed;
  }
  
  .user-approval :deep(.el-dialog__body) {
    flex: 1;
    overflow-y: auto;
    padding: 10px;
    -webkit-overflow-scrolling: touch;
    max-height: calc(100vh - 55px);
  }
  
  /* 描述列表 - 每行一个字段 */
  .user-approval :deep(.el-descriptions) {
    font-size: 14px;
    width: 100% !important;
  }
  
  .user-approval :deep(.el-descriptions__body .el-descriptions__table) {
    width: 100% !important;
    table-layout: fixed !important;
    display: block !important;
  }
  
  .user-approval :deep(.el-descriptions__body .el-descriptions__table tbody) {
    display: block !important;
    width: 100% !important;
  }
  
  .user-approval :deep(.el-descriptions__body .el-descriptions__table tr) {
    display: block !important;
    width: 100% !important;
  }
  
  .user-approval :deep(.el-descriptions__body .el-descriptions__table td) {
    display: flex !important;
    flex-direction: row !important;
    align-items: flex-start !important;
    padding: 10px 0 !important;
    border-bottom: 1px solid #ebeef5 !important;
    width: 100% !important;
    box-sizing: border-box !important;
  }
  
  .user-approval :deep(.el-descriptions-item) {
    display: flex !important;
    flex-direction: row !important;
    align-items: flex-start !important;
    width: 100% !important;
  }
  
  .user-approval :deep(.el-descriptions-item__cell) {
    display: flex !important;
    flex-direction: row !important;
    width: 100% !important;
  }
  
  .user-approval :deep(.el-descriptions-item__label) {
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
  
  .user-approval :deep(.el-descriptions-item__content) {
    flex: 1 !important;
    font-size: 14px !important;
    color: #303133 !important;
    padding: 0 !important;
    line-height: 1.5 !important;
    word-break: break-all !important;
    overflow-wrap: break-word !important;
    display: inline-block !important;
  }
  
  /* 章节标题 */
  .section-title {
    font-size: 15px;
    margin: 15px 0 10px 0;
    padding-bottom: 8px;
  }
  
  /* 相似企业列表适配 */
  .similar-company-item {
    flex-wrap: wrap;
    gap: 5px;
  }
  
  .similar-company-item .company-name {
    width: 100%;
    margin-bottom: 5px;
  }
  
  /* 时间线适配 */
  .user-approval :deep(.el-timeline) {
    padding-left: 5px;
  }
  
  .user-approval :deep(.el-timeline-item) {
    padding-bottom: 15px;
  }
  
  .user-approval :deep(.el-timeline-item__node) {
    width: 10px;
    height: 10px;
  }
  
  .user-approval :deep(.el-timeline-item__wrapper) {
    padding-left: 12px;
  }
  
  .user-approval :deep(.el-timeline-item__timestamp) {
    font-size: 12px;
    margin-bottom: 5px;
  }
}

/* 横屏手机适配 (landscape) */
@media (max-width: 896px) and (orientation: landscape) {
  .user-approval :deep(.el-dialog) {
    width: 100% !important;
    margin: 0 !important;
    height: 100vh;
    max-height: 100vh;
    border-radius: 0;
  }
  
  .user-approval :deep(.el-dialog__body) {
    padding: 15px;
    max-height: calc(100vh - 55px);
    overflow-y: auto;
  }
}

/* 小屏幕手机竖屏适配 */
@media (max-width: 480px) and (orientation: portrait) {
  .user-approval :deep(.el-dialog__body) {
    padding: 8px;
  }
  
  .user-approval :deep(.el-descriptions) {
    font-size: 13px;
  }
  
  .user-approval :deep(.el-descriptions-item__label) {
    width: 80px !important;
    min-width: 80px;
    font-size: 12px;
  }
  
  .user-approval :deep(.el-descriptions-item__content) {
    font-size: 13px;
  }
  
  .user-approval :deep(.el-descriptions-item) {
    padding: 8px 0;
  }
  
  .section-title {
    font-size: 14px;
    margin: 12px 0 8px 0;
  }
}

/* 超小屏幕适配 */
@media (max-width: 360px) and (orientation: portrait) {
  .user-approval :deep(.el-descriptions-item__label) {
    width: 70px !important;
    min-width: 70px;
    font-size: 11px;
  }
  
  .user-approval :deep(.el-descriptions-item__content) {
    font-size: 12px;
  }
}
</style>