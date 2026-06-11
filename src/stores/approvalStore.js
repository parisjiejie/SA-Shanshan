import { reactive, computed, readonly } from 'vue'

// 审批记录存储 - 初始化时包含默认数据
const state = reactive({
  approvalRecords: [
    {
      id: 1,
      checkInId: 2,
      engineer: '王工程师',
      submitTime: '2024-03-31 10:30:00',
      status: '待审批'
    },
    {
      id: 2,
      checkInId: 4,
      engineer: '李工程师',
      submitTime: '2024-03-30 14:20:00',
      status: '待审批'
    }
  ]
})

// 计算待审批数量
const pendingApprovalCount = computed(() => {
  return state.approvalRecords.filter(record => record.status === '待审批').length
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
const updateApprovalRecordStatus = (id, status) => {
  const record = state.approvalRecords.find(r => r.id === id)
  if (record) {
    record.status = status
  }
}

// 获取审批记录列表（只读）
const getApprovalRecords = () => {
  return readonly(state.approvalRecords)
}

export {
  state,
  pendingApprovalCount,
  setApprovalRecords,
  addApprovalRecord,
  updateApprovalRecordStatus,
  getApprovalRecords
}
