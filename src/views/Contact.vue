<template>
  <div class="contact">
    <el-card shadow="hover" class="mb-4">
      <template #header>
        <div class="card-header">
          <span>联系人管理</span>
          <el-button type="primary" @click="handleAddContact">
            <el-icon><Plus /></el-icon>
            <span>新增联系人</span>
          </el-button>
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
          <el-option label="已通过" value="已通过" />
          <el-option label="待审核" value="待审核" />
          <el-option label="已拒绝" value="已拒绝" />
        </el-select>
        <el-button type="primary" @click="handleSearch">搜索</el-button>
        <el-button @click="resetSearch">重置</el-button>
      </div>

      <!-- 联系人列表 -->
      <ConfigurableTable
        :data="filteredContacts"
        :columns="tableColumns"
        storage-key="contact"
        :show-operation="true"
        :operation-width="220"
        @sort-change="handleSortChange"
        class="mt-4"
      >
        <template #approvalStatus="{ row }">
          <el-tag :type="getStatusType(row.approvalStatus)">{{ row.approvalStatus }}</el-tag>
        </template>
        <template #operation="{ row }">
          <el-button type="primary" size="small" @click="handleViewContact(row)">
            查看
          </el-button>
          <el-button type="success" size="small" @click="handleEditContact(row)">
            编辑
          </el-button>
          <el-button type="warning" size="small" @click="handleViewWorkorders(row)">
            工单
          </el-button>
          <el-button type="danger" size="small" @click="handleDeleteContact(row.id)">
            删除
          </el-button>
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

    <!-- 新增/编辑联系人对话框 -->
    <el-dialog
      :title="dialogTitle"
      v-model="dialogVisible"
      width="700px"
    >
      <el-form :model="form" :rules="rules" ref="formRef" label-width="120px">
        <h4 class="section-title">个人信息</h4>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="姓名" prop="name">
              <el-input v-model="form.name" placeholder="请输入姓名" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="手机号" prop="phone">
              <el-input v-model="form.phone" placeholder="请输入手机号" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="邮箱" prop="email">
              <el-input v-model="form.email" placeholder="请输入邮箱" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="职位" prop="position">
              <el-input v-model="form.position" placeholder="请输入职位" />
            </el-form-item>
          </el-col>
        </el-row>

        <h4 class="section-title">公司信息</h4>
        <el-form-item label="所属公司" prop="companyName">
          <el-select v-model="form.companyName" placeholder="请选择公司" style="width: 100%">
            <el-option
              v-for="company in companies"
              :key="company.id"
              :label="company.name"
              :value="company.name"
            />
          </el-select>
        </el-form-item>

        <h4 class="section-title">账户信息</h4>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="审核状态" prop="approvalStatus">
              <el-select v-model="form.approvalStatus" placeholder="请选择状态">
                <el-option label="已通过" value="已通过" />
                <el-option label="待审核" value="待审核" />
                <el-option label="已拒绝" value="已拒绝" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="注册时间" prop="registerTime">
              <el-date-picker
                v-model="form.registerTime"
                type="datetime"
                placeholder="选择日期时间"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit">确定</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 联系人详情对话框 -->
    <el-dialog
      title="联系人详情"
      v-model="detailVisible"
      width="900px"
      :fullscreen="isMobile"
      class="contact-detail-dialog"
    >
      <div class="detail-container">
        <!-- 头部信息卡片 -->
        <div class="header-card">
          <div class="header-left">
            <div class="detail-title">
              <el-icon><User /></el-icon>
              <span>{{ selectedContact?.name }}</span>
              <el-tag :type="getStatusType(selectedContact?.approvalStatus)" size="small" effect="dark">
                {{ selectedContact?.approvalStatus }}
              </el-tag>
            </div>
            <div class="detail-meta">
              <span class="meta-item">
                <el-icon><OfficeBuilding /></el-icon>
                {{ selectedContact?.companyName }}
              </span>
              <span class="meta-item">
                <el-icon><Phone /></el-icon>
                {{ selectedContact?.phone }}
              </span>
              <span class="meta-item">
                <el-icon><Clock /></el-icon>
                {{ selectedContact?.registerTime }}
              </span>
            </div>
          </div>
        </div>

        <el-tabs v-model="activeTab" class="detail-tabs">
          <el-tab-pane label="基本信息" name="basic">
            <el-card class="section-card" shadow="hover">
              <template #header>
                <div class="card-header">
                  <el-icon><InfoFilled /></el-icon>
                  <span>基本信息</span>
                </div>
              </template>
              <div class="info-grid" v-if="selectedContact">
                <div class="info-item">
                  <span class="label">联系人ID</span>
                  <span class="value">{{ selectedContact.id }}</span>
                </div>
                <div class="info-item">
                  <span class="label">姓名</span>
                  <span class="value">{{ selectedContact.name }}</span>
                </div>
                <div class="info-item">
                  <span class="label">手机号</span>
                  <span class="value">{{ selectedContact.phone }}</span>
                </div>
                <div class="info-item">
                  <span class="label">邮箱</span>
                  <span class="value">{{ selectedContact.email || '-' }}</span>
                </div>
                <div class="info-item">
                  <span class="label">职位</span>
                  <span class="value">{{ selectedContact.position || '-' }}</span>
                </div>
                <div class="info-item">
                  <span class="label">所属公司</span>
                  <span class="value">{{ selectedContact.companyName }}</span>
                </div>
                <div class="info-item">
                  <span class="label">审核状态</span>
                  <el-tag :type="getStatusType(selectedContact.approvalStatus)" size="small">
                    {{ selectedContact.approvalStatus }}
                  </el-tag>
                </div>
                <div class="info-item">
                  <span class="label">注册时间</span>
                  <span class="value">{{ selectedContact.registerTime }}</span>
                </div>
              </div>
            </el-card>
          </el-tab-pane>

          <el-tab-pane label="历史工单" name="workorders">
            <el-card class="section-card" shadow="hover">
              <template #header>
                <div class="card-header">
                  <el-icon><Tools /></el-icon>
                  <span>历史工单</span>
                  <span class="item-count">共 {{ selectedContactWorkorders?.length || 0 }} 单</span>
                </div>
              </template>
              <div class="table-wrapper">
                <el-table :data="selectedContactWorkorders" style="width: 100%" size="small">
                  <el-table-column type="index" label="序号" width="50" align="center" />
                  <el-table-column prop="id" label="工单号" width="120" />
                  <el-table-column prop="type" label="类型" width="100" />
                  <el-table-column prop="createTime" label="创建时间" width="150" />
                  <el-table-column prop="status" label="状态" width="90">
                    <template #default="scope">
                      <el-tag :type="scope.row.status === '已完成' ? 'success' : 'warning'" size="small">
                        {{ scope.row.status }}
                      </el-tag>
                    </template>
                  </el-table-column>
                  <el-table-column label="操作" width="80" fixed="right">
                    <template #default="scope">
                      <el-button type="primary" link size="small" @click="viewWorkorderDetail(scope.row)">查看</el-button>
                    </template>
                  </el-table-column>
                </el-table>
              </div>
              <el-empty v-if="!selectedContactWorkorders || selectedContactWorkorders.length === 0" description="暂无历史工单" />
            </el-card>
          </el-tab-pane>

          <el-tab-pane label="审核历史" name="history">
            <el-card class="section-card" shadow="hover">
              <template #header>
                <div class="card-header">
                  <el-icon><Document /></el-icon>
                  <span>审核历史</span>
                </div>
              </template>
              <el-timeline v-if="selectedContact && selectedContact.history && selectedContact.history.length > 0">
                <el-timeline-item
                  v-for="(record, index) in selectedContact.history"
                  :key="index"
                  :type="record.type"
                  :timestamp="record.time"
                >
                  <div class="timeline-content">
                    <h4 class="timeline-title">{{ record.title }}</h4>
                    <p class="timeline-desc">{{ record.content }}</p>
                  </div>
                </el-timeline-item>
              </el-timeline>
              <el-empty v-else description="暂无审核历史记录" />
            </el-card>
          </el-tab-pane>
        </el-tabs>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Plus, User, Phone, Clock, Document, InfoFilled, Tools, OfficeBuilding } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import ConfigurableTable from '../components/ConfigurableTable.vue'
