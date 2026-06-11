/**
 * API 统一入口
 * 
 * 使用示例:
 * import { customerApi, workorderApi } from '@/api'
 * 
 * 或按需导入:
 * import { customerApi } from '@/api/customerApi'
 */

export { customerApi } from './customerApi.js'
export { assetApi } from './assetApi.js'
export { workorderApi } from './workorderApi.js'
export { employeeApi } from './employeeApi.js'
export { partsApi } from './partsApi.js'
export { quotationApi } from './quotationApi.js'

// 默认导出所有API
export default {
  customer: customerApi,
  asset: assetApi,
  workorder: workorderApi,
  employee: employeeApi,
  parts: partsApi,
  quotation: quotationApi
}
