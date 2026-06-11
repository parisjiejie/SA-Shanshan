/**
 * 内存数据库
 * 用于存储流程模板、流程实例、历史记录等数据
 * 后续可替换为 MongoDB/MySQL 等真实数据库
 */

// 流程模板数据
const flowTemplates = new Map()

// 流程实例数据
const flowInstances = new Map()

// 流转历史数据
const flowHistories = new Map()

// 表单字段配置数据
const formFieldConfigs = new Map()

// 初始化默认数据
const initDefaultData = () => {
  // 默认流程模板
  const defaultTemplates = [
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
          type: 'start',
          description: '工单已创建，等待派单',
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
          ]
        },
        {
          id: 'node_dispatched',
          code: 'DISPATCHED',
          name: '已派单',
          type: 'task',
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
          type: 'task',
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
          type: 'task',
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
          type: 'task',
          description: '工程师正在进行维修作业',
          actions: [
            { 
              code: 'createReport', 
              label: '制作服务报告', 
              type: 'primary',
              nextNode: 'REPORT_CREATED',
              roles: ['工程师'],
              formFields: ['faultDescription', 'solution', 'parts', 'serviceDate']
            }
          ]
        },
        {
          id: 'node_report_created',
          code: 'REPORT_CREATED',
          name: '报告待签字',
          type: 'task',
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
          type: 'task',
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
          type: 'task',
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
          type: 'task',
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
          type: 'task',
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
          type: 'task',
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
          type: 'end',
          description: '工单流程已结束'
        },
        {
          id: 'node_cancelled',
          code: 'CANCELLED',
          name: '已取消',
          type: 'end',
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
          type: 'start',
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
          type: 'task',
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
          type: 'task',
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
          type: 'task',
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
          type: 'task',
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
          type: 'end'
        },
        {
          id: 'node_install_cancelled',
          code: 'CANCELLED',
          name: '已取消',
          type: 'end'
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
          type: 'start',
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
          type: 'task',
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
          type: 'task',
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
          type: 'task',
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
          type: 'end'
        }
      ]
    }
  ]

  // 初始化模板数据
  defaultTemplates.forEach(template => {
    template.createdAt = new Date().toISOString()
    template.updatedAt = new Date().toISOString()
    flowTemplates.set(template.id, template)
  })

  console.log('默认数据初始化完成')
}

// 导出数据存储和操作方法
module.exports = {
  // 数据存储
  flowTemplates,
  flowInstances,
  flowHistories,
  formFieldConfigs,
  
  // 初始化方法
  initDefaultData,
  
  // 工具方法
  generateId: () => `id_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  
  // 流程模板操作
  getAllTemplates: () => Array.from(flowTemplates.values()),
  getTemplateById: (id) => flowTemplates.get(id),
  saveTemplate: (template) => {
    template.updatedAt = new Date().toISOString()
    flowTemplates.set(template.id, template)
    return template
  },
  deleteTemplate: (id) => flowTemplates.delete(id),
  
  // 流程实例操作
  getInstance: (workorderId) => flowInstances.get(workorderId),
  saveInstance: (instance) => {
    instance.updatedAt = new Date().toISOString()
    flowInstances.set(instance.workorderId, instance)
    return instance
  },
  
  // 历史记录操作
  getHistory: (workorderId) => flowHistories.get(workorderId) || [],
  addHistory: (workorderId, record) => {
    const histories = flowHistories.get(workorderId) || []
    histories.unshift(record)
    flowHistories.set(workorderId, histories)
    return histories
  }
}
