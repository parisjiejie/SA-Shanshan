/**
 * 工单流程引擎测试数据
 * 用于测试配置化流程引擎的各个功能
 */

import { useWorkflowConfigStore } from '../stores/workflowConfigStore'
import { useWorkflowInstanceStore } from '../stores/workflowInstanceStore'

/**
 * 测试数据：模拟工单
 */
export const testWorkorders = [
  {
    id: 'WO20260402001',
    type: '维修',
    scene: '现场维修',
    customerId: 'C001',
    customerName: '上海某机械有限公司',
    assetSerialNumber: 'SN123456789',
    description: '设备运行异常，出现异响和振动',
    creator: '客服小王',
    createTime: '2026-04-02T09:00:00Z',
    flowStatus: 'CREATED',
    status: '待派单'
  },
  {
    id: 'WO20260402002',
    type: '安装',
    scene: '新装',
    customerId: 'C002',
    customerName: '北京某科技有限公司',
    assetSerialNumber: 'SN987654321',
    description: '新设备安装调试',
    creator: '客服小李',
    createTime: '2026-04-02T10:00:00Z',
    flowStatus: 'CREATED',
    status: '待派单'
  },
  {
    id: 'WO20260402003',
    type: '巡检',
    scene: '定期巡检',
    customerId: 'C001',
    customerName: '上海某机械有限公司',
    assetSerialNumber: 'SN123456789',
    description: '季度设备巡检',
    creator: '客服小张',
    createTime: '2026-04-02T11:00:00Z',
    flowStatus: 'CREATED',
    status: '待派单'
  }
]

/**
 * 测试场景1：维修工单完整流程
 * 测试从创建到完成的完整流程
 */
