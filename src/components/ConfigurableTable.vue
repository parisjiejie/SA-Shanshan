<template>
  <div class="configurable-table">
    <!-- 工具栏 -->
    <div class="table-toolbar">
      <el-button type="primary" size="small" @click="showColumnSettings = true">
        <el-icon><Setting /></el-icon>
        列设置
      </el-button>
      <el-button type="default" size="small" @click="resetColumns">
        <el-icon><Refresh /></el-icon>
        重置
      </el-button>
    </div>
    
    <!-- 表格 -->
    <div class="table-wrapper" :class="{ 'fixed-header': fixedHeader }">
      <el-table
        ref="tableRef"
        :data="data"
        style="width: 100%"
        :height="fixedHeader ? tableHeight : undefined"
        v-bind="$attrs"
        @sort-change="handleSortChange"
        :fit="true"
        :header-cell-style="{ 'text-overflow': 'ellipsis', 'white-space': 'nowrap' }"
      >
        <el-table-column
          v-for="column in visibleColumns"
          :key="column.prop"
          :prop="column.prop"
          :label="column.label"
          :width="column.width"
          :min-width="column.minWidth || 100"
          :fixed="column.fixed"
          :sortable="column.sortable ? 'custom' : false"
          :align="column.align || 'left'"
          :show-overflow-tooltip="column.showOverflowTooltip !== false"
        >
          <template #header>
            <el-tooltip :content="column.label" placement="top" :show-after="500">
              <span class="header-label">{{ column.label }}</span>
            </el-tooltip>
          </template>
          <template #default="scope" v-if="column.slot">
            <slot :name="column.prop" :row="scope.row" :$index="scope.$index"></slot>
          </template>
          <template #default="scope" v-else-if="column.formatter">
            {{ column.formatter(scope.row[column.prop], scope.row) }}
          </template>
        </el-table-column>
        
        <!-- 操作列 -->
        <el-table-column
          v-if="showOperation"
          label="操作"
          :width="operationWidth === 'auto' ? undefined : operationWidth"
          :min-width="operationWidth === 'auto' ? 200 : undefined"
          fixed="right"
          class-name="operation-column"
        >
          <template #default="scope">
            <div class="operation-cell">
              <slot name="operation" :row="scope.row" :$index="scope.$index"></slot>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </div>
    
    <!-- 列设置对话框 -->
    <el-dialog
      v-model="showColumnSettings"
      title="列设置"
      width="600px"
      :close-on-click-modal="false"
    >
      <div class="column-settings">
        <!-- 固定表头设置 -->
        <div class="setting-section">
          <h4>表头设置</h4>
          <el-checkbox v-model="localFixedHeader">固定表头</el-checkbox>
          <el-input-number
            v-if="localFixedHeader"
            v-model="localTableHeight"
            :min="200"
            :max="800"
            :step="50"
            size="small"
            style="margin-left: 20px; width: 150px"
          >
            <template #suffix>px</template>
          </el-input-number>
        </div>
        
        <el-divider />
        
        <!-- 列显示和顺序设置 -->
        <div class="setting-section">
          <h4>显示字段（拖拽调整顺序）</h4>
          <draggable
            v-model="localColumns"
            item-key="prop"
            handle=".drag-handle"
            class="column-list"
          >
            <template #item="{ element, index }">
              <div class="column-item" :class="{ 'is-visible': element.visible }">
                <el-icon class="drag-handle"><Rank /></el-icon>
                <el-checkbox v-model="element.visible" class="column-checkbox">
                  {{ element.label }}
                </el-checkbox>
                <el-select
                  v-model="element.fixed"
                  size="small"
                  style="width: 100px; margin-left: auto"
                  placeholder="固定位置"
                  clearable
                >
                  <el-option label="不固定" :value="null" />
                  <el-option label="固定在左" value="left" />
                  <el-option label="固定在右" value="right" />
                </el-select>
              </div>
            </template>
          </draggable>
        </div>
      </div>
      <template #footer>
        <el-button @click="showColumnSettings = false">取消</el-button>
        <el-button type="primary" @click="applyColumnSettings">应用</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, computed, watch, onMounted } from 'vue'
