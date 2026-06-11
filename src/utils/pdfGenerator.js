/**
 * PDF生成工具
 * 用于生成带电子签章的报价单PDF
 */

// 生成报价单PDF（使用浏览器打印功能模拟）
export function generateQuotationPDF(quotation, companyInfo = {}) {
  return new Promise((resolve, reject) => {
    try {
      // 创建PDF内容HTML
      const pdfContent = createQuotationHTML(quotation, companyInfo)

      // 创建隐藏iframe用于打印
      const iframe = document.createElement('iframe')
      iframe.style.position = 'fixed'
      iframe.style.top = '-9999px'
      iframe.style.left = '-9999px'
      iframe.style.width = '210mm'
      iframe.style.height = '297mm'
      document.body.appendChild(iframe)

      // 写入内容
      const doc = iframe.contentWindow.document
      doc.open()
      doc.write(pdfContent)
      doc.close()

      // 等待内容加载完成后打印
      setTimeout(() => {
        iframe.contentWindow.focus()
        iframe.contentWindow.print()

        // 生成PDF URL（使用Blob）
        const blob = new Blob([pdfContent], { type: 'text/html' })
        const pdfUrl = URL.createObjectURL(blob)

        // 清理iframe
        setTimeout(() => {
          document.body.removeChild(iframe)
        }, 1000)

        resolve({
          success: true,
          pdfUrl: pdfUrl,
          message: 'PDF生成成功'
        })
      }, 500)
    } catch (error) {
      reject({
        success: false,
        message: 'PDF生成失败：' + error.message
      })
    }
  })
}

