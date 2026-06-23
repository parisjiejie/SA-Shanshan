import { reactive, computed } from 'vue'

// 设备存储
const state = reactive({
  // 设备列表
  assets: [
    {
      serialNumber: 'SN001',
      name: '激光切割机',
      model: 'Model A',
      customerName: '上海某机械有限公司',
      companyId: 'C001',
      status: '运行中',
      manufactureDate: '2025-12-01',
      saleDate: '2026-01-05',
      installDate: '2026-01-10',
      warrantyEndDate: '2027-01-10',
      isEL: true,
      installAddress: '上海市浦东新区张江高科技园区',
      contactPerson: '张经理',
      contactPhone: '13800138001',
      hasQRCode: true,
      qrCodeToken: 'TOKEN002'
    },
    {
      serialNumber: 'SN002',
      name: '数控折弯机',
      model: 'Model B',
      customerName: '北京某设备制造有限公司',
      companyId: 'C002',
      status: '停机',
      manufactureDate: '2025-11-15',
      saleDate: '2026-01-10',
      installDate: '2026-01-15',
      warrantyEndDate: '2027-01-15',
      isEL: false,
      installAddress: '北京市朝阳区建国路',
      contactPerson: '李经理',
      contactPhone: '13900139001',
      hasQRCode: false,
      qrCodeToken: ''
    },
    {
      serialNumber: 'SN003',
      name: '激光焊接机',
      model: 'Model C',
      customerName: '广州某工业设备有限公司',
      companyId: 'C003',
      status: '维修中',
      manufactureDate: '2025-10-20',
      saleDate: '2026-01-15',
      installDate: '2026-01-20',
      warrantyEndDate: '2027-01-20',
      isEL: true,
      installAddress: '广州市天河区珠江新城',
      contactPerson: '王经理',
      contactPhone: '13700137001',
      hasQRCode: false,
      qrCodeToken: ''
    }
  ],

  // 二维码列表
  qrcodes: [
    {
      id: 1,
      token: 'TOKEN001',
      status: '未绑定',
      bindAsset: '',
      createTime: '2026-03-01 10:00:00',
      bindTime: ''
    },
    {
      id: 2,
      token: 'TOKEN002',
      status: '已绑定',
      bindAsset: 'SN001',
      createTime: '2026-03-01 10:00:00',
      bindTime: '2026-03-02 14:00:00'
    },
    {
      id: 3,
      token: 'TOKEN003',
      status: '未绑定',
      bindAsset: '',
      createTime: '2026-03-01 10:00:00',
      bindTime: ''
    }
  ]
})

// 计算属性：所有设备
const allAssets = computed(() => state.assets)

// 计算属性：所有二维码
const allQRCodes = computed(() => state.qrcodes)

// 计算属性：已绑定的二维码
const boundQRCodes = computed(() => state.qrcodes.filter(q => q.status === '已绑定'))

// 计算属性：未绑定的二维码
const unboundQRCodes = computed(() => state.qrcodes.filter(q => q.status === '未绑定'))

// 根据序列号获取设备
const getAssetBySerialNumber = (serialNumber) => {
  return state.assets.find(a => a.serialNumber === serialNumber)
}

// 根据公司ID获取设备列表
const getAssetsByCompanyId = (companyId) => {
  return state.assets.filter(a => a.companyId === companyId)
}

// 根据二维码Token获取设备
const getAssetByQRToken = (token) => {
  const qrcode = state.qrcodes.find(q => q.token === token)
  if (!qrcode || qrcode.status !== '已绑定' || !qrcode.bindAsset) return null
  return state.assets.find(a => a.serialNumber === qrcode.bindAsset)
}

// 根据二维码Token获取二维码
const getQRCodeByToken = (token) => {
  return state.qrcodes.find(q => q.token === token)
}

// 绑定二维码到设备
const bindQRCode = (token, serialNumber) => {
  const qrcode = state.qrcodes.find(q => q.token === token)
  const asset = state.assets.find(a => a.serialNumber === serialNumber)
  if (qrcode && asset) {
    qrcode.status = '已绑定'
    qrcode.bindAsset = serialNumber
    qrcode.bindTime = new Date().toLocaleString()
    asset.hasQRCode = true
    asset.qrCodeToken = token
    return true
  }
  return false
}

// 解绑二维码
const unbindQRCode = (token) => {
  const qrcode = state.qrcodes.find(q => q.token === token)
  if (qrcode) {
    const asset = state.assets.find(a => a.serialNumber === qrcode.bindAsset)
    if (asset) {
      asset.hasQRCode = false
      asset.qrCodeToken = ''
    }
    qrcode.status = '未绑定'
    qrcode.bindAsset = ''
    qrcode.bindTime = ''
    return true
  }
  return false
}

// 添加设备
const addAsset = (asset) => {
  state.assets.push(asset)
}

// 更新设备
const updateAsset = (serialNumber, updatedData) => {
  const index = state.assets.findIndex(a => a.serialNumber === serialNumber)
  if (index !== -1) {
    state.assets[index] = { ...state.assets[index], ...updatedData }
  }
}

// 删除设备
const deleteAsset = (serialNumber) => {
  const index = state.assets.findIndex(a => a.serialNumber === serialNumber)
  if (index !== -1) {
    state.assets.splice(index, 1)
  }
}

// 添加二维码
const addQRCode = (qrcode) => {
  state.qrcodes.push(qrcode)
}

// 批量生成空白码
const generateBatchQRCodes = (count, batchName) => {
  const maxId = state.qrcodes.reduce((max, q) => Math.max(max, q.id), 0)
  for (let i = 0; i < count; i++) {
    const id = maxId + i + 1
    const token = `TOKEN${String(id).padStart(3, '0')}`
    state.qrcodes.push({
      id,
      token,
      status: '未绑定',
      bindAsset: '',
      createTime: new Date().toLocaleString(),
      bindTime: ''
    })
  }
}

export {
  state,
  allAssets,
  allQRCodes,
  boundQRCodes,
  unboundQRCodes,
  getAssetBySerialNumber,
  getAssetsByCompanyId,
  getAssetByQRToken,
  getQRCodeByToken,
  bindQRCode,
  unbindQRCode,
  addAsset,
  updateAsset,
  deleteAsset,
  addQRCode,
  generateBatchQRCodes
}
