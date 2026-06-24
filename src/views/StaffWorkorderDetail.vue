<template>
  <div class="staff-workorder-detail">
    <!-- 顶部导航 -->
    <div class="detail-header">
      <el-button link @click="goBack">
        <el-icon><ArrowLeft /></el-icon>
        <span>返回</span>
      </el-button>
      <span class="header-title">工单详情</span>
      <span class="placeholder"></span>
    </div>

    <template v-if="workorder">
      <!-- 状态 + 操作速览 -->
      <div class="status-bar">
        <el-tag :type="getStatusType(workorder.status)" size="large">
          {{ getStatusText(workorder.status) }}
        </el-tag>
        <span class="status-sub">创建人：{{ workorder.createdBy?.name || workorder.customerName }}</span>
      </div>

      <!-- 基本信息 -->
      <div class="info-card">
        <div class="card-title">基本信息</div>
        <div class="info-item"><span class="label">工单号</span><span class="value">{{ workorder.workorderId }}</span></div>
        <div class="info-item"><span class="label">类型</span><span class="value">{{ getTypeText(workorder.type) }}</span></div>
        <div class="info-item"><span class="label">创建时间</span><span class="value">{{ formatDateTime(workorder.createTime) }}</span></div>
        <div class="info-item" v-if="workorder.engineerName"><span class="label">工程师</span><span class="value">{{ workorder.engineerName }}</span></div>
      </div>

      <!-- 客户信息（客户角色不显示自己的信息） -->
      <div class="info-card" v-if="!isCustomer">
        <div class="card-title">客户信息</div>
        <div class="info-item"><span class="label">客户</span><span class="value">{{ workorder.customerName }}</span></div>
        <div class="info-item"><span class="label">负责人</span><span class="value">{{ workorder.customerContact || '-' }}</span></div>
        <div class="info-item">
          <span class="label">电话</span>
          <span class="value"><a :href="'tel:'+workorder.customerPhone" class="phone-link">{{ workorder.customerPhone }} <el-icon><Phone /></el-icon></a></span>
        </div>
        <div class="info-item"><span class="label">地址</span><span class="value">{{ workorder.address }}</span></div>
      </div>

      <!-- 设备信息 -->
      <div class="info-card">
        <div class="card-title">设备信息</div>
        <div class="info-item"><span class="label">型号</span><span class="value">{{ workorder.deviceModel || '-' }}</span></div>
        <div class="info-item"><span class="label">序列号</span><span class="value">{{ workorder.serialNumber || '-' }}</span></div>
        <div class="info-item"><span class="label">保修状态</span><span class="value">{{ workorder.warrantyStatus === 'in' ? '保内' : '保外' }}</span></div>
        <div class="info-item" v-if="workorder.installDate"><span class="label">安装日期</span><span class="value">{{ workorder.installDate }}</span></div>
      </div>

      <!-- 分配信息（客户只看工程师姓名和电话） -->
      <div class="info-card" v-if="workorder.engineerName && workorder.status !== 'pending_assign'">
        <div class="card-title">服务工程师</div>
        <div class="info-item"><span class="label">工程师</span><span class="value">{{ workorder.engineerName }}</span></div>
        <div class="info-item" v-if="workorder.engineerPhone"><span class="label">电话</span><span class="value"><a :href="'tel:' + workorder.engineerPhone" class="phone-link">{{ workorder.engineerPhone }} <el-icon><Phone /></el-icon></a></span></div>
        <template v-if="!isCustomer">
          <div class="info-item" v-if="workorder.assignTime"><span class="label">分配时间</span><span class="value">{{ formatDateTime(workorder.assignTime) }}</span></div>
          <div class="info-item" v-if="workorder.assignedEngineers && workorder.assignedEngineers.length > 1">
            <span class="label">协同人员</span>
            <span class="value">
              <el-tag v-for="eng in workorder.assignedEngineers.filter(e => e.id !== workorder.engineerId)" :key="eng.id" size="small" style="margin-right:4px;margin-bottom:2px;">{{ eng.name }}</el-tag>
            </span>
          </div>
          <div class="info-item" v-if="workorder.workContent"><span class="label">工作内容</span><span class="value" style="white-space:pre-wrap">{{ workorder.workContent }}</span></div>
          <div class="info-item" v-if="workorder.workStartTime"><span class="label">工作开始时间</span><span class="value">{{ formatDateTime(workorder.workStartTime) }}</span></div>
          <div class="info-item" v-if="workorder.workEndTime"><span class="label">预定完成时间</span><span class="value">{{ formatDateTime(workorder.workEndTime) }}</span></div>
          <div class="info-item" v-if="workorder.vehicle"><span class="label">用车安排</span><span class="value">{{ vehicleText(workorder.vehicle) }}</span></div>
          <div class="info-item" v-if="workorder.acceptTime"><span class="label">接单时间</span><span class="value">{{ formatDateTime(workorder.acceptTime) }}</span></div>
          <div class="info-item" v-if="workorder.completeTime"><span class="label">完成时间</span><span class="value">{{ formatDateTime(workorder.completeTime) }}</span></div>
        </template>
      </div>

      <!-- 签字确认信息 -->
      <div class="info-card" v-if="workorder.status === 'pending_sign' || workorder.signTime">
        <div class="card-title">签字确认</div>
        <div class="info-item" v-if="workorder.signTime"><span class="label">签字时间</span><span class="value">{{ formatDateTime(workorder.signTime) }}</span></div>
        <div v-if="workorder.customerSign" class="sign-preview">
          <span class="label">客户签字</span>
          <img :src="workorder.customerSign" class="sign-image" alt="客户签字" />
        </div>
        <div v-if="workorder.engineerSign" class="sign-preview">
          <span class="label">工程师签字</span>
          <img :src="workorder.engineerSign" class="sign-image" alt="工程师签字" />
        </div>
        <div v-if="!workorder.customerSign && !workorder.engineerSign && workorder.status === 'pending_sign'" class="info-item">
          <span class="label">签字状态</span><span class="value" style="color:#e6a23c">等待签字</span>
        </div>
      </div>

      <!-- 问题描述 -->
      <div class="info-card">
        <div class="card-title">故障描述</div>
        <div class="description-content">{{ workorder.faultDescription }}</div>
      </div>

      <!-- 附件（客户上传的照片/视频） -->
      <div class="info-card" v-if="attachmentData.length > 0">
        <div class="card-title">附件</div>
        <div class="attachment-list">
          <template v-for="(att, idx) in attachmentData" :key="idx">
            <div v-if="att.type === 'image' || att.url?.startsWith('data:image')" class="attachment-item" @click="previewAttachmentImage(att.url)">
              <img :src="att.url" class="attachment-thumb" />
            </div>
            <div v-else-if="att.type === 'video' || att.url?.startsWith('data:video')" class="attachment-item">
              <video :src="att.url" class="attachment-video" controls playsinline></video>
            </div>
          </template>
        </div>
      </div>

      <!-- ===== 进行中：服务报告表单 ===== -->
      <div class="info-card report-form-card" v-if="workorder.status === 'processing' && isEngineer">
        <div class="card-title">服务报告（可暂存）</div>
        <el-form label-position="top" size="small">
          <!-- 作业内容 -->
          <el-form-item label="作业内容">
            <el-input v-model="reportForm.workContent" type="textarea" :rows="3" placeholder="描述本次作业内容" />
            <div class="quick-tags">
              <span class="quick-label">快速填入：</span>
              <el-tag
                v-for="tag in workContentTags"
                :key="tag"
                class="quick-tag"
                effect="plain"
                size="small"
                @click="appendTag('workContent', tag)"
              >{{ tag }}</el-tag>
            </div>
          </el-form-item>

          <!-- 故障处理过程 -->
          <el-form-item label="故障处理过程">
            <el-input v-model="reportForm.repairProcess" type="textarea" :rows="3" placeholder="描述故障排查与处理过程" />
            <div class="quick-tags">
              <span class="quick-label">快速填入：</span>
              <el-tag
                v-for="tag in repairProcessTags"
                :key="tag"
                class="quick-tag"
                effect="plain"
                size="small"
                @click="appendTag('repairProcess', tag)"
              >{{ tag }}</el-tag>
            </div>
          </el-form-item>

          <!-- 更换配件 -->
          <el-form-item label="更换配件">
            <div class="parts-select-area">
              <div class="parts-chips">
                <el-tag
                  v-for="part in reportForm.replacedParts"
                  :key="part"
                  closable
                  type="primary"
                  size="small"
                  class="part-chip"
                  @close="removePart(part)"
                >{{ part }}</el-tag>
                <span v-if="reportForm.replacedParts.length === 0" class="no-parts-hint">未选择配件</span>
              </div>
              <el-button size="small" type="primary" plain @click="showPartsPanel = true">
                <el-icon><Plus /></el-icon>选择配件
              </el-button>
            </div>
            <el-input
              v-model="reportForm.customPart"
              placeholder="手动输入其他配件，回车添加"
              @keyup.enter="addCustomPart"
              style="margin-top: 6px"
            >
              <template #append>
                <el-button @click="addCustomPart">添加</el-button>
              </template>
            </el-input>
          </el-form-item>

          <!-- 处理结果 -->
          <el-form-item label="处理结果">
            <el-input v-model="reportForm.testResult" type="textarea" :rows="2" placeholder="设备运行状态、测试结果" />
            <div class="quick-tags">
              <span class="quick-label">快速填入：</span>
              <el-tag
                v-for="tag in testResultTags"
                :key="tag"
                class="quick-tag"
                effect="plain"
                size="small"
                @click="appendTag('testResult', tag)"
              >{{ tag }}</el-tag>
            </div>
          </el-form-item>
        </el-form>
        <div style="display:flex;gap:10px;margin-top:8px">
          <el-button size="small" @click="saveReportDraft">暂存</el-button>
        </div>
      </div>

      <!-- 配件选择面板 -->
      <el-dialog v-model="showPartsPanel" title="选择更换配件" width="90%" class="parts-dialog">
        <div class="parts-grid">
          <div
            v-for="part in availableParts"
            :key="part.name"
            class="part-option"
            :class="{ selected: reportForm.replacedParts.includes(part.name) }"
            @click="togglePart(part.name)"
          >
            <el-icon v-if="reportForm.replacedParts.includes(part.name)" class="part-check"><Check /></el-icon>
            <div class="part-name">{{ part.name }}</div>
            <div class="part-spec">{{ part.spec }}</div>
          </div>
        </div>
        <template #footer>
          <el-button @click="showPartsPanel = false">确定</el-button>
        </template>
      </el-dialog>

      <!-- 已有服务报告（待签字及之后所有状态都展示） -->
      <div class="info-card" v-if="workorder.serviceReport && ['pending_sign','techlead_confirm','assistant_confirm','completed'].includes(workorder.status)">
        <div class="card-title">服务报告</div>
        <div class="info-item"><span class="label">作业内容</span><span class="value">{{ workorder.serviceReport.workContent || workorder.serviceReport.repairContent || '-' }}</span></div>
        <div class="info-item"><span class="label">处理过程</span><span class="value">{{ workorder.serviceReport.repairProcess || '-' }}</span></div>
        <div class="info-item"><span class="label">更换配件</span><span class="value">{{ (workorder.serviceReport.replacedParts || []).join('、') || '无' }}</span></div>
        <div class="info-item"><span class="label">处理结果</span><span class="value">{{ workorder.serviceReport.testResult || '-' }}</span></div>
      </div>

      <!-- 已生成的PDF报告 -->
      <div class="info-card" v-if="workorder.reportPdf">
        <div class="card-title">服务报告书PDF</div>
        <el-button type="primary" size="small" @click="viewPdf">查看PDF报告</el-button>
        <el-button type="success" size="small" @click="downloadPdf">下载PDF</el-button>
      </div>

      <!-- 处理记录 -->
      <div class="info-card" v-if="workorder.processRecords && workorder.processRecords.length > 0">
        <div class="card-title">处理记录</div>
        <div class="record-list">
          <div v-for="(r, i) in workorder.processRecords" :key="i" class="record-item">
            <div class="record-time">{{ formatDateTime(r.time) }}</div>
            <div class="record-content">{{ r.title }}：{{ r.content }}</div>
            <div class="record-operator">{{ r.operator }}</div>
          </div>
        </div>
      </div>

      <!-- ===== 底部操作栏 ===== -->
      <div class="action-bar">
        <!-- 客户角色操作 -->
        <template v-if="isCustomer">
          <el-button v-if="workorder.status === 'pending_sign'" type="primary" size="large" round block @click="openSignDialog('customer')">签字确认</el-button>
          <el-button v-if="workorder.status === 'completed' && !workorder.isEvaluated" type="success" size="large" round block @click="openEvaluateDialog">评价服务</el-button>
        </template>
        <!-- 内部角色操作 -->
        <template v-else>
          <!-- 待分配：课长分配 -->
          <template v-if="workorder.status === 'pending_assign' && isTechLead">
            <el-button type="primary" size="large" round block @click="showAssignDialog">分配工程师</el-button>
          </template>
          <!-- 待接单：只有工程师能接单弃单 -->
          <template v-if="workorder.status === 'pending_accept' && isEngineer">
            <el-button type="primary" size="large" round block @click="doAccept">接单</el-button>
            <el-button type="warning" size="large" round block @click="doReject" style="margin-top:8px">弃单</el-button>
          </template>
          <!-- 进行中：工程师可打卡+提交签字 -->
          <template v-else-if="workorder.status === 'processing' && isEngineer">
            <el-button type="primary" size="large" round block :disabled="hasCheckedIn" @click="goToCheckInFromDetail">{{ hasCheckedIn ? '已打卡' : '打卡签到' }}</el-button>
            <el-button type="success" size="large" round block @click="submitForSignAction" style="margin-top:8px">提交并请客户签字</el-button>
          </template>
          <!-- 待签字：只有工程师能操作签字 -->
          <template v-else-if="workorder.status === 'pending_sign' && isEngineer">
            <el-button type="warning" size="large" round block @click="openSignDialog('engineer')">客户签字 / 工程师代签</el-button>
          </template>
          <!-- 课长确认 -->
          <template v-else-if="workorder.status === 'techlead_confirm' && isTechLead">
            <el-button type="primary" size="large" round block @click="doTechLeadConfirm">课长确认</el-button>
          </template>
          <!-- 业务确认 -->
          <template v-else-if="workorder.status === 'assistant_confirm' && isAssistant">
            <el-button type="primary" size="large" round block @click="doAssistantConfirm">业务确认</el-button>
          </template>
          <!-- 完成 -->
          <template v-else-if="workorder.status === 'completed'">
            <el-button type="info" size="large" round block disabled>工单已完成</el-button>
          </template>
        </template>
      </div>
    </template>

    <!-- ===== 签字全屏页面 ===== -->
    <div v-if="signDialog.visible" class="sign-fullscreen-page">
      <div class="sign-header">
        <el-button link @click="signDialog.visible = false"><el-icon><ArrowLeft /></el-icon>返回</el-button>
        <span class="header-title">签字确认</span>
        <span class="placeholder"></span>
      </div>
      <div class="sign-content">
        <div class="sign-info-card">
          <h4>服务报告书签字</h4>
          <div class="info-row"><span class="label">工单号：</span>{{ workorder?.workorderId }}</div>
          <div class="info-row"><span class="label">设备：</span>{{ workorder?.deviceModel }}</div>
          <div class="info-row"><span class="label">客户：</span>{{ workorder?.customerName }}</div>
          <div class="info-row"><span class="label">角色：</span>{{ signDialog.signRole === 'customer' ? '客户签字' : '工程师代签' }}</div>
        </div>
        <div class="sign-area">
          <p class="sign-tip">请在下方空白区域手写签名</p>
          <canvas ref="signCanvas" class="sign-canvas"
            @touchstart="handleTouchStart" @touchmove="handleTouchMove" @touchend="handleTouchEnd"
            @mousedown="handleMouseDown" @mousemove="handleMouseMove" @mouseup="handleMouseUp"
          ></canvas>
        </div>
      </div>
      <div class="sign-footer">
        <el-button size="large" @click="clearSignature"><el-icon><Delete /></el-icon>清除重写</el-button>
        <el-button type="primary" size="large" @click="confirmSignature" :loading="signLoading">
          <el-icon><Check /></el-icon>确认签字（生成PDF）
        </el-button>
      </div>
    </div>

    <!-- 评价全屏页面 -->
    <div v-if="evaluateDialog.visible" class="evaluate-fullscreen-page">
      <div class="evaluate-header">
        <el-button link @click="evaluateDialog.visible = false"><el-icon><ArrowLeft /></el-icon>返回</el-button>
        <span class="header-title">服务评价</span>
        <span class="placeholder"></span>
      </div>
      <div class="evaluate-content">
        <div class="evaluate-card">
          <div class="rate-item">
            <span class="label">服务态度</span>
            <el-rate v-model="evaluateDialog.serviceRate" size="large" />
          </div>
          <div class="rate-item">
            <span class="label">响应速度</span>
            <el-rate v-model="evaluateDialog.responseRate" size="large" />
          </div>
          <div class="rate-item">
            <span class="label">技术水平</span>
            <el-rate v-model="evaluateDialog.techniqueRate" size="large" />
          </div>
        </div>
        <div class="comment-card">
          <h4>评价建议（选填）</h4>
          <el-input v-model="evaluateDialog.comment" type="textarea" :rows="5" placeholder="请输入您的评价建议，帮助我们改进服务..." />
        </div>
      </div>
      <div class="evaluate-footer">
        <el-button type="primary" size="large" @click="submitEvaluate" style="width:100%">
          <el-icon><Check /></el-icon>提交评价
        </el-button>
      </div>
    </div>

    <!-- 分配工程师对话框 -->
    <el-dialog
      v-model="assignDialogVisible"
      title="分配工程师"
      width="95%"
      :show-close="false"
      class="mobile-dialog assign-mobile-dialog"
      :fullscreen="true"
    >
      <template #header>
        <div class="assign-dialog-header">
          <span class="assign-dialog-title">分配工程师</span>
          <el-button link @click="assignDialogVisible = false">
            <el-icon><Close /></el-icon>
          </el-button>
        </div>
      </template>
      <div v-if="workorder" class="assign-dialog-content">
        <!-- 工单基础信息 -->
        <div class="assign-info-section">
          <div class="assign-section-title">工单信息</div>
          <div class="assign-info-row"><span class="label">工单号</span><span class="value">{{ workorder.workorderId }}</span></div>
          <div class="assign-info-row"><span class="label">工单类型</span><span class="value">{{ getCategoryText(workorder.category) }}{{ workorder.subType ? '·' + getSubTypeText(workorder.subType) : '' }}</span></div>
          <div class="assign-info-row"><span class="label">客户公司</span><span class="value">{{ workorder.customerName }}</span></div>
          <div class="assign-info-row"><span class="label">联系电话</span><span class="value">{{ workorder.customerPhone }}</span></div>
          <div class="assign-info-row"><span class="label">地址</span><span class="value">{{ workorder.address }}</span></div>
          <div class="assign-info-pair">
            <div class="assign-info-item"><span class="label">设备型号</span><span class="value">{{ workorder.deviceModel || '-' }}</span></div>
            <div class="assign-info-item"><span class="label">序列号</span><span class="value">{{ workorder.serialNumber || '-' }}</span></div>
          </div>
          <div class="assign-info-row"><span class="label">保修状态</span><span class="value"><el-tag :type="getWarrantyTagType(workorder.warrantyStatus)" size="small">{{ getWarrantyText(workorder.warrantyStatus) }}</el-tag></span></div>
          <div class="assign-info-desc"><span class="label">故障描述</span><div class="value">{{ workorder.faultDescription }}</div></div>
        </div>

        <el-divider />

        <el-form label-position="top">
          <el-form-item label="选择工程师" required>
            <el-select
              v-model="assignFormData.selectedEngineerIds"
              multiple
              placeholder="请选择工程师（可多选）"
              style="width: 100%"
              filterable
            >
              <el-option
                v-for="eng in engineerList"
                :key="eng.id"
                :label="`${eng.name}（${eng.department}·${eng.specialty}）`"
                :value="eng.id"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="工作内容">
            <el-input v-model="assignFormData.workContent" type="textarea" :rows="3" placeholder="请填写工作内容" />
            <div class="work-content-tags">
              <span class="tags-label">快捷填入：</span>
              <el-tag
                v-for="tag in workContentTags"
                :key="tag"
                class="work-tag"
                :effect="isTagSelected(tag) ? 'dark' : 'plain'"
                :type="isTagSelected(tag) ? 'primary' : ''"
                @click="toggleWorkTag(tag)"
              >
                {{ tag }}
              </el-tag>
            </div>
          </el-form-item>
          <el-form-item label="工作开始时间">
            <el-date-picker
              v-model="assignFormData.workStartTime"
              type="datetime"
              placeholder="选择开始时间"
              format="YYYY-MM-DD HH:mm"
              value-format="YYYY-MM-DDTHH:mm:ss"
              style="width: 100%"
            />
          </el-form-item>
          <el-form-item label="预定完成时间">
            <el-date-picker
              v-model="assignFormData.workEndTime"
              type="datetime"
              placeholder="选择完成时间"
              format="YYYY-MM-DD HH:mm"
              value-format="YYYY-MM-DDTHH:mm:ss"
              style="width: 100%"
            />
          </el-form-item>
          <el-form-item label="使用车辆">
            <el-radio-group v-model="assignFormData.vehicle">
              <el-radio label="self">自备</el-radio>
              <el-radio label="company">公司车辆</el-radio>
              <el-radio label="public">公共交通</el-radio>
            </el-radio-group>
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <div class="assign-footer">
          <el-button size="large" @click="assignDialogVisible = false">取消</el-button>
          <el-button type="primary" size="large" @click="confirmAssign" :disabled="assignFormData.selectedEngineerIds.length === 0">确认分配</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 附件图片大图预览 -->
    <div v-if="attachmentPreviewVisible" class="attachment-preview-overlay" @click="attachmentPreviewVisible = false">
      <img :src="attachmentPreviewUrl" class="attachment-preview-full" @click.stop />
      <div class="preview-close-btn">✕</div>
    </div>

    <!-- PDF全屏预览覆盖层（图片展示兼容微信，iframe兜底） -->
    <div v-if="pdfOverlayVisible" class="pdf-overlay">
      <div class="pdf-overlay-header">
        <el-button link @click="closePdfOverlay">
          <el-icon><ArrowLeft /></el-icon>
          <span>返回</span>
        </el-button>
        <span class="header-title">PDF预览</span>
        <el-button link size="small" @click="downloadPdf">下载</el-button>
      </div>
      <div v-if="pdfOverlayImages.length > 0" class="pdf-preview-images">
        <img v-for="(img, i) in pdfOverlayImages" :key="i" :src="img" class="preview-page" />
      </div>
      <iframe v-else :src="pdfOverlayUrl" class="pdf-overlay-iframe" frameborder="0"></iframe>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowLeft, Phone, Delete, Check, Close, Plus } from '@element-plus/icons-vue'
