<template>
  <div class="team-statistics">
    <!-- 顶部导航 -->
    <div class="page-header">
      <el-button link @click="goBack">
        <el-icon><ArrowLeft /></el-icon>
        <span>返回</span>
      </el-button>
      <span class="header-title">团队统计</span>
      <span class="placeholder"></span>
    </div>

    <!-- 日期筛选 -->
    <div class="date-filter">
      <div class="filter-tabs">
        <div 
          v-for="tab in dateTabs" 
          :key="tab.key"
          class="filter-tab"
          :class="{ active: currentPeriod === tab.key }"
          @click="currentPeriod = tab.key"
        >
          {{ tab.name }}
        </div>
      </div>
    </div>

    <!-- 核心指标 -->
    <div class="core-metrics">
      <div class="metric-card primary">
        <div class="metric-icon">
          <el-icon><Document /></el-icon>
        </div>
        <div class="metric-info">
          <span class="metric-value">{{ statistics.totalWorkorders }}</span>
          <span class="metric-label">总工单数</span>
        </div>
      </div>
      <div class="metric-card success">
        <div class="metric-icon">
          <el-icon><CircleCheck /></el-icon>
        </div>
        <div class="metric-info">
          <span class="metric-value">{{ statistics.completedWorkorders }}</span>
          <span class="metric-label">已完成</span>
        </div>
      </div>
      <div class="metric-card warning">
        <div class="metric-icon">
          <el-icon><Timer /></el-icon>
        </div>
        <div class="metric-info">
          <span class="metric-value">{{ statistics.avgResponseTime }}h</span>
          <span class="metric-label">平均响应</span>
        </div>
      </div>
      <div class="metric-card info">
        <div class="metric-icon">
          <el-icon><Star /></el-icon>
        </div>
        <div class="metric-info">
          <span class="metric-value">{{ statistics.satisfaction }}%</span>
          <span class="metric-label">满意度</span>
        </div>
      </div>
    </div>

    <!-- 工单类型分布 -->
    <div class="chart-section">
      <div class="section-header">
        <span class="section-title">工单类型分布</span>
      </div>
      <div class="type-distribution">
        <div 
          v-for="(item, index) in typeDistribution" 
          :key="index"
          class="type-item"
        >
          <div class="type-info">
            <div class="type-color" :style="{ background: item.color }"></div>
            <span class="type-name">{{ item.name }}</span>
          </div>
          <div class="type-bar">
            <div class="type-progress" :style="{ width: item.percentage + '%', background: item.color }"></div>
          </div>
          <span class="type-count">{{ item.count }}单</span>
          <span class="type-percentage">{{ item.percentage }}%</span>
        </div>
      </div>
    </div>

    <!-- 成员绩效排行 -->
    <div class="chart-section">
      <div class="section-header">
        <span class="section-title">成员绩效排行</span>
        <el-radio-group v-model="rankType" size="small">
          <el-radio-button label="workorder">工单数</el-radio-button>
          <el-radio-button label="satisfaction">满意度</el-radio-button>
          <el-radio-button label="efficiency">效率</el-radio-button>
        </el-radio-group>
      </div>
      <div class="member-ranking">
        <div 
          v-for="(member, index) in sortedMembers" 
          :key="member.id"
          class="rank-item"
        >
          <div class="rank-number" :class="{ 'top3': index < 3 }">{{ index + 1 }}</div>
          <el-avatar :size="40" :icon="UserFilled" />
          <div class="rank-info">
            <span class="rank-name">{{ member.name }}</span>
            <span class="rank-role">{{ member.role }}</span>
          </div>
          <div class="rank-score">
            <span class="score-value">{{ getRankValue(member) }}</span>
            <span class="score-label">{{ getRankLabel() }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 趋势图表 -->
    <div class="chart-section">
      <div class="section-header">
        <span class="section-title">工单趋势</span>
      </div>
      <div class="trend-chart">
        <div class="chart-y-axis">
          <span v-for="n in 5" :key="n">{{ maxTrendValue - (n - 1) * (maxTrendValue / 4) }}</span>
        </div>
        <div class="chart-bars">
          <div 
            v-for="(day, index) in trendData" 
            :key="index"
            class="bar-item"
          >
            <div class="bar-stack">
              <div 
                class="bar-segment completed" 
                :style="{ height: (day.completed / maxTrendValue * 100) + '%' }"
              ></div>
              <div 
                class="bar-segment pending" 
                :style="{ height: (day.pending / maxTrendValue * 100) + '%' }"
              ></div>
            </div>
            <span class="bar-label">{{ day.date }}</span>
          </div>
        </div>
      </div>
      <div class="chart-legend">
        <div class="legend-item">
          <div class="legend-color completed"></div>
          <span>已完成</span>
        </div>
        <div class="legend-item">
          <div class="legend-color pending"></div>
          <span>进行中</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import {
  ArrowLeft,
  Document,
  CircleCheck,
  Timer,
  Star,
  UserFilled
} from '@element-plus/icons-vue'

const router = useRouter()

// 时间周期
const currentPeriod = ref('week')
const dateTabs = [
  { key: 'week', name: '本周' },
  { key: 'month', name: '本月' },
  { key: 'quarter', name: '本季' }
]

// 排行类型
const rankType = ref('workorder')

// 统计数据
const statistics = ref({
  totalWorkorders: 156,
  completedWorkorders: 142,
  avgResponseTime: 2.5,
  satisfaction: 98
})

// 工单类型分布
const typeDistribution = ref([
  { name: '维修服务', count: 68, percentage: 44, color: '#1890ff' },
  { name: '安装调试', count: 42, percentage: 27, color: '#52c41a' },
  { name: '保养维护', count: 28, percentage: 18, color: '#faad14' },
  { name: '配件销售', count: 18, percentage: 11, color: '#f5222d' }
])

// 成员数据
const memberStats = ref([
  { id: 1, name: '张工程师', role: '工程师', workorders: 32, satisfaction: 99, efficiency: 95 },
  { id: 2, name: '王工程师', role: '工程师', workorders: 28, satisfaction: 98, efficiency: 92 },
  { id: 3, name: '李工程师', role: '工程师', workorders: 35, satisfaction: 97, efficiency: 90 },
  { id: 4, name: '赵工程师', role: '工程师', workorders: 25, satisfaction: 96, efficiency: 88 },
  { id: 5, name: '陈工程师', role: '工程师', workorders: 22, satisfaction: 98, efficiency: 91 }
])

// 趋势数据
const trendData = ref([
  { date: '周一', completed: 12, pending: 3 },
  { date: '周二', completed: 15, pending: 2 },
  { date: '周三', completed: 18, pending: 4 },
  { date: '周四', completed: 14, pending: 3 },
  { date: '周五', completed: 20, pending: 2 },
  { date: '周六', completed: 8, pending: 1 },
  { date: '周日', completed: 6, pending: 1 }
])

// 计算属性
const maxTrendValue = computed(() => {
  const max = Math.max(...trendData.value.map(d => d.completed + d.pending))
  return Math.ceil(max / 5) * 5
})

const sortedMembers = computed(() => {
  const sorted = [...memberStats.value]
  switch (rankType.value) {
    case 'workorder':
      return sorted.sort((a, b) => b.workorders - a.workorders)
    case 'satisfaction':
      return sorted.sort((a, b) => b.satisfaction - a.satisfaction)
    case 'efficiency':
      return sorted.sort((a, b) => b.efficiency - a.efficiency)
    default:
      return sorted
  }
})

// 方法
const goBack = () => {
  router.back()
}

const getRankValue = (member) => {
  switch (rankType.value) {
    case 'workorder':
      return member.workorders
    case 'satisfaction':
      return member.satisfaction + '%'
    case 'efficiency':
      return member.efficiency + '%'
    default:
      return member.workorders
  }
}

const getRankLabel = () => {
  switch (rankType.value) {
    case 'workorder':
      return '工单'
    case 'satisfaction':
      return '满意度'
    case 'efficiency':
      return '效率'
    default:
      return '工单'
  }
}

// 监听时间周期变化，更新数据
watch(currentPeriod, (newPeriod) => {
  // 根据周期更新统计数据（模拟）
  const multiplier = newPeriod === 'week' ? 1 : newPeriod === 'month' ? 4 : 12
  statistics.value = {
    totalWorkorders: 156 * multiplier,
    completedWorkorders: 142 * multiplier,
    avgResponseTime: 2.5,
    satisfaction: 98
  }
})
</script>

<style scoped>
.team-statistics {
  min-height: 100vh;
  background: #f5f7fa;
  padding-bottom: 20px;
  width: 100vw;
  max-width: 100%;
  overflow-x: hidden;
  box-sizing: border-box;
}

/* 顶部导航 */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 15px;
  background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
  color: white;
}

