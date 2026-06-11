/**
 * 简单的模拟API服务器
 * 用于测试天眼查API接口
 * 
 * 启动: node mock-server.js
 * 访问: http://localhost:8080
 */

const http = require('http');
const url = require('url');

// 模拟企业数据
const mockCompanies = [
  {
    id: '123456789',
    name: '阿里巴巴（中国）有限公司',
    creditCode: '91330100799655058B',
    regNumber: '330100400015575',
    companyType: '有限责任公司(台港澳法人独资)',
    legalPersonName: '张勇',
    regCapital: '15298万美元',
    estiblishTime: '2007-03-26',
    regStatus: '存续',
    regLocation: '浙江省杭州市滨江区网商路699号',
    businessScope: '服务：软件开发、计算机系统集成、网络工程...',
    phone: '0571-85022088',
    email: 'alibaba@service.alibaba.com',
    website: 'www.alibaba.com',
    base: '浙江',
    city: '杭州',
    district: '滨江区'
  },
  {
    id: '987654321',
    name: '腾讯科技（深圳）有限公司',
    creditCode: '9144030071526726XG',
    regNumber: '440301503441058',
    companyType: '有限责任公司(台港澳法人独资)',
    legalPersonName: '马化腾',
    regCapital: '200万美元',
    estiblishTime: '1998-11-11',
    regStatus: '存续',
    regLocation: '深圳市南山区高新区科技中一路腾讯大厦35层',
    businessScope: '计算机软、硬件的设计、技术开发、销售...',
    phone: '0755-86013388',
    email: 'tencent@tencent.com',
    website: 'www.tencent.com',
    base: '广东',
    city: '深圳',
    district: '南山区'
  },
  {
    id: '111222333',
    name: '北京字节跳动科技有限公司',
    creditCode: '91110108399643349M',
    regNumber: '110108015966352',
    companyType: '有限责任公司(自然人投资或控股)',
    legalPersonName: '张利东',
    regCapital: '1000万人民币',
    estiblishTime: '2012-03-09',
    regStatus: '存续',
    regLocation: '北京市海淀区知春路甲48号2号楼10A室',
    businessScope: '技术开发、技术推广、技术转让、技术咨询、技术服务...',
    phone: '010-58341700',
    email: 'feedback@bytedance.com',
    website: 'www.bytedance.com',
    base: '北京',
    city: '北京',
    district: '海淀区'
  }
];

// 模拟企业详情
const mockCompanyDetails = {
  '123456789': {
    companyInfo: mockCompanies[0],
    shareholders: [
      { name: 'Alibaba Group Holding Limited', type: '企业法人', capital: '15298万美元', capitalPercent: '100%' }
    ],
    keyPersons: [
      { name: '张勇', position: '董事长兼总经理' },
      { name: '蔡崇信', position: '董事' }
    ],
    branches: [],
    changeRecords: [],
    riskInfo: {
      abnormalCount: 0,
      penaltyCount: 0,
      dishonestCount: 0,
      executedPersonCount: 0,
      judicialAidCount: 0
    }
  },
  '987654321': {
    companyInfo: mockCompanies[1],
    shareholders: [
      { name: '腾讯控股有限公司', type: '企业法人', capital: '200万美元', capitalPercent: '100%' }
    ],
    keyPersons: [
      { name: '马化腾', position: '董事长' },
      { name: '刘炽平', position: '董事' }
    ],
    branches: [],
    changeRecords: [],
    riskInfo: {
      abnormalCount: 0,
      penaltyCount: 0,
      dishonestCount: 0,
      executedPersonCount: 0,
      judicialAidCount: 0
    }
  }
};

const server = http.createServer((req, res) => {
  // 设置CORS头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  // 处理OPTIONS请求
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const parsedUrl = url.parse(req.url, true);
  const path = parsedUrl.pathname;

  console.log(`${new Date().toISOString()} - ${req.method} ${path}`);

  // 路由处理
  if (path === '/api/third-party/tianyancha/search' && req.method === 'POST') {
    handleSearch(req, res);
  } else if (path === '/api/third-party/tianyancha/detail' && req.method === 'POST') {
    handleDetail(req, res);
  } else if (path === '/api/third-party/tianyancha/detail-by-name' && req.method === 'GET') {
    handleDetailByName(req, res, parsedUrl.query);
  } else if (path.startsWith('/api/third-party/tianyancha/risk/') && req.method === 'GET') {
    const companyId = path.split('/').pop();
    handleRisk(req, res, companyId);
  } else {
    // 404
    res.writeHead(404);
    res.end(JSON.stringify({
      code: 404,
      message: 'Not Found',
      data: null
    }));
  }
});

