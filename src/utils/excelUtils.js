// xlsx 库动态导入，避免 SSR 问题
let XLSX = null

const getXLSX = async () => {
  if (!XLSX) {
    // 使用 Vite 的动态导入语法
    const module = await import('xlsx/dist/xlsx.full.min.js')
    XLSX = module.default || module
  }
  return XLSX
}

/**
 * 将单元格引用转换为行列索引
 * @param {string} cellRef - 单元格引用，如 'A1', 'B2'
 * @returns {Object} - {row, col}
 */
export const cellRefToIndex = (cellRef) => {
  const match = cellRef.match(/^([A-Z]+)(\d+)$/)
  if (!match) return null
  
  const colStr = match[1]
  const row = parseInt(match[2]) - 1 // 转为0基索引
  
  // 转换列字母为索引
  let col = 0
  for (let i = 0; i < colStr.length; i++) {
    col = col * 26 + (colStr.charCodeAt(i) - 65)
  }
  
  return { row, col }
}

/**
 * 将行列索引转换为单元格引用
 * @param {number} row - 行索引（0基）
 * @param {number} col - 列索引（0基）
 * @returns {string} - 单元格引用，如 'A1'
 */
export const indexToCellRef = (row, col) => {
  let colStr = ''
  let c = col
  do {
    colStr = String.fromCharCode(65 + (c % 26)) + colStr
    c = Math.floor(c / 26) - 1
  } while (c >= 0)
  
  return colStr + (row + 1)
}

/**
 * 读取 Excel 文件
 * @param {ArrayBuffer} data - Excel 文件的 ArrayBuffer
 * @returns {Object} - 工作簿对象
 */
export const readExcel = async (data) => {
  try {
    const xlsx = await getXLSX()
    const workbook = xlsx.read(data, { type: 'array' })
    return workbook
  } catch (error) {
    console.error('读取 Excel 失败:', error)
    throw new Error('读取 Excel 文件失败')
  }
}

/**
 * 从 Data URL 读取 Excel
 * @param {string} dataUrl - Base64 编码的 Data URL
 * @returns {Object} - 工作簿对象
 */
export const readExcelFromDataUrl = async (dataUrl) => {
  try {
    const base64 = dataUrl.split(',')[1]
    const binary = atob(base64)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i)
    }
    return await readExcel(bytes.buffer)
  } catch (error) {
    console.error('从 Data URL 读取 Excel 失败:', error)
    throw new Error('读取 Excel 文件失败')
  }
}

/**
 * 填充单元格数据
 * @param {Object} worksheet - 工作表对象
 * @param {string} cellRef - 单元格引用
 * @param {any} value - 要填充的值
 * @param {string} type - 数据类型
 */
export const fillCell = (worksheet, cellRef, value, type = 'text') => {
  if (!worksheet[cellRef]) {
    worksheet[cellRef] = {}
  }
  
  const cell = worksheet[cellRef]
  
  switch (type) {
    case 'date':
      cell.t = 'd'
      cell.v = new Date(value)
      cell.z = 'yyyy-mm-dd'
      break
    case 'datetime':
      cell.t = 'd'
      cell.v = new Date(value)
      cell.z = 'yyyy-mm-dd hh:mm:ss'
      break
    case 'number':
      cell.t = 'n'
      cell.v = Number(value)
      break
    case 'text':
    case 'textarea':
    default:
      cell.t = 's'
      cell.v = String(value)
      break
  }
}

/**
 * 填充表格数据
 * @param {Object} worksheet - 工作表对象
 * @param {string} startCell - 起始单元格
 * @param {Array} data - 数据数组
 * @param {Array} columns - 列配置
 */
export const fillTable = (worksheet, startCell, data, columns) => {
  const start = cellRefToIndex(startCell)
  if (!start) return
  
  data.forEach((row, rowIndex) => {
    columns.forEach((col, colIndex) => {
      const cellRef = indexToCellRef(start.row + rowIndex, start.col + colIndex)
      const value = row[col.field] || ''
      fillCell(worksheet, cellRef, value, 'text')
    })
  })
}

