# 页面API集成指南

本文档说明如何将现有的Vue页面组件与API服务进行集成。

## 目录

1. [快速开始](#快速开始)
2. [集成步骤](#集成步骤)
3. [Customer.vue集成示例](#customerview集成示例)
4. [注意事项](#注意事项)

---

## 快速开始

### 1. 环境配置

确保已创建 `.env` 文件：

```env
VITE_API_BASE_URL=http://localhost:8080/api
```

### 2. API导入

在需要使用API的组件中导入：

```javascript
import { useCustomerStore } from '@/stores/customerStore.js'
```

---

## 集成步骤

### 步骤1: 导入Store

```javascript
import { useCustomerStore } from '@/stores/customerStore.js'
```

### 步骤2: 在setup中初始化Store

```javascript
setup() {
  const customerStore = useCustomerStore()
  // ...
}
```

### 步骤3: 替换数据获取

**原来** (使用本地数据)：
```javascript
const customers = ref([
  { id: 1, name: '张三' },
  { id: 2, name: '李四' }
])
```

**现在** (使用API)：
```javascript
// 组件中
const customers = ref([])
const loading = ref(false)

// 获取数据
const fetchData = async () => {
  loading.value = true
  try {
    await customerStore.fetchCustomers()
    customers.value = customerStore.customers
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchData()
})
```

### 步骤4: 替换CRUD操作

**创建**:
```javascript
const handleCreate = async (data) => {
  await customerStore.createCustomer(data)
  await customerStore.fetchCustomers()
}
```

**更新**:
```javascript
const handleUpdate = async (id, data) => {
  await customerStore.updateCustomer(id, data)
  await customerStore.fetchCustomers()
}
```

**删除**:
```javascript
const handleDelete = async (id) => {
  await ElMessageBox.confirm('确定删除吗？')
  await customerStore.deleteCustomer(id)
}
```

---

## Customer.vue集成示例

### 1. 修改import部分

```javascript
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { Plus, Search, ArrowDown, ArrowUp, Refresh } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import ConfigurableTable from '../components/ConfigurableTable.vue'
import { useCustomerStore } from '@/stores/customerStore.js'
```

### 2. 添加Store初始化

```javascript
setup() {
  // 初始化Store
  const customerStore = useCustomerStore()
  
  // 原有状态...
  const quickSearchKeyword = ref('')
  // ...
  
  // 替换数据为computed
  const customers = computed(() => customerStore.customers)
  const loading = computed(() => customerStore.loading)
  const pagination = computed(() => customerStore.pagination)
  
  // ...
}
```

### 3. 添加数据获取方法

```javascript
// 获取客户列表
const fetchCustomers = async () => {
  await customerStore.fetchCustomers({
    page: currentPage.value,
    pageSize: pageSize.value,
    keyword: searchQuery.value,
    level: customerLevel.value
  })
}

// 页面加载时获取数据
onMounted(() => {
  fetchCustomers()
})
```

### 4. 修改搜索和分页

```javascript
// 搜索
const handleQuickSearch = () => {
  searchQuery.value = quickSearchKeyword.value
  currentPage.value = 1
  fetchCustomers()
}

// 重置
const handleReset = () => {
  quickSearchKeyword.value = ''
  queryForm.customerName = ''
  queryForm.level = ''
  queryForm.phone = ''
  queryForm.dateRange = []
  searchQuery.value = ''
  customerLevel.value = ''
  currentPage.value = 1
  fetchCustomers()
}

// 分页
const handleSizeChange = (val) => {
  pageSize.value = val
  customerStore.setPageSize(val)
  fetchCustomers()
}

const handleCurrentChange = (val) => {
  currentPage.value = val
  customerStore.setPage(val)
  fetchCustomers()
}
```

### 5. 修改CRUD操作

```javascript
// 新增
const handleAddCustomer = () => {
  dialogTitle.value = '新增客户'
  Object.keys(form).forEach(key => {
    form[key] = key === 'level' ? '普通' : ''
  })
  dialogVisible.value = true
}

// 编辑
const handleEditCustomer = (row) => {
  dialogTitle.value = '编辑客户'
  Object.assign(form, row)
  dialogVisible.value = true
}

// 提交表单
const handleSubmit = async () => {
  if (form.id) {
    // 更新
    await customerStore.updateCustomer(form.id, form)
  } else {
    // 创建
    await customerStore.createCustomer(form)
  }
  dialogVisible.value = false
  await fetchCustomers()
}

// 删除
const handleDeleteCustomer = async (id) => {
  try {
    await ElMessageBox.confirm('确定删除该客户吗？', '提示', {
      type: 'warning'
    })
    await customerStore.deleteCustomer(id)
    ElMessage.success('删除成功')
    await fetchCustomers()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
    }
  }
}
```

### 6. 完整代码结构

```vue
<template>
  <!-- 模板保持不变，只需确保绑定的数据来自computed -->
  <ConfigurableTable
    :data="customers"
    :loading="loading"
    :columns="tableColumns"
    @sort-change="handleSortChange"
  />
</template>

<script>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import ConfigurableTable from '../components/ConfigurableTable.vue'
import { useCustomerStore } from '@/stores/customerStore.js'

export default {
  setup() {
    // 1. 初始化Store
    const customerStore = useCustomerStore()
    
    // 2. 状态
    const quickSearchKeyword = ref('')
    const searchQuery = ref('')
    const currentPage = ref(1)
    const pageSize = ref(10)
    
    // 3. Computed数据（替换原有ref数据）
    const customers = computed(() => customerStore.customers)
    const loading = computed(() => customerStore.loading)
    const total = computed(() => customerStore.pagination.total)
    
    // 4. 方法
    const fetchCustomers = async () => {
      await customerStore.fetchCustomers({
        page: currentPage.value,
        pageSize: pageSize.value,
        keyword: searchQuery.value
      })
    }
    
    const handleQuickSearch = () => {
      searchQuery.value = quickSearchKeyword.value
      currentPage.value = 1
      fetchCustomers()
    }
    
    const handleDeleteCustomer = async (id) => {
      await ElMessageBox.confirm('确定删除吗？')
      await customerStore.deleteCustomer(id)
      await fetchCustomers()
    }
    
    // 5. 生命周期
    onMounted(() => {
      fetchCustomers()
    })
    
    return {
      customers,
      loading,
      total,
      fetchCustomers,
      handleQuickSearch,
      handleDeleteCustomer
    }
  }
}
</script>
```

---

## 注意事项

### 1. 数据同步

由于Store中的数据是响应式的，组件中的computed会自动更新：

```javascript
// 无需手动更新，computed会自动响应
const customers = computed(() => customerStore.customers)
```

### 2. 加载状态

使用Store的loading状态：

```javascript
const loading = computed(() => customerStore.loading)
```

### 3. 错误处理

Store方法已内置错误处理，但可以在组件中补充：

```javascript
try {
  await customerStore.createCustomer(data)
} catch (error) {
  // 额外处理（如日志上报）
  console.error('创建客户失败:', error)
}
```

### 4. 分页

使用Store的分页方法：

```javascript
customerStore.setPage(1)      // 设置当前页
customerStore.setPageSize(20) // 设置每页数量
```

### 5. 刷新数据

CRUD操作后自动刷新：

```javascript
const handleSubmit = async () => {
  await customerStore.createCustomer(form)
  await customerStore.fetchCustomers() // 刷新列表
}
```

### 6. 搜索和筛选

将搜索条件传给API：

```javascript
await customerStore.fetchCustomers({
  keyword: '上海',
  level: 'VIP',
  status: 'active'
})
```

---

## 其他模块

按照相同模式，可以为其他模块进行集成：

| 模块 | Store文件 | API文件 |
|------|----------|---------|
| 设备管理 | assetStore.js | assetApi.js |
| 工单管理 | workorderStore.js | workorderApi.js |
| 员工管理 | employeeStore.js | employeeApi.js |
| 配件管理 | partsStore.js | partsApi.js |
| 报价管理 | quotationStore.js | quotationApi.js |

每个模块的集成方式完全相同，只需替换相应的Store和API。
