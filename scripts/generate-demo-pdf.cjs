const { jsPDF } = require('jspdf')
const path = require('path')
const fs = require('fs')

const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

const pageWidth = doc.internal.pageSize.getWidth()

const addPageNumber = () => {
  const pages = doc.internal.getNumberOfPages()
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i)
    doc.setFontSize(9)
    doc.setTextColor(150)
    doc.text(`${i} / ${pages}`, pageWidth / 2, 287, { align: 'center' })
  }
}

// --- 封面 ---
doc.setFillColor(0, 82, 148)
doc.rect(0, 0, pageWidth, 60, 'F')
doc.setFontSize(24)
doc.setTextColor(255, 255, 255)
doc.text('山 YAMAZEN', 20, 25)
doc.setFontSize(12)
doc.text('产品技术说明书', 20, 40)

doc.setFontSize(20)
doc.setTextColor(40, 40, 40)
doc.text('5轴立式加工中心', 20, 85)
doc.setFontSize(14)
doc.text('型号：YZ-VMC850-5X', 20, 100)

doc.setDrawColor(0, 82, 148)
doc.setLineWidth(0.8)
doc.line(20, 110, 190, 110)

doc.setFontSize(11)
doc.setTextColor(80)
const coverLines = [
  '本产品为山善自主研发的高精度五轴联动立式加工中心，',
  '适用于复杂曲面零件的高效精密加工，广泛应用于航空航天、',
  '汽车模具、医疗器械等行业。',
  '',
  '五轴联动控制 | 高刚性结构 | 12000rpm高速主轴',
  '全封闭防护 | 自动排屑 | 智能润滑系统'
]
coverLines.forEach((line, i) => {
  doc.text(line, 20, 125 + i * 8)
})

doc.setFontSize(10)
doc.setTextColor(120)
doc.text('山善贸易（上海）有限公司', 20, 230)
doc.text('文档编号：YZ-DOC-2026-001', 20, 238)
doc.text('版本：V1.0 | 2026年6月', 20, 246)

doc.setDrawColor(0, 82, 148)
doc.setLineWidth(2)
doc.line(20, 255, 80, 255)

// --- 第1章：产品概述 ---
doc.addPage()
doc.setFontSize(18)
doc.setTextColor(0, 82, 148)
doc.text('1. 产品概述', 20, 30)
doc.setDrawColor(0, 82, 148)
doc.setLineWidth(0.5)
doc.line(20, 34, 190, 34)

doc.setFontSize(11)
doc.setTextColor(50)
const overview = [
  'YZ-VMC850-5X型五轴立式加工中心是山善新一代高性能数控机床，',
  '采用高刚性龙门式结构设计，配备德国进口精密五轴转台，实现',
  'X/Y/Z/A/C五轴联动控制。适用于各种复杂曲面零件、叶轮叶片、',
  '模具型腔等的高精度加工需求。',
  '',
  '机床主体采用优质铸铁整体铸造，经多次人工时效处理，结构稳定、',
  '抗振性能优异。三轴均采用精密滚珠丝杆及直线导轨，配合大功率',
  '伺服电机驱动，确保高速加工时的定位精度和重复定位精度。',
  '',
  '配备FANUC 0i-MF Plus五轴联动数控系统，支持RTCP刀尖跟随、',
  '倾斜面加工等高级功能，编程简便、操作直观。'
]
overview.forEach((line, i) => {
  doc.text(line, 20, 52 + i * 8)
})

// --- 第2章：技术参数 ---
doc.addPage()
doc.setFontSize(18)
doc.setTextColor(0, 82, 148)
doc.text('2. 技术参数', 20, 30)
doc.line(20, 34, 190, 34)

