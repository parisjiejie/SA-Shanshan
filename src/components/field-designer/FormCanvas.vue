<template>
  <div class="form-canvas">
    <div class="canvas-header">
      <div class="header-left">
        <h3>{{ title || '未命名模板' }}</h3>
        <span class="field-count">{{ fields.length }} 个字段</span>
      </div>
      <div class="header-actions">
        <el-radio-group v-model="viewMode" size="small">
          <el-radio-button label="design">设计</el-radio-button>
          <el-radio-button label="preview">预览</el-radio-button>
        </el-radio-group>
        <el-button type="primary" size="small" @click="handleSave">
          <el-icon><Check /></el-icon>
          保存
        </el-button>
      </div>
    </div>

    <div
      class="canvas-content"
      :class="{ 'is-drag-over': isDragOver, 'preview-mode': viewMode === 'preview' }"
      @dragover.prevent="handleDragOver"
      @dragleave="handleDragLeave"
      @drop="handleDrop"
    >
      <!-- 空状态 -->
      <div v-if="fields.length === 0" class="empty-state">
        <el-icon :size="48" class="empty-icon"><Plus /></el-icon>
        <p>拖拽字段到此处</p>
        <p class="empty-tip">或点击左侧字段类型添加</p>
      </div>

      <!-- 字段列表 -->
      <el-form
        v-else
        ref="formRef"
        :model="formData"
        label-position="top"
        class="form-fields"
      >
        <draggable
          v-model="localFields"
          item-key="id"
          handle=".drag-handle"
          class="fields-container"
          :class="`layout-${layout.type}`"
          @end="handleSortEnd"
        >
          <template #item="{ element: field, index }">
            <div
              class="form-field-wrapper"
              :class="{
                'is-selected': selectedField?.id === field.id,
                'is-hover': hoverField?.id === field.id
              }"
              :style="getFieldStyle(field)"
              @click="handleFieldClick(field)"
              @mouseenter="hoverField = field"
              @mouseleave="hoverField = null"
            >
              <!-- 字段操作栏 -->
              <div v-if="viewMode === 'design'" class="field-actions">
                <div class="drag-handle">
                  <el-icon><Rank /></el-icon>
                </div>
                <div class="action-buttons">
                  <el-button
                    type="primary"
                    link
                    size="small"
                    @click.stop="handleCopyField(field)"
                  >
                    <el-icon><CopyDocument /></el-icon>
                  </el-button>
                  <el-button
                    type="danger"
                    link
                    size="small"
                    @click.stop="handleDeleteField(field, index)"
                  >
                    <el-icon><Delete /></el-icon>
                  </el-button>
                </div>
              </div>

              <!-- 字段内容 -->
              <div class="field-content">
                <form-field-renderer
                  :field="field"
                  :value="formData[field.code]"
                  :mode="viewMode"
                  @update:value="handleFieldValueChange(field.code, $event)"
                />
              </div>
            </div>
          </template>
        </draggable>
      </el-form>
    </div>

    <!-- 画布底部 -->
    <div class="canvas-footer">
      <el-button type="primary" plain size="small" @click="handleAddField">
        <el-icon><Plus /></el-icon>
        添加字段
      </el-button>
      <el-button size="small" @click="handleClear">
        <el-icon><Delete /></el-icon>
        清空
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { Plus, Check, Rank, CopyDocument, Delete } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import draggable from 'vuedraggable'
import FormFieldRenderer from './FormFieldRenderer.vue'

const props = defineProps({
  title: {
    type: String,
    default: ''
  },
  fields: {
    type: Array,
    default: () => []
  },
  layout: {
    type: Object,
    default: () => ({ type: 'grid', columns: 24, gutter: 16 })
  },
  selectedField: {
    type: Object,
    default: null
  }
})

const emit = defineEmits([
  'update:fields',
  'update:selectedField',
  'save',
  'add-field',
  'copy-field',
  'delete-field'
])

// 状态
const viewMode = ref('design')
const isDragOver = ref(false)
const hoverField = ref(null)
const formData = ref({})
const formRef = ref(null)

// 本地字段列表（用于拖拽排序）
const localFields = computed({
  get: () => props.fields,
  set: (val) => emit('update:fields', val)
})