import { Setting, Refresh, Rank } from '@element-plus/icons-vue'
import draggable from 'vuedraggable'
import { ElMessage } from 'element-plus'

console.log('ConfigurableTable - Component loaded')

export default {
  name: 'ConfigurableTable',
  components: {
    Setting,
    Refresh,
    Rank,
    draggable
  },
  props: {
    data: {
      type: Array,
      required: true
    },
    columns: {
      type: Array,
      required: true
    },
    showOperation: {
      type: Boolean,
      default: true
    },
    operationWidth: {
      type: [String, Number],
      default: 'auto'
    },
    storageKey: {
      type: String,
      required: true
    },
    fixedHeader: {
      type: Boolean,
      default: false
    },
    tableHeight: {
      type: [String, Number],
      default: 500
    }
  },
  emits: ['sort-change'],
  setup(props, { emit }) {
    const tableRef = ref(null)
    const showColumnSettings = ref(false)
    
    // 本地列配置
    const localColumns = ref([])
    const localFixedHeader = ref(props.fixedHeader)
    const localTableHeight = ref(parseInt(props.tableHeight) || 500)
    
    // 可见列
    const visibleColumns = computed(() => {
      return localColumns.value.filter(col => col.visible !== false)
    })
    
    // 固定表头
    const fixedHeader = computed(() => localFixedHeader.value)
    const tableHeight = computed(() => localTableHeight.value)
    
    // 初始化列配置
    const initColumns = () => {
      // 如果 columns 还未准备好，延迟初始化
      if (!props.columns || !Array.isArray(props.columns)) {
        console.warn('ConfigurableTable: columns prop is not ready yet')
        localColumns.value = []
        return
      }
      
      // 尝试从本地存储加载配置
      const savedConfig = localStorage.getItem(`table_config_${props.storageKey}`)
      
      if (savedConfig) {
        try {
          const config = JSON.parse(savedConfig)
          // 确保 config.columns 存在且是数组，否则使用 props.columns
          if (config.columns && Array.isArray(config.columns) && config.columns.length > 0) {
            localColumns.value = config.columns
          } else if (props.columns && Array.isArray(props.columns)) {
            localColumns.value = props.columns.map(col => ({ ...col, visible: true }))
          } else {
            localColumns.value = []
          }
          localFixedHeader.value = config.fixedHeader !== undefined ? config.fixedHeader : props.fixedHeader
          localTableHeight.value = config.tableHeight || parseInt(props.tableHeight) || 500
        } catch (e) {
          console.error('加载表格配置失败:', e)
          resetToDefault()
        }
      } else {
        resetToDefault()
      }
    }
    
    // 重置为默认配置
    const resetToDefault = () => {
      if (!props.columns || !Array.isArray(props.columns)) {
        console.warn('ConfigurableTable: columns prop is not available for reset')
        localColumns.value = []
        return
      }
      
      localColumns.value = props.columns.map((col, index) => ({
        ...col,
        visible: col.visible !== false,
        order: index
      }))
      localFixedHeader.value = props.fixedHeader
      localTableHeight.value = parseInt(props.tableHeight) || 500
    }
    
    // 保存配置到本地存储
    const saveConfig = () => {
      const config = {
        columns: localColumns.value.map(col => ({
          prop: col.prop,
          label: col.label,
          visible: col.visible,
          fixed: col.fixed,
          width: col.width,
          minWidth: col.minWidth,
          sortable: col.sortable
        })),
        fixedHeader: localFixedHeader.value,
        tableHeight: localTableHeight.value
      }
      localStorage.setItem(`table_config_${props.storageKey}`, JSON.stringify(config))
    }
    
    // 应用列设置
    const applyColumnSettings = () => {
      saveConfig()
      showColumnSettings.value = false
      ElMessage.success('列设置已保存')
    }
    
    // 重置列设置
    const resetColumns = () => {
      localStorage.removeItem(`table_config_${props.storageKey}`)
      resetToDefault()
      ElMessage.success('已重置为默认设置')
    }
    
    // 处理排序变化
    const handleSortChange = ({ prop, order }) => {
      emit('sort-change', { prop, order })
    }
    
    // 监听列配置变化
    watch(() => props.columns, () => {
      initColumns()
    }, { deep: true })
    
    onMounted(() => {
      initColumns()
    })
    
    return {
      tableRef,
      showColumnSettings,
      localColumns,
      localFixedHeader,
      localTableHeight,
      visibleColumns,
      fixedHeader,
      tableHeight,
      applyColumnSettings,
      resetColumns,
      handleSortChange
    }
  }
}
</script>

