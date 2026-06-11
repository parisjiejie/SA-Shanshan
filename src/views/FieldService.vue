<template>
  <div class="field-service">
    <el-card shadow="hover" class="mb-4">
      <template #header>
        <div class="card-header">
          <span>外勤管理</span>
          <el-button type="primary" @click="handleCheckIn">
            <el-icon><Location /></el-icon>
            <span>打卡签到</span>
          </el-button>
        </div>
      </template>
      <el-tabs>
        <el-tab-pane label="打卡记录">
          <div class="search-bar">
            <el-date-picker
              v-model="dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              style="margin-right: 10px"
            />
            <el-select
              v-model="checkInType"
              placeholder="打卡类型"
              style="width: 150px; margin-right: 10px"
            >
              <el-option label="全部" value="" />
              <el-option label="工单打卡" value="工单打卡" />
              <el-option label="活动打卡" value="活动打卡" />
            </el-select>
            <el-button type="primary" @click="handleSearch">搜索</el-button>
            <el-button type="success" @click="handleExport">导出CSV</el-button>
          </div>
          <ConfigurableTable
            :data="checkInRecords"
            :columns="checkInTableColumns"
            storage-key="fieldservice_checkin"
            :show-operation="true"
            :operation-width="100"
            @sort-change="handleCheckInSortChange"
            class="mt-4"
          >
            <template #status="{ row }">
              <el-tag :type="getCheckInStatusType(row.status)">{{ row.status }}</el-tag>
            </template>
            <template #operation="{ row }">
              <el-button 
                v-if="row.status !== '已提交' && row.status !== '已通过'" 
                type="warning" 
                size="small" 
                @click="handleCheckOut(row)"
              >
                签离
              </el-button>
              <el-button 
                v-if="row.checkOutTime && row.status === '进行中'" 
                type="success" 
                size="small" 
                @click="handleSubmitApproval(row)"
              >
                提交申请
              </el-button>
              <el-tag v-if="row.status === '已提交'" type="info">已提交</el-tag>
              <el-tag v-if="row.status === '已通过'" type="success">已通过</el-tag>
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
        </el-tab-pane>
        <el-tab-pane label="个人日历">
          <div class="calendar-container">
            <el-calendar v-model="currentDate">
              <template #date-cell="{ data }">
                <div class="calendar-cell">
                  <span class="date">{{ data.day }}</span>
                  <div class="events">
                    <div
                      v-for="(record, index) in getDayCheckInRecordsByData(data)"
                      :key="index"
                      :class="['event', getCheckInStatusClass(record.status)]"
                    >
                      {{ record.type }}
                    </div>
                  </div>
                </div>
              </template>
            </el-calendar>
          </div>
        </el-tab-pane>
        <el-tab-pane label="管理日历">
          <div class="calendar-container">
            <el-calendar v-model="currentDate">
              <template #date-cell="{ data }">
                <div class="calendar-cell">
                  <span class="date">{{ data.day }}</span>
                  <div class="events">
                    <div
                      v-for="(record, index) in getDayAllCheckInRecordsByData(data)"
                      :key="index"
                      :class="['event', getCheckInStatusClass(record.status)]"
                    >
                      {{ record.employeeName }} - {{ record.type }}
                    </div>
                  </div>
                </div>
              </template>
            </el-calendar>
          </div>
        </el-tab-pane>
        <el-tab-pane>
          <template #label>
            <span>审批管理</span>
            <el-badge v-if="pendingApprovalCount > 0" :value="pendingApprovalBadge" class="tab-badge" type="danger" />
          </template>
          <ConfigurableTable
            :data="approvalRecords"
            :columns="approvalTableColumns"
            storage-key="fieldservice_approval"
            :show-operation="true"
            :operation-width="80"
            @sort-change="handleApprovalSortChange"
          >
            <template #status="{ row }">
              <el-tag :type="getApprovalStatusType(row.status)">{{ row.status }}</el-tag>
            </template>
            <template #operation="{ row }">
              <el-button type="primary" size="small" @click="handleApprove(row)">
                审批
              </el-button>
            </template>
          </ConfigurableTable>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <!-- 打卡签到对话框 -->
    <el-dialog
      title="打卡签到"
      v-model="checkInVisible"
      width="600px"
    >
      <el-form :model="checkInForm" label-width="100px">
        <el-form-item label="职员姓名">
          <el-input v-model="checkInForm.employeeName" disabled />
        </el-form-item>
        <el-form-item label="打卡类型">
          <el-radio-group v-model="checkInForm.type">
            <el-radio value="工单打卡">工单打卡</el-radio>
            <el-radio value="活动打卡">活动打卡</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="客户名称" v-if="checkInForm.type === '活动打卡'">
          <el-select v-model="checkInForm.customerId">
            <el-option v-for="customer in customers" :key="customer.id" :label="customer.name" :value="customer.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="工单号" v-if="checkInForm.type === '工单打卡'">
          <el-select v-model="checkInForm.workorderId" placeholder="请选择工单">
            <el-option v-for="workorder in workorders" :key="workorder.id" :value="workorder.id">
              <div class="workorder-option">
                <div class="workorder-id">{{ workorder.id }}</div>
                <div class="workorder-info">
                  <div class="workorder-type">{{ workorder.type }}</div>
                  <div class="workorder-customer">{{ workorder.customerName }}</div>
                  <div class="workorder-status">
                    <el-tag :type="getStatusType(workorder.status)">{{ workorder.status }}</el-tag>
                  </div>
                </div>
              </div>
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="活动内容" v-if="checkInForm.type === '活动打卡'">
          <el-input v-model="checkInForm.content" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="打卡地点">
          <el-input v-model="checkInForm.location" disabled />
        </el-form-item>
        <el-form-item label="现场照片">
          <el-upload
            class="upload-demo"
            action="#"
            :on-change="handlePhotoUpload"
            :auto-upload="false"
            :file-list="photoList"
          >
            <el-button type="primary">
              <el-icon><Picture /></el-icon>
              <span>上传照片</span>
            </el-button>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="checkInVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmitCheckIn">确认签到</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 签离对话框 -->
    <el-dialog
      title="打卡签离"
      v-model="checkOutVisible"
      width="500px"
    >
      <el-form :model="checkOutForm" label-width="100px">
        <el-form-item label="打卡ID">
          <el-input v-model="checkOutForm.checkInId" disabled />
        </el-form-item>
        <el-form-item label="签到时间">
          <el-input v-model="checkOutForm.checkInTime" disabled />
        </el-form-item>
        <el-form-item label="签离地点">
          <el-input v-model="checkOutForm.location" disabled />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="checkOutForm.remark" type="textarea" :rows="2" placeholder="请输入签离备注（可选）" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="checkOutVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmitCheckOut">确认签离</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 提交申请确认对话框 -->
    <el-dialog
      title="提交申请确认"
      v-model="submitApprovalVisible"
      width="500px"
    >
      <el-form :model="submitApprovalForm" label-width="100px">
        <el-form-item>
          <p>确认要提交打卡记录给领导审批吗？</p>
          <p style="color: #909399; font-size: 14px; margin-top: 10px;">
            提交后将无法再进行签离操作。
          </p>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="submitApprovalForm.remark" type="textarea" :rows="3" placeholder="请输入申请备注（可选）" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="submitApprovalVisible = false">取消</el-button>
          <el-button type="primary" @click="confirmSubmitApproval">确认提交</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 审批对话框 -->
    <el-dialog
      title="审批打卡记录"
      v-model="approvalVisible"
      width="600px"
    >
      <el-descriptions :column="2" border>
        <el-descriptions-item label="打卡ID">{{ selectedApproval.checkInId }}</el-descriptions-item>
        <el-descriptions-item label="工程师">{{ selectedApproval.engineer }}</el-descriptions-item>
        <el-descriptions-item label="打卡类型">{{ selectedApproval.type }}</el-descriptions-item>
        <el-descriptions-item label="客户名称">{{ selectedApproval.customerName }}</el-descriptions-item>
        <el-descriptions-item label="工单号">{{ selectedApproval.workorderId }}</el-descriptions-item>
        <el-descriptions-item label="签到时间">{{ selectedApproval.checkInTime }}</el-descriptions-item>
        <el-descriptions-item label="签离时间">{{ selectedApproval.checkOutTime || '-' }}</el-descriptions-item>
        <el-descriptions-item label="签到地点">{{ selectedApproval.checkInLocation }}</el-descriptions-item>
        <el-descriptions-item label="签离地点">{{ selectedApproval.checkOutLocation }}</el-descriptions-item>
        <el-descriptions-item label="活动内容">{{ selectedApproval.content }}</el-descriptions-item>
      </el-descriptions>
      <el-form :model="approvalForm" label-width="100px" class="mt-4">
        <el-form-item label="审批结果">
          <el-radio-group v-model="approvalForm.result">
            <el-radio value="通过">通过</el-radio>
            <el-radio value="驳回">驳回</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="审批意见">
          <el-input v-model="approvalForm.comment" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="approvalVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmitApprovalResult">提交审批</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { Location, Picture } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { pendingApprovalCount, setApprovalRecords, addApprovalRecord, updateApprovalRecordStatus, state as approvalState } from '../stores/approvalStore'
