<template>
  <div class="field-config-manager">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2>字段配置管理</h2>
      <div class="header-actions">
        <el-button @click="showImportDialog = true">
          <el-icon><Upload /></el-icon>
          导入
        </el-button>
        <el-button @click="handleExport">
          <el-icon><Download /></el-icon>
          导出
        </el-button>
        <el-button type="primary" @click="handleCreateField">
          <el-icon><Plus /></el-icon>
          新建字段
        </el-button>
      </div>
    </div>

    <!-- 搜索和筛选 -->
    <div class="filter-bar">
      <el-input
        v-model="searchKeyword"
        placeholder="搜索字段名称/编码"
        clearable
        style="width: 250px"
        @input="handleSearch"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
      
      <el-select
        v-model="filterCategory"
        placeholder="字段分类"
        clearable
        style="width: 150px; margin-left: 12px"
        @change="handleFilterChange"
      >
        <el-option
          v-for="cat in categories"
          :key="cat.code"
          :label="cat.name"
          :value="cat.code"
        />
      </el-select>

      <el-select
        v-model="filterType"
        placeholder="字段类型"
        clearable
        style="width: 150px; margin-left: 12px"
        @change="handleFilterChange"
      >
        <el-option-group
          v-for="cat in categories"
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
    </div>

    <!-- 字段列表 -->
    <el-table
      :data="filteredFields"
      v-loading="fieldConfigStore.loading"
      style="width: 100%; margin-top: 20px"
      row-key="id"
    >
      <el-table-column type="selection" width="55" />
      
      <el-table-column label="字段名称" min-width="150">
        <template #default="{ row }">
          <div class="field-name-cell">
            <el-icon :size="18" class="field-icon">
              <component :is="getFieldTypeIcon(row.type)" />
            </el-icon>
            <div class="field-info">
              <span class="field-name">{{ row.name }}</span>
              <span class="field-code">{{ row.code }}</span>
            </div>
          </div>
        </template>
      </el-table-column>

      <el-table-column label="类型" width="120">
        <template #default="{ row }">
          <el-tag size="small" :type="getCategoryTagType(row.category)">
            {{ getFieldTypeName(row.type) }}
          </el-tag>
        </template>
      </el-table-column>

      <el-table-column label="分类" width="100">
        <template #default="{ row }">
          {{ getCategoryName(row.category) }}
        </template>
      </el-table-column>

      <el-table-column label="必填" width="80" align="center">
        <template #default="{ row }">
          <el-checkbox :model-value="row.config?.required" disabled />
        </template>
      </el-table-column>

      <el-table-column label="说明" min-width="200" show-overflow-tooltip>
        <template #default="{ row }">
          {{ row.description || '-' }}
        </template>
      </el-table-column>

      <el-table-column label="更新时间" width="160">
        <template #default="{ row }">
          {{ formatDate(row.metadata?.updateTime) }}
        </template>
      </el-table-column>

      <el-table-column label="操作" width="180" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link size="small" @click="handleEditField(row)">
            编辑
          </el-button>
          <el-button type="primary" link size="small" @click="handleCloneField(row)">
            复制
          </el-button>
          <el-button type="danger" link size="small" @click="handleDeleteField(row)">
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 字段编辑对话框 -->
    <el-dialog
      v-model="editDialog.visible"
      :title="editDialog.isEdit ? '编辑字段' : '新建字段'"
      width="800px"
      destroy-on-close
    >
      <el-form
        ref="fieldFormRef"
        :model="editDialog.form"
        :rules="fieldRules"
        label-width="100px"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="字段编码" prop="code">
              <el-input
                v-model="editDialog.form.code"
                placeholder="请输入字段编码"
                :disabled="editDialog.isEdit"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="字段名称" prop="name">
              <el-input v-model="editDialog.form.name" placeholder="请输入字段名称" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="字段类型" prop="type">
              <el-select
                v-model="editDialog.form.type"
                placeholder="选择字段类型"
                style="width: 100%"
                :disabled="editDialog.isEdit"
                @change="handleTypeChange"
              >
                <el-option-group
                  v-for="cat in categories"
                  :key="cat.code"
                  :label="cat.name"
                >
                  <el-option
                    v-for="type in getTypesByCategory(cat.code)"
                    :key="type.code"
                    :label="type.name"
                    :value="type.code"
                  >
                    <el-icon style="margin-right: 8px">
                      <component :is="type.icon" />
                    </el-icon>
                    {{ type.name }}
                  </el-option>
                </el-option-group>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="显示标签">
              <el-input v-model="editDialog.form.config.label" placeholder="表单中显示的标签" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="字段说明">
          <el-input
            v-model="editDialog.form.description"
            type="textarea"
            :rows="2"
            placeholder="字段的详细说明"
          />
        </el-form-item>

        <el-divider>基础配置</el-divider>

        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item>
              <el-checkbox v-model="editDialog.form.config.required">必填</el-checkbox>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item>
              <el-checkbox v-model="editDialog.form.config.disabled">禁用</el-checkbox>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item>
              <el-checkbox v-model="editDialog.form.config.hidden">隐藏</el-checkbox>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="占位提示">
          <el-input v-model="editDialog.form.config.placeholder" placeholder="输入框的占位提示文字" />
        </el-form-item>

        <el-form-item label="默认值">
          <el-input v-model="editDialog.form.config.defaultValue" placeholder="字段的默认值" />
        </el-form-item>

        <!-- 类型特定配置 -->
        <template v-if="editDialog.form.type === 'text' || editDialog.form.type === 'textarea'">
          <el-form-item label="最大长度">
            <el-input-number v-model="editDialog.form.config.maxLength" :min="1" :max="5000" />
          </el-form-item>
        </template>

        <template v-if="editDialog.form.type === 'number'">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="最小值">
                <el-input-number v-model="editDialog.form.config.min" style="width: 100%" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="最大值">
                <el-input-number v-model="editDialog.form.config.max" style="width: 100%" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="精度">
                <el-input-number v-model="editDialog.form.config.precision" :min="0" :max="10" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="步长">
                <el-input-number v-model="editDialog.form.config.step" :min="0.01" />
              </el-form-item>
            </el-col>
          </el-row>
        </template>

        <template v-if="editDialog.form.type === 'select' || editDialog.form.type === 'multiSelect'">
          <el-form-item label="选项配置">
            <div class="options-config">
              <div
                v-for="(option, index) in editDialog.form.dataSource?.options || []"
                :key="index"
                class="option-item"
              >
                <el-input v-model="option.label" placeholder="显示文本" style="width: 150px" />
                <el-input v-model="option.value" placeholder="值" style="width: 120px; margin: 0 8px" />
                <el-button type="danger" circle size="small" @click="removeOption(index)">
                  <el-icon><Delete /></el-icon>
                </el-button>
              </div>
              <el-button type="primary" plain size="small" @click="addOption">
                <el-icon><Plus /></el-icon>
                添加选项
              </el-button>
            </div>
          </el-form-item>
        </template>

        <el-divider>验证规则</el-divider>

        <div class="validation-rules">
          <div
            v-for="(rule, index) in editDialog.form.validation"
            :key="index"
            class="rule-item"
          >
            <el-select v-model="rule.type" placeholder="规则类型" style="width: 120px">
              <el-option label="必填" value="required" />
              <el-option label="最小长度" value="minLength" />
              <el-option label="最大长度" value="maxLength" />
              <el-option label="正则匹配" value="pattern" />
              <el-option label="自定义" value="custom" />
            </el-select>
            <el-input
              v-if="rule.type !== 'required'"
              v-model="rule.value"
              placeholder="规则值"
              style="width: 150px; margin: 0 8px"
            />
            <el-input
              v-model="rule.message"
              placeholder="错误提示"
              style="width: 200px; margin-right: 8px"
            />
            <el-button type="danger" circle size="small" @click="removeValidationRule(index)">
              <el-icon><Delete /></el-icon>
            </el-button>
          </div>
          <el-button type="primary" plain size="small" @click="addValidationRule">
            <el-icon><Plus /></el-icon>
            添加验证规则
          </el-button>
        </div>
      </el-form>

      <template #footer>
        <el-button @click="editDialog.visible = false">取消</el-button>
        <el-button type="primary" @click="saveField" :loading="saving">
          保存
        </el-button>
      </template>
    </el-dialog>

    <!-- 导入对话框 -->
    <el-dialog
      v-model="showImportDialog"
      title="导入字段配置"
      width="600px"
    >
      <el-upload
        drag
        action="#"
        :auto-upload="false"
        :on-change="handleFileChange"
        accept=".json"
      >
        <el-icon class="el-icon--upload"><Upload /></el-icon>
        <div class="el-upload__text">
          拖拽文件到此处或 <em>点击上传</em>
        </div>
        <template #tip>
          <div class="el-upload__tip">
            请上传 JSON 格式的字段配置文件
          </div>
        </template>
      </el-upload>

      <el-input
        v-model="importJson"
        type="textarea"
        :rows="10"
        placeholder="或直接粘贴 JSON 配置"
        style="margin-top: 20px"
      />

      <template #footer>
        <el-button @click="showImportDialog = false">取消</el-button>
        <el-button type="primary" @click="handleImport" :disabled="!importJson">
          导入
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Plus, Search, Upload, Download, Delete,
  Document, DocumentCopy, Sort, Lock, ArrowDown, CircleCheck,
  Select, SwitchButton, Calendar, Clock, Timer,
  User, UserFilled, Box, Goods, Location, EditPen,
  Picture, UploadFilled, Star, FullScreen, Edit, Grid,
  List, Link, Connection
} from '@element-plus/icons-vue'