const specs = [
  ['工作台尺寸（长×宽）', '1000mm × 500mm'],
  ['T型槽（槽数×槽宽×间距）', '5×18mm×100mm'],
  ['工作台最大承重', '600kg'],
  ['X轴行程', '850mm'],
  ['Y轴行程', '520mm'],
  ['Z轴行程', '550mm'],
  ['A轴摆角', '±120°'],
  ['C轴回转角度', '360°（连续）'],
  ['主轴转速', '100~12000 rpm'],
  ['主轴锥孔', 'BT40'],
  ['主轴功率', '11/15 kW（连续/30min）'],
  ['快速移动速度（X/Y/Z）', '48/48/36 m/min'],
  ['切削进给速度', '1~20000 mm/min'],
  ['刀库容量', '24把（刀臂式）'],
  ['最大刀具直径', 'φ80mm（邻空φ125mm）'],
  ['最大刀具长度', '300mm'],
  ['定位精度', '±0.003mm'],
  ['重复定位精度', '±0.002mm'],
  ['A/C轴定位精度', '±5 arc-sec'],
  ['控制系统', 'FANUC 0i-MF Plus（5轴联动）'],
  ['机床重量', '约7500kg'],
  ['外形尺寸（长×宽×高）', '3500mm × 2700mm × 3100mm'],
  ['电源要求', 'AC380V，50Hz，30kVA'],
  ['气源要求', '0.5~0.7 MPa，200L/min']
]

doc.setFillColor(0, 82, 148)
doc.setTextColor(255, 255, 255)
doc.rect(20, 40, 170, 10, 'F')
doc.setFontSize(10)
doc.text('参数项目', 24, 47.5)
doc.text('规格值', 120, 47.5)

doc.setTextColor(50)
specs.forEach((row, i) => {
  const y = 54 + i * 8.5
  const isEven = i % 2 === 0
  if (isEven) {
    doc.setFillColor(245, 247, 250)
    doc.rect(20, y - 3.5, 170, 8, 'F')
  }
  doc.setFontSize(9)
  doc.text(row[0], 24, y + 1)
  doc.text(row[1], 120, y + 1)
})

// --- 第3章：结构特点 ---
doc.addPage()
doc.setFontSize(18)
doc.setTextColor(0, 82, 148)
doc.text('3. 结构特点', 20, 30)
doc.line(20, 34, 190, 34)

const features = [
  ['3.1 床身与立柱', '床身和立柱采用优质灰铸铁HT300整体铸造，经过两次人工时效和振动时效处理，有效消除铸造内应力，长期使用不变形。立柱采用龙门式对称结构，重心低、刚性高，确保重切削时的稳定性。'],
  ['3.2 主轴系统', '采用台湾进口高速精密主轴单元，最高转速12000rpm，采用P4级高精度角接触陶瓷球轴承，油气润滑方式。主轴电机通过直联方式驱动，减少传动间隙，实现高速高精加工。主轴锥孔BT40，标配主轴油冷机，有效控制热变形。'],
  ['3.3 进给系统', '三轴均采用C3级精密滚珠丝杆和45mm宽精密线性导轨。X/Y/Z轴分别由大功率伺服电机通过联轴器直联驱动。丝杆两端采用高精度角接触轴承支撑并预拉伸，消除热伸长影响。'],
  ['3.4 五轴转台', 'A/C轴采用德国进口精密蜗轮蜗杆机构，配备海德汉圆光栅反馈，实现高精度角度定位。C轴支持360°连续回转，A轴摆动范围±120°。转台台面直径φ250mm，标配气动夹紧装置。'],
  ['3.5 刀库系统', '24工位刀臂式自动换刀装置，刀对刀换刀时间仅1.8秒。刀库采用伺服电机驱动，定位准确可靠，支持刀具寿命管理和断刀检测功能。'],
  ['3.6 冷却与排屑', '配置大流量冷却系统，主轴环绕喷淋冷却+中心出水冷却。前部两侧螺旋排屑器+后部链板式排屑器，实现高效排屑。水箱容量400L，配备油水分离器。'],
  ['3.7 防护系统', '全封闭式防护罩，采用三层防护结构；前门为气动互锁安全门，侧面配加大观察窗方便操作监控。内置LED机床照明灯和三色报警灯，符合CE安全标准。'],
]

features.forEach((f, fi) => {
  const y = 50 + fi * 34
  doc.setFontSize(12)
  doc.setTextColor(0, 82, 148)
  doc.text(f[0], 20, y)
  doc.setFontSize(10)
  doc.setTextColor(60)
  const lines = doc.splitTextToSize(f[1], 170)
  lines.forEach((l, li) => {
    doc.text(l, 20, y + 7 + li * 6)
  })
})

// --- 第4章：安装与调试 ---
doc.addPage()
doc.setFontSize(18)
doc.setTextColor(0, 82, 148)
doc.text('4. 安装与调试', 20, 30)
doc.line(20, 34, 190, 34)