import { getWorkorderById, acceptWorkorder, rejectWorkorder, submitForSign, signWorkorder, techLeadConfirm, assistantConfirm, saveServiceReportDraft, saveReportPdf, assignWorkorder, engineerList, getPendingSurveysByCustomer, submitSatisfactionSurvey } from '../stores/workorderFlowStore.js'
import { getAttachments } from '../stores/attachmentStore.js'
import { generateReportPdf } from '../utils/reportPdf.js'

const router = useRouter()
const route = useRoute()

const workorder = ref(null)
const staffInfo = ref({ name: '工程师' })
const signLoading = ref(false)
const attachmentData = ref([]) // 从 IndexedDB 加载的附件完整数据

// 服务报告表单
const reportForm = reactive({
  workContent: '',
  repairProcess: '',
  replacedParts: [],
  customPart: '',
  testResult: '',
})

// 配件选择面板
const showPartsPanel = ref(false)
const availableParts = [
  { name: '主轴轴承', spec: '型号: Z-7014 / 精度: P4' },
  { name: '伺服电机', spec: '型号: SM-1500 / 功率: 1.5kW' },
  { name: '液压泵', spec: '型号: HP-300 / 流量: 30L/min' },
  { name: '控制板', spec: '型号: CB-2024 / 版本: V3.1' },
  { name: '密封圈套件', spec: '型号: SK-50 / 材质: NBR' },
]

