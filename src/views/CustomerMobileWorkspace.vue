<template>
  <div class="customer-mobile-workspace">
    <!-- 顶部用户信息 -->
    <div class="header-section">
      <div class="user-info">
        <el-avatar :size="50" :icon="UserFilled" />
        <div class="user-details">
          <h3>{{ customerInfo.name }}</h3>
          <p>{{ customerInfo.company }}</p>
        </div>
      </div>
      <el-badge :value="unreadCount" :hidden="unreadCount === 0" class="message-badge">
        <el-button circle @click="openMessageDialog">
          <el-icon><Bell /></el-icon>
        </el-button>
      </el-badge>
    </div>

    <!-- 快捷功能入口 - 大图标设计 -->
    <div class="quick-actions">
      <div class="action-grid">
        <div class="action-item scan" @click="openScan">
          <div class="action-icon">
            <el-icon><Camera /></el-icon>
          </div>
          <span class="action-label">扫码查询</span>
          <span class="action-desc">扫描设备二维码</span>
        </div>
        
        <div class="action-item chat" @click="openChat">
          <div class="action-icon">
            <el-icon><ChatDotRound /></el-icon>
            <el-badge v-if="unreadChatCount > 0" :value="unreadChatCount" class="chat-badge" />
          </div>
          <span class="action-label">在线咨询</span>
          <span class="action-desc">服务问题咨询</span>
        </div>
        
        <div class="action-item repair" @click="createRepairOrder">
          <div class="action-icon">
            <el-icon><Tools /></el-icon>
          </div>
          <span class="action-label">报修服务</span>
          <span class="action-desc">提交维修申请</span>
        </div>
        
        <div class="action-item product" @click="openProductLibrary">
          <div class="action-icon">
            <el-icon><Goods /></el-icon>
          </div>
          <span class="action-label">产品库</span>
          <span class="action-desc">山善全线产品</span>
        </div>

        <div class="action-item parts" @click="createPartsOrder">
          <div class="action-icon">
            <el-icon><ShoppingCart /></el-icon>
          </div>
          <span class="action-label">配件购买</span>
          <span class="action-desc">购买原厂配件</span>
        </div>
      </div>
    </div>

    <!-- 待处理事项 -->
    <div class="pending-section" v-if="pendingItems.length > 0">
      <div class="section-header">
        <h4>待处理</h4>
        <el-tag type="danger" size="small">{{ pendingItems.length }}</el-tag>
      </div>
      <div class="pending-list">
        <div 
          v-for="item in pendingItems" 
          :key="item.id" 
          class="pending-item"
          @click="handlePendingItem(item)"
        >
          <div class="pending-icon" :class="item.type">
            <el-icon><DocumentChecked v-if="item.type === 'sign'" /><Warning v-if="item.type === 'urgent'" /></el-icon>
          </div>
          <div class="pending-content">
            <span class="pending-title">{{ item.title }}</span>
            <span class="pending-desc">{{ item.description }}</span>
          </div>
          <el-icon class="arrow"><ArrowRight /></el-icon>
        </div>
      </div>
    </div>

    <!-- 我的工单 -->
    <div class="workorder-section">
      <div class="section-header">
        <h4>我的工单</h4>
        <el-button link @click="viewAllWorkorders">查看全部</el-button>
      </div>
      <div class="workorder-tabs">
        <div 
          v-for="tab in workorderTabs" 
          :key="tab.key"
          class="tab-item"
          :class="{ active: activeTab === tab.key }"
          @click="activeTab = tab.key"
        >
          <span class="tab-name">{{ tab.name }}</span>
          <span class="tab-count" v-if="tab.count > 0 && tab.key !== 'all' && tab.key !== 'completed'">{{ tab.count }}</span>
        </div>
      </div>

      <div class="list-summary" v-if="activeTab === 'all' || activeTab === 'completed'">
        <span v-if="activeTab === 'all'">共 {{ filteredWorkorders.length }} 条工单</span>
        <span v-else>已完成 {{ filteredWorkorders.length }} 条</span>
      </div>

      <div class="workorder-list">
        <div v-if="filteredWorkorders.length === 0" class="empty-state">
          <el-icon><Document /></el-icon>
          <p>暂无{{ getTabName(activeTab) }}工单</p>
        </div>
        <div 
          v-for="order in displayedWorkorders" 
          :key="order.id" 
          class="workorder-card"
          @click="viewWorkorderDetail(order)"
        >
          <div class="card-header">
            <span class="order-no">{{ order.workorderId }}</span>
            <el-tag :type="getStatusType(order.status)" size="small">
              {{ getStatusText(order.status) }}
            </el-tag>
          </div>
          <div class="card-body">
            <div class="info-row">
              <el-icon><Monitor /></el-icon>
              <span class="device-model">{{ order.deviceModel || '设备型号未指定' }}</span>
            </div>
            <p class="order-desc">{{ order.faultDescription || order.description }}</p>
          </div>
          <div class="card-footer">
            <span class="order-time">{{ formatDate(order.createTime) }}</span>
            <div class="card-footer-actions">
              <el-button 
                v-if="order.reportPdf" 
                type="success" 
                size="small"
                link
                @click.stop="previewWorkorderPdf(order)"
              >
                <el-icon><View /></el-icon>
                PDF
              </el-button>
              <el-button 
                v-if="order.needsSign" 
                type="primary" 
                size="small"
                @click.stop="handleSign(order)"
              >
                签字确认
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 扫码全屏页面 -->
    <div v-if="scanDialog.visible" class="scan-fullscreen-page">
      <!-- 顶部导航 -->
      <div class="scan-header">
        <el-button link @click="scanDialog.visible = false; stopScan()">
          <el-icon><ArrowLeft /></el-icon>
          <span>返回</span>
        </el-button>
        <span class="header-title">扫码查询设备</span>
        <span class="placeholder"></span>
      </div>
      
      <!-- 扫码内容区 -->
      <div class="scan-content">
        <!-- 摄像头扫码区域 -->
        <div class="scan-area" v-if="scanDialog.isScanning">
          <video
            ref="videoRef"
            class="scan-video"
            playsinline
            autoplay
            muted
          ></video>
          <canvas ref="canvasRef" style="display: none;"></canvas>
          <div class="scan-frame">
            <div class="corner top-left"></div>
            <div class="corner top-right"></div>
            <div class="corner bottom-left"></div>
            <div class="corner bottom-right"></div>
            <div class="scan-line"></div>
          </div>
          <p class="scan-tip">将二维码放入框内，即可自动扫描</p>
          <el-button type="primary" @click="stopScan" size="large" round>停止扫描</el-button>
        </div>

        <!-- 开始扫码按钮 -->
        <div class="scan-start" v-else-if="canUseCamera">
          <div class="scan-icon">
            <el-icon><Camera /></el-icon>
          </div>
          <p class="scan-tip">点击开始扫描设备二维码</p>
          <el-button type="primary" @click="startScan" size="large" round>开始扫码</el-button>
        </div>

        <!-- 摄像头不可用提示 -->
        <div class="scan-unavailable" v-else>
          <div class="scan-icon unavailable">
            <el-icon><Camera /></el-icon>
          </div>
          <p class="scan-tip">摄像头功能暂不可用</p>
          <p class="scan-reason">{{ cameraUnavailableReason }}</p>
        </div>

        <div class="scan-divider">
          <span>或</span>
        </div>

        <div class="scan-input">
          <p class="input-label">手动选择设备编号</p>
          <el-select
            v-model="scanDialog.manualInput"
            placeholder="请选择设备序列号"
            clearable
            size="large"
            style="width: 100%"
          >
            <el-option
              v-for="asset in repairAssets"
              :key="asset.serialNumber"
              :label="`${asset.serialNumber}（${asset.model}）`"
              :value="asset.serialNumber"
            />
          </el-select>
          <el-button type="primary" @click="handleManualQuery" size="large" round style="margin-top: 16px; width: 100%">查询</el-button>
        </div>
      </div>
    </div>

    <!-- 聊天对话框 -->
    <el-dialog
      v-model="chatDialog.visible"
      title="在线咨询"
      width="95%"
      :show-close="false"
      class="mobile-dialog chat-dialog"
      :fullscreen="true"
    >
      <template #header>
        <div class="chat-header">
          <span class="chat-title">在线咨询</span>
          <el-button link @click="chatDialog.visible = false">
            <el-icon><Close /></el-icon>
          </el-button>
        </div>
      </template>
      <div class="chat-container">
        <div class="chat-messages" ref="chatMessagesRef">
          <div 
            v-for="msg in chatMessages" 
            :key="msg.id" 
            class="message-item"
            :class="{ self: msg.isSelf }"
          >
            <div class="message-avatar">
              <el-avatar :size="36" :icon="msg.isSelf ? UserFilled : Service" />
            </div>
            <div class="message-content">
              <div class="message-bubble">
                <!-- 文字消息 -->
                <p v-if="msg.type === 'text'">{{ msg.content }}</p>
                <!-- 图片消息 -->
                <img v-else-if="msg.type === 'image'" :src="msg.content" class="message-image" @click="previewImage(msg.content)" />
                <!-- 视频消息 -->
                <video v-else-if="msg.type === 'video'" :src="msg.content" class="message-video" controls />
              </div>
              <span class="message-time">{{ formatTime(msg.time) }}</span>
            </div>
          </div>
        </div>
        <div class="chat-input-toolbar">
          <div class="toolbar-left">
            <el-button circle size="small" @click="toggleMediaOptions" title="添加媒体">
              <el-icon><Plus /></el-icon>
            </el-button>
          </div>
        </div>
        
        <!-- 媒体选项菜单 -->
        <div v-if="chatDialog.showMediaOptions" class="media-options">
          <div class="media-option-item" @click="selectImage">
            <div class="option-icon image">
              <el-icon><Picture /></el-icon>
            </div>
            <span>图片</span>
          </div>
          <div class="media-option-item" @click="takePhoto">
            <div class="option-icon camera">
              <el-icon><Camera /></el-icon>
            </div>
            <span>拍照</span>
          </div>
          <div class="media-option-item" @click="selectVideo">
            <div class="option-icon video">
              <el-icon><VideoCamera /></el-icon>
            </div>
            <span>视频</span>
          </div>
        </div>
        
        <!-- 媒体预览 -->
        <div v-if="chatDialog.mediaPreview" class="media-preview">
          <img v-if="chatDialog.mediaType === 'image'" :src="chatDialog.mediaPreview" class="preview-img" />
          <video v-if="chatDialog.mediaType === 'video'" :src="chatDialog.mediaPreview" class="preview-video" controls />
          <el-icon class="remove-media" @click="clearMediaPreview"><Close /></el-icon>
        </div>
        
        <div class="chat-input-area">
          <el-input
            v-model="chatDialog.inputMessage"
            type="textarea"
            :rows="2"
            placeholder="请输入您的问题..."
            @keyup.enter="sendMessage"
          />
          <el-button type="primary" @click="sendMessage" :disabled="!canSendMessage">
            发送
          </el-button>
        </div>
        
        <!-- 隐藏的文件输入 -->
        <input
          ref="mediaInputRef"
          type="file"
          accept="image/*"
          style="display: none"
          @change="handleImageSelected"
        />
        <input
          ref="videoInputRef"
          type="file"
          accept="video/*"
          style="display: none"
          @change="handleVideoSelected"
        />
      </div>
    </el-dialog>

    <!-- 报修对话框 -->
    <el-dialog
      v-model="repairDialog.visible"
      title="报修服务"
      width="95%"
      :show-close="false"
      class="mobile-dialog repair-dialog"
      :fullscreen="true"
    >
      <template #header>
        <div class="repair-dialog-header">
          <span class="repair-title">报修服务</span>
          <el-button link @click="repairDialog.visible = false">
            <el-icon><Close /></el-icon>
          </el-button>
        </div>
      </template>
      <div class="repair-form-container">
        <!-- 客户信息 -->
        <div class="repair-section">
          <div class="repair-section-title">客户信息</div>
          <el-form :model="repairDialog.form" label-position="top" class="repair-form">
            <el-form-item label="客户公司">
              <el-input :model-value="repairDialog.form.customerName" readonly />
            </el-form-item>
            <el-form-item label="联系人">
              <el-select
                v-model="repairDialog.form.customerContact"
                placeholder="请选择联系人"
                style="width: 100%"
              >
                <el-option
                  v-for="c in repairCustomerContacts"
                  :key="c.id"
                  :label="`${c.name}（${c.position}）`"
                  :value="c.name"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="联系电话">
              <el-input v-model="repairDialog.form.customerPhone" placeholder="联系电话" />
            </el-form-item>
            <el-form-item label="地址">
              <el-input v-model="repairDialog.form.customerAddress" type="textarea" :rows="2" placeholder="详细服务地址" />
            </el-form-item>
          </el-form>
        </div>

        <!-- 工单信息 -->
        <div class="repair-section">
          <div class="repair-section-title">工单信息</div>
          <el-form :model="repairDialog.form" label-position="top" class="repair-form">
            <el-form-item label="服务类型">
              <el-radio-group v-model="repairDialog.form.subType" class="type-radio-group">
                <el-radio-button label="repair">维修</el-radio-button>
                <el-radio-button label="trial_processing">试加工</el-radio-button>
                <el-radio-button label="refitting">改造</el-radio-button>
              </el-radio-group>
            </el-form-item>
            <el-form-item label="紧急程度">
              <el-radio-group v-model="repairDialog.form.urgency">
                <el-radio-button label="low">低</el-radio-button>
                <el-radio-button label="medium">中</el-radio-button>
                <el-radio-button label="high">高</el-radio-button>
              </el-radio-group>
            </el-form-item>
          </el-form>
        </div>

        <!-- 设备信息 -->
        <div class="repair-section">
          <div class="repair-section-title">设备信息</div>
          <el-form :model="repairDialog.form" label-position="top" class="repair-form">
            <el-form-item label="设备型号">
              <el-select
                v-model="repairDialog.form.assetModel"
                placeholder="选择设备型号"
                clearable
                style="width: 100%"
                @change="onRepairModelChange"
              >
                <el-option
                  v-for="m in repairCustomerModels"
                  :key="m"
                  :label="m"
                  :value="m"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="序列号">
              <el-select
                v-model="repairDialog.form.assetSerialNumber"
                placeholder="选择序列号"
                clearable
                style="width: 100%"
                @change="onRepairSNChange"
              >
                <el-option
                  v-for="sn in repairCustomerSNs"
                  :key="sn.serialNumber"
                  :label="sn.serialNumber"
                  :value="sn.serialNumber"
                />
              </el-select>
            </el-form-item>
            <el-form-item v-if="repairDialog.form.warrantyStatus" label="保修状态">
              <el-tag :type="WarrantyStatusType[repairDialog.form.warrantyStatus] || 'info'" size="large">
                {{ WarrantyStatusText[repairDialog.form.warrantyStatus] || repairDialog.form.warrantyStatus }}
              </el-tag>
            </el-form-item>
          </el-form>
        </div>

        <!-- 故障描述 -->
        <div class="repair-section">
          <div class="repair-section-title">故障描述</div>
          <el-form :model="repairDialog.form" label-position="top" class="repair-form">
            <el-form-item required>
              <el-input
                v-model="repairDialog.form.faultDescription"
                type="textarea"
                :rows="4"
                placeholder="请详细描述设备故障现象"
              />
            </el-form-item>
            <div class="fault-tags">
              <span class="tag-label">常见故障：</span>
              <el-tag
                v-for="tag in commonFaultTags"
                :key="tag.label"
                class="fault-tag"
                effect="plain"
                @click="applyRepairFaultTag(tag)"
              >
                {{ tag.label }}
              </el-tag>
            </div>
          </el-form>
          <!-- 故障附件：照片/视频 -->
          <RepairAttachments v-model="repairDialog.attachments" />
        </div>
      </div>
      <template #footer>
        <div class="repair-footer">
          <el-button size="large" @click="repairDialog.visible = false">取消</el-button>
          <el-button type="primary" size="large" @click="submitRepairOrder">提交报修</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 配件购买对话框 -->
    <el-dialog
      v-model="partsDialog.visible"
      title="配件购买申请"
      width="95%"
      :show-close="false"
      class="mobile-dialog"
    >
      <div class="parts-search">
        <el-input 
          v-model="partsDialog.searchKeyword" 
          placeholder="搜索配件名称/型号"
          clearable
        >
          <template #append>
            <el-button @click="searchParts">
              <el-icon><Search /></el-icon>
            </el-button>
          </template>
        </el-input>
      </div>
      <div class="parts-list">
        <div 
          v-for="part in partsDialog.partsList" 
          :key="part.id" 
          class="part-item"
        >
          <div class="part-info">
            <span class="part-name">{{ part.name }}</span>
            <span class="part-model">{{ part.model }}</span>
            <span class="part-price">¥{{ part.price }}</span>
          </div>
          <el-input-number 
            v-model="part.quantity" 
            :min="0" 
            :max="99"
            size="small"
          />
        </div>
      </div>
      <div class="parts-summary" v-if="selectedParts.length > 0">
        <span>已选 {{ selectedParts.length }} 种配件，合计 ¥{{ totalAmount }}</span>
      </div>
      <template #footer>
        <el-button @click="partsDialog.visible = false">取消</el-button>
        <el-button type="primary" @click="submitPartsOrder" :disabled="selectedParts.length === 0">
          提交申请
        </el-button>
      </template>
    </el-dialog>

    <!-- 签字确认全屏页面 -->
    <div v-if="signDialog.visible" class="sign-fullscreen-page" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: #f5f7fa; z-index: 9999; display: flex; flex-direction: column;">
      <!-- 顶部导航 -->
      <div class="sign-header" style="background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%); padding: 15px; display: flex; justify-content: space-between; align-items: center; color: white; flex-shrink: 0;">
        <el-button link @click="signDialog.visible = false" style="color: white;">
          <el-icon><ArrowLeft /></el-icon>
          <span>返回</span>
        </el-button>
        <span class="header-title">签字确认</span>
        <span class="placeholder"></span>
      </div>

      <!-- 签字内容区 -->
      <div class="sign-content" style="flex: 1; overflow-y: auto; padding: 15px; scrollbar-width: none; -ms-overflow-style: none;">
        <div class="sign-preview expanded" style="background: white; border-radius: 12px; padding: 15px; margin-bottom: 15px; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">
          <h4 class="report-title" style="margin: 0 0 15px; font-size: 18px; color: #262626; padding-bottom: 10px; border-bottom: 1px solid #f0f0f0;">{{ signDialog.title }}</h4>
          <div class="preview-content expanded-content" v-html="signDialog.previewContent"></div>
        </div>
        <div class="sign-area" style="background: white; border-radius: 12px; padding: 15px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); margin-bottom: 80px;">
          <p class="sign-tip" style="text-align: center; color: #8c8c8c; font-size: 14px; margin: 0 0 10px;">请在下方空白区域手写签名</p>
          <canvas
            ref="signCanvas"
            class="sign-canvas"
            style="width: 100%; height: 150px; background: #fafafa; border: 1px dashed #d9d9d9; border-radius: 8px; touch-action: none;"
            @touchstart="handleTouchStart"
            @touchmove="handleTouchMove"
            @touchend="handleTouchEnd"
            @mousedown="handleMouseDown"
            @mousemove="handleMouseMove"
            @mouseup="handleMouseUp"
          ></canvas>
        </div>
      </div>

      <!-- 底部操作按钮 -->
      <div class="sign-footer" style="position: fixed; bottom: 0; left: 0; right: 0; background: white; padding: 15px; display: flex; gap: 10px; box-shadow: 0 -2px 10px rgba(0,0,0,0.05); z-index: 10000;">
        <el-button size="large" @click="signDialog.visible = false" style="flex: 1;">取消</el-button>
        <el-button size="large" @click="clearSignature" style="flex: 1;">清除重写</el-button>
        <el-button type="primary" size="large" @click="confirmSignature" style="flex: 1;">确认签字</el-button>
      </div>
    </div>

    <!-- PDF预览已改为新窗口打开，不再使用弹框 -->

    <!-- 消息通知对话框 -->
    <el-dialog
      v-model="messageDialog.visible"
      title="消息通知"
      width="95%"
      :show-close="false"
      class="mobile-dialog message-dialog"
    >
      <div class="message-list" v-if="pendingItems.length > 0">
        <div
          v-for="item in pendingItems"
          :key="item.id"
          class="message-item-card"
          @click="handleMessageClick(item)"
        >
          <div class="message-icon" :class="item.type">
            <el-icon><DocumentChecked v-if="item.type === 'sign'" /><Warning v-if="item.type === 'urgent'" /></el-icon>
          </div>
          <div class="message-content">
            <div class="message-title">{{ item.title }}</div>
            <div class="message-desc">{{ item.description }}</div>
          </div>
          <el-icon class="message-arrow"><ArrowRight /></el-icon>
        </div>
      </div>
      <div class="empty-messages" v-else>
        <el-icon><Bell /></el-icon>
        <p>暂无新消息</p>
      </div>
      <template #footer>
        <el-button @click="messageDialog.visible = false">取消</el-button>
      </template>
    </el-dialog>

    <!-- 底部导航 -->
    <div class="bottom-nav">
      <div 
        v-for="nav in bottomNavs" 
        :key="nav.key"
        class="nav-item"
        :class="{ active: currentNav === nav.key }"
        @click="switchNav(nav.key)"
      >
        <el-icon><component :is="nav.icon" /></el-icon>
        <span>{{ nav.name }}</span>
      </div>
    </div>

    <!-- PDF全屏预览覆盖层（图片展示兼容微信，iframe兜底） -->
    <div v-if="pdfOverlay.visible" class="pdf-overlay">
      <div class="pdf-overlay-header">
        <el-button link @click="closePdfOverlay">
          <el-icon><ArrowLeft /></el-icon>
          <span>返回</span>
        </el-button>
        <span class="header-title">PDF预览</span>
        <el-button link size="small" @click="downloadCurrentPdf">下载</el-button>
      </div>
      <div v-if="pdfOverlay.images.length > 0" class="pdf-preview-images">
        <img v-for="(img, i) in pdfOverlay.images" :key="i" :src="img" class="preview-page" />
      </div>
      <iframe v-else :src="pdfOverlay.url" class="pdf-overlay-iframe" frameborder="0"></iframe>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { signWorkorder, getPendingSignWorkorders, getWorkorderById, saveReportPdf, createWorkorder } from '../stores/workorderFlowStore.js'
