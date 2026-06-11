<template>
  <div class="workflow-config">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2>流程配置管理</h2>
      <el-button type="primary" @click="handleCreateTemplate">
        <el-icon><Plus /></el-icon>
        新建流程模板
      </el-button>
    </div>

    <!-- 模板列表 -->
    <el-row :gutter="20" class="template-list">
      <el-col 
        v-for="template in workflowStore.flowTemplates" 
        :key="template.id"
        :xs="24" :sm="12" :md="8" :lg="6"
      >
        <el-card 
          class="template-card" 
          :class="{ 'is-default': template.isDefault }"
          shadow="hover"
        >
          <template #header>
            <div class="template-header">
              <div class="template-title">
                <el-tag v-if="template.isDefault" size="small" type="success">默认</el-tag>
                <span>{{ template.name }}</span>
              </div>
              <el-dropdown @command="handleCommand($event, template)">
                <el-icon class="more-icon"><MoreFilled /></el-icon>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="edit">编辑</el-dropdown-item>
                    <el-dropdown-item command="copy">复制</el-dropdown-item>
                    <el-dropdown-item command="setDefault" v-if="!template.isDefault">设为默认</el-dropdown-item>
                    <el-dropdown-item command="delete" divided type="danger">删除</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </template>
          
          <div class="template-content">
            <div class="template-info">
              <p><strong>编码:</strong> {{ template.code }}</p>
              <p><strong>版本:</strong> {{ template.version }}</p>
              <p><strong>适用类型:</strong> {{ template.workorderTypes?.join(', ') || '-' }}</p>
              <p><strong>适用场景:</strong> {{ template.scenes?.join(', ') || '-' }}</p>
            </div>
            
            <div class="template-stats">
              <el-tag size="small">{{ template.nodes?.length || 0 }} 个节点</el-tag>
              <el-tag size="small" :type="template.status === 'active' ? 'success' : 'info'">
                {{ template.status === 'active' ? '已启用' : '已停用' }}
              </el-tag>
            </div>
            
            <p class="template-desc">{{ template.description }}</p>
          </div>
          
          <div class="template-footer">
            <el-button type="primary" plain size="small" @click="handleEditTemplate(template)">
              配置流程
            </el-button>
            <el-button size="small" @click="handlePreviewTemplate(template)">
              预览
            </el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 模板编辑对话框 -->
    <el-dialog
      v-model="editDialog.visible"
      :title="editDialog.isEdit ? '编辑流程模板' : '新建流程模板'"
      width="800px"
      destroy-on-close
    >
      <el-form ref="templateFormRef" :model="editDialog.form" :rules="templateRules" label-width="100px">
        <el-form-item label="模板名称" prop="name">
          <el-input v-model="editDialog.form.name" placeholder="请输入模板名称" />
        </el-form-item>
        
        <el-form-item label="模板编码" prop="code">
          <el-input 
            v-model="editDialog.form.code" 
            placeholder="请输入模板编码"
            :disabled="editDialog.isEdit"
          />
        </el-form-item>
        
        <el-form-item label="适用类型" prop="workorderTypes">
          <el-checkbox-group v-model="editDialog.form.workorderTypes">
            <el-checkbox label="维修" value="维修" />
            <el-checkbox label="安装" value="安装" />
            <el-checkbox label="巡检" value="巡检" />
            <el-checkbox label="配件销售" value="配件销售" />
          </el-checkbox-group>
        </el-form-item>
        
        <el-form-item label="适用场景" prop="scenes">
          <el-select
            v-model="editDialog.form.scenes"
            multiple
            placeholder="请选择适用场景"
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
        
        <el-form-item label="描述" prop="description">
          <el-input 
            v-model="editDialog.form.description" 
            type="textarea" 
            :rows="3"
            placeholder="请输入模板描述"
          />
        </el-form-item>
        
        <el-form-item label="设为默认">
          <el-switch v-model="editDialog.form.isDefault" />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="editDialog.visible = false">取消</el-button>
        <el-button type="primary" @click="saveTemplate">保存</el-button>
      </template>
    </el-dialog>

    <!-- 流程节点配置对话框 -->
    <el-dialog
      v-model="nodeDialog.visible"
      title="配置流程节点"
      width="1000px"
      top="5vh"
      destroy-on-close
    >
      <div class="node-config-container">
        <!-- 左侧节点列表 -->
        <div class="node-list">
          <div class="node-list-header">
            <h4>流程节点</h4>
            <el-button type="primary" size="small" @click="handleAddNode">
              <el-icon><Plus /></el-icon>
              添加节点
            </el-button>
          </div>
          
          <el-timeline>
            <el-timeline-item
              v-for="(node, index) in nodeDialog.nodes"
              :key="node.id"
              :type="getNodeTypeColor(node.type)"
              :timestamp="node.name"
              placement="top"
            >
              <el-card 
                shadow="hover" 
                class="node-item"
                :class="{ 'is-active': nodeDialog.currentNode?.id === node.id }"
                @click="selectNode(node)"
              >
                <div class="node-item-content">
                  <div class="node-code">{{ node.code }}</div>
                  <div class="node-actions-count">
                    {{ node.actions?.length || 0 }} 个操作
                  </div>
                  <el-icon class="delete-icon" @click.stop="removeNode(index)"><Delete /></el-icon>
                </div>
              </el-card>
            </el-timeline-item>
          </el-timeline>
        </div>
        
        <!-- 右侧节点配置 -->
        <div class="node-config" v-if="nodeDialog.currentNode">
          <h4>节点配置: {{ nodeDialog.currentNode.name }}</h4>
          
          <el-form :model="nodeDialog.currentNode" label-width="100px">
            <el-form-item label="节点编码">
              <el-input v-model="nodeDialog.currentNode.code" disabled />
            </el-form-item>
            
            <el-form-item label="节点名称">
              <el-input v-model="nodeDialog.currentNode.name" />
            </el-form-item>
            
            <el-form-item label="节点类型">
              <el-select v-model="nodeDialog.currentNode.type" disabled>
                <el-option label="开始节点" value="start" />
                <el-option label="任务节点" value="task" />
                <el-option label="网关节点" value="gateway" />
                <el-option label="结束节点" value="end" />
              </el-select>
            </el-form-item>
            
            <el-form-item label="节点描述">
              <el-input 
                v-model="nodeDialog.currentNode.description" 
                type="textarea" 
                :rows="2"
              />
            </el-form-item>
            
            <el-divider>操作配置</el-divider>
            
            <div class="actions-list">
              <div
                v-for="(action, actionIndex) in nodeDialog.currentNode.actions"
                :key="actionIndex"
                class="action-item"
              >
                <el-card shadow="never">
                  <template #header>
                    <div class="action-header">
                      <span>操作 {{ actionIndex + 1 }}</span>
                      <el-icon class="delete-icon" @click="removeAction(actionIndex)"><Delete /></el-icon>
                    </div>
                  </template>
                  
                  <el-form :model="action" label-width="80px" size="small">
                    <el-form-item label="操作编码">
                      <el-input v-model="action.code" placeholder="如: dispatch" />
                    </el-form-item>
                    
                    <el-form-item label="操作名称">
                      <el-input v-model="action.label" placeholder="如: 派单" />
                    </el-form-item>
                    
                    <el-form-item label="按钮类型">
                      <el-select v-model="action.type">
                        <el-option label="默认" value="default" />
                        <el-option label="主要" value="primary" />
                        <el-option label="成功" value="success" />
                        <el-option label="警告" value="warning" />
                        <el-option label="危险" value="danger" />
                      </el-select>
                    </el-form-item>
                    
                    <el-form-item label="下一节点">
                      <el-select v-model="action.nextNode">
                        <el-option
                          v-for="node in nodeDialog.nodes"
                          :key="node.code"
                          :label="node.name"
                          :value="node.code"
                        />
                      </el-select>
                    </el-form-item>
                    
                    <el-form-item label="执行角色">
                      <el-checkbox-group v-model="action.roles">
                        <el-checkbox label="系统管理员" value="系统管理员" />
                        <el-checkbox label="业务助理" value="业务助理" />
                        <el-checkbox label="工程师" value="工程师" />
                        <el-checkbox label="课长" value="课长" />
                        <el-checkbox label="客户" value="客户" />
                      </el-checkbox-group>
                    </el-form-item>
                    
                    <el-form-item label="表单字段">
                      <el-select
                        v-model="action.formFields"
                        multiple
                        placeholder="选择需要填写的字段"
                      >
                        <el-option-group label="基础字段">
                          <el-option label="备注" value="remark" />
                          <el-option label="优先级" value="priority" />
                        </el-option-group>
                        <el-option-group label="工程师相关">
                          <el-option label="指派工程师" value="engineer" />
                          <el-option label="新工程师" value="newEngineer" />
                          <el-option label="转派原因" value="transferReason" />
                          <el-option label="拒单原因" value="rejectReason" />
                        </el-option-group>
                        <el-option-group label="现场相关">
                          <el-option label="到场时间" value="arriveTime" />
                          <el-option label="位置" value="location" />
                          <el-option label="现场照片" value="photos" />
                        </el-option-group>
                        <el-option-group label="服务相关">
                          <el-option label="故障描述" value="faultDescription" />
                          <el-option label="处理措施" value="solution" />
                          <el-option label="更换配件" value="parts" />
                          <el-option label="服务日期" value="serviceDate" />
                        </el-option-group>
                        <el-option-group label="完工相关">
                          <el-option label="完工时间" value="completeTime" />
                          <el-option label="作业内容" value="workContent" />
                          <el-option label="工时" value="duration" />
                        </el-option-group>
                        <el-option-group label="签字相关">
                          <el-option label="电子签名" value="signature" />
                          <el-option label="支付方式" value="paymentMethod" />
                        </el-option-group>
                        <el-option-group label="评价相关">
                          <el-option label="服务评分" value="rating" />
                          <el-option label="评价内容" value="comment" />
                        </el-option-group>
                        <el-option-group label="结算相关">
                          <el-option label="人工费用" value="laborCost" />
                          <el-option label="配件费用" value="partsCost" />
                          <el-option label="合计金额" value="totalAmount" />
                        </el-option-group>
                      </el-select>
                    </el-form-item>
                    
                    <el-form-item label="确认提示">
                      <el-input 
                        v-model="action.confirmMessage" 
                        placeholder="执行前显示的确认信息"
                      />
                    </el-form-item>
                  </el-form>
                </el-card>
              </div>
              
              <el-button type="primary" plain @click="handleAddAction">
                <el-icon><Plus /></el-icon>
                添加操作
              </el-button>
            </div>
          </el-form>
        </div>
        
        <div class="node-config-empty" v-else>
          <el-empty description="请选择或添加节点进行配置" />
        </div>
      </div>
      
      <template #footer>
        <el-button @click="nodeDialog.visible = false">取消</el-button>
        <el-button type="primary" @click="saveNodes">保存节点配置</el-button>
      </template>
    </el-dialog>

    <!-- 流程预览对话框 -->
    <el-dialog
      v-model="previewDialog.visible"
      title="流程预览"
      width="900px"
    >
      <div class="flow-preview-content">
        <el-steps direction="vertical" :active="999">
          <el-step
            v-for="(node, index) in previewDialog.template?.nodes"
            :key="node.code"
            :title="node.name"
            :description="node.description"
          >
            <template #icon>
              <el-icon :size="20" :color="getNodeIconColor(node.type)">
                <component :is="getNodeIcon(node.type)" />
              </el-icon>
            </template>
            
            <div class="node-preview-actions">
              <el-tag
                v-for="action in node.actions"
                :key="action.code"
                :type="action.type || 'info'"
                size="small"
                class="action-tag"
              >
                {{ action.label }}
              </el-tag>
            </div>
          </el-step>
        </el-steps>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  Plus, MoreFilled, Delete, 
  CircleCheck, Timer, Warning, CircleClose 
} from '@element-plus/icons-vue'
import { useWorkflowConfigStore, NodeType } from '../stores/workflowConfigStore'

