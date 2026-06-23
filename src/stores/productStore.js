import { reactive, computed } from 'vue'
import { saveProducts, getAllProducts, saveProduct as dbSaveProduct, deleteProduct as dbDeleteProduct, saveFile, deleteFile, readFileAsArrayBuffer, hasProducts, getFileBlobUrl, saveImage, deleteImage, getImageBlobUrl } from './productDB.js'

// 产品数据版本号，更新数据时递增此值以触发重新加载
const PRODUCT_DATA_VERSION = 3

const categoryTree = [
  {
    id: 'cat_machine', label: '机床・切削辅助工具', icon: 'Monitor', level: 1,
    children: [
      {
        id: 'cat_cnc', label: '加工中心', level: 2,
        children: [
          { id: 'cat_cnc_vertical', label: '立式加工中心', level: 3, productIds: ['P001', 'P002'] },
          { id: 'cat_cnc_horizontal', label: '卧式加工中心', level: 3, productIds: ['P003'] },
          { id: 'cat_cnc_ultra', label: '超高精度加工中心', level: 3, productIds: ['P004'] }
        ]
      },
      {
        id: 'cat_lathe', label: '车床', level: 2,
        children: [
          { id: 'cat_lathe_turret', label: '刀塔车床', level: 3, productIds: ['P005'] },
          { id: 'cat_lathe_swiss', label: '走心车床', level: 3, productIds: ['P006'] },
          { id: 'cat_lathe_other', label: '其他车床', level: 3, productIds: ['P007'] }
        ]
      },
      { id: 'cat_grinding', label: '磨床', level: 2, productIds: ['P008'] },
      { id: 'cat_deburring', label: '去毛刺机', level: 2, productIds: ['P009'] },
      { id: 'cat_injection', label: '注塑机', level: 2, productIds: ['P010', 'P011'] },
      { id: 'cat_cutting_tool', label: '切削刀具', level: 2, productIds: ['P012'] },
      { id: 'cat_cutting_aid', label: '切削辅助工具', level: 2, productIds: ['P013'] },
      { id: 'cat_holder', label: '刀柄', level: 2, productIds: ['P014'] },
      { id: 'cat_rotary', label: '转台', level: 2, productIds: ['P015'] },
      { id: 'cat_cam', label: '加工软件', level: 2, productIds: ['P016'] }
    ]
  },
  {
    id: 'cat_measure', label: '精密测量', icon: 'DataLine', level: 1,
    children: [
      { id: 'cat_measure_cmm', label: '三坐标测量机', level: 2, productIds: ['P017', 'P018'] },
      { id: 'cat_measure_optical', label: '光学测量仪', level: 2, productIds: ['P019', 'P020'] },
      { id: 'cat_measure_hand', label: '手持量具', level: 2, productIds: ['P021', 'P022', 'P023'] }
    ]
  },
  {
    id: 'cat_industrial', label: '产业机器工具', icon: 'SetUp', level: 1,
    children: [
      { id: 'cat_press', label: '冲床', level: 2, productIds: ['P024', 'P025'] },
      { id: 'cat_compressor', label: '空压机', level: 2, productIds: ['P026', 'P027'] },
      { id: 'cat_assembly', label: '组装工具', level: 2, productIds: ['P028', 'P029', 'P030'] }
    ]
  },
  {
    id: 'cat_environment', label: '环境产品', icon: 'WindPower', level: 1,
    children: [
      { id: 'cat_dust', label: '除尘机', level: 2, productIds: ['P031', 'P032'] },
      { id: 'cat_oilmist', label: '油雾机', level: 2, productIds: ['P033', 'P034'] },
      { id: 'cat_cabinet_ac', label: '控制柜空调', level: 2, productIds: ['P035', 'P036'] }
    ]
  },
  {
    id: 'cat_electrical', label: '机电部品', icon: 'Cpu', level: 1,
    children: [
      { id: 'cat_robot', label: '机器人', level: 2, productIds: ['P037', 'P038'] },
      { id: 'cat_actuator', label: '电动执行器', level: 2, productIds: ['P039'] },
      { id: 'cat_module', label: '模组', level: 2, productIds: ['P040'] },
      { id: 'cat_guide', label: '导轨', level: 2, productIds: ['P041'] },
      { id: 'cat_ball_screw', label: '滚珠丝杠', level: 2, productIds: ['P042'] },
      { id: 'cat_servo', label: '伺服电机', level: 2, productIds: ['P043'] },
      { id: 'cat_sensor', label: '传感器', level: 2, productIds: ['P044'] },
      { id: 'cat_coupling', label: '联轴器', level: 2, productIds: ['P045'] },
      { id: 'cat_reducer', label: '减速机', level: 2, productIds: ['P046'] }
    ]
  },
  {
    id: 'cat_iot', label: '自动化IoT', icon: 'Connection', level: 1,
    children: [
      { id: 'cat_monitor', label: '设备监控', level: 2, productIds: ['P047', 'P048'] },
      { id: 'cat_digital', label: '数字化工厂', level: 2, productIds: ['P049', 'P050'] },
      { id: 'cat_predictive', label: '预测维护', level: 2, productIds: ['P051', 'P052'] }
    ]
  }
]

