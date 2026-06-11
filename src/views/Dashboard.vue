<template>
  <div class="dashboard">
    <!-- 待处理信息（紧凑一行） -->
    <div v-if="notifications.length > 0" class="pending-bar">
      <div class="pending-bar-content">
        <el-icon class="pending-icon"><Bell /></el-icon>
        <span class="pending-label">待处理</span>
        <template v-for="(group, gIdx) in groupedNotifications" :key="gIdx">
          <el-tag
            v-if="group.count > 0"
            :type="group.tagType"
            size="small"
            class="pending-tag"
            @click="handleNotificationGroupClick(group)"
          >
            {{ group.label }} {{ group.count }}
          </el-tag>
        </template>
        <el-button v-if="notifications.length > summaryCount" link type="primary" size="small" @click="viewAllNotifications" class="pending-more">
          查看全部
        </el-button>
      </div>
    </div>

    <!-- ========== 顶部数据卡片 ========== -->
    <div class="stat-cards-row">
      <div class="stat-card-item">
        <div class="stat-num cyan">{{ totalWorkorders }}</div>
        <div class="stat-lbl">工单总数</div>
      </div>
      <div class="stat-card-item">
        <div class="stat-num orange">{{ pendingAccept }}</div>
        <div class="stat-lbl">待接单</div>
      </div>
      <div class="stat-card-item">
        <div class="stat-num blue">{{ processing }}</div>
        <div class="stat-lbl">进行中</div>
      </div>
      <div class="stat-card-item">
        <div class="stat-num green">{{ completed }}</div>
        <div class="stat-lbl">已完成</div>
      </div>
    </div>

    <!-- ========== 图表区 第1行 ========== -->
    <el-row :gutter="20">
      <el-col :xs="24" :lg="12">
        <el-card shadow="hover" class="mb-4 chart-card">
          <template #header>
            <div class="card-header">
              <span><el-icon><UserFilled /></el-icon> 工程师本月工时结算</span>
            </div>
          </template>
          <div ref="hoursChart" class="chart-box"></div>
        </el-card>
      </el-col>
      <el-col :xs="24" :lg="12">
        <el-card shadow="hover" class="mb-4 chart-card">
          <template #header>
            <div class="card-header">
              <span><el-icon><DataAnalysis /></el-icon> 工单类型分布</span>
            </div>
          </template>
          <div ref="typeChart" class="chart-box"></div>
        </el-card>
      </el-col>
    </el-row>

    <!-- ========== 图表区 第2行 ========== -->
    <el-row :gutter="20">
      <el-col :xs="24" :lg="12">
        <el-card shadow="hover" class="mb-4 chart-card">
          <template #header>
            <div class="card-header">
              <span><el-icon><TrendCharts /></el-icon> 近12月工单趋势</span>
            </div>
          </template>
          <div ref="trendChart" class="chart-box"></div>
        </el-card>
      </el-col>
      <el-col :xs="24" :lg="12">
        <el-card shadow="hover" class="mb-4 chart-card">
          <template #header>
            <div class="card-header">
              <span><el-icon><PieChart /></el-icon> 工单节点分布</span>
            </div>
          </template>
          <div ref="nodeChart" class="chart-box"></div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted, computed, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import * as echarts from 'echarts'
import { getAssistantNotifications, markNotificationAsRead, getPendingWorkordersByRole, checkTimeoutAlarms } from '../stores/workorderFlowStore.js'
import { getActionNotificationsByRole } from '../stores/notificationStore.js'
import { ElMessage } from 'element-plus'
import { TrendCharts, PieChart, UserFilled, DataAnalysis, Bell } from '@element-plus/icons-vue'

