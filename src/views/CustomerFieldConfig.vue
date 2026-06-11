<template>
  <div class="customer-field-config">
    <!-- 页面标题 -->
    <div class="page-header">
      <div class="header-left">
        <h2>客户字段配置</h2>
        <el-select
          v-model="selectedCustomerId"
          placeholder="选择客户"
          style="width: 200px; margin-left: 16px"
          @change="handleCustomerChange"
        >
          <el-option
            v-for="customer in customers"
            :key="customer.id"
            :label="customer.name"
            :value="customer.id"
          />
        </el-select>
      </div>
      <div class="header-actions">
        <el-button @click="showDiff = true">
          <el-icon><View /></el-icon>
          查看差异
        </el-button>
        <el-button type="primary" @click="handleSave" :loading="saving">
          <el-icon><Check /></el-icon>
          保存配置
        </el-button>
      </div>
    </div>

    <div v-if="selectedCustomerId" class="config-container">
      <!-- 左侧：基础模板选择 -->
      <div class="template-section">
        <h3>基础模板</h3>
        <el-select
          v-model="baseTemplateId"
          placeholder="选择基础模板"
          style="width: 100%"
          @change="handleTemplateChange"
        >
          <el-option
            v-for="template in templates"
            :key="template.id"
            :label="template.name"
            :value="template.id"
          >
            <span>{{ template.name }}</span>
            <span style="float: right; color: #8492a6; font-size: 13px">
              {{ template.scope?.workorderTypes?.join(', ') }}
            </span>
          </el-option>
        </el-select>

        <div v-if="baseTemplate" class="template-info">
          <p><strong>模板描述：</strong>{{ baseTemplate.description || '暂无描述' }}</p>
          <p><strong>字段数量：</strong>{{ baseTemplate.fields?.length || 0 }} 个</p>
          <p><strong>适用类型：</strong>{{ baseTemplate.scope?.workorderTypes?.join(', ') }}</p>
        </div>
      </div>

      <!-- 中间：字段定制 -->
      <div class="customization-section">
        <div class="section-header">
          <h3>字段定制</h3>
          <el-radio-group v-model="viewMode" size="small">
            <el-radio-button label="all">全部字段</el-radio-button>
            <el-radio-button label="modified">已修改</el-radio-button>
            <el-radio-button label="added">新增</el-radio-button>
            <el-radio-button label="removed">已移除</el-radio-button>
          </el-radio-group>
        </div>

        <!-- 字段列表 -->
        <div class="fields-list">
          <div
            v-for="field in filteredFields"
            :key="field.id"
            class="field-item"
            :class="{
              'is-modified': isFieldModified(field),
              'is-added': isFieldAdded(field),
              'is-removed': isFieldRemoved(field)
            }"
          >
            <div class="field-header">
              <div class="field-info">
                <el-icon :size="18">
                  <component :is="getFieldIcon(field.type)" />
                </el-icon>
                <span class="field-name">{{ field.name }}</span>
                <el-tag v-if="isFieldAdded(field)" type="success" size="small">新增</el-tag>
                <el-tag v-if="isFieldRemoved(field)" type="danger" size="small">已移除</el-tag>
                <el-tag v-if="isFieldModified(field)" type="warning" size="small">已修改</el-tag>
              </div>
              <div class="field-actions">
                <el-button
                  v-if="!isFieldRemoved(field)"
                  type="primary"
                  link
                  size="small"
                  @click="handleEditField(field)"
                >
                  编辑
                </el-button>
                <el-button
                  v-if="isFieldAdded(field)"
                  type="danger"
                  link
                  size="small"
                  @click="handleRemoveAddedField(field)"
                >
                  删除
                </el-button>
                <el-button
                  v-else-if="isFieldRemoved(field)"
                  type="success"
                  link
                  size="small"
                  @click="handleRestoreField(field)"
                >
                  恢复
                </el-button>
                <el-button
                  v-else
                  type="danger"
                  link
                  size="small"
                  @click="handleRemoveField(field)"
                >
                  移除
                </el-button>
              </div>
            </div>

            <!-- 字段修改摘要 -->
            <div v-if="isFieldModified(field)" class="field-changes">
              <div
                v-for="(change, key) in getFieldChanges(field)"
                :key="key"
                class="change-item"
              >
                <span class="change-key">{{ change.label }}:</span>
                <span class="change-old">{{ change.oldValue }}</span>
                <el-icon><ArrowRight /></el-icon>
                <span class="change-new">{{ change.newValue }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 添加字段按钮 -->
        <el-button
          type="primary"
          plain
          class="add-field-btn"
          @click="showAddFieldDialog = true"
        >
          <el-icon><Plus /></el-icon>
          添加自定义字段
        </el-button>
      </div>

      <!-- 右侧：修改详情 -->
      <div class="detail-section">
        <h3>修改详情</h3>
        <div v-if="selectedField" class="field-edit-form">
          <el-form label-position="top" size="small">
            <el-form-item label="字段名称">
              <el-input v-model="selectedField.name" />
            </el-form-item>

            <el-form-item label="显示标签">
              <el-input v-model="selectedField.config.label" />
            </el-form-item>

            <el-form-item label="占位提示">
              <el-input v-model="selectedField.config.placeholder" />
            </el-form-item>

            <el-form-item>
              <el-checkbox v-model="selectedField.config.required">必填</el-checkbox>
            </el-form-item>

            <el-form-item>
              <el-checkbox v-model="selectedField.config.disabled">禁用</el-checkbox>
            </el-form-item>

            <el-form-item>
              <el-checkbox v-model="selectedField.config.hidden">隐藏</el-checkbox>
            </el-form-item>

            <el-form-item label="占位格数">
              <el-slider
                v-model="selectedField.config.colSpan"
                :min="1"
                :max="24"
                :step="1"
                show-stops
              />
            </el-form-item>

            <el-form-item label="默认值">
              <el-input v-model="selectedField.config.defaultValue" />
            </el-form-item>
          </el-form>
        </div>
        <div v-else class="empty-detail">
          <el-icon :size="48"><Edit /></el-icon>
          <p>选择字段查看修改详情</p>
        </div>
      </div>
    </div>

    <div v-else class="empty-state">
      <el-icon :size="64"><User /></el-icon>
      <p>请选择客户进行配置</p>
    </div>

    <!-- 添加字段对话框 -->
    <el-dialog
      v-model="showAddFieldDialog"
      title="添加自定义字段"
      width="600px"
    >
      <el-form label-width="100px">
        <el-form-item label="字段类型">
          <el-select v-model="newField.type" placeholder="选择字段类型" style="width: 100%">
            <el-option-group
              v-for="cat in fieldCategories"
              :key="cat.code"
              :label="cat.name"
            >
              <el-option
                v-for="type in getTypesByCategory(cat.code)"
                :key="type.code"
                :label="type.name"
                :value="type.code"
              />
            </el-option-group>
          </el-select>
        </el-form-item>

        <el-form-item label="字段名称">
          <el-input v-model="newField.name" placeholder="请输入字段名称" />
        </el-form-item>

        <el-form-item label="字段编码">
          <el-input v-model="newField.code" placeholder="请输入字段编码" />
        </el-form-item>

        <el-form-item label="显示标签">
          <el-input v-model="newField.config.label" placeholder="表单中显示的标签" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showAddFieldDialog = false">取消</el-button>
        <el-button type="primary" @click="handleAddField">添加</el-button>
      </template>
    </el-dialog>

    <!-- 差异对比对话框 -->
    <el-dialog
      v-model="showDiff"
      title="配置差异对比"
      width="800px"
    >
      <FieldDiffViewer
        :base-fields="baseFields"
        :custom-fields="customFields"
        :removed-fields="removedFields"
        :modified-fields="modifiedFields"
      />
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Check, View, Plus, ArrowRight, Edit, User,
  Document, Collection, Ticket, Clock, Location, Star,
  Picture, Upload, EditPen, Grid, List, Link, Histogram
} from '@element-plus/icons-vue'
import { useFieldTemplateStore } from '../stores/fieldTemplateStore'
import { useFieldConfigStore } from '../stores/fieldConfigStore'
import { fieldTypeRegistry } from '../stores/fieldTypeRegistry'
import FieldDiffViewer from '../components/field-designer/FieldDiffViewer.vue'

