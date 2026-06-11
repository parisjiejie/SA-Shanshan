import { reactive, computed, readonly } from 'vue'

// 用户审核记录存储
const state = reactive({
  approvalRecords: [
    {
      id: 'REG20240331001',
      name: '张三',
      phone: '13800138001',
      email: 'zhangsan@example.com',
      position: '设备主管',
      companyName: '上海某机械有限公司',
      companyAddress: '上海市浦东新区张江高科技园区',
      creditCode: '91310000XXXXXXXXXX',
      companyPhone: '021-12345678',
      status: '待审核',
      submitTime: '2024-03-31 10:30:00',
      history: [
        {
          title: '提交注册申请',
          content: '用户提交注册申请，等待审核',
          time: '2024-03-31 10:30:00',
          type: 'primary',
          operator: '系统自动'
        }
      ]
    },
    {
      id: 'REG20240330002',
      name: '李四',
      phone: '13900139001',
      email: 'lisi@example.com',
      position: '采购经理',
      companyName: '北京某设备制造有限公司',
      companyAddress: '北京市朝阳区建国路88号',
      creditCode: '91110000XXXXXXXXXX',
      companyPhone: '010-87654321',
      status: '已通过',
      submitTime: '2024-03-30 14:20:00',
      approvalTime: '2024-03-30 16:45:00',
      history: [
        {
          title: '提交注册申请',
          content: '用户提交注册申请，等待审核',
          time: '2024-03-30 14:20:00',
          type: 'primary',
          operator: '系统自动'
        },
        {
          title: '审核通过',
          content: '管理员审核通过，已创建联系人记录和客户记录',
          time: '2024-03-30 16:45:00',
          type: 'success',
          operator: '管理员'
        }
      ]
    },
    {
      id: 'REG20240329003',
      name: '王五',
      phone: '13700137001',
      email: 'wangwu@example.com',
      position: '技术总监',
      companyName: '广州某工业设备有限公司',
      companyAddress: '广州市天河区珠江新城',
      creditCode: '',
      companyPhone: '',
      status: '已拒绝',
      submitTime: '2024-03-29 09:15:00',
      approvalTime: '2024-03-29 11:30:00',
      history: [
        {
          title: '提交注册申请',
          content: '用户提交注册申请，等待审核',
          time: '2024-03-29 09:15:00',
          type: 'primary',
          operator: '系统自动'
        },
        {
          title: '审核拒绝',
          content: '公司名称与实际不符，请重新提交',
          time: '2024-03-29 11:30:00',
          type: 'danger',
          operator: '管理员'
        }
      ]
    },
    {
      id: 'REG20240328004',
      name: '赵六',
      phone: '13600136001',
      email: 'zhaoliu@example.com',
      position: '设备工程师',
      companyName: '深圳某科技有限公司',
      companyAddress: '深圳市南山区科技园',
      creditCode: '91440300XXXXXXXXXX',
      companyPhone: '0755-12345678',
      status: '待审核',
      submitTime: '2024-03-28 16:00:00',
      history: [
        {
          title: '提交注册申请',
          content: '用户提交注册申请，等待审核',
          time: '2024-03-28 16:00:00',
          type: 'primary',
          operator: '系统自动'
        }
      ]
    }
  ]
})

// 计算待审核数量
const pendingApprovalCount = computed(() => {
  return state.approvalRecords.filter(record => record.status === '待审核').length
})

// 设置审批记录
const setApprovalRecords = (records) => {
  state.approvalRecords = records
}

// 添加审批记录
const addApprovalRecord = (record) => {
  state.approvalRecords.push(record)
}

// 更新审批记录状态
const updateApprovalRecordStatus = (id, status, approvalTime, historyRecord) => {
  const record = state.approvalRecords.find(r => r.id === id)
  if (record) {
    record.status = status
    if (approvalTime) {
      record.approvalTime = approvalTime
    }
    if (historyRecord) {
      record.history.push(historyRecord)
    }
  }
}

export {
  state,
  pendingApprovalCount,
  setApprovalRecords,
  addApprovalRecord,
  updateApprovalRecordStatus
}
