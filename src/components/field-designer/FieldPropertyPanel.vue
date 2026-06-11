<template>
  <div class="field-property-panel">
    <div v-if="!field" class="empty-state">
      <el-icon :size="48" class="empty-icon"><Edit /></el-icon>
      <p>选择字段进行配置</p>
    </div>

    <template v-else>
      <div class="panel-header">
        <h3>{{ field.name }}</h3>
        <span class="field-type">{{ fieldTypeName }}</span>
      </div>

      <el-tabs v-model="activeTab" class="property-tabs">
        <el-tab-pane label="基础" name="basic">
          <el-form label-position="top" size="small">
            <el-form-item label="字段名称">
              <el-input v-model="localField.name" />
            </el-form-item>

            <el-form-item label="显示标签">
              <el-input v-model="localField.config.label" />
            </el-form-item>

            <el-form-item label="占位提示">
              <el-input v-model="localField.config.placeholder" />
            </el-form-item>

            <el-form-item label="默认值">
              <el-input v-model="localField.config.defaultValue" />
            </el-form-item>

            <el-form-item>
              <el-checkbox v-model="localField.config.required">必填</el-checkbox>
            </el-form-item>

            <el-form-item>
              <el-checkbox v-model="localField.config.disabled">禁用</el-checkbox>
            </el-form-item>

            <el-form-item>
              <el-checkbox v-model="localField.config.hidden">隐藏</el-checkbox>
            </el-form-item>

            <el-form-item label="占位格数">
              <el-slider v-model="localField.config.colSpan" :min="1" :max="24" :step="1" show-stops />
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <el-tab-pane label="验证" name="validation">
          <div class="validation-rules">
            <div
              v-for="(rule, index) in localField.validation"
              :key="index"
              class="rule-item"
            >
              <el-select v-model="rule.type" size="small" style="width: 100px">
                <el-option label="必填" value="required" />
                <el-option label="最小长度" value="minLength" />
                <el-option label="最大长度" value="maxLength" />
                <el-option label="正则" value="pattern" />
              </el-select>
              <el-input
                v-if="rule.type !== 'required'"
                v-model="rule.value"
                size="small"
                placeholder="值"
                style="width: 80px; margin: 0 8px"
              />
              <el-input
                v-model="rule.message"
                size="small"
                placeholder="错误提示"
                style="flex: 1"
              />
              <el-button
                type="danger"
                link
                size="small"
                @click="removeValidationRule(index)"
              >
                <el-icon><Delete /></el-icon>
              </el-button>
            </div>
            <el-button type="primary" plain size="small" @click="addValidationRule">
              <el-icon><Plus /></el-icon>
              添加规则
            </el-button>
          </div>
        </el-tab-pane>

        <el-tab-pane label="数据源" name="datasource">
          <el-form label-position="top" size="small">
            <el-form-item label="数据源类型">
              <el-select v-model="localField.dataSource.type" style="width: 100%">
                <el-option label="静态选项" value="static" />
                <el-option label="API接口" value="api" />
                <el-option label="字典数据" value="dict" />
              </el-select>
            </el-form-item>

            <template v-if="localField.dataSource.type === 'static'">
              <div class="options-list">
                <div
                  v-for="(option, index) in localField.dataSource.options"
                  :key="index"
                  class="option-item"
                >
                  <el-input v-model="option.label" size="small" placeholder="显示" />
                  <el-input v-model="option.value" size="small" placeholder="值" style="margin: 0 8px" />
                  <el-button type="danger" link size="small" @click="removeOption(index)">
                    <el-icon><Delete /></el-icon>
                  </el-button>
                </div>
                <el-button type="primary" plain size="small" @click="addOption">
                  <el-icon><Plus /></el-icon>
                  添加选项
                </el-button>
              </div>
            </template>

            <template v-if="localField.dataSource.type === 'api'">
              <el-form-item label="API地址">
                <el-input v-model="localField.dataSource.api" placeholder="/api/options" />
              </el-form-item>
              <el-form-item label="标签字段">
                <el-input v-model="localField.dataSource.labelField" placeholder="label" />
              </el-form-item>
              <el-form-item label="值字段">
                <el-input v-model="localField.dataSource.valueField" placeholder="value" />
              </el-form-item>
            </template>
          </el-form>
        </el-tab-pane>

        <el-tab-pane label="高级" name="advanced">
          <el-form label-position="top" size="small">
            <el-form-item label="字段说明">
              <el-input
                v-model="localField.description"
                type="textarea"
                :rows="3"
              />
            </el-form-item>

            <el-form-item label="自定义类名">
              <el-input v-model="localField.config.customClass" />
            </el-form-item>
          </el-form>
        </el-tab-pane>
      </el-tabs>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { Edit, Plus, Delete } from '@element-plus/icons-vue'
import { fieldTypeRegistry } from '../../stores/fieldTypeRegistry'

const props = defineProps({
  field: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['update:field'])

const activeTab = ref('basic')
const localField = ref(null)

const fieldTypeName = computed(() => {
  if (!props.field) return ''
  const type = fieldTypeRegistry.getType(props.field.type)
  return type?.name || props.field.type
})

watch(() => props.field, (newField) => {
  if (newField) {
    localField.value = JSON.parse(JSON.stringify(newField))
    // 确保数据结构完整
    if (!localField.value.config) localField.value.config = {}
    if (!localField.value.validation) localField.value.validation = []
    if (!localField.value.dataSource) localField.value.dataSource = { type: 'static', options: [] }
    if (!localField.value.dataSource.options) localField.value.dataSource.options = []
  } else {
    localField.value = null
  }
}, { immediate: true, deep: true })

watch(localField, (newVal) => {
  if (newVal) {
    emit('update:field', JSON.parse(JSON.stringify(newVal)))
  }
}, { deep: true })

const addValidationRule = () => {
  localField.value.validation.push({
    type: 'required',
    message: ''
  })
}

const removeValidationRule = (index) => {
  localField.value.validation.splice(index, 1)
}

const addOption = () => {
  localField.value.dataSource.options.push({ label: '', value: '' })
}

const removeOption = (index) => {
  localField.value.dataSource.options.splice(index, 1)
}
</script>

<style scoped>
.field-property-panel {
  width: 280px;
  height: 100%;
  background: #fff;
  border-left: 1px solid #e4e7ed;
  display: flex;
  flex-direction: column;
}

.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #909399;
}

.empty-icon {
  color: #c0c4cc;
  margin-bottom: 16px;
}

.panel-header {
  padding: 16px;
  border-bottom: 1px solid #e4e7ed;
}

.panel-header h3 {
  margin: 0 0 8px 0;
  font-size: 16px;
  color: #303133;
}

.field-type {
  font-size: 12px;
  color: #909399;
  background: #f5f7fa;
  padding: 2px 8px;
  border-radius: 4px;
}

.property-tabs {
  flex: 1;
  overflow: hidden;
}

.property-tabs :deep(.el-tabs__header) {
  margin-bottom: 0;
}

.property-tabs :deep(.el-tabs__content) {
  padding: 16px;
  overflow-y: auto;
  height: calc(100% - 40px);
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

.options-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.option-item {
  display: flex;
  align-items: center;
}
</style>