// 常用词标签
const workContentTags = [
  '故障诊断', '现场维修', '定期保养', '设备调试', '精度校准',
  '零件更换', '软件升级', '参数调整', '安装调试', '试加工验证',
  '液压系统检修', '电气系统检查', '冷却系统维护', '润滑系统保养', '安全装置检查'
]
const repairProcessTags = [
  '现场确认故障现象', '查阅设备报警记录', '测量电气参数', '检查机械部件',
  '更换损坏部件', '调整系统参数', '清洁维护', '加载测试',
  '空载试运行', '加工件检测', '设备运行正常', '需后续跟进'
]
const testResultTags = [
  '设备运行正常', '加工精度合格', '空载测试通过', '负载测试通过',
  '报警已消除', '温度正常', '振动值正常', '噪音达标',
  '需观察运行', '需更换部件', '待配件到货', '建议下次保养'
]

const toggleWorkTag = (tag) => {
  const current = assignFormData.workContent || ''
  if (current.includes(tag)) {
    assignFormData.workContent = current.replace(new RegExp(tag + '(、)?'), '').replace(/、$/, '').replace(/^、/, '')
  } else {
    assignFormData.workContent = current ? current + '、' + tag : tag
  }
}

const isTagSelected = (tag) => {
  return (assignFormData.workContent || '').includes(tag)
}

