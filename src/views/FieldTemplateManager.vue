<template>
  <div class="field-template-manager">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2>字段模板管理</h2>
      <div class="header-actions">
        <el-button @click="handleImport">
          <el-icon><Upload /></el-icon>
          导入
        </el-button>
        <el-button type="primary" @click="handleCreate">
          <el-icon><Plus /></el-icon>
          新建模板
        </el-button>
      </div>
    </div>

    <!-- 筛选栏 -->
    <div class="filter-bar">
      <el-input
        v-model="searchKeyword"
        placeholder="搜索模板名称"
        clearable
        style="width: 250px"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
      
      <el-select
        v-model="filterWorkorderType"
        placeholder="工单类型"
        clearable
        style="width: 150px; margin-left: 12px"
      >
        <el-option label="维修" value="维修" />
        <el-option label="安装" value="安装" />
        <el-option label="巡检" value="巡检" />
        <el-option label="配件销售" value="配件销售" />
      </el-select>

      <el-select
        v-model="filterStatus"
        placeholder="状态"
        clearable
        style="width: 120px; margin-left: 12px"
      >
        <el-option label="草稿" value="draft" />
        <el-option label="已发布" value="active" />
        <el-option label="已废弃" value="deprecated" />
      </el-select>
    </div>

    <!-- 模板列表 -->
    <div class="template-list">
      <el-row :gutter="20">
        <el-col
          v-for="template in filteredTemplates"
          :key="template.id"
          :xs="24"
          :sm="12"
          :md="8"
          :lg="6"
        >
          <el-card
            class="template-card"
            :class="{ 'is-default': template.metadata?.isDefault }"
            shadow="hover"
          >
            <div class="card-header">
              <div class="template-icon">
                <el-icon :size="32"><Document /></el-icon>
              </div>
              <div class="template-status">
                <el-tag
                  :type="getStatusType(template.metadata?.status)"
                  size="small"
                >
                  {{ getStatusText(template.metadata?.status) }}
                </el-tag>
                <el-tag
                  v-if="template.metadata?.isDefault"
                  type="success"
                  size="small"
                  class="default-tag"
                >
                  默认
                </el-tag>
              </div>
            </div>

            <h3 class="template-name">{{ template.name }}</h3>
            <p class="template-desc">{{ template.description || '暂无描述' }}</p>

            <div class="template-meta">
              <div class="meta-item">
                <el-icon><Collection /></el-icon>
                <span>{{ template.fields?.length || 0 }} 个字段</span>
              </div>
              <div class="meta-item">
                <el-icon><Ticket /></el-icon>
                <span>{{ template.scope?.workorderTypes?.join(', ') || '通用' }}</span>
              </div>
              <div class="meta-item">
                <el-icon><Clock /></el-icon>
                <span>v{{ template.metadata?.version || 1 }}</span>
              </div>
            </div>

            <div class="card-actions">
              <el-button
                type="primary"
                link
                size="small"
                @click="handleEdit(template)"
              >
                编辑
              </el-button>
              <el-button
                type="primary"
                link
                size="small"
                @click="handleDesign(template)"
              >
                设计
              </el-button>
              <el-dropdown size="small" trigger="click">
                <el-button type="primary" link size="small">
                  更多<el-icon class="el-icon--right"><ArrowDown /></el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item @click="handlePreview(template)">
                      <el-icon><View /></el-icon>预览
                    </el-dropdown-item>
                    <el-dropdown-item @click="handleClone(template)">
                      <el-icon><CopyDocument /></el-icon>复制
                    </el-dropdown-item>
                    <el-dropdown-item
                      v-if="template.metadata?.status !== 'active'"
                      @click="handlePublish(template)"
                    >
                      <el-icon><Promotion /></el-icon>发布
                    </el-dropdown-item>
                    <el-dropdown-item
                      v-if="!template.metadata?.isDefault"
                      @click="handleSetDefault(template)"
                    >
                      <el-icon><Star /></el-icon>设为默认
                    </el-dropdown-item>
                    <el-dropdown-item @click="handleExport(template)">
                      <el-icon><Download /></el-icon>导出
                    </el-dropdown-item>
                    <el-dropdown-item divided @click="handleVersions(template)">
                      <el-icon><Timer /></el-icon>版本历史
                    </el-dropdown-item>
                    <el-dropdown-item type="danger" @click="handleDelete(template)">
                      <el-icon><Delete /></el-icon>删除
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 新建/编辑对话框 -->
    <el-dialog
      v-model="dialog.visible"
      :title="dialog.isEdit ? '编辑模板' : '新建模板'"
      width="600px"
    >
      <el-form
        ref="formRef"
        :model="dialog.form"
        :rules="formRules"
        label-width="100px"
      >
        <el-form-item label="模板名称" prop="name">
          <el-input v-model="dialog.form.name" placeholder="请输入模板名称" />
        </el-form-item>

        <el-form-item label="模板编码" prop="code">
          <el-input
            v-model="dialog.form.code"
            placeholder="请输入模板编码"
            :disabled="dialog.isEdit"
          />
        </el-form-item>

        <el-form-item label="适用工单类型" prop="workorderTypes">
          <el-checkbox-group v-model="dialog.form.scope.workorderTypes">
            <el-checkbox label="维修" />
            <el-checkbox label="安装" />
            <el-checkbox label="巡检" />
            <el-checkbox label="配件销售" />
          </el-checkbox-group>
        </el-form-item>

        <el-form-item label="适用场景">
          <el-select
            v-model="dialog.form.scope.scenes"
            multiple
            placeholder="选择适用场景"
            style="width: 100%"
          >
            <el-option label="现场维修" value="现场维修" />
            <el-option label="返厂维修" value="返厂维修" />
            <el-option label="新装" value="新装" />
            <el-option label="移机" value="移机" />
            <el-option label="定期巡检" value="定期巡检" />
            <el-option label="专项巡检" value="专项巡检" />
          </el-select>
        </el-form-item>

        <el-form-item label="模板描述">
          <el-input
            v-model="dialog.form.description"
            type="textarea"
            :rows="3"
            placeholder="请输入模板描述"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialog.visible = false">取消</el-button>
        <el-button type="primary" @click="handleSave" :loading="dialog.loading">
          {{ dialog.isEdit ? '保存' : '创建' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 版本历史对话框 -->
    <el-dialog
      v-model="versionsDialog.visible"
      title="版本历史"
      width="700px"
    >
      <el-timeline>
        <el-timeline-item
          v-for="version in versionsDialog.versions"
          :key="version.metadata?.version"
          :type="version.metadata?.version === versionsDialog.currentVersion ? 'primary' : ''"
          :timestamp="formatDate(version.metadata?.createTime)"
        >
          <div class="version-item">
            <span class="version-number">v{{ version.metadata?.version }}</span>
            <span class="version-status">
              <el-tag
                :type="getStatusType(version.metadata?.status)"
                size="small"
              >
                {{ getStatusText(version.metadata?.status) }}
              </el-tag>
            </span>
            <el-button
              v-if="version.metadata?.version !== versionsDialog.currentVersion"
              type="primary"
              link
              size="small"
              @click="handleRestoreVersion(version)"
            >
              恢复此版本
            </el-button>
          </div>
        </el-timeline-item>
      </el-timeline>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Plus, Search, Upload, Document, Collection, Ticket, Clock,
  ArrowDown, View, CopyDocument, Promotion, Star, Download,
  Timer, Delete
} from '@element-plus/icons-vue'
import { useFieldTemplateStore } from '../stores/fieldTemplateStore'

const router = useRouter()
const fieldTemplateStore = useFieldTemplateStore()

// 状态
const searchKeyword = ref('')
const filterWorkorderType = ref('')
const filterStatus = ref('')
const formRef = ref(null)

// 对话框状态
const dialog = ref({
  visible: false,
  isEdit: false,
  loading: false,
  form: {
    name: '',
    code: '',
    description: '',
    scope: {
      workorderTypes: [],
      scenes: []
    }
  }
})

// 版本历史对话框
const versionsDialog = ref({
  visible: false,
  templateId: '',
  currentVersion: 1,
  versions: []
})

// 表单验证规则
const formRules = {
  name: [
    { required: true, message: '请输入模板名称', trigger: 'blur' }
  ],
  code: [
    { required: true, message: '请输入模板编码', trigger: 'blur' },
    { pattern: /^[A-Z][A-Z0-9_]*$/, message: '编码必须以大写字母开头，只能包含大写字母、数字和下划线', trigger: 'blur' }
  ],
  workorderTypes: [
    { required: true, message: '请选择适用工单类型', trigger: 'change', type: 'array' }
  ]
}

// 计算属性
const filteredTemplates = computed(() => {
  // 确保 templates 是数组
  let templates = fieldTemplateStore.allTemplates || []
  
  if (!Array.isArray(templates)) {
    console.warn('fieldTemplateStore.allTemplates is not an array:', templates)
    return []
  }

  // 关键词搜索
  if (searchKeyword.value) {
    const searched = fieldTemplateStore.searchTemplates(searchKeyword.value)
    templates = Array.isArray(searched) ? searched : []
  }

  // 工单类型筛选
  if (filterWorkorderType.value && Array.isArray(templates)) {
    templates = templates.filter(t =>
      t?.scope?.workorderTypes?.includes(filterWorkorderType.value)
    )
  }

  // 状态筛选
  if (filterStatus.value && Array.isArray(templates)) {
    templates = templates.filter(t =>
      t?.metadata?.status === filterStatus.value
    )
  }

  // 过滤掉无效的模板数据
  return templates.filter(t => t && t.id)
})

// 方法
const getStatusType = (status) => {
  const typeMap = {
    'draft': 'info',
    'active': 'success',
    'deprecated': 'danger'
  }
  return typeMap[status] || 'info'
}

const getStatusText = (status) => {
  const textMap = {
    'draft': '草稿',
    'active': '已发布',
    'deprecated': '已废弃'
  }
  return textMap[status] || status
}

const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleString('zh-CN')
}