const fieldTemplateStore = useFieldTemplateStore()
const fieldConfigStore = useFieldConfigStore()

// 状态
const selectedCustomerId = ref('')
const baseTemplateId = ref('')
const viewMode = ref('all')
const selectedField = ref(null)
const saving = ref(false)
const showAddFieldDialog = ref(false)
const showDiff = ref(false)

// 模拟客户数据
const customers = ref([
  { id: 'customer1', name: '客户A' },
  { id: 'customer2', name: '客户B' },
  { id: 'customer3', name: '客户C' }
])

// 客户定制配置
const customerConfig = ref({
  addFields: [],
  removeFields: [],
  modifyFields: {}
})

// 新字段
const newField = ref({
  type: 'text',
  name: '',
  code: '',
  config: {
    label: '',
    placeholder: '',
    required: false
  }
})

// 计算属性
const templates = computed(() => fieldTemplateStore.allTemplates)

const baseTemplate = computed(() => {
  return fieldTemplateStore.getTemplateById(baseTemplateId.value)
})

const baseFields = computed(() => {
  if (!baseTemplate.value) return []
  return fieldTemplateStore.getTemplateFields(baseTemplateId.value)
})

const customFields = computed(() => {
  return customerConfig.value.addFields
})

const removedFields = computed(() => {
  return customerConfig.value.removeFields
})

