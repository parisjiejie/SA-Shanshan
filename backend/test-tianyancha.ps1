# 天眼查API测试脚本
# 运行方式: .\test-tianyancha.ps1

$API_KEY = "86daaf15-8642-42b0-abcd-e6028d59ab1f"
$BASE_URL = "https://open.api.tianyancha.com/services/v4"

Write-Host "========== 天眼查API测试 ==========" -ForegroundColor Green
Write-Host "API Key: $($API_KEY.Substring(0,8))..."
Write-Host "Base URL: $BASE_URL"
Write-Host ""

# 测试1: 企业搜索
Write-Host "【测试1】企业搜索接口" -ForegroundColor Cyan
Write-Host "----------------------------------------"

try {
    $keyword = "阿里巴巴"
    $encodedKeyword = [System.Web.HttpUtility]::UrlEncode($keyword)
    $url = "$BASE_URL/open/suggest/v2?keyword=$encodedKeyword&pageNum=1&pageSize=5"
    
    Write-Host "请求URL: $url"
    Write-Host "关键词: $keyword"
    
    $headers = @{
        "Authorization" = $API_KEY
    }
    
    $response = Invoke-WebRequest -Uri $url -Headers $headers -Method GET -TimeoutSec 10
    
    Write-Host "HTTP状态码: $($response.StatusCode)"
    Write-Host "响应内容:"
    
    $json = $response.Content | ConvertFrom-Json
    $json | ConvertTo-Json -Depth 10
    
    if ($json.error_code -eq 0) {
        Write-Host "✅ 测试成功！API Key有效，接口正常" -ForegroundColor Green
    } else {
        Write-Host "⚠️ API返回错误: $($json.reason)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ 请求异常: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# 测试2: 企业详情
Write-Host "【测试2】企业详情接口" -ForegroundColor Cyan
Write-Host "----------------------------------------"

try {
    $companyName = "阿里巴巴（中国）有限公司"
    $encodedName = [System.Web.HttpUtility]::UrlEncode($companyName)
    $url = "$BASE_URL/open/baseinfo/v2?name=$encodedName"
    
    Write-Host "请求URL: $url"
    Write-Host "企业名称: $companyName"
    
    $headers = @{
        "Authorization" = $API_KEY
    }
    
    $response = Invoke-WebRequest -Uri $url -Headers $headers -Method GET -TimeoutSec 10
    
    Write-Host "HTTP状态码: $($response.StatusCode)"
    Write-Host "响应内容:"
    
    $json = $response.Content | ConvertFrom-Json
    $json | ConvertTo-Json -Depth 10
    
    if ($json.error_code -eq 0) {
        Write-Host "✅ 测试成功！" -ForegroundColor Green
    } else {
        Write-Host "⚠️ API返回错误: $($json.reason)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ 请求异常: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "========== 测试完成 ==========" -ForegroundColor Green