// 常用词追加到文本框
const appendTag = (field, tag) => {
  const current = reportForm[field]
  if (current && !current.endsWith('\n') && !current.endsWith('；')) {
    reportForm[field] = current + '；' + tag
  } else if (current) {
    reportForm[field] = current + tag
  } else {
    reportForm[field] = tag
  }
}

// 配件操作
const togglePart = (name) => {
  const idx = reportForm.replacedParts.indexOf(name)
  if (idx >= 0) {
    reportForm.replacedParts.splice(idx, 1)
  } else {
    reportForm.replacedParts.push(name)
  }
}
const removePart = (name) => {
  const idx = reportForm.replacedParts.indexOf(name)
  if (idx >= 0) reportForm.replacedParts.splice(idx, 1)
}
const addCustomPart = () => {
  const part = reportForm.customPart.trim()
  if (part && !reportForm.replacedParts.includes(part)) {
    reportForm.replacedParts.push(part)
  }
  reportForm.customPart = ''
}

const signDialog = reactive({
  visible: false,
  signRole: 'customer',
})

// 评价对话框
const evaluateDialog = reactive({
  visible: false,
  serviceRate: 5,
  responseRate: 5,
  techniqueRate: 5,
  comment: ''
})

const signCanvas = ref(null)
let isDrawing = false
let ctx = null

