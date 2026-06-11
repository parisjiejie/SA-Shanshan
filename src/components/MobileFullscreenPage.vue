<template>
  <div class="mobile-fullscreen-page" v-if="visible">
    <!-- 顶部导航 -->
    <div class="fullscreen-header">
      <el-button link @click="handleClose">
        <el-icon><ArrowLeft /></el-icon>
        <span>返回</span>
      </el-button>
      <span class="header-title">{{ title }}</span>
      <span class="placeholder"></span>
    </div>
    
    <!-- 内容区 -->
    <div class="fullscreen-content">
      <slot></slot>
    </div>
    
    <!-- 底部操作区 -->
    <div class="fullscreen-footer" v-if="$slots.footer">
      <slot name="footer"></slot>
    </div>
  </div>
</template>

<script setup>
import { ArrowLeft } from '@element-plus/icons-vue'

const props = defineProps({
  visible: Boolean,
  title: String
})

const emit = defineEmits(['close'])

const handleClose = () => {
  emit('close')
}
</script>

<style scoped>
.mobile-fullscreen-page {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: #f5f7fa;
  z-index: 1000;
  display: flex;
  flex-direction: column;
}

.fullscreen-header {
  background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
  padding: 15px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: white;
  flex-shrink: 0;
}

.fullscreen-header .el-button {
  color: white;
  font-size: 14px;
}

.header-title {
  font-size: 18px;
  font-weight: 500;
}

.placeholder {
  width: 60px;
}

.fullscreen-content {
  flex: 1;
  overflow-y: auto;
  padding: 15px;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.fullscreen-content::-webkit-scrollbar {
  display: none;
}

.fullscreen-footer {
  background: white;
  padding: 15px;
  box-shadow: 0 -2px 10px rgba(0,0,0,0.05);
  flex-shrink: 0;
  display: flex;
  gap: 10px;
}

.fullscreen-footer :deep(.el-button) {
  flex: 1;
}
</style>