<style scoped>
.configurable-table {
  width: 100%;
}

.table-toolbar {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
  justify-content: flex-end;
}

.table-wrapper {
  width: 100%;
}

.table-wrapper.fixed-header {
  :deep(.el-table) {
    .el-table__header-wrapper {
      position: sticky;
      top: 0;
      z-index: 10;
    }
  }
}

.column-settings {
  max-height: 500px;
  overflow-y: auto;
}

.setting-section {
  margin-bottom: 20px;
}

.setting-section h4 {
  margin-bottom: 15px;
  color: #303133;
  font-size: 14px;
}

.column-list {
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  padding: 10px;
  max-height: 300px;
  overflow-y: auto;
}

.column-item {
  display: flex;
  align-items: center;
  padding: 8px 10px;
  margin-bottom: 5px;
  background-color: #f5f7fa;
  border-radius: 4px;
  transition: all 0.3s;
}

.column-item:hover {
  background-color: #e4e7ed;
}

.column-item.is-visible {
  background-color: #ecf5ff;
}

.drag-handle {
  cursor: move;
  margin-right: 10px;
  color: #909399;
}

.column-checkbox {
  flex: 1;
}

/* 操作列样式 */
:deep(.operation-column) {
  .cell {
    padding: 8px;
    white-space: normal;
  }
}

.operation-cell {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 4px;
  flex-wrap: nowrap;
}

.operation-cell :deep(.el-button) {
  padding: 4px 8px;
  font-size: 12px;
  height: 24px;
}

/* 表头样式优化 - 统一高度，文字不换行 */
:deep(.el-table__header-wrapper) {
  .el-table__header {
    th.el-table__cell {
      height: 48px; /* 统一表头高度 */
      padding: 8px 8px; /* 减小左右内边距，给内容更多空间 */
      background-color: #f5f7fa;
      font-weight: 600;
      color: #303133;
      
      .cell {
        white-space: nowrap; /* 文字不换行 */
        overflow: hidden;
        text-overflow: ellipsis; /* 超出显示省略号 */
        line-height: 32px; /* 垂直居中 */
        padding: 0;
        display: flex;
        align-items: center;
        justify-content: flex-start;
      }
    }
  }
}

/* 排序图标样式优化 */
:deep(.el-table__header-wrapper) {
  .el-table__header {
    th.el-table__cell {
      .cell {
        /* 确保排序图标不会挤占文字空间 */
        .el-table__sort-icon {
          margin-left: 2px;
          flex-shrink: 0;
          font-size: 11px; /* 稍微缩小图标 */
        }
        
        /* 当有排序功能时，给文字容器设置最大宽度 */
        .header-label {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          flex: 1;
          min-width: 0; /* 允许flex item收缩 */
        }
      }
    }
  }
}

/* 表头标签样式 */
.header-label {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: help;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .table-toolbar {
    flex-wrap: wrap;
  }
  
  .column-item {
    flex-wrap: wrap;
    gap: 10px;
  }
  
  .column-item .el-select {
    width: 100% !important;
    margin-left: 30px !important;
  }
  
  .operation-cell {
    flex-wrap: wrap;
    gap: 4px;
  }
  
  /* 移动端表头优化 */
  :deep(.el-table__header-wrapper) {
    .el-table__header {
      th.el-table__cell {
        padding: 8px 4px; /* 更小的内边距 */
        font-size: 12px; /* 更小的字体 */
        
        .cell {
          line-height: 28px;
        }
      }
    }
  }
  
  /* 移动端隐藏部分列的排序图标，节省空间 */
  :deep(.el-table__header-wrapper) {
    .el-table__header {
      th.el-table__cell {
        .cell {
          .el-table__sort-icon {
            font-size: 10px;
            margin-left: 1px;
          }
        }
      }
    }
  }
}
</style>
