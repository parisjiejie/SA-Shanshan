<template>
  <div class="scan-container">
    <h2>机器扫码</h2>
    
    <!-- 扫码区域 -->
    <div class="scan-area" v-if="!scanned">
      <div class="scan-box">
        <el-icon :size="60" color="#409EFF"><Camera /></el-icon>
        <p>请将设备二维码放入框内扫描</p>
        <el-button type="primary" @click="simulateScan">模拟扫码</el-button>
      </div>
    </div>
    
    <!-- 扫码结果 - 设备信息 -->
    <div class="scan-result" v-else-if="deviceInfo">
      <el-card class="device-card">
        <template #header>
          <div class="card-header">
            <span>设备档案</span>
            <el-button type="primary" @click="resetScan">重新扫码</el-button>
          </div>
        </template>
        
        <el-descriptions :column="2" border>
          <el-descriptions-item label="设备序列号">{{ deviceInfo.serialNumber }}</el-descriptions-item>
          <el-descriptions-item label="设备型号">{{ deviceInfo.model }}</el-descriptions-item>
          <el-descriptions-item label="出厂日期">{{ deviceInfo.manufactureDate }}</el-descriptions-item>
          <el-descriptions-item label="销售日期">{{ deviceInfo.saleDate }}</el-descriptions-item>
          <el-descriptions-item label="保修截止日">{{ deviceInfo.warrantyEndDate }}</el-descriptions-item>
          <el-descriptions-item label="当前状态">
            <el-tag :type="getStatusType(deviceInfo.status)">{{ deviceInfo.status }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="是否EL">{{ deviceInfo.isEL ? '是' : '否' }}</el-descriptions-item>
          <el-descriptions-item label="安装地址">{{ deviceInfo.installAddress }}</el-descriptions-item>
          <el-descriptions-item label="客户名称">{{ deviceInfo.customerName }}</el-descriptions-item>
          <el-descriptions-item label="联系人">{{ deviceInfo.contactPerson }}</el-descriptions-item>
          <el-descriptions-item label="联系电话">{{ deviceInfo.contactPhone }}</el-descriptions-item>
        </el-descriptions>
      </el-card>
      
      <!-- 操作按钮 -->
      <div class="action-buttons">
        <el-button type="primary" @click="showRepairDialog = true">
          <el-icon><Edit /></el-icon>
          一键报修
        </el-button>
        <el-button type="success" @click="showManualDialog = true">
          <el-icon><Document /></el-icon>
          查看操作手册
        </el-button>
        <el-button type="info" @click="showHistoryDialog = true">
          <el-icon><List /></el-icon>
          维修记录
        </el-button>
      </div>
    </div>
    
    <!-- 报修对话框 -->
    <el-dialog v-model="showRepairDialog" title="一键报修" width="600px">
      <el-form :model="repairForm" label-width="100px">
        <el-form-item label="设备序列号">
          <el-input v-model="repairForm.serialNumber" disabled />
        </el-form-item>
        <el-form-item label="故障描述">
          <el-input v-model="repairForm.description" type="textarea" :rows="3" placeholder="请描述故障现象" />
        </el-form-item>
        <el-form-item label="紧急程度">
          <el-radio-group v-model="repairForm.urgency">
            <el-radio value="low">一般</el-radio>
            <el-radio value="medium">紧急</el-radio>
            <el-radio value="high">特急</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="联系人">
          <el-input v-model="repairForm.contactPerson" placeholder="请输入联系人" />
        </el-form-item>
        <el-form-item label="联系电话">
          <el-input v-model="repairForm.contactPhone" placeholder="请输入联系电话" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showRepairDialog = false">取消</el-button>
        <el-button type="primary" @click="submitRepair">提交报修</el-button>
      </template>
    </el-dialog>
    
    <!-- 操作手册对话框 -->
    <el-dialog v-model="showManualDialog" title="操作手册" width="800px">
      <div class="manual-content">
        <h3>{{ deviceInfo?.model }} 操作手册</h3>
        <el-divider />
        <div class="manual-section">
          <h4>1. 设备简介</h4>
          <p>本设备为工业级机械设备，适用于...（此处为操作手册内容）</p>
        </div>
        <div class="manual-section">
          <h4>2. 操作说明</h4>
          <p>2.1 开机前检查...<br>2.2 启动步骤...<br>2.3 运行监控...</p>
        </div>
        <div class="manual-section">
          <h4>3. 维护保养</h4>
          <p>3.1 日常维护...<br>3.2 定期保养...<br>3.3 故障排除...</p>
        </div>
        <div class="manual-section">
          <h4>4. 安全注意事项</h4>
          <p>4.1 操作安全...<br>4.2 维护安全...<br>4.3 紧急情况处理...</p>
        </div>
      </div>
    </el-dialog>
    
    <!-- 维修记录对话框 -->
    <el-dialog v-model="showHistoryDialog" title="维修记录" width="900px">
      <el-table :data="repairHistory" style="width: 100%">
        <el-table-column prop="date" label="维修日期" width="120" />
        <el-table-column prop="type" label="维修类型" width="100">
          <template #default="scope">
            <el-tag :type="getRepairTypeType(scope.row.type)">{{ scope.row.type }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="故障描述" />
        <el-table-column prop="solution" label="解决方案" />
        <el-table-column prop="engineer" label="维修工程师" width="100" />
        <el-table-column prop="status" label="状态" width="80">
          <template #default="scope">
            <el-tag :type="scope.row.status === '已完成' ? 'success' : 'warning'">{{ scope.row.status }}</el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>
    
    <!-- 空白码绑定对话框 -->
    <el-dialog v-model="showBindDialog" title="绑定设备信息" width="500px" :close-on-click-modal="false">
      <el-alert
        title="检测到空白码"
        description="该二维码尚未绑定设备，请输入设备序列号或扫描设备名牌进行绑定"
        type="warning"
        :closable="false"
        style="margin-bottom: 20px"
      />
      <el-form :model="bindForm" label-width="120px" :rules="bindRules" ref="bindFormRef">
        <el-form-item label="设备序列号" prop="serialNumber">
          <el-input 
            v-model="bindForm.serialNumber" 
            placeholder="请输入设备序列号或扫描设备名牌"
            clearable
          >
            <template #append>
              <el-button @click="scanDeviceNameplate">
                <el-icon><Camera /></el-icon>
                扫码
              </el-button>
            </template>
          </el-input>
        </el-form-item>
      </el-form>
      <div v-if="matchedDevice" class="matched-device-info">
        <el-divider />
        <h4>匹配到的设备信息：</h4>
        <el-descriptions :column="1" border size="small">
          <el-descriptions-item label="设备型号">{{ matchedDevice.model }}</el-descriptions-item>
          <el-descriptions-item label="客户名称">{{ matchedDevice.customerName }}</el-descriptions-item>
          <el-descriptions-item label="安装地址">{{ matchedDevice.installAddress }}</el-descriptions-item>
          <el-descriptions-item label="保修截止">{{ matchedDevice.warrantyEndDate }}</el-descriptions-item>
        </el-descriptions>
      </div>
      <template #footer>
        <el-button @click="cancelBind">取消</el-button>
        <el-button type="primary" @click="submitBind" :disabled="!matchedDevice">确认绑定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, watch } from 'vue'
import { Camera, Edit, Document, List } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

export default {
  name: 'Scan',
  components: {
    Camera,
    Edit,
    Document,
    List
  },
  setup() {
    const scanned = ref(false)
    const deviceInfo = ref(null)
    const showRepairDialog = ref(false)
    const showManualDialog = ref(false)
    const showHistoryDialog = ref(false)
    
    // 空白码绑定相关
    const showBindDialog = ref(false)
    const bindFormRef = ref(null)
    const matchedDevice = ref(null)
    
    const bindForm = reactive({
      serialNumber: ''
    })
    
    const bindRules = {
      serialNumber: [{ required: true, message: '请输入设备序列号', trigger: 'blur' }]
    }
    
    // 模拟设备管理数据库
    const deviceDatabase = [
      {
        serialNumber: 'SN001',
        model: 'Model A',
        customerName: '上海某机械有限公司',
        status: '运行中',
        manufactureDate: '2025-12-01',
        saleDate: '2026-01-05',
        warrantyEndDate: '2027-01-10',
        isEL: true,
        installAddress: '上海市浦东新区张江高科技园区',
        contactPerson: '张经理',
        contactPhone: '13800138001'
      },
      {
        serialNumber: 'SN002',
        model: 'Model B',
        customerName: '北京某设备制造有限公司',
        status: '运行中',
        manufactureDate: '2025-11-15',
        saleDate: '2026-01-10',
        warrantyEndDate: '2027-01-15',
        isEL: false,
        installAddress: '北京市朝阳区建国路',
        contactPerson: '李经理',
        contactPhone: '13800138002'
      },
      {
        serialNumber: 'SN003',
        model: 'Model C',
        customerName: '广州某工业设备有限公司',
        status: '运行中',
        manufactureDate: '2025-10-20',
        saleDate: '2026-01-15',
        warrantyEndDate: '2027-01-20',
        isEL: true,
        installAddress: '广州市天河区珠江新城',
        contactPerson: '王经理',
        contactPhone: '13800138003'
      }
    ]
    
    const repairForm = reactive({
      serialNumber: '',
      description: '',
      urgency: 'medium',
      contactPerson: '',
      contactPhone: ''
    })
    
    // 模拟设备数据
    const mockDeviceData = {
      serialNumber: 'SN202403001',
      model: 'Model-X2000',
      manufactureDate: '2024-01-15',
      saleDate: '2024-02-20',
      warrantyEndDate: '2026-02-19',
      status: '运行中',
      isEL: true,
      installAddress: '广州市天河区科技园路1号',
      customerName: '广州某工厂',
      contactPerson: '张经理',
      contactPhone: '13800138000'
    }
    
    // 模拟维修记录
    const repairHistory = ref([
      {
        date: '2024-03-15',
        type: '维修',
        description: '设备运行异常，有异响',
        solution: '更换轴承，调整皮带张力',
        engineer: '王工程师',
        status: '已完成'
      },
      {
        date: '2024-02-10',
        type: '保养',
        description: '定期保养维护',
        solution: '清洁设备，更换润滑油，检查各部件',
        engineer: '李工程师',
        status: '已完成'
      },
      {
        date: '2024-01-20',
        type: '安装',
        description: '新设备安装调试',
        solution: '完成设备安装，进行调试和培训',
        engineer: '王工程师',
        status: '已完成'
      }
    ])
    
    // 监听序列号输入，自动匹配设备
    watch(() => bindForm.serialNumber, (newVal) => {
      if (newVal) {
        const matched = deviceDatabase.find(device => device.serialNumber === newVal)
        matchedDevice.value = matched || null
      } else {
        matchedDevice.value = null
      }
    })
    
    // 模拟扫码
    const simulateScan = () => {
      // 实际项目中这里会调用摄像头扫码API
      setTimeout(() => {
        // 模拟扫描到空白码（序列号为空的设备）
        const isBlankCode = Math.random() > 0.7 // 30%概率模拟空白码
        
        if (isBlankCode) {
          // 空白码，需要绑定动态码
          showBindDialog.value = true
          scanned.value = true
          deviceInfo.value = null
          ElMessage.warning('检测到空白码，请先绑定设备信息')
        } else {
          // 正常码，显示设备信息
          deviceInfo.value = mockDeviceData
          repairForm.serialNumber = mockDeviceData.serialNumber
          repairForm.contactPerson = mockDeviceData.contactPerson
          repairForm.contactPhone = mockDeviceData.contactPhone
          scanned.value = true
          ElMessage.success('扫码成功')
        }
      }, 1000)
    }
    
    // 扫描设备名牌（模拟）
    const scanDeviceNameplate = () => {
      // 实际项目中这里会调用摄像头扫码API扫描设备名牌
      setTimeout(() => {
        // 模拟扫描到SN001
        bindForm.serialNumber = 'SN001'
        ElMessage.success('扫描设备名牌成功')
      }, 800)
    }
    
    // 重置扫码
    const resetScan = () => {
      scanned.value = false
      deviceInfo.value = null
    }
    
    // 取消绑定
    const cancelBind = () => {
      showBindDialog.value = false
      resetScan()
      // 重置表单
      bindForm.serialNumber = ''
      matchedDevice.value = null
    }
    
    // 提交绑定
    const submitBind = async () => {
      if (!bindFormRef.value) return
      
      await bindFormRef.value.validate((valid) => {
        if (valid && matchedDevice.value) {
          // 将匹配到的设备信息赋值给deviceInfo
          deviceInfo.value = matchedDevice.value
          repairForm.serialNumber = matchedDevice.value.serialNumber
          repairForm.contactPerson = matchedDevice.value.contactPerson
          repairForm.contactPhone = matchedDevice.value.contactPhone
          showBindDialog.value = false
          ElMessage.success('设备绑定成功')
          // 重置表单
          bindForm.serialNumber = ''
          matchedDevice.value = null
        }
      })
    }
    
    // 提交报修
    const submitRepair = () => {
      if (!repairForm.description) {
        ElMessage.warning('请输入故障描述')
        return
      }
      
      // 实际项目中这里会调用API提交报修
      ElMessage.success('报修申请已提交')
      showRepairDialog.value = false
      
      // 重置表单
      repairForm.description = ''
      repairForm.urgency = 'medium'
    }
    
    // 获取状态标签类型
    const getStatusType = (status) => {
      const statusMap = {
        '运行中': 'success',
        '停机': 'danger',
        '维修中': 'warning'
      }
      return statusMap[status] || 'info'
    }
    
    // 获取维修类型标签类型
    const getRepairTypeType = (type) => {
      const typeMap = {
        '维修': 'danger',
        '保养': 'success',
        '安装': 'primary'
      }
      return typeMap[type] || 'info'
    }
    
    return {
      scanned,
      deviceInfo,
      showRepairDialog,
      showManualDialog,
      showHistoryDialog,
      showBindDialog,
      bindFormRef,
      bindForm,
      bindRules,
      matchedDevice,
      repairForm,
      repairHistory,
      simulateScan,
      scanDeviceNameplate,
      resetScan,
      cancelBind,
      submitBind,
      submitRepair,
      getStatusType,
      getRepairTypeType
    }
  }
}
</script>

<style scoped>
.scan-container {
  padding: 20px;
}

.scan-area {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
}

.scan-box {
  width: 300px;
  height: 300px;
  border: 2px dashed #409EFF;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background-color: #f5f7fa;
}

.scan-box p {
  margin: 20px 0;
  color: #606266;
}

.scan-result {
  margin-top: 20px;
}

.device-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.action-buttons {
  display: flex;
  gap: 15px;
  margin-top: 20px;
  justify-content: center;
}

.action-buttons .el-button {
  padding: 15px 30px;
  font-size: 16px;
}

.manual-content {
  max-height: 500px;
  overflow-y: auto;
}

.manual-section {
  margin-bottom: 20px;
}

.manual-section h4 {
  color: #303133;
  margin-bottom: 10px;
}

.manual-section p {
  color: #606266;
  line-height: 1.8;
}

.matched-device-info {
  margin-top: 20px;
}

.matched-device-info h4 {
  color: #67C23A;
  margin-bottom: 15px;
}
</style>
