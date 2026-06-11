<template>
  <div class='contact-register'>
    <el-card shadow='hover' class='register-card'>
      <template #header>
        <div class='card-header'><span>联系人注册</span></div>
      </template>
      <el-steps :active='currentStep' finish-status='success' class='register-steps'>
        <el-step title='填写信息' description='填写个人和公司信息' />
        <el-step title='提交审核' description='等待管理员审核' />
        <el-step title='注册成功' description='审核通过后即可使用' />
      </el-steps>
      <div v-if='currentStep === 0' class='register-form'>
        <el-form ref='formRef' :model='form' :rules='rules' label-width='140px'>
          <h3 class='section-title'>个人信息</h3>
          <el-row :gutter='20'>
            <el-col :span='12'><el-form-item label='姓名' prop='name'><el-input v-model='form.name' placeholder='请输入真实姓名' /></el-form-item></el-col>
            <el-col :span='12'><el-form-item label='手机号' prop='phone'><el-input v-model='form.phone' placeholder='请输入手机号码' maxlength='11' /></el-form-item></el-col>
          </el-row>
          <el-row :gutter='20'>
            <el-col :span='12'><el-form-item label='邮箱' prop='email'><el-input v-model='form.email' placeholder='请输入邮箱地址' /></el-form-item></el-col>
            <el-col :span='12'><el-form-item label='职位' prop='position'><el-input v-model='form.position' placeholder='请输入职位' /></el-form-item></el-col>
          </el-row>
          <h3 class='section-title'>公司信息</h3>
          <el-form-item label='公司名称' prop='companyName'>
            <div style='display: flex; gap: 10px; margin-bottom: 10px;'>
              <el-input v-model='companySearchKeyword' placeholder='输入企业名称从天眼查搜索' clearable @keyup.enter='searchCompany' :disabled='searchMode === "manual"' style='flex: 1;' />
              <el-button type='primary' @click='searchCompany' :loading='searching' :disabled='searchMode === "manual"'>搜索</el-button>
              <el-button type='info' @click='toggleSearchMode'>{{ searchMode === "search" ? "手动输入" : "天眼查搜索" }}</el-button>
            </div>
            <div v-if='searchMode === "search" && searchPerformed && tianyanchaResults.length > 0' style='margin-bottom: 10px;'>
              <el-select v-model='selectedCompanyId' placeholder='请选择公司' style='width: 100%;' @change='selectCompany'>
                <el-option v-for='company in tianyanchaResults' :key='company.id' :label='company.name' :value='company.id'>
                  <div style='display: flex; justify-content: space-between; align-items: center; padding: 5px 0;'>
                    <div>
                      <div style='font-weight: 500;'>{{ company.name }}</div>
                      <div style='font-size: 12px; color: #909399;'>{{ company.legalPersonName ? `法人: ${company.legalPersonName}` : '' }} {{ company.regStatus ? `| 状态: ${company.regStatus}` : '' }}</div>
                    </div>
                    <div style='text-align: right; font-size: 12px; color: #8492a6;'>
                      <div>{{ company.regLocation }}</div>
                      <div v-if='company.regCapital'>{{ company.regCapital }}</div>
                    </div>
                  </div>
                </el-option>
              </el-select>
            </div>
            <el-input v-model='form.companyName' placeholder='请输入公司全称' :disabled='searchMode === "search" && selectedCompanyId' />
            <div v-if='searchMode === "search"' style='margin-top: 5px; font-size: 12px; color: #909399;'>
              <el-link type='info' @click='toggleSearchMode'>查不到？切换为手动输入</el-link>
            </div>
          </el-form-item>
          <el-form-item label='公司地址' prop='companyAddress'><el-input v-model='form.companyAddress' type='textarea' :rows='2' placeholder='请输入公司地址' /></el-form-item>
          <el-row :gutter='20'>
            <el-col :span='12'><el-form-item label='统一社会信用代码' prop='creditCode'><el-input v-model='form.creditCode' placeholder='请输入统一社会信用代码' maxlength='18' /></el-form-item></el-col>
            <el-col :span='12'><el-form-item label='公司电话' prop='companyPhone'><el-input v-model='form.companyPhone' placeholder='请输入公司电话' /></el-form-item></el-col>
          </el-row>
          <el-row :gutter='20' v-if='selectedCompanyInfo'>
            <el-col :span='24'>
              <el-alert type='success' :closable='false'>
                <template #title>
                  <div style='font-size: 13px;'>
                    <span style='font-weight: bold;'>已选企业信息：</span>
                    法人：{{ selectedCompanyInfo.legalPersonName || '-' }} |
                    状态：{{ selectedCompanyInfo.regStatus || '-' }} |
                    注册资本：{{ selectedCompanyInfo.regCapital || '-' }}
                  </div>
                </template>
              </el-alert>
            </el-col>
          </el-row>
          <h3 class='section-title'>账户信息</h3>
          <el-form-item label='登录方式' prop='loginType'>
            <el-radio-group v-model='form.loginType'>
              <el-radio label='sms'>短信验证码登录</el-radio>
              <el-radio label='password'>密码登录</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-row :gutter='20' v-if='form.loginType === "password"'>
            <el-col :span='12'><el-form-item label='密码' prop='password'><el-input v-model='form.password' type='password' placeholder='请设置密码' show-password /></el-form-item></el-col>
            <el-col :span='12'><el-form-item label='确认密码' prop='confirmPassword'><el-input v-model='form.confirmPassword' type='password' placeholder='请确认密码' show-password /></el-form-item></el-col>
          </el-row>
          <el-row :gutter='20' v-if='form.loginType === "sms"'>
            <el-col :span='12'>
              <el-form-item label='短信验证码' prop='verifyCode'>
                <div style='display: flex; gap: 10px;'>
                  <el-input v-model='form.verifyCode' placeholder='请输入6位验证码' maxlength='6' style='flex: 1;' />
                  <el-button type='primary' @click='sendVerifyCode' :loading='sendingCode' :disabled='codeCountdown > 0 || !form.phone'>
                    {{ codeCountdown > 0 ? `${codeCountdown}秒后重发` : '获取验证码' }}
                  </el-button>
                </div>
              </el-form-item>
            </el-col>
            <el-col :span='12'>
              <el-form-item label=' '>
                <span style='font-size: 12px; color: #909399;'>验证码5分钟内有效</span>
              </el-form-item>
            </el-col>
          </el-row>
          <el-form-item prop='agreement'><el-checkbox v-model='form.agreement'>我已阅读并同意<el-button type='primary' link @click='showAgreement'>《用户注册协议》</el-button></el-checkbox></el-form-item>
          <el-form-item>
            <el-button type='primary' @click='submitForm' :loading='submitting'>提交注册申请</el-button>
            <el-button @click='resetForm'>重置</el-button>
          </el-form-item>
        </el-form>
      </div>
      <div v-if='currentStep === 1' class='submit-result'>
        <el-result icon='success' title='提交成功' sub-title='请等待管理员审核'>
          <template #extra>
            <el-button type='primary' @click='goToLogin'>去登录</el-button>
          </template>
        </el-result>
      </div>
      <div v-if='currentStep === 2' class='register-success'>
        <el-result icon='success' title='注册成功' sub-title='欢迎加入'>
          <template #extra>
            <el-button type='primary' @click='goToLogin'>立即登录</el-button>
          </template>
        </el-result>
      </div>
    </el-card>
    <el-dialog v-model='agreementVisible' title='用户注册协议' width='60%'>
      <div class='agreement-content'>
        <p>欢迎注册本平台！</p>
        <h4>1. 服务条款</h4>
        <p>本平台提供售后服务管理系统。</p>
        <h4>2. 用户义务</h4>
        <p>用户应提供真实信息。</p>
        <h4>3. 隐私保护</h4>
        <p>我们将保护用户隐私。</p>
      </div>
      <template #footer>
        <el-button type='primary' @click='agreementVisible = false'>我已知晓</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import axios from 'axios'
