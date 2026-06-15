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
        :row-key="rowKey"
        style="width: 100%"
        :height="fixedHeader ? tableHeight : undefined"
        v-bind="$attrs"
        @sort-change="handleSortChange"
        :fit="true"
        border
        :header-cell-style="{ 'text-overflow': 'ellipsis', 'white-space': 'nowrap' }"
      >
        <el-table-column
          v-for="column in visibleColumns"
          :key="column.prop"
          :prop="column.prop"
          :label="column.label"
          :width="getColumnWidth(column)"
          :min-width="column.resizable ? 60 : (column.minWidth || 100)"
          :fixed="column.fixed"
          :sortable="column.sortable ? 'custom' : false"
          :align="column.align || 'left'"
          :show-overflow-tooltip="column.showOverflowTooltip !== false"
          :class-name="column.resizable !== false ? 'resizable-column' : ''"
        >
          <template #header>
            <el-tooltip :content="column.label" placement="top" :show-after="500">
              <span class="header-label">{{ column.label }}</span>
            </el-tooltip>
          </template>
          <template #default="scope" v-if="column.slot || $slots[column.prop]">
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
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { Setting, Refresh, Rank } from '@element-plus/icons-vue'
import draggable from 'vuedraggable'
import { ElMessage } from 'element-plus'

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
    rowKey: {
      type: [String, Function],
      default: 'id'
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

    // 列宽记忆：{ prop: width }
    const columnWidths = ref({})

    // 可见列
    const visibleColumns = computed(() => {
      return localColumns.value.filter(col => col.visible !== false)
    })

    // 固定表头
    const fixedHeader = computed(() => localFixedHeader.value)
    const tableHeight = computed(() => localTableHeight.value)

    // 获取列宽（优先使用用户拖拽后的宽度）
    const getColumnWidth = (column) => {
      if (columnWidths.value[column.prop] !== undefined) {
        return columnWidths.value[column.prop]
      }
      return column.width
    }

    // ==================== 列宽拖拽 ====================
    let resizing = false
    let resizeColProp = null
    let resizeStartX = 0
    let resizeStartWidth = 0
    let resizeTh = null

    const MIN_COL_WIDTH = 60

    // 初始化拖拽手柄
    const initResizeHandles = () => {
      if (!tableRef.value) return
      const tableEl = tableRef.value.$el
      if (!tableEl) return

      const headerCells = tableEl.querySelectorAll('.el-table__header-wrapper th.el-table__cell')
      headerCells.forEach((th, index) => {
        // 跳过操作列（最后一个固定在右的列）
        if (th.classList.contains('operation-column')) return

        // 移除旧手柄
        const oldHandle = th.querySelector('.col-resize-handle')
        if (oldHandle) oldHandle.remove()

        // 获取对应的列 prop
        const visibleCols = visibleColumns.value
        if (index >= visibleCols.length) return
        const col = visibleCols[index]
        if (col.resizable === false) return

        // 创建拖拽手柄
        const handle = document.createElement('div')
        handle.className = 'col-resize-handle'
        handle.addEventListener('mousedown', onResizeMouseDown)
        handle.addEventListener('dblclick', onResizeDblClick)
        // 存储 prop 到 DOM
        handle.dataset.colProp = col.prop
        th.style.position = 'relative'
        th.appendChild(handle)
      })
    }

    const onResizeMouseDown = (e) => {
      e.preventDefault()
      e.stopPropagation()

      const prop = e.target.dataset.colProp
      if (!prop) return

      resizing = true
      resizeColProp = prop
      resizeStartX = e.clientX
      resizeTh = e.target.closest('th')

      // 获取当前列宽
      if (resizeTh) {
        resizeStartWidth = resizeTh.offsetWidth
      }

      document.addEventListener('mousemove', onResizeMouseMove)
      document.addEventListener('mouseup', onResizeMouseUp)
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'
    }

    const onResizeMouseMove = (e) => {
      if (!resizing || !resizeColProp) return

      const diff = e.clientX - resizeStartX
      const newWidth = Math.max(MIN_COL_WIDTH, resizeStartWidth + diff)

      // 更新列宽
      columnWidths.value[resizeColProp] = newWidth

      // 直接操作 DOM 实现实时拖拽效果（避免 Vue 重渲染导致闪烁）
      if (resizeTh) {
        resizeTh.style.width = newWidth + 'px'
        // 同步更新 colgroup 中的 col 元素
        const tableEl = tableRef.value?.$el
        if (tableEl) {
          const colIndex = Array.from(resizeTh.parentNode.children).indexOf(resizeTh)
          const colGroups = tableEl.querySelectorAll('colgroup col')
          if (colGroups[colIndex]) {
            colGroups[colIndex].style.width = newWidth + 'px'
          }
          // 同步 body 行
          const bodyRows = tableEl.querySelectorAll('.el-table__body-wrapper tbody tr')
          bodyRows.forEach(row => {
            const cells = row.querySelectorAll('td.el-table__cell')
            if (cells[colIndex]) {
              cells[colIndex].style.width = newWidth + 'px'
            }
          })
        }
      }
    }

    const onResizeMouseUp = () => {
      if (resizing) {
        resizing = false
        resizeColProp = null
        resizeTh = null

        document.removeEventListener('mousemove', onResizeMouseMove)
        document.removeEventListener('mouseup', onResizeMouseUp)
        document.body.style.cursor = ''
        document.body.style.userSelect = ''

        // 保存列宽到 localStorage
        saveColumnWidths()
      }
    }

    // 双击自适应列宽
    const onResizeDblClick = (e) => {
      e.preventDefault()
      e.stopPropagation()

      const prop = e.target.dataset.colProp
      if (!prop) return

      const tableEl = tableRef.value?.$el
      if (!tableEl) return

      // 找到该列在可见列中的索引
      const visibleCols = visibleColumns.value
      const colIndex = visibleCols.findIndex(c => c.prop === prop)
      if (colIndex === -1) return

      // 遍历所有 body 行，计算该列内容的最大宽度
      let maxWidth = 80 // 最小默认宽度
      const bodyRows = tableEl.querySelectorAll('.el-table__body-wrapper tbody tr')
      bodyRows.forEach(row => {
        const cells = row.querySelectorAll('td.el-table__cell')
        if (cells[colIndex]) {
          const cell = cells[colIndex]
          const cellDiv = cell.querySelector('.cell')
          if (cellDiv) {
            // 临时移除 overflow 限制来测量实际内容宽度
            const originalOverflow = cellDiv.style.overflow
            const originalWidth = cellDiv.style.width
            const originalWhiteSpace = cellDiv.style.whiteSpace
            cellDiv.style.overflow = 'visible'
            cellDiv.style.width = 'auto'
            cellDiv.style.whiteSpace = 'nowrap'
            const contentWidth = cellDiv.scrollWidth
            cellDiv.style.overflow = originalOverflow
            cellDiv.style.width = originalWidth
            cellDiv.style.whiteSpace = originalWhiteSpace
            if (contentWidth > maxWidth) maxWidth = contentWidth
          }
        }
      })

      // 加上 padding
      maxWidth += 24

      // 也考虑表头宽度
      const headerCells = tableEl.querySelectorAll('.el-table__header-wrapper th.el-table__cell')
      if (headerCells[colIndex]) {
        const headerDiv = headerCells[colIndex].querySelector('.cell')
        if (headerDiv) {
          const headerWidth = headerDiv.scrollWidth + 24
          if (headerWidth > maxWidth) maxWidth = headerWidth
        }
      }

      // 更新列宽
      columnWidths.value[prop] = maxWidth
      saveColumnWidths()
    }

    // 保存列宽到 localStorage
    const saveColumnWidths = () => {
      const key = `table_widths_${props.storageKey}`
      localStorage.setItem(key, JSON.stringify(columnWidths.value))
    }

    // 加载列宽从 localStorage
    const loadColumnWidths = () => {
      const key = `table_widths_${props.storageKey}`
      try {
        const saved = localStorage.getItem(key)
        if (saved) {
          columnWidths.value = JSON.parse(saved)
        }
      } catch (e) {
        console.error('加载列宽配置失败:', e)
      }
    }

    // ==================== 列配置管理 ====================

    // 初始化列配置
    const initColumns = () => {
      if (!props.columns || !Array.isArray(props.columns)) {
        localColumns.value = []
        return
      }

      // 尝试从本地存储加载配置
      const savedConfig = localStorage.getItem(`table_config_${props.storageKey}`)

      if (savedConfig) {
        try {
          const config = JSON.parse(savedConfig)
          if (!config.version || config.version < 2) {
            resetToDefault()
            saveConfig()
            return
          }
          if (config.columns && Array.isArray(config.columns) && config.columns.length > 0) {
            localColumns.value = config.columns.map(savedCol => {
              const propCol = props.columns?.find(c => c.prop === savedCol.prop)
              return {
                ...savedCol,
                slot: savedCol.slot ?? propCol?.slot ?? false
              }
            })
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

      // 加载列宽
      loadColumnWidths()
    }

    // 重置为默认配置
    const resetToDefault = () => {
      if (!props.columns || !Array.isArray(props.columns)) {
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
      // 同时清除列宽记忆
      columnWidths.value = {}
      localStorage.removeItem(`table_widths_${props.storageKey}`)
    }

    // 保存配置到本地存储
    const saveConfig = () => {
      const config = {
        version: 2,
        columns: localColumns.value.map(col => ({
          prop: col.prop,
          label: col.label,
          visible: col.visible,
          fixed: col.fixed,
          width: col.width,
          minWidth: col.minWidth,
          sortable: col.sortable,
          slot: col.slot
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

    // 监听数据变化后重新初始化拖拽手柄
    watch(() => props.data, () => {
      nextTick(() => {
        initResizeHandles()
      })
    })

    onMounted(() => {
      initColumns()
      nextTick(() => {
        initResizeHandles()
      })
    })

    onUnmounted(() => {
      // 清理事件监听
      document.removeEventListener('mousemove', onResizeMouseMove)
      document.removeEventListener('mouseup', onResizeMouseUp)
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
      getColumnWidth,
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

/* 列宽拖拽手柄 */
:deep(.el-table__header-wrapper) {
  .el-table__header {
    th.el-table__cell {
      position: relative;

      .col-resize-handle {
        position: absolute;
        top: 0;
        right: -3px;
        bottom: 0;
        width: 7px;
        cursor: col-resize;
        z-index: 10;
        background: transparent;
        transition: background-color 0.15s;
      }

      .col-resize-handle:hover {
        background-color: rgba(64, 158, 255, 0.3);
      }
    }
  }
}

/* 拖拽时整表光标 */
body.resizing-table {
  cursor: col-resize !important;
  user-select: none !important;
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
      height: 48px;
      padding: 8px 8px;
      background-color: #f5f7fa;
      font-weight: 600;
      color: #303133;

      .cell {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        line-height: 32px;
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
        .el-table__sort-icon {
          margin-left: 2px;
          flex-shrink: 0;
          font-size: 11px;
        }

        .header-label {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          flex: 1;
          min-width: 0;
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

  :deep(.el-table__header-wrapper) {
    .el-table__header {
      th.el-table__cell {
        padding: 8px 4px;
        font-size: 12px;

        .cell {
          line-height: 28px;
        }

        .col-resize-handle {
          width: 5px;
          right: -2px;
        }
      }
    }
  }
}
</style>
