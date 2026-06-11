<template>
  <div class="field-designer">
    <FieldTypePanel @select="handleFieldTypeSelect" @dragstart="handleDragStart" />
    <FormCanvas
      :title="templateName"
      v-model:fields="fields"
      v-model:selectedField="selectedField"
      :layout="layout"
      @save="handleSave"
      @add-field="handleAddField"
      @copy-field="handleCopyField"
      @delete-field="handleDeleteField"
    />
    <FieldPropertyPanel :field="selectedField" @update:field="handleFieldUpdate" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import FieldTypePanel from '../components/field-designer/FieldTypePanel.vue'
import FormCanvas from '../components/field-designer/FormCanvas.vue'
import FieldPropertyPanel from '../components/field-designer/FieldPropertyPanel.vue'
import { useFieldConfigStore } from '../stores/fieldConfigStore'
import { useFieldTemplateStore } from '../stores/fieldTemplateStore'
import { fieldTypeRegistry } from '../stores/fieldTypeRegistry'

const route = useRoute()
const router = useRouter()
const fieldConfigStore = useFieldConfigStore()
const fieldTemplateStore = useFieldTemplateStore()

// 状态
const templateId = ref(route.query.templateId || '')
const templateName = ref(route.query.name || '未命名模板')
const fields = ref([])
const selectedField = ref(null)
const layout = ref({
  type: 'grid',
  columns: 24,
  gutter: 16
})

// 初始化
onMounted(() => {
  if (templateId.value) {
    loadTemplate(templateId.value)
  }
})

// 加载模板
const loadTemplate = (id) => {
  const template = fieldTemplateStore.getTemplateById(id)
  if (template) {
    templateName.value = template.name
    // 转换字段实例为完整字段对象
    fields.value = template.fields.map(instance => {
      const fieldDef = fieldConfigStore.getFieldDefinition(instance.fieldDefId)
      return {
        ...fieldDef,
        ...instance,
        config: {
          ...fieldDef?.config,
          ...instance.override,
          colSpan: instance.colSpan || 24
        }
      }
    }).filter(Boolean)
  }
}

// 处理字段类型选择
const handleFieldTypeSelect = (fieldType) => {
  addField(fieldType.code)
}

// 处理拖拽开始
const handleDragStart = (fieldType) => {
  // 拖拽逻辑在 FieldTypePanel 中处理
}

// 添加字段
const handleAddField = (typeCode) => {
  if (typeCode) {
    addField(typeCode)
  } else {
    // 打开字段选择对话框
    // 简化处理：默认添加文本字段
    addField('text')
  }
}

// 添加字段（内部方法）
const addField = (typeCode) => {
  const type = fieldTypeRegistry.getType(typeCode)
  if (!type) {
    ElMessage.error(`未知字段类型: ${typeCode}`)
    return
  }

  const newField = {
    id: `field_${Date.now()}`,
    code: `field_${Math.random().toString(36).substr(2, 9)}`,
    name: type.name,
    type: typeCode,
    category: type.category,
    description: type.description,
    config: {
      label: type.name,
      placeholder: `请输入${type.name}`,
      required: false,
      disabled: false,
      hidden: false,
      colSpan: 24,
      ...type.defaultConfig
    },
    validation: [],
    dataSource: {
      type: 'static',
      options: []
    },
    sortOrder: fields.value.length + 1
  }

  fields.value.push(newField)
  selectedField.value = newField
  ElMessage.success(`已添加字段: ${type.name}`)
}

// 复制字段
const handleCopyField = (field) => {
  const copiedField = {
    ...JSON.parse(JSON.stringify(field)),
    id: `field_${Date.now()}`,
    code: `${field.code}_copy`,
    name: `${field.name} (复制)`,
    sortOrder: fields.value.length + 1
  }

  const index = fields.value.findIndex(f => f.id === field.id)
  if (index >= 0) {
    fields.value.splice(index + 1, 0, copiedField)
  } else {
    fields.value.push(copiedField)
  }

  selectedField.value = copiedField
  ElMessage.success('字段已复制')
}

// 删除字段
const handleDeleteField = ({ field, index }) => {
  fields.value.splice(index, 1)
  if (selectedField.value?.id === field.id) {
    selectedField.value = null
  }
  ElMessage.success('字段已删除')
}

// 更新字段
const handleFieldUpdate = (updatedField) => {
  const index = fields.value.findIndex(f => f.id === updatedField.id)
  if (index >= 0) {
    fields.value[index] = updatedField
  }
}

// 保存
const handleSave = async () => {
  try {
    const templateData = {
      id: templateId.value || `template_${Date.now()}`,
      name: templateName.value,
      fields: fields.value.map(field => ({
        fieldDefId: field.id,
        sortOrder: field.sortOrder,
        colSpan: field.config?.colSpan || 24,
        override: {
          label: field.config?.label,
          required: field.config?.required,
          defaultValue: field.config?.defaultValue,
          placeholder: field.config?.placeholder
        }
      }))
    }

    await fieldTemplateStore.saveTemplate(templateData)
    ElMessage.success('模板保存成功')

    // 更新URL参数
    if (!templateId.value) {
      router.replace({
        query: { ...route.query, templateId: templateData.id }
      })
      templateId.value = templateData.id
    }
  } catch (error) {
    ElMessage.error(error.message || '保存失败')
  }
}
</script>

<style scoped>
.field-designer {
  display: flex;
  height: 100vh;
  overflow: hidden;
}
</style>