const handleCreate = () => {
  dialog.value = {
    visible: true,
    isEdit: false,
    loading: false,
    form: {
      name: '',
      code: '',
      description: '',
      scope: {
        workorderTypes: [],
        scenes: []
      }
    }
  }
}

const handleEdit = (template) => {
  dialog.value = {
    visible: true,
    isEdit: true,
    loading: false,
    form: {
      id: template.id,
      name: template.name,
      code: template.code,
      description: template.description,
      scope: {
        workorderTypes: template.scope?.workorderTypes || [],
        scenes: template.scope?.scenes || []
      }
    }
  }
}

const handleDesign = (template) => {
  router.push({
    path: '/field-designer',
    query: { templateId: template.id, name: template.name }
  })
}

const handleSave = async () => {
  const valid = await formRef.value?.validate()
  if (!valid) return

  dialog.value.loading = true
  try {
    const templateData = {
      ...dialog.value.form,
      fields: dialog.value.isEdit
        ? fieldTemplateStore.getTemplateById(dialog.value.form.id)?.fields || []
        : []
    }

    await fieldTemplateStore.saveTemplate(templateData)
    ElMessage.success(dialog.value.isEdit ? '模板更新成功' : '模板创建成功')
    dialog.value.visible = false
  } catch (error) {
    ElMessage.error(error.message || '保存失败')
  } finally {
    dialog.value.loading = false
  }
}