const seedProducts = [
  // ===== 机床・切削辅助工具 =====
  // 加工中心 - 立式
  { id: 'P001', categoryPath: ['cat_machine', 'cat_cnc', 'cat_cnc_vertical'], name: 'Brother S300Xd1 立式加工中心', model: 'S300Xd1', brand: 'Brother兄弟', price: 580000, stock: '在售', description: 'Brother紧凑型立式加工中心，搭载30锥度主轴，换刀速度0.8秒，适用于精密小型零件高效加工。', hasPdf: false, hasImage: false, imageColor: '#3B82F6' },
  { id: 'P002', categoryPath: ['cat_machine', 'cat_cnc', 'cat_cnc_vertical'], name: 'Brother S500Xd1 立式加工中心', model: 'S500Xd1', brand: 'Brother兄弟', price: 720000, stock: '在售', description: 'Brother中型立式加工中心，X轴行程500mm，配备BT30主轴，适合汽车及电子零部件批量生产。', hasPdf: false, hasImage: false, imageColor: '#3B82F6' },
  // 加工中心 - 卧式
  { id: 'P003', categoryPath: ['cat_machine', 'cat_cnc', 'cat_cnc_horizontal'], name: 'Brother W1000Xd2 卧式加工中心', model: 'W1000Xd2', brand: 'Brother兄弟', price: 3200000, stock: '在售', description: 'Brother双托盘卧式加工中心，X轴行程1000mm，配备BT40主轴，适合中大型箱体类零件多面加工。', hasPdf: false, hasImage: false, imageColor: '#3B82F6' },
  // 加工中心 - 超高精度
  { id: 'P004', categoryPath: ['cat_machine', 'cat_cnc', 'cat_cnc_ultra'], name: 'YASDA YMC430 超高精度加工中心', model: 'YMC430', brand: 'YASDA安田', price: 4800000, stock: '预售', description: 'YASDA超高精度立式加工中心，定位精度±1μm，适用于光学模具及半导体封装模具加工。', hasPdf: false, hasImage: false, imageColor: '#3B82F6' },
  // 车床 - 刀塔
  { id: 'P005', categoryPath: ['cat_machine', 'cat_lathe', 'cat_lathe_turret'], name: 'TAKISAWA BNA42CY 刀塔车床', model: 'BNA42CY', brand: 'TAKISAWA泷泽', price: 680000, stock: '在售', description: 'TAKISAWA高刚性刀塔车床，配备Y轴功能及动力刀塔，可实现车铣复合加工，适合复杂零件一次装夹完成。', hasPdf: true, pdfName: 'BNA42CY产品技术说明书.pdf', imageColor: '#3B82F6' },
  // 车床 - 走心
  { id: 'P006', categoryPath: ['cat_machine', 'cat_lathe', 'cat_lathe_swiss'], name: 'CITIZEN Cincom A20 走心车床', model: 'Cincom A20', brand: 'CITIZEN西铁城', price: 520000, stock: '在售', description: 'CITIZEN走心式自动车床，最大加工直径20mm，5轴控制，适合细长轴类精密零件高效加工。', hasPdf: false, hasImage: false, imageColor: '#3B82F6' },
  // 车床 - 其他
  { id: 'P007', categoryPath: ['cat_machine', 'cat_lathe', 'cat_lathe_other'], name: 'MURATEC MW120ⅡC 车床', model: 'MW120ⅡC', brand: 'MURATEC村田', price: 450000, stock: '在售', description: 'MURATEC多轴自动车床，适合大批量棒料零件加工，生产效率高，运行稳定可靠。', hasPdf: false, hasImage: false, imageColor: '#3B82F6' },
  // 磨床
  { id: 'P008', categoryPath: ['cat_machine', 'cat_grinding'], name: 'OKANOTO PSG-CA1 平面磨床', model: 'PSG-CA1', brand: 'OKANOTO冈本', price: 380000, stock: '在售', description: '冈本精密平面磨床，配备液压进给系统，加工面粗糙度Ra0.2μm，适用于精密模具平面磨削。', hasPdf: false, hasImage: false, imageColor: '#3B82F6' },
  // 去毛刺机
  { id: 'P009', categoryPath: ['cat_machine', 'cat_deburring'], name: 'ROKUROKU LDW-6R-5T-700-2 去毛刺机', model: 'LDW-6R-5T-700-2', brand: 'ROKUROKU碌碌', price: 650000, stock: '在售', description: '碌碌6轴机器人去毛刺系统，搭载力控传感器，可自动适应工件曲面，实现均匀稳定的去毛刺效果。', hasPdf: false, hasImage: false, imageColor: '#3B82F6' },
  // 注塑机
  { id: 'P010', categoryPath: ['cat_machine', 'cat_injection'], name: 'YIZUMI CE-W 全电动注塑机', model: 'CE-W', brand: 'YIZUMI伊之密', price: 1580000, stock: '在售', description: '伊之密全电动注塑机，伺服驱动系统响应速度快，重复精度高，适用于精密塑料件成型。', hasPdf: false, hasImage: false, imageColor: '#3B82F6' },
  { id: 'P011', categoryPath: ['cat_machine', 'cat_injection'], name: 'Sodick A5S大机 注塑机', model: 'A5S大机', brand: 'Sodick沙迪克', price: 2200000, stock: '在售', description: '沙迪克A5S大型注塑机，V-Line锁模结构确保模板平行度，适合大型精密注塑件生产。', hasPdf: false, hasImage: false, imageColor: '#3B82F6' },
  // 切削刀具
  { id: 'P012', categoryPath: ['cat_machine', 'cat_cutting_tool'], name: 'Sumitomo BN7125/BN7115 切削刀具', model: 'BN7125/BN7115', brand: 'Sumitomo住友', price: 2800, stock: '在售', description: '住友CBN立方氮化硼刀片，BN7125适用于淬硬钢精加工，BN7115适用于铸铁高速加工，寿命长、效率高。', hasPdf: false, hasImage: false, imageColor: '#3B82F6' },
  // 切削辅助工具
  { id: 'P013', categoryPath: ['cat_machine', 'cat_cutting_aid'], name: 'METROL BMA 刀具破损检测装置', model: 'BMA', brand: 'METROL美德龙', price: 18500, stock: '在售', description: '美德龙刀具破损检测传感器，可实时监测刀具状态，防止因刀具破损导致的工件报废和设备损坏。', hasPdf: false, hasImage: false, imageColor: '#3B82F6' },
  // 刀柄
  { id: 'P014', categoryPath: ['cat_machine', 'cat_holder'], name: 'NIKKEN BT30/40/50强力自锁刀柄', model: 'BT30/40/50强力自锁', brand: 'NIKKEN日研', price: 8500, stock: '在售', description: '日研强力自锁刀柄，采用楔形锁紧机构，夹持力比传统液压刀柄提升30%，适合重切削加工。', hasPdf: false, hasImage: false, imageColor: '#3B82F6' },
  // 转台
  { id: 'P015', categoryPath: ['cat_machine', 'cat_rotary'], name: 'Kitagawa CNC260/302/321/401 数控转台', model: 'CNC260/302/321/401', brand: 'Kitagawa北川', price: 125000, stock: '在售', description: '北川数控转台系列，涵盖260mm至401mm盘面直径，配备高精度蜗轮蜗杆传动，适合4轴及5轴加工。', hasPdf: true, pdfName: 'CNC转台产品技术说明书.pdf', imageColor: '#3B82F6' },
  // 加工软件
  { id: 'P016', categoryPath: ['cat_machine', 'cat_cam'], name: 'SolidCAM 集成CAM加工软件', model: 'SolidCAM', brand: 'SolidCAM', price: 128000, stock: '在售', description: 'SolidCAM完全集成于SolidWorks的CAM软件，支持iMachining智能加工策略，可大幅缩短加工时间。', hasPdf: false, hasImage: false, imageColor: '#3B82F6' },

  // ===== 精密测量 =====
  // 三坐标测量机
  { id: 'P017', categoryPath: ['cat_measure', 'cat_measure_cmm'], name: 'MITUTOYO Crysta-Apex S 三坐标测量机', model: 'Crysta-Apex S', brand: 'MITUTOYO三丰', price: 1680000, stock: '在售', description: '三丰桥式三坐标测量机，MPEE≤1.7+3L/1000μm，配备SCAN系列测头，支持接触及扫描测量。', hasPdf: false, hasImage: false, imageColor: '#10B981' },
  { id: 'P018', categoryPath: ['cat_measure', 'cat_measure_cmm'], name: 'NAGASE NZS系列 三坐标测量机', model: 'NZS系列', brand: 'NAGASE长濑', price: 2100000, stock: '在售', description: '长濑高精度三坐标测量机，采用空气轴承导轨及碳纤维横梁，适用于精密模具及零部件全尺寸检测。', hasPdf: false, hasImage: false, imageColor: '#10B981' },
  // 光学测量仪
  { id: 'P019', categoryPath: ['cat_measure', 'cat_measure_optical'], name: 'KEYENCE IM-8000 一键式光学测量仪', model: 'IM-8000', brand: 'KEYENCE基恩士', price: 580000, stock: '在售', description: '基恩士一键式三维光学测量仪，双远心镜头实现无失真测量，可同时测量300个部位，操作简便。', hasPdf: false, hasImage: false, imageColor: '#10B981' },
  { id: 'P020', categoryPath: ['cat_measure', 'cat_measure_optical'], name: 'NIKON NEXIV 光学测量仪', model: 'NEXIV', brand: 'NIKON尼康', price: 450000, stock: '在售', description: '尼康NEXIV自动影像测量仪，配备高分辨率CCD及可编程LED照明，适合微小零件精密尺寸测量。', hasPdf: false, hasImage: false, imageColor: '#10B981' },
  // 手持量具
  { id: 'P021', categoryPath: ['cat_measure', 'cat_measure_hand'], name: 'MITUTOYO 数显千分尺', model: 'MDH-25M', brand: 'MITUTOYO三丰', price: 1580, stock: '在售', description: '三丰数显外径千分尺，分辨率0.001mm，配备防尘防水IP65等级，支持U-Wave无线数据传输。', hasPdf: false, hasImage: false, imageColor: '#10B981' },
  { id: 'P022', categoryPath: ['cat_measure', 'cat_measure_hand'], name: 'MITUTOYO 数显卡尺', model: 'CD-8ASX', brand: 'MITUTOYO三丰', price: 980, stock: '在售', description: '三丰绝对编码数显卡尺，测量范围0-200mm，分辨率0.01mm，开机无需归零操作。', hasPdf: false, hasImage: false, imageColor: '#10B981' },
  { id: 'P023', categoryPath: ['cat_measure', 'cat_measure_hand'], name: 'TESA Micro-Hite 数显测高仪', model: 'Micro-Hite 3', brand: 'TESA', price: 32000, stock: '在售', description: 'TESA数显测高仪，测量范围0-600mm，配备气动测头及2D功能，可进行高度及二维坐标测量。', hasPdf: false, hasImage: false, imageColor: '#10B981' },

  // ===== 产业机器工具 =====
  // 冲床
  { id: 'P024', categoryPath: ['cat_industrial', 'cat_press'], name: 'AIDA NC1 伺服冲床', model: 'NC1', brand: 'AIDA', price: 2800000, stock: '在售', description: 'AIDA直驱伺服冲床，滑块运动曲线可自由编程，适合高强度钢板及铝合金冲压成型。', hasPdf: false, hasImage: false, imageColor: '#F59E0B' },
  { id: 'P025', categoryPath: ['cat_industrial', 'cat_press'], name: 'KOMATSU 小松伺服冲床', model: 'H2F', brand: 'KOMATSU小松', price: 3500000, stock: '在售', description: '小松伺服直驱冲床，最大冲压能力2000kN，可实现任意滑块运动模式，适合复杂形状冲压件生产。', hasPdf: true, pdfName: '小松冲床产品技术说明书.pdf', imageColor: '#F59E0B' },
  // 空压机
  { id: 'P026', categoryPath: ['cat_industrial', 'cat_compressor'], name: 'HITACHI 日立无油螺杆空压机', model: 'DSP系列', brand: 'HITACHI日立', price: 185000, stock: '在售', description: '日立无油螺杆空压机，100%无油压缩，符合ISO8573-1 Class 0标准，适用于食品医药行业。', hasPdf: false, hasImage: false, imageColor: '#F59E0B' },
  { id: 'P027', categoryPath: ['cat_industrial', 'cat_compressor'], name: 'Atlas Copco GA系列 空压机', model: 'GA37+', brand: 'Atlas Copco', price: 156000, stock: '在售', description: 'Atlas Copco喷油螺杆空压机，配备VSD变频驱动，比定频机型节能35%，运行噪音低。', hasPdf: false, hasImage: false, imageColor: '#F59E0B' },
  // 组装工具
  { id: 'P028', categoryPath: ['cat_industrial', 'cat_assembly'], name: 'ESTIC 电动拧紧工具', model: 'ETD-C系列', brand: 'ESTIC', price: 28000, stock: '在售', description: 'ESTIC无刷电动拧紧工具，扭矩精度±2.5%，支持多种通讯协议，适合汽车零部件装配线。', hasPdf: false, hasImage: false, imageColor: '#F59E0B' },
  { id: 'P029', categoryPath: ['cat_industrial', 'cat_assembly'], name: 'BOSCH 博世电动拧紧轴', model: 'Nexo', brand: 'BOSCH博世', price: 35000, stock: '在售', description: '博世Nexo无线电动拧紧轴，内置电池及控制器，无需线缆连接，适合柔性装配工位。', hasPdf: false, hasImage: false, imageColor: '#F59E0B' },
  { id: 'P030', categoryPath: ['cat_industrial', 'cat_assembly'], name: 'DEPRAG 气动拧紧工具', model: 'MINIMAT-EC', brand: 'DEPRAG', price: 18000, stock: '在售', description: 'DEPRAG高精度气动拧紧工具，配备EC系列控制器，扭矩重复精度±1%，适合高节拍装配作业。', hasPdf: false, hasImage: false, imageColor: '#F59E0B' },

  // ===== 环境产品 =====
  // 除尘机
  { id: 'P031', categoryPath: ['cat_environment', 'cat_dust'], name: 'HITACHI 工业除尘机', model: 'CV-DP系列', brand: 'HITACHI日立', price: 45000, stock: '在售', description: '日立工业集尘机，采用脉冲反吹清灰方式，过滤效率99.9%，适合机床切削粉尘收集。', hasPdf: false, hasImage: false, imageColor: '#06B6D4' },
  { id: 'P032', categoryPath: ['cat_environment', 'cat_dust'], name: 'MITSUBISHI 三菱工业除尘机', model: 'MDC系列', brand: 'MITSUBISHI三菱', price: 38000, stock: '在售', description: '三菱工业除尘装置，配备HEPA高效过滤器，可处理微细粉尘，适用于磨削及抛光工序。', hasPdf: false, hasImage: false, imageColor: '#06B6D4' },
  // 油雾机
  { id: 'P033', categoryPath: ['cat_environment', 'cat_oilmist'], name: 'TEIKOKU 帝国油雾净化机', model: 'EMC系列', brand: 'TEIKOKU帝国', price: 32000, stock: '在售', description: '帝国油雾收集器，采用静电集尘方式，对油雾及烟雾的捕集效率达95%以上，维护成本低。', hasPdf: false, hasImage: false, imageColor: '#06B6D4' },
  { id: 'P034', categoryPath: ['cat_environment', 'cat_oilmist'], name: 'YAMAHA 油雾分离器', model: 'OMF系列', brand: 'YAMAHA雅马哈', price: 28000, stock: '在售', description: '雅马哈油雾分离器，多级过滤结构，可同时处理油雾及切削液飞溅，保持车间空气清洁。', hasPdf: false, hasImage: false, imageColor: '#06B6D4' },
  // 控制柜空调
  { id: 'P035', categoryPath: ['cat_environment', 'cat_cabinet_ac'], name: 'TEIKOKU 帝国控制柜空调', model: 'ECA系列', brand: 'TEIKOKU帝国', price: 18000, stock: '在售', description: '帝国控制柜专用空调，制冷能力800W-4000W，IP54防护等级，确保电控柜内恒温运行。', hasPdf: false, hasImage: false, imageColor: '#06B6D4' },
  { id: 'P036', categoryPath: ['cat_environment', 'cat_cabinet_ac'], name: 'RITTAL 威图控制柜空调', model: 'Blue e+', brand: 'RITTAL威图', price: 22000, stock: '在售', description: '威图Blue e+控制柜空调，采用混合技术节能75%，配备IoT远程监控功能，支持预测性维护。', hasPdf: false, hasImage: false, imageColor: '#06B6D4' },

  // ===== 机电部品 =====
  // 机器人
  { id: 'P037', categoryPath: ['cat_electrical', 'cat_robot'], name: 'YAMAHA YK-XE 水平多关节机器人', model: 'YK-XE', brand: 'YAMAHA雅马哈', price: 85000, stock: '在售', description: '雅马哈水平多关节机器人，最大搬运速度8.9m/s，重复定位精度±0.02mm，适合高速拾放作业。', hasPdf: false, hasImage: false, imageColor: '#8B5CF6' },
  { id: 'P038', categoryPath: ['cat_electrical', 'cat_robot'], name: 'YAMAHA YK400X 水平多关节机器人', model: 'YK400X', brand: 'YAMAHA雅马哈', price: 120000, stock: '在售', description: '雅马哈大负载水平多关节机器人，最大可搬重量3kg，臂长400mm，适合电子元件装配及搬运。', hasPdf: false, hasImage: false, imageColor: '#8B5CF6' },
  // 电动执行器
  { id: 'P039', categoryPath: ['cat_electrical', 'cat_actuator'], name: 'CKD ECMG系列 电动执行器', model: 'ECMG系列', brand: 'CKD喜开理', price: 35000, stock: '在售', description: 'CKD电动缸系列，滚珠丝杠驱动，推力最高达10kN，支持多点位定位，可替代气缸实现精确控制。', hasPdf: false, hasImage: false, imageColor: '#8B5CF6' },
  // 模组
  { id: 'P040', categoryPath: ['cat_electrical', 'cat_module'], name: 'THK LCMR200 直线模组', model: 'LCMR200', brand: 'THK', price: 28000, stock: '在售', description: 'THK直线运动模组，内置LM导轨及滚珠丝杠，行程可达1500mm，定位精度±0.02mm。', hasPdf: false, hasImage: false, imageColor: '#8B5CF6' },
  // 导轨
  { id: 'P041', categoryPath: ['cat_electrical', 'cat_guide'], name: 'THK HR 滚柱重负荷导轨', model: 'HR', brand: 'THK', price: 6500, stock: '在售', description: 'THK滚柱型直线导轨，采用滚柱保持器实现低摩擦及高刚性，适合机床及重负荷设备。', hasPdf: false, hasImage: false, imageColor: '#8B5CF6' },
  // 滚珠丝杠
  { id: 'P042', categoryPath: ['cat_electrical', 'cat_ball_screw'], name: 'THK 精密滚珠丝杠', model: 'BNF系列', brand: 'THK', price: 8500, stock: '在售', description: 'THK精密滚珠丝杠，C5级精度，导程精度0.01mm/300mm，适用于数控机床进给轴。', hasPdf: false, hasImage: false, imageColor: '#8B5CF6' },
  // 伺服电机
  { id: 'P043', categoryPath: ['cat_electrical', 'cat_servo'], name: 'MITSUBISHI 三菱伺服电机', model: 'MELSERVO-J5', brand: 'MITSUBISHI三菱', price: 12000, stock: '在售', description: '三菱J5系列伺服电机，支持SSCNETⅢ/H光纤通讯，分辨率268431360p/rev，响应频率3.5kHz。', hasPdf: false, hasImage: false, imageColor: '#8B5CF6' },
  // 传感器
  { id: 'P044', categoryPath: ['cat_electrical', 'cat_sensor'], name: 'KEYENCE 光纤传感器', model: 'FS-N系列', brand: 'KEYENCE基恩士', price: 4500, stock: '在售', description: '基恩士数字光纤传感器，配备智能校准功能，检测精度高，响应速度最快50μs，适合产线检测。', hasPdf: false, hasImage: false, imageColor: '#8B5CF6' },
  // 联轴器
  { id: 'P045', categoryPath: ['cat_electrical', 'cat_coupling'], name: 'NABEYA 锅屋高刚性联轴器', model: 'RCP系列', brand: 'NABEYA锅屋', price: 3200, stock: '在售', description: '锅屋精密联轴器，采用膜片式结构，零背隙，可补偿轴向及角向偏差，适合伺服电机连接。', hasPdf: false, hasImage: false, imageColor: '#8B5CF6' },
  // 减速机
  { id: 'P046', categoryPath: ['cat_electrical', 'cat_reducer'], name: 'NABETCO 精密减速机', model: 'RV系列', brand: 'NABETCO', price: 28000, stock: '在售', description: 'NABETCO RV减速机，采用摆线针轮结构，减速比最高1:185，回程间隙≤1arcmin，适合机器人关节。', hasPdf: false, hasImage: false, imageColor: '#8B5CF6' },

  // ===== 自动化IoT =====
  // 设备监控
  { id: 'P047', categoryPath: ['cat_iot', 'cat_monitor'], name: '山善 设备运行监控系统', model: 'YMC-Monitor', brand: '山善Yamazen', price: 85000, stock: '在售', description: '山善设备运行监控系统，实时采集机床运行数据，支持OEE计算及产量统计，可视化看板展示。', hasPdf: false, hasImage: false, imageColor: '#EC4899' },
  { id: 'P048', categoryPath: ['cat_iot', 'cat_monitor'], name: '山善 远程监控终端', model: 'YMC-Remote', brand: '山善Yamazen', price: 45000, stock: '在售', description: '山善远程监控终端，支持MTConnect及OPC UA协议，可接入多品牌机床，实现车间设备统一监控。', hasPdf: false, hasImage: false, imageColor: '#EC4899' },
  // 数字化工厂
  { id: 'P049', categoryPath: ['cat_iot', 'cat_digital'], name: '山善 数字化工厂平台', model: 'YMC-DF', brand: '山善Yamazen', price: 280000, stock: '在售', description: '山善数字化工厂平台，整合生产计划、设备管理、质量追溯等模块，助力工厂实现数字化转型。', hasPdf: false, hasImage: false, imageColor: '#EC4899' },
  { id: 'P050', categoryPath: ['cat_iot', 'cat_digital'], name: '山善 MES制造执行系统', model: 'YMC-MES', brand: '山善Yamazen', price: 350000, stock: '预售', description: '山善MES系统，覆盖从订单到出货的全流程管理，支持条码追溯及电子作业指导书，提升生产透明度。', hasPdf: false, hasImage: false, imageColor: '#EC4899' },
  // 预测维护
  { id: 'P051', categoryPath: ['cat_iot', 'cat_predictive'], name: '山善 预测维护系统', model: 'YMC-PdM', brand: '山善Yamazen', price: 120000, stock: '在售', description: '山善预测维护系统，基于振动及温度数据分析，AI算法提前预警设备故障，减少非计划停机。', hasPdf: false, hasImage: false, imageColor: '#EC4899' },
  { id: 'P052', categoryPath: ['cat_iot', 'cat_predictive'], name: '山善 振动诊断传感器', model: 'YMC-Vib', brand: '山善Yamazen', price: 15000, stock: '在售', description: '山善振动诊断传感器，三轴加速度检测，无线传输数据，可安装在主轴及轴承座上实时监测。', hasPdf: false, hasImage: false, imageColor: '#EC4899' }
]

