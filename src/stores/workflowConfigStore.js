import { ref, computed } from 'vue'
import { workflowTemplateApi, formConfigApi } from '../api/workflowApi'

/**
 * 工单流程配置管理 Store
 * 提供流程模板的管理、节点配置、流转规则等功能
 * 
 * 注意：当前实现同时支持API调用和本地数据，如果API不可用会自动降级到本地数据
 */

// ==================== 流程节点类型定义 ====================
export const NodeType = {
  START: 'start',           // 开始节点
  TASK: 'task',             // 任务节点
  GATEWAY: 'gateway',       // 网关节点（条件分支）
  END: 'end'                // 结束节点
}

// ==================== 工单类型定义 ====================
export const WorkorderType = {
  REPAIR: '维修',
  INSTALL: '安装',
  INSPECTION: '巡检',
  PARTS_SALE: '配件销售'
}

// ==================== 默认流程模板 ====================
export const DefaultFlowTemplates = [
  {
    id: 'flow_repair_standard',
    code: 'REPAIR_STANDARD',
    name: '标准维修流程',
    version: '1.0.0',
    description: '标准设备维修服务流程，适用于现场维修场景',
    workorderTypes: ['维修'],
    scenes: ['现场维修', '返厂维修'],
    isDefault: true,
    status: 'active',
    config: {
      allowCancel: true,
      cancelableNodes: ['CREATED', 'DISPATCHED'],
      allowTransfer: true,
      allowRollback: false,
      autoReminder: true,
      reminderInterval: 1800
    },
    nodes: [
      {
        id: 'node_created',
        code: 'CREATED',
        name: '已创建',
        type: NodeType.START,
        description: '工单已创建，等待派单',
        formConfig: null,
        actions: [
          { 
            code: 'dispatch', 
            label: '派单', 
            type: 'primary',
            nextNode: 'DISPATCHED',
            roles: ['调度员', '管理员'],
            confirmMessage: '确定要派单吗？',
            formFields: ['engineer', 'priority', 'remark']
          },
          { 
            code: 'cancel', 
            label: '取消工单', 
            type: 'danger',
            nextNode: 'CANCELLED',
            confirmMessage: '确定要取消该工单吗？取消后不可恢复。'
          }
        ],
        fields: ['type', 'customerId', 'assetSerialNumber', 'description']
      },
      {
        id: 'node_dispatched',
        code: 'DISPATCHED',
        name: '已派单',
        type: NodeType.TASK,
        description: '工单已派发给工程师',
        assignType: 'manual',
        assignRules: { role: ['工程师'] },
        timeout: 3600,
        timeoutAction: 'autoRemind',
        actions: [
          { 
            code: 'accept', 
            label: '接单', 
            type: 'success',
            nextNode: 'ACCEPTED',
            roles: ['工程师'],
            confirmMessage: '确定接受该工单吗？'
          },
          { 
            code: 'reject', 
            label: '拒单', 
            type: 'warning',
            nextNode: 'CREATED',
            roles: ['工程师'],
            confirmMessage: '确定要拒单吗？工单将退回待派单状态。',
            formFields: ['rejectReason']
          },
          { 
            code: 'transfer', 
            label: '转派', 
            type: 'primary',
            nextNode: 'DISPATCHED',
            roles: ['调度员'],
            formFields: ['newEngineer', 'transferReason']
          }
        ]
      },
      {
        id: 'node_accepted',
        code: 'ACCEPTED',
        name: '已接单',
        type: NodeType.TASK,
        description: '工程师已接单，等待到场',
        assignType: 'auto',
        assignRules: { fromPrevNode: true },
        timeout: 7200,
        actions: [
          { 
            code: 'arrive', 
            label: '到场打卡', 
            type: 'primary',
            nextNode: 'ARRIVED',
            roles: ['工程师'],
            formFields: ['arriveTime', 'location', 'photos'],
            needLocation: true
          }
        ]
      },
      {
        id: 'node_arrived',
        code: 'ARRIVED',
        name: '到场打卡',
        type: NodeType.TASK,
        description: '工程师已到达现场',
        actions: [
          { 
            code: 'startWork', 
            label: '开始作业', 
            type: 'warning',
            nextNode: 'WORKING',
            roles: ['工程师']
          }
        ]
      },
      {
        id: 'node_working',
        code: 'WORKING',
        name: '作业中',
        type: NodeType.TASK,
        description: '工程师正在进行维修作业',
        actions: [
          { 
            code: 'createReport', 
            label: '制作服务报告', 
            type: 'primary',
            nextNode: 'REPORT_CREATED',
            roles: ['工程师'],
            formFields: ['faultDescription', 'solution', 'parts', 'serviceDate']
          },
          { 
            code: 'needQuote', 
            label: '需要报价', 
            type: 'info',
            nextNode: 'QUOTING',
            roles: ['工程师'],
            condition: '{{needQuote === true}}'
          }
        ]
      },
      {
        id: 'node_quoting',
        code: 'QUOTING',
        name: '报价中',
        type: NodeType.TASK,
        description: '等待客户确认报价',
        actions: [
          { 
            code: 'quoteApproved', 
            label: '报价已确认', 
            type: 'success',
            nextNode: 'WORKING',
            condition: '{{quoteStatus === "approved"}}'
          },
          { 
            code: 'quoteRejected', 
            label: '报价被拒绝', 
            type: 'danger',
            nextNode: 'COMPLETED',
            condition: '{{quoteStatus === "rejected"}}'
          }
        ]
      },
      {
        id: 'node_report_created',
        code: 'REPORT_CREATED',
        name: '报告待签字',
        type: NodeType.TASK,
        description: '服务报告已创建，等待客户签字',
        actions: [
          { 
            code: 'signReport', 
            label: '客户签字', 
            type: 'success',
            nextNode: 'REPORT_SIGNED',
            roles: ['客户', '工程师'],
            formFields: ['signature', 'signTime']
          }
        ]
      },
      {
        id: 'node_report_signed',
        code: 'REPORT_SIGNED',
        name: '报告已签字',
        type: NodeType.TASK,
        description: '客户已确认服务报告',
        actions: [
          { 
            code: 'complete', 
            label: '完工打卡', 
            type: 'success',
            nextNode: 'COMPLETED',
            roles: ['工程师'],
            formFields: ['completeTime', 'workContent', 'duration'],
            needLocation: true
          }
        ]
      },
      {
        id: 'node_completed',
        code: 'COMPLETED',
        name: '已完工',
        type: NodeType.TASK,
        description: '维修作业已完成',
        actions: [
          { 
            code: 'evaluate', 
            label: '客户评价', 
            type: 'primary',
            nextNode: 'EVALUATED',
            roles: ['客户'],
            formFields: ['rating', 'comment']
          }
        ]
      },
      {
        id: 'node_evaluated',
        code: 'EVALUATED',
        name: '已评价',
        type: NodeType.TASK,
        description: '客户已完成评价',
        actions: [
          { 
            code: 'createSettlement', 
            label: '制作结算单', 
            type: 'primary',
            nextNode: 'SETTLEMENT_CREATED',
            roles: ['财务', '管理员'],
            formFields: ['laborCost', 'partsCost', 'totalAmount']
          }
        ]
      },
      {
        id: 'node_settlement_created',
        code: 'SETTLEMENT_CREATED',
        name: '结算待签字',
        type: NodeType.TASK,
        description: '结算单已创建，等待客户签字',
        actions: [
          { 
            code: 'signSettlement', 
            label: '结算单签字', 
            type: 'success',
            nextNode: 'SETTLEMENT_SIGNED',
            roles: ['客户'],
            formFields: ['signature', 'paymentMethod']
          }
        ]
      },
      {
        id: 'node_settlement_signed',
        code: 'SETTLEMENT_SIGNED',
        name: '结算已签字',
        type: NodeType.TASK,
        description: '客户已确认结算单',
        actions: [
          { 
            code: 'finish', 
            label: '完成工单', 
            type: 'success',
            nextNode: 'FINISHED',
            roles: ['财务', '管理员']
          }
        ]
      },
      {
        id: 'node_finished',
        code: 'FINISHED',
        name: '已完成',
        type: NodeType.END,
        description: '工单流程已结束'
      },
      {
        id: 'node_cancelled',
        code: 'CANCELLED',
        name: '已取消',
        type: NodeType.END,
        description: '工单已取消'
      }
    ]
  },
  {
    id: 'flow_install_standard',
    code: 'INSTALL_STANDARD',
    name: '标准安装流程',
    version: '1.0.0',
    description: '设备标准安装流程',
    workorderTypes: ['安装'],
    scenes: ['新装', '移机'],
    isDefault: true,
    status: 'active',
    config: {
      allowCancel: true,
      cancelableNodes: ['CREATED', 'SCHEDULED'],
      allowTransfer: true,
      autoReminder: true
    },
    nodes: [
      {
        id: 'node_install_created',
        code: 'CREATED',
        name: '已创建',
        type: NodeType.START,
        actions: [
          { 
            code: 'schedule', 
            label: '预约安装', 
            type: 'primary',
            nextNode: 'SCHEDULED',
            formFields: ['installDate', 'engineer']
          },
          { 
            code: 'cancel', 
            label: '取消', 
            type: 'danger',
            nextNode: 'CANCELLED'
          }
        ]
      },
      {
        id: 'node_scheduled',
        code: 'SCHEDULED',
        name: '已预约',
        type: NodeType.TASK,
        actions: [
          { 
            code: 'startInstall', 
            label: '开始安装', 
            type: 'primary',
            nextNode: 'INSTALLING',
            formFields: ['arriveTime', 'location']
          }
        ]
      },
      {
        id: 'node_installing',
        code: 'INSTALLING',
        name: '安装中',
        type: NodeType.TASK,
        actions: [
          { 
            code: 'completeInstall', 
            label: '完成安装', 
            type: 'success',
            nextNode: 'INSTALLED',
            formFields: ['installReport', 'photos']
          }
        ]
      },
      {
        id: 'node_installed',
        code: 'INSTALLED',
        name: '已安装',
        type: NodeType.TASK,
        actions: [
          { 
            code: 'train', 
            label: '客户培训', 
            type: 'primary',
            nextNode: 'TRAINED',
            formFields: ['trainingContent']
          }
        ]
      },
      {
        id: 'node_trained',
        code: 'TRAINED',
        name: '已培训',
        type: NodeType.TASK,
        actions: [
          { 
            code: 'sign', 
            label: '客户验收', 
            type: 'success',
            nextNode: 'FINISHED',
            formFields: ['signature']
          }
        ]
      },
      {
        id: 'node_install_finished',
        code: 'FINISHED',
        name: '已完成',
        type: NodeType.END
      },
      {
        id: 'node_install_cancelled',
        code: 'CANCELLED',
        name: '已取消',
        type: NodeType.END
      }
    ]
  },
  {
    id: 'flow_inspection_standard',
    code: 'INSPECTION_STANDARD',
    name: '标准巡检流程',
    version: '1.0.0',
    description: '设备定期巡检流程',
    workorderTypes: ['巡检'],
    scenes: ['定期巡检', '专项巡检'],
    isDefault: true,
    status: 'active',
    config: {
      allowCancel: true,
      cancelableNodes: ['CREATED'],
      allowTransfer: false
    },
    nodes: [
      {
        id: 'node_inspection_created',
        code: 'CREATED',
        name: '已创建',
        type: NodeType.START,
        actions: [
          { 
            code: 'assign', 
            label: '指派', 
            type: 'primary',
            nextNode: 'ASSIGNED',
            formFields: ['engineer', 'planDate']
          }
        ]
      },
      {
        id: 'node_assigned',
        code: 'ASSIGNED',
        name: '已指派',
        type: NodeType.TASK,
        actions: [
          { 
            code: 'startInspection', 
            label: '开始巡检', 
            type: 'primary',
            nextNode: 'INSPECTING',
            formFields: ['arriveTime']
          }
        ]
      },
      {
        id: 'node_inspecting',
        code: 'INSPECTING',
        name: '巡检中',
        type: NodeType.TASK,
        actions: [
          { 
            code: 'submitReport', 
            label: '提交巡检报告', 
            type: 'success',
            nextNode: 'REPORT_SUBMITTED',
            formFields: ['inspectionItems', 'abnormalItems', 'suggestions']
          }
        ]
      },
      {
        id: 'node_report_submitted',
        code: 'REPORT_SUBMITTED',
        name: '报告已提交',
        type: NodeType.TASK,
        actions: [
          { 
            code: 'review', 
            label: '审核通过', 
            type: 'success',
            nextNode: 'FINISHED'
          },
          { 
            code: 'reject', 
            label: '退回修改', 
            type: 'warning',
            nextNode: 'INSPECTING'
          }
        ]
      },
      {
        id: 'node_inspection_finished',
        code: 'FINISHED',
        name: '已完成',
        type: NodeType.END
      }
    ]
  }
]