import { state as contactState, setContacts, addContact, updateContact, deleteContact, addHistoryRecord } from '../stores/contactStore.js'

export default {
  name: 'Contact',
  components: {
    Plus,
    User,
    Phone,
    Clock,
    Document,
    InfoFilled,
    Tools,
    OfficeBuilding,
    ConfigurableTable
  },
  setup() {
    const router = useRouter()
    const formRef = ref(null)
    const searchQuery = ref('')
    const filterStatus = ref('')
    const currentPage = ref(1)
    const pageSize = ref(10)
    const total = ref(0)
    const dialogVisible = ref(false)
    const detailVisible = ref(false)
    const dialogTitle = ref('新增联系人')
    const activeTab = ref('basic')

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

    // 表单数据
    const form = reactive({
      id: '',
      name: '',
      phone: '',
      email: '',
      position: '',
      companyName: '',
      approvalStatus: '已通过',
      registerTime: ''
    })

    // 表单验证规则
    const rules = {
      name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
      phone: [{ required: true, message: '请输入手机号', trigger: 'blur' }],
      email: [{ required: true, message: '请输入邮箱', trigger: 'blur' }],
      companyName: [{ required: true, message: '请选择所属公司', trigger: 'change' }]
    }

    // 表格列配置
    const tableColumns = [
      { prop: 'id', label: '联系人ID', width: 120, sortable: true },
      { prop: 'name', label: '姓名', width: 100, sortable: true },
      { prop: 'phone', label: '手机号', width: 130, sortable: true },
      { prop: 'email', label: '邮箱', minWidth: 180, sortable: true },
      { prop: 'companyName', label: '所属公司', minWidth: 200, sortable: true },
      { prop: 'position', label: '职位', width: 120, sortable: true },
      { prop: 'approvalStatus', label: '审核状态', width: 100, sortable: true, slot: true },
      { prop: 'registerTime', label: '注册时间', width: 180, sortable: true }
    ]

    // 模拟公司数据
    const companies = ref([
      { id: 'C001', name: '上海某机械有限公司' },
      { id: 'C002', name: '北京某设备制造有限公司' },
      { id: 'C003', name: '广州某工业设备有限公司' },
      { id: 'C004', name: '深圳某科技有限公司' }
    ])

    // 从全局 store 初始化联系人数据
    const contacts = ref([...contactState.contacts])

    // 同步联系人数据到全局 store
    watch(contacts, (newContacts) => {
      setContacts(newContacts)
    }, { deep: true, immediate: true })

    // 当前选中的联系人
    const selectedContact = ref(null)

    // 模拟工单数据
    const contactWorkorders = ref([
      { id: 'WO001', type: '维修', createTime: '2024-03-01 10:00:00', status: '已完成', contactId: 'CT001' },
      { id: 'WO002', type: '巡检', createTime: '2024-03-15 14:30:00', status: '进行中', contactId: 'CT001' },
      { id: 'WO003', type: '保养', createTime: '2024-02-20 09:00:00', status: '已完成', contactId: 'CT004' }
    ])

    // 过滤后的联系人列表
    const filteredContacts = computed(() => {
      let result = contacts.value

      // 搜索过滤
      if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase()
        result = result.filter(c =>
          c.name.toLowerCase().includes(query) ||
          c.phone.includes(query) ||
          c.companyName.toLowerCase().includes(query)
        )
      }

      // 状态过滤
      if (filterStatus.value) {
        result = result.filter(c => c.approvalStatus === filterStatus.value)
      }

      total.value = result.length
      return result
    })

    // 选中联系人的工单
    const selectedContactWorkorders = computed(() => {
      if (!selectedContact.value) return []
      return contactWorkorders.value.filter(w => w.contactId === selectedContact.value.id)
    })

    // 获取状态标签类型
    const getStatusType = (status) => {
      const statusMap = {
        '已通过': 'success',
        '待审核': 'warning',
        '已拒绝': 'danger'
      }
      return statusMap[status] || 'info'
    }

    // 新增联系人
    const handleAddContact = () => {
      dialogTitle.value = '新增联系人'
      Object.keys(form).forEach(key => {
        form[key] = key === 'approvalStatus' ? '已通过' : ''
      })
      form.registerTime = new Date().toLocaleString()
      dialogVisible.value = true
    }

    // 编辑联系人
    const handleEditContact = (row) => {
      dialogTitle.value = '编辑联系人'
      Object.assign(form, row)
      dialogVisible.value = true
    }

    // 查看联系人
    const handleViewContact = (row) => {
      selectedContact.value = row
      activeTab.value = 'basic'
      detailVisible.value = true
    }

    // 查看联系人工单
    const handleViewWorkorders = (row) => {
      selectedContact.value = row
      activeTab.value = 'workorders'
      detailVisible.value = true
    }

    // 删除联系人
    const handleDeleteContact = (id) => {
      ElMessageBox.confirm('确定要删除该联系人吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        deleteContact(id)
        contacts.value = [...contactState.contacts]
        ElMessage.success('删除成功')
      }).catch(() => {
        ElMessage.info('已取消删除')
      })
    }

    // 提交表单
    const handleSubmit = async () => {
      if (!formRef.value) return

      await formRef.value.validate((valid) => {
        if (valid) {
          if (form.id) {
            // 编辑
            updateContact(form.id, { ...form })
            contacts.value = [...contactState.contacts]
            ElMessage.success('修改成功')
          } else {
            // 新增
            const newContact = {
              ...form,
              id: 'CT' + String(Date.now()).slice(-6),
              history: [{
                title: '手动创建',
                content: '管理员手动创建联系人',
                time: new Date().toLocaleString(),
                type: 'success'
              }]
            }
            addContact(newContact)
            contacts.value = [...contactState.contacts]
            ElMessage.success('添加成功')
          }
          dialogVisible.value = false
        }
      })
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

    // 查看工单详情
    const viewWorkorderDetail = (workorder) => {
      router.push(`/workorder?id=${workorder.id}`)
    }

    return {
      formRef,
      searchQuery,
      filterStatus,
      currentPage,
      pageSize,
      total,
      dialogVisible,
      detailVisible,
      isMobile,
      dialogTitle,
      activeTab,
      form,
      rules,
      tableColumns,
      companies,
      contacts,
      selectedContact,
      filteredContacts,
      selectedContactWorkorders,
      getStatusType,
      handleAddContact,
      handleEditContact,
      handleViewContact,
      handleViewWorkorders,
      handleDeleteContact,
      handleSubmit,
      handleSearch,
      resetSearch,
      handleSizeChange,
      handleCurrentChange,
      handleSortChange,
      viewWorkorderDetail
    }
  }
}
</script>

