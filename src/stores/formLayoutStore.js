import { ref, computed } from 'vue'

/**
 * 表单布局模板 Store
 * 提供预设的表单布局方案
 */

// 默认布局模板
const DefaultLayoutTemplates = [
  {
    id: 'layout_single_column',
    code: 'SINGLE_COLUMN',
    name: '单列布局',
    description: '所有字段垂直排列，适合简单表单',
    config: {
      type: 'list',
      columns: 24,
      gutter: 16,
      labelPosition: 'top',
      labelWidth: 'auto'
    },
    preview: '单列垂直排列'
  },
  {
    id: 'layout_two_column',
    code: 'TWO_COLUMN',
    name: '双列布局',
    description: '字段两列并排，适合中等复杂度表单',
    config: {
      type: 'grid',
      columns: 24,
      gutter: 16,
      labelPosition: 'top',
      labelWidth: 'auto',
      defaultColSpan: 12
    },
    preview: '两列并排布局'
  },
  {
    id: 'layout_three_column',
    code: 'THREE_COLUMN',
    name: '三列布局',
    description: '字段三列并排，适合字段较多的表单',
    config: {
      type: 'grid',
      columns: 24,
      gutter: 16,
      labelPosition: 'top',
      labelWidth: 'auto',
      defaultColSpan: 8
    },
    preview: '三列并排布局'
  },
  {
    id: 'layout_mixed',
    code: 'MIXED',
    name: '混合布局',
    description: '标题独占一行，内容双列排列',
    config: {
      type: 'grid',
      columns: 24,
      gutter: 16,
      labelPosition: 'top',
      labelWidth: 'auto',
      defaultColSpan: 12,
      fullWidthTypes: ['textarea', 'table', 'richText']
    },
    preview: '标题独占一行，内容双列'
  },
  {
    id: 'layout_compact',
    code: 'COMPACT',
    name: '紧凑布局',
    description: '标签左对齐，节省空间',
    config: {
      type: 'grid',
      columns: 24,
      gutter: 12,
      labelPosition: 'left',
      labelWidth: '120px',
      defaultColSpan: 12
    },
    preview: '标签左对齐，紧凑排列'
  }
]

let storeInstance = null

export const useFormLayoutStore = () => {
  if (storeInstance) return storeInstance

  const layouts = ref([...DefaultLayoutTemplates])
  const currentLayout = ref(DefaultLayoutTemplates[1]) // 默认双列布局

  // 获取所有布局模板
  const allLayouts = computed(() => layouts.value)

  // 根据ID获取布局
  const getLayoutById = (id) => {
    return layouts.value.find(l => l.id === id)
  }

  // 根据编码获取布局
  const getLayoutByCode = (code) => {
    return layouts.value.find(l => l.code === code)
  }

  // 设置当前布局
  const setCurrentLayout = (layout) => {
    currentLayout.value = layout
  }

  // 获取当前布局配置
  const getCurrentLayoutConfig = () => {
    return currentLayout.value?.config || DefaultLayoutTemplates[1].config
  }

  // 应用布局到字段
  const applyLayoutToFields = (fields, layoutCode) => {
    const layout = getLayoutByCode(layoutCode)
    if (!layout) return fields

    const config = layout.config
    return fields.map(field => {
      let colSpan = config.defaultColSpan || 12

      // 某些类型字段默认占满宽度
      if (config.fullWidthTypes?.includes(field.type)) {
        colSpan = 24
      }

      // 长文本字段占满宽度
      if (field.type === 'textarea' || field.type === 'richText') {
        colSpan = 24
      }

      return {
        ...field,
        config: {
          ...field.config,
          colSpan
        }
      }
    })
  }

  // 保存自定义布局
  const saveLayout = (layout) => {
    const index = layouts.value.findIndex(l => l.id === layout.id)
    if (index >= 0) {
      layouts.value[index] = layout
    } else {
      layouts.value.push({
        ...layout,
        id: `layout_${Date.now()}`
      })
    }
  }

  const store = {
    // State - 使用 getter 返回实际值，避免 ComputedRefImpl 问题
    get layouts() { return layouts.value },
    get currentLayout() { return currentLayout.value },
    get allLayouts() { return allLayouts.value },
    getLayoutById,
    getLayoutByCode,
    setCurrentLayout,
    getCurrentLayoutConfig,
    applyLayoutToFields,
    saveLayout
  }

  storeInstance = store
  return store
}
