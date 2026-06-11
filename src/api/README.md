# API 使用指南

本文档介绍如何在项目中使用API服务与后端进行数据交互。

## 目录

1. [快速开始](#快速开始)
2. [客户管理API](#客户管理api)
3. [Store集成](#store集成)
4. [在组件中使用](#在组件中使用)
5. [错误处理](#错误处理)
6. [后端接口规范](#后端接口规范)

---

## 快速开始

### 1. 配置环境变量

在项目根目录创建 `.env` 文件：

```env
# API基础地址
VITE_API_BASE_URL=http://localhost:8080/api

# 开发环境
VITE_APP_ENV=development
```

### 2. 安装依赖

```bash
npm install
```

axios 已在项目中安装。

---

## 客户管理API

### 导入API

```javascript
import { customerApi } from '../api/customerApi.js'
```

### API方法列表

| 方法 | 说明 | 参数 |
|------|------|------|
| `getList(params)` | 获取客户列表 | `{page, pageSize, keyword, status}` |
| `getById(id)` | 获取客户详情 | `id: string` |
| `create(data)` | 创建客户 | 客户对象 |
| `update(id, data)` | 更新客户 | `id: string`, 客户对象 |
| `delete(id)` | 删除客户 | `id: string` |
| `batchDelete(ids)` | 批量删除 | `ids: string[]` |
| `export(params)` | 导出数据 | 查询参数 |
| `import(formData)` | 导入数据 | `FormData` |

### 使用示例

```javascript
// 获取客户列表
const fetchCustomers = async () => {
  try {
    const data = await customerApi.getList({
      page: 1,
      pageSize: 10,
      keyword: '上海'
    })
    console.log(data.list)  // 客户列表
    console.log(data.total) // 总数
  } catch (error) {
    console.error('获取失败:', error.message)
  }
}

// 创建客户
const createCustomer = async () => {
  try {
    const newCustomer = await customerApi.create({
      name: '张三',
      companyName: '上海某公司',
      phone: '13800138001',
      email: 'zhangsan@example.com'
    })
    console.log('创建成功:', newCustomer)
  } catch (error) {
    console.error('创建失败:', error.message)
  }
}

// 导出客户数据
const exportData = async () => {
  try {
    const blob = await customerApi.export({ status: 'active' })
    // 自动下载文件
  } catch (error) {
    console.error('导出失败:', error.message)
  }
}

// 导入客户数据
const importData = async (file) => {
  const formData = new FormData()
  formData.append('file', file)
  
  try {
    const result = await customerApi.import(formData)
    console.log(`成功: ${result.success}, 失败: ${result.failed}`)
  } catch (error) {
    console.error('导入失败:', error.message)
  }
}
```

---

## Store集成

推荐使用 Store 模式管理数据状态，已为客户管理创建了 `customerStore`。

### 导入Store

```javascript
import { useCustomerStore } from '../stores/customerStore.js'

// 在setup中使用
const customerStore = useCustomerStore()
```

### Store提供的状态

```javascript
// 状态（只读）
customerStore.customers      // 客户列表
customerStore.currentCustomer // 当前登录客户
customerStore.isLoggedIn     // 登录状态
customerStore.loading        // 加载状态
customerStore.error          // 错误信息
customerStore.pagination     // 分页信息

// 计算属性
customerStore.customerInfo       // 客户信息
customerStore.customerStatus     // 客户状态
customerStore.customerCompanyId  // 公司ID
customerStore.customerCompanyName // 公司名称
```

### Store提供的方法

#### API方法（自动处理loading和错误）

```javascript
// 获取客户列表（带分页）
await customerStore.fetchCustomers({ keyword: '上海' })

// 获取客户详情
const customer = await customerStore.fetchCustomerById('C001')

// 创建客户
await customerStore.createCustomer({
  name: '张三',
  companyName: '上海某公司',
  phone: '13800138001'
})

// 更新客户
await customerStore.updateCustomer('C001', { name: '张三丰' })

// 删除客户
await customerStore.deleteCustomer('C001')

// 批量删除
await customerStore.batchDeleteCustomers(['C001', 'C002'])

// 导出
await customerStore.exportCustomers({ status: 'active' })

// 导入
await customerStore.importCustomers(formData)
```

#### 本地方法

```javascript
// 查找客户
customerStore.findCustomerByPhone('13800138001')
customerStore.getCustomerById('C001')
customerStore.getCustomers()

// 登录相关
customerStore.login(customer)
customerStore.logout()
customerStore.checkLoginStatus()

// 分页
customerStore.setPage(2)
customerStore.setPageSize(20)
```

---

## 在组件中使用

### 完整示例：客户列表页面

```vue
<template>
  <div class="customer-list">
    <!-- 搜索栏 -->
    <div class="search-bar">
      <el-input
        v-model="searchKeyword"
        placeholder="搜索客户姓名/公司/手机号"
        clearable
        @keyup.enter="handleSearch"
      >
        <template #append>
          <el-button @click="handleSearch">搜索</el-button>
        </template>
      </el-input>
    </div>

    <!-- 加载状态 -->
    <el-skeleton v-if="customerStore.loading" :rows="5" animated />

    <!-- 客户列表 -->
    <div v-else class="customer-list">
      <div
        v-for="customer in customerStore.customers"
        :key="customer.id"
        class="customer-card"
      >
        <h3>{{ customer.name }}</h3>
        <p>{{ customer.companyName }}</p>
        <p>{{ customer.phone }}</p>
        <el-button @click="editCustomer(customer)">编辑</el-button>
        <el-button type="danger" @click="deleteCustomer(customer.id)">删除</el-button>
      </div>
    </div>

    <!-- 分页 -->
    <el-pagination
      v-model:current-page="currentPage"
      v-model:page-size="pageSize"
      :total="customerStore.pagination.total"
      @current-change="handlePageChange"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useCustomerStore } from '../stores/customerStore.js'
import { ElMessage, ElMessageBox } from 'element-plus'

const customerStore = useCustomerStore()

// 搜索参数
const searchKeyword = ref('')
const currentPage = ref(1)
const pageSize = ref(10)

// 获取客户列表
const fetchData = async () => {
  await customerStore.fetchCustomers({
    page: currentPage.value,
    pageSize: pageSize.value,
    keyword: searchKeyword.value
  })
}

// 搜索
const handleSearch = () => {
  currentPage.value = 1
  fetchData()
}

// 分页变化
const handlePageChange = (page) => {
  currentPage.value = page
  customerStore.setPage(page)
  fetchData()
}

// 删除客户
const deleteCustomer = async (id) => {
  try {
    await ElMessageBox.confirm('确定删除该客户吗？', '提示', {
      type: 'warning'
    })
    await customerStore.deleteCustomer(id)
    ElMessage.success('删除成功')
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
    }
  }
}

// 页面加载时获取数据
onMounted(() => {
  fetchData()
})
</script>
```

---

## 错误处理

### 全局错误处理

API模块已配置全局错误拦截器，会自动处理以下情况：

- **401**: 未授权，自动跳转到登录页
- **403**: 无权限访问
- **404**: 资源不存在
- **500**: 服务器内部错误
- **网络错误**: 提示检查网络连接

### 组件内错误处理

```javascript
// 方式1: 使用try-catch
try {
  await customerStore.createCustomer(data)
} catch (error) {
  // 错误已在store中显示ElMessage
  // 这里可以添加额外的错误处理
  console.error('业务错误:', error)
}

// 方式2: 检查error状态
await customerStore.fetchCustomers()
if (customerStore.error) {
  console.error('请求失败:', customerStore.error)
}
```

---

## 后端接口规范

### 请求规范

```
基础URL: /api
Content-Type: application/json
Authorization: Bearer {token}
```

### 响应规范

```json
{
  "code": 200,        // 状态码: 200成功, 其他为错误
  "message": "成功",   // 提示信息
  "data": {}          // 响应数据
}
```

### 分页响应

```json
{
  "code": 200,
  "message": "成功",
  "data": {
    "list": [],       // 数据列表
    "total": 100,     // 总记录数
    "page": 1,        // 当前页
    "pageSize": 10    // 每页数量
  }
}
```

### 客户管理接口列表

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /customers | 获取客户列表 |
| GET | /customers/:id | 获取客户详情 |
| POST | /customers | 创建客户 |
| PUT | /customers/:id | 更新客户 |
| DELETE | /customers/:id | 删除客户 |
| DELETE | /customers/batch | 批量删除 |
| GET | /customers/export | 导出Excel |
| POST | /customers/import | 导入Excel |
| GET | /customers/statistics | 获取统计 |

---

## 下一步

按照此示例，可以为其他模块创建类似的API服务：

1. 设备管理 (`assetApi.js`)
2. 工单管理 (`workorderApi.js`)
3. 员工管理 (`employeeApi.js`)
4. 配件管理 (`partsApi.js`)
5. 报价管理 (`quotationApi.js`)

每个模块遵循相同的模式：
- 创建API服务文件
- 更新对应的Store
- 在组件中使用Store方法