const state = reactive({
  products: [],
  loaded: false,
  loading: false,
  searchKeyword: ''
})

const allProducts = computed(() => state.products)

const loading = computed(() => state.loading)
const loaded = computed(() => state.loaded)

const filteredProducts = computed(() => {
  let list = state.products
  if (state.searchKeyword) {
    const kw = state.searchKeyword.toLowerCase()
    list = list.filter(p =>
      p.name.toLowerCase().includes(kw) ||
      p.model.toLowerCase().includes(kw) ||
      p.brand.toLowerCase().includes(kw) ||
      p.description.toLowerCase().includes(kw)
    )
  }
  return list
})

function findCategoryById(id) {
  for (const l1 of categoryTree) {
    if (l1.id === id) return l1
    if (l1.children) {
      for (const l2 of l1.children) {
        if (l2.id === id) return l2
        if (l2.children) {
          for (const l3 of l2.children) {
            if (l3.id === id) return l3
          }
        }
      }
    }
  }
  return null
}

function getCategoryPath(catId) {
  const path = []
  for (const l1 of categoryTree) {
    if (l1.id === catId) { path.push(l1); return path }
    if (l1.children) {
      for (const l2 of l1.children) {
        if (l2.id === catId) { path.push(l1, l2); return path }
        if (l2.children) {
          for (const l3 of l2.children) {
            if (l3.id === catId) { path.push(l1, l2, l3); return path }
          }
        }
      }
    }
  }
  return path
}

