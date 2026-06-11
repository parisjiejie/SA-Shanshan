<template>
  <div class="field-type-panel">
    <div class="panel-header">
      <h3>字段类型</h3>
      <el-input
        v-model="searchKeyword"
        placeholder="搜索字段"
        size="small"
        clearable
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
    </div>

    <div class="panel-content">
      <el-collapse v-model="activeCategories">
        <el-collapse-item
          v-for="category in filteredCategories"
          :key="category.code"
          :title="category.name"
          :name="category.code"
        >
          <div class="field-type-list">
            <div
              v-for="fieldType in getTypesByCategory(category.code)"
              :key="fieldType.code"
              class="field-type-item"
              draggable="true"
              @dragstart="handleDragStart($event, fieldType)"
              @click="handleClick(fieldType)"
            >
              <el-icon :size="18">
                <component :is="fieldType.icon" />
              </el-icon>
              <span class="field-type-name">{{ fieldType.name }}</span>
              <el-tooltip :content="fieldType.description" placement="right">
                <el-icon class="info-icon" :size="14"><InfoFilled /></el-icon>
              </el-tooltip>
            </div>
          </div>
        </el-collapse-item>
      </el-collapse>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Search, InfoFilled } from '@element-plus/icons-vue'
import { fieldTypeRegistry } from '../../stores/fieldTypeRegistry'

const emit = defineEmits(['select', 'dragstart'])

// 状态
const searchKeyword = ref('')
const activeCategories = ref(['basic', 'select', 'business', 'advanced'])

// 计算属性
const categories = computed(() => fieldTypeRegistry.getCategories())

const filteredCategories = computed(() => {
  if (!searchKeyword.value) return categories.value
  
  const keyword = searchKeyword.value.toLowerCase()
  return categories.value.filter(cat => {
    const types = getTypesByCategory(cat.code)
    return types.some(type => 
      type.name.toLowerCase().includes(keyword) ||
      type.description?.toLowerCase().includes(keyword)
    )
  })
})

// 方法
const getTypesByCategory = (categoryCode) => {
  const types = fieldTypeRegistry.getTypesByCategory(categoryCode)
  
  if (!searchKeyword.value) return types
  
  const keyword = searchKeyword.value.toLowerCase()
  return types.filter(type =>
    type.name.toLowerCase().includes(keyword) ||
    type.description?.toLowerCase().includes(keyword)
  )
}

const handleDragStart = (event, fieldType) => {
  event.dataTransfer.setData('application/json', JSON.stringify({
    type: 'fieldType',
    code: fieldType.code
  }))
  event.dataTransfer.effectAllowed = 'copy'
  emit('dragstart', fieldType)
}

const handleClick = (fieldType) => {
  emit('select', fieldType)
}
</script>

<style scoped>
.field-type-panel {
  width: 240px;
  height: 100%;
  background: #fff;
  border-right: 1px solid #e4e7ed;
  display: flex;
  flex-direction: column;
}

.panel-header {
  padding: 16px;
  border-bottom: 1px solid #e4e7ed;
}

.panel-header h3 {
  margin: 0 0 12px 0;
  font-size: 16px;
  color: #303133;
}

.panel-content {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.field-type-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.field-type-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  user-select: none;
}

.field-type-item:hover {
  background: #f5f7fa;
}

.field-type-item:active {
  background: #ecf5ff;
}

.field-type-name {
  flex: 1;
  font-size: 14px;
  color: #606266;
}

.info-icon {
  color: #c0c4cc;
  opacity: 0;
  transition: opacity 0.2s;
}

.field-type-item:hover .info-icon {
  opacity: 1;
}

:deep(.el-collapse-item__header) {
  font-weight: 500;
  color: #303133;
}

:deep(.el-collapse-item__content) {
  padding-bottom: 8px;
}
</style>