import { saveAttachments } from '../stores/attachmentStore.js'
import RepairAttachments from '../components/RepairAttachments.vue'
import { generateReportPdf } from '../utils/reportPdf.js'
import {
  UserFilled,
  Bell,
  Camera,
  ChatDotRound,
  Tools,
  ShoppingCart,
  DocumentChecked,
  Warning,
  ArrowLeft,
  ArrowRight,
  Document,
  Monitor,
  Service,
  Search,
  HomeFilled,
  List,
  User,
  Close,
  Plus,
  Picture,
  VideoCamera,
  View,
  Goods
} from '@element-plus/icons-vue'
import {
  getCustomerWorkorders,
  WorkorderStatusText,
  WorkorderStatusType,
  state as workorderFlowState
} from '../stores/workorderFlowStore.js'
import { getContactsByCompanyId } from '../stores/contactStore.js'
import { getAssetsByCompanyId, getAssetBySerialNumber, getAssetByQRToken, boundQRCodes, unboundQRCodes, bindQRCode } from '../stores/assetStore.js'

const router = useRouter()
const route = useRoute()

// 客户信息
const customerInfo = reactive({
  name: '张经理',
  company: '上海某机械有限公司'
})
// 从 staffAuth 初始化客户信息
try {
  const auth = JSON.parse(localStorage.getItem('staffAuth') || '{}')
  if (auth.role === 'customer') {
    customerInfo.name = auth.name || '张经理'
    customerInfo.company = auth.companyName || '上海某机械有限公司'
  }
} catch (e) {}