// 当前用户角色
const currentRole = computed(() => staffInfo.value?.role || '')
const isEngineer = computed(() => currentRole.value === 'engineer' || currentRole.value === 'admin')
const isTechLead = computed(() => currentRole.value === 'techLead' || currentRole.value === 'admin' || currentRole.value === 'director')
const isAssistant = computed(() => currentRole.value === 'assistant' || currentRole.value === 'admin')
const isCustomer = computed(() => currentRole.value === 'customer')

// 加载工单
const loadWorkorder = async () => {
  const id = route.query.id
  staffInfo.value = JSON.parse(localStorage.getItem('staffAuth') || '{}')

  if (id) {
    const wo = getWorkorderById(id)
    if (wo) {
      workorder.value = wo
      // 回填报告表单
      if (wo.serviceReport) {
        reportForm.workContent = wo.serviceReport.workContent || wo.serviceReport.repairContent || ''
        reportForm.repairProcess = wo.serviceReport.repairProcess || ''
        reportForm.replacedParts = wo.serviceReport.replacedParts || []
        reportForm.testResult = wo.serviceReport.testResult || ''
      }
      // 从 IndexedDB 加载附件完整数据
      if (wo.attachments && wo.attachments.length > 0) {
        attachmentData.value = await getAttachments(wo.attachments)
      } else {
        attachmentData.value = []
      }
    } else {
      // fallback: from localStorage
      const saved = JSON.parse(localStorage.getItem('workorders') || '[]')
      const found = saved.find(w => w.id === parseInt(id) || w.workorderId === id)
      if (found) workorder.value = found
    }
  }

  // auto-open
  const action = route.query.action
  if (action === 'sign' && workorder.value?.status === 'pending_sign') {
    nextTick(() => openSignDialog('customer'))
  }
}

onMounted(loadWorkorder)

const goBack = () => {
  router.back()
}

// ===== 操作 =====
const assignDialogVisible = ref(false)
const assignFormData = reactive({
  selectedEngineerIds: [],
  workContent: '',
  workStartTime: null,
  workEndTime: null,
  vehicle: 'self'
})

const getCategoryText = (cat) => {
  const map = { installation: '安装工单', service: '服务工单' }
  return map[cat] || cat
}
const getSubTypeText = (sub) => {
  const map = { repair: '维修', trial_processing: '试加工', refitting: '改造' }
  return map[sub] || sub
}
const getWarrantyText = (ws) => {
  const map = { in_warranty: '保内', out_of_warranty: '保外', expired: '过保', in: '保内', out: '保外', unknown: '未知' }
  return map[ws] || ws
}
const getWarrantyTagType = (ws) => {
  const map = { in_warranty: 'success', out_of_warranty: 'warning', expired: 'danger', in: 'success', out: 'danger', unknown: 'info' }
  return map[ws] || 'info'
}

const showAssignDialog = () => {
  assignFormData.selectedEngineerIds = []
  assignFormData.workContent = ''
  assignFormData.workStartTime = null
  assignFormData.workEndTime = null
  assignFormData.vehicle = 'self'
  assignDialogVisible.value = true
}