export default {
  name: 'Dashboard',
  components: {
    TrendCharts, PieChart, UserFilled, DataAnalysis
  },
  setup() {
    const router = useRouter()

    const totalWorkorders = ref(892)
    const pendingAccept = ref(37)
    const processing = ref(56)
    const completed = ref(628)

    const notifications = ref([])
    const unreadCount = computed(() => notifications.value.filter(n => !n.isRead).length)
    const summaryCount = 10

    const groupedNotifications = computed(() => {
      const groups = {}
      notifications.value.forEach(n => {
        const key = n.title || n.type || '其他'
        if (!groups[key]) groups[key] = { label: key, count: 0, tagType: 'warning', items: [] }
        groups[key].count++
        groups[key].items.push(n)
        if (n.type && n.type.includes('complete')) groups[key].tagType = 'success'
        else if (n.type && n.type.includes('reject')) groups[key].tagType = 'danger'
      })
      return Object.values(groups)
    })

    const handleNotificationGroupClick = (group) => {
      if (group.items && group.items.length > 0) {
        const first = group.items[0]
        markNotificationAsRead(first.id)
        loadNotifications()
        if (first.jumpPath) router.push(first.jumpPath)
        else if (first.relatedId) router.push(`/workorder?id=${first.relatedId}`)
      }
    }
    const viewAllNotifications = () => {
      ElMessage.info('通知中心功能开发中...')
    }
    const trendChart = ref(null)
    const nodeChart = ref(null)
    const hoursChart = ref(null)
    const typeChart = ref(null)
    let trendInstance = null
    let nodeInstance = null
    let hoursInstance = null
    let typeInstance = null

    const loadNotifications = () => {
      try {
        const auth = JSON.parse(localStorage.getItem('staffAuth') || '{}')
        notifications.value = getActionNotificationsByRole(auth.role)
      } catch (e) { /* ignore */ }
    }

    const formatTime = (time) => {
      if (!time) return ''
      return new Date(time).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
    }

    const initTrendChart = () => {
      if (!trendChart.value) return
      if (trendInstance) trendInstance.dispose()
      trendInstance = echarts.init(trendChart.value, null, { devicePixelRatio: 2 })
      trendInstance.setOption({
        tooltip: { trigger: 'axis', backgroundColor: '#fff', borderColor: '#e4e7ed', borderRadius: 6, textStyle: { color: '#303133', fontSize: 12 } },
        legend: { bottom: 0, data: ['工单数', '完成数'], textStyle: { color: '#606266', fontSize: 11 } },
        grid: { left: '3%', right: '4%', bottom: '12%', top: '8%', containLabel: true },
        xAxis: {
          type: 'category', boundaryGap: false,
          data: ['7月','8月','9月','10月','11月','12月','1月','2月','3月','4月','5月','6月'],
          axisLine: { lineStyle: { color: '#dcdfe6' } }, axisTick: { show: false },
          axisLabel: { color: '#606266', fontSize: 12 }
        },
        yAxis: {
          type: 'value',
          axisLine: { show: false }, axisTick: { show: false },
          axisLabel: { color: '#909399', fontSize: 12 },
          splitLine: { lineStyle: { color: '#ebeef5', type: 'dashed' } }
        },
        series: [
          {
            name: '工单数', type: 'line', smooth: true, symbol: 'circle', symbolSize: 6,
            lineStyle: { width: 2, color: '#4a86ff' },
            itemStyle: { color: '#4a86ff' },
            areaStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: 'rgba(74,134,255,0.3)' },
                { offset: 1, color: 'rgba(74,134,255,0)' }
              ])
            },
            data: [65, 78, 72, 85, 69, 90, 55, 73, 82, 88, 76, 92]
          },
          {
            name: '完成数', type: 'line', smooth: true, symbol: 'circle', symbolSize: 6,
            lineStyle: { width: 2, color: '#00d98b' },
            itemStyle: { color: '#00d98b' },
            areaStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: 'rgba(0,217,139,0.3)' },
                { offset: 1, color: 'rgba(0,217,139,0)' }
              ])
            },
            data: [58, 72, 65, 78, 62, 85, 50, 66, 75, 80, 70, 85]
          }
        ]
      })
    }

    const initNodeChart = () => {
      if (!nodeChart.value) return
      if (nodeInstance) nodeInstance.dispose()
      nodeInstance = echarts.init(nodeChart.value, null, { devicePixelRatio: 2 })
      nodeInstance.setOption({
        tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)', backgroundColor: '#fff', borderColor: '#e4e7ed', borderRadius: 6, textStyle: { color: '#303133', fontSize: 12 } },
        legend: { bottom: 0, itemWidth: 12, itemHeight: 12, textStyle: { color: '#606266', fontSize: 11 } },
        series: [{
          name: '工单节点',
          type: 'pie',
          radius: ['45%', '72%'],
          center: ['50%', '45%'],
          avoidLabelOverlap: false,
          itemStyle: { borderRadius: 0, borderColor: '#fff', borderWidth: 3 },
          label: { show: false },
          emphasis: { label: { show: true, fontSize: 14, fontWeight: 'bold', color: '#fff' } },
          data: [
            { value: 37, name: '待分配', itemStyle: { color: '#ff9f43' } },
            { value: 33, name: '待接单', itemStyle: { color: '#ff5757' } },
            { value: 56, name: '进行中', itemStyle: { color: '#4a86ff' } },
            { value: 18, name: '待签字', itemStyle: { color: '#a78bfa' } },
            { value: 12, name: '课长确认', itemStyle: { color: '#a78bfa' } },
            { value: 8, name: '业务确认', itemStyle: { color: '#00e0d0' } },
            { value: 628, name: '已完成', itemStyle: { color: '#00d98b' } }
          ]
        }]
      })
    }

    const initHoursChart = () => {
      if (!hoursChart.value) return
      if (hoursInstance) hoursInstance.dispose()
      hoursInstance = echarts.init(hoursChart.value, null, { devicePixelRatio: 2 })
      const engineers = ['张工程师', '王工程师', '赵工程师', '李工程师', '刘工程师']
      const hoursWorked = [172, 156, 188, 145, 163]
      const hoursOvertime = [12, 0, 18, 0, 8]
      hoursInstance.setOption({
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, backgroundColor: '#fff', borderColor: '#e4e7ed', borderRadius: 6, textStyle: { color: '#303133', fontSize: 12 } },
        legend: { bottom: 0, data: ['正常工时', '加班工时'], textStyle: { color: '#606266', fontSize: 11 } },
        grid: { left: '3%', right: '4%', bottom: '12%', top: '8%', containLabel: true },
        xAxis: {
          type: 'value', max: 220,
          axisLine: { show: false }, axisTick: { show: false },
          axisLabel: { color: '#909399', fontSize: 12 },
          splitLine: { lineStyle: { color: '#ebeef5', type: 'dashed' } }
        },
        yAxis: {
          type: 'category', data: engineers,
          axisLine: { lineStyle: { color: '#dcdfe6' } }, axisTick: { show: false },
          axisLabel: { color: '#606266', fontSize: 12 }
        },
        series: [
          {
            name: '正常工时', type: 'bar', stack: 'total',
            barWidth: 14, itemStyle: { borderRadius: [0, 4, 4, 0], color: '#4a86ff' },
            label: { show: true, position: 'right', formatter: '{c}h', fontSize: 11, color: '#8b9cc0' },
            data: hoursWorked
          },
          {
            name: '加班工时', type: 'bar', stack: 'total',
            barWidth: 14, itemStyle: { borderRadius: [0, 4, 4, 0], color: '#ff9f43' },
            label: { show: true, position: 'right', formatter: p => p.value > 0 ? `+${p.value}h` : '', fontSize: 11, color: '#8b9cc0' },
            data: hoursOvertime
          }
        ]
      })
    }

    const initTypeChart = () => {
      if (!typeChart.value) return
      if (typeInstance) typeInstance.dispose()
      typeInstance = echarts.init(typeChart.value, null, { devicePixelRatio: 2 })
      typeInstance.setOption({
        tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)', backgroundColor: '#fff', borderColor: '#e4e7ed', borderRadius: 6, textStyle: { color: '#303133', fontSize: 12 } },
        legend: { bottom: 0, itemWidth: 12, itemHeight: 12, textStyle: { color: '#606266', fontSize: 11 } },
        series: [{
          name: '工单类型',
          type: 'pie',
          radius: ['45%', '72%'],
          center: ['50%', '45%'],
          itemStyle: { borderRadius: 0, borderColor: '#fff', borderWidth: 3 },
          label: { show: false },
          emphasis: { label: { show: true, fontSize: 14, fontWeight: 'bold', color: '#fff' } },
          data: [
            { value: 380, name: '维修', itemStyle: { color: '#4a86ff' } },
            { value: 210, name: '试加工', itemStyle: { color: '#00d98b' } },
            { value: 165, name: '安装', itemStyle: { color: '#ff9f43' } },
            { value: 78, name: '改造', itemStyle: { color: '#ff5757' } },
            { value: 59, name: '其他', itemStyle: { color: '#a78bfa' } }
          ]
        }]
      })
    }

    const initAllCharts = () => {
      nextTick(() => {
        initTrendChart()
        initNodeChart()
        initHoursChart()
        initTypeChart()
      })
    }

    const handleResize = () => {
      trendInstance?.resize()
      nodeInstance?.resize()
      hoursInstance?.resize()
      typeInstance?.resize()
    }

    let timeoutTimer = null

    onMounted(() => {
      initAllCharts()
      loadNotifications()
      checkTimeoutAlarms()
      timeoutTimer = setInterval(checkTimeoutAlarms, 5 * 60 * 1000)
      window.addEventListener('resize', handleResize)
      window.addEventListener('staff-notification-updated', loadNotifications)
      window.addEventListener('quotation-updated', loadNotifications)
      window.addEventListener('workorder-flow-updated', loadNotifications)
      window.addEventListener('new-notification', loadNotifications)
    })

    onUnmounted(() => {
      if (timeoutTimer) clearInterval(timeoutTimer)
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('staff-notification-updated', loadNotifications)
      window.removeEventListener('quotation-updated', loadNotifications)
      window.removeEventListener('workorder-flow-updated', loadNotifications)
      window.removeEventListener('new-notification', loadNotifications)
      trendInstance?.dispose()
      nodeInstance?.dispose()
      hoursInstance?.dispose()
      typeInstance?.dispose()
    })

    return {
      totalWorkorders, pendingAccept, processing, completed,
      notifications, unreadCount, summaryCount,
      groupedNotifications, handleNotificationGroupClick,
      trendChart, nodeChart, hoursChart, typeChart,
      viewAllNotifications, Bell
    }
  }
}
</script>

