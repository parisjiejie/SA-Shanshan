<template>
  <div class="staff-workorder-create">
    <!-- 顶部导航 -->
    <div class="header">
      <el-button link @click="goBack">
        <el-icon><ArrowLeft /></el-icon>
        <span>返回</span>
      </el-button>
      <span class="header-title">发起工单</span>
      <span class="placeholder"></span>
    </div>

    <!-- 工单表单 -->
    <div class="form-container">
      <!-- 基本信息 -->
      <div class="form-section">
        <div class="section-title">基本信息</div>
        <el-form
          ref="formRef"
          :model="form"
          :rules="rules"
          label-position="top"
          class="workorder-form"
        >
          <el-form-item v-if="!routeType" label="工单类型" prop="category">
            <el-radio-group v-model="form.category" class="type-radio-group" @change="onCategoryChange">
              <el-radio-button label="installation">安装工单</el-radio-button>
              <el-radio-button label="service">服务工单</el-radio-button>
            </el-radio-group>
          </el-form-item>
          <el-form-item v-else label="工单类型">
            <el-tag :type="form.category === 'installation' ? 'primary' : 'success'" size="large">
              {{ form.category === 'installation' ? '安装工单' : '服务工单' }}
            </el-tag>
          </el-form-item>
          <el-form-item v-if="form.category === 'service'" label="服务子类" prop="subType">
            <el-select v-model="form.subType" placeholder="选择服务子类" style="width: 100%">
              <el-option label="维修" value="repair" />
              <el-option label="试加工" value="trial_processing" />
              <el-option label="改造" value="refitting" />
            </el-select>
          </el-form-item>
        </el-form>
      </div>

      <!-- 客户信息 -->
      <div class="form-section">
        <div class="section-title">客户信息</div>
        <el-form
          :model="form"
          :rules="rules"
          label-position="top"
          class="workorder-form"
        >
          <el-form-item label="客户公司" prop="customerId">
            <el-select
              v-model="form.customerId"
              placeholder="搜索选择客户公司"
              filterable
              style="width: 100%"
              @change="onCustomerChange"
            >
              <el-option
                v-for="c in customers"
                :key="c.id"
                :label="c.name"
                :value="c.id"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="联系电话">
            <el-input v-model="form.customerPhone" placeholder="选择客户后自动带入" readonly />
          </el-form-item>
          <el-form-item label="联系人">
            <el-select
              v-model="form.customerContactId"
              placeholder="请选择联系人"
              style="width: 100%"
              @change="onContactChange"
            >
              <el-option
                v-for="c in customerContacts"
                :key="c.id"
                :label="`${c.name}（${c.position}）`"
                :value="c.id"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="地址">
            <el-input v-model="form.customerAddress" type="textarea" :rows="2" placeholder="选择客户后自动带入" readonly />
          </el-form-item>
        </el-form>
      </div>

      <!-- 设备信息 -->
      <div class="form-section">
        <div class="section-title">设备信息</div>
        <el-form
          :model="form"
          label-position="top"
          class="workorder-form"
        >
          <el-form-item label="设备型号">
            <el-select
              v-model="form.assetModel"
              placeholder="选择设备型号"
              clearable
              style="width: 100%"
              @change="onModelChange"
            >
              <el-option
                v-for="m in customerModels"
                :key="m"
                :label="m"
                :value="m"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="序列号">
            <el-select
              v-model="form.assetSerialNumber"
              placeholder="选择序列号"
              clearable
              style="width: 100%"
              @change="onSNChange"
            >
              <el-option
                v-for="sn in customerSNs"
                :key="sn.serialNumber"
                :label="sn.serialNumber"
                :value="sn.serialNumber"
              />
            </el-select>
          </el-form-item>
          <el-form-item v-if="form.warrantyStatus" label="保修状态">
            <el-tag :type="WarrantyStatusType[form.warrantyStatus] || 'info'" size="large">
              {{ WarrantyStatusText[form.warrantyStatus] || form.warrantyStatus }}
            </el-tag>
          </el-form-item>
          <el-form-item v-if="form.installDate" label="安装日期">
            <el-tag type="info" size="large">{{ form.installDate }}</el-tag>
          </el-form-item>
        </el-form>
      </div>

      <!-- 故障描述 -->
      <div class="form-section">
        <div class="section-title">故障描述</div>
        <el-form
          ref="descFormRef"
          :model="form"
          :rules="rules"
          label-position="top"
          class="workorder-form"
        >
          <el-form-item prop="description">
            <el-input
              v-model="form.description"
              type="textarea"
              :rows="4"
              placeholder="请详细描述问题或需求"
            />
          </el-form-item>
          <div class="fault-tags">
            <span class="tag-label">常见故障：</span>
            <el-tag
              v-for="tag in commonFaultTags"
              :key="tag.label"
              class="fault-tag"
              effect="plain"
              @click="applyFaultTag(tag)"
            >
              {{ tag.label }}
            </el-tag>
          </div>
        </el-form>
      </div>
    </div>

    <!-- 底部提交按钮 -->
    <div class="footer-actions">
      <el-button size="large" @click="goBack">取消</el-button>
      <el-button type="primary" size="large" @click="submitWorkorder" :loading="submitting">
        提交工单
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft } from '@element-plus/icons-vue'
import { createWorkorder } from '../stores/workorderFlowStore.js'
import { getContactsByCompanyId } from '../stores/contactStore.js'