// 监听字段变化，初始化表单数据
watch(() => props.fields, (fields) => {
  fields.forEach(field => {
    if (!(field.code in formData.value)) {
      formData.value[field.code] = field.config?.defaultValue ?? ''
    }
  })
}, { immediate: true, deep: true })

// 获取字段样式
const getFieldStyle = (field) => {
  const colSpan = field.config?.colSpan || 24
  const percentage = (colSpan / props.layout.columns) * 100
  
  return {
    width: `calc(${percentage}% - ${props.layout.gutter}px)`,
    margin: `0 ${props.layout.gutter / 2}px ${props.layout.gutter}px`
  }
}

// 拖拽处理
const handleDragOver = () => {
  isDragOver.value = true
}

const handleDragLeave = () => {
  isDragOver.value = false
}

const handleDrop = (event) => {
  isDragOver.value = false
  
  try {
    const data = JSON.parse(event.dataTransfer.getData('application/json'))
    if (data.type === 'fieldType') {
      emit('add-field', data.code)
    }
  } catch (e) {
    console.error('Drop error:', e)
  }
}

// 字段点击
const handleFieldClick = (field) => {
  emit('update:selectedField', field)
}

// 字段值变化
const handleFieldValueChange = (code, value) => {
  formData.value[code] = value
}

// 排序结束
const handleSortEnd = () => {
  // 重新计算排序
  localFields.value.forEach((field, index) => {
    field.sortOrder = index + 1
  })
}

// 复制字段
const handleCopyField = (field) => {
  emit('copy-field', field)
}

// 删除字段
const handleDeleteField = async (field, index) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除字段 "${field.name}" 吗？`,
      '确认删除',
      { type: 'warning' }
    )
    emit('delete-field', { field, index })
  } catch (error) {
    // 用户取消
  }
}

// 添加字段
const handleAddField = () => {
  emit('add-field', null)
}

// 清空
const handleClear = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要清空所有字段吗？此操作不可恢复。',
      '确认清空',
      { type: 'warning' }
    )
    emit('update:fields', [])
    emit('update:selectedField', null)
    formData.value = {}
  } catch (error) {
    // 用户取消
  }
}

// 保存
const handleSave = () => {
  emit('save', {
    fields: localFields.value,
    formData: formData.value
  })
}
</script>

<style scoped>
.form-canvas {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #f5f7fa;
  min-width: 0;
}

.canvas-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: #fff;
  border-bottom: 1px solid #e4e7ed;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-left h3 {
  margin: 0;
  font-size: 16px;
  color: #303133;
}

.field-count {
  font-size: 12px;
  color: #909399;
  background: #f5f7fa;
  padding: 2px 8px;
  border-radius: 10px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.canvas-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  transition: background-color 0.2s;
}

.canvas-content.is-drag-over {
  background: #ecf5ff;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #909399;
}

.empty-icon {
  color: #c0c4cc;
  margin-bottom: 16px;
}

.empty-tip {
  font-size: 12px;
  margin-top: 8px;
}

.form-fields {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  min-height: 400px;
}

.fields-container {
  display: flex;
  flex-wrap: wrap;
  margin: 0 -8px;
}

.form-field-wrapper {
  position: relative;
  padding: 12px;
  border: 2px solid transparent;
  border-radius: 6px;
  transition: all 0.2s;
  background: #fff;
}

.form-field-wrapper:hover {
  border-color: #dcdfe6;
}

.form-field-wrapper.is-selected {
  border-color: #409eff;
  background: #f5f7fa;
}

.form-field-wrapper.is-hover {
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.field-actions {
  position: absolute;
  top: -12px;
  right: 8px;
  display: flex;
  align-items: center;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.2s;
  z-index: 10;
}

.form-field-wrapper:hover .field-actions {
  opacity: 1;
}

.drag-handle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background: #409eff;
  color: #fff;
  border-radius: 4px;
  cursor: move;
}

.action-buttons {
  display: flex;
  gap: 4px;
  background: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.field-content {
  pointer-events: none;
}

.form-field-wrapper.is-selected .field-content,
.preview-mode .field-content {
  pointer-events: auto;
}

.canvas-footer {
  display: flex;
  justify-content: center;
  gap: 12px;
  padding: 12px;
  background: #fff;
  border-top: 1px solid #e4e7ed;
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