// 页面加载时检查URL参数 + 自动检测待签字工单
onMounted(() => {
  const action = route.query.action
  if (action === 'repair') {
    createRepairOrder()
  }
  // 自动检测待签字工单
  nextTick(() => {
    checkPendingSignWorkorders()
  })
})

// 未读消息数 - 根据待处理事项动态计算
const unreadCount = computed(() => pendingItems.value.length)
const unreadChatCount = ref(2)

// 消息对话框
const messageDialog = reactive({
  visible: false,
  messages: []
})

// 当前导航
const currentNav = ref('home')

// 底部导航配置
const bottomNavs = [
  { key: 'home', name: '首页', icon: 'HomeFilled' },
  { key: 'workorder', name: '工单', icon: 'List' },
  { key: 'profile', name: '我的', icon: 'User' }
]

// 待处理事项 - 动态计算
const pendingItems = computed(() => {
  const items = []

  // 添加待签字的工单
  const pendingSignWorkorders = workorders.value.filter(w => w.needsSign)
  pendingSignWorkorders.forEach(workorder => {
    items.push({
      id: `sign_${workorder.id}`,
      type: 'sign',
      title: '服务报告书待签字',
      description: `工单${workorder.workorderId}服务报告书需要您签字确认`,
      workorderId: workorder.workorderId
    })
  })

  // 添加待确认的报价单
  const pendingQuotations = getPendingQuotations()
  pendingQuotations.forEach((quotation, index) => {
    items.push({
      id: `quotation_${quotation.id}`,
      type: 'urgent',
      title: '配件报价待确认',
      description: `报价单${quotation.quotationNo || quotation.id}已生成，请查看确认`,
      quotationId: quotation.id,
      quotationNo: quotation.quotationNo
    })
  })

  return items
})

// 获取待确认的报价单列表
const getPendingQuotations = () => {
  try {
    // 从 localStorage 获取报价单数据
    const storedQuotations = JSON.parse(localStorage.getItem('quotations') || '[]')
    // 筛选出已发送给客户但未确认的报价单
    const pendingQuotations = storedQuotations.filter(q => q.status === 'sent' || q.status === 'SENT')

    // 如果没有待确认的报价单，添加一条演示数据
    if (pendingQuotations.length === 0) {
      return [{
        id: 'QT20260407651',
        quotationNo: 'QT20260407651',
        status: 'sent',
        customerName: '某某科技有限公司',
        totalAmount: 1750.00
      }]
    }

    return pendingQuotations
  } catch (e) {
    console.error('获取待确认报价单失败:', e)
    // 返回演示数据
    return [{
      id: 'QT20260407651',
      quotationNo: 'QT20260407651',
      status: 'sent',
      customerName: '某某科技有限公司',
      totalAmount: 1750.00
    }]
  }
}

// 工单标签（展示全部7个流程节点）
const workorderTabs = computed(() => [
  { key: 'all', name: '全部', count: workorders.value.length },
  { key: 'pending_assign', name: '待分配', count: workorders.value.filter(w => w.status === 'pending_assign').length },
  { key: 'pending_accept', name: '待接单', count: workorders.value.filter(w => w.status === 'pending_accept').length },
  { key: 'processing', name: '进行中', count: workorders.value.filter(w => w.status === 'processing').length },
  { key: 'pending_sign', name: '待签字', count: workorders.value.filter(w => w.status === 'pending_sign').length },
  { key: 'techlead_confirm', name: '课长确认', count: workorders.value.filter(w => w.status === 'techlead_confirm').length },
  { key: 'assistant_confirm', name: '业务确认', count: workorders.value.filter(w => w.status === 'assistant_confirm').length },
  { key: 'completed', name: '已完成', count: workorders.value.filter(w => w.status === 'completed').length }
])
const activeTab = ref('all')

