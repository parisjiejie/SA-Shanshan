<template>
  <div class="form-field-renderer">
    <!-- 标签 -->
    <label v-if="showLabel" class="field-label">
      {{ field.config?.label || field.name }}
      <span v-if="field.config?.required" class="required-mark">*</span>
    </label>

    <!-- 字段组件 -->
    <div class="field-component">
      <!-- 文本 -->
      <template v-if="field.type === 'text'">
        <el-input
          :model-value="value"
          @update:model-value="$emit('update:value', $event)"
          :placeholder="field.config?.placeholder"
          :disabled="isDisabled"
          :maxlength="field.config?.maxLength"
          :show-word-limit="field.config?.showWordLimit"
        />
      </template>

      <!-- 文本域 -->
      <template v-else-if="field.type === 'textarea'">
        <el-input
          type="textarea"
          :model-value="value"
          @update:model-value="$emit('update:value', $event)"
          :placeholder="field.config?.placeholder"
          :disabled="isDisabled"
          :rows="field.config?.rows || 3"
          :maxlength="field.config?.maxLength"
          :show-word-limit="field.config?.showWordLimit"
        />
      </template>

      <!-- 数字 -->
      <template v-else-if="field.type === 'number'">
        <el-input-number
          :model-value="value"
          @update:model-value="$emit('update:value', $event)"
          :placeholder="field.config?.placeholder"
          :disabled="isDisabled"
          :min="field.config?.min"
          :max="field.config?.max"
          :precision="field.config?.precision"
          :step="field.config?.step"
          style="width: 100%"
        />
      </template>

      <!-- 密码 -->
      <template v-else-if="field.type === 'password'">
        <el-input
          type="password"
          :model-value="value"
          @update:model-value="$emit('update:value', $event)"
          :placeholder="field.config?.placeholder"
          :disabled="isDisabled"
          :show-password="field.config?.showPassword"
          :maxlength="field.config?.maxLength"
        />
      </template>

      <!-- 下拉选择 -->
      <template v-else-if="field.type === 'select' || field.type === 'multiSelect'">
        <el-select
          :model-value="value"
          @update:model-value="$emit('update:value', $event)"
          :placeholder="field.config?.placeholder"
          :disabled="isDisabled"
          :multiple="field.type === 'multiSelect'"
          :filterable="field.config?.filterable"
          :clearable="field.config?.clearable"
          :collapse-tags="field.config?.collapseTags"
          style="width: 100%"
        >
          <el-option
            v-for="option in fieldOptions"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </el-select>
      </template>

      <!-- 单选框 -->
      <template v-else-if="field.type === 'radio'">
        <el-radio-group
          :model-value="value"
          @update:model-value="$emit('update:value', $event)"
          :disabled="isDisabled"
        >
          <el-radio
            v-for="option in fieldOptions"
            :key="option.value"
            :label="option.value"
            :border="field.config?.buttonStyle"
          >
            {{ option.label }}
          </el-radio>
        </el-radio-group>
      </template>

      <!-- 复选框 -->
      <template v-else-if="field.type === 'checkbox'">
        <el-checkbox-group
          :model-value="value || []"
          @update:model-value="$emit('update:value', $event)"
          :disabled="isDisabled"
          :min="field.config?.min"
          :max="field.config?.max"
        >
          <el-checkbox
            v-for="option in fieldOptions"
            :key="option.value"
            :label="option.value"
          >
            {{ option.label }}
          </el-checkbox>
        </el-checkbox-group>
      </template>

      <!-- 开关 -->
      <template v-else-if="field.type === 'switch'">
        <el-switch
          :model-value="value"
          @update:model-value="$emit('update:value', $event)"
          :disabled="isDisabled"
          :active-text="field.config?.activeText"
          :inactive-text="field.config?.inactiveText"
        />
      </template>

      <!-- 日期 -->
      <template v-else-if="field.type === 'date'">
        <el-date-picker
          :model-value="value"
          @update:model-value="$emit('update:value', $event)"
          type="date"
          :placeholder="field.config?.placeholder"
          :disabled="isDisabled"
          :format="field.config?.format"
          :value-format="field.config?.valueFormat"
          style="width: 100%"
        />
      </template>

      <!-- 日期时间 -->
      <template v-else-if="field.type === 'datetime'">
        <el-date-picker
          :model-value="value"
          @update:model-value="$emit('update:value', $event)"
          type="datetime"
          :placeholder="field.config?.placeholder"
          :disabled="isDisabled"
          :format="field.config?.format"
          :value-format="field.config?.valueFormat"
          style="width: 100%"
        />
      </template>

      <!-- 时间 -->
      <template v-else-if="field.type === 'time'">
        <el-time-picker
          :model-value="value"
          @update:model-value="$emit('update:value', $event)"
          :placeholder="field.config?.placeholder"
          :disabled="isDisabled"
          :format="field.config?.format"
          :value-format="field.config?.valueFormat"
          style="width: 100%"
        />
      </template>

      <!-- 评分 -->
      <template v-else-if="field.type === 'rate'">
        <el-rate
          :model-value="value"
          @update:model-value="$emit('update:value', $event)"
          :disabled="isDisabled"
          :max="field.config?.max || 5"
          :allow-half="field.config?.allowHalf"
          :show-text="field.config?.showText"
        />
      </template>

      <!-- 图片上传 -->
      <template v-else-if="field.type === 'imageUpload'">
        <el-upload
          action="#"
          list-type="picture-card"
          :auto-upload="false"
          :disabled="isDisabled"
          :limit="field.config?.maxCount"
        >
          <el-icon><Plus /></el-icon>
        </el-upload>
      </template>

      <!-- 文件上传 -->
      <template v-else-if="field.type === 'fileUpload'">
        <el-upload
          action="#"
          :auto-upload="false"
          :disabled="isDisabled"
          :limit="field.config?.maxCount"
        >
          <el-button type="primary" :disabled="isDisabled">
            <el-icon><Upload /></el-icon>
            选择文件
          </el-button>
        </el-upload>
      </template>

      <!-- 客户选择 -->
      <template v-else-if="field.type === 'customerSelector'">
        <el-select
          :model-value="value"
          @update:model-value="$emit('update:value', $event)"
          :placeholder="field.config?.placeholder || '请选择客户'"
          :disabled="isDisabled"
          :filterable="field.config?.searchable"
          style="width: 100%"
        >
          <el-option label="客户A" value="customer1" />
          <el-option label="客户B" value="customer2" />
        </el-select>
      </template>

      <!-- 工程师选择 -->
      <template v-else-if="field.type === 'engineerSelector'">
        <el-select
          :model-value="value"
          @update:model-value="$emit('update:value', $event)"
          :placeholder="field.config?.placeholder || '请选择工程师'"
          :disabled="isDisabled"
          :filterable="field.config?.searchable"
          style="width: 100%"
        >
          <el-option label="张工程师" value="engineer1" />
          <el-option label="李工程师" value="engineer2" />
        </el-select>
      </template>

      <!-- 设备选择 -->
      <template v-else-if="field.type === 'assetSelector'">
        <el-select
          :model-value="value"
          @update:model-value="$emit('update:value', $event)"
          :placeholder="field.config?.placeholder || '请选择设备'"
          :disabled="isDisabled"
          :filterable="field.config?.searchable"
          style="width: 100%"
        >
          <el-option label="设备001" value="asset1" />
          <el-option label="设备002" value="asset2" />
        </el-select>
      </template>

      <!-- 配件选择 -->
      <template v-else-if="field.type === 'partsSelector'">
        <el-select
          :model-value="value"
          @update:model-value="$emit('update:value', $event)"
          :placeholder="field.config?.placeholder || '请选择配件'"
          :disabled="isDisabled"
          :multiple="field.config?.multiple"
          :filterable="true"
          style="width: 100%"
        >
          <el-option label="配件A (¥100)" value="part1" />
          <el-option label="配件B (¥200)" value="part2" />
        </el-select>
      </template>

      <!-- 位置 -->
      <template v-else-if="field.type === 'location'">
        <el-input
          :model-value="value"
          @update:model-value="$emit('update:value', $event)"
          :placeholder="field.config?.placeholder || '请选择位置'"
          :disabled="isDisabled"
        >
          <template #append>
            <el-button :disabled="isDisabled">
              <el-icon><Location /></el-icon>
            </el-button>
          </template>
        </el-input>
      </template>

      <!-- 电子签名 -->
      <template v-else-if="field.type === 'signature'">
        <div class="signature-placeholder" :style="signatureStyle">
          <el-icon :size="32"><EditPen /></el-icon>
          <span>点击签名</span>
        </div>
      </template>

      <!-- 富文本 -->
      <template v-else-if="field.type === 'richText'">
        <el-input
          type="textarea"
          :model-value="value"
          @update:model-value="$emit('update:value', $event)"
          :placeholder="field.config?.placeholder || '请输入内容'"
          :disabled="isDisabled"
          :rows="field.config?.height ? Math.floor(field.config.height / 20) : 10"
        />
      </template>

      <!-- 表格 -->
      <template v-else-if="field.type === 'table'">
        <div class="table-field">
          <el-table :data="tableData" border size="small">
            <el-table-column
              v-for="col in field.tableConfig?.columns"
              :key="col.field"
              :prop="col.field"
              :label="col.label"
              :width="col.width"
            />
          </el-table>
          <el-button type="primary" link size="small" class="add-row-btn">
            <el-icon><Plus /></el-icon>
            添加行
          </el-button>
        </div>
      </template>

      <!-- 计算字段 -->
      <template v-else-if="field.type === 'computed'">
        <el-input
          :model-value="computedValue"
          disabled
          :placeholder="field.config?.placeholder || '自动计算'"
        />
      </template>

      <!-- 默认/未知类型 -->
      <template v-else>
        <el-input
          :model-value="value"
          @update:model-value="$emit('update:value', $event)"
          :placeholder="field.config?.placeholder || `请输入${field.name}`"
          :disabled="isDisabled"
        />
      </template>
    </div>

    <!-- 字段说明 -->
    <div v-if="field.description && showDescription" class="field-description">
      {{ field.description }}
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { Plus, Upload, Location, EditPen } from '@element-plus/icons-vue'