// 图标映射表
const iconMap = {
  Document,
  DocumentCopy,
  Sort,
  Lock,
  ArrowDown,
  CircleCheck,
  Select,
  SwitchButton,
  Calendar,
  Clock,
  Timer,
  User,
  UserFilled,
  Box,
  Goods,
  Location,
  EditPen,
  Picture,
  Upload: UploadFilled,
  Star,
  FullScreen,
  Edit,
  Grid,
  List,
  Link,
  Connection
}
import { useFieldConfigStore } from '../stores/fieldConfigStore'
import { fieldTypeRegistry } from '../stores/fieldTypeRegistry'

// Store
const fieldConfigStore = useFieldConfigStore()

// 状态
const searchKeyword = ref('')
const filterCategory = ref('')
const filterType = ref('')
const saving = ref(false)
const showImportDialog = ref(false)
const importJson = ref('')
const fieldFormRef = ref(null)

// 编辑对话框状态
const editDialog = reactive({
  visible: false,
  isEdit: false,
  form: {
    code: '',
    name: '',
    type: '',
    category: '',
    description: '',
    config: {
      label: '',
      placeholder: '',
      defaultValue: '',
      required: false,
      disabled: false,
      hidden: false
    },
    dataSource: {
      type: 'static',
      options: []
    },
    validation: []
  }
})

