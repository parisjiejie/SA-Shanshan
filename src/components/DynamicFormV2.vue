<template>
  <div class="dynamic-form-v2">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      :label-position="layout.labelPosition || 'top'"
      class="dynamic-form-content"
      :class="`layout-${layout.type || 'grid'}`"
    >
      <div
        v-for="field in processedFields"
        :key="field.id"
        class="form-field-wrapper"
        :style="getFieldStyle(field)"
        :class="{
          'is-hidden': fieldVisibility[field.code] === false,
          'is-disabled': fieldDisabled[field.code] === true
        }"
      >
        <el-form-item
          :label="field.config?.label || field.name"
          :prop="field.code"
          :required="field.config?.required"
        >
          <!-- 使用 FormFieldRenderer 渲染字段 -->
          <form-field-renderer
            :field="field"
            :value="formData[field.code]"
            :options="fieldOptions[field.code]"
            :mode="readonly ? 'preview' : 'design'"
            @update:value="handleFieldValueChange(field, $event)"
          />
          
          <!-- 字段说明 -->
          <div v-if="field.description" class="field-description">
            {{ field.description }}
          </div>
        </el-form-item>
      </div>
    </el-form>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useFieldTemplateStore } from '../stores/fieldTemplateStore'
import { linkageEngine } from '../utils/linkageEngine'
import FormFieldRenderer from './field-designer/FormFieldRenderer.vue'

const props = defineProps({
  // 模板ID
  templateId: {
    type: String,
    default: ''
  },
  // 客户ID（用于加载客户定制配置）
  customerId: {
    type: String,
    default: ''
  },
  // 流程节点编码
  nodeCode: {
    type: String,
    default: ''
  },
  // 用户角色
  userRole: {
    type: String,
    default: ''
  },
  // 初始数据
  modelValue: {
    type: Object,
    default: () => ({})
  },
  // 是否只读
  readonly: {
    type: Boolean,
    default: false
  },
  // 布局配置
  layout: {
    type: Object,
    default: () => ({
      type: 'grid',
      columns: 24,
      gutter: 16,
      labelPosition: 'top'
    })
  }
})

const emit = defineEmits(['update:modelValue', 'change', 'validate'])

const fieldTemplateStore = useFieldTemplateStore()

// 状态
const formRef = ref(null)
const formData = ref({})
const fieldVisibility = ref({})
const fieldDisabled = ref({})
const fieldOptions = ref({})
const templateFields = ref([])

// 计算处理后的字段列表
const processedFields = computed(() => {
  return templateFields.value.filter(field => {
    // 检查字段可见性
    if (fieldVisibility.value[field.code] === false) return false
    if (field.config?.hidden) return false
    return true
  })
})

// 计算表单验证规则
const formRules = computed(() => {
  const rules = {}
  processedFields.value.forEach(field => {
    if (field.config?.required && fieldDisabled.value[field.code] !== true) {
      rules[field.code] = [
        { 
          required: true, 
          message: `请输入${field.config?.label || field.name}`, 
          trigger: 'blur' 
        }
      ]
    }
    
    // 添加自定义验证规则
    if (field.validation && field.validation.length > 0) {
      rules[field.code] = rules[field.code] || []
      field.validation.forEach(rule => {
        if (rule.type === 'minLength') {
          rules[field.code].push({
            min: parseInt(rule.value),
            message: rule.message || `长度不能少于${rule.value}个字符`,
            trigger: 'blur'
          })
        } else if (rule.type === 'maxLength') {
          rules[field.code].push({
            max: parseInt(rule.value),
            message: rule.message || `长度不能超过${rule.value}个字符`,
            trigger: 'blur'
          })
        } else if (rule.type === 'pattern') {
          rules[field.code].push({
            pattern: new RegExp(rule.value),
            message: rule.message || '格式不正确',
            trigger: 'blur'
          })
        }
      })
    }
  })
  return rules
})

// 获取字段样式
const getFieldStyle = (field) => {
  const colSpan = field.config?.colSpan || 24
  const percentage = (colSpan / (props.layout.columns || 24)) * 100
  
  return {
    width: `calc(${percentage}% - ${props.layout.gutter || 16}px)`,
    margin: `0 ${(props.layout.gutter || 16) / 2}px ${props.layout.gutter || 16}px`
  }
}

// 加载模板字段
const loadTemplateFields = async () => {
  if (!props.templateId) return
  
  try {
    const fields = fieldTemplateStore.getTemplateFields(
      props.templateId,
      props.nodeCode,
      props.customerId
    )
    
    templateFields.value = fields
    
    // 初始化字段状态
    fields.forEach(field => {
      fieldVisibility.value[field.code] = true
      fieldDisabled.value[field.code] = props.readonly || field.config?.disabled
      
      // 初始化选项
      if (field.dataSource?.type === 'static') {
        fieldOptions.value[field.code] = field.dataSource.options || []
      }
    })
    
    // 初始化表单数据
    initFormData()
    
    // 设置联动规则
    setupLinkageRules()
  } catch (error) {
    console.error('Failed to load template fields:', error)
  }
}

