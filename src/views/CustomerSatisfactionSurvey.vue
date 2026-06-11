<template>
  <div class="customer-satisfaction-survey">
    <!-- 顶部导航 -->
    <div class="header">
      <el-button link @click="goBack">
        <el-icon><ArrowLeft /></el-icon>
        <span>返回</span>
      </el-button>
      <span class="header-title">满意度评价</span>
      <span class="placeholder"></span>
    </div>

    <!-- 工单信息 -->
    <div v-if="workorder" class="workorder-info-card">
      <div class="info-header">
        <span class="order-no">{{ workorder.workorderId }}</span>
        <el-tag type="success" size="small">已完成</el-tag>
      </div>
      <div class="info-body">
        <div class="info-item">
          <span class="label">设备型号</span>
          <span class="value">{{ workorder.deviceModel || '未指定' }}</span>
        </div>
        <div class="info-item">
          <span class="label">服务工程师</span>
          <span class="value">{{ workorder.engineerName || '未分配' }}</span>
        </div>
        <div class="info-item">
          <span class="label">完成时间</span>
          <span class="value">{{ formatDateTime(workorder.completeTime) }}</span>
        </div>
      </div>
    </div>

    <!-- 评价表单 -->
    <div class="survey-form">
      <div class="form-title">
        <el-icon><StarFilled /></el-icon>
        <span>请对本次服务进行评价</span>
      </div>

      <!-- 服务态度 -->
      <div class="rating-item">
        <div class="rating-label">服务态度</div>
        <div class="rating-stars">
          <el-rate
            v-model="surveyForm.serviceRate"
            :colors="['#ff4d4f', '#ff7a45', '#faad14', '#a0d911', '#52c41a']"
            :max="5"
            size="large"
          />
        </div>
        <div class="rating-text">{{ getRatingText(surveyForm.serviceRate) }}</div>
      </div>

      <!-- 响应速度 -->
      <div class="rating-item">
        <div class="rating-label">响应速度</div>
        <div class="rating-stars">
          <el-rate
            v-model="surveyForm.responseRate"
            :colors="['#ff4d4f', '#ff7a45', '#faad14', '#a0d911', '#52c41a']"
            :max="5"
            size="large"
          />
        </div>
        <div class="rating-text">{{ getRatingText(surveyForm.responseRate) }}</div>
      </div>

      <!-- 技术水平 -->
      <div class="rating-item">
        <div class="rating-label">技术水平</div>
        <div class="rating-stars">
          <el-rate
            v-model="surveyForm.techniqueRate"
            :colors="['#ff4d4f', '#ff7a45', '#faad14', '#a0d911', '#52c41a']"
            :max="5"
            size="large"
          />
        </div>
        <div class="rating-text">{{ getRatingText(surveyForm.techniqueRate) }}</div>
      </div>

      <!-- 评价内容 -->
      <div class="comment-section">
        <div class="section-title">评价内容（选填）</div>
        <el-input
          v-model="surveyForm.comment"
          type="textarea"
          :rows="4"
          placeholder="请输入您的评价，帮助我们改进服务质量..."
          maxlength="200"
          show-word-limit
        />
      </div>

      <!-- 快捷评价标签 -->
      <div class="quick-tags">
        <div class="section-title">快捷评价</div>
        <div class="tags-list">
          <el-check-tag
            v-for="tag in quickTags"
            :key="tag"
            :checked="selectedTags.includes(tag)"
            @change="toggleTag(tag)"
          >
            {{ tag }}
          </el-check-tag>
        </div>
      </div>

      <!-- 提交按钮 -->
      <div class="submit-section">
        <el-button 
          type="primary" 
          size="large" 
          class="submit-btn"
          :disabled="!isValid"
          @click="submitSurvey"
        >
          提交评价
        </el-button>
        <p class="skip-text" @click="skipSurvey">暂不评价</p>
      </div>
    </div>

    <!-- 感谢提示 -->
    <div class="tips">
      <el-icon><InfoFilled /></el-icon>
      <span>您的评价对我们非常重要，将帮助我们持续改进服务质量</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  ArrowLeft,
  StarFilled,
  InfoFilled
} from '@element-plus/icons-vue'
import {
  getWorkorderById,
  getSatisfactionSurvey,
  submitSatisfactionSurvey
} from '../stores/workorderFlowStore.js'

const route = useRoute()
const router = useRouter()

// 工单数据
const workorder = ref(null)
const survey = ref(null)

// 评价表单
const surveyForm = ref({
  serviceRate: 0,
  responseRate: 0,
  techniqueRate: 0,
  comment: ''
})

// 选中的快捷标签
const selectedTags = ref([])

// 快捷评价标签
const quickTags = [
  '服务热情',
  '响应及时',
  '技术专业',
  '解决问题',
  '沟通顺畅',
  '准时到达',
  '收费合理',
  '耐心细致'
]

// 评价文本映射
const ratingTexts = {
  0: '',
  1: '非常不满意',
  2: '不满意',
  3: '一般',
  4: '满意',
  5: '非常满意'
}

