<template>
  <div class="report-template">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>报告模板管理</span>
          <el-button type="primary" @click="handleAdd">
            <el-icon><Plus /></el-icon>新增模板
          </el-button>
        </div>
      </template>

      <!-- 模板列表 -->
      <el-table :data="templates" style="width: 100%">
        <el-table-column prop="name" label="模板名称" min-width="150" />
        <el-table-column prop="type" label="模板类型" width="120">
          <template #default="{ row }">
            <el-tag>{{ TemplateTypeText[row.type] }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
        <el-table-column prop="isDefault" label="默认模板" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.isDefault" type="success">是</el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="updateTime" label="更新时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.updateTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" min-width="200" fixed="right">
          <template #default="{ row }">
            <div class="operation-buttons">
              <el-button type="primary" size="small" @click="handleEdit(row)">编辑</el-button>
              <el-button type="success" size="small" @click="handleConfig(row)">配置</el-button>
              <el-button
                v-if="!row.isDefault"
                type="warning"
                size="small"
                @click="handleSetDefault(row)"
              >
                设为默认
              </el-button>
              <el-button
                v-if="!row.isDefault"
                type="danger"
                size="small"
                @click="handleDelete(row)"
              >
                删除
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 新增/编辑模板对话框 -->
    <el-dialog
      v-model="dialog.visible"
      :title="dialog.isEdit ? '编辑模板' : '新增模板'"
      width="600px"
    >
      <el-form :model="dialog.form" label-width="100px">
        <el-form-item label="模板名称" required>
          <el-input v-model="dialog.form.name" placeholder="请输入模板名称" />
        </el-form-item>
        <el-form-item label="模板类型" required>
          <el-select v-model="dialog.form.type" style="width: 100%">
            <el-option 
              v-for="(text, type) in TemplateTypeText" 
              :key="type" 
              :label="text" 
              :value="type" 
            />
          </el-select>
        </el-form-item>
        <el-form-item label="描述">
          <el-input 
            v-model="dialog.form.description" 
            type="textarea" 
            :rows="3"
            placeholder="请输入模板描述"
          />
        </el-form-item>
        <el-form-item label="Excel模板">
          <el-upload
            class="excel-uploader"
            action="#"
            :auto-upload="false"
            :on-change="handleFileChange"
            :show-file-list="true"
            accept=".xlsx,.xls"
          >
            <el-button type="primary">
              <el-icon><Upload /></el-icon>选择Excel文件
            </el-button>
            <template #tip>
              <div class="el-upload__tip">
                请上传.xlsx或.xls格式的Excel模板文件
              </div>
            </template>
          </el-upload>
          <div v-if="dialog.form.excelFile" class="file-info">
            <el-icon><Document /></el-icon>
            <span>{{ dialog.form.excelFile.name }}</span>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialog.visible = false">取消</el-button>
        <el-button type="primary" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>

    <!-- 字段映射配置对话框 -->
    <el-dialog
      v-model="configDialog.visible"
      title="字段映射配置"
      width="900px"
    >
      <div v-if="configDialog.currentTemplate" class="config-content">
        <!-- 模板信息 -->
        <el-descriptions :column="2" border>
          <el-descriptions-item label="模板名称">
            {{ configDialog.currentTemplate.name }}
          </el-descriptions-item>
          <el-descriptions-item label="模板类型">
            {{ TemplateTypeText[configDialog.currentTemplate.type] }}
          </el-descriptions-item>
        </el-descriptions>

        <!-- 字段映射配置 -->
        <div class="mapping-section">
          <div class="section-header">
            <h4>字段映射</h4>
            <el-button type="primary" size="small" @click="handleAddMapping">
              <el-icon><Plus /></el-icon>添加映射
            </el-button>
          </div>
          
          <el-table :data="configDialog.mappings" style="width: 100%">
            <el-table-column label="字段" min-width="150">
              <template #default="{ row, $index }">
                <el-select v-model="row.field" placeholder="选择字段">
                  <el-option 
                    v-for="(config, field) in AvailableFields" 
                    :key="field"
                    :label="config.label"
                    :value="field"
                  />
                </el-select>
              </template>
            </el-table-column>
            <el-table-column label="单元格位置" width="150">
              <template #default="{ row }">
                <el-input v-model="row.cellRef" placeholder="如: A1, B2" />
              </template>
            </el-table-column>
            <el-table-column label="数据类型" width="120">
              <template #default="{ row }">
                <el-select v-model="row.type" placeholder="类型">
                  <el-option label="文本" value="text" />
                  <el-option label="日期" value="date" />
                  <el-option label="日期时间" value="datetime" />
                  <el-option label="数字" value="number" />
                  <el-option label="图片" value="image" />
                  <el-option label="多行文本" value="textarea" />
                </el-select>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="80">
              <template #default="{ $index }">
                <el-button type="danger" size="small" @click="handleRemoveMapping($index)">
                  <el-icon><Delete /></el-icon>
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <!-- 表格配置 -->
        <div class="table-config-section">
          <div class="section-header">
            <h4>动态表格配置（用于配件列表等）</h4>
            <el-button type="primary" size="small" @click="handleAddTableConfig">
              <el-icon><Plus /></el-icon>添加表格
            </el-button>
          </div>
          
          <div v-for="(table, index) in configDialog.tableConfigs" :key="index" class="table-config-item">
            <el-card>
              <template #header>
                <div class="table-config-header">
                  <span>表格 {{ index + 1 }}</span>
                  <el-button type="danger" size="small" @click="handleRemoveTableConfig(index)">
                    <el-icon><Delete /></el-icon>
                  </el-button>
                </div>
              </template>
              <el-form :model="table" label-width="100px">
                <el-form-item label="数据字段">
                  <el-select v-model="table.name" placeholder="选择数据字段">
                    <el-option label="配件清单" value="parts" />
                  </el-select>
                </el-form-item>
                <el-form-item label="起始单元格">
                  <el-input v-model="table.startCell" placeholder="如: A12" />
                </el-form-item>
                <el-form-item label="列配置">
                  <div v-for="(col, colIndex) in table.columns" :key="colIndex" class="column-config">
                    <el-input v-model="col.field" placeholder="字段名" style="width: 120px" />
                    <el-input v-model="col.header" placeholder="表头名称" style="width: 150px; margin-left: 10px" />
                    <el-button type="danger" size="small" @click="handleRemoveColumn(index, colIndex)">
                      <el-icon><Delete /></el-icon>
                    </el-button>
                  </div>
                  <el-button type="primary" size="small" @click="handleAddColumn(index)">
                    <el-icon><Plus /></el-icon>添加列
                  </el-button>
                </el-form-item>
              </el-form>
            </el-card>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="configDialog.visible = false">取消</el-button>
        <el-button type="primary" @click="handleSaveConfig">保存配置</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Upload, Document, Delete } from '@element-plus/icons-vue'