.page-header .el-button {
  color: white;
  font-size: 14px;
}

.header-title {
  font-size: 17px;
  font-weight: 500;
}

.placeholder {
  width: 60px;
}

/* 日期筛选 */
.date-filter {
  padding: 15px;
  background: white;
  border-bottom: 1px solid #f0f0f0;
}

.filter-tabs {
  display: flex;
  gap: 10px;
}

.filter-tab {
  flex: 1;
  text-align: center;
  padding: 10px;
  background: #f5f7fa;
  border-radius: 8px;
  font-size: 14px;
  color: #595959;
  cursor: pointer;
  transition: all 0.3s;
}

.filter-tab.active {
  background: #1890ff;
  color: white;
}

/* 核心指标 */
.core-metrics {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  padding: 15px;
}

.metric-card {
  background: white;
  border-radius: 12px;
  padding: 15px;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.metric-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.metric-card.primary .metric-icon {
  background: #e6f7ff;
  color: #1890ff;
}

.metric-card.success .metric-icon {
  background: #f6ffed;
  color: #52c41a;
}

.metric-card.warning .metric-icon {
  background: #fff7e6;
  color: #faad14;
}

.metric-card.info .metric-icon {
  background: #f0f5ff;
  color: #2f54eb;
}

.metric-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.metric-value {
  font-size: 22px;
  font-weight: 600;
  color: #262626;
}

.metric-label {
  font-size: 12px;
  color: #8c8c8c;
}

/* 图表区域 */
.chart-section {
  margin: 15px;
  background: white;
  border-radius: 12px;
  padding: 15px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.section-title {
  font-size: 16px;
  font-weight: 500;
  color: #262626;
}

/* 类型分布 */
.type-distribution {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.type-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.type-info {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 80px;
  flex-shrink: 0;
}

.type-color {
  width: 12px;
  height: 12px;
  border-radius: 3px;
}

.type-name {
  font-size: 13px;
  color: #595959;
}

.type-bar {
  flex: 1;
  height: 8px;
  background: #f5f7fa;
  border-radius: 4px;
  overflow: hidden;
}

.type-progress {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s;
}

.type-count {
  font-size: 13px;
  color: #262626;
  font-weight: 500;
  width: 50px;
  text-align: right;
}

.type-percentage {
  font-size: 12px;
  color: #8c8c8c;
  width: 40px;
  text-align: right;
}

/* 成员排行 */
.member-ranking {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.rank-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 10px;
}

.rank-number {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #d9d9d9;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
  flex-shrink: 0;
}

.rank-number.top3 {
  background: #1890ff;
}

.rank-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.rank-name {
  font-size: 15px;
  font-weight: 500;
  color: #262626;
}

.rank-role {
  font-size: 12px;
  color: #8c8c8c;
}

.rank-score {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
}

.score-value {
  font-size: 18px;
  font-weight: 600;
  color: #1890ff;
}

.score-label {
  font-size: 11px;
  color: #8c8c8c;
}

/* 趋势图表 */
.trend-chart {
  display: flex;
  height: 180px;
  gap: 10px;
}

.chart-y-axis {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 10px 0;
  font-size: 11px;
  color: #8c8c8c;
  text-align: right;
}

.chart-bars {
  flex: 1;
  display: flex;
  justify-content: space-around;
  align-items: flex-end;
  padding: 10px 0;
}

.bar-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.bar-stack {
  width: 24px;
  height: 140px;
  display: flex;
  flex-direction: column-reverse;
  gap: 2px;
}

.bar-segment {
  width: 100%;
  border-radius: 3px;
  transition: height 0.3s;
}

.bar-segment.completed {
  background: #52c41a;
}

.bar-segment.pending {
  background: #faad14;
}

.bar-label {
  font-size: 11px;
  color: #8c8c8c;
}

.chart-legend {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid #f0f0f0;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #595959;
}

.legend-color {
  width: 12px;
  height: 12px;
  border-radius: 3px;
}

.legend-color.completed {
  background: #52c41a;
}

.legend-color.pending {
  background: #faad14;
}

/* 响应式适配 */
@media (min-width: 768px) {
  .team-statistics {
    max-width: 414px;
    margin: 0 auto;
    border-left: 1px solid #e8e8e8;
    border-right: 1px solid #e8e8e8;
  }
}
</style>