// 是否有效（至少评价一项）
const isValid = computed(() => {
  return surveyForm.value.serviceRate > 0 ||
         surveyForm.value.responseRate > 0 ||
         surveyForm.value.techniqueRate > 0
})

// 获取评价文本
const getRatingText = (rate) => {
  return ratingTexts[rate] || ''
}

// 切换标签
const toggleTag = (tag) => {
  const index = selectedTags.value.indexOf(tag)
  if (index > -1) {
    selectedTags.value.splice(index, 1)
  } else {
    selectedTags.value.push(tag)
  }
}

// 格式化日期时间
const formatDateTime = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return `${date.getMonth() + 1}月${date.getDate()}日 ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

// 提交评价
const submitSurvey = () => {
  if (!isValid.value) {
    ElMessage.warning('请至少评价一项')
    return
  }

  // 合并评价内容和快捷标签
  let comment = surveyForm.value.comment
  if (selectedTags.value.length > 0) {
    const tagsText = selectedTags.value.join('、')
    comment = comment ? `${tagsText}。${comment}` : tagsText
  }

  const result = submitSatisfactionSurvey(survey.value.id, {
    serviceRate: surveyForm.value.serviceRate,
    responseRate: surveyForm.value.responseRate,
    techniqueRate: surveyForm.value.techniqueRate,
    comment: comment
  })

  if (result) {
    ElMessage.success('感谢您的评价！')
    setTimeout(() => {
      router.push('/customer-workorder-list')
    }, 1500)
  } else {
    ElMessage.error('提交失败，请重试')
  }
}

// 跳过评价
const skipSurvey = () => {
  router.push('/customer-workorder-list')
}

// 返回上一页
const goBack = () => {
  router.back()
}

// 加载数据
const loadData = () => {
  const surveyId = route.query.surveyId
  const workorderId = route.query.workorderId

  if (surveyId) {
    survey.value = getSatisfactionSurvey(surveyId)
    if (survey.value) {
      workorder.value = getWorkorderById(survey.value.workorderId)
    }
  } else if (workorderId) {
    workorder.value = getWorkorderById(workorderId)
    // 查找对应的调查
    if (workorder.value) {
      // 这里可以通过其他方式查找survey
    }
  }

  if (!workorder.value) {
    ElMessage.error('工单信息不存在')
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.customer-satisfaction-survey {
  min-height: 100vh;
  background: #f5f7fa;
  padding-bottom: 30px;
}

/* 顶部导航 */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 15px;
  background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
  color: white;
}

.header .el-button {
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

/* 工单信息卡片 */
.workorder-info-card {
  background: white;
  border-radius: 12px;
  margin: 15px;
  padding: 15px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.info-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 15px;
  border-bottom: 1px solid #f0f0f0;
}

.order-no {
  font-size: 16px;
  font-weight: 600;
  color: #1890ff;
  font-family: monospace;
}

.info-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.info-item .label {
  font-size: 14px;
  color: #8c8c8c;
}

.info-item .value {
  font-size: 14px;
  color: #262626;
  font-weight: 500;
}

/* 评价表单 */
.survey-form {
  background: white;
  border-radius: 12px;
  margin: 15px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.form-title {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 600;
  color: #262626;
  margin-bottom: 25px;
}

.form-title .el-icon {
  color: #faad14;
  font-size: 24px;
}

/* 评分项 */
.rating-item {
  margin-bottom: 25px;
  text-align: center;
}

.rating-label {
  font-size: 15px;
  color: #262626;
  font-weight: 500;
  margin-bottom: 12px;
}

.rating-stars {
  margin-bottom: 8px;
}

.rating-stars :deep(.el-rate__icon) {
  font-size: 32px;
}

.rating-text {
  font-size: 14px;
  color: #8c8c8c;
  height: 20px;
}

/* 评价内容 */
.comment-section {
  margin-bottom: 20px;
}

.section-title {
  font-size: 14px;
  color: #262626;
  font-weight: 500;
  margin-bottom: 12px;
}

/* 快捷标签 */
.quick-tags {
  margin-bottom: 25px;
}

.tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.tags-list :deep(.el-check-tag) {
  padding: 8px 16px;
  font-size: 13px;
}

/* 提交区域 */
.submit-section {
  text-align: center;
  padding-top: 10px;
}

.submit-btn {
  width: 100%;
  height: 44px;
  font-size: 16px;
}

.skip-text {
  margin-top: 15px;
  font-size: 14px;
  color: #8c8c8c;
  cursor: pointer;
  text-decoration: underline;
}

.skip-text:hover {
  color: #1890ff;
}

/* 提示信息 */
.tips {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 15px;
  padding: 12px 15px;
  background: #e6f7ff;
  border-radius: 8px;
  font-size: 13px;
  color: #1890ff;
}

.tips .el-icon {
  font-size: 16px;
  flex-shrink: 0;
}

/* 响应式适配 */
@media (min-width: 768px) {
  .customer-satisfaction-survey {
    max-width: 414px;
    margin: 0 auto;
    border-left: 1px solid #e8e8e8;
    border-right: 1px solid #e8e8e8;
  }
}
</style>