function getCategoryLabel(catId) {
  const cat = findCategoryById(catId)
  return cat ? cat.label : catId
}

function getProductsByCategory(catId) {
  const cat = findCategoryById(catId)
  if (!cat) return []
  if (cat.level === 3 || cat.productIds) {
    const ids = cat.productIds || []
    return state.products.filter(p => ids.includes(p.id))
  }
  const allChildIds = collectAllProductIds(cat)
  return state.products.filter(p => allChildIds.includes(p.id))
}

function collectAllProductIds(cat) {
  const ids = []
  if (cat.productIds) ids.push(...cat.productIds)
  if (cat.children) {
    cat.children.forEach(child => {
      ids.push(...collectAllProductIds(child))
    })
  }
  return ids
}

function getProductsByCategoryPath(level1Id, level2Id, level3Id) {
  return state.products.filter(p => {
    if (!p.categoryPath || p.categoryPath.length === 0) return false
    if (level1Id && p.categoryPath[0] !== level1Id) return false
    if (level2Id && (p.categoryPath.length < 2 || p.categoryPath[1] !== level2Id)) return false
    if (level3Id && (p.categoryPath.length < 3 || p.categoryPath[2] !== level3Id)) return false
    return true
  })
}

function getProductById(id) {
  return state.products.find(p => p.id === id) || null
}

