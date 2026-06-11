<template>
  <div class="dynamic-form">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="120px"
      class="dynamic-form-content"
    >
      <template v-for="field in visibleFields" :key="field.name">
        <!-- 文本输入 -->
        <el-form-item
          v-if="field.type === 'text'"
          :label="field.label"
          :prop="field.name"
        >
          <el-input
            v-model="formData[field.name]"
            :placeholder="field.placeholder"
            :disabled="isFieldDisabled(field)"
          />
        </el-form-item>

        <!-- 文本域 -->
        <el-form-item
          v-else-if="field.type === 'textarea'"
          :label="field.label"
          :prop="field.name"
        >
          <el-input
            v-model="formData[field.name]"
            type="textarea"
            :rows="field.rows || 3"
            :placeholder="field.placeholder"
            :disabled="isFieldDisabled(field)"
          />
        </el-form-item>

        <!-- 数字输入 -->
        <el-form-item
          v-else-if="field.type === 'number'"
          :label="field.label"
          :prop="field.name"
        >
          <el-input-number
            v-model="formData[field.name]"
            :min="field.min"
            :max="field.max"
            :precision="field.precision"
            :step="field.step"
            :disabled="isFieldDisabled(field)"
            style="width: 100%"
          />
        </el-form-item>

        <!-- 下拉选择 -->
        <el-form-item
          v-else-if="field.type === 'select'"
          :label="field.label"
          :prop="field.name"
        >
          <el-select
            v-model="formData[field.name]"
            :placeholder="field.placeholder"
            :disabled="isFieldDisabled(field)"
            style="width: 100%"
            @change="handleFieldChange(field, $event)"
          >
            <el-option
              v-for="option in getFieldOptions(field)"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
        </el-form-item>

        <!-- 日期选择 -->
        <el-form-item
          v-else-if="field.type === 'date'"
          :label="field.label"
          :prop="field.name"
        >
          <el-date-picker
            v-model="formData[field.name]"
            type="date"
            :placeholder="field.placeholder || '选择日期'"
            :disabled="isFieldDisabled(field)"
            style="width: 100%"
          />
        </el-form-item>

        <!-- 日期时间选择 -->
        <el-form-item
          v-else-if="field.type === 'datetime'"
          :label="field.label"
          :prop="field.name"
        >
          <el-date-picker
            v-model="formData[field.name]"
            type="datetime"
            :placeholder="field.placeholder || '选择日期时间'"
            :disabled="isFieldDisabled(field)"
            style="width: 100%"
          />
        </el-form-item>

        <!-- 评分 -->
        <el-form-item
          v-else-if="field.type === 'rate'"
          :label="field.label"
          :prop="field.name"
        >
          <el-rate
            v-model="formData[field.name]"
            :max="field.max || 5"
            :disabled="isFieldDisabled(field)"
          />
        </el-form-item>

        <!-- 位置选择 -->
        <el-form-item
          v-else-if="field.type === 'location'"
          :label="field.label"
          :prop="field.name"
        >
          <el-input
            v-model="formData[field.name]"
            :placeholder="field.placeholder || '请输入位置'"
            :disabled="isFieldDisabled(field)"
          >
            <template #append>
              <el-button @click="handleGetLocation(field)">
                <el-icon><Location /></el-icon>
                定位
              </el-button>
            </template>
          </el-input>
        </el-form-item>

        <!-- 图片上传 -->
        <el-form-item
          v-else-if="field.type === 'imageUpload'"
          :label="field.label"
          :prop="field.name"
        >
          <el-upload
            v-model:file-list="formData[field.name]"
            action="#"
            list-type="picture-card"
            :auto-upload="false"
            :multiple="field.multiple"
            :limit="field.maxCount"
            :disabled="isFieldDisabled(field)"
            :on-change="(file, fileList) => handleFileChange(field, fileList)"
          >
            <el-icon><Plus /></el-icon>
          </el-upload>
        </el-form-item>

        <!-- 电子签名 -->
        <el-form-item
          v-else-if="field.type === 'signature'"
          :label="field.label"
          :prop="field.name"
        >
          <div class="signature-container">
            <canvas
              ref="signatureCanvas"
              class="signature-canvas"
              @mousedown="startSignature"
              @mousemove="drawSignature"
              @mouseup="endSignature"
              @mouseleave="endSignature"
            ></canvas>
            <div class="signature-actions">
              <el-button size="small" @click="clearSignature">清除</el-button>
              <el-button size="small" type="primary" @click="saveSignature">确认</el-button>
            </div>
          </div>
        </el-form-item>

        <!-- 配件选择器 -->
        <el-form-item
          v-else-if="field.type === 'partsSelector'"
          :label="field.label"
          :prop="field.name"
        >
          <div class="parts-selector">
            <div
              v-for="(part, index) in formData[field.name] || []"
              :key="index"
              class="part-item"
            >
              <el-input v-model="part.name" placeholder="配件名称" style="width: 150px" />
              <el-input v-model="part.model" placeholder="型号" style="width: 120px; margin: 0 8px" />
              <el-input-number v-model="part.quantity" :min="1" style="width: 100px" />
              <el-button type="danger" circle @click="removePart(field.name, index)">
                <el-icon><Delete /></el-icon>
              </el-button>
            </div>
            <el-button type="primary" plain @click="addPart(field.name)">
              <el-icon><Plus /></el-icon>
              添加配件
            </el-button>
          </div>
        </el-form-item>

        <!-- 巡检项目 -->
        <el-form-item
          v-else-if="field.type === 'inspectionItems'"
          :label="field.label"
          :prop="field.name"
        >
          <div class="inspection-items">
            <div
              v-for="(item, index) in inspectionItemList"
              :key="index"
              class="inspection-item"
            >
              <span class="item-name">{{ item.name }}</span>
              <el-radio-group v-model="formData[field.name][item.code]">
                <el-radio label="normal">正常</el-radio>
                <el-radio label="abnormal">异常</el-radio>
                <el-radio label="na">不适用</el-radio>
              </el-radio-group>
            </div>
          </div>
        </el-form-item>
      </template>
    </el-form>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { Location, Plus, Delete } from '@element-plus/icons-vue'