// 工单列表 - 从 store 获取
const workorders = ref([])

// 加载工单数据
const loadWorkorders = () => {
  // 获取当前客户信息
  let customerId = 'guest'
  let customerName = ''
  try {
    const auth = JSON.parse(localStorage.getItem('staffAuth') || '{}')
    customerId = auth.id || auth.userId || 'guest'
    customerName = auth.name || ''
  } catch (e) {
    console.error('读取客户信息失败:', e)
  }

  // 获取该客户的工单
  let customerWorkorders = getCustomerWorkorders(customerId, customerName)
  
  console.log('客户工单:', { customerId, customerName, count: customerWorkorders.length })
  
  // 转换为组件需要的格式
  workorders.value = customerWorkorders.map(w => ({
    id: w.id,
    workorderId: w.workorderId,
    type: 'service',
    deviceModel: w.deviceModel,
    faultDescription: w.faultDescription,
    description: w.faultDescription,
    status: w.status,
    createTime: new Date(w.createTime),
    needsSign: w.status === 'pending_sign',
    reportPdf: w.reportPdf,
    reportPreviewImages: w.reportPreviewImages || [],
    serviceReport: w.serviceReport,
    customerName: w.customerName,
    engineerName: w.engineerName,
    serialNumber: w.serialNumber
  }))
}

// 筛选后的工单
const filteredWorkorders = computed(() => {
  if (activeTab.value === 'all') return workorders.value
  return workorders.value.filter(order => {
    switch (activeTab.value) {
      case 'pending_assign':
        return order.status === 'pending_assign'
      case 'pending_accept':
        return order.status === 'pending_accept'
      case 'processing':
        return order.status === 'processing'
      case 'pending_sign':
        return order.status === 'pending_sign'
      case 'techlead_confirm':
        return order.status === 'techlead_confirm'
      case 'assistant_confirm':
        return order.status === 'assistant_confirm'
      case 'completed':
        return order.status === 'completed'
      default:
        return true
    }
  })
})

// 首页只显示最新10条
const displayedWorkorders = computed(() => {
  return filteredWorkorders.value.slice(0, 10)
})

// 扫码对话框
const scanDialog = reactive({
  visible: false,
  manualInput: '',
  isScanning: false
})

// 摄像头可用性检测
const canUseCamera = computed(() => {
  // 检查是否在 HTTPS 或 localhost 环境
  const isSecureContext = window.location.protocol === 'https:' || window.location.hostname === 'localhost'
  // 检查浏览器是否支持
  const hasMediaDevices = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
  return isSecureContext && hasMediaDevices
})

// 摄像头不可用原因
const cameraUnavailableReason = computed(() => {
  if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
    return '需要在 HTTPS 安全环境下使用'
  }
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    return '当前浏览器不支持摄像头功能'
  }
  return '摄像头暂不可用'
})

// 扫码相关引用
const videoRef = ref(null)
const canvasRef = ref(null)
let scanStream = null
let scanInterval = null

// 聊天对话框
const chatDialog = reactive({
  visible: false,
  inputMessage: '',
  showMediaOptions: false,
  mediaPreview: null,
  mediaType: null // 'image' | 'video'
})
const chatMessages = ref([
  { id: 1, content: '您好，请问有什么可以帮您？', isSelf: false, time: new Date(Date.now() - 3600000), type: 'text' },
  { id: 2, content: '我的激光切割机报错E01，请问是什么问题？', isSelf: true, time: new Date(Date.now() - 3000000), type: 'text' },
  { id: 3, content: 'E01错误通常是电源模块故障，建议检查电源连接或联系我们的工程师上门检修。', isSelf: false, time: new Date(Date.now() - 2400000), type: 'text' }
])
const chatMessagesRef = ref(null)
const mediaInputRef = ref(null)
const videoInputRef = ref(null)

// 报修对话框
const repairDialog = reactive({
  visible: false,
  form: {
    customerId: '',
    customerName: '',
    customerPhone: '',
    customerContact: '',
    customerAddress: '',
    category: 'service',
    subType: 'repair',
    urgency: 'medium',
    assetModel: '',
    assetSerialNumber: '',
    warrantyStatus: '',
    faultDescription: ''
  },
  attachments: [] // { type: 'image'|'video', url: base64DataUrl, name: string }
})

// 设备数据（从 assetStore 获取）
const repairAssets = computed(() => {
  let companyId = ''
  try {
    const auth = JSON.parse(localStorage.getItem('staffAuth') || '{}')
    companyId = auth.companyId || auth.id || ''
  } catch (e) {}
  if (!companyId) return []
  return getAssetsByCompanyId(companyId).map(a => ({
    id: a.serialNumber,
    customerId: a.companyId,
    model: a.model,
    serialNumber: a.serialNumber,
    warrantyStatus: a.warrantyEndDate && new Date(a.warrantyEndDate) > new Date() ? 'in_warranty' : 'out_of_warranty',
    warrantyExpiry: a.warrantyEndDate || ''
  }))
})

const WarrantyStatusText = { in_warranty: '保内', out_of_warranty: '保外', expired: '过保' }
const WarrantyStatusType = { in_warranty: 'success', out_of_warranty: 'warning', expired: 'danger' }

const commonFaultTags = [
  { label: '无法启动', description: '设备无法正常启动，通电后无响应' },
  { label: '异响', description: '设备运行过程中出现异常响声' },
  { label: '漏油', description: '设备存在漏油现象，需检查密封件' },
  { label: '精度异常', description: '设备加工精度超出允许偏差范围' },
  { label: '过热报警', description: '设备运行中触发过热报警保护' }
]

// 级联：客户 → 设备型号列表
const repairCustomerModels = computed(() => {
  if (!repairDialog.form.customerId) return []
  return [...new Set(repairAssets.value.filter(a => a.customerId === repairDialog.form.customerId).map(a => a.model))]
})

// 客户联系人列表（根据登录客户的companyId）
const repairCustomerContacts = computed(() => {
  let companyId = ''
  try {
    const auth = JSON.parse(localStorage.getItem('staffAuth') || '{}')
    companyId = auth.companyId || auth.id || ''
  } catch (e) {}
  if (!companyId) return []
  return getContactsByCompanyId(companyId).filter(c => c.approvalStatus === '已通过')
})

// 级联：客户+型号 → SN列表
const repairCustomerSNs = computed(() => {
  if (!repairDialog.form.customerId) return []
  let filtered = repairAssets.value.filter(a => a.customerId === repairDialog.form.customerId)
  if (repairDialog.form.assetModel) {
    filtered = filtered.filter(a => a.model === repairDialog.form.assetModel)
  }
  return filtered
})

const onRepairModelChange = () => {
  repairDialog.form.assetSerialNumber = ''
  repairDialog.form.warrantyStatus = ''
}

const onRepairSNChange = (sn) => {
  const asset = repairAssets.value.find(a => a.serialNumber === sn && a.customerId === repairDialog.form.customerId)
  if (asset) {
    repairDialog.form.warrantyStatus = asset.warrantyStatus || ''
    if (!repairDialog.form.assetModel && asset.model) {
      repairDialog.form.assetModel = asset.model
    }
  } else {
    repairDialog.form.warrantyStatus = ''
  }
}

const applyRepairFaultTag = (tag) => {
  repairDialog.form.faultDescription = tag.description
}

// 配件购买对话框
const partsDialog = reactive({
  visible: false,
  searchKeyword: '',
  partsList: [
    { id: 1, name: '激光切割头保护镜片', model: 'LP-28mm', price: 280, quantity: 0 },
    { id: 2, name: '聚焦镜片', model: 'FJ-50.8mm', price: 450, quantity: 0 },
    { id: 3, name: '陶瓷环', model: 'TH-32mm', price: 120, quantity: 0 },
    { id: 4, name: '喷嘴', model: 'PZ-1.5mm', price: 35, quantity: 0 }
  ]
})

const selectedParts = computed(() => {
  return partsDialog.partsList.filter(p => p.quantity > 0)
})

const totalAmount = computed(() => {
  return selectedParts.value.reduce((sum, p) => sum + p.price * p.quantity, 0)
})

// 是否可以发送消息（有文字或有媒体）
const canSendMessage = computed(() => {
  return chatDialog.inputMessage.trim() || chatDialog.mediaPreview
})

// 签字对话框
const signDialog = reactive({
  visible: false,
  title: '',
  previewContent: '',
  currentWorkorder: null
})
const signCanvas = ref(null)
let isDrawing = false
let ctx = null

// PDF全屏覆盖预览（图片展示兼容微信，iframe兜底）
const pdfOverlay = reactive({
  visible: false,
  url: '',
  images: [],
  _blobUrl: null,
  _dataUri: null
})

const dataUriToBlobUrl = (dataUri) => {
  let base64 = dataUri
  const match = dataUri.match(/;base64,([\s\S]*)$/i)
  if (match) base64 = match[1]
  base64 = base64.replace(/[\s\n\r]/g, '')
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i) & 0xff
  }
  const blob = new Blob([bytes], { type: 'application/pdf' })
  return URL.createObjectURL(blob)
}

