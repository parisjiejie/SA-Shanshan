<template>
  <el-drawer
    v-model="visible"
    title="消息通知"
    direction="btt"
    size="85%"
    :show-close="true"
    class="notification-panel"
  >
    <div class="panel-header-actions">
      <el-button link size="small" @click="handleMarkAllRead" v-if="allNotifications.length > 0">
        全部已读
      </el-button>
      <el-button link size="small" type="danger" @click="handleClear" v-if="allNotifications.length > 0">
        清空
      </el-button>
    </div>

    <!-- 空状态 -->
    <div v-if="allNotifications.length === 0" class="empty-state">
      <el-icon :size="48"><Bell /></el-icon>
      <p>暂无通知消息</p>
      <span class="empty-desc">当工单状态变更、报价审核等事件发生时，通知会出现在这里</span>
    </div>

    <!-- 通知列表 -->
    <div v-else class="notification-list">
      <div
        v-for="item in allNotifications"
        :key="item.id"
        class="notification-item"
        :class="{ unread: !item.isRead }"
        @click="handleClick(item)"
      >
        <div class="notify-icon" :class="item.type">
          <el-icon :size="18">
            <component :is="getIcon(item.type)" />
          </el-icon>
        </div>
        <div class="notify-content">
          <div class="notify-title">
            <span>{{ item.title }}</span>
            <span v-if="!item.isRead" class="unread-dot"></span>
          </div>
          <div class="notify-desc">{{ item.content }}</div>
          <div class="notify-time">{{ formatTime(item.createdAt) }}</div>
        </div>
        <el-icon class="notify-arrow">
          <ArrowRight />
        </el-icon>
      </div>
    </div>
  </el-drawer>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  Bell, ArrowRight, Document, CircleCheck,
  Clock, Warning, EditPen, User, List, ChatDotSquare
} from '@element-plus/icons-vue'
import {
  notifications,
  unreadCount,
  markAsRead,
  markAllAsRead,
  clearNotifications,
  getNotificationsByRole
} from '../stores/notificationStore'

const props = defineProps({
  visible: Boolean,
  currentRole: String
})
const emit = defineEmits(['update:visible'])

const router = useRouter()

const visible = computed({
  get: () => props.visible,
  set: (val) => emit('update:visible', val)
})

const allNotifications = computed(() => {
  if (!props.currentRole) return notifications.value
  return getNotificationsByRole(props.currentRole)
})

function getIcon(type) {
  const map = {
    'workorder_created': Document,
    'workorder_assigned': User,
    'workorder_accepted': CircleCheck,
    'workorder_rejected': Warning,
    'workorder_in_progress': Clock,
    'workorder_pending_sign': EditPen,
    'workorder_completed': CircleCheck,
    'workorder_overdue_assign': Warning,
    'workorder_overdue_accept': Warning,
    'quotation_submitted': Document,
    'quotation_approved': CircleCheck,
    'quotation_rejected': Warning,
    'quotation_sent': ChatDotSquare,
    'quotation_confirmed': CircleCheck,
    'checkin_submitted': List,
    'checkin_approved': CircleCheck,
    'customer_registered': User
  }
  return map[type] || Bell
}

function handleClick(item) {
  markAsRead(item.id)
  visible.value = false
  
  if (item.jumpPath) {
    const path = item.jumpParams 
      ? `${item.jumpPath}?${new URLSearchParams(item.jumpParams).toString()}`
      : item.jumpPath
    router.push(path)
  }
}

function handleMarkAllRead() {
  markAllAsRead()
  ElMessage.success('已全部标记为已读')
}

function handleClear() {
  clearNotifications()
  ElMessage.success('已清空通知')
}

function formatTime(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const now = new Date()
  const diff = now - d
  
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
  
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}
</script>

<style scoped>
.panel-header-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-bottom: 12px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #c0c4cc;
}

.empty-state p {
  margin: 12px 0 6px;
  font-size: 15px;
  color: #909399;
}

.empty-desc {
  font-size: 12px;
  color: #c0c4cc;
  text-align: center;
  max-width: 240px;
}

.notification-list {
  display: flex;
  flex-direction: column;
}

.notification-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 4px;
  border-bottom: 1px solid #f5f5f5;
  cursor: pointer;
  transition: background 0.15s;
}

.notification-item:active {
  background: #f5f5f5;
}

.notification-item.unread {
  background: #f0f7ff;
}

.notify-icon {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 2px;
}

.notify-icon.workorder_created,
.notify-icon.workorder_assigned,
.notify-icon.workorder_accepted,
.notify-icon.workorder_in_progress,
.notify-icon.workorder_completed {
  background: #e6f7ff;
  color: #1890ff;
}

.notify-icon.workorder_pending_sign {
  background: #fff7e6;
  color: #fa8c16;
}

.notify-icon.workorder_rejected,
.notify-icon.workorder_overdue_assign,
.notify-icon.workorder_overdue_accept {
  background: #fff1f0;
  color: #f5222d;
}

.notify-icon.quotation_submitted,
.notify-icon.quotation_sent {
  background: #f6ffed;
  color: #52c41a;
}

.notify-icon.quotation_approved,
.notify-icon.quotation_confirmed {
  background: #f6ffed;
  color: #52c41a;
}

.notify-icon.quotation_rejected {
  background: #fff1f0;
  color: #f5222d;
}

.notify-icon.checkin_submitted,
.notify-icon.checkin_approved {
  background: #f0f5ff;
  color: #2f54eb;
}

.notify-icon.customer_registered {
  background: #f0f7ff;
  color: #1890ff;
}

.notify-content {
  flex: 1;
  min-width: 0;
}

.notify-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 4px;
}

.unread-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #1890ff;
  flex-shrink: 0;
}

.notify-desc {
  font-size: 13px;
  color: #666;
  line-height: 1.5;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.notify-time {
  font-size: 11px;
  color: #c0c4cc;
}

.notify-arrow {
  color: #c0c4cc;
  flex-shrink: 0;
  margin-top: 10px;
}
</style>