function setSearchKeyword(keyword) {
  state.searchKeyword = keyword
}

async function loadProducts() {
  state.loading = true
  try {
    const storedVersion = localStorage.getItem('productDataVersion')
    const needsReload = !storedVersion || Number(storedVersion) < PRODUCT_DATA_VERSION
    const has = await hasProducts()
    if (!has || needsReload) {
      await saveProducts(seedProducts)
      state.products = [...seedProducts]
      localStorage.setItem('productDataVersion', String(PRODUCT_DATA_VERSION))
      await loadDemoPdf()
    } else {
      state.products = await getAllProducts()
    }
  } catch (e) {
    console.error('加载产品数据失败:', e)
    state.products = [...seedProducts]
  }
  state.loaded = true
  state.loading = false
}

async function loadDemoPdf() {
  try {
    const response = await fetch('/demo/BNA42CY-product-guide.pdf')
    if (!response.ok) return
    const buffer = await response.arrayBuffer()
    await saveFile('P005', {
      name: 'BNA42CY产品技术说明书.pdf',
      type: 'application/pdf',
      data: buffer,
      size: buffer.byteLength
    })
  } catch (e) {
    console.error('加载演示PDF失败:', e)
  }
}

async function uploadProductPdf(productId, pdfFile) {
  const buffer = await readFileAsArrayBuffer(pdfFile)
  await saveFile(productId, {
    name: pdfFile.name,
    type: pdfFile.type,
    data: buffer,
    size: buffer.byteLength
  })
  const idx = state.products.findIndex(p => p.id === productId)
  if (idx !== -1) {
    state.products[idx].hasPdf = true
    state.products[idx].pdfName = pdfFile.name
    await saveProducts(state.products)
  }
}