const openPdfInNewTab = (dataUri, previewImages) => {
  try {
    if (pdfOverlay._blobUrl) {
      URL.revokeObjectURL(pdfOverlay._blobUrl)
    }
    // 优先使用预览图片（兼容微信等不支持PDF的浏览器）
    if (previewImages && previewImages.length > 0) {
      pdfOverlay.images = previewImages
      pdfOverlay.url = ''
      pdfOverlay._blobUrl = null
    } else {
      pdfOverlay.images = []
      const url = dataUriToBlobUrl(dataUri)
      pdfOverlay.url = url
      pdfOverlay._blobUrl = url
    }
    pdfOverlay._dataUri = dataUri
    pdfOverlay.visible = true
  } catch (e) {
    console.error('PDF预览失败:', e)
    ElMessage.warning('PDF预览失败，请尝试下载')
  }
}

const closePdfOverlay = () => {
  pdfOverlay.visible = false
  if (pdfOverlay._blobUrl) {
    URL.revokeObjectURL(pdfOverlay._blobUrl)
    pdfOverlay._blobUrl = null
  }
  pdfOverlay.url = ''
  pdfOverlay._dataUri = null
}

const downloadCurrentPdf = () => {
  if (pdfOverlay._dataUri) {
    const a = document.createElement('a')
    a.href = pdfOverlay._dataUri
    a.download = '服务报告书.pdf'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  } else {
    ElMessage.warning('PDF数据不可用')
  }
}

// 方法
const openScan = () => {
  scanDialog.visible = true
  scanDialog.manualInput = ''
  scanDialog.isScanning = false
}

// 开始扫码
const startScan = async () => {
  try {
    // 检查是否在 HTTPS 环境
    if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
      ElMessage.warning('摄像头功能需要在 HTTPS 环境下使用，请使用手动输入')
      return
    }

    // 检查浏览器支持
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      ElMessage.warning('您的浏览器不支持摄像头功能，请使用手动输入')
      return
    }

    // 请求摄像头权限
    scanStream = await navigator.mediaDevices.getUserMedia({
      video: { 
        facingMode: 'environment',
        width: { ideal: 1280 },
        height: { ideal: 720 }
      }
    })

    // 显示视频流
    if (videoRef.value) {
      videoRef.value.srcObject = scanStream
      scanDialog.isScanning = true

      // 开始定时扫描
      startScanning()
    }
  } catch (error) {
    console.error('摄像头启动失败:', error)
    if (error.name === 'NotAllowedError') {
      ElMessage.warning('请允许使用摄像头权限，或在浏览器设置中开启权限')
    } else if (error.name === 'NotFoundError') {
      ElMessage.warning('未找到摄像头设备')
    } else if (error.name === 'NotReadableError') {
      ElMessage.warning('摄像头被其他应用占用，请关闭其他应用后重试')
    } else if (error.name === 'SecurityError') {
      ElMessage.warning('摄像头功能需要在安全环境（HTTPS）下使用')
    } else {
      ElMessage.warning('摄像头启动失败，请使用手动输入')
    }
  }
}

// 停止扫码
const stopScan = () => {
  scanDialog.isScanning = false

  // 停止定时扫描
  if (scanInterval) {
    clearInterval(scanInterval)
    scanInterval = null
  }

  // 停止视频流
  if (scanStream) {
    scanStream.getTracks().forEach(track => track.stop())
    scanStream = null
  }

  if (videoRef.value) {
    videoRef.value.srcObject = null
  }
}

// 开始扫描（模拟扫码成功）
const startScanning = () => {
  // 模拟扫码成功，3秒后自动识别
  scanInterval = setTimeout(() => {
    // 演示环境：直接跳到当前客户公司下的第一个设备
    const customerAssets = repairAssets.value
    if (customerAssets.length > 0) {
      ElMessage.success('扫码成功')
      stopScan()
      scanDialog.visible = false
      router.push(`/asset-detail?serial=${customerAssets[0].serialNumber}`)
      return
    }
    // 兜底：从assetStore中找已绑定的二维码
    const boundCodes = boundQRCodes.value
    if (boundCodes.length > 0) {
      const asset = getAssetByQRToken(boundCodes[0].token)
      if (asset) {
        ElMessage.success('扫码成功')
        stopScan()
        scanDialog.visible = false
        router.push(`/asset-detail?serial=${asset.serialNumber}`)
      }
    }
  }, 3000)
}

// 处理扫码结果
const handleScanResult = (result) => {
  if (result && result.trim()) {
    ElMessage.success('扫码成功')
    stopScan()
    scanDialog.visible = false
    router.push(`/asset-detail?serial=${result}`)
  }
}

const handleManualQuery = () => {
  if (!scanDialog.manualInput) {
    ElMessage.warning('请选择设备编号')
    return
  }
  // 从assetStore查找设备
  const asset = getAssetBySerialNumber(scanDialog.manualInput)
  if (!asset) {
    ElMessage.warning('未找到该设备，请确认编号是否正确')
    return
  }
  scanDialog.visible = false
  router.push(`/asset-detail?serial=${asset.serialNumber}`)
}

const openChat = () => {
  chatDialog.visible = true
  chatDialog.inputMessage = ''
  nextTick(() => {
    scrollToBottom()
  })
}

const sendMessage = () => {
  if (!canSendMessage.value) return
  
  // 发送媒体消息
  if (chatDialog.mediaPreview) {
    chatMessages.value.push({
      id: Date.now(),
      content: chatDialog.mediaPreview,
      isSelf: true,
      time: new Date(),
      type: chatDialog.mediaType
    })
    clearMediaPreview()
  }
  
  // 发送文字消息
  if (chatDialog.inputMessage.trim()) {
    chatMessages.value.push({
      id: Date.now(),
      content: chatDialog.inputMessage,
      isSelf: true,
      time: new Date(),
      type: 'text'
    })
    chatDialog.inputMessage = ''
  }
  
  nextTick(() => {
    scrollToBottom()
  })
  
  // 模拟客服回复
  setTimeout(() => {
    chatMessages.value.push({
      id: Date.now() + 1,
      content: '收到您的问题，我们的客服人员会尽快为您解答。',
      isSelf: false,
      time: new Date(),
      type: 'text'
    })
    nextTick(() => {
      scrollToBottom()
    })
  }, 1000)
}

// 切换媒体选项显示
const toggleMediaOptions = () => {
  chatDialog.showMediaOptions = !chatDialog.showMediaOptions
}

// 选择图片
const selectImage = () => {
  chatDialog.showMediaOptions = false
  if (mediaInputRef.value) {
    mediaInputRef.value.click()
  }
}

// 拍照
const takePhoto = () => {
  chatDialog.showMediaOptions = false
  if (mediaInputRef.value) {
    mediaInputRef.value.setAttribute('capture', 'environment')
    mediaInputRef.value.click()
  }
}

// 选择视频
const selectVideo = () => {
  chatDialog.showMediaOptions = false
  if (videoInputRef.value) {
    videoInputRef.value.click()
  }
}

// 处理图片选择
const handleImageSelected = (event) => {
  const file = event.target.files[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = (e) => {
      chatDialog.mediaPreview = e.target.result
      chatDialog.mediaType = 'image'
    }
    reader.readAsDataURL(file)
  }
  // 清空input，允许重复选择同一文件
  event.target.value = ''
}

// 处理视频选择
const handleVideoSelected = (event) => {
  const file = event.target.files[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = (e) => {
      chatDialog.mediaPreview = e.target.result
      chatDialog.mediaType = 'video'
    }
    reader.readAsDataURL(file)
  }
  // 清空input
  event.target.value = ''
}

// 清除媒体预览
const clearMediaPreview = () => {
  chatDialog.mediaPreview = null
  chatDialog.mediaType = null
}