const props = defineProps({
  // 字段配置列表
  fields: {
    type: Array,
    default: () => []
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
  // 用户角色
  userRole: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:modelValue', 'change', 'location'])

const formRef = ref(null)
const formData = ref({})
const isDrawing = ref(false)
const signatureCanvas = ref(null)

// 巡检项目模板
const inspectionItemList = ref([
  { code: 'appearance', name: '外观检查' },
  { code: 'power', name: '电源检查' },
  { code: 'function', name: '功能检查' },
  { code: 'safety', name: '安全检查' },
  { code: 'cleanliness', name: '清洁度' }
])

// 计算可见字段
const visibleFields = computed(() => {
  return props.fields.filter(field => {
    // 检查条件显示
    if (field.visible === false) return false
    if (typeof field.visible === 'string') {
      // 支持条件表达式，如 "{{workorder.type === '维修'}}"
      return evaluateCondition(field.visible)
    }
    return true
  })
})

// 计算表单验证规则
const formRules = computed(() => {
  const rules = {}
  visibleFields.value.forEach(field => {
    if (field.required) {
      rules[field.name] = [
        { required: true, message: `请输入${field.label}`, trigger: 'blur' }
      ]
    }
  })
  return rules
})

// 初始化表单数据
const initFormData = () => {
  const data = {}
  props.fields.forEach(field => {
    if (props.modelValue[field.name] !== undefined) {
      data[field.name] = props.modelValue[field.name]
    } else if (field.defaultValue !== undefined) {
      data[field.name] = field.defaultValue
    } else {
      // 根据类型设置默认值
      switch (field.type) {
        case 'number':
          data[field.name] = 0
          break
        case 'select':
          data[field.name] = field.multiple ? [] : ''
          break
        case 'imageUpload':
        case 'partsSelector':
          data[field.name] = []
          break
        case 'inspectionItems':
          data[field.name] = {}
          break
        case 'rate':
          data[field.name] = 0
          break
        default:
          data[field.name] = ''
      }
    }
  })
  formData.value = data
}

// 检查字段是否禁用
const isFieldDisabled = (field) => {
  if (props.readonly) return true
  if (field.editable === false) return true
  if (typeof field.editable === 'string') {
    return !evaluateCondition(field.editable)
  }
  return false
}

// 获取字段选项
const getFieldOptions = (field) => {
  if (field.options) return field.options
  if (field.dataSource === 'engineers') {
    // 从外部获取工程师列表
    return [
      { label: '王工程师', value: '王工程师' },
      { label: '李工程师', value: '李工程师' },
      { label: '张工程师', value: '张工程师' }
    ]
  }
  return []
}

// 评估条件表达式
const evaluateCondition = (condition) => {
  // 简单的条件评估，支持 {{variable}} 语法
  if (typeof condition !== 'string') return true
  
  try {
    // 替换变量
    let expr = condition.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return JSON.stringify(formData.value[key] || '')
    })
    
    // 安全评估
    return new Function('return ' + expr)()
  } catch (e) {
    console.warn('Condition evaluation error:', e)
    return true
  }
}

// 处理字段变化
const handleFieldChange = (field, value) => {
  // 处理联动规则
  if (field.rules) {
    field.rules.forEach(rule => {
      if (rule.trigger === 'change') {
        applyRule(rule, value)
      }
    })
  }
  
  emit('change', field.name, value, formData.value)
}

// 应用联动规则
const applyRule = (rule, value) => {
  if (rule.action === 'setValue') {
    const condition = rule.condition.replace(/\{\{value\}\}/g, JSON.stringify(value))
    if (evaluateCondition(condition)) {
      let targetValue = rule.value
      if (typeof targetValue === 'string') {
        targetValue = targetValue.replace(/\{\{now\s*\+\s*(\d+)h\}\}/g, (match, hours) => {
          const date = new Date()
          date.setHours(date.getHours() + parseInt(hours))
          return date.toISOString()
        })
      }
      formData.value[rule.target] = targetValue
    }
  }
}

// 处理获取位置
const handleGetLocation = (field) => {
  emit('location', field.name, (location) => {
    formData.value[field.name] = location
  })
}

// 处理文件变化
const handleFileChange = (field, fileList) => {
  formData.value[field.name] = fileList
}

// 添加配件
const addPart = (fieldName) => {
  if (!formData.value[fieldName]) {
    formData.value[fieldName] = []
  }
  formData.value[fieldName].push({ name: '', model: '', quantity: 1 })
}

// 移除配件
const removePart = (fieldName, index) => {
  formData.value[fieldName].splice(index, 1)
}

// 签名相关
const startSignature = (e) => {
  isDrawing.value = true
  const canvas = signatureCanvas.value
  const ctx = canvas.getContext('2d')
  const rect = canvas.getBoundingClientRect()
  ctx.beginPath()
  ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top)
}