async function removeProductPdf(productId) {
  await deleteFile(productId)
  const idx = state.products.findIndex(p => p.id === productId)
  if (idx !== -1) {
    state.products[idx].hasPdf = false
    state.products[idx].pdfName = ''
    await saveProducts(state.products)
  }
}

async function getPdfBlobUrl(productId) {
  return getFileBlobUrl(productId)
}

function generateId() {
  const max = state.products.reduce((m, p) => {
    const n = parseInt(p.id.replace('P', ''), 10)
    return n > m ? n : m
  }, 0)
  return 'P' + String(max + 1).padStart(3, '0')
}

async function addProduct(product) {
  product.id = product.id || generateId()
  product.hasPdf = product.hasPdf || false
  await dbSaveProduct(product)
  state.products.push(product)
  return product
}

async function updateProduct(id, data) {
  await dbSaveProduct(data)
  const idx = state.products.findIndex(p => p.id === id)
  if (idx !== -1) {
    state.products[idx] = { ...state.products[idx], ...data }
  }
}

async function removeProduct(id) {
  await dbDeleteProduct(id)
  await deleteFile(id).catch(() => {})
  await deleteImage(id).catch(() => {})
  const idx = state.products.findIndex(p => p.id === id)
  if (idx !== -1) state.products.splice(idx, 1)
}