// 创建报价单HTML内容
function createQuotationHTML(quotation, companyInfo) {
  const {
    companyName = '某某科技有限公司',
    companyAddress = '某某市某某区某某路123号',
    companyPhone = '400-123-4567',
    companyEmail = 'sales@example.com',
    stampUrl = '' // 电子签章图片URL
  } = companyInfo

  const items = quotation.items || []
  const itemsHtml = items.map((item, index) => `
    <tr>
      <td style="border: 1px solid #333; padding: 8px; text-align: center;">${index + 1}</td>
      <td style="border: 1px solid #333; padding: 8px;">${item.partNumber || ''}</td>
      <td style="border: 1px solid #333; padding: 8px;">${item.partName || ''}</td>
      <td style="border: 1px solid #333; padding: 8px;">${item.specification || ''}</td>
      <td style="border: 1px solid #333; padding: 8px; text-align: center;">${item.unit || '个'}</td>
      <td style="border: 1px solid #333; padding: 8px; text-align: right;">${item.quantity || 0}</td>
      <td style="border: 1px solid #333; padding: 8px; text-align: right;">¥${formatMoney(item.purchasePrice || 0)}</td>
      <td style="border: 1px solid #333; padding: 8px; text-align: right;">¥${formatMoney(item.unitPrice || 0)}</td>
      <td style="border: 1px solid #333; padding: 8px; text-align: right;">¥${formatMoney(item.purchaseTotal || 0)}</td>
      <td style="border: 1px solid #333; padding: 8px; text-align: right;">¥${formatMoney(item.totalPrice || 0)}</td>
      <td style="border: 1px solid #333; padding: 8px; text-align: right;">${formatProfitRate(item.profitRate)}</td>
    </tr>
  `).join('')

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>报价单 - ${quotation.quotationNo}</title>
  <style>
    @media print {
      body {
        margin: 0;
        padding: 20px;
        font-family: "SimSun", "Microsoft YaHei", serif;
        font-size: 12pt;
        line-height: 1.6;
      }
      .no-print {
        display: none !important;
      }
      .page-break {
        page-break-after: always;
      }
    }
    body {
      margin: 0;
      padding: 20px;
      font-family: "SimSun", "Microsoft YaHei", serif;
      font-size: 12pt;
      line-height: 1.6;
      max-width: 210mm;
      margin: 0 auto;
    }
    .header {
      text-align: center;
      border-bottom: 2px solid #333;
      padding-bottom: 20px;
      margin-bottom: 20px;
    }
    .company-name {
      font-size: 24pt;
      font-weight: bold;
      margin-bottom: 10px;
    }
    .company-info {
      font-size: 10pt;
      color: #666;
    }
    .title {
      font-size: 20pt;
      font-weight: bold;
      text-align: center;
      margin: 30px 0;
    }
    .info-section {
      display: flex;
      justify-content: space-between;
      margin-bottom: 20px;
    }
    .info-left, .info-right {
      width: 48%;
    }
    .info-row {
      margin-bottom: 8px;
    }
    .info-label {
      font-weight: bold;
      display: inline-block;
      width: 100px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
      font-size: 10pt;
    }
    th {
      background-color: #f5f5f5;
      border: 1px solid #333;
      padding: 10px 8px;
      text-align: center;
      font-weight: bold;
    }
    .summary-section {
      margin-top: 20px;
      border-top: 2px solid #333;
      padding-top: 20px;
    }
    .summary-row {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 8px;
    }
    .summary-label {
      width: 200px;
      text-align: right;
      padding-right: 20px;
    }
    .summary-value {
      width: 150px;
      text-align: right;
      font-weight: bold;
    }
    .grand-total {
      font-size: 14pt;
      color: #d9534f;
    }
    .signature-section {
      margin-top: 40px;
      display: flex;
      justify-content: space-between;
      gap: 20px;
    }
    .signature-box {
      flex: 1;
      min-width: 150px;
    }
    .signature-box > div:first-child {
      font-weight: bold;
      margin-bottom: 8px;
      font-size: 11pt;
    }
    .signature-line {
      border-bottom: 1px solid #333;
      height: 60px;
      margin-bottom: 5px;
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .customer-sign-line {
      min-height: 80px;
    }
    .sign-text {
      font-size: 14pt;
      color: #409eff;
      font-weight: bold;
    }
    .approve-stamp {
      width: 100px;
      height: 100px;
      border: 3px solid #d9534f;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #d9534f;
      font-size: 16pt;
      font-weight: bold;
      transform: rotate(-15deg);
      opacity: 0.8;
    }
    .customer-sign-img {
      max-width: 140px;
      max-height: 70px;
      object-fit: contain;
    }
    .terms-section {
      margin-top: 30px;
      padding: 15px;
      background-color: #f9f9f9;
      border: 1px solid #ddd;
    }
    .terms-title {
      font-weight: bold;
      margin-bottom: 10px;
    }
    .footer {
      margin-top: 40px;
      text-align: center;
      font-size: 10pt;
      color: #666;
      border-top: 1px solid #ddd;
      padding-top: 20px;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="company-name">${companyName}</div>
    <div class="company-info">
      地址：${companyAddress} | 电话：${companyPhone} | 邮箱：${companyEmail}
    </div>
  </div>

  <div class="title">报 价 单</div>

  <div class="info-section">
    <div class="info-left">
      <div class="info-row">
        <span class="info-label">报价单号：</span>${quotation.quotationNo}
      </div>
      <div class="info-row">
        <span class="info-label">客　　户：</span>${quotation.customerName}
      </div>
      <div class="info-row">
        <span class="info-label">联 系 人：</span>${quotation.contactName}
      </div>
      <div class="info-row">
        <span class="info-label">联系电话：</span>${quotation.contactPhone}
      </div>
    </div>
    <div class="info-right">
      <div class="info-row">
        <span class="info-label">报价日期：</span>${formatDate(quotation.quoteDate || quotation.createdAt)}
      </div>
      <div class="info-row">
        <span class="info-label">有效期至：</span>${formatDate(quotation.validUntil) || '自报价日起' + quotation.validDays + '天'}
      </div>
      <div class="info-row">
        <span class="info-label">版　　本：</span>V${quotation.version}
      </div>
      <div class="info-row">
        <span class="info-label">关联工单：</span>${quotation.workorderNo || '-'}
      </div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width: 40px;">序号</th>
        <th style="width: 80px;">配件编码</th>
        <th style="width: 120px;">配件名称</th>
        <th style="width: 100px;">规格</th>
        <th style="width: 50px;">单位</th>
        <th style="width: 50px;">数量</th>
        <th style="width: 80px;">采购单价</th>
        <th style="width: 80px;">销售单价</th>
        <th style="width: 80px;">采购金额</th>
        <th style="width: 80px;">销售金额</th>
        <th style="width: 60px;">利润率</th>
      </tr>
    </thead>
    <tbody>
      ${itemsHtml}
    </tbody>
  </table>

  <div class="summary-section">
    <div class="summary-row">
      <span class="summary-label">采购金额合计（成本）：</span>
      <span class="summary-value">¥${formatMoney(quotation.purchaseTotal || 0)}</span>
    </div>
    <div class="summary-row">
      <span class="summary-label">销售金额小计：</span>
      <span class="summary-value">¥${formatMoney(quotation.subtotal || 0)}</span>
    </div>
    <div class="summary-row">
      <span class="summary-label">税额（${(quotation.taxRate * 100).toFixed(0)}%）：</span>
      <span class="summary-value">¥${formatMoney(quotation.taxAmount || 0)}</span>
    </div>
    ${quotation.discount > 0 ? `
    <div class="summary-row">
      <span class="summary-label">折扣：</span>
      <span class="summary-value" style="color: #5cb85c;">-¥${formatMoney(quotation.discount)}</span>
    </div>
    ` : ''}
    <div class="summary-row">
      <span class="summary-label">利润合计：</span>
      <span class="summary-value" style="color: ${(quotation.profitTotal || 0) >= 0 ? '#5cb85c' : '#d9534f'};">¥${formatMoney(quotation.profitTotal || 0)}</span>
    </div>
    <div class="summary-row">
      <span class="summary-label">总利润率：</span>
      <span class="summary-value" style="color: ${(quotation.profitRate || 0) >= 15 ? '#5cb85c' : '#f0ad4e'};">${formatProfitRate(quotation.profitRate)}</span>
    </div>
    <div class="summary-row grand-total">
      <span class="summary-label" style="font-size: 14pt;">销售金额合计（大写）：</span>
      <span class="summary-value" style="font-size: 14pt; color: #d9534f;">${numberToChinese(quotation.totalAmount || 0)}</span>
    </div>
    <div class="summary-row grand-total">
      <span class="summary-label" style="font-size: 14pt;">销售金额合计（小写）：</span>
      <span class="summary-value" style="font-size: 14pt; color: #d9534f;">¥${formatMoney(quotation.totalAmount || 0)}</span>
    </div>
  </div>

  ${quotation.terms ? `
  <div class="terms-section">
    <div class="terms-title">报价条款：</div>
    <div>${quotation.terms}</div>
  </div>
  ` : ''}

  ${quotation.notes ? `
  <div class="terms-section">
    <div class="terms-title">备注：</div>
    <div>${quotation.notes}</div>
  </div>
  ` : ''}

  <div class="signature-section">
    <!-- 报价人签字区 -->
    <div class="signature-box">
      <div>报价人：${quotation.createdBy || ''}</div>
      <div class="signature-line">
        ${quotation.status !== 'draft' ? '<span class="sign-text">已报价</span>' : ''}
      </div>
    </div>
    
    <!-- 审核人签字区 -->
    <div class="signature-box">
      <div>审核人：</div>
      <div class="signature-line">
        ${(quotation.status === 'approved' || quotation.status === 'sent' || quotation.status === 'confirmed') ? '<div class="approve-stamp">已审核</div>' : ''}
      </div>
    </div>
    
    <!-- 客户确认签字区 -->
    <div class="signature-box">
      <div>客户确认：</div>
      <div class="signature-line customer-sign-line">
        ${quotation.customerSign ? `<img src="${quotation.customerSign}" class="customer-sign-img" alt="客户签字" />` : ''}
      </div>
    </div>
  </div>

  <div class="footer">
    <p>此报价单经双方签字盖章后生效</p>
    <p>感谢您的信任与支持！</p>
  </div>

  <div class="no-print" style="margin-top: 30px; text-align: center; padding: 20px; background-color: #f5f5f5;">
    <button onclick="window.print()" style="padding: 10px 30px; font-size: 14pt; cursor: pointer;">打印/保存为PDF</button>
  </div>
</body>
</html>
  `
}

// 格式化金额
function formatMoney(amount) {
  if (amount === undefined || amount === null) return '0.00'
  return amount.toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

// 格式化利润率
function formatProfitRate(rate) {
  if (rate === undefined || rate === null) return '0.00%'
  return rate.toFixed(2) + '%'
}

// 格式化日期
function formatDate(dateStr) {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

// 数字转中文大写
function numberToChinese(num) {
  const digits = ['零', '壹', '贰', '叁', '肆', '伍', '陆', '柒', '捌', '玖']
  const units = ['', '拾', '佰', '仟']
  const bigUnits = ['', '万', '亿', '万亿']

  if (num === 0) return '零元整'

  // 处理小数
  const integer = Math.floor(num)
  const decimal = Math.round((num - integer) * 100)

  let result = ''

  // 转换整数部分
  if (integer > 0) {
    let integerStr = integer.toString()
    let zero = false
    let unitIndex = 0

    while (integerStr.length > 0) {
      const segment = integerStr.slice(-4)
      integerStr = integerStr.slice(0, -4)

      let segmentResult = ''
      for (let i = 0; i < segment.length; i++) {
        const digit = parseInt(segment[segment.length - 1 - i])
        if (digit === 0) {
          if (!zero && segmentResult.length > 0) {
            segmentResult = digits[0] + segmentResult
            zero = true
          }
        } else {
          segmentResult = digits[digit] + units[i] + segmentResult
          zero = false
        }
      }

      if (segmentResult.length > 0) {
        result = segmentResult + bigUnits[unitIndex] + result
      }
      unitIndex++
    }

    result += '元'
  }

  // 转换小数部分
  if (decimal > 0) {
    const jiao = Math.floor(decimal / 10)
    const fen = decimal % 10

    if (jiao > 0) {
      result += digits[jiao] + '角'
    }
    if (fen > 0) {
      result += digits[fen] + '分'
    }
  } else {
    result += '整'
  }

  return result
}

// 导出为Blob URL（用于下载）
export function generatePDFBlobUrl(quotation, companyInfo = {}) {
  const pdfContent = createQuotationHTML(quotation, companyInfo)
  const blob = new Blob([pdfContent], { type: 'text/html;charset=utf-8' })
  return URL.createObjectURL(blob)
}

// 下载PDF文件
export function downloadPDF(quotation, companyInfo = {}) {
  const pdfContent = createQuotationHTML(quotation, companyInfo)
  const blob = new Blob([pdfContent], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = `报价单_${quotation.quotationNo}.pdf`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  URL.revokeObjectURL(url)
}