const confirmAssign = () => {
  if (assignFormData.selectedEngineerIds.length === 0) {
    ElMessage.warning('请选择工程师')
    return
  }
  const primaryEng = engineerList.find(e => e.id === assignFormData.selectedEngineerIds[0])
  if (!primaryEng) return
  const selectedEngineers = assignFormData.selectedEngineerIds.map(id => {
    const eng = engineerList.find(e => e.id === id)
    return eng ? { id: eng.id, name: eng.name, phone: eng.phone } : null
  }).filter(Boolean)

  assignWorkorder(workorder.value.id || workorder.value.rawId, primaryEng.id, primaryEng.name, primaryEng.phone, {
    engineers: selectedEngineers,
    workContent: assignFormData.workContent,
    workStartTime: assignFormData.workStartTime || '',
    workEndTime: assignFormData.workEndTime || '',
    vehicle: assignFormData.vehicle
  })
  ElMessage.success(`已分配给 ${primaryEng.name}${selectedEngineers.length > 1 ? ` 等${selectedEngineers.length}人` : ''}`)
  assignDialogVisible.value = false
  loadWorkorder()
}

const doAccept = () => {
  ElMessageBox.confirm('确认接单？', '接单确认', { type: 'info' }).then(() => {
    if (workorder.value) {
      acceptWorkorder(workorder.value.id || workorder.value.rawId)
      loadWorkorder()
      ElMessage.success('已接单')
    }
  }).catch(() => {})
}

// 判断当前工单是否已打卡签到
const hasCheckedIn = computed(() => {
  try {
    const records = JSON.parse(localStorage.getItem('checkinRecords') || '[]')
    const wo = workorder.value
    if (!wo) return false
    const wid = wo.workorderId || wo.id
    return records.some(r => r.workorderId === wid && r.status === '已签到')
  } catch { return false }
})

const goToCheckInFromDetail = () => {
  const wo = workorder.value
  if (!wo) return
  router.push({
    path: '/staff-checkin',
    query: {
      from: 'workorder',
      workorderId: wo.workorderId || wo.id,
      customerName: wo.customerName || ''
    }
  })
}

const doReject = () => {
  ElMessageBox.prompt('弃单原因', '弃单', { type: 'warning' }).then(({ value }) => {
    if (workorder.value) {
      rejectWorkorder(workorder.value.id || workorder.value.rawId, value)
      ElMessage.success('已弃单')
      goBack()
    }
  }).catch(() => {})
}

const saveReportDraft = () => {
  if (!workorder.value) return
  const id = workorder.value.id || workorder.value.rawId
  saveServiceReportDraft(id, {
    workContent: reportForm.workContent,
    repairProcess: reportForm.repairProcess,
    replacedParts: [...reportForm.replacedParts],
    testResult: reportForm.testResult,
  })
  loadWorkorder()
  ElMessage.success('已暂存')
}

const submitForSignAction = () => {
  // 先暂存再提交
  saveReportDraft()
  if (!workorder.value) return
  ElMessageBox.confirm('确认提交并进入待签字状态？客户会收到签字通知。', '提交确认', { type: 'info' }).then(() => {
    const id = workorder.value.id || workorder.value.rawId
    submitForSign(id, {
      workContent: reportForm.workContent,
      repairProcess: reportForm.repairProcess,
      replacedParts: [...reportForm.replacedParts],
      testResult: reportForm.testResult,
    })
    loadWorkorder()
    ElMessage.success('已提交，等待签字')
  }).catch(() => {})
}

const doTechLeadConfirm = () => {
  ElMessageBox.confirm('确认工单无误？', '课长确认', { type: 'info' }).then(() => {
    if (workorder.value) {
      techLeadConfirm(workorder.value.id || workorder.value.rawId)
      loadWorkorder()
      ElMessage.success('课长已确认')
    }
  }).catch(() => {})
}

const doAssistantConfirm = () => {
  ElMessageBox.confirm('确认工单无误？', '业务确认', { type: 'info' }).then(() => {
    if (workorder.value) {
      assistantConfirm(workorder.value.id || workorder.value.rawId)
      loadWorkorder()
      ElMessage.success('工单已完成')
    }
  }).catch(() => {})
}

// ===== 评价 =====
const openEvaluateDialog = () => {
  evaluateDialog.visible = true
  evaluateDialog.serviceRate = 5
  evaluateDialog.responseRate = 5
  evaluateDialog.techniqueRate = 5
  evaluateDialog.comment = ''
}

const submitEvaluate = () => {
  let customerId = 'guest'
  try {
    const auth = JSON.parse(localStorage.getItem('staffAuth') || '{}')
    customerId = auth.id || auth.userId || 'guest'
  } catch (e) {}

  const pendingSurveys = getPendingSurveysByCustomer(customerId)
  const survey = pendingSurveys.find(s => s.workorderId === (workorder.value.id || workorder.value.rawId))

  if (survey) {
    const result = submitSatisfactionSurvey(survey.id, {
      serviceRate: evaluateDialog.serviceRate,
      responseRate: evaluateDialog.responseRate,
      techniqueRate: evaluateDialog.techniqueRate,
      comment: evaluateDialog.comment
    })
    if (result) {
      ElMessage.success('评价提交成功，感谢您的反馈！')
      evaluateDialog.visible = false
      workorder.value.isEvaluated = true
    } else {
      ElMessage.error('评价提交失败，请重试')
    }
  } else {
    ElMessage.success('评价提交成功，感谢您的反馈！')
    evaluateDialog.visible = false
    workorder.value.isEvaluated = true
  }
}

// ===== 签字 =====
const openSignDialog = (role) => {
  signDialog.signRole = role || 'customer'
  signDialog.visible = true
  nextTick(initCanvas)
}

const initCanvas = () => {
  if (!signCanvas.value) return
  const c = signCanvas.value
  c.width = c.getBoundingClientRect().width
  c.height = c.getBoundingClientRect().height
  ctx = c.getContext('2d')
  ctx.strokeStyle = '#000'; ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.lineJoin = 'round'
}

const getTouchPos = (e) => { const r = signCanvas.value.getBoundingClientRect(); return { x: e.touches[0].clientX - r.left, y: e.touches[0].clientY - r.top } }
const getMousePos = (e) => { const r = signCanvas.value.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top } }
const handleTouchStart = (e) => { isDrawing = true; const p = getTouchPos(e); ctx.beginPath(); ctx.moveTo(p.x, p.y) }
const handleTouchMove = (e) => { if (!isDrawing) return; e.preventDefault(); const p = getTouchPos(e); ctx.lineTo(p.x, p.y); ctx.stroke() }
const handleTouchEnd = () => { isDrawing = false }
const handleMouseDown = (e) => { isDrawing = true; const p = getMousePos(e); ctx.beginPath(); ctx.moveTo(p.x, p.y) }
const handleMouseMove = (e) => { if (!isDrawing) return; const p = getMousePos(e); ctx.lineTo(p.x, p.y); ctx.stroke() }
const handleMouseUp = () => { isDrawing = false }
const clearSignature = () => { if (ctx && signCanvas.value) ctx.clearRect(0, 0, signCanvas.value.width, signCanvas.value.height) }