export const testRepairWorkflow = async () => {
  console.log('========== 测试维修工单完整流程 ==========')
  
  const configStore = useWorkflowConfigStore()
  const instanceStore = useWorkflowInstanceStore()
  
  // 获取维修工单
  const workorder = testWorkorders[0]
  console.log('测试工单:', workorder)
  
  // 1. 初始化流程实例
  console.log('\n1. 初始化流程实例...')
  const instance = await instanceStore.initInstance(workorder)
  console.log('流程实例已创建:', instance)
  
  // 2. 执行派单操作
  console.log('\n2. 执行派单操作...')
  const dispatchResult = await instanceStore.executeAction({
    workorderId: workorder.id,
    action: 'dispatch',
    operator: '调度员001',
    operatorRole: '调度员',
    formData: { engineer: '王工程师', priority: 'high', remark: '紧急派单' }
  })
  console.log('派单结果:', dispatchResult)
  
  // 3. 执行接单操作
  console.log('\n3. 执行接单操作...')
  const acceptResult = await instanceStore.executeAction({
    workorderId: workorder.id,
    action: 'accept',
    operator: '王工程师',
    operatorRole: '工程师'
  })
  console.log('接单结果:', acceptResult)
  
  // 4. 执行到场打卡
  console.log('\n4. 执行到场打卡...')
  const arriveResult = await instanceStore.executeAction({
    workorderId: workorder.id,
    action: 'arrive',
    operator: '王工程师',
    operatorRole: '工程师',
    formData: { 
      arriveTime: new Date().toISOString(),
      location: '上海市浦东新区xxx路xxx号',
      photos: []
    }
  })
  console.log('到场打卡结果:', arriveResult)
  
  // 5. 执行开始作业
  console.log('\n5. 执行开始作业...')
  const startWorkResult = await instanceStore.executeAction({
    workorderId: workorder.id,
    action: 'startWork',
    operator: '王工程师',
    operatorRole: '工程师'
  })
  console.log('开始作业结果:', startWorkResult)
  
  // 6. 执行制作服务报告
  console.log('\n6. 执行制作服务报告...')
  const createReportResult = await instanceStore.executeAction({
    workorderId: workorder.id,
    action: 'createReport',
    operator: '王工程师',
    operatorRole: '工程师',
    formData: {
      faultDescription: '设备运行异常，出现异响和振动',
      solution: '更换轴承，调整皮带张力，清洁散热器',
      parts: [
        { name: '轴承', model: '6205-2RS', quantity: 2 },
        { name: '皮带', model: 'B-1200', quantity: 1 }
      ],
      serviceDate: '2026-04-02'
    }
  })
  console.log('制作服务报告结果:', createReportResult)
  
  // 7. 执行客户签字
  console.log('\n7. 执行客户签字...')
  const signReportResult = await instanceStore.executeAction({
    workorderId: workorder.id,
    action: 'signReport',
    operator: '客户张三',
    operatorRole: '客户',
    formData: {
      signature: 'data:image/png;base64,...',
      signTime: new Date().toISOString()
    }
  })
  console.log('客户签字结果:', signReportResult)
  
  // 8. 执行完工打卡
  console.log('\n8. 执行完工打卡...')
  const completeResult = await instanceStore.executeAction({
    workorderId: workorder.id,
    action: 'complete',
    operator: '王工程师',
    operatorRole: '工程师',
    formData: {
      completeTime: new Date().toISOString(),
      workContent: '更换轴承，调整皮带张力，清洁散热器',
      duration: 4.5
    }
  })
  console.log('完工打卡结果:', completeResult)
  
  // 9. 执行客户评价
  console.log('\n9. 执行客户评价...')
  const evaluateResult = await instanceStore.executeAction({
    workorderId: workorder.id,
    action: 'evaluate',
    operator: '客户张三',
    operatorRole: '客户',
    formData: {
      rating: 5,
      comment: '服务很好，工程师很专业'
    }
  })
  console.log('客户评价结果:', evaluateResult)
  
  // 10. 执行制作结算单
  console.log('\n10. 执行制作结算单...')
  const createSettlementResult = await instanceStore.executeAction({
    workorderId: workorder.id,
    action: 'createSettlement',
    operator: '财务001',
    operatorRole: '财务',
    formData: {
      laborCost: 500,
      partsCost: 800,
      totalAmount: 1300
    }
  })
  console.log('制作结算单结果:', createSettlementResult)
  
  // 11. 执行结算单签字
  console.log('\n11. 执行结算单签字...')
  const signSettlementResult = await instanceStore.executeAction({
    workorderId: workorder.id,
    action: 'signSettlement',
    operator: '客户张三',
    operatorRole: '客户',
    formData: {
      signature: 'data:image/png;base64,...',
      paymentMethod: 'transfer'
    }
  })
  console.log('结算单签字结果:', signSettlementResult)
  
  // 12. 执行完成工单
  console.log('\n12. 执行完成工单...')
  const finishResult = await instanceStore.executeAction({
    workorderId: workorder.id,
    action: 'finish',
    operator: '财务001',
    operatorRole: '财务'
  })
  console.log('完成工单结果:', finishResult)
  
  // 获取流程统计
  console.log('\n13. 获取流程统计...')
  const statistics = instanceStore.getFlowStatistics(workorder.id)
  console.log('流程统计:', statistics)
  
  // 获取流转历史
  console.log('\n14. 获取流转历史...')
  const history = instanceStore.getFlowHistory(workorder.id)
  console.log('流转历史:', history)
  
  console.log('\n========== 测试完成 ==========')
  
  return {
    workorder,
    instance,
    statistics,
    history
  }
}

/**
 * 测试场景2：安装工单流程
 */
export const testInstallWorkflow = async () => {
  console.log('========== 测试安装工单流程 ==========')
  
  const instanceStore = useWorkflowInstanceStore()
  
  const workorder = testWorkorders[1]
  console.log('测试工单:', workorder)
  
  // 初始化
  const instance = await instanceStore.initInstance(workorder)
  console.log('流程实例已创建')
  
  // 预约安装
  await instanceStore.executeAction({
    workorderId: workorder.id,
    action: 'schedule',
    operator: '调度员001',
    operatorRole: '调度员',
    formData: { installDate: '2026-04-05T09:00:00Z', engineer: '李工程师' }
  })
  console.log('已预约安装')
  
  // 开始安装
  await instanceStore.executeAction({
    workorderId: workorder.id,
    action: 'startInstall',
    operator: '李工程师',
    operatorRole: '工程师',
    formData: { arriveTime: new Date().toISOString(), location: '北京市xxx区' }
  })
  console.log('已开始安装')
  
  // 完成安装
  await instanceStore.executeAction({
    workorderId: workorder.id,
    action: 'completeInstall',
    operator: '李工程师',
    operatorRole: '工程师',
    formData: { installReport: '设备安装完成，运行正常', photos: [] }
  })
  console.log('已完成安装')
  
  // 客户培训
  await instanceStore.executeAction({
    workorderId: workorder.id,
    action: 'train',
    operator: '李工程师',
    operatorRole: '工程师',
    formData: { trainingContent: '设备操作培训、日常维护培训' }
  })
  console.log('已完成培训')
  
  // 客户验收
  await instanceStore.executeAction({
    workorderId: workorder.id,
    action: 'sign',
    operator: '客户李四',
    operatorRole: '客户',
    formData: { signature: 'data:image/png;base64,...' }
  })
  console.log('客户已验收')
  
  console.log('========== 安装工单测试完成 ==========')
}