const workflowStore = useWorkflowConfigStore()
const templateFormRef = ref(null)

// 模板表单验证规则
const templateRules = {
  name: [{ required: true, message: '请输入模板名称', trigger: 'blur' }],
  code: [{ required: true, message: '请输入模板编码', trigger: 'blur' }],
  workorderTypes: [{ required: true, message: '请选择适用类型', trigger: 'change', type: 'array' }]
}

// 编辑对话框状态
const editDialog = reactive({
  visible: false,
  isEdit: false,
  templateId: null,
  form: {
    name: '',
    code: '',
    workorderTypes: [],
    scenes: [],
    description: '',
    isDefault: false
  }
})

// 节点配置对话框状态
const nodeDialog = reactive({
  visible: false,
  templateId: null,
  nodes: [],
  currentNode: null
})

// 预览对话框状态
const previewDialog = reactive({
  visible: false,
  template: null
})

// ==================== 方法 ====================

// 创建新模板
const handleCreateTemplate = () => {
  editDialog.isEdit = false
  editDialog.templateId = null
  editDialog.form = {
    name: '',
    code: '',
    workorderTypes: [],
    scenes: [],
    description: '',
    isDefault: false
  }
  editDialog.visible = true
}

// 编辑模板
const handleEditTemplate = (template) => {
  editDialog.isEdit = true
  editDialog.templateId = template.id
  editDialog.form = {
    name: template.name,
    code: template.code,
    workorderTypes: Array.isArray(template.workorderTypes) ? [...template.workorderTypes] : [],
    scenes: Array.isArray(template.scenes) ? [...template.scenes] : [],
    description: template.description,
    isDefault: template.isDefault
  }
  editDialog.visible = true
}