import {
  reportTemplates,
  TemplateTypeText,
  AvailableFields,
  addTemplate,
  updateTemplate,
  deleteTemplate,
  setDefaultTemplate,
  uploadExcelFile
} from '../stores/reportTemplateStore.js'

// 模板列表
const templates = ref([])

// 对话框状态
const dialog = reactive({
  visible: false,
  isEdit: false,
  form: {
    id: null,
    name: '',
    type: 'service_report',
    description: '',
    excelFile: null
  },
  tempFile: null
})

// 配置对话框状态
const configDialog = reactive({
  visible: false,
  currentTemplate: null,
  mappings: [],
  tableConfigs: []
})

// 初始化
onMounted(() => {
  loadTemplates()
})

// 加载模板列表
const loadTemplates = () => {
  templates.value = reportTemplates.value
}

// 格式化日期
const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleString('zh-CN')
}

// 新增模板
const handleAdd = () => {
  dialog.isEdit = false
  dialog.form = {
    id: null,
    name: '',
    type: 'service_report',
    description: '',
    excelFile: null
  }
  dialog.tempFile = null
  dialog.visible = true
}

// 编辑模板
const handleEdit = (row) => {
  dialog.isEdit = true
  dialog.form = {
    id: row.id,
    name: row.name,
    type: row.type,
    description: row.description,
    excelFile: row.excelFile
  }
  dialog.tempFile = null
  dialog.visible = true
}

// 文件选择变化
const handleFileChange = (file) => {
  dialog.tempFile = file.raw
}

