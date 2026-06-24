<template>
  <div class="fault-attachments">
    <div class="attachment-actions">
      <el-button type="primary" plain size="small" @click="pickPhoto">
        <el-icon><Picture /></el-icon> 拍照/照片
      </el-button>
      <el-button type="success" plain size="small" @click="pickVideo">
        <el-icon><VideoCamera /></el-icon> 视频
      </el-button>
    </div>
    <div class="attachment-preview-list" v-if="modelValue.length">
      <div
        v-for="(att, idx) in modelValue"
        :key="idx"
        class="attachment-item"
      >
        <img v-if="att.type === 'image'" :src="att.url" class="att-thumb" @click="previewImage(att.url)" />
        <div v-else-if="att.type === 'video'" class="att-video-thumb" @click="playVideo(att.url)">
          <el-icon class="play-icon"><VideoCamera /></el-icon>
          <span>视频</span>
        </div>
        <el-icon class="att-remove" @click="removeAttachment(idx)"><Close /></el-icon>
      </div>
    </div>
    <p class="attachment-tip">支持上传故障照片和视频，帮助工程师更快定位问题</p>
    <!-- 隐藏的文件输入 -->
    <input ref="photoInput" type="file" accept="image/*" capture="environment" style="display:none" @change="onPhotoSelected" />
    <input ref="videoInput" type="file" accept="video/*" style="display:none" @change="onVideoSelected" />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Picture, VideoCamera, Close } from '@element-plus/icons-vue'

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => []
  },
  maxImageSize: {
    type: Number,
    default: 10 * 1024 * 1024 // 10MB
  },
  maxVideoSize: {
    type: Number,
    default: 50 * 1024 * 1024 // 50MB
  }
})

const emit = defineEmits(['update:modelValue'])

const photoInput = ref(null)
const videoInput = ref(null)

const pickPhoto = () => {
  if (photoInput.value) photoInput.value.click()
}

const pickVideo = () => {
  if (videoInput.value) videoInput.value.click()
}

const onPhotoSelected = (event) => {
  const file = event.target.files[0]
  if (!file) return
  if (file.size > props.maxImageSize) {
    ElMessage.warning('照片大小不能超过10MB')
    event.target.value = ''
    return
  }
  const reader = new FileReader()
  reader.onload = (e) => {
    const list = [...props.modelValue, { type: 'image', url: e.target.result, name: file.name }]
    emit('update:modelValue', list)
  }
  reader.readAsDataURL(file)
  event.target.value = ''
}

const onVideoSelected = (event) => {
  const file = event.target.files[0]
  if (!file) return
  if (file.size > props.maxVideoSize) {
    ElMessage.warning('视频大小不能超过50MB')
    event.target.value = ''
    return
  }
  const reader = new FileReader()
  reader.onload = (e) => {
    const list = [...props.modelValue, { type: 'video', url: e.target.result, name: file.name }]
    emit('update:modelValue', list)
  }
  reader.readAsDataURL(file)
  event.target.value = ''
}

const removeAttachment = (idx) => {
  const list = [...props.modelValue]
  list.splice(idx, 1)
  emit('update:modelValue', list)
}

const previewImage = (url) => {
  const preview = document.createElement('div')
  preview.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.9);display:flex;align-items:center;justify-content:center;z-index:9999;'
  const img = document.createElement('img')
  img.src = url
  img.style.cssText = 'max-width:90%;max-height:90%;object-fit:contain;'
  const closeBtn = document.createElement('div')
  closeBtn.innerHTML = '✕'
  closeBtn.style.cssText = 'position:absolute;top:20px;right:20px;color:white;font-size:30px;cursor:pointer;padding:10px;'
  preview.appendChild(img)
  preview.appendChild(closeBtn)
  document.body.appendChild(preview)
  const close = () => { document.body.removeChild(preview) }
  closeBtn.onclick = close
  preview.onclick = (e) => { if (e.target === preview) close() }
}

const playVideo = (url) => {
  const preview = document.createElement('div')
  preview.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.9);display:flex;align-items:center;justify-content:center;z-index:9999;'
  const video = document.createElement('video')
  video.src = url
  video.controls = true
  video.autoplay = true
  video.style.cssText = 'max-width:90%;max-height:80%;'
  const closeBtn = document.createElement('div')
  closeBtn.innerHTML = '✕'
  closeBtn.style.cssText = 'position:absolute;top:20px;right:20px;color:white;font-size:30px;cursor:pointer;padding:10px;'
  preview.appendChild(video)
  preview.appendChild(closeBtn)
  document.body.appendChild(preview)
  const close = () => { video.pause(); document.body.removeChild(preview) }
  closeBtn.onclick = close
  preview.onclick = (e) => { if (e.target === preview) close() }
}
</script>

<style scoped>
.fault-attachments {
  margin-top: 12px;
}
.attachment-actions {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
}
.attachment-actions .el-button {
  flex: 1;
}
.attachment-preview-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.attachment-item {
  position: relative;
  width: 80px;
  height: 80px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #e8e8e8;
}
.att-thumb {
  width: 100%;
  height: 100%;
  object-fit: cover;
  cursor: pointer;
}
.att-video-thumb {
  width: 100%;
  height: 100%;
  background: #f0f0f0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #8c8c8c;
  font-size: 12px;
  gap: 4px;
}
.att-video-thumb .play-icon {
  font-size: 24px;
  color: #1890ff;
}
.att-remove {
  position: absolute;
  top: 2px;
  right: 2px;
  background: rgba(0,0,0,0.5);
  color: white;
  border-radius: 50%;
  font-size: 12px;
  cursor: pointer;
  padding: 2px;
}
.attachment-tip {
  font-size: 12px;
  color: #bfbfbf;
  margin: 8px 0 0;
}
</style>
