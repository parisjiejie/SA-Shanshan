/**
 * 服务报告书 PDF 生成工具
 * 使用 html2canvas + jsPDF
 */
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

/**
 * 生成服务报告书 HTML
 */
export function buildReportHtml(workorder, signImage, signRole) {
  const d = new Date()
  const dateStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
  const sr = workorder.serviceReport || {}
  
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: SimSun, serif; font-size: 12px; padding: 20px; color: #333; }
  h2 { text-align: center; font-size: 18px; margin-bottom: 15px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
  td { border: 1px solid #999; padding: 5px 8px; font-size: 12px; vertical-align: top; }
  .label { background: #f5f5f5; width: 80px; text-align: center; font-weight: bold; }
  .section-title { background: #e8e8e8; font-weight: bold; text-align: center; font-size: 13px; padding: 6px; }
  .sign-box { height: 60px; text-align: center; vertical-align: middle; }
  .sign-img { max-height: 55px; max-width: 180px; }
  .content-cell { min-height: 40px; line-height: 1.6; white-space: pre-wrap; }
  .checkbox { display: inline-block; margin: 0 5px; }
  .col-2 { width: 50%; }
</style>
</head>
<body>
<h2>山善（上海）贸易有限公司<br>服务报告书</h2>

<table>
  <tr><td class="label">发行日</td><td>${dateStr}</td><td class="label">报告书 No.</td><td>${workorder.workorderId || ''}</td></tr>
  <tr><td class="label">客户名称</td><td>${workorder.customerName || ''}</td><td class="label">TEL</td><td>${workorder.customerPhone || ''}</td></tr>
  <tr><td class="label">负责人</td><td>${workorder.customerContact || ''}</td><td class="label">安装日期</td><td>${workorder.installDate || ''}</td></tr>
  <tr><td class="label">地址</td><td colspan="3">${workorder.address || ''}</td></tr>
  <tr><td class="label">机身编号</td><td>${workorder.serialNumber || ''}</td><td class="label">型号</td><td>${workorder.deviceModel || ''}</td></tr>
</table>

<table>
  <tr><td class="section-title" colspan="4">服务区分</td></tr>
  <tr>
    <td class="col-2">
      <span class="checkbox">${workorder.category === 'installation' ? '☑' : '□'}</span> 安装<br>
      <span class="checkbox">${workorder.category === 'service' && workorder.subType === 'repair' ? '☑' : '□'}</span> 修理<br>
      <span class="checkbox">${workorder.category === 'service' && workorder.subType === 'trial_processing' ? '☑' : '□'}</span> 试加工<br>
      <span class="checkbox">${workorder.category === 'service' && workorder.subType === 'refitting' ? '☑' : '□'}</span> 改造
    </td>
    <td class="col-2"><b>作业内容：</b><br>${sr.workContent || workorder.faultDescription || ''}</td>
  </tr>
</table>

<table>
  <tr><td class="section-title" colspan="2">故障内容</td></tr>
  <tr><td colspan="2" class="content-cell">${workorder.faultDescription || ''}</td></tr>
</table>

<table>
  <tr><td class="section-title" colspan="6">故障处理过程</td></tr>
  <tr><td colspan="6" class="content-cell">${sr.repairProcess || sr.repairContent || '（详见处理记录）'}</td></tr>
</table>

<table>
  <tr><td class="section-title" colspan="2">更换配件</td></tr>
  ${(sr.replacedParts || []).length > 0 
    ? `<tr><td colspan="2">${sr.replacedParts.join('、')}</td></tr>`
    : '<tr><td colspan="2">无</td></tr>'
  }
</table>

<table>
  <tr><td class="section-title" colspan="2">机床现状</td></tr>
  <tr><td colspan="2">${sr.testResult || '已修复，可正常使用'}</td></tr>
</table>

<table>
  <tr><td class="section-title" colspan="4">签字确认</td></tr>
  <tr>
    <td class="col-2">
      <b>服务人员确认</b><br><br>
      ${signRole === 'engineer' && signImage ? `<img src="${signImage}" class="sign-img" alt="工程师签字">` : ''}
      <br>工程师：${workorder.engineerName || ''}
    </td>
    <td class="col-2">
      <b>客户确认</b><br><br>
      ${signRole === 'customer' && signImage ? `<img src="${signImage}" class="sign-img" alt="客户签字">` : ''}
      <br>客户：${workorder.customerName || ''}
    </td>
  </tr>
</table>

<p style="text-align:right;margin-top:10px;font-size:10px;color:#999;">生成时间：${d.toLocaleString('zh-CN')}</p>
</body>
</html>`
}

/**
 * 生成服务报告PDF
 * @param {Object} workorder - 工单数据
 * @param {string} signImage - 签字图片 base64
 * @param {string} signRole - 'customer' 或 'engineer'
 * @returns {Promise<string>} PDF base64 data URL
 */
export async function generateReportPdf(workorder, signImage, signRole) {
  // 创建隐藏容器
  const container = document.createElement('div')
  container.style.cssText = 'position:fixed;left:-9999px;top:0;width:794px;background:#fff;'
  container.innerHTML = buildReportHtml(workorder, signImage, signRole)
  document.body.appendChild(container)

  try {
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#fff',
      logging: false,
    })
    document.body.removeChild(container)

    const imgWidth = 210 // A4 mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width
    const pdf = new jsPDF('p', 'mm', 'a4')

    // 分页处理
    const pageHeight = 297
    let position = 0
    let leftHeight = imgHeight
    let pageNum = 0

    while (leftHeight > 0) {
      if (pageNum > 0) pdf.addPage()
      const pageImgHeight = Math.min(imgHeight - position, pageHeight - 10)
      pdf.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', 0, pageNum > 0 ? 0 : 0, imgWidth, pageImgHeight)
      position += pageHeight - 10
      leftHeight -= pageHeight - 10
      pageNum++
    }

    return pdf.output('datauristring')
  } catch (e) {
    if (container.parentNode) document.body.removeChild(container)
    console.error('PDF生成失败:', e)
    throw e
  }
}