const confirmSignature = async () => {
  if (!workorder.value || !signCanvas.value) return
  const signImage = signCanvas.value.toDataURL('image/png')
  signLoading.value = true

  try {
    // 生成PDF
    const result = await generateReportPdf(workorder.value, signImage, signDialog.signRole)

    // 签字流转
    const id = workorder.value.id || workorder.value.rawId
    signWorkorder(id, signImage, signDialog.signRole)

    // 保存PDF及预览图片
    saveReportPdf(id, result.pdfDataUri, result.previewImages)

    ElMessage.success('签字完成，PDF报告已生成')
    signDialog.visible = false
    loadWorkorder()
  } catch (e) {
    ElMessage.error('PDF生成失败，但签字已记录')
    const id = workorder.value.id || workorder.value.rawId
    signWorkorder(id, signImage, signDialog.signRole)
    signDialog.visible = false
    loadWorkorder()
  } finally {
    signLoading.value = false
  }
}

const pdfOverlayVisible = ref(false)
const pdfOverlayUrl = ref('')
const pdfOverlayImages = ref([])
let _pdfOverlayDataUri = null

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

const isMobile = () => window.innerWidth <= 768

const openPdfInNewTab = (dataUri) => {
  try {
    if (pdfOverlayUrl.value && pdfOverlayUrl.value.startsWith('blob:')) {
      URL.revokeObjectURL(pdfOverlayUrl.value)
    }
    // 手机端优先使用预览图片（兼容微信等不支持PDF的浏览器），电脑端用iframe渲染PDF
    const images = workorder.value?.reportPreviewImages
    if (isMobile() && images && images.length > 0) {
      pdfOverlayImages.value = images
      pdfOverlayUrl.value = ''
    } else {
      pdfOverlayImages.value = []
      const url = dataUriToBlobUrl(dataUri)
      pdfOverlayUrl.value = url
    }
    _pdfOverlayDataUri = dataUri
    pdfOverlayVisible.value = true
  } catch (e) {
    console.error('PDF预览失败:', e)
    ElMessage.warning('PDF预览失败，请尝试下载')
  }
}

const closePdfOverlay = () => {
  pdfOverlayVisible.value = false
  if (pdfOverlayUrl.value && pdfOverlayUrl.value.startsWith('blob:')) {
    URL.revokeObjectURL(pdfOverlayUrl.value)
    pdfOverlayUrl.value = ''
  }
  _pdfOverlayDataUri = null
}

const viewPdf = () => {
  if (workorder.value?.reportPdf) {
    openPdfInNewTab(workorder.value.reportPdf)
  }
}

const downloadPdf = () => {
  if (workorder.value?.reportPdf) {
    const link = document.createElement('a')
    link.href = workorder.value.reportPdf
    link.download = `服务报告书_${workorder.value.workorderId}.pdf`
    link.click()
  }
}

// 附件图片预览
const attachmentPreviewVisible = ref(false)
const attachmentPreviewUrl = ref('')
const previewAttachmentImage = (url) => {
  attachmentPreviewUrl.value = url
  attachmentPreviewVisible.value = true
}

// ===== helpers =====
const getStatusType = (s) => ({ pending_assign: 'warning', pending_accept: 'info', processing: '', pending_sign: 'danger', techlead_confirm: 'warning', assistant_confirm: 'warning', completed: 'success' }[s] || 'info')
const getStatusText = (s) => ({ pending_assign: '待分配', pending_accept: '待接单', processing: '进行中', pending_sign: '待签字', techlead_confirm: '课长确认', assistant_confirm: '业务确认', completed: '已完成' }[s] || s)
const getTypeText = (t) => ({ service: '维修', install: '安装', parts: '配件', maintenance: '保养' }[t] || t || '维修')
const formatDateTime = (d) => { if (!d) return ''; const t = new Date(d); return `${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,'0')}-${String(t.getDate()).padStart(2,'0')} ${String(t.getHours()).padStart(2,'0')}:${String(t.getMinutes()).padStart(2,'0')}` }

const vehicleText = (v) => {
  const map = { self: '自用车', company: '公司车', public: '公共交通' }
  return map[v] || v
}
</script>