// 表单验证规则
const fieldRules = {
  code: [
    { required: true, message: '请输入字段编码', trigger: 'blur' },
    { pattern: /^[a-zA-Z][a-zA-Z0-9_]*$/, message: '编码必须以字母开头，只能包含字母、数字和下划线', trigger: 'blur' }
  ],
  name: [
    { required: true, message: '请输入字段名称', trigger: 'blur' }
  ],
  type: [
    { required: true, message: '请选择字段类型', trigger: 'change' }
  ]
}

// 计算属性
const categories = computed(() => fieldConfigStore.getFieldCategories())

const filteredFields = computed(() => {
  // 从 store 获取字段定义数组
  let fields = fieldConfigStore.fieldDefinitions || []
  
  if (!Array.isArray(fields)) {
    console.warn('fieldConfigStore.fieldDefinitions is not an array:', fields)
    return []
  }

  // 关键词搜索
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    fields = fields.filter(f => 
      f.name?.toLowerCase().includes(keyword) ||
      f.code?.toLowerCase().includes(keyword) ||
      f.description?.toLowerCase().includes(keyword)
    )
  }

  // 分类筛选
  if (filterCategory.value && Array.isArray(fields)) {
    fields = fields.filter(f => f.category === filterCategory.value)
  }

  // 类型筛选
  if (filterType.value && Array.isArray(fields)) {
    fields = fields.filter(f => f.type === filterType.value)
  }

  return fields
})

// 方法
const getTypesByCategory = (category) => {
  return fieldTypeRegistry.getTypesByCategory(category)
}

const getFieldTypeName = (typeCode) => {
  const type = fieldTypeRegistry.getType(typeCode)
  return type?.name || typeCode
}

const getFieldTypeIcon = (typeCode) => {
  const type = fieldTypeRegistry.getType(typeCode)
  const iconName = type?.icon || 'Document'
  return iconMap[iconName] || Document
}

const getCategoryName = (categoryCode) => {
  const cat = categories.value.find(c => c.code === categoryCode)
  return cat?.name || categoryCode
}

const getCategoryTagType = (categoryCode) => {
  const typeMap = {
    'basic': 'primary',
    'select': 'success',
    'business': 'warning',
    'advanced': 'danger'
  }
  return typeMap[categoryCode] || 'info'
}