const install = [
  ['4.1 地基要求', '机床需安装在专用混凝土基础上，基础厚度≥400mm，表面平整度≤3mm/m²。安装区域远离冲压设备、振动源和强电磁干扰源，环境温度应保持在15~35°C之间，湿度≤80%。'],
  ['4.2 吊装与运输', '机床采用四点吊装方式，必须使用专用吊具和适配吊环螺栓。起吊前确认各活动部件已锁紧固定，吊运过程中严禁人员站在机床下方。运输车辆需具备足够的载重能力和减震装置。'],
  ['4.3 电气连接', '供电须为独立电源回路，电源容量≥30kVA，配备专用断路器和漏电保护装置。必须可靠接地，接地电阻≤4Ω。数控系统需配置UPS不间断电源，防止突然断电损坏系统。'],
  ['4.4 气源要求', '压缩空气需经过冷冻干燥和精密过滤处理，保证无油无水。供气压力0.5~0.7MPa，流量≥200L/min。进气管路建议采用镀锌钢管或铝合金管，管径≥DN20。'],
  ['4.5 调试验收', '安装完成后进行水平调试（精度0.02mm/m），几何精度检测符合JB/T 8771.2标准，定位精度检测使用激光干涉仪。试切件验收按照NAS 979标准进行五轴联动精度验证。'],
]

install.forEach((item, fi) => {
  const y = 50 + fi * 42
  doc.setFontSize(12)
  doc.setTextColor(0, 82, 148)
  doc.text(item[0], 20, y)
  doc.setFontSize(10)
  doc.setTextColor(60)
  const lines = doc.splitTextToSize(item[1], 170)
  lines.forEach((l, li) => {
    doc.text(l, 20, y + 7 + li * 6)
  })
})

// --- 第5章：维护保养 ---
doc.addPage()
doc.setFontSize(18)
doc.setTextColor(0, 82, 148)
doc.text('5. 日常维护与保养', 20, 30)
doc.line(20, 34, 190, 34)

const tableHeaders = ['保养项目', '周期', '操作内容', '责任人']
const tableCols = [42, 24, 90, 24]
const tableData = [
  ['主轴冷却油位', '每班', '检查冷却油箱油位，不足时补充指定型号冷却油', '操作工'],
  ['气源三联件排水', '每班', '排空过滤器积水，检查油雾器油量', '操作工'],
  ['导轨润滑', '每班', '确认自动润滑泵工作正常，管路无泄漏', '操作工'],
  ['切屑清理', '每班', '清理工作台、防护罩内切屑，清洁排屑器', '操作工'],
  ['主轴锥孔清洁', '每周', '用专用清洁棒清理主轴锥孔，检查拉爪状态', '操作工'],
  ['刀库清洁检查', '每周', '清理刀套和换刀臂，检查刀具夹持力', '操作工'],
  ['冷却液更换', '每月', '排放旧冷却液，清洗水箱并补充新液', '维修工'],
  ['各轴间隙检查', '每季度', '使用千分表检查反向间隙，必要时补偿', '维修工'],
  ['精度校准', '每半年', '使用激光干涉仪进行定位精度检测与补偿', '厂家/维修工'],
  ['主轴精度检测', '每年', '检测主轴跳动及动平衡状态', '厂家工程师'],
]

// 表头
doc.setFillColor(0, 82, 148)
doc.setTextColor(255, 255, 255)
doc.setFontSize(9)
let xPos = 20
tableHeaders.forEach((h, i) => {
  doc.rect(xPos, 44, tableCols[i], 9, 'F')
  doc.text(h, xPos + 2, 50.5)
  xPos += tableCols[i]
})

// 表格行
doc.setTextColor(50)
tableData.forEach((row, ri) => {
  const y = 56 + ri * 13
  const isEvenRow = ri % 2 === 0
  if (isEvenRow) {
    doc.setFillColor(245, 247, 250)
    let colX = 20
    tableCols.forEach((w, ci) => {
      doc.rect(colX, y - 2, w, 12, 'F')
      colX += w
    })
  }
  doc.setFontSize(8)
  let colX = 20
  row.forEach((cell, ci) => {
    doc.text(cell, colX + 2, y + 3)
    colX += tableCols[ci]
  })
})

// --- 页尾 ---
addPageNumber()

// 输出
const outputPath = path.join(__dirname, '..', 'public', 'demo', 'YZ-VMC850-5X-product-guide.pdf')
const dir = path.dirname(outputPath)
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true })
}
doc.save(outputPath)
console.log('PDF generated:', outputPath)