const modifiedFields = computed(() => {
  return Object.values(customerConfig.value.modifyFields)
})

const allFields = computed(() => {
  const fields = [...baseFields.value]
  
  // 应用修改
  fields.forEach((field, index) => {
    const modified = customerConfig.value.modifyFields[field.id]
    if (modified) {
      fields[index] = { ...field, ...modified }
    }
  })
  
  // 添加新增字段
  fields.push(...customerConfig.value.addFields)
  
  // 过滤已移除的字段
  const removedIds = new Set(customerConfig.value.removeFields.map(f => f.id))
  return fields.filter(f => !removedIds.has(f.id))
})

const filteredFields = computed(() => {
  switch (viewMode.value) {
    case 'modified':
      return allFields.value.filter(f => isFieldModified(f))
    case 'added':
      return allFields.value.filter(f => isFieldAdded(f))
    case 'removed':
      return customerConfig.value.removeFields
    default:
      return allFields.value
  }
})

const fieldCategories = computed(() => fieldTypeRegistry.getCategories())

// 方法
const getTypesByCategory = (category) => {
  return fieldTypeRegistry.getTypesByCategory(category)
}

const getFieldIcon = (type) => {
  const iconMap = {
    'text': Document,
    'textarea': Document,
    'number': Histogram,
    'select': Collection,
    'date': Clock,
    'datetime': Clock,
    'customerSelector': User,
    'engineerSelector': User,
    'assetSelector': Ticket,
    'partsSelector': Ticket,
    'location': Location,
    'signature': EditPen,
    'imageUpload': Picture,
    'fileUpload': Upload,
    'rate': Star,
    'table': Grid,
    'subForm': List,
    'computed': Histogram,
    'reference': Link
  }
  return iconMap[type] || Document
}

const handleCustomerChange = (customerId) => {
  // 加载客户配置
  const config = fieldTemplateStore.getCustomerConfig(customerId)
  if (config) {
    baseTemplateId.value = config.templateId
    customerConfig.value = {
      addFields: config.customizations?.addFields || [],
      removeFields: config.customizations?.removeFields || [],
      modifyFields: config.customizations?.modifyFields || {}
    }
  } else {
    baseTemplateId.value = ''
    customerConfig.value = {
      addFields: [],
      removeFields: [],
      modifyFields: {}
    }
  }
}

const handleTemplateChange = () => {
  // 清空之前的定制
  customerConfig.value = {
    addFields: [],
    removeFields: [],
    modifyFields: {}
  }
}

const isFieldModified = (field) => {
  return !!customerConfig.value.modifyFields[field.id]
}

const isFieldAdded = (field) => {
  return customerConfig.value.addFields.some(f => f.id === field.id)
}

const isFieldRemoved = (field) => {
  return customerConfig.value.removeFields.some(f => f.id === field.id)
}

const getFieldChanges = (field) => {
  const modified = customerConfig.value.modifyFields[field.id]
  if (!modified) return {}
  
  const changes = {}
  if (modified.name && modified.name !== field.name) {
    changes.name = {
      label: '名称',
      oldValue: field.name,
      newValue: modified.name
    }
  }
  if (modified.config?.label && modified.config.label !== field.config?.label) {
    changes.label = {
      label: '标签',
      oldValue: field.config?.label,
      newValue: modified.config.label
    }
  }
  if (modified.config?.required !== undefined && modified.config.required !== field.config?.required) {
    changes.required = {
      label: '必填',
      oldValue: field.config?.required ? '是' : '否',
      newValue: modified.config.required ? '是' : '否'
    }
  }
  return changes
}

const handleEditField = (field) => {
  selectedField.value = field
}

const handleRemoveField = (field) => {
  customerConfig.value.removeFields.push(field)
  ElMessage.success(`已移除字段: ${field.name}`)
}