// 初始化表单数据
const initFormData = () => {
  const data = { ...props.modelValue }
  
  templateFields.value.forEach(field => {
    if (!(field.code in data)) {
      // 根据类型设置默认值
      const defaultValue = field.config?.defaultValue
      if (defaultValue !== undefined) {
        data[field.code] = defaultValue
      } else {
        switch (field.type) {
          case 'number':
          case 'rate':
            data[field.code] = 0
            break
          case 'select':
          case 'radio':
            data[field.code] = ''
            break
          case 'multiSelect':
          case 'checkbox':
            data[field.code] = []
            break
          case 'switch':
            data[field.code] = false
            break
          case 'imageUpload':
          case 'fileUpload':
          case 'partsSelector':
            data[field.code] = []
            break
          case 'table':
            data[field.code] = []
            break
          default:
            data[field.code] = ''
        }
      }
    }
  })
  
  formData.value = data
  
  // 设置联动引擎上下文
  linkageEngine.setContext(data)
}

// 设置联动规则
const setupLinkageRules = () => {
  // 清除现有规则
  linkageEngine.clearRules()
  
  // 从字段配置中提取联动规则
  templateFields.value.forEach(field => {
    if (field.linkageRules && field.linkageRules.length > 0) {
      field.linkageRules.forEach(rule => {
        linkageEngine.addRule({
          trigger: field.code,
          condition: rule.condition,
          action: rule.action,
          priority: rule.priority || 0
        })
      })
    }
  })
  
  // 监听联动事件
  linkageEngine.on('valueChange', handleLinkageValueChange)
  linkageEngine.on('fieldVisibility', handleLinkageVisibility)
  linkageEngine.on('fieldDisabled', handleLinkageDisabled)
  linkageEngine.on('fieldOptions', handleLinkageOptions)
}

// 处理联动值变化
const handleLinkageValueChange = ({ fieldName, value }) => {
  formData.value[fieldName] = value
  emit('change', fieldName, value, formData.value)
}

// 处理联动可见性
const handleLinkageVisibility = ({ fieldName, visible }) => {
  fieldVisibility.value[fieldName] = visible
}

// 处理联动禁用状态
const handleLinkageDisabled = ({ fieldName, disabled }) => {
  fieldDisabled.value[fieldName] = disabled
}

// 处理联动选项
const handleLinkageOptions = ({ fieldName, options }) => {
  fieldOptions.value[fieldName] = options
}

// 处理字段值变化
const handleFieldValueChange = (field, value) => {
  formData.value[field.code] = value
  
  // 触发联动规则
  linkageEngine.setValue(field.code, value)
  
  emit('change', field.code, value, formData.value)
}

// 表单验证
const validate = async () => {
  return formRef.value?.validate()
}

// 获取表单数据
const getFormData = () => {
  return { ...formData.value }
}

// 重置表单
const resetForm = () => {
  formRef.value?.resetFields()
  initFormData()
}

// 监听属性变化
watch(() => props.templateId, loadTemplateFields, { immediate: true })
watch(() => props.customerId, loadTemplateFields)
watch(() => props.nodeCode, loadTemplateFields)

// 监听外部数据变化
watch(() => props.modelValue, (newVal) => {
  if (newVal && Object.keys(newVal).length > 0) {
    formData.value = { ...formData.value, ...newVal }
  }
}, { deep: true })

// 监听表单数据变化
watch(formData, (newVal) => {
  emit('update:modelValue', newVal)
}, { deep: true })

// 组件卸载时清理
onUnmounted(() => {
  linkageEngine.off('valueChange', handleLinkageValueChange)
  linkageEngine.off('fieldVisibility', handleLinkageVisibility)
  linkageEngine.off('fieldDisabled', handleLinkageDisabled)
  linkageEngine.off('fieldOptions', handleLinkageOptions)
})

// 暴露方法
defineExpose({
  validate,
  getFormData,
  resetForm
})
</script>

<style scoped>
.dynamic-form-v2 {
  width: 100%;
}

.dynamic-form-content {
  display: flex;
  flex-wrap: wrap;
  margin: 0 -8px;
}

.form-field-wrapper {
  margin-bottom: 16px;
}

.form-field-wrapper.is-hidden {
  display: none;
}

.form-field-wrapper.is-disabled {
  opacity: 0.6;
  pointer-events: none;
}

.field-description {
  margin-top: 4px;
  font-size: 12px;
  color: #909399;
}

/* 布局样式 */
.layout-grid {
  display: flex;
  flex-wrap: wrap;
}

.layout-list {
  flex-direction: column;
}

.layout-list .form-field-wrapper {
  width: 100% !important;
}
</style>