const props = defineProps({
  field: {
    type: Object,
    required: true
  },
  value: {
    type: [String, Number, Boolean, Array, Object],
    default: ''
  },
  mode: {
    type: String,
    default: 'design', // 'design' | 'preview'
    validator: (value) => ['design', 'preview'].includes(value)
  },
  showLabel: {
    type: Boolean,
    default: true
  },
  showDescription: {
    type: Boolean,
    default: false
  }
})

defineEmits(['update:value'])

// 是否禁用
const isDisabled = computed(() => {
  return props.mode === 'design' || props.field.config?.disabled
})

// 字段选项
const fieldOptions = computed(() => {
  if (props.field.dataSource?.type === 'static') {
    return props.field.dataSource.options || []
  }
  // 默认选项
  return [
    { label: '选项1', value: 'option1' },
    { label: '选项2', value: 'option2' }
  ]
})

// 签名样式
const signatureStyle = computed(() => {
  return {
    width: `${props.field.config?.width || 400}px`,
    height: `${props.field.config?.height || 200}px`,
    background: props.field.config?.backgroundColor || '#ffffff'
  }
})

// 表格数据
const tableData = computed(() => {
  return props.value || []
})

// 计算字段值
const computedValue = computed(() => {
  // 实际项目中应该根据 formula 计算
  return props.value || '0.00'
})
</script>

<style scoped>
.form-field-renderer {
  width: 100%;
}

.field-label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  color: #606266;
  font-weight: 500;
}

.required-mark {
  color: #f56c6c;
  margin-left: 4px;
}

.field-component {
  width: 100%;
}

.field-component :deep(.el-radio-group),
.field-component :deep(.el-checkbox-group) {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.field-description {
  margin-top: 4px;
  font-size: 12px;
  color: #909399;
}

.signature-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 2px dashed #dcdfe6;
  border-radius: 4px;
  color: #909399;
  cursor: pointer;
  transition: all 0.2s;
}

.signature-placeholder:hover {
  border-color: #409eff;
  color: #409eff;
}

.table-field {
  width: 100%;
}

.add-row-btn {
  margin-top: 8px;
}
</style>