// 保存模板
const saveTemplate = async () => {
  const valid = await templateFormRef.value?.validate()
  if (!valid) return
  
  const templateData = {
    ...editDialog.form,
    id: editDialog.isEdit ? editDialog.templateId : undefined,
    nodes: editDialog.isEdit 
      ? workflowStore.getTemplateById(editDialog.templateId)?.nodes || []
      : generateDefaultNodes()
  }
  
  try {
    if (editDialog.isEdit) {
      await workflowStore.saveTemplate(templateData)
      ElMessage.success('模板更新成功')
    } else {
      await workflowStore.addTemplate(templateData)
      ElMessage.success('模板创建成功')
    }
    editDialog.visible = false
  } catch (error) {
    ElMessage.error(error.message || '保存失败')
  }
}

// 生成默认节点
const generateDefaultNodes = () => {
  return [
    {
      id: 'node_created',
      code: 'CREATED',
      name: '已创建',
      type: NodeType.START,
      description: '工单已创建',
      actions: [
        { code: 'dispatch', label: '派单', type: 'primary', nextNode: 'DISPATCHED', roles: ['调度员'] }
      ]
    },
    {
      id: 'node_finished',
      code: 'FINISHED',
      name: '已完成',
      type: NodeType.END,
      description: '工单流程已结束',
      actions: []
    }
  ]
}