const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN')
}

const handleSearch = () => {
  // 搜索逻辑已在计算属性中处理
}

const handleFilterChange = () => {
  // 筛选逻辑已在计算属性中处理
}

const handleCreateField = () => {
  editDialog.isEdit = false
  editDialog.form = {
    code: '',
    name: '',
    type: '',
    category: '',
    description: '',
    config: {
      label: '',
      placeholder: '',
      defaultValue: '',
      required: false,
      disabled: false,
      hidden: false
    },
    dataSource: {
      type: 'static',
      options: []
    },
    validation: []
  }
  editDialog.visible = true
}

const handleEditField = (field) => {
  editDialog.isEdit = true
  editDialog.form = JSON.parse(JSON.stringify(field))
  editDialog.visible = true
}

const handleCloneField = (field) => {
  const clonedField = JSON.parse(JSON.stringify(field))
  clonedField.id = undefined
  clonedField.code = `${field.code}_copy`
  clonedField.name = `${field.name} (复制)`
  
  editDialog.isEdit = false
  editDialog.form = clonedField
  editDialog.visible = true
}

const handleDeleteField = async (field) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除字段 "${field.name}" 吗？`,
      '确认删除',
      { type: 'warning' }
    )
    await fieldConfigStore.deleteFieldDefinition(field.id)
    ElMessage.success('字段删除成功')
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '删除失败')
    }
  }
}

const handleTypeChange = (typeCode) => {
  const type = fieldTypeRegistry.getType(typeCode)
  if (type) {
    editDialog.form.category = type.category
    editDialog.form.config = {
      ...editDialog.form.config,
      ...fieldTypeRegistry.getDefaultConfig(typeCode)
    }
  }
}

const addOption = () => {
  if (!editDialog.form.dataSource) {
    editDialog.form.dataSource = { type: 'static', options: [] }
  }
  if (!editDialog.form.dataSource.options) {
    editDialog.form.dataSource.options = []
  }
  editDialog.form.dataSource.options.push({ label: '', value: '' })
}

const removeOption = (index) => {
  editDialog.form.dataSource?.options?.splice(index, 1)
}

const addValidationRule = () => {
  editDialog.form.validation.push({
    type: 'required',
    message: ''
  })
}

const removeValidationRule = (index) => {
  editDialog.form.validation.splice(index, 1)
}

const saveField = async () => {
  const valid = await fieldFormRef.value?.validate()
  if (!valid) return

  saving.value = true
  try {
    // 验证编码唯一性
    if (!editDialog.isEdit) {
      const isUnique = fieldConfigStore.validateFieldCode(editDialog.form.code)
      if (!isUnique) {
        ElMessage.error('字段编码已存在')
        return
      }
    }

    await fieldConfigStore.saveFieldDefinition(editDialog.form)
    ElMessage.success(editDialog.isEdit ? '字段更新成功' : '字段创建成功')
    editDialog.visible = false
  } catch (error) {
    ElMessage.error(error.message || '保存失败')
  } finally {
    saving.value = false
  }
}

const handleExport = () => {
  const config = fieldConfigStore.exportFieldConfig()
  const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `field-config-${new Date().toISOString().split('T')[0]}.json`
  link.click()
  URL.revokeObjectURL(url)
  ElMessage.success('导出成功')
}

const handleFileChange = (file) => {
  const reader = new FileReader()
  reader.onload = (e) => {
    importJson.value = e.target.result
  }
  reader.readAsText(file.raw)
}

const handleImport = () => {
  try {
    const config = JSON.parse(importJson.value)
    fieldConfigStore.importFieldConfig(config)
    ElMessage.success('导入成功')
    showImportDialog.value = false
    importJson.value = ''
  } catch (error) {
    ElMessage.error('JSON 格式错误')
  }
}

onMounted(() => {
  fieldConfigStore.loadFieldDefinitions()
})
</script>

<style scoped>
.field-config-manager {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-header h2 {
  margin: 0;
  color: #303133;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.filter-bar {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
}

.field-name-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.field-icon {
  color: #409EFF;
}

.field-info {
  display: flex;
  flex-direction: column;
}

.field-name {
  font-weight: 500;
  color: #303133;
}

.field-code {
  font-size: 12px;
  color: #909399;
}

.options-config {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.option-item {
  display: flex;
  align-items: center;
}

.validation-rules {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.rule-item {
  display: flex;
  align-items: center;
}
</style>