const handleRestoreField = (field) => {
  const index = customerConfig.value.removeFields.findIndex(f => f.id === field.id)
  if (index >= 0) {
    customerConfig.value.removeFields.splice(index, 1)
    ElMessage.success(`已恢复字段: ${field.name}`)
  }
}

const handleRemoveAddedField = (field) => {
  const index = customerConfig.value.addFields.findIndex(f => f.id === field.id)
  if (index >= 0) {
    customerConfig.value.addFields.splice(index, 1)
    ElMessage.success(`已删除字段: ${field.name}`)
  }
}

const handleAddField = () => {
  const field = {
    id: `custom_${Date.now()}`,
    code: newField.value.code,
    name: newField.value.name,
    type: newField.value.type,
    category: fieldTypeRegistry.getType(newField.value.type)?.category,
    config: {
      label: newField.value.config.label,
      placeholder: '',
      required: false,
      colSpan: 24
    }
  }
  
  customerConfig.value.addFields.push(field)
  showAddFieldDialog.value = false
  
  // 重置表单
  newField.value = {
    type: 'text',
    name: '',
    code: '',
    config: {
      label: '',
      placeholder: '',
      required: false
    }
  }
  
  ElMessage.success('字段添加成功')
}

const handleSave = async () => {
  if (!selectedCustomerId.value || !baseTemplateId.value) {
    ElMessage.warning('请选择客户和基础模板')
    return
  }
  
  saving.value = true
  try {
    const config = {
      customerId: selectedCustomerId.value,
      templateId: baseTemplateId.value,
      customizations: {
        addFields: customerConfig.value.addFields,
        removeFields: customerConfig.value.removeFields.map(f => f.id),
        modifyFields: Object.entries(customerConfig.value.modifyFields).map(([id, changes]) => ({
          fieldId: id,
          changes
        }))
      }
    }
    
    await fieldTemplateStore.saveCustomerConfig(config)
    ElMessage.success('配置保存成功')
  } catch (error) {
    ElMessage.error(error.message || '保存失败')
  } finally {
    saving.value = false
  }
}

// 监听字段选择变化
watch(selectedField, (newVal) => {
  if (newVal && !isFieldAdded(newVal) && !isFieldRemoved(newVal)) {
    // 记录修改
    if (!customerConfig.value.modifyFields[newVal.id]) {
      customerConfig.value.modifyFields[newVal.id] = {}
    }
    Object.assign(customerConfig.value.modifyFields[newVal.id], newVal)
  }
}, { deep: true })
</script>

<style scoped>
.customer-field-config {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.header-left {
  display: flex;
  align-items: center;
}

.header-left h2 {
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.config-container {
  display: flex;
  gap: 20px;
  height: calc(100vh - 200px);
}

.template-section {
  width: 250px;
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.template-section h3 {
  margin: 0 0 16px 0;
  font-size: 16px;
  color: #303133;
}

.template-info {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #ebeef5;
}

.template-info p {
  margin: 8px 0;
  font-size: 13px;
  color: #606266;
}

.customization-section {
  flex: 1;
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  overflow-y: auto;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-header h3 {
  margin: 0;
  font-size: 16px;
  color: #303133;
}

.fields-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.field-item {
  border: 1px solid #ebeef5;
  border-radius: 6px;
  padding: 12px;
  transition: all 0.2s;
}

.field-item:hover {
  border-color: #409eff;
}

.field-item.is-modified {
  border-color: #e6a23c;
  background: #fdf6ec;
}

.field-item.is-added {
  border-color: #67c23a;
  background: #f0f9eb;
}

.field-item.is-removed {
  border-color: #f56c6c;
  background: #fef0f0;
  opacity: 0.7;
}

.field-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.field-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.field-name {
  font-weight: 500;
  color: #303133;
}

.field-actions {
  display: flex;
  gap: 8px;
}

.field-changes {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px dashed #ebeef5;
}

.change-item {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 4px 0;
  font-size: 13px;
}

.change-key {
  color: #909399;
}

.change-old {
  color: #f56c6c;
  text-decoration: line-through;
}

.change-new {
  color: #67c23a;
  font-weight: 500;
}

.add-field-btn {
  margin-top: 16px;
  width: 100%;
}

.detail-section {
  width: 300px;
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  overflow-y: auto;
}

.detail-section h3 {
  margin: 0 0 16px 0;
  font-size: 16px;
  color: #303133;
}

.empty-detail {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 300px;
  color: #909399;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 400px;
  color: #909399;
}
</style>