// 处理搜索请求
function handleSearch(req, res) {
  let body = '';
  req.on('data', chunk => {
    body += chunk.toString();
  });
  req.on('end', () => {
    try {
      const data = JSON.parse(body);
      const keyword = data.keyword || '';
      
      // 搜索匹配的企业
      const results = mockCompanies.filter(company => 
        company.name.includes(keyword) || 
        company.legalPersonName.includes(keyword)
      );

      res.writeHead(200);
      res.end(JSON.stringify({
        code: 200,
        message: 'success',
        data: {
          total: results.length,
          companyList: results
        }
      }));
    } catch (error) {
      res.writeHead(400);
      res.end(JSON.stringify({
        code: 400,
        message: 'Bad Request: ' + error.message,
        data: null
      }));
    }
  });
}

// 处理详情请求
function handleDetail(req, res) {
  let body = '';
  req.on('data', chunk => {
    body += chunk.toString();
  });
  req.on('end', () => {
    try {
      const data = JSON.parse(body);
      const id = data.id;
      const name = data.name;

      let result = null;

      if (id) {
        result = mockCompanyDetails[id];
      } else if (name) {
        const company = mockCompanies.find(c => c.name === name);
        if (company) {
          result = mockCompanyDetails[company.id];
        }
      }

      if (result) {
        res.writeHead(200);
        res.end(JSON.stringify({
          code: 200,
          message: 'success',
          data: result
        }));
      } else {
        res.writeHead(200);
        res.end(JSON.stringify({
          code: 200,
          message: 'success',
          data: {
            companyInfo: mockCompanies[0],
            shareholders: [],
            keyPersons: [],
            branches: [],
            changeRecords: [],
            riskInfo: {
              abnormalCount: 0,
              penaltyCount: 0,
              dishonestCount: 0,
              executedPersonCount: 0,
              judicialAidCount: 0
            }
          }
        }));
      }
    } catch (error) {
      res.writeHead(400);
      res.end(JSON.stringify({
        code: 400,
        message: 'Bad Request: ' + error.message,
        data: null
      }));
    }
  });
}

// 处理根据名称获取详情
function handleDetailByName(req, res, query) {
  const companyName = query.companyName;
  
  if (!companyName) {
    res.writeHead(400);
    res.end(JSON.stringify({
      code: 400,
      message: 'Missing companyName parameter',
      data: null
    }));
    return;
  }

  const company = mockCompanies.find(c => c.name === companyName);
  
  if (company && mockCompanyDetails[company.id]) {
    res.writeHead(200);
    res.end(JSON.stringify({
      code: 200,
      message: 'success',
      data: mockCompanyDetails[company.id]
    }));
  } else {
    // 返回模拟数据
    res.writeHead(200);
    res.end(JSON.stringify({
      code: 200,
      message: 'success',
      data: {
        companyInfo: {
          id: 'mock-id',
          name: companyName,
          creditCode: '91XXXXXXXXXXXXXX',
          legalPersonName: '张三',
          regCapital: '1000万人民币',
          regStatus: '存续',
          regLocation: '北京市朝阳区',
          businessScope: '技术开发、技术服务等',
          phone: '010-12345678',
          email: 'contact@example.com',
          base: '北京',
          city: '北京市',
          district: '朝阳区'
        },
        shareholders: [
          { name: '张三', type: '自然人股东', capital: '600万人民币', capitalPercent: '60%' },
          { name: '李四', type: '自然人股东', capital: '400万人民币', capitalPercent: '40%' }
        ],
        keyPersons: [
          { name: '张三', position: '执行董事' },
          { name: '李四', position: '监事' }
        ],
        riskInfo: {
          abnormalCount: 0,
          penaltyCount: 0,
          dishonestCount: 0,
          executedPersonCount: 0,
          judicialAidCount: 0
        }
      }
    }));
  }
}

// 处理风险信息请求
function handleRisk(req, res, companyId) {
  res.writeHead(200);
  res.end(JSON.stringify({
    code: 200,
    message: 'success',
    data: {
      abnormalCount: 0,
      penaltyCount: 0,
      dishonestCount: 0,
      executedPersonCount: 0,
      judicialAidCount: 0
    }
  }));
}

const PORT = 8080;
server.listen(PORT, () => {
  console.log(`
========================================
  模拟API服务器已启动
  访问地址: http://localhost:${PORT}
  
  可用接口:
  - POST /api/third-party/tianyancha/search
  - POST /api/third-party/tianyancha/detail
  - GET  /api/third-party/tianyancha/detail-by-name?companyName=xxx
  - GET  /api/third-party/tianyancha/risk/{companyId}
  
  测试企业: 阿里巴巴、腾讯、字节跳动
========================================
  `);
});