<style scoped>
.staff-workorder-detail { min-height: 100vh; background: #f5f7fa; padding: 0 0 90px 0; width: 100vw; max-width: 100%; overflow-x: hidden; box-sizing: border-box; }
.detail-header { display: flex; justify-content: space-between; align-items: center; padding: 10px 16px; background: #fff; position: sticky; top: 0; z-index: 10; border-bottom: 1px solid #eee; }
.header-title { font-size: 16px; font-weight: 600; }
.placeholder { width: 60px; }

.status-bar { display: flex; align-items: center; gap: 12px; padding: 12px 16px; background: #fff; margin-bottom: 8px; border-bottom: 1px solid #f0f0f0; }
.status-sub { font-size: 13px; color: #999; }

.info-card { margin: 8px 12px; background: #fff; border-radius: 8px; padding: 12px 16px; box-shadow: 0 1px 3px rgba(0,0,0,.05); }
.card-title { font-size: 15px; font-weight: 600; margin-bottom: 10px; padding-bottom: 8px; border-bottom: 1px solid #f0f0f0; }
.info-item { display: flex; justify-content: space-between; align-items: center; padding: 6px 0; font-size: 14px; }
.info-item .label { color: #999; flex-shrink: 0; }
.info-item .value { color: #333; text-align: right; }
.phone-link { color: #409eff; text-decoration: none; }
.description-content { font-size: 14px; color: #333; line-height: 1.6; white-space: pre-wrap; }

/* 附件展示 */
.attachment-list { display: flex; flex-wrap: wrap; gap: 8px; }
.attachment-item { width: 80px; height: 80px; border-radius: 8px; overflow: hidden; border: 1px solid #e4e7ed; cursor: pointer; }
.attachment-thumb { width: 100%; height: 100%; object-fit: cover; }
.attachment-video { width: 100%; height: 100%; object-fit: cover; background: #000; }
.attachment-preview-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.9); display: flex; align-items: center; justify-content: center; z-index: 10001; }
.attachment-preview-full { max-width: 90%; max-height: 90%; object-fit: contain; }
.preview-close-btn { position: absolute; top: 20px; right: 20px; color: white; font-size: 28px; cursor: pointer; padding: 10px; }

.record-item { padding: 8px 0; border-bottom: 1px solid #f5f5f5; }
.record-time { font-size: 12px; color: #999; }
.record-content { font-size: 14px; color: #333; margin: 4px 0; }
.record-operator { font-size: 12px; color: #666; }

.action-bar { position: fixed; bottom: 0; left: 0; right: 0; padding: 10px 16px; background: #fff; border-top: 1px solid #eee; z-index: 10; }

/* 签字全屏 */
.sign-fullscreen-page { position: fixed; inset: 0; background: #f5f7fa; z-index: 100; display: flex; flex-direction: column; }
.sign-header { display: flex; align-items: center; padding: 10px 16px; background: #fff; }
.sign-content { flex: 1; overflow-y: auto; padding: 12px; }
.sign-info-card { background: #fff; border-radius: 8px; padding: 16px; margin-bottom: 12px; }
.sign-info-card h4 { margin: 0 0 10px 0; }
.info-row { padding: 4px 0; font-size: 14px; }
.info-row .label { color: #999; }
.sign-area { background: #fff; border-radius: 8px; padding: 16px; }
.sign-tip { font-size: 13px; color: #999; margin-bottom: 10px; }
.sign-canvas { width: 100%; height: 200px; border: 2px dashed #ccc; border-radius: 8px; background: #fafafa; touch-action: none; }
.sign-footer { display: flex; gap: 12px; padding: 12px 16px; background: #fff; border-top: 1px solid #eee; }
.sign-footer .el-button { flex: 1; }

.assign-mobile-dialog .assign-dialog-content {
  max-height: calc(100vh - 140px);
  overflow-y: auto;
}
.assign-dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 10px;
}
.assign-dialog-title {
  font-size: 18px;
  font-weight: 500;
  color: #262626;
}
.assign-info-section {
  background: #f5f7fa;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 12px;
}
.assign-section-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 10px;
  padding-left: 8px;
  border-left: 3px solid #409eff;
}
.assign-info-row {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 13px;
  margin-bottom: 6px;
}
.assign-info-row .label {
  color: #909399;
  white-space: nowrap;
  min-width: 56px;
  flex-shrink: 0;
}
.assign-info-row .value {
  color: #303133;
  word-break: break-all;
}
.assign-info-pair {
  display: flex;
  gap: 16px;
  margin-bottom: 6px;
}
.assign-info-pair .assign-info-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  flex: 1;
}
.assign-info-pair .assign-info-item .label {
  color: #909399;
  white-space: nowrap;
  min-width: 50px;
}
.assign-info-pair .assign-info-item .value {
  color: #303133;
  word-break: break-all;
}
.assign-info-desc {
  margin-top: 8px;
  font-size: 13px;
}
.assign-info-desc .label {
  color: #909399;
  display: block;
  margin-bottom: 4px;
}
.assign-info-desc .value {
  color: #303133;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-all;
}
.assign-footer {
  display: flex;
  gap: 15px;
  width: 100%;
}
.assign-footer .el-button {
  flex: 1;
}

/* 服务报告表单样式 */
.report-form-card :deep(.el-form-item__label) {
  font-weight: 600;
  color: #303133;
  font-size: 14px;
}
.quick-tags {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  margin-top: 6px;
}
.quick-label {
  font-size: 12px;
  color: #909399;
  white-space: nowrap;
}
.quick-tag {
  cursor: pointer;
  transition: all 0.2s;
  font-size: 12px;
}
.quick-tag:hover {
  color: #409eff;
  border-color: #409eff;
}
.parts-select-area {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}
.parts-chips {
  flex: 1;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  min-height: 32px;
  align-items: center;
}
.part-chip {
  font-size: 12px;
}
.no-parts-hint {
  font-size: 13px;
  color: #c0c4cc;
}

/* 配件选择面板 */
.parts-dialog .parts-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}
.part-option {
  border: 2px solid #e4e7ed;
  border-radius: 10px;
  padding: 12px;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
  text-align: center;
}
.part-option:active {
  transform: scale(0.97);
}
.part-option.selected {
  border-color: #409eff;
  background: #ecf5ff;
}
.part-check {
  position: absolute;
  top: 6px;
  right: 6px;
  color: #409eff;
  font-size: 16px;
}
.part-name {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
}
.part-spec {
  font-size: 11px;
  color: #909399;
  line-height: 1.4;
}

/* 签字预览 */
.sign-preview {
  padding: 8px 0;
}
.sign-preview .label {
  font-size: 13px;
  color: #999;
  display: block;
  margin-bottom: 6px;
}
.sign-image {
  max-width: 200px;
  max-height: 80px;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  background: #fafafa;
}

/* 评价全屏页面 */
.evaluate-fullscreen-page {
  position: fixed;
  inset: 0;
  background: #f5f7fa;
  z-index: 1000;
  display: flex;
  flex-direction: column;
}
.evaluate-header {
  display: flex;
  align-items: center;
  padding: 10px 16px;
  background: #fff;
  border-bottom: 1px solid #eee;
}
.evaluate-content {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.evaluate-card {
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.evaluate-card .rate-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.evaluate-card .rate-item .label {
  font-size: 16px;
  color: #262626;
  font-weight: 500;
}
.comment-card {
  background: #fff;
  border-radius: 8px;
  padding: 16px;
}
.comment-card h4 {
  margin: 0 0 12px 0;
  font-size: 16px;
  color: #262626;
}
.evaluate-footer {
  padding: 12px 16px;
  background: #fff;
  border-top: 1px solid #eee;
}

.work-content-tags {
  margin-top: 10px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.tags-label {
  font-size: 12px;
  color: #909399;
}

.work-tag {
  cursor: pointer;
  user-select: none;
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