/**
 * 插入图片到 Excel
 * @param {Object} workbook - 工作簿对象
 * @param {string} sheetName - 工作表名称
 * @param {string} cellRef - 单元格引用
 * @param {string} imageDataUrl - 图片的 Data URL
 */
export const insertImage = (workbook, sheetName, cellRef, imageDataUrl) => {
  // xlsx 库不直接支持图片插入
  // 这里可以集成其他库如 exceljs 来实现图片插入
  // 目前先记录日志
  console.log(`图片应插入到 ${sheetName}!${cellRef}`)
}

/**
 * 根据模板和数据生成 Excel
 * @param {Object} template - 模板配置
 * @param {Object} data - 工单数据
 * @returns {string} - 生成的 Excel Data URL
 */
export const generateExcelFromTemplate = async (template, data) => {
  if (!template.excelFile || !template.excelFile.data) {
    throw new Error('模板文件不存在')
  }
  
  try {
    const xlsx = await getXLSX()
    
    // 读取模板
    const workbook = await readExcelFromDataUrl(template.excelFile.data)
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    
    // 填充字段映射
    if (template.fieldMappings) {
      template.fieldMappings.forEach(mapping => {
        const value = getFieldValue(data, mapping.field)
        
        if (mapping.type === 'image') {
          // 图片类型特殊处理
          insertImage(workbook, sheetName, mapping.cellRef, value)
        } else {
          fillCell(worksheet, mapping.cellRef, value, mapping.type)
        }
      })
    }
    
    // 填充表格数据
    if (template.tableConfigs) {
      template.tableConfigs.forEach(config => {
        const tableData = getFieldValue(data, config.name)
        if (Array.isArray(tableData)) {
          fillTable(worksheet, config.startCell, tableData, config.columns)
        }
      })
    }
    
    // 生成 Excel 文件
    const excelBuffer = xlsx.write(workbook, { bookType: 'xlsx', type: 'array' })
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    
    // 转换为 Data URL
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result)
      reader.readAsDataURL(blob)
    })
  } catch (error) {
    console.error('生成 Excel 失败:', error)
    throw error
  }
}

/**
 * 将 Excel 转换为 HTML 用于预览
 * @param {Object} workbook - 工作簿对象
 * @returns {string} - HTML 字符串
 */
export const excelToHtml = async (workbook) => {
  try {
    const xlsx = await getXLSX()
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    const html = xlsx.utils.sheet_to_html(worksheet, { editable: false })
    
    // 添加样式
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          table { border-collapse: collapse; width: 100%; }
          td, th { border: 1px solid #ccc; padding: 8px; text-align: left; }
          th { background-color: #f0f0f0; font-weight: bold; }
        </style>
      </head>
      <body>
        ${html}
      </body>
      </html>
    `
  } catch (error) {
    console.error('转换 HTML 失败:', error)
    throw error
  }
}

/**
 * 获取字段值（支持嵌套路径）
 * @param {Object} data - 数据对象
 * @param {string} field - 字段路径
 * @returns {any} - 字段值
 */
const getFieldValue = (data, field) => {
  const keys = field.split('.')
  let value = data
  for (const key of keys) {
    if (value && typeof value === 'object') {
      value = value[key]
    } else {
      return undefined
    }
  }
  return value
}

/**
 * 导出 Excel 文件
 * @param {Object} workbook - 工作簿对象
 * @param {string} fileName - 文件名
 */
export const exportExcel = async (workbook, fileName = 'export.xlsx') => {
  try {
    const xlsx = await getXLSX()
    const excelBuffer = xlsx.write(workbook, { bookType: 'xlsx', type: 'array' })
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(link.href)
  } catch (error) {
    console.error('导出 Excel 失败:', error)
    throw error
  }
}
