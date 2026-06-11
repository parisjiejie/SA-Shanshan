import { reactive, computed, readonly } from 'vue'

// 联系人存储
const state = reactive({
  contacts: [
    {
      id: 'CT001',
      name: '张经理',
      phone: '13800138001',
      email: 'zhangsan@example.com',
      position: '总经理',
      companyName: '上海某机械有限公司',
      companyId: 'C001',
      approvalStatus: '已通过',
      registerTime: '2024-01-10 09:00:00',
      history: [
        { title: '提交注册申请', content: '用户提交注册申请', time: '2024-01-10 09:00:00', type: 'primary' },
        { title: '审核通过', content: '管理员审核通过', time: '2024-01-10 10:30:00', type: 'success' }
      ]
    },
    {
      id: 'CT002',
      name: '李工程师',
      phone: '13800138002',
      email: 'lisi@example.com',
      position: '技术负责人',
      companyName: '上海某机械有限公司',
      companyId: 'C001',
      approvalStatus: '已通过',
      registerTime: '2024-01-12 14:30:00',
      history: [
        { title: '提交注册申请', content: '用户提交注册申请', time: '2024-01-12 14:30:00', type: 'primary' },
        { title: '审核通过', content: '管理员审核通过', time: '2024-01-12 16:00:00', type: 'success' }
      ]
    },
    {
      id: 'CT003',
      name: '李经理',
      phone: '13900139001',
      email: 'wangwu@example.com',
      position: '采购经理',
      companyName: '北京某设备制造有限公司',
      companyId: 'C002',
      approvalStatus: '待审核',
      registerTime: '2024-03-15 10:00:00',
      history: [
        { title: '提交注册申请', content: '用户提交注册申请，等待审核', time: '2024-03-15 10:00:00', type: 'primary' }
      ]
    },
    {
      id: 'CT004',
      name: '王经理',
      phone: '13700137001',
      email: 'zhaoliu@example.com',
      position: '设备主管',
      companyName: '广州某工业设备有限公司',
      companyId: 'C003',
      approvalStatus: '已通过',
      registerTime: '2024-02-20 11:00:00',
      history: [
        { title: '提交注册申请', content: '用户提交注册申请', time: '2024-02-20 11:00:00', type: 'primary' },
        { title: '审核通过', content: '管理员审核通过', time: '2024-02-20 14:00:00', type: 'success' }
      ]
    }
  ]
})

// 计算属性：获取所有联系人
const allContacts = computed(() => state.contacts)

// 计算属性：按公司分组
const contactsByCompany = computed(() => {
  const groups = {}
  state.contacts.forEach(contact => {
    if (!groups[contact.companyName]) {
      groups[contact.companyName] = []
    }
    groups[contact.companyName].push(contact)
  })
  return groups
})

// 计算属性：待审核联系人数量
const pendingContactCount = computed(() => {
  return state.contacts.filter(contact => contact.approvalStatus === '待审核').length
})

// 设置联系人列表
const setContacts = (contacts) => {
  state.contacts = contacts
}

// 添加联系人
const addContact = (contact) => {
  state.contacts.push(contact)
}

// 更新联系人
const updateContact = (id, updatedData) => {
  const index = state.contacts.findIndex(c => c.id === id)
  if (index !== -1) {
    state.contacts[index] = { ...state.contacts[index], ...updatedData }
  }
}

// 删除联系人
const deleteContact = (id) => {
  const index = state.contacts.findIndex(c => c.id === id)
  if (index !== -1) {
    state.contacts.splice(index, 1)
  }
}

// 根据ID获取联系人
const getContactById = (id) => {
  return state.contacts.find(c => c.id === id)
}

// 根据公司ID获取联系人
const getContactsByCompanyId = (companyId) => {
  return state.contacts.filter(c => c.companyId === companyId)
}

// 添加历史记录
const addHistoryRecord = (contactId, record) => {
  const contact = state.contacts.find(c => c.id === contactId)
  if (contact) {
    if (!contact.history) {
      contact.history = []
    }
    contact.history.push(record)
  }
}

export {
  state,
  allContacts,
  contactsByCompany,
  pendingContactCount,
  setContacts,
  addContact,
  updateContact,
  deleteContact,
  getContactById,
  getContactsByCompanyId,
  addHistoryRecord
}
