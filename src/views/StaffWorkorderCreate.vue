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
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-position="top"
        class="workorder-form"
      >
        <!-- 工单类型 -->
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

        <!-- 客户信息 -->
        <el-form-item label="客户名称" prop="customerName">
          <el-input
            v-model="form.customerName"
            placeholder="请输入客户名称"
            clearable
          />
        </el-form-item>

        <el-form-item label="联系电话" prop="contactPhone">
          <el-input
            v-model="form.contactPhone"
            placeholder="请输入联系电话"
            clearable
          />
        </el-form-item>

        <el-form-item label="服务地址" prop="address">
          <el-input
            v-model="form.address"
            type="textarea"
            :rows="2"
            placeholder="请输入详细服务地址"
          />
        </el-form-item>

        <!-- 设备信息 -->
        <el-form-item label="设备型号" prop="deviceModel">
          <el-input
            v-model="form.deviceModel"
            placeholder="请输入设备型号（选填）"
            clearable
          />
        </el-form-item>

        <!-- 问题描述 -->
        <el-form-item label="问题描述" prop="description">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="4"
            placeholder="请详细描述问题或需求"
          />
        </el-form-item>

        <!-- 期望时间 -->
        <el-form-item label="期望服务时间" prop="expectTime">
          <el-date-picker
            v-model="form.expectTime"
            type="datetime"
            placeholder="选择期望服务时间"
            format="YYYY-MM-DD HH:mm"
            value-format="YYYY-MM-DD HH:mm:ss"
            style="width: 100%"
          />
        </el-form-item>

        <!-- 备注 -->
        <el-form-item label="备注">
          <el-input
            v-model="form.remark"
            type="textarea"
            :rows="2"
            placeholder="其他备注信息（选填）"
          />
        </el-form-item>
      </el-form>
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
import { ref, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft } from '@element-plus/icons-vue'
import { createWorkorder } from '../stores/workorderFlowStore.js'

const router = useRouter()
const route = useRoute()
const formRef = ref(null)
const submitting = ref(false)

// 从路由参数读取类型，默认服务工单
const routeType = route.query.type
const defaultCat = (routeType === 'installation') ? 'installation' : 'service'

// 表单数据
const form = reactive({
  category: defaultCat,
  subType: defaultCat === 'service' ? 'repair' : null,
  customerId: '',
  customerName: '',
  contactPhone: '',
  address: '',
  deviceModel: '',
  description: '',
  expectTime: '',
  remark: ''
})

const onCategoryChange = (cat) => {
  if (cat === 'installation') form.subType = null
  else if (!form.subType) form.subType = 'repair'
}

// 表单验证规则
const rules = {
  category: [
    { required: true, message: '请选择工单类型', trigger: 'change' }
  ],
  customerName: [
    { required: true, message: '请输入客户名称', trigger: 'blur' }
  ],
  contactPhone: [
    { required: true, message: '请输入联系电话', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ],
  address: [
    { required: true, message: '请输入服务地址', trigger: 'blur' }
  ],
  description: [
    { required: true, message: '请输入问题描述', trigger: 'blur' },
    { min: 10, message: '描述至少10个字符', trigger: 'blur' }
  ],
  expectTime: [
    { required: true, message: '请选择期望服务时间', trigger: 'change' }
  ]
}

// 返回上一页
const goBack = () => {
  router.back()
}

// 提交工单
const submitWorkorder = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
    submitting.value = true
    
    const auth = JSON.parse(localStorage.getItem('staffAuth') || '{}')
    
    const wo = createWorkorder({
       customerId: form.customerId || ('cust_' + form.customerName),
       customerName: form.customerName,
       customerPhone: form.contactPhone,
       address: form.address,
       deviceModel: form.deviceModel,
       serialNumber: '',
       faultDescription: form.description,
      category: form.category,
      subType: form.category === 'service' ? form.subType : null,
       warrantyStatus: 'out',
       createdBy: {
        id: auth.id || auth.userId || '',
        name: auth.name || '员工',
        role: auth.role || 'assistant'
      }
     }, auth.role || 'assistant', auth.name || '员工')
    
    ElMessage.success(`工单 ${wo.workorderId} 创建成功`)
    submitting.value = false
    router.push('/staff-mobile-workspace')
  } catch (error) {
    ElMessage.error('请检查表单填写是否正确')
  }
}
</script>

<style scoped>
.staff-workorder-create {
  min-height: 100vh;
  background: #f5f7fa;
  padding-bottom: 80px;
}

/* 顶部导航 */
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

/* 表单容器 */
.form-container {
  padding: 15px;
}

.workorder-form {
  background: white;
  border-radius: 12px;
  padding: 20px;
}

/* 工单类型选择 */
.type-radio-group {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.type-radio-group :deep(.el-radio-button__inner) {
  border-radius: 20px;
  padding: 8px 20px;
}

/* 底部按钮 */
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

/* 适配小屏幕 */
@media (max-width: 375px) {
  .form-container {
    padding: 10px;
  }
  
  .workorder-form {
    padding: 15px;
  }
}
</style>