// 预览图片
const previewImage = (url) => {
  // 创建全屏预览
  const preview = document.createElement('div')
  preview.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0,0,0,0.9);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
  `
  
  const img = document.createElement('img')
  img.src = url
  img.style.cssText = 'max-width: 90%; max-height: 90%; object-fit: contain;'
  
  const closeBtn = document.createElement('div')
  closeBtn.innerHTML = '✕'
  closeBtn.style.cssText = `
    position: absolute;
    top: 20px;
    right: 20px;
    color: white;
    font-size: 30px;
    cursor: pointer;
    padding: 10px;
  `
  
  preview.appendChild(img)
  preview.appendChild(closeBtn)
  document.body.appendChild(preview)
  
  const close = () => {
    document.body.removeChild(preview)
  }
  
  closeBtn.onclick = close
  preview.onclick = (e) => {
    if (e.target === preview) close()
  }
}

const scrollToBottom = () => {
  if (chatMessagesRef.value) {
    chatMessagesRef.value.scrollTop = chatMessagesRef.value.scrollHeight
  }
}

const createRepairOrder = () => {
  // 从 staffAuth 读取客户信息（统一登录存的是 staffAuth）
  let customerId = ''
  let customerName = ''
  let customerContact = ''
  let customerPhone = ''
  let customerAddress = ''
  try {
    const auth = JSON.parse(localStorage.getItem('staffAuth') || '{}')
    customerId = auth.companyId || auth.id || ''
    customerName = auth.companyName || ''
    customerContact = auth.name || ''
    customerPhone = auth.phone || ''
  } catch (e) {
    console.error('读取客户信息失败:', e)
  }

  repairDialog.form = {
    customerId,
    customerName,
    customerPhone,
    customerContact,
    customerAddress,
    category: 'service',
    subType: 'repair',
    urgency: 'medium',
    assetModel: '',
    assetSerialNumber: '',
    warrantyStatus: '',
    faultDescription: ''
  }
  repairDialog.attachments = []
  repairDialog.visible = true
}

const submitRepairOrder = async () => {
  if (!repairDialog.form.faultDescription) {
    ElMessage.warning('请填写故障描述')
    return
  }

  // 将附件存入 IndexedDB，工单只存引用（避免 localStorage 5MB 限制）
  const attachmentRefs = await saveAttachments(repairDialog.attachments)

  const auth = JSON.parse(localStorage.getItem('staffAuth') || '{}')
  const wo = createWorkorder({
    customerId: repairDialog.form.customerId,
    customerName: repairDialog.form.customerName,
    customerPhone: repairDialog.form.customerPhone,
    customerContact: repairDialog.form.customerContact,
    address: repairDialog.form.customerAddress,
    deviceModel: repairDialog.form.assetModel,
    serialNumber: repairDialog.form.assetSerialNumber,
    faultDescription: repairDialog.form.faultDescription,
    category: repairDialog.form.category,
    subType: repairDialog.form.subType,
    urgency: repairDialog.form.urgency,
    warrantyStatus: repairDialog.form.warrantyStatus || 'unknown',
    attachments: attachmentRefs
  }, 'customer', repairDialog.form.customerContact || auth.name)

  ElMessage.success(`报修申请已提交，工单号 ${wo.workorderId}`)
  repairDialog.visible = false
  loadWorkorders()
}

const createPartsOrder = () => {
  partsDialog.visible = true
  partsDialog.searchKeyword = ''
}

const openProductLibrary = () => {
  router.push('/product-library')
}

const searchParts = () => {
  ElMessage.info(`搜索: ${partsDialog.searchKeyword}`)
}

const submitPartsOrder = () => {
  ElMessage.success('配件购买申请已提交')
  partsDialog.visible = false
}

const handlePendingItem = (item) => {
  if (item.type === 'sign') {
    const workorder = workorders.value.find(w => w.workorderId === item.workorderId)
    if (workorder) {
      handleSign(workorder)
    }
  } else if (item.type === 'urgent') {
    // 配件报价待确认
    handleQuotationConfirm(item)
  }
}

const handleSign = (workorder) => {
  signDialog.title = '服务报告书签字确认'
  signDialog.previewContent = `
    <div style="padding: 15px; background: #f5f5f5; border-radius: 8px;">
      <p><strong>工单号：</strong>${workorder.workorderId}</p>
      <p><strong>设备型号：</strong>${workorder.deviceModel}</p>
      <p><strong>故障描述：</strong>${workorder.faultDescription}</p>
      <p><strong>服务结果：</strong>已修复，设备运行正常</p>
      <p><strong>工程师：</strong>${workorder.engineerName || '工程师'}</p>
      <p><strong>服务时间：</strong>${new Date().toLocaleString('zh-CN')}</p>
    </div>
  `
  signDialog.currentWorkorder = workorder
  signDialog.visible = true

  nextTick(() => {
    initCanvas()
  })
}

// 自动检测待签字工单（客户进入工作台时）
const checkPendingSignWorkorders = () => {
  const pendingSignWo = getPendingSignWorkorders()
  if (pendingSignWo.length > 0) {
    const wo = pendingSignWo[0]
    // 转换为客户工作台需要的格式
    handleSign({
      id: wo.id,
      rawId: wo.id,
      workorderId: wo.workorderId,
      deviceModel: wo.deviceModel,
      faultDescription: wo.faultDescription,
      engineerName: wo.engineerName,
      status: wo.status,
    })
  }
}

const handleQuotationConfirm = (item) => {
  // 跳转到客户报价单签字确认页面
  router.push(`/customer-quotation-sign?id=${item.quotationId}`)
}

const openMessageDialog = () => {
  messageDialog.visible = true
}

const handleMessageClick = (item) => {
  messageDialog.visible = false
  handlePendingItem(item)
}

const initCanvas = () => {
  const canvas = signCanvas.value
  if (!canvas) return
  
  canvas.width = canvas.offsetWidth
  canvas.height = canvas.offsetHeight
  
  ctx = canvas.getContext('2d')
  ctx.strokeStyle = '#000'
  ctx.lineWidth = 2
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
}

const handleTouchStart = (e) => {
  e.preventDefault()
  isDrawing = true
  const touch = e.touches[0]
  const rect = signCanvas.value.getBoundingClientRect()
  ctx.beginPath()
  ctx.moveTo(touch.clientX - rect.left, touch.clientY - rect.top)
}

const handleTouchMove = (e) => {
  e.preventDefault()
  if (!isDrawing) return
  const touch = e.touches[0]
  const rect = signCanvas.value.getBoundingClientRect()
  ctx.lineTo(touch.clientX - rect.left, touch.clientY - rect.top)
  ctx.stroke()
}

const handleTouchEnd = () => {
  isDrawing = false
}

const handleMouseDown = (e) => {
  isDrawing = true
  const rect = signCanvas.value.getBoundingClientRect()
  ctx.beginPath()
  ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top)
}

const handleMouseMove = (e) => {
  if (!isDrawing) return
  const rect = signCanvas.value.getBoundingClientRect()
  ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top)
  ctx.stroke()
}

const handleMouseUp = () => {
  isDrawing = false
}

const clearSignature = () => {
  if (!ctx || !signCanvas.value) return
  ctx.clearRect(0, 0, signCanvas.value.width, signCanvas.value.height)
}

const confirmSignature = async () => {
  if (!signCanvas.value) return
  
  const imageData = ctx.getImageData(0, 0, signCanvas.value.width, signCanvas.value.height)
  const hasSignature = imageData.data.some(channel => channel !== 0)
  
  if (!hasSignature) {
    ElMessage.warning('请先签名')
    return
  }
  
  const signatureData = signCanvas.value.toDataURL()
  
  if (signDialog.currentWorkorder) {
    const woId = signDialog.currentWorkorder.id || signDialog.currentWorkorder.rawId
    const wo = getWorkorderById(signDialog.currentWorkorder.workorderId || signDialog.currentWorkorder.id)
    
    if (wo) {
      try {
        const result = await generateReportPdf(wo, signatureData, 'customer')
        if (result.pdfDataUri) {
          saveReportPdf(wo.id, result.pdfDataUri, result.previewImages)
        }
      } catch (e) {
        console.error('PDF生成失败:', e)
      }
      signWorkorder(wo.id, signatureData, 'customer')
    } else {
      // 兼容本地数据
      signDialog.currentWorkorder.needsSign = false
      signDialog.currentWorkorder.status = 'completed'
      ElMessage.success('签字确认成功')
      signDialog.visible = false
      return
    }
  }
  
  ElMessage.success('签字确认成功，PDF报告已生成')
  signDialog.visible = false
  loadWorkorders()
}

const viewAllWorkorders = () => {
  router.push('/customer-workorder-list')
}

const viewWorkorderDetail = (order) => {
  router.push(`/customer-workorder-detail?id=${order.id}`)
}

const previewWorkorderPdf = (order) => {
  if (!order.reportPdf) {
    ElMessage.warning('PDF不存在')
    return
  }
  openPdfInNewTab(order.reportPdf, order.reportPreviewImages)
}

const downloadPdf = () => {
  if (pdfOverlay._dataUri) {
    const a = document.createElement('a')
    a.href = pdfOverlay._dataUri
    a.download = '服务报告书.pdf'
    a.target = '_blank'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }
}

const switchNav = (key) => {
  currentNav.value = key
  if (key === 'workorder') {
    // 跳转到客户工单列表页面
    router.push('/customer-workorder-list')
  } else if (key === 'profile') {
    // 跳转到个人中心页面
    router.push('/customer-profile')
  }
}

const getTabName = (key) => {
  const tab = workorderTabs.value.find(t => t.key === key)
  return tab ? tab.name : ''
}

const getStatusType = (status) => WorkorderStatusType[status] || 'info'

const getStatusText = (status) => {
  return WorkorderStatusText[status] || status
}

const formatDate = (date) => {
  if (!date) return ''
  const d = new Date(date)
  return `${d.getMonth() + 1}月${d.getDate()}日`
}

const formatTime = (date) => {
  if (!date) return ''
  const d = new Date(date)
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}

// 监听报价单更新事件
const handleQuotationUpdate = (event) => {
  // 强制刷新计算属性
  console.log('报价单已更新，刷新待处理事项', event.detail)

  // 如果是客户确认报价，删除对应的待办通知
  if (event.detail && event.detail.action === 'confirmed') {
    try {
      const customerNotifications = JSON.parse(localStorage.getItem('customerNotifications') || '[]')
      const updatedNotifications = customerNotifications.filter(n =>
        !(n.quotationId === event.detail.quotationId && n.type === 'quotation_received')
      )
      localStorage.setItem('customerNotifications', JSON.stringify(updatedNotifications))
    } catch (e) {
      console.error('删除已确认报价通知失败:', e)
    }
  }
}

// 监听客户通知更新事件
const handleCustomerNotificationUpdate = (event) => {
  console.log('收到客户通知更新:', event.detail)
  // 强制刷新计算属性，待办事项会自动更新
}

// 处理工单更新事件
const handleWorkorderUpdate = (event) => {
  console.log('工单流程更新:', event.detail)
  loadWorkorders()
}

onMounted(() => {
  // 加载工单数据
  loadWorkorders()
  
  // 更新标签计数
  workorderTabs.value.forEach(tab => {
    if (tab.key === 'all') {
      tab.count = workorders.value.length
    }
  })

  // 监听报价单更新事件
  window.addEventListener('quotation-updated', handleQuotationUpdate)

  // 监听客户通知更新事件
  window.addEventListener('customer-notification-updated', handleCustomerNotificationUpdate)
  
  // 监听工单更新事件
  window.addEventListener('workorder-flow-updated', handleWorkorderUpdate)
})

onUnmounted(() => {
  // 移除事件监听
  window.removeEventListener('quotation-updated', handleQuotationUpdate)
  window.removeEventListener('customer-notification-updated', handleCustomerNotificationUpdate)
  window.removeEventListener('workorder-flow-updated', handleWorkorderUpdate)
})
</script>

<style scoped>
.customer-mobile-workspace {
  min-height: 100vh;
  background: #f5f7fa;
  padding-bottom: 90px;
  width: 100vw;
  max-width: 100%;
  overflow-x: hidden;
  box-sizing: border-box;
  position: relative;
  left: 0;
  right: 0;
  /* 隐藏滚动条但保留滑动功能 */
  overflow-y: auto;
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE 10+ */
}

/* Chrome, Safari, Opera 隐藏滚动条 */
.customer-mobile-workspace::-webkit-scrollbar {
  display: none;
  width: 0;
  height: 0;
}

/* 顶部用户信息 */
.header-section {
  background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: white;
  width: 100%;
  box-sizing: border-box;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-details h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 500;
}

.user-details p {
  margin: 4px 0 0;
  font-size: 14px;
  opacity: 0.9;
}

.message-badge :deep(.el-badge__content) {
  border: none;
}

/* 快捷功能入口 */
.quick-actions {
  padding: 15px;
  width: 100%;
  box-sizing: border-box;
}

.action-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  width: 100%;
}

.action-item {
  background: white;
  border-radius: 12px;
  padding: 20px 15px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  cursor: pointer;
  transition: all 0.3s;
}

.action-item:active {
  transform: scale(0.98);
}

.action-icon {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 12px;
  font-size: 28px;
  position: relative;
}

.action-item.scan .action-icon {
  background: #e6f7ff;
  color: #1890ff;
}

.action-item.chat .action-icon {
  background: #f6ffed;
  color: #52c41a;
}

.action-item.repair .action-icon {
  background: #fff2e8;
  color: #fa8c16;
}

.action-item.parts .action-icon {
  background: #f9f0ff;
  color: #722ed1;
}

.action-label {
  display: block;
  font-size: 16px;
  font-weight: 500;
  color: #262626;
  margin-bottom: 4px;
}

.action-desc {
  display: block;
  font-size: 12px;
  color: #8c8c8c;
}

.chat-badge {
  position: absolute;
  top: -5px;
  right: -5px;
}

/* 待处理事项 */
.pending-section {
  margin: 0 15px 15px;
  background: white;
  border-radius: 12px;
  padding: 15px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  box-sizing: border-box;
  overflow: hidden;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  width: 100%;
}

.section-header h4 {
  margin: 0;
  font-size: 16px;
  color: #262626;
  flex-shrink: 0;
  white-space: nowrap;
}

.pending-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
}

.pending-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #fafafa;
  border-radius: 8px;
  cursor: pointer;
  width: 100%;
  box-sizing: border-box;
}

.pending-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
}

.pending-icon.sign {
  background: #fff7e6;
  color: #fa8c16;
}

.pending-icon.urgent {
  background: #fff1f0;
  color: #f5222d;
}

.pending-content {
  flex: 1;
  min-width: 0;
}

.pending-title {
  display: block;
  font-size: 15px;
  font-weight: 500;
  color: #262626;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.pending-desc {
  display: block;
  font-size: 13px;
  color: #8c8c8c;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.arrow {
  color: #bfbfbf;
  font-size: 18px;
}

/* 工单区域 */
.workorder-section {
  margin: 0 15px 15px;
  background: white;
  border-radius: 12px;
  padding: 15px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  box-sizing: border-box;
}

.workorder-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 15px;
  overflow-x: auto;
  padding-bottom: 5px;
  scrollbar-width: none;
  -ms-overflow-style: none;
  -webkit-overflow-scrolling: touch;
}

.workorder-tabs::-webkit-scrollbar {
  display: none;
}

.tab-item {
  padding: 8px 16px;
  background: #f5f5f5;
  border-radius: 20px;
  font-size: 14px;
  color: #595959;
  cursor: pointer;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.3s;
}

.tab-item.active {
  background: #1890ff;
  color: white;
}

.tab-count {
  background: #1890ff;
  color: white;
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 10px;
  max-width: 48px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tab-item.active .tab-count {
  background: white;
  color: #1890ff;
}

.list-summary {
  padding: 8px 0 0;
  font-size: 13px;
  color: #8c8c8c;
}

.workorder-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: #bfbfbf;
}

.empty-state .el-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.workorder-card {
  background: white;
  border-radius: 12px;
  padding: 15px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  cursor: pointer;
  transition: all 0.3s;
}

.workorder-card:active {
  transform: scale(0.98);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.order-no {
  font-size: 16px;
  font-weight: 600;
  color: #1890ff;
}

.card-body {
  margin-bottom: 12px;
}

.info-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  font-size: 14px;
  color: #595959;
}

.info-row .el-icon {
  color: #8c8c8c;
  font-size: 16px;
}

.device-model {
  font-weight: 500;
  color: #262626;
}

.order-desc {
  font-size: 14px;
  color: #262626;
  margin: 10px 0 0;
  padding: 10px;
  background: #f5f7fa;
  border-radius: 8px;
  line-height: 1.5;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}

.order-time {
  font-size: 13px;
  color: #8c8c8c;
}

/* 底部导航 */
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  display: flex;
  justify-content: space-around;
  padding: 12px 0;
  box-shadow: 0 -2px 10px rgba(0,0,0,0.05);
  z-index: 100;
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 4px 20px;
  cursor: pointer;
  color: #8c8c8c;
  transition: all 0.3s;
}

.nav-item .el-icon {
  font-size: 28px;
}

.nav-item span {
  font-size: 16px;
  font-weight: 500;
}

.nav-item.active {
  color: #1890ff;
}

/* 对话框样式 */
:deep(.mobile-dialog) {
  border-radius: 12px 12px 0 0;
  margin: 0;
  margin-top: auto;
}

:deep(.mobile-dialog .el-dialog__body) {
  padding: 15px;
}

:deep(.mobile-dialog.chat-dialog) {
  border-radius: 0;
  margin: 0;
}

/* 消息对话框 */
.message-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 400px;
  overflow-y: auto;
}

.message-item-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 15px;
  background: #f5f7fa;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s;
}

.message-item-card:active {
  background: #e8e8e8;
}

.message-icon {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  flex-shrink: 0;
}

.message-icon.sign {
  background: #fff7e6;
  color: #fa8c16;
}

.message-icon.urgent {
  background: #fff1f0;
  color: #f5222d;
}

.message-content {
  flex: 1;
  min-width: 0;
}

.message-title {
  font-size: 15px;
  font-weight: 500;
  color: #262626;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.message-desc {
  font-size: 13px;
  color: #8c8c8c;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.message-arrow {
  color: #bfbfbf;
  font-size: 18px;
}

.empty-messages {
  text-align: center;
  padding: 60px 20px;
  color: #bfbfbf;
}

.empty-messages .el-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.empty-messages p {
  margin: 0;
  font-size: 14px;
}

/* 扫码全屏页面 */
.scan-fullscreen-page {
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

.scan-header {
  background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
  padding: 15px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: white;
  flex-shrink: 0;
}

.scan-header .el-button {
  color: white;
  font-size: 14px;
}

.scan-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

/* 扫码对话框 */
.scan-container {
  text-align: center;
}

.scan-area {
  padding: 20px;
  position: relative;
}

.scan-video {
  width: 250px;
  height: 250px;
  object-fit: cover;
  border-radius: 8px;
  margin-bottom: 15px;
}

.scan-start {
  padding: 30px 20px;
}

.scan-icon {
  width: 80px;
  height: 80px;
  background: #e6f7ff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 15px;
  font-size: 40px;
  color: #1890ff;
}

.scan-icon.unavailable {
  background: #f5f5f5;
  color: #bfbfbf;
}

.scan-unavailable {
  padding: 30px 20px;
  text-align: center;
}

.scan-reason {
  font-size: 13px;
  color: #8c8c8c;
  margin: 8px 0 0;
}

.scan-divider {
  display: flex;
  align-items: center;
  margin: 20px 0;
  color: #8c8c8c;
}

.scan-divider::before,
.scan-divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: #e8e8e8;
}

.scan-divider span {
  padding: 0 15px;
  font-size: 14px;
}

.scan-input {
  padding: 0 20px 20px;
}

.input-label {
  font-size: 14px;
  color: #262626;
  margin: 0 0 10px;
  text-align: left;
}

.scan-frame {
  width: 250px;
  height: 250px;
  margin: 0 auto 20px;
  position: relative;
  border: 2px solid #1890ff;
  border-radius: 8px;
}

.corner {
  position: absolute;
  width: 20px;
  height: 20px;
  border-color: #1890ff;
  border-style: solid;
}

.corner.top-left {
  top: -2px;
  left: -2px;
  border-width: 4px 0 0 4px;
}

.corner.top-right {
  top: -2px;
  right: -2px;
  border-width: 4px 4px 0 0;
}

.corner.bottom-left {
  bottom: -2px;
  left: -2px;
  border-width: 0 0 4px 4px;
}

.corner.bottom-right {
  bottom: -2px;
  right: -2px;
  border-width: 0 4px 4px 0;
}

.scan-line {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent, #1890ff, transparent);
  animation: scan 2s linear infinite;
}

@keyframes scan {
  0% { top: 0; }
  50% { top: 100%; }
  100% { top: 0; }
}

.scan-tip {
  color: #8c8c8c;
  font-size: 14px;
}

.scan-input {
  margin-top: 20px;
}

/* 聊天对话框 */
.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 10px;
}

.chat-title {
  font-size: 18px;
  font-weight: 500;
  color: #262626;
}

.chat-container {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 120px);
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 15px;
  background: #f5f5f5;
}

.message-item {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
}

.message-item.self {
  flex-direction: row-reverse;
}

.message-content {
  max-width: 70%;
}

.message-bubble {
  background: white;
  padding: 12px;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.message-item.self .message-bubble {
  background: #1890ff;
  color: white;
}

.message-bubble p {
  margin: 0;
  font-size: 15px;
  line-height: 1.5;
}

.message-time {
  display: block;
  font-size: 12px;
  color: #8c8c8c;
  margin-top: 5px;
}

.message-item.self .message-time {
  text-align: right;
}

.chat-input-toolbar {
  padding: 8px 15px 0;
  background: white;
  border-top: 1px solid #f0f0f0;
}

.toolbar-left {
  display: flex;
  gap: 10px;
}

/* 媒体选项 */
.media-options {
  display: flex;
  gap: 20px;
  padding: 15px;
  background: white;
  border-top: 1px solid #f0f0f0;
}

.media-option-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  padding: 10px;
  border-radius: 8px;
  transition: all 0.3s;
}

.media-option-item:active {
  background: #f5f5f5;
}

.media-option-item span {
  font-size: 12px;
  color: #595959;
}

.option-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.option-icon.image {
  background: #e6f7ff;
  color: #1890ff;
}

.option-icon.camera {
  background: #f6ffed;
  color: #52c41a;
}

.option-icon.video {
  background: #fff2e8;
  color: #fa8c16;
}

/* 媒体预览 */
.media-preview {
  padding: 10px 15px;
  background: white;
  border-top: 1px solid #f0f0f0;
  position: relative;
  display: inline-block;
}

.preview-img {
  max-width: 120px;
  max-height: 120px;
  border-radius: 8px;
  object-fit: cover;
}

.preview-video {
  max-width: 200px;
  max-height: 120px;
  border-radius: 8px;
}

.remove-media {
  position: absolute;
  top: 5px;
  right: 5px;
  background: rgba(0,0,0,0.5);
  color: white;
  border-radius: 50%;
  padding: 4px;
  font-size: 14px;
  cursor: pointer;
}

.chat-input-area {
  padding: 10px 15px 15px;
  background: white;
  display: flex;
  gap: 10px;
}

.chat-input-area .el-textarea {
  flex: 1;
}

/* 消息中的图片和视频 */
.message-image {
  max-width: 200px;
  max-height: 200px;
  border-radius: 8px;
  cursor: pointer;
  object-fit: cover;
}

.message-video {
  max-width: 200px;
  max-height: 200px;
  border-radius: 8px;
}

/* 配件列表 */
.parts-search {
  margin-bottom: 15px;
}

.parts-list {
  max-height: 300px;
  overflow-y: auto;
}

.part-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.part-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.part-name {
  font-size: 15px;
  color: #262626;
  font-weight: 500;
}

.part-model {
  font-size: 13px;
  color: #8c8c8c;
}

.part-price {
  font-size: 16px;
  color: #f5222d;
  font-weight: 500;
}

.parts-summary {
  margin-top: 15px;
  padding: 12px;
  background: #fff7e6;
  border-radius: 8px;
  text-align: center;
  font-size: 15px;
  color: #262626;
}

/* 签字对话框 */
.sign-container {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.sign-container.fullscreen {
  height: calc(100vh - 200px);
  overflow-y: auto;
  padding-bottom: 60px;
}

.sign-preview {
  max-height: 200px;
  overflow-y: auto;
}

.sign-preview.expanded {
  max-height: none;
  flex: 1;
}

.sign-preview h4 {
  margin: 0 0 10px;
  font-size: 16px;
}

.sign-preview .report-title {
  font-size: 18px;
  font-weight: 600;
  color: #262626;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #e8e8e8;
}

.sign-preview .preview-content {
  font-size: 14px;
  line-height: 1.6;
}

.sign-preview .preview-content.expanded-content {
  font-size: 16px;
  line-height: 1.8;
}

.sign-preview .preview-content :deep(p) {
  margin: 12px 0;
}

.sign-preview .preview-content :deep(strong) {
  color: #262626;
  font-weight: 600;
}

.sign-area {
  border: 1px solid #d9d9d9;
  border-radius: 8px;
  padding: 15px;
  flex-shrink: 0;
}

.sign-tip {
  text-align: center;
  color: #8c8c8c;
  font-size: 14px;
  margin: 0 0 10px;
}

.sign-canvas {
  width: 100%;
  height: 150px;
  background: #fafafa;
  border: 1px dashed #d9d9d9;
  border-radius: 4px;
  touch-action: none;
}

.sign-actions {
  display: flex;
  justify-content: space-between;
  margin-top: 15px;
}

/* 全屏对话框样式 */
:deep(.fullscreen-dialog) {
  .el-dialog__body {
    padding: 15px;
    height: calc(100vh - 140px);
    overflow: hidden;
  }
  
  .el-dialog__footer {
    padding: 15px;
    border-top: 1px solid #e8e8e8;
    background: white;
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 10;
  }
}

/* 手机端小屏幕适配 */
@media (max-width: 375px) {
  .header-section {
    padding: 15px;
  }
  
  .user-details h3 {
    font-size: 16px;
  }
  
  .user-details p {
    font-size: 12px;
  }
  
  .quick-actions {
    padding: 10px;
  }
  
  .action-grid {
    gap: 8px;
  }
  
  .action-item {
    padding: 15px 10px;
  }
  
  .action-icon {
    width: 48px;
    height: 48px;
    font-size: 24px;
  }
  
  .action-label {
    font-size: 14px;
  }
  
  .action-desc {
    font-size: 11px;
  }
  
  .pending-section,
  .workorder-section {
    margin: 0 10px 10px;
    padding: 12px;
  }
  
  .tab-item {
    padding: 6px 12px;
    font-size: 13px;
  }
}

/* 响应式适配 - 平板及以上 */
@media (min-width: 768px) {
  .customer-mobile-workspace {
    max-width: 414px;
    margin: 0 auto;
    border-left: 1px solid #e8e8e8;
    border-right: 1px solid #e8e8e8;
  }

  .bottom-nav {
    max-width: 414px;
    left: 50%;
    transform: translateX(-50%);
  }
}

/* 报修对话框 */
.repair-dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 10px;
}

.repair-title {
  font-size: 18px;
  font-weight: 500;
  color: #262626;
}

.repair-form-container {
  padding: 0;
}

.repair-section {
  background: white;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
}

.repair-section-title {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 12px;
  padding-left: 8px;
  border-left: 3px solid #fa8c16;
}

.fault-tags {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
}

.tag-label {
  font-size: 13px;
  color: #909399;
}

.fault-tag {
  cursor: pointer;
  transition: all 0.2s;
}

.fault-tag:hover {
  color: #fa8c16;
  border-color: #fa8c16;
}

.repair-footer {
  display: flex;
  gap: 15px;
  width: 100%;
}

.repair-footer .el-button {
  flex: 1;
}

.pdf-overlay {
  position: fixed;
  top: 0; left: 0;
  width: 100%; height: 100%;
  background: #fff;
  z-index: 10000;
  display: flex;
  flex-direction: column;
}
.pdf-overlay-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  border-bottom: 1px solid #eee;
  flex-shrink: 0;
}
.pdf-overlay-header .header-title {
  font-size: 16px;
  font-weight: 500;
}
.pdf-overlay-iframe {
  flex: 1;
  width: 100%;
  border: none;
}
.pdf-preview-images {
  flex: 1;
  overflow-y: auto;
  background: #f5f5f5;
  padding: 10px;
}
.preview-page {
  display: block;
  width: 100%;
  max-width: 800px;
  margin: 0 auto 10px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  border-radius: 4px;
}
</style>