async function uploadProductImage(productId, imageFile) {
  const buffer = await readFileAsArrayBuffer(imageFile)
  await saveImage(productId, {
    name: imageFile.name,
    type: imageFile.type,
    data: buffer,
    size: buffer.byteLength
  })
  const idx = state.products.findIndex(p => p.id === productId)
  if (idx !== -1) {
    state.products[idx].hasImage = true
    state.products[idx].imageName = imageFile.name
    await saveProducts(state.products)
  }
}

async function removeProductImage(productId) {
  await deleteImage(productId)
  const idx = state.products.findIndex(p => p.id === productId)
  if (idx !== -1) {
    state.products[idx].hasImage = false
    state.products[idx].imageName = ''
    await saveProducts(state.products)
  }
}

async function getProductImageUrl(productId) {
  return getImageBlobUrl(productId)
}

export {
  state,
  allProducts,
  filteredProducts,
  categoryTree,
  loading,
  loaded,
  findCategoryById,
  getCategoryPath,
  getCategoryLabel,
  getProductsByCategory,
  getProductsByCategoryPath,
  getProductById,
  setSearchKeyword,
  loadProducts,
  addProduct,
  updateProduct,
  removeProduct,
  uploadProductPdf,
  removeProductPdf,
  getPdfBlobUrl,
  collectAllProductIds,
  uploadProductImage,
  removeProductImage,
  getProductImageUrl
}
