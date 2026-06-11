# 售后管理系统 - 阿里云部署文档

> 本文档指导如何将前端系统部署到阿里云，实现外网访问和演示。

---

## 目录

1. [部署方案选择](#一部署方案选择)
2. [方案A：纯前端演示部署（推荐快速体验）](#二方案a纯前端演示部署推荐快速体验)
3. [方案B：前后端完整部署（推荐客户试用）](#三方案b前后端完整部署推荐客户试用)
4. [域名与HTTPS配置](#四域名与https配置)
5. [常见问题排查](#五常见问题排查)

---

## 一、部署方案选择

| 对比项 | 方案A：纯前端演示 | 方案B：前后端完整部署 |
|--------|------------------|----------------------|
| **适用场景** | 界面演示、功能展示 | 客户试用、完整业务流程 |
| **数据存储** | 本地存储 / Mock数据 | 真实数据库持久化 |
| **部署成本** | 低（仅需OSS/ECS） | 中（ECS + RDS） |
| **部署难度** | 简单 | 中等 |
| **维护成本** | 极低 | 中等 |

---

## 二、方案A：纯前端演示部署（推荐快速体验）

### 2.1 准备工作

**所需资源：**
- 阿里云 OSS 存储桶（推荐）或轻量应用服务器
- 一个域名（可选，用于正式演示）

### 2.2 配置 Mock 模式

编辑 `.env.production` 文件：

```bash
# 售后管理系统 - 生产环境配置（演示模式）

# API 基础地址（Mock模式下无效，但需配置）
VITE_API_BASE_URL=/api

# 应用环境
VITE_APP_ENV=production

# 启用 Mock 数据（关键配置）
VITE_USE_MOCK=true

# 关闭调试
VITE_ENABLE_DEBUG=false
```

### 2.3 构建项目

```bash
# 安装依赖
npm install

# 生产环境构建
npm run build
```

构建完成后，会生成 `dist/` 目录，包含所有静态文件。

### 2.4 部署到阿里云 OSS

#### 步骤1：创建 OSS 存储桶

1. 登录 [阿里云控制台](https://oss.console.aliyun.com/)
2. 创建存储桶（Bucket）：
   - **Bucket名称**：`your-company-aftersales`（全局唯一）
   - **地域**：选择离用户最近的地区（如华东1-杭州）
   - **存储类型**：标准存储
   - **读写权限**：公共读

#### 步骤2：配置静态网站托管

1. 进入存储桶 → **基础设置** → **静态页面**
2. 配置：
   - 默认首页：`index.html`
   - 默认404页：`index.html`（支持前端路由）

#### 步骤3：上传文件

```bash
# 使用 ossutil 工具上传
ossutil cp -r dist/ oss://your-company-aftersales/ -f

# 或使用阿里云控制台手动上传 dist 目录内所有文件
```

#### 步骤4：绑定域名（可选）

1. 进入存储桶 → **传输管理** → **域名管理**
2. 绑定你的域名，如 `demo.yourcompany.com`
3. 配置 CDN 加速（推荐）

#### 步骤5：访问

- OSS 默认域名：`http://your-company-aftersales.oss-cn-hangzhou.aliyuncs.com`
- 自定义域名：`http://demo.yourcompany.com`

---

## 三、方案B：前后端完整部署（推荐客户试用）

### 3.1 所需资源

| 资源 | 规格建议 | 用途 |
|------|----------|------|
| ECS 云服务器 | 2核4G 起步 | 部署前端 + 后端 |
| RDS MySQL | 1核1G 起步 | 数据存储 |
| 域名 + SSL证书 | - | HTTPS访问 |

### 3.2 服务器环境准备

```bash
# 1. 更新系统
sudo apt update && sudo apt upgrade -y

# 2. 安装 Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# 3. 安装 Nginx
sudo apt install -y nginx

# 4. 安装 Java 17
sudo apt install -y openjdk-17-jdk

# 5. 安装 MySQL 8.0
sudo apt install -y mysql-server
```

### 3.3 后端部署

#### 步骤1：导入数据库

```bash
# 登录 MySQL
mysql -u root -p

# 创建数据库
CREATE DATABASE aftersales CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# 导入数据（将 SQL 文件上传到服务器后执行）
mysql -u root -p aftersales < /path/to/api_tables.sql
```

#### 步骤2：配置后端环境

编辑 `backend/.env`：

```properties
# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_NAME=aftersales
DB_USERNAME=root
DB_PASSWORD=your_mysql_password

# JWT 密钥
JWT_SECRET=your_random_secret_key_here
JWT_EXPIRATION=86400000

# 文件存储
FILE_STORAGE_PATH=/var/www/aftersales/uploads

# 第三方API（按需配置）
AMAP_KEY=your_amap_key
Tianyancha_KEY=your_tianyancha_key
```

#### 步骤3：启动后端服务

```bash
cd /var/www/aftersales/backend

# 使用 Maven 打包
mvn clean package -DskipTests

# 启动服务
nohup java -jar target/after-sales-backend-1.0.0.jar > app.log 2>&1 &
```

### 3.4 前端部署

#### 步骤1：配置生产环境 API

编辑 `.env.production`：

```bash
# 指向你的后端 API 地址
VITE_API_BASE_URL=https://api.yourdomain.com/api

# 关闭 Mock
VITE_USE_MOCK=false
```

#### 步骤2：构建并上传

```bash
# 本地构建
npm run build

# 上传到服务器
scp -r dist/* root@your-server-ip:/var/www/aftersales/frontend/
```

### 3.5 Nginx 配置

创建 `/etc/nginx/sites-available/aftersales`：

```nginx
# 前端站点配置
server {
    listen 80;
    server_name demo.yourdomain.com;
    
    # 重定向到 HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name demo.yourdomain.com;
    
    # SSL 证书配置
    ssl_certificate /path/to/your/fullchain.pem;
    ssl_certificate_key /path/to/your/privkey.pem;
    
    # 前端静态文件
    location / {
        root /var/www/aftersales/frontend;
        index index.html;
        try_files $uri $uri/ /index.html;
    }
    
    # 后端 API 代理
    location /api/ {
        proxy_pass http://localhost:8080/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # 文件上传目录
    location /uploads/ {
        alias /var/www/aftersales/uploads/;
    }
}
```

启用配置：

```bash
sudo ln -s /etc/nginx/sites-available/aftersales /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 四、域名与HTTPS配置

### 4.1 域名解析

在阿里云域名控制台添加解析记录：

| 记录类型 | 主机记录 | 解析值 |
|----------|----------|--------|
| A | demo | 你的ECS公网IP |
| A | api | 你的ECS公网IP |

### 4.2 免费SSL证书（Let's Encrypt）

```bash
# 安装 certbot
sudo apt install -y certbot python3-certbot-nginx

# 申请证书
sudo certbot --nginx -d demo.yourdomain.com -d api.yourdomain.com

# 自动续期
sudo systemctl enable certbot.timer
```

---

## 五、常见问题排查

### 5.1 前端页面空白

**原因：** 资源路径错误

**解决：**
```javascript
// vite.config.js 添加 base 配置
export default defineConfig({
  base: './',  // 使用相对路径
  // ...
})
```

### 5.2 API 请求失败

**排查步骤：**
1. 检查浏览器控制台 Network 面板
2. 确认 `VITE_API_BASE_URL` 配置正确
3. 检查后端服务是否运行：`curl http://localhost:8080/api/health`
4. 检查 Nginx 代理配置

### 5.3 刷新页面404

**原因：** 前端路由刷新时服务器未返回 index.html

**解决：** 确保 Nginx 配置了 `try_files $uri $uri/ /index.html;`

### 5.4 跨域问题

**解决：** 后端已配置 CORS，如仍有问题检查：
- 后端 `WebConfig.java` 中的 allowedOrigins
- Nginx 代理配置是否正确

---

## 附录：快速部署检查清单

### 纯前端演示部署
- [ ] 配置 `VITE_USE_MOCK=true`
- [ ] 执行 `npm run build`
- [ ] 创建 OSS 存储桶
- [ ] 配置静态网站托管
- [ ] 上传 dist 文件到 OSS
- [ ] 测试访问

### 完整部署
- [ ] 购买 ECS 和 RDS
- [ ] 安装 Node.js、Java、MySQL、Nginx
- [ ] 导入数据库
- [ ] 配置并启动后端
- [ ] 构建并部署前端
- [ ] 配置 Nginx
- [ ] 配置域名解析
- [ ] 配置 SSL 证书
- [ ] 全面测试

---

## 联系与支持

部署过程中遇到问题：
1. 查看应用日志：`tail -f /var/www/aftersales/backend/app.log`
2. 查看 Nginx 日志：`sudo tail -f /var/log/nginx/error.log`
3. 检查服务状态：`sudo systemctl status nginx`

---

*文档生成时间：2026-04-28*
*适用版本：售后管理系统 v1.0.0*