// 保存模板
const handleSave = async () => {
  if (!dialog.form.name) {
    ElMessage.warning('请输入模板名称')
    return
  }
  
  try {
    // 如果有新文件，先上传
    if (dialog.tempFile) {
      if (dialog.isEdit) {
        await uploadExcelFile(dialog.tempFile, dialog.form.id)
      } else {
        // 新增时先创建模板，再上传文件
        const newTemplate = addTemplate({
          name: dialog.form.name,
          type: dialog.form.type,
          description: dialog.form.description
        })
        await uploadExcelFile(dialog.tempFile, newTemplate.id)
      }
    } else if (dialog.isEdit) {
      // 更新模板信息
      updateTemplate(dialog.form.id, {
        name: dialog.form.name,
        type: dialog.form.type,
        description: dialog.form.description
      })
    } else {
      // 新增模板
      addTemplate({
        name: dialog.form.name,
        type: dialog.form.type,
        description: dialog.form.description
      })
    }
    
    ElMessage.success(dialog.isEdit ? '更新成功' : '添加成功')
    dialog.visible = false
    loadTemplates()
  } catch (error) {
    ElMessage.error('保存失败: ' + error.message)
  }
}

// 删除模板
const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm('确认删除该模板吗？', '提示', { type: 'warning' })
    if (deleteTemplate(row.id)) {
      ElMessage.success('删除成功')
      loadTemplates()
    } else {
      ElMessage.warning('默认模板不能删除')
    }
  } catch {
    // 用户取消
  }
}

// 设为默认模板
const handleSetDefault = (row) => {
  if (setDefaultTemplate(row.id)) {
    ElMessage.success('已设为默认模板')
    loadTemplates()
  }
}

// 打开字段映射配置
const handleConfig = (row) => {
  configDialog.currentTemplate = row
  configDialog.mappings = row.fieldMappings ? [...row.fieldMappings] : []
  configDialog.tableConfigs = row.tableConfigs ? [...row.tableConfigs] : []
  configDialog.visible = true
}

// 添加字段映射
const handleAddMapping = () => {
  configDialog.mappings.push({
    field: '',
    cellRef: '',
    type: 'text'
  })
}

// 移除字段映射
const handleRemoveMapping = (index) => {
  configDialog.mappings.splice(index, 1)
}

// 添加表格配置
const handleAddTableConfig = () => {
  configDialog.tableConfigs.push({
    name: '',
    startCell: '',
    columns: []
  })
}

// 移除表格配置
const handleRemoveTableConfig = (index) => {
  configDialog.tableConfigs.splice(index, 1)
}

// 添加列配置
const handleAddColumn = (tableIndex) => {
  configDialog.tableConfigs[tableIndex].columns.push({
    field: '',
    header: ''
  })
}

// 移除列配置
const handleRemoveColumn = (tableIndex, colIndex) => {
  configDialog.tableConfigs[tableIndex].columns.splice(colIndex, 1)
}

// 保存配置
const handleSaveConfig = () => {
  if (!configDialog.currentTemplate) return
  
  updateTemplate(configDialog.currentTemplate.id, {
    fieldMappings: configDialog.mappings,
    tableConfigs: configDialog.tableConfigs
  })
  
  ElMessage.success('配置保存成功')
  configDialog.visible = false
  loadTemplates()
}
</script>

<style scoped>
.report-template {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.excel-uploader {
  display: inline-block;
}

.file-info {
  margin-top: 10px;
  padding: 8px 12px;
  background-color: #f5f7fa;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.config-content {
  max-height: 600px;
  overflow-y: auto;
}

.mapping-section,
.table-config-section {
  margin-top: 20px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.section-header h4 {
  margin: 0;
  font-size: 16px;
  color: #303133;
}

.table-config-item {
  margin-bottom: 15px;
}

.table-config-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.column-config {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

/* 操作按钮样式 */
.operation-buttons {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: nowrap;
}

.operation-buttons .el-button {
  padding: 4px 8px;
  font-size: 12px;
  height: 24px;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .report-template {
    padding: 10px;
  }
  
  .card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .column-config {
    flex-direction: column;
    align-items: stretch;
  }
  
  .column-config .el-input {
    width: 100% !important;
    margin-left: 0 !important;
  }
}
</style>
