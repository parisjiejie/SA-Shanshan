/**
 * 工单流程引擎后端服务
 * Express + 内存数据库
 */

const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
const db = require('./models/database')

// 导入路由
const workflowTemplatesRouter = require('./routes/workflowTemplates')
const workflowInstancesRouter = require('./routes/workflowInstances')

// 创建Express应用
const app = express()
const PORT = process.env.PORT || 3456

// 中间件
app.use(cors())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

// 请求日志
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`)
  next()
})

// 初始化默认数据
db.initDefaultData()

// 路由
app.use('/api/workflow/templates', workflowTemplatesRouter)
app.use('/api/workflow/instances', workflowInstancesRouter)

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: '服务运行正常',
    timestamp: new Date().toISOString()
  })
})

// 404处理
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: '接口不存在'
  })
})

// 错误处理
app.use((err, req, res, next) => {
  console.error('服务器错误:', err)
  res.status(500).json({
    success: false,
    message: '服务器内部错误',
    error: err.message
  })
})

// 启动服务器
app.listen(PORT, () => {
  console.log(`=================================`)
  console.log(`工单流程引擎后端服务已启动`)
  console.log(`服务地址: http://localhost:${PORT}`)
  console.log(`API前缀: /api/workflow`)
  console.log(`=================================`)
})

module.exports = app