const drawSignature = (e) => {
  if (!isDrawing.value) return
  const canvas = signatureCanvas.value
  const ctx = canvas.getContext('2d')
  const rect = canvas.getBoundingClientRect()
  ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top)
  ctx.stroke()
}

const endSignature = () => {
  isDrawing.value = false
}

const clearSignature = () => {
  const canvas = signatureCanvas.value
  const ctx = canvas.getContext('2d')
  ctx.clearRect(0, 0, canvas.width, canvas.height)
}

const saveSignature = () => {
  const canvas = signatureCanvas.value
  const signatureData = canvas.toDataURL('image/png')
  // 保存签名数据到表单
  console.log('Signature saved:', signatureData)
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

// 监听字段配置变化
watch(() => props.fields, () => {
  initFormData()
}, { immediate: true })

onMounted(() => {
  // 初始化画布
  if (signatureCanvas.value) {
    signatureCanvas.value.width = signatureCanvas.value.offsetWidth
    signatureCanvas.value.height = 200
  }
})

// 暴露方法
defineExpose({
  validate,
  getFormData,
  resetForm
})
</script>

<style scoped>
.dynamic-form {
  width: 100%;
}

.dynamic-form-content {
  max-width: 600px;
}

.signature-container {
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  padding: 10px;
}

.signature-canvas {
  width: 100%;
  height: 200px;
  border: 1px dashed #dcdfe6;
  background-color: #fafafa;
  cursor: crosshair;
}

.signature-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 10px;
}

.parts-selector {
  width: 100%;
}

.part-item {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}

.inspection-items {
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  padding: 15px;
}

.inspection-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #ebeef5;
}

.inspection-item:last-child {
  border-bottom: none;
}

.item-name {
  font-weight: 500;
  color: #606266;
}
</style>
