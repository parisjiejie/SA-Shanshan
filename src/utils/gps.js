/**
 * GPS 定位工具
 * 使用浏览器原生 Geolocation API，后期接入百度/高德地图SDK时替换此文件即可
 */

/**
 * 获取当前位置
 * @returns {Promise<{latitude: number, longitude: number, address: string, timestamp: string}>}
 */
export function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      // 降级：返回模拟数据（开发环境无GPS时使用）
      console.warn('[GPS] 浏览器不支持定位，使用模拟位置')
      resolve({
        latitude: 31.2304,
        longitude: 121.4737,
        address: '上海市浦东新区张江高科技园区',
        timestamp: new Date().toISOString()
      })
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        // 后续接入百度/高德逆地理编码API获取地址
        // 目前使用经纬度作为地址描述
        resolve({
          latitude,
          longitude,
          address: `(${latitude.toFixed(4)}, ${longitude.toFixed(4)})`,
          timestamp: new Date(position.timestamp).toISOString()
        })
      },
      (error) => {
        console.warn('[GPS] 定位失败:', error.message, '使用模拟位置')
        // 降级：返回模拟数据
        resolve({
          latitude: 31.2304,
          longitude: 121.4737,
          address: '上海市浦东新区张江高科技园区',
          timestamp: new Date().toISOString()
        })
      },
      {
        enableHighAccuracy: false,
        timeout: 5000,
        maximumAge: 300000
      }
    )
  })
}