import ConfigurableTable from '../components/ConfigurableTable.vue'

console.log('FieldService - ConfigurableTable imported:', ConfigurableTable)

export default {
  name: 'FieldService',
  components: {
    Location,
    Picture,
    ConfigurableTable
  },
  setup() {
    const dateRange = ref([])
    const checkInType = ref('')
    const currentPage = ref(1)
    const pageSize = ref(10)
    const total = ref(100)
    const currentDate = ref(new Date())
    const checkInVisible = ref(false)
    const approvalVisible = ref(false)
    const checkOutVisible = ref(false)
    const submitApprovalVisible = ref(false)
    const photoList = ref([])
    const currentCheckInRecord = ref(null)
    const checkInForm = reactive({
      type: '工单打卡',
      employeeName: '王工程师',
      customerId: '',
      workorderId: '',
      content: '',
      location: ''
    })
    const checkOutForm = reactive({
      checkInId: '',
      checkInTime: '',
      location: '',
      remark: ''
    })
    const approvalForm = reactive({
      result: '通过',
      comment: ''
    })
    const submitApprovalForm = reactive({
      remark: ''
    })
    const selectedApproval = ref({})

    console.log('FieldService - Setting up table columns...')
    
    // 打卡记录表格列配置
    // 打卡记录表格列配置 - 优化宽度适配
    const checkInTableColumns = [
      { prop: 'id', label: '打卡ID', width: 90, sortable: true },
      { prop: 'employeeName', label: '职员姓名', width: 110, sortable: true },
      { prop: 'type', label: '打卡类型', width: 110, sortable: true },
      { prop: 'customerName', label: '客户名称', minWidth: 160, sortable: true },
      { prop: 'workorderId', label: '工单号', width: 110, sortable: true },
      { prop: 'checkInTime', label: '签到时间', width: 165, sortable: true },
      { prop: 'checkOutTime', label: '签离时间', width: 165, sortable: true },
      { prop: 'duration', label: '工时', width: 85, sortable: true },
      { prop: 'checkInLocation', label: '签到地点', minWidth: 180, sortable: true },
      { prop: 'checkOutLocation', label: '签离地点', minWidth: 180, sortable: true },
      { prop: 'status', label: '状态', width: 100, sortable: true, slot: true }
    ]

    // 审批记录表格列配置 - 优化宽度适配
    const approvalTableColumns = [
      { prop: 'id', label: '审批ID', width: 90, sortable: true },
      { prop: 'checkInId', label: '打卡ID', width: 90, sortable: true },
      { prop: 'engineer', label: '工程师', width: 110, sortable: true },
      { prop: 'submitTime', label: '提交时间', width: 170, sortable: true },
      { prop: 'status', label: '状态', width: 100, sortable: true, slot: true }
    ]

    // 获取打卡状态标签类型
    const getCheckInStatusType = (status) => {
      const statusMap = {
        '进行中': 'warning',
        '已提交': 'info',
        '已通过': 'success',
        '已驳回': 'danger'
      }
      return statusMap[status] || 'info'
    }

    // 获取审批状态标签类型
    const getApprovalStatusType = (status) => {
      const statusMap = {
        '待审批': 'warning',
        '已通过': 'success',
        '已驳回': 'danger'
      }
      return statusMap[status] || 'info'
    }

    // 处理打卡记录排序变化
    const handleCheckInSortChange = ({ prop, order }) => {
      console.log('打卡记录排序', prop, order)
    }

    // 处理审批记录排序变化
    const handleApprovalSortChange = ({ prop, order }) => {
      console.log('审批记录排序', prop, order)
    }

    const customers = ref([
      { id: 1, name: '上海某机械有限公司' },
      { id: 2, name: '北京某设备制造有限公司' },
      { id: 3, name: '广州某工业设备有限公司' }
    ])

    const workorders = ref([
      { id: 'WO001', type: '维修', customerName: '上海某机械有限公司', status: '进行中' },
      { id: 'WO002', type: '巡检', customerName: '北京某设备制造有限公司', status: '待派单' },
      { id: 'WO003', type: '安装', customerName: '广州某工业设备有限公司', status: '进行中' }
    ])

    const checkInRecords = ref([
      {
        id: 1,
        employeeName: '王工程师',
        type: '工单打卡',
        customerName: '上海某机械有限公司',
        workorderId: 'WO001',
        checkInTime: '2026-04-01 09:00:00',
        checkOutTime: '2026-04-01 17:00:00',
        duration: 8,
        checkInLocation: '上海市浦东新区张江高科技园区',
        checkOutLocation: '上海市浦东新区张江高科技园区',
        status: '已通过',
        checkOutHistory: [
          { time: '2026-04-01 17:00:00', location: '上海市浦东新区张江高科技园区' }
        ]
      },
      {
        id: 2,
        employeeName: '王工程师',
        type: '活动打卡',
        customerName: '北京某设备制造有限公司',
        workorderId: '',
        checkInTime: '2026-04-02 10:00:00',
        checkOutTime: '2026-04-02 12:00:00',
        duration: 2,
        checkInLocation: '北京市朝阳区建国路',
        checkOutLocation: '北京市朝阳区建国路',
        status: '已提交',
        checkOutHistory: [
          { time: '2026-04-02 12:00:00', location: '北京市朝阳区建国路' }
        ]
      },
      {
        id: 3,
        employeeName: '王工程师',
        type: '工单打卡',
        customerName: '广州某工业设备有限公司',
        workorderId: 'WO003',
        checkInTime: '2026-04-03 08:30:00',
        checkOutTime: '',
        duration: 0,
        checkInLocation: '广州市天河区科技园',
        checkOutLocation: '',
        status: '进行中',
        checkOutHistory: []
      },
      {
        id: 4,
        employeeName: '李工程师',
        type: '工单打卡',
        customerName: '深圳某科技有限公司',
        workorderId: 'WO004',
        checkInTime: '2026-04-05 09:30:00',
        checkOutTime: '2026-04-05 18:00:00',
        duration: 8.5,
        checkInLocation: '深圳市南山区科技园',
        checkOutLocation: '深圳市南山区科技园',
        status: '已通过',
        checkOutHistory: [
          { time: '2026-04-05 18:00:00', location: '深圳市南山区科技园' }
        ]
      },
      {
        id: 5,
        employeeName: '张工程师',
        type: '活动打卡',
        customerName: '杭州某制造有限公司',
        workorderId: '',
        checkInTime: '2026-04-08 14:00:00',
        checkOutTime: '2026-04-08 16:30:00',
        duration: 2.5,
        checkInLocation: '杭州市西湖区',
        checkOutLocation: '杭州市西湖区',
        status: '已通过',
        checkOutHistory: [
          { time: '2026-04-08 16:30:00', location: '杭州市西湖区' }
        ]
      }
    ])

    // 从全局 store 初始化审批记录
    const approvalRecords = ref([...approvalState.approvalRecords])

    // 同步审批记录到全局状态
    watch(approvalRecords, (newRecords) => {
      setApprovalRecords(newRecords)
    }, { deep: true, immediate: true })

    // 计算待审批数量显示文本
    const pendingApprovalBadge = computed(() => {
      return pendingApprovalCount.value > 99 ? '99+' : String(pendingApprovalCount.value)
    })

    const events = ref([
      {
        date: '2026-04-01',
        title: '维修工单 WO001',
        type: 'workorder'
      },
      {
        date: '2026-04-02',
        title: '客户拜访',
        type: 'activity'
      },
      {
        date: '2026-04-03',
        title: '巡检工单 WO002',
        type: 'workorder'
      },
      {
        date: '2026-04-05',
        title: '安装工单 WO004',
        type: 'workorder'
      },
      {
        date: '2026-04-08',
        title: '技术培训',
        type: 'activity'
      }
    ])

    const teamEvents = ref([
      {
        date: '2026-03-01',
        title: '维修工单 WO001',
        type: 'workorder',
        engineer: '王工程师'
      },
      {
        date: '2026-03-01',
        title: '客户拜访',
        type: 'activity',
        engineer: '李工程师'
      },
      {
        date: '2026-03-02',
        title: '安装工单 WO003',
        type: 'workorder',
        engineer: '张工程师'
      }
    ])

    const getDayEvents = (date) => {
      const dateStr = date.toISOString().split('T')[0]
      return events.value.filter(event => event.date === dateStr)
    }

    const getTeamEvents = (date) => {
      const dateStr = date.toISOString().split('T')[0]
      return teamEvents.value.filter(event => event.date === dateStr)
    }

    // 获取某天的个人打卡记录（通过 date 对象）
    const getDayCheckInRecords = (date) => {
      // date 可能是 undefined 或 Date 对象
      if (!date || !(date instanceof Date)) {
        return []
      }
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const dateStr = `${year}-${month}-${day}`
      return checkInRecords.value.filter(record => {
        const recordDate = record.checkInTime.split(' ')[0]
        return recordDate === dateStr
      })
    }

    // 获取某天的个人打卡记录（通过 data 对象）
    const getDayCheckInRecordsByData = (data) => {
      // data.day 格式为 "2026-03-01"
      const dateStr = data.day
      return checkInRecords.value.filter(record => {
        const recordDate = record.checkInTime.split(' ')[0]
        return recordDate === dateStr
      })
    }

    // 获取某天的所有打卡记录（管理日历用，通过 date 对象）
    const getDayAllCheckInRecords = (date) => {
      // date 可能是 undefined 或 Date 对象
      if (!date || !(date instanceof Date)) {
        return []
      }
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const dateStr = `${year}-${month}-${day}`
      return checkInRecords.value.filter(record => {
        const recordDate = record.checkInTime.split(' ')[0]
        return recordDate === dateStr
      })
    }

    // 获取某天的所有打卡记录（管理日历用，通过 data 对象）
    const getDayAllCheckInRecordsByData = (data) => {
      // data.day 格式为 "2026-03-01"
      const dateStr = data.day
      return checkInRecords.value.filter(record => {
        const recordDate = record.checkInTime.split(' ')[0]
        return recordDate === dateStr
      })
    }

    // 根据打卡状态获取样式类名
    const getCheckInStatusClass = (status) => {
      const statusMap = {
        '进行中': 'in-progress',
        '已提交': 'submitted',
        '已通过': 'approved',
        '已驳回': 'rejected'
      }
      return statusMap[status] || 'default'
    }

    const handleCheckIn = () => {
      // 自动获取位置
      checkInForm.location = '上海市浦东新区张江高科技园区'
      checkInVisible.value = true
    }

    const handlePhotoUpload = (file) => {
      // 模拟上传照片
      photoList.value.push(file)
    }

    const handleSubmitCheckIn = () => {
      // 模拟提交打卡
      checkInVisible.value = false
      photoList.value = []
    }

    // 签离功能
    const handleCheckOut = (row) => {
      currentCheckInRecord.value = row
      checkOutForm.checkInId = row.id
      checkOutForm.checkInTime = row.checkInTime
      // 自动获取签离位置
      checkOutForm.location = '上海市浦东新区张江高科技园区'
      checkOutForm.remark = ''
      checkOutVisible.value = true
    }

    const handleSubmitCheckOut = () => {
      if (!checkOutForm.location) {
        ElMessage.warning('请先获取签离地点')
        return
      }

      const record = currentCheckInRecord.value
      const now = new Date().toLocaleString()
      
      // 更新签离信息
      record.checkOutTime = now
      record.checkOutLocation = checkOutForm.location
      
      // 添加到签离历史
      record.checkOutHistory.push({
        time: now,
        location: checkOutForm.location,
        remark: checkOutForm.remark
      })
      
      // 计算工时
      const checkIn = new Date(record.checkInTime)
      const checkOut = new Date(now)
      const duration = Math.round((checkOut - checkIn) / (1000 * 60 * 60) * 10) / 10
      record.duration = duration
      
      ElMessage.success('签离成功')
      checkOutVisible.value = false
    }

    // 提交申请功能
    const handleSubmitApproval = (row) => {
      if (!row.checkOutTime) {
        ElMessage.warning('请先进行签离操作')
        return
      }
      currentCheckInRecord.value = row
      submitApprovalVisible.value = true
    }

    const confirmSubmitApproval = () => {
      const record = currentCheckInRecord.value
      record.status = '已提交'
      
      // 保存备注信息
      record.submitRemark = submitApprovalForm.remark
      
      // 添加到审批记录
      approvalRecords.value.push({
        id: approvalRecords.value.length + 1,
        checkInId: record.id,
        engineer: '王工程师',
        submitTime: new Date().toLocaleString(),
        status: '待审批',
        remark: submitApprovalForm.remark
      })
      
      // 清空备注
      submitApprovalForm.remark = ''
      
      ElMessage.success('申请已提交')
      submitApprovalVisible.value = false
    }

    // 审批结果提交
    const handleSubmitApprovalResult = () => {
      // 更新审批记录状态
      const approvalRecord = approvalRecords.value.find(r => r.id === selectedApproval.value.id)
      if (approvalRecord) {
        approvalRecord.status = approvalForm.result === '通过' ? '已通过' : '已驳回'
        approvalRecord.approveTime = new Date().toLocaleString()
        approvalRecord.approveResult = approvalForm.result
        approvalRecord.approveComment = approvalForm.comment
        
        // 更新对应的打卡记录状态
        const checkInRecord = checkInRecords.value.find(r => r.id === approvalRecord.checkInId)
        if (checkInRecord) {
          checkInRecord.status = approvalForm.result === '通过' ? '已通过' : '已驳回'
        }
      }
      
      approvalVisible.value = false
      approvalForm.result = '通过'
      approvalForm.comment = ''
      ElMessage.success('审批结果已提交')
    }

    const handleSearch = () => {
      // 模拟搜索
      console.log('搜索', dateRange.value, checkInType.value)
    }

    const handleExport = () => {
      // 模拟导出
      console.log('导出CSV')
    }

    const handleSizeChange = (size) => {
      pageSize.value = size
    }

    const handleCurrentChange = (current) => {
      currentPage.value = current
    }

    const handleApprove = (row) => {
      // 模拟数据
      selectedApproval.value = {
        ...row,
        type: '活动打卡',
        customerName: '北京某设备制造有限公司',
        workorderId: '',
        checkInTime: '2026-03-02 10:00:00',
        checkInLocation: '北京市朝阳区建国路',
        checkOutLocation: '北京市朝阳区建国路',
        content: '商务洽谈'
      }
      approvalVisible.value = true
    }

    const getStatusType = (status) => {
      const statusMap = {
        '待派单': 'info',
        '进行中': 'warning',
        '已完成': 'success',
        '已取消': 'danger',
        '进行中': 'warning',
        '已提交': 'info',
        '已通过': 'success'
      }
      return statusMap[status] || 'info'
    }

    return {
      dateRange,
      checkInType,
      currentPage,
      pageSize,
      total,
      currentDate,
      checkInVisible,
      approvalVisible,
      checkOutVisible,
      submitApprovalVisible,
      photoList,
      checkInForm,
      checkOutForm,
      approvalForm,
      submitApprovalForm,
      selectedApproval,
      currentCheckInRecord,
      customers,
      workorders,
      checkInRecords,
      approvalRecords,
      pendingApprovalCount,
      pendingApprovalBadge,
      checkInTableColumns,
      approvalTableColumns,
      getCheckInStatusType,
      getApprovalStatusType,
      getDayEvents,
      getTeamEvents,
      getDayCheckInRecords,
      getDayCheckInRecordsByData,
      getDayAllCheckInRecords,
      getDayAllCheckInRecordsByData,
      getCheckInStatusClass,
      getStatusType,
      handleCheckIn,
      handlePhotoUpload,
      handleSubmitCheckIn,
      handleCheckOut,
      handleSubmitCheckOut,
      handleSubmitApproval,
      confirmSubmitApproval,
      handleSubmitApprovalResult,
      handleSearch,
      handleExport,
      handleSizeChange,
      handleCurrentChange,
      handleCheckInSortChange,
      handleApprovalSortChange,
      handleApprove
    }
  }
}
</script>