// 处理下拉菜单命令
const handleCommand = (command, template) => {
  switch (command) {
    case 'edit':
      handleEditTemplate(template)
      break
    case 'copy':
      handleCopyTemplate(template)
      break
    case 'setDefault':
      handleSetDefault(template)
      break
    case 'delete':
      handleDeleteTemplate(template)
      break
  }
}

// 复制模板
const handleCopyTemplate = (template) => {
  const newTemplate = {
    ...template,
    id: undefined,
    code: `${template.code}_COPY`,
    name: `${template.name} (复制)`,
    isDefault: false,
    version: '1.0.0'
  }
  workflowStore.addTemplate(newTemplate)
  ElMessage.success('模板复制成功')
}

// 设为默认
const handleSetDefault = (template) => {
  // 取消其他同类型模板的默认状态
  workflowStore.flowTemplates.forEach(t => {
    if (t.workorderTypes.some(type => template.workorderTypes.includes(type))) {
      t.isDefault = false
    }
  })
  // 设置当前为默认
  template.isDefault = true
  ElMessage.success('已设为默认模板')
}

// 删除模板
const handleDeleteTemplate = async (template) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除流程模板 "${template.name}" 吗？`,
      '确认删除',
      { type: 'warning' }
    )
    await workflowStore.deleteTemplate(template.id)
    ElMessage.success('模板删除成功')
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '删除失败')
    }
  }
}

// 配置节点
const handleConfigNodes = (template) => {
  nodeDialog.templateId = template.id
  nodeDialog.nodes = JSON.parse(JSON.stringify(template.nodes))
  nodeDialog.currentNode = nodeDialog.nodes[0] || null
  nodeDialog.visible = true
}

// 选择节点
const selectNode = (node) => {
  nodeDialog.currentNode = node
}

// 添加节点
const handleAddNode = () => {
  const newNode = {
    id: `node_${Date.now()}`,
    code: `NODE_${nodeDialog.nodes.length + 1}`,
    name: `新节点 ${nodeDialog.nodes.length + 1}`,
    type: NodeType.TASK,
    description: '',
    actions: []
  }
  nodeDialog.nodes.push(newNode)
  nodeDialog.currentNode = newNode
}

// 删除节点
const removeNode = (index) => {
  if (nodeDialog.nodes.length <= 2) {
    ElMessage.warning('至少需要保留开始和结束节点')
    return
  }
  nodeDialog.nodes.splice(index, 1)
  if (nodeDialog.currentNode?.id === nodeDialog.nodes[index]?.id) {
    nodeDialog.currentNode = nodeDialog.nodes[0]
  }
}

// 添加操作
const handleAddAction = () => {
  if (!nodeDialog.currentNode) return
  
  if (!nodeDialog.currentNode.actions) {
    nodeDialog.currentNode.actions = []
  }
  
  nodeDialog.currentNode.actions.push({
    code: '',
    label: '',
    type: 'primary',
    nextNode: '',
    roles: [],
    formFields: []
  })
}

// 删除操作
const removeAction = (index) => {
  nodeDialog.currentNode.actions.splice(index, 1)
}

// 保存节点配置
const saveNodes = async () => {
  try {
    workflowStore.updateTemplateNodes(nodeDialog.templateId, nodeDialog.nodes)
    ElMessage.success('节点配置保存成功')
    nodeDialog.visible = false
  } catch (error) {
    ElMessage.error(error.message || '保存失败')
  }
}

// 预览模板
const handlePreviewTemplate = (template) => {
  previewDialog.template = template
  previewDialog.visible = true
}

// 获取节点类型颜色
const getNodeTypeColor = (type) => {
  const colorMap = {
    [NodeType.START]: 'primary',
    [NodeType.TASK]: 'warning',
    [NodeType.GATEWAY]: 'danger',
    [NodeType.END]: 'success'
  }
  return colorMap[type] || 'info'
}

// 获取节点图标
const getNodeIcon = (type) => {
  const iconMap = {
    [NodeType.START]: CircleCheck,
    [NodeType.TASK]: Timer,
    [NodeType.GATEWAY]: Warning,
    [NodeType.END]: CircleClose
  }
  return iconMap[type] || CircleCheck
}

// 获取节点图标颜色
const getNodeIconColor = (type) => {
  const colorMap = {
    [NodeType.START]: '#409EFF',
    [NodeType.TASK]: '#E6A23C',
    [NodeType.GATEWAY]: '#F56C6C',
    [NodeType.END]: '#67C23A'
  }
  return colorMap[type] || '#909399'
}
</script>

<style scoped>
.workflow-config {
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

.template-list {
  margin-top: 20px;
}

.template-card {
  margin-bottom: 20px;
  transition: all 0.3s;
}

.template-card:hover {
  transform: translateY(-4px);
}

.template-card.is-default {
  border: 2px solid #67C23A;
}

.template-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.template-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}

.more-icon {
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: background 0.3s;
}

.more-icon:hover {
  background: #f5f7fa;
}

.template-content {
  min-height: 120px;
}

.template-info {
  margin-bottom: 12px;
}

.template-info p {
  margin: 4px 0;
  font-size: 13px;
  color: #606266;
}

.template-stats {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.template-desc {
  font-size: 13px;
  color: #909399;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.template-footer {
  display: flex;
  gap: 8px;
  margin-top: 16px;
}

.node-config-container {
  display: flex;
  gap: 20px;
  height: 600px;
}

.node-list {
  width: 280px;
  border-right: 1px solid #e4e7ed;
  padding-right: 20px;
  overflow-y: auto;
}

.node-list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.node-list-header h4 {
  margin: 0;
}

.node-item {
  cursor: pointer;
  transition: all 0.3s;
}

.node-item:hover,
.node-item.is-active {
  border-color: #409EFF;
  background: #ecf5ff;
}

.node-item-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.node-code {
  font-size: 12px;
  color: #909399;
}

.node-actions-count {
  font-size: 12px;
  color: #409EFF;
}

.delete-icon {
  cursor: pointer;
  color: #f56c6c;
  padding: 4px;
}

.delete-icon:hover {
  background: #fef0f0;
  border-radius: 4px;
}

.node-config {
  flex: 1;
  overflow-y: auto;
  padding-left: 20px;
}

.node-config h4 {
  margin: 0 0 20px 0;
  color: #303133;
}

.node-config-empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.actions-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.action-item {
  margin-bottom: 8px;
}

.action-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 500;
}

.flow-preview-content {
  max-height: 600px;
  overflow-y: auto;
  padding: 20px;
}

.node-preview-actions {
  margin-top: 8px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.action-tag {
  margin-right: 0;
}
</style>