/**
 * 测试场景3：权限控制测试
 */
export const testPermissionControl = async () => {
  console.log('========== 测试权限控制 ==========')
  
  const configStore = useWorkflowConfigStore()
  const instanceStore = useWorkflowInstanceStore()
  
  const workorder = testWorkorders[0]
  await instanceStore.initInstance(workorder)
  
  // 测试1：调度员可以派单
  const canDispatch = configStore.canExecuteAction(
    'flow_repair_standard',
    'CREATED',
    'dispatch',
    '调度员'
  )
  console.log('调度员可以派单:', canDispatch)
  
  // 测试2：工程师不能派单
  const cannotDispatch = configStore.canExecuteAction(
    'flow_repair_standard',
    'CREATED',
    'dispatch',
    '工程师'
  )
  console.log('工程师不能派单:', !cannotDispatch)
  
  // 测试3：工程师可以接单
  const canAccept = configStore.canExecuteAction(
    'flow_repair_standard',
    'DISPATCHED',
    'accept',
    '工程师'
  )
  console.log('工程师可以接单:', canAccept)
  
  console.log('========== 权限控制测试完成 ==========')
}

/**
 * 测试场景4：取消工单流程
 */
export const testCancelWorkflow = async () => {
  console.log('========== 测试取消工单流程 ==========')
  
  const instanceStore = useWorkflowInstanceStore()
  
  const workorder = {
    id: 'WO20260402004',
    type: '维修',
    customerId: 'C003',
    customerName: '测试客户',
    creator: '客服小王',
    createTime: new Date().toISOString()
  }
  
  // 初始化
  await instanceStore.initInstance(workorder)
  console.log('工单已创建')
  
  // 取消工单
  const cancelResult = await instanceStore.cancelFlow(
    workorder.id,
    '客服小王',
    '客户要求取消'
  )
  console.log('取消结果:', cancelResult)
  
  console.log('========== 取消工单测试完成 ==========')
}

/**
 * 测试场景5：转交工单
 */
export const testTransferWorkflow = async () => {
  console.log('========== 测试转交工单 ==========')
  
  const instanceStore = useWorkflowInstanceStore()
  
  const workorder = testWorkorders[0]
  await instanceStore.initInstance(workorder)
  
  // 先派单给王工程师
  await instanceStore.executeAction({
    workorderId: workorder.id,
    action: 'dispatch',
    operator: '调度员001',
    operatorRole: '调度员',
    formData: { engineer: '王工程师' }
  })
  
  // 转交给李工程师
  const transferResult = await instanceStore.transferWorkorder(
    workorder.id,
    '王工程师',
    '李工程师',
    '王工程师临时有事，转交给李工程师处理'
  )
  console.log('转交结果:', transferResult)
  
  console.log('========== 转交工单测试完成 ==========')
}

/**
 * 运行所有测试
 */
export const runAllTests = async () => {
  console.log('开始运行所有测试...\n')
  
  try {
    await testRepairWorkflow()
    console.log('\n')
    
    await testInstallWorkflow()
    console.log('\n')
    
    await testPermissionControl()
    console.log('\n')
    
    await testCancelWorkflow()
    console.log('\n')
    
    await testTransferWorkflow()
    
    console.log('\n✅ 所有测试通过！')
  } catch (error) {
    console.error('❌ 测试失败:', error)
  }
}

/**
 * 导出测试数据供外部使用
 */
export default {
  testWorkorders,
  testRepairWorkflow,
  testInstallWorkflow,
  testPermissionControl,
  testCancelWorkflow,
  testTransferWorkflow,
  runAllTests
}