// ==================== Store 定义 ====================
// 创建单例实例
let storeInstance = null

export const useWorkflowConfigStore = () => {
  // 如果实例已存在，直接返回
  if (storeInstance) return storeInstance
  
  // State
  const flowTemplates = ref([...DefaultFlowTemplates])
  const currentTemplate = ref(null)
  const loading = ref(false)
  
  // 表单字段配置
  const formFieldConfigs = ref({
    engineer: {
      name: 'engineer',
      label: '指派工程师',
      type: 'select',
      required: true,
      dataSource: 'engineers',
      placeholder: '请选择工程师'
    },
    priority: {
      name: 'priority',
      label: '优先级',
      type: 'select',
      required: true,
      options: [
        { label: '紧急', value: 'urgent' },
        { label: '高', value: 'high' },
        { label: '普通', value: 'normal' },
        { label: '低', value: 'low' }
      ],
      defaultValue: 'normal'
    },
    remark: {
      name: 'remark',
      label: '备注',
      type: 'textarea',
      rows: 3,
      placeholder: '请输入备注信息'
    },
    arriveTime: {
      name: 'arriveTime',
      label: '到场时间',
      type: 'datetime',
      required: true
    },
    location: {
      name: 'location',
      label: '位置',
      type: 'location',
      required: true,
      autoLocate: true
    },
    photos: {
      name: 'photos',
      label: '现场照片',
      type: 'imageUpload',
      multiple: true,
      maxCount: 9
    },
    faultDescription: {
      name: 'faultDescription',
      label: '故障描述',
      type: 'textarea',
      required: true,
      rows: 4,
      placeholder: '请详细描述故障现象'
    },
    solution: {
      name: 'solution',
      label: '处理措施',
      type: 'textarea',
      required: true,
      rows: 4,
      placeholder: '请描述采取的处理措施'
    },
    parts: {
      name: 'parts',
      label: '更换配件',
      type: 'partsSelector',
      multiple: true
    },
    serviceDate: {
      name: 'serviceDate',
      label: '服务日期',
      type: 'date',
      required: true
    },
    signature: {
      name: 'signature',
      label: '电子签名',
      type: 'signature',
      required: true
    },
    rating: {
      name: 'rating',
      label: '服务评分',
      type: 'rate',
      required: true,
      max: 5
    },
    comment: {
      name: 'comment',
      label: '评价内容',
      type: 'textarea',
      rows: 3,
      placeholder: '请输入您的评价'
    },
    workContent: {
      name: 'workContent',
      label: '作业内容',
      type: 'textarea',
      required: true,
      rows: 4
    },
    duration: {
      name: 'duration',
      label: '工时(小时)',
      type: 'number',
      required: true,
      min: 0,
      precision: 1,
      step: 0.5
    },
    completeTime: {
      name: 'completeTime',
      label: '完工时间',
      type: 'datetime',
      required: true
    },
    rejectReason: {
      name: 'rejectReason',
      label: '拒单原因',
      type: 'textarea',
      required: true,
      rows: 3
    },
    transferReason: {
      name: 'transferReason',
      label: '转派原因',
      type: 'textarea',
      required: true,
      rows: 3
    },
    newEngineer: {
      name: 'newEngineer',
      label: '新工程师',
      type: 'select',
      required: true,
      dataSource: 'engineers'
    },
    installDate: {
      name: 'installDate',
      label: '安装日期',
      type: 'datetime',
      required: true
    },
    installReport: {
      name: 'installReport',
      label: '安装报告',
      type: 'textarea',
      required: true,
      rows: 5
    },
    trainingContent: {
      name: 'trainingContent',
      label: '培训内容',
      type: 'textarea',
      required: true,
      rows: 4
    },
    planDate: {
      name: 'planDate',
      label: '计划日期',
      type: 'date',
      required: true
    },
    inspectionItems: {
      name: 'inspectionItems',
      label: '巡检项目',
      type: 'inspectionItems',
      required: true
    },
    abnormalItems: {
      name: 'abnormalItems',
      label: '异常项目',
      type: 'textarea',
      rows: 3
    },
    suggestions: {
      name: 'suggestions',
      label: '改进建议',
      type: 'textarea',
      rows: 3
    },
    laborCost: {
      name: 'laborCost',
      label: '人工费用',
      type: 'number',
      required: true,
      min: 0,
      precision: 2
    },
    partsCost: {
      name: 'partsCost',
      label: '配件费用',
      type: 'number',
      required: true,
      min: 0,
      precision: 2
    },
    totalAmount: {
      name: 'totalAmount',
      label: '合计金额',
      type: 'number',
      required: true,
      min: 0,
      precision: 2,
      computed: '{{laborCost + partsCost}}'
    },
    paymentMethod: {
      name: 'paymentMethod',
      label: '支付方式',
      type: 'select',
      required: true,
      options: [
        { label: '现金', value: 'cash' },
        { label: '转账', value: 'transfer' },
        { label: '支票', value: 'check' }
      ]
    }
  })

  // ==================== Getters ====================
  
  // 获取所有激活的模板
  const activeTemplates = computed(() => {
    return flowTemplates.value.filter(t => t.status === 'active')
  })
  
  // 根据工单类型获取默认模板
  const getTemplateByWorkorderType = (type, scene = null) => {
    const templates = flowTemplates.value.filter(t => 
      t.workorderTypes.includes(type) && t.status === 'active'
    )
    
    // 如果有场景要求，优先匹配场景
    if (scene) {
      const sceneMatch = templates.find(t => t.scenes?.includes(scene))
      if (sceneMatch) return sceneMatch
    }
    
    // 返回默认模板
    return templates.find(t => t.isDefault) || templates[0] || null
  }
  
  // 根据模板ID获取模板
  const getTemplateById = (id) => {
    return flowTemplates.value.find(t => t.id === id)
  }
  
  // 获取节点的配置
  const getNodeConfig = (templateId, nodeCode) => {
    const template = getTemplateById(templateId)
    return template?.nodes.find(n => n.code === nodeCode)
  }
  
  // 获取节点可用的操作
  const getNodeActions = (templateId, nodeCode) => {
    const node = getNodeConfig(templateId, nodeCode)
    return node?.actions || []
  }
  
  // 获取操作配置
  const getActionConfig = (templateId, nodeCode, actionCode) => {
    const actions = getNodeActions(templateId, nodeCode)
    return actions.find(a => a.code === actionCode)
  }
  
  // 获取表单字段配置
  const getFormFields = (fieldNames) => {
    return fieldNames.map(name => formFieldConfigs.value[name]).filter(Boolean)
  }
  
  // 获取操作需要的表单字段
  const getActionFormFields = (templateId, nodeCode, actionCode) => {
    const action = getActionConfig(templateId, nodeCode, actionCode)
    if (!action?.formFields) return []
    return getFormFields(action.formFields)
  }
  
  // 检查是否可以执行操作
  const canExecuteAction = (templateId, nodeCode, actionCode, userRole) => {
    const action = getActionConfig(templateId, nodeCode, actionCode)
    if (!action) return false
    
    // 检查角色权限
    if (action.roles && !action.roles.includes(userRole)) {
      return false
    }
    
    return true
  }
  
  // 获取下一个状态
  const getNextStatus = (templateId, nodeCode, actionCode) => {
    const action = getActionConfig(templateId, nodeCode, actionCode)
    return action?.nextNode || nodeCode
  }
  
  // 获取流程的所有状态列表
  const getFlowStatusList = (templateId) => {
    const template = getTemplateById(templateId)
    return template?.nodes.map(n => ({
      code: n.code,
      name: n.name,
      type: n.type
    })) || []
  }

  // ==================== Actions ====================
  
  // 加载模板列表（优先从API获取，失败则使用本地数据）
  const loadTemplates = async () => {
    loading.value = true
    try {
      // 尝试从API获取
      const response = await workflowTemplateApi.getTemplates()
      if (response && response.data) {
        flowTemplates.value = response.data
      } else {
        // API失败，使用默认数据
        flowTemplates.value = [...DefaultFlowTemplates]
      }
      return flowTemplates.value
    } catch (error) {
      console.warn('Failed to load templates from API, using default data:', error)
      // API失败，使用默认数据
      flowTemplates.value = [...DefaultFlowTemplates]
      return flowTemplates.value
    } finally {
      loading.value = false
    }
  }
  
  // 保存模板（支持API和本地两种模式）
  const saveTemplate = async (template) => {
    loading.value = true
    try {
      // 尝试通过API保存
      const isUpdate = !!template.id && flowTemplates.value.some(t => t.id === template.id)
      
      if (isUpdate) {
        // 更新现有模板
        const response = await workflowTemplateApi.updateTemplate(template.id, template)
        if (response && response.data) {
          const index = flowTemplates.value.findIndex(t => t.id === template.id)
          if (index >= 0) {
            flowTemplates.value[index] = response.data
          }
          return response.data
        }
      } else {
        // 创建新模板
        const newTemplateData = {
          ...template,
          version: '1.0.0',
          status: 'active'
        }
        const response = await workflowTemplateApi.createTemplate(newTemplateData)
        if (response && response.data) {
          flowTemplates.value.push(response.data)
          return response.data
        }
      }
      
      // API失败，回退到本地模式
      return saveTemplateLocal(template)
    } catch (error) {
      console.warn('Failed to save template via API, using local mode:', error)
      return saveTemplateLocal(template)
    } finally {
      loading.value = false
    }
  }
  
  // 本地保存模板（作为fallback）
  const saveTemplateLocal = (template) => {
    const index = flowTemplates.value.findIndex(t => t.id === template.id)
    if (index >= 0) {
      flowTemplates.value[index] = { 
        ...flowTemplates.value[index], 
        ...template,
        updatedAt: new Date().toISOString()
      }
      return flowTemplates.value[index]
    } else {
      const newTemplate = {
        ...template,
        id: `flow_${Date.now()}`,
        version: '1.0.0',
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      flowTemplates.value.push(newTemplate)
      return newTemplate
    }
  }
  
  // 删除模板（支持API和本地两种模式）
  const deleteTemplate = async (templateId) => {
    try {
      // 尝试通过API删除
      await workflowTemplateApi.deleteTemplate(templateId)
    } catch (error) {
      console.warn('Failed to delete template via API:', error)
    }
    
    // 本地删除（无论API成功与否）
    const index = flowTemplates.value.findIndex(t => t.id === templateId)
    if (index >= 0) {
      flowTemplates.value.splice(index, 1)
    }
  }
  
  // 设置当前模板
  const setCurrentTemplate = (template) => {
    currentTemplate.value = template
  }
  
  // 添加新模板（支持API和本地两种模式）
  const addTemplate = async (template) => {
    try {
      // 尝试通过API创建
      const newTemplateData = {
        ...template,
        version: '1.0.0',
        status: 'active'
      }
      const response = await workflowTemplateApi.createTemplate(newTemplateData)
      if (response && response.data) {
        flowTemplates.value.push(response.data)
        return response.data
      }
    } catch (error) {
      console.warn('Failed to add template via API, using local mode:', error)
    }
    
    // 本地创建（作为fallback）
    const newTemplate = {
      ...template,
      id: `flow_${Date.now()}`,
      version: '1.0.0',
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    flowTemplates.value.push(newTemplate)
    return newTemplate
  }
  
  // 更新模板节点（支持API和本地两种模式）
  const updateTemplateNodes = async (templateId, nodes) => {
    try {
      // 尝试通过API更新
      const response = await workflowTemplateApi.updateTemplateNodes(templateId, nodes)
      if (response && response.data) {
        const template = getTemplateById(templateId)
        if (template) {
          template.nodes = response.data.nodes
          template.updatedAt = response.data.updatedAt
        }
        return
      }
    } catch (error) {
      console.warn('Failed to update template nodes via API, using local mode:', error)
    }
    
    // 本地更新（作为fallback）
    const template = getTemplateById(templateId)
    if (template) {
      template.nodes = nodes
      template.updatedAt = new Date().toISOString()
    }
  }
  
  // 设置默认模板
  const setDefaultTemplate = async (templateId) => {
    try {
      // 尝试通过API设置
      await workflowTemplateApi.setDefaultTemplate(templateId)
    } catch (error) {
      console.warn('Failed to set default template via API:', error)
    }
    
    // 本地更新
    const template = getTemplateById(templateId)
    if (template) {
      // 取消其他同类型模板的默认状态
      flowTemplates.value.forEach(t => {
        if (t.workorderTypes.some(type => template.workorderTypes.includes(type))) {
          t.isDefault = false
        }
      })
      template.isDefault = true
      template.updatedAt = new Date().toISOString()
    }
  }

  return {
    // State
    flowTemplates,
    currentTemplate,
    loading,
    formFieldConfigs,
    
    // Getters
    activeTemplates,
    
    // Methods
    getTemplateByWorkorderType,
    getTemplateById,
    getNodeConfig,
    getNodeActions,
    getActionConfig,
    getFormFields,
    getActionFormFields,
    canExecuteAction,
    getNextStatus,
    getFlowStatusList,
    loadTemplates,
    saveTemplate,
    deleteTemplate,
    setCurrentTemplate,
    addTemplate,
    updateTemplateNodes,
    setDefaultTemplate
  }
  
  // 创建 store 对象
  const store = {
    // State
    flowTemplates,
    currentTemplate,
    loading,
    formFieldConfigs,
    
    // Getters
    activeTemplates,
    
    // Methods
    getTemplateByWorkorderType,
    getTemplateById,
    getNodeConfig,
    getNodeActions,
    getActionConfig,
    getFormFields,
    getActionFormFields,
    canExecuteAction,
    getNextStatus,
    getFlowStatusList,
    loadTemplates,
    saveTemplate,
    deleteTemplate,
    setCurrentTemplate,
    addTemplate,
    updateTemplateNodes,
    setDefaultTemplate
  }
  
  // 保存实例
  storeInstance = store
  
  return store
}
