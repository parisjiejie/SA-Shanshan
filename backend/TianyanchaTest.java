import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLEncoder;

/**
 * 天眼查API独立测试程序
 * 编译: javac TianyanchaTest.java
 * 运行: java TianyanchaTest
 */
public class TianyanchaTest {

    // 你的API Key
    private static final String API_KEY = "86daaf15-8642-42b0-abcd-e6028d59ab1f";
    private static final String BASE_URL = "https://open.api.tianyancha.com/services/v4";

    public static void main(String[] args) {
        System.out.println("========== 天眼查API测试 ==========");
        System.out.println("API Key: " + API_KEY.substring(0, 8) + "...");
        System.out.println("Base URL: " + BASE_URL);
        System.out.println();

        // 测试1: 企业搜索
        testSearchCompany();

        System.out.println();

        // 测试2: 企业详情
        testCompanyDetail();

        System.out.println();
        System.out.println("========== 测试完成 ==========");
    }

    /**
     * 测试企业搜索接口
     */
    private static void testSearchCompany() {
        System.out.println("【测试1】企业搜索接口");
        System.out.println("----------------------------------------");

        try {
            String keyword = "阿里巴巴";
            String urlString = BASE_URL + "/open/suggest/v2?keyword=" + 
                    URLEncoder.encode(keyword, "UTF-8") + "&pageNum=1&pageSize=5";

            System.out.println("请求URL: " + urlString);
            System.out.println("关键词: " + keyword);

            URL url = new URL(urlString);
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("GET");
            conn.setRequestProperty("Authorization", API_KEY);
            conn.setConnectTimeout(10000);
            conn.setReadTimeout(10000);

            int responseCode = conn.getResponseCode();
            System.out.println("HTTP状态码: " + responseCode);

            if (responseCode == 200) {
                BufferedReader reader = new BufferedReader(
                        new InputStreamReader(conn.getInputStream(), "UTF-8"));
                StringBuilder response = new StringBuilder();
                String line;
                while ((line = reader.readLine()) != null) {
                    response.append(line);
                }
                reader.close();

                String responseBody = response.toString();
                System.out.println("响应内容:");
                System.out.println(formatJson(responseBody));

                // 简单检查是否成功
                if (responseBody.contains("\"error_code\":0")) {
                    System.out.println("✅ 测试成功！API Key有效，接口正常");
                } else if (responseBody.contains("error_code")) {
                    System.out.println("⚠️ API返回错误，请检查响应内容");
                }
            } else {
                System.out.println("❌ HTTP请求失败: " + responseCode);
                BufferedReader reader = new BufferedReader(
                        new InputStreamReader(conn.getErrorStream(), "UTF-8"));
                StringBuilder error = new StringBuilder();
                String line;
                while ((line = reader.readLine()) != null) {
                    error.append(line);
                }
                reader.close();
                System.out.println("错误信息: " + error.toString());
            }

            conn.disconnect();

        } catch (Exception e) {
            System.out.println("❌ 请求异常: " + e.getMessage());
            e.printStackTrace();
        }
    }

    /**
     * 测试企业详情接口
     */
    private static void testCompanyDetail() {
        System.out.println("【测试2】企业详情接口");
        System.out.println("----------------------------------------");

        try {
            String companyName = "阿里巴巴（中国）有限公司";
            String urlString = BASE_URL + "/open/baseinfo/v2?name=" + 
                    URLEncoder.encode(companyName, "UTF-8");

            System.out.println("请求URL: " + urlString);
            System.out.println("企业名称: " + companyName);

            URL url = new URL(urlString);
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("GET");
            conn.setRequestProperty("Authorization", API_KEY);
            conn.setConnectTimeout(10000);
            conn.setReadTimeout(10000);

            int responseCode = conn.getResponseCode();
            System.out.println("HTTP状态码: " + responseCode);

            if (responseCode == 200) {
                BufferedReader reader = new BufferedReader(
                        new InputStreamReader(conn.getInputStream(), "UTF-8"));
                StringBuilder response = new StringBuilder();
                String line;
                while ((line = reader.readLine()) != null) {
                    response.append(line);
                }
                reader.close();

                String responseBody = response.toString();
                System.out.println("响应内容:");
                System.out.println(formatJson(responseBody));

                if (responseBody.contains("\"error_code\":0")) {
                    System.out.println("✅ 测试成功！");
                } else if (responseBody.contains("error_code")) {
                    System.out.println("⚠️ API返回错误，请检查响应内容");
                }
            } else {
                System.out.println("❌ HTTP请求失败: " + responseCode);
            }

            conn.disconnect();

        } catch (Exception e) {
            System.out.println("❌ 请求异常: " + e.getMessage());
            e.printStackTrace();
        }
    }

    /**
     * 简单的JSON格式化
     */
    private static String formatJson(String json) {
        StringBuilder formatted = new StringBuilder();
        int indentLevel = 0;
        boolean inQuote = false;

        for (char c : json.toCharArray()) {
            switch (c) {
                case '"':
                    inQuote = !inQuote;
                    formatted.append(c);
                    break;
                case '{':
                case '[':
                    formatted.append(c);
                    if (!inQuote) {
                        formatted.append('\n');
                        indentLevel++;
                        appendIndent(formatted, indentLevel);
                    }
                    break;
                case '}':
                case ']':
                    if (!inQuote) {
                        formatted.append('\n');
                        indentLevel--;
                        appendIndent(formatted, indentLevel);
                    }
                    formatted.append(c);
                    break;
                case ',':
                    formatted.append(c);
                    if (!inQuote) {
                        formatted.append('\n');
                        appendIndent(formatted, indentLevel);
                    }
                    break;
                case ':':
                    formatted.append(c);
                    if (!inQuote) {
                        formatted.append(' ');
                    }
                    break;
                default:
                    formatted.append(c);
            }
        }

        return formatted.toString();
    }

    private static void appendIndent(StringBuilder sb, int indentLevel) {
        for (int i = 0; i < indentLevel; i++) {
            sb.append("  ");
        }
    }
}