<style scoped>
.field-service {
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

.calendar-container {
  padding: 20px;
}

.calendar-cell {
  position: relative;
  min-height: 80px;
  display: flex;
  flex-direction: column;
  padding: 4px;
}

.date {
  font-size: 14px;
  margin-bottom: 5px;
}

.events {
  flex: 1;
  overflow: visible;
}

.event {
  font-size: 12px;
  margin-bottom: 2px;
  padding: 2px 4px;
  border-radius: 2px;
}

.event.workorder {
  background-color: #e6f7ff;
  color: #1890ff;
}

.event.activity {
  background-color: #f6ffed;
  color: #52c41a;
}

/* 打卡记录状态样式 */
.event.in-progress {
  background-color: #fff7e6;
  color: #fa8c16;
}

.event.submitted {
  background-color: #e6f7ff;
  color: #1890ff;
}

.event.approved {
  background-color: #f6ffed;
  color: #52c41a;
}

.event.rejected {
  background-color: #fff1f0;
  color: #f5222d;
}

.upload-demo {
  margin-top: 10px;
}

/* 标签页徽章样式 */
.tab-badge {
  margin-left: 5px;
}

.tab-badge :deep(.el-badge__content) {
  border: none;
  font-size: 11px;
  height: 16px;
  line-height: 16px;
  padding: 0 5px;
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
  
  .search-bar .el-date-picker {
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
  
  /* 详情对话框全屏 */
  .field-service :deep(.el-dialog) {
    width: 100% !important;
    margin: 0 !important;
    height: 100vh;
    max-height: 100vh;
    border-radius: 0;
    display: flex;
    flex-direction: column;
  }
  
  .field-service :deep(.el-dialog__header) {
    padding: 12px 15px;
    flex-shrink: 0;
    border-bottom: 1px solid #e4e7ed;
  }
  
  .field-service :deep(.el-dialog__body) {
    flex: 1;
    overflow-y: auto;
    padding: 10px;
    -webkit-overflow-scrolling: touch;
    max-height: calc(100vh - 55px);
  }
  
  /* 描述列表 - 每行一个字段 */
  .field-service :deep(.el-descriptions) {
    font-size: 14px;
    width: 100% !important;
  }
  
  .field-service :deep(.el-descriptions__body .el-descriptions__table) {
    width: 100% !important;
    table-layout: fixed !important;
    display: block !important;
  }
  
  .field-service :deep(.el-descriptions__body .el-descriptions__table tbody) {
    display: block !important;
    width: 100% !important;
  }
  
  .field-service :deep(.el-descriptions__body .el-descriptions__table tr) {
    display: block !important;
    width: 100% !important;
  }
  
  .field-service :deep(.el-descriptions__body .el-descriptions__table td) {
    display: flex !important;
    flex-direction: row !important;
    align-items: flex-start !important;
    padding: 10px 0 !important;
    border-bottom: 1px solid #ebeef5 !important;
    width: 100% !important;
    box-sizing: border-box !important;
  }
  
  .field-service :deep(.el-descriptions-item) {
    display: flex !important;
    flex-direction: row !important;
    align-items: flex-start !important;
    width: 100% !important;
  }
  
  .field-service :deep(.el-descriptions-item__cell) {
    display: flex !important;
    flex-direction: row !important;
    width: 100% !important;
  }
  
  .field-service :deep(.el-descriptions-item__label) {
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
  
  .field-service :deep(.el-descriptions-item__content) {
    flex: 1 !important;
    font-size: 14px !important;
    color: #303133 !important;
    padding: 0 !important;
    line-height: 1.5 !important;
    word-break: break-all !important;
    overflow-wrap: break-word !important;
    display: inline-block !important;
  }
  
  .calendar-container {
    padding: 10px;
  }
  
  .calendar-cell {
    height: 80px;
  }
  
  .date {
    font-size: 12px;
  }
  
  .event {
    font-size: 10px;
  }
  
  .el-upload {
    width: 100%;
  }
  
  .el-upload .el-button {
    width: 100%;
  }
}

/* 工单选择下拉菜单样式 */
.workorder-option {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 8px 0;
}

.workorder-id {
  font-weight: bold;
  font-size: 14px;
  min-width: 80px;
}

.workorder-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.workorder-type {
  font-size: 13px;
  color: #303133;
}

.workorder-customer {
  font-size: 12px;
  color: #606266;
}

.workorder-status {
  margin-top: 2px;
}

.workorder-status .el-tag {
  font-size: 11px;
  padding: 0 6px;
  height: 20px;
  line-height: 18px;
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
  
  .calendar-cell {
    height: 60px;
  }
  
  .event {
    font-size: 9px;
    padding: 1px 2px;
  }
}
</style>