const router = useRouter()
const route = useRoute()
const formRef = ref(null)
const descFormRef = ref(null)
const submitting = ref(false)

// 从路由参数读取类型，默认服务工单
const routeType = route.query.type
const defaultCat = (routeType === 'installation') ? 'installation' : 'service'

// 客户数据
const customers = ref([
  { id: 'C001', name: '上海某机械有限公司', phone: '021-55551234', address: '上海市浦东新区张江高科技园区XX路88号' },
  { id: 'C002', name: '北京某设备制造有限公司', phone: '010-66667890', address: '北京市朝阳区望京科技园YY路12号' },
  { id: 'C003', name: '广州某工业设备有限公司', phone: '020-77773456', address: '广州市黄埔区开发区ZZ路56号' }
])

// 客户联系人列表（根据所选客户动态获取）
const customerContacts = computed(() => {
  if (!form.customerId) return []
  return getContactsByCompanyId(form.customerId).filter(c => c.approvalStatus === '已通过')
})

// 设备数据
const assets = ref([
  { id: 'asset_001', customerId: 'C001', model: 'CNC-A100', serialNumber: 'SN001', warrantyStatus: 'in_warranty', warrantyExpiry: '2027-03-15', installDate: '2025-06-10' },
  { id: 'asset_002', customerId: 'C001', model: 'CNC-A100', serialNumber: 'SN002', warrantyStatus: 'out_of_warranty', warrantyExpiry: '2026-01-10', installDate: '2024-03-20' },
  { id: 'asset_003', customerId: 'C001', model: 'LASER-B200', serialNumber: 'SN003', warrantyStatus: 'in_warranty', warrantyExpiry: '2027-06-20', installDate: '2025-09-15' },
  { id: 'asset_004', customerId: 'C002', model: 'PRESS-C300', serialNumber: 'SN004', warrantyStatus: 'expired', warrantyExpiry: '2025-02-01', installDate: '2023-11-05' },
  { id: 'asset_005', customerId: 'C002', model: 'CNC-A100', serialNumber: 'SN005', warrantyStatus: 'in_warranty', warrantyExpiry: '2027-09-01', installDate: '2026-01-18' },
  { id: 'asset_006', customerId: 'C003', model: 'LASER-B200', serialNumber: 'SN006', warrantyStatus: 'in_warranty', warrantyExpiry: '2027-12-01', installDate: '' },
  { id: 'asset_007', customerId: 'C003', model: 'PRESS-C300', serialNumber: 'SN007', warrantyStatus: 'out_of_warranty', warrantyExpiry: '2026-04-15', installDate: '2024-08-22' }
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

// 表单数据
const form = reactive({
  category: defaultCat,
  subType: defaultCat === 'service' ? 'repair' : null,
  customerId: '',
  customerName: '',
  customerPhone: '',
  customerContact: '',
  customerContactId: '',
  customerAddress: '',
  assetModel: '',
  assetSerialNumber: '',
  warrantyStatus: '',
  installDate: '',
  description: ''
})

// 级联：客户 → 设备型号列表
const customerModels = computed(() => {
  if (!form.customerId) return []
  return [...new Set(assets.value.filter(a => a.customerId === form.customerId).map(a => a.model))]
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

const onCategoryChange = (cat) => {
  if (cat === 'installation') form.subType = null
  else if (!form.subType) form.subType = 'repair'
}

const onCustomerChange = (customerId) => {
  const customer = customers.value.find(c => c.id === customerId)
  if (customer) {
    form.customerName = customer.name
    form.customerPhone = customer.phone || ''
    form.customerAddress = customer.address || ''
    form.customerContactId = ''
    form.customerContact = ''
  } else {
    form.customerName = ''
    form.customerPhone = ''
    form.customerAddress = ''
    form.customerContactId = ''
    form.customerContact = ''
  }
  form.assetModel = ''
  form.assetSerialNumber = ''
  form.warrantyStatus = ''
}

const onContactChange = (contactId) => {
  const contacts = customerContacts.value
  const contact = contacts.find(c => c.id === contactId)
  if (contact) {
    form.customerContact = contact.name
    form.customerContactId = contact.id
    form.customerPhone = contact.phone || form.customerPhone
  }
}

const onModelChange = () => {
  form.assetSerialNumber = ''
  form.warrantyStatus = ''
}

const onSNChange = (sn) => {
  const asset = assets.value.find(a => a.serialNumber === sn && a.customerId === form.customerId)
  if (asset) {
    form.warrantyStatus = asset.warrantyStatus || ''
    form.installDate = asset.installDate || ''
    if (!form.assetModel && asset.model) {
      form.assetModel = asset.model
    }
  } else {
    form.warrantyStatus = ''
    form.installDate = ''
  }
}

const applyFaultTag = (tag) => {
  form.description = tag.description
}

// 表单验证规则
const rules = {
  category: [{ required: true, message: '请选择工单类型', trigger: 'change' }],
  customerId: [{ required: true, message: '请选择客户公司', trigger: 'change' }],
  description: [
    { required: true, message: '请输入故障描述', trigger: 'blur' },
    { min: 5, message: '描述至少5个字符', trigger: 'blur' }
  ]
}

// 返回上一页
const goBack = () => {
  router.back()
}

// 提交工单
const submitWorkorder = async () => {
  try {
    if (formRef.value) await formRef.value.validate()
    if (descFormRef.value) await descFormRef.value.validate()
  } catch {
    ElMessage.warning('请检查表单填写是否完整')
    return
  }

  submitting.value = true
  const auth = JSON.parse(localStorage.getItem('staffAuth') || '{}')

  const wo = createWorkorder({
    customerId: form.customerId,
    customerName: form.customerName,
    customerPhone: form.customerPhone,
    customerContact: form.customerContact,
    address: form.customerAddress,
    deviceModel: form.assetModel,
    serialNumber: form.assetSerialNumber,
    faultDescription: form.description,
    category: form.category,
    subType: form.category === 'service' ? form.subType : null,
    warrantyStatus: form.warrantyStatus || 'unknown',
    installDate: form.installDate || '',
    createdBy: {
      id: auth.id || auth.userId || '',
      name: auth.name || '员工',
      role: auth.role || 'assistant'
    }
  }, auth.role || 'assistant', auth.name || '员工')

  ElMessage.success(`工单 ${wo.workorderId} 创建成功`)
  submitting.value = false
  router.push('/staff-mobile-workspace')
}
</script>

<style scoped>
.staff-workorder-create {
  min-height: 100vh;
  background: #f5f7fa;
  padding-bottom: 80px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 15px;
  background: white;
  border-bottom: 1px solid #e8e8e8;
  position: sticky;
  top: 0;
  z-index: 100;
}

.header .el-button {
  color: #606266;
  font-size: 14px;
}

.header-title {
  font-size: 17px;
  font-weight: 500;
  color: #262626;
}

.placeholder {
  width: 60px;
}

.form-container {
  padding: 12px 15px;
}

.form-section {
  background: white;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 12px;
  padding-left: 8px;
  border-left: 3px solid #409eff;
}

.workorder-form {
  /* no extra padding, section already has it */
}

.type-radio-group {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.type-radio-group :deep(.el-radio-button__inner) {
  border-radius: 20px;
  padding: 8px 20px;
}

.fault-tags {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
}

.tag-label {
  font-size: 13px;
  color: #909399;
}

.fault-tag {
  cursor: pointer;
  transition: all 0.2s;
}

.fault-tag:hover {
  color: #409eff;
  border-color: #409eff;
}

.footer-actions {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  padding: 15px;
  display: flex;
  gap: 15px;
  box-shadow: 0 -2px 10px rgba(0,0,0,0.05);
}

.footer-actions .el-button {
  flex: 1;
}

@media (max-width: 375px) {
  .form-container {
    padding: 10px;
  }
  .form-section {
    padding: 12px;
  }
}
</style>
