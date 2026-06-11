<template>
  <div class="field-diff-viewer">
    <div class="diff-summary">
      <el-statistic title="新增字段" :value="customFields.length">
        <template #suffix>
          <el-tag type="success" size="small">+{{ customFields.length }}</el-tag>
        </template>
      </el-statistic>
      <el-statistic title="移除字段" :value="removedFields.length">
        <template #suffix>
          <el-tag type="danger" size="small">-{{ removedFields.length }}</el-tag>
        </template>
      </el-statistic>
      <el-statistic title="修改字段" :value="modifiedFields.length">
        <template #suffix>
          <el-tag type="warning" size="small">~{{ modifiedFields.length }}</el-tag>
        </template>
      </el-statistic>
    </div>

    <el-divider />

    <div class="diff-content">
      <!-- 新增字段 -->
      <div v-if="customFields.length > 0" class="diff-section">
        <h4 class="section-title">
          <el-icon color="#67c23a"><Plus /></el-icon>
          新增字段 ({{ customFields.length }})
        </h4>
        <el-table :data="customFields" size="small" border>
          <el-table-column prop="name" label="字段名称" width="150" />
          <el-table-column prop="type" label="类型" width="120">
            <template #default="{ row }">
              <el-tag size="small">{{ getFieldTypeName(row.type) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="config.label" label="显示标签" />
        </el-table>
      </div>

      <!-- 移除字段 -->
      <div v-if="removedFields.length > 0" class="diff-section">
        <h4 class="section-title">
          <el-icon color="#f56c6c"><Minus /></el-icon>
          移除字段 ({{ removedFields.length }})
        </h4>
        <el-table :data="removedFields" size="small" border>
          <el-table-column prop="name" label="字段名称" width="150" />
          <el-table-column prop="type" label="类型" width="120">
            <template #default="{ row }">
              <el-tag size="small" type="info">{{ getFieldTypeName(row.type) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="config.label" label="显示标签" />
        </el-table>
      </div>

      <!-- 修改字段 -->
      <div v-if="modifiedFields.length > 0" class="diff-section">
        <h4 class="section-title">
          <el-icon color="#e6a23c"><Edit /></el-icon>
          修改字段 ({{ modifiedFields.length }})
        </h4>
        <div class="modified-list">
          <div
            v-for="field in modifiedFields"
            :key="field.id"
            class="modified-item"
          >
            <div class="field-name">{{ field.name }}</div>
            <div class="changes-list">
              <div
                v-for="(change, key) in getFieldChanges(field)"
                :key="key"
                class="change-detail"
              >
                <span class="change-label">{{ change.label }}:</span>
                <span class="old-value">{{ change.oldValue || '(空)' }}</span>
                <el-icon><ArrowRight /></el-icon>
                <span class="new-value">{{ change.newValue || '(空)' }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="customFields.length === 0 && removedFields.length === 0 && modifiedFields.length === 0" class="empty-diff">
        <el-icon :size="48" color="#909399"><Document /></el-icon>
        <p>暂无差异</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { Plus, Minus, Edit, ArrowRight, Document } from '@element-plus/icons-vue'
import { fieldTypeRegistry } from '../../stores/fieldTypeRegistry'

const props = defineProps({
  baseFields: {
    type: Array,
    default: () => []
  },
  customFields: {
    type: Array,
    default: () => []
  },
  removedFields: {
    type: Array,
    default: () => []
  },
  modifiedFields: {
    type: Array,
    default: () => []
  }
})

const getFieldTypeName = (typeCode) => {
  const type = fieldTypeRegistry.getType(typeCode)
  return type?.name || typeCode
}

const getFieldChanges = (field) => {
  const baseField = props.baseFields.find(f => f.id === field.id)
  if (!baseField) return {}

  const changes = {}
  if (field.name !== baseField.name) {
    changes.name = {
      label: '字段名称',
      oldValue: baseField.name,
      newValue: field.name
    }
  }
  if (field.config?.label !== baseField.config?.label) {
    changes.label = {
      label: '显示标签',
      oldValue: baseField.config?.label,
      newValue: field.config?.label
    }
  }
  if (field.config?.required !== baseField.config?.required) {
    changes.required = {
      label: '必填',
      oldValue: baseField.config?.required ? '是' : '否',
      newValue: field.config?.required ? '是' : '否'
    }
  }
  return changes
}
</script>

<style scoped>
.field-diff-viewer {
  padding: 16px;
}

.diff-summary {
  display: flex;
  justify-content: space-around;
  margin-bottom: 20px;
}

.diff-section {
  margin-bottom: 24px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #303133;
}

.modified-list {
  border: 1px solid #ebeef5;
  border-radius: 4px;
}

.modified-item {
  padding: 12px;
  border-bottom: 1px solid #ebeef5;
}

.modified-item:last-child {
  border-bottom: none;
}

.field-name {
  font-weight: 500;
  color: #303133;
  margin-bottom: 8px;
}

.changes-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.change-detail {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}

.change-label {
  color: #909399;
  min-width: 80px;
}

.old-value {
  color: #f56c6c;
  text-decoration: line-through;
}

.new-value {
  color: #67c23a;
  font-weight: 500;
}

.empty-diff {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  color: #909399;
}
</style>
