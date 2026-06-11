package com.service.aftersales.service;

import com.service.aftersales.dto.AmapDTO;

/**
 * 高德地图服务接口
 */
public interface AmapService {

    /**
     * 地理编码（地址转坐标）
     *
     * @param request 地理编码请求
     * @return 地理编码响应
     */
    AmapDTO.GeocodeResponse geocode(AmapDTO.GeocodeRequest request);

    /**
     * 逆地理编码（坐标转地址）
     *
     * @param request 逆地理编码请求
     * @return 逆地理编码响应
     */
    AmapDTO.RegeocodeResponse regeocode(AmapDTO.RegeocodeRequest request);

    /**
     * 路径规划（驾车）
     *
     * @param request 路径规划请求
     * @return 路径规划响应
     */
    AmapDTO.DirectionResponse direction(AmapDTO.DirectionRequest request);

    /**
     * 地点搜索
     *
     * @param request 地点搜索请求
     * @return 地点搜索响应
     */
    AmapDTO.PlaceSearchResponse placeSearch(AmapDTO.PlaceSearchRequest request);

    /**
     * 根据地址获取坐标
     *
     * @param address 地址
     * @param city    城市（可选）
     * @return 坐标点
     */
    AmapDTO.Location getLocationByAddress(String address, String city);

    /**
     * 根据坐标获取地址
     *
     * @param longitude 经度
     * @param latitude  纬度
     * @return 地址信息
     */
    AmapDTO.AddressComponent getAddressByLocation(String longitude, String latitude);

    /**
     * 计算两点间距离和路线
     *
     * @param origin      起点坐标（经度,纬度）
     * @param destination 终点坐标（经度,纬度）
     * @return 路线信息
     */
    AmapDTO.Path calculateRoute(String origin, String destination);
}