<style scoped>
.dashboard {
  padding: 0;
  background: #f0f2f5;
  min-height: 100vh;
  border-radius: 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  font-size: 14px;
  color: #303133;
}

/* ---------- 待处理信息栏 ---------- */
.pending-bar {
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  padding: 10px 16px;
  margin-bottom: 16px;
}
.pending-bar-content {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.pending-icon {
  color: #e6a23c;
  font-size: 16px;
  flex-shrink: 0;
}
.pending-label {
  font-size: 13px;
  color: #606266;
  font-weight: 500;
  flex-shrink: 0;
}
.pending-tag {
  cursor: pointer;
  flex-shrink: 0;
}
.pending-tag:hover {
  opacity: 0.8;
}
.pending-more {
  margin-left: 4px;
  flex-shrink: 0;
}

/* ---------- 顶部数据卡片 ---------- */
.stat-cards-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}
.stat-card-item {
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 20px 24px;
  transition: box-shadow .3s ease, transform .3s ease;
  cursor: default;
  box-shadow: 0 1px 3px rgba(0,0,0,.06);
}
.stat-card-item:hover {
  box-shadow: 0 4px 12px rgba(0,0,0,.1);
  transform: translateY(-1px);
}
.stat-num { font-size: 30px; font-weight: 700; line-height: 1.2; color: #3b7ddd; }
.stat-lbl { font-size: 12px; color: #909399; margin-top: 4px; }

/* ---------- 图表卡片 ---------- */
.chart-card :deep(.el-card) {
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  overflow: hidden;
}
.chart-card :deep(.el-card):hover {
  box-shadow: 0 4px 12px rgba(0,0,0,.1);
}
.chart-card :deep(.el-card__header) {
  background: #fafafa;
  border-bottom: 1px solid #ebeef5;
  padding: 12px 16px;
  border-radius: 8px 8px 0 0;
}
.chart-card :deep(.el-card__body) {
  padding: 16px;
}
.chart-box { width: 100%; height: 340px; }

/* ---------- 响应式 ---------- */
@media (max-width: 768px) {
  .dashboard { padding: 10px; }
  .stat-cards-row { grid-template-columns: repeat(2, 1fr); gap: 10px; }
  .stat-card-item { padding: 14px 16px; }
  .stat-num { font-size: 22px; }
  .chart-box { height: 260px; }
}
@media (max-width: 480px) {
  .stat-cards-row { grid-template-columns: repeat(2, 1fr); gap: 8px; }
  .stat-card-item { padding: 12px; }
  .stat-num { font-size: 18px; }
  .chart-box { height: 220px; }
}

.mb-4 { margin-bottom: 20px; }
</style>