<style scoped>
.contact {
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

.pagination {
  display: flex;
  justify-content: flex-end;
}

:deep(.el-timeline-item__node) {
  background-color: transparent;
}

/* ==================== 移动端适配 ==================== */

/* 竖屏手机适配 (portrait) */
@media (max-width: 768px) and (orientation: portrait) {
  .contact {
    padding: 0;
  }
  
  /* 卡片头部适配 */
  .card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  /* 搜索栏适配 */
  .search-bar {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
  }
  
  .search-bar .el-input,
  .search-bar .el-select {
    width: 100% !important;
    margin-right: 0 !important;
  }
  
  /* 分页居中 */
  .pagination {
    justify-content: center;
  }
  
  /* 详情对话框全屏 */
  .contact :deep(.el-dialog) {
    width: 100% !important;
    margin: 0 !important;
    height: 100vh;
    max-height: 100vh;
    border-radius: 0;
    display: flex;
    flex-direction: column;
  }
  
  .contact :deep(.el-dialog__header) {
    padding: 12px 15px;
    flex-shrink: 0;
    border-bottom: 1px solid #e4e7ed;
  }
  
  .contact :deep(.el-dialog__body) {
    flex: 1;
    overflow-y: auto;
    padding: 10px;
    -webkit-overflow-scrolling: touch;
    max-height: calc(100vh - 55px);
  }
  
  /* 描述列表 - 每行一个字段 */
  .contact :deep(.el-descriptions) {
    font-size: 14px;
    width: 100% !important;
  }
  
  .contact :deep(.el-descriptions__body .el-descriptions__table) {
    width: 100% !important;
    table-layout: fixed !important;
    display: block !important;
  }
  
  .contact :deep(.el-descriptions__body .el-descriptions__table tbody) {
    display: block !important;
    width: 100% !important;
  }
  
  .contact :deep(.el-descriptions__body .el-descriptions__table tr) {
    display: block !important;
    width: 100% !important;
  }
  
  .contact :deep(.el-descriptions__body .el-descriptions__table td) {
    display: flex !important;
    flex-direction: row !important;
    align-items: flex-start !important;
    padding: 10px 0 !important;
    border-bottom: 1px solid #ebeef5 !important;
    width: 100% !important;
    box-sizing: border-box !important;
  }
  
  .contact :deep(.el-descriptions-item) {
    display: flex !important;
    flex-direction: row !important;
    align-items: flex-start !important;
    width: 100% !important;
  }
  
  .contact :deep(.el-descriptions-item__cell) {
    display: flex !important;
    flex-direction: row !important;
    width: 100% !important;
  }
  
  .contact :deep(.el-descriptions-item__label) {
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
  
  .contact :deep(.el-descriptions-item__content) {
    flex: 1 !important;
    font-size: 14px !important;
    color: #303133 !important;
    padding: 0 !important;
    line-height: 1.5 !important;
    word-break: break-all !important;
    overflow-wrap: break-word !important;
    display: inline-block !important;
  }
  
  /* 标签页适配 */
  .contact :deep(.el-tabs__header) {
    margin-bottom: 10px;
  }
  
  .contact :deep(.el-tabs__nav-wrap) {
    overflow-x: auto;
    overflow-y: hidden;
  }
  
  .contact :deep(.el-tabs__nav) {
    white-space: nowrap;
    display: flex;
  }
  
  .contact :deep(.el-tabs__item) {
    font-size: 13px;
    padding: 0 12px;
    height: 36px;
    line-height: 36px;
    flex-shrink: 0;
  }
  
  /* 时间线适配 */
  .contact :deep(.el-timeline) {
    padding-left: 5px;
  }
  
  .contact :deep(.el-timeline-item) {
    padding-bottom: 15px;
  }
  
  .contact :deep(.el-timeline-item__node) {
    width: 10px;
    height: 10px;
  }
  
  .contact :deep(.el-timeline-item__wrapper) {
    padding-left: 12px;
  }
  
  .contact :deep(.el-timeline-item__timestamp) {
    font-size: 12px;
    margin-bottom: 5px;
  }
}

/* 横屏手机适配 (landscape) */
@media (max-width: 896px) and (orientation: landscape) {
  .contact :deep(.el-dialog) {
    width: 100% !important;
    margin: 0 !important;
    height: 100vh;
    max-height: 100vh;
    border-radius: 0;
  }
  
  .contact :deep(.el-dialog__body) {
    padding: 15px;
    max-height: calc(100vh - 55px);
    overflow-y: auto;
  }
}

/* 小屏幕手机竖屏适配 */
@media (max-width: 480px) and (orientation: portrait) {
  .contact :deep(.el-dialog__body) {
    padding: 8px;
  }
  
  .contact :deep(.el-descriptions) {
    font-size: 13px;
  }
  
  .contact :deep(.el-descriptions-item__label) {
    width: 80px !important;
    min-width: 80px;
    font-size: 12px;
  }
  
  .contact :deep(.el-descriptions-item__content) {
    font-size: 13px;
  }
  
  .contact :deep(.el-descriptions-item) {
    padding: 8px 0;
  }
  
  .section-title {
    font-size: 14px;
    margin: 15px 0 10px 0;
  }
}

/* 超小屏幕适配 */
@media (max-width: 360px) and (orientation: portrait) {
  .contact :deep(.el-descriptions-item__label) {
    width: 70px !important;
    min-width: 70px;
    font-size: 11px;
  }
  
  .contact :deep(.el-descriptions-item__content) {
    font-size: 12px;
  }
}

/* 详情弹窗统一样式 */
.detail-container {
  max-height: 650px;
  overflow-y: auto;
  padding: 0 10px;
}

:deep(.contact-detail-dialog.is-fullscreen) .detail-container {
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

/* 表格包装器 */
.table-wrapper {
  overflow-x: auto;
}

/* 详情标签页 */
.detail-tabs :deep(.el-tabs__header) {
  margin-bottom: 20px;
}

/* 时间线内容 */
.timeline-content {
  padding: 12px 16px;
  background-color: #f5f7fa;
  border-radius: 8px;
  margin-top: 8px;
}

.timeline-title {
  font-weight: bold;
  color: #303133;
  margin-bottom: 8px;
}

.timeline-desc {
  color: #606266;
  font-size: 13px;
  line-height: 1.6;
}

/* 移动端适配 */
@media (max-width: 768px) {
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

  .timeline-content {
    padding: 10px 12px;
  }
}
</style>