import { ElMessage } from 'element-plus'

export default {
  name: 'ContactRegister',
  data() {
    return {
      formRef: null,
      currentStep: 0,
      submitting: false,
      agreementVisible: false,
      sendingCode: false,
      codeCountdown: 0,
      countdownTimer: null,
      form: {
        name: '',
        phone: '',
        email: '',
        position: '',
        companyName: '',
        companyAddress: '',
        creditCode: '',
        companyPhone: '',
        loginType: 'sms',
        password: '',
        confirmPassword: '',
        verifyCode: '',
        agreement: false
      },
      companySearchKeyword: '',
      searchMode: 'search',
      searching: false,
      searchPerformed: false,
      tianyanchaResults: [],
      selectedCompanyId: null,
      selectedCompanyInfo: null,
      rules: {
        name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
        phone: [
          { required: true, message: '请输入手机号', trigger: 'blur' },
          { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' }
        ],
        email: [
          { required: true, message: '请输入邮箱', trigger: 'blur' },
          { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
        ],
        position: [{ required: true, message: '请输入职位', trigger: 'blur' }],
        companyName: [{ required: true, message: '请输入公司名称', trigger: 'blur' }],
        companyAddress: [{ required: true, message: '请输入公司地址', trigger: 'blur' }],
        creditCode: [{ required: true, message: '请输入统一社会信用代码', trigger: 'blur' }],
        loginType: [{ required: true, message: '请选择登录方式', trigger: 'change' }],
        password: [
          { required: true, message: '请输入密码', trigger: 'blur', validator: (rule, value, callback) => {
            if (this.form.loginType === 'password' && !value) {
              callback(new Error('请输入密码'))
            } else {
              callback()
            }
          }},
          { min: 6, message: '密码长度至少 6 位', trigger: 'blur' }
        ],
        confirmPassword: [
          { required: true, message: '请确认密码', trigger: 'blur', validator: (rule, value, callback) => {
            if (this.form.loginType === 'password') {
              if (!value) {
                callback(new Error('请确认密码'))
              } else if (value !== this.form.password) {
                callback(new Error('两次输入的密码不一致'))
              } else {
                callback()
              }
            } else {
              callback()
            }
          }}
        ],
        verifyCode: [
          { required: true, message: '请输入验证码', trigger: 'blur', validator: (rule, value, callback) => {
            if (this.form.loginType === 'sms' && !value) {
              callback(new Error('请输入验证码'))
            } else {
              callback()
            }
          }},
          { len: 6, message: '验证码为6位数字', trigger: 'blur' }
        ],
        agreement: [{ validator: (rule, value, callback) => { if (!value) callback(new Error('请同意协议')); else callback() }, trigger: 'change' }]
      }
    }
  },
  beforeUnmount() {
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer)
    }
  },
  methods: {
    async searchCompany() {
      if (!this.companySearchKeyword.trim()) {
        ElMessage.warning('请输入企业名称关键词')
        return
      }
      this.searching = true
      this.searchPerformed = false
      this.tianyanchaResults = []
      this.selectedCompanyId = null
      this.selectedCompanyInfo = null
      try {
        const response = await axios.post('/api/third-party/tianyancha/search', {
          keyword: this.companySearchKeyword,
          pageNum: 1,
          pageSize: 20
        })
        if (response.data && response.data.code === 200 && response.data.data) {
          this.tianyanchaResults = response.data.data.companyList || []
          this.searchPerformed = true
          if (this.tianyanchaResults.length === 0) {
            ElMessage.info('未找到相关企业，可切换手动输入')
          } else {
            ElMessage.success(`找到 ${this.tianyanchaResults.length} 个相关企业`)
          }
        } else {
          ElMessage.error(response.data?.message || '搜索失败')
        }
      } catch (error) {
        console.error('搜索失败:', error)
        ElMessage.warning('API 调用失败，请切换手动输入')
      } finally {
        this.searching = false
      }
    },
    toggleSearchMode() {
      if (this.searchMode === 'search') {
        this.searchMode = 'manual'
        this.form.companyName = ''
        this.selectedCompanyId = null
        this.selectedCompanyInfo = null
        this.tianyanchaResults = []
      } else {
        this.searchMode = 'search'
        this.form.companyName = ''
      }
    },
    selectCompany(companyId) {
      const company = this.tianyanchaResults.find(c => c.id === companyId)
      if (company) {
        this.form.companyName = company.name
        this.form.creditCode = company.creditCode || ''
        this.form.companyAddress = company.regLocation || ''
        this.form.companyPhone = company.phone || ''
        this.selectedCompanyInfo = company
        ElMessage.success(`已选择：${company.name}`)
      }
    },
    async sendVerifyCode() {
      if (!this.form.phone) {
        ElMessage.warning('请先输入手机号')
        return
      }
      if (!/^1[3-9]\d{9}$/.test(this.form.phone)) {
        ElMessage.warning('请输入正确的手机号码')
        return
      }
      this.sendingCode = true
      try {
        const response = await axios.post('/api/third-party/sms/send-verify-code', {
          phone: this.form.phone,
          type: 'REGISTER'
        })
        if (response.data && response.data.code === 200) {
          ElMessage.success('验证码已发送')
          this.startCountdown()
        } else {
          ElMessage.error(response.data?.message || '发送失败')
        }
      } catch (error) {
        console.error('发送验证码失败:', error)
        ElMessage.error('发送验证码失败，请稍后重试')
      } finally {
        this.sendingCode = false
      }
    },
    startCountdown() {
      this.codeCountdown = 60
      this.countdownTimer = setInterval(() => {
        this.codeCountdown--
        if (this.codeCountdown <= 0) {
          clearInterval(this.countdownTimer)
        }
      }, 1000)
    },
    showAgreement() {
      this.agreementVisible = true
    },
    async submitForm() {
      if (!this.formRef) return
      const valid = await this.formRef.validate().catch(() => false)
      if (!valid) return

      // 短信验证码验证
      if (this.form.loginType === 'sms') {
        try {
          const verifyResponse = await axios.post('/api/third-party/sms/verify-code', {
            phone: this.form.phone,
            code: this.form.verifyCode,
            type: 'REGISTER'
          })
          if (!verifyResponse.data || verifyResponse.data.code !== 200) {
            ElMessage.error(verifyResponse.data?.message || '验证码验证失败')
            return
          }
        } catch (error) {
          console.error('验证码验证失败:', error)
          ElMessage.error('验证码验证失败')
          return
        }
      }

      this.submitting = true
      try {
        // 构建提交数据
        const submitData = {
          name: this.form.name,
          phone: this.form.phone,
          email: this.form.email,
          position: this.form.position,
          companyName: this.form.companyName,
          companyAddress: this.form.companyAddress,
          creditCode: this.form.creditCode,
          companyPhone: this.form.companyPhone,
          loginType: this.form.loginType,
          password: this.form.loginType === 'password' ? this.form.password : null,
          source: 'WEB'
        }
        console.log('提交注册:', submitData)
        // TODO: 调用实际注册API
        // const response = await axios.post('/api/contacts/register', submitData)
        this.currentStep = 1
        ElMessage.success('注册申请已提交，请等待审核')
        setTimeout(() => {
          this.currentStep = 2
        }, 3000)
      } catch (error) {
        console.error('注册失败:', error)
        ElMessage.error('注册失败，请稍后重试')
      } finally {
        this.submitting = false
      }
    },
    resetForm() {
      if (this.formRef) this.formRef.resetFields()
      this.currentStep = 0
      this.companySearchKeyword = ''
      this.searchMode = 'search'
      this.tianyanchaResults = []
      this.selectedCompanyId = null
      this.selectedCompanyInfo = null
      this.form.loginType = 'sms'
      if (this.countdownTimer) {
        clearInterval(this.countdownTimer)
        this.codeCountdown = 0
      }
    },
    goToLogin() {
      this.$router.push('/customer-login')
    }
  }
}
</script>

<style scoped>
.contact-register {
  max-width: 900px;
  margin: 20px auto;
  padding: 20px;
}
.register-card {
  border-radius: 8px;
}
.section-title {
  margin: 20px 0 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #e4e7ed;
  color: #303133;
  font-size: 16px;
  font-weight: 500;
}
.submit-result,
.register-success {
  padding: 40px 20px;
  text-align: center;
}
.agreement-content {
  max-height: 400px;
  overflow-y: auto;
  line-height: 1.8;
}
.agreement-content h4 {
  margin: 15px 0 10px;
  color: #303133;
}
</style>