const handlePreview = (template) => {
  // 打开预览对话框或新页面
  ElMessage.info(`预览模板: ${template.name}`)
}

const handleClone = async (template) => {
  try {
    await fieldTemplateStore.cloneTemplate(template.id)
    ElMessage.success('模板复制成功')
  } catch (error) {
    ElMessage.error(error.message || '复制失败')
  }
}

const handlePublish = async (template) => {
  try {
    await ElMessageBox.confirm(
      `确定要发布模板 "${template.name}" 吗？发布后将被用于实际业务。`,
      '确认发布',
      { type: 'warning' }
    )
    await fieldTemplateStore.publishTemplate(template.id)
    ElMessage.success('模板发布成功')
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '发布失败')
    }
  }
}

const handleSetDefault = async (template) => {
  try {
    await fieldTemplateStore.setDefaultTemplate(template.id)
    ElMessage.success('已设为默认模板')
  } catch (error) {
    ElMessage.error(error.message || '设置失败')
  }
}

const handleExport = (template) => {
  const config = fieldTemplateStore.exportTemplate(template.id)
  const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `template-${template.code}-${new Date().toISOString().split('T')[0]}.json`
  link.click()
  URL.revokeObjectURL(url)
  ElMessage.success('导出成功')
}

const handleVersions = (template) => {
  const versions = fieldTemplateStore.getTemplateVersions(template.id)
  versionsDialog.value = {
    visible: true,
    templateId: template.id,
    currentVersion: template.metadata?.version || 1,
    versions: [template, ...versions]
  }
}

const handleRestoreVersion = async (version) => {
  try {
    await ElMessageBox.confirm(
      `确定要恢复到 v${version.metadata?.version} 版本吗？`,
      '确认恢复',
      { type: 'warning' }
    )
    // 恢复版本逻辑
    ElMessage.success('版本恢复成功')
    versionsDialog.value.visible = false
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '恢复失败')
    }
  }
}

const handleDelete = async (template) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除模板 "${template.name}" 吗？此操作不可恢复。`,
      '确认删除',
      { type: 'danger' }
    )
    await fieldTemplateStore.deleteTemplate(template.id)
    ElMessage.success('模板删除成功')
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '删除失败')
    }
  }
}

const handleImport = () => {
  // 导入逻辑
  ElMessage.info('导入功能开发中')
}

onMounted(() => {
  fieldTemplateStore.loadTemplates()
})
</script>

<style scoped>
.field-template-manager {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-header h2 {
  margin: 0;
  color: #303133;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.filter-bar {
  display: flex;
  align-items: center;
  margin-bottom: 24px;
}

.template-list {
  margin-top: 20px;
}

.template-card {
  margin-bottom: 20px;
  transition: all 0.3s;
}

.template-card.is-default {
  border: 2px solid #67c23a;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.template-icon {
  width: 48px;
  height: 48px;
  background: #ecf5ff;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #409eff;
}

.template-status {
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: flex-end;
}

.default-tag {
  background: #f0f9eb;
  border-color: #e1f3d8;
}

.template-name {
  margin: 0 0 8px 0;
  font-size: 16px;
  color: #303133;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.template-desc {
  margin: 0 0 16px 0;
  font-size: 13px;
  color: #909399;
  height: 36px;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.template-meta {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 4px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #606266;
}

.card-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 12px;
  border-top: 1px solid #ebeef5;
}

.version-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.version-number {
  font-weight: 500;
  color: #303133;
}

.version-status {
  flex: 1;
}
</style>
