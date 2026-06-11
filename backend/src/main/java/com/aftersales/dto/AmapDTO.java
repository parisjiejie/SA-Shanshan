package com.aftersales.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

/**
 * 高德地图相关DTO
 */
public class AmapDTO {

    /**
     * 地理编码请求（地址转坐标）
     */
    @Data
    public static class GeocodeRequest {
        /** 结构化地址 */
        private String address;
        /** 指定城市 */
        private String city;
        /** 返回坐标类型：gps/gcj02 */
        private String output = "json";
    }

    /**
     * 地理编码响应
     */
    @Data
    public static class GeocodeResponse {
        /** 状态码 */
        private String status;
        /** 返回结果数目 */
        private String count;
        /** 返回状态说明 */
        private String info;
        /** 地理编码信息列表 */
        private List<Geocode> geocodes;
    }

    /**
     * 地理编码信息
     */
    @Data
    public static class Geocode {
        /** 格式化地址 */
        private String formattedAddress;
        /** 国家 */
        private String country;
        /** 省份 */
        private String province;
        /** 城市 */
        private String city;
        /** 区县 */
        private String district;
        /** 街道 */
        private String street;
        /** 门牌号 */
        private String number;
        /** 区域编码 */
        private String adcode;
        /** 坐标点 */
        private String location;
        /** 匹配级别 */
        private String level;
    }

    /**
     * 逆地理编码请求（坐标转地址）
     */
    @Data
    public static class RegeocodeRequest {
        /** 经纬度坐标 */
        private String location;
        /** 返回坐标类型 */
        private String extensions = "all";
        /** 返回结果类型 */
        private String output = "json";
    }

    /**
     * 逆地理编码响应
     */
    @Data
    public static class RegeocodeResponse {
        /** 状态码 */
        private String status;
        /** 返回状态说明 */
        private String info;
        /** 逆地理编码信息 */
        private Regeocode regeocode;
    }

    /**
     * 逆地理编码信息
     */
    @Data
    public static class Regeocode {
        /** 结构化地址信息 */
        private AddressComponent addressComponent;
        /** 格式化地址 */
        private String formattedAddress;
        /** POI信息 */
        private List<Poi> pois;
        /** 道路信息 */
        private List<Road> roads;
    }

    /**
     * 地址组成要素
     */
    @Data
    public static class AddressComponent {
        /** 国家 */
        private String country;
        /** 省份 */
        private String province;
        /** 城市 */
        private String city;
        /** 区县 */
        private String district;
        /** 街道 */
        private String street;
        /** 门牌号 */
        private String streetNumber;
        /** 区域编码 */
        private String adcode;
        /** 城市编码 */
        private String citycode;
    }

    /**
     * POI信息
     */
    @Data
    public static class Poi {
        /** POI名称 */
        private String name;
        /** POI类型 */
        private String type;
        /** 距离 */
        private String distance;
        /** 方位 */
        private String direction;
        /** 地址 */
        private String address;
        /** 坐标点 */
        private String location;
        /** POI ID */
        private String id;
    }

    /**
     * 道路信息
     */
    @Data
    public static class Road {
        /** 道路名称 */
        private String name;
        /** 距离 */
        private String distance;
        /** 方位 */
        private String direction;
        /** 坐标点 */
        private String location;
    }

    /**
     * 路径规划请求
     */
    @Data
    public static class DirectionRequest {
        /** 出发点经纬度 */
        private String origin;
        /** 目的地经纬度 */
        private String destination;
        /** 驾车策略 */
        private String strategy = "0";
        /** 返回结果类型 */
        private String output = "json";
    }

    /**
     * 路径规划响应
     */
    @Data
    public static class DirectionResponse {
        /** 状态码 */
        private String status;
        /** 返回状态说明 */
        private String info;
        /** 路径规划信息 */
        private Route route;
    }

    /**
     * 路径信息
     */
    @Data
    public static class Route {
        /** 起点坐标 */
        private String origin;
        /** 终点坐标 */
        private String destination;
        /** 打车费用 */
        private String taxiCost;
        /** 路径方案列表 */
        private List<Path> paths;
    }

    /**
     * 路径方案
     */
    @Data
    public static class Path {
        /** 行驶距离（米） */
        private String distance;
        /** 预计行驶时间（秒） */
        private String duration;
        /** 导航策略 */
        private String strategy;
        /** 收费路段距离（米） */
        private String tolls;
        /** 收费金额（元） */
        private String tollDistance;
        /** 路段列表 */
        private List<Step> steps;
    }

    /**
     * 路段信息
     */
    @Data
    public static class Step {
        /** 路段说明 */
        private String instruction;
        /** 路段距离（米） */
        private String distance;
        /** 预计时间（秒） */
        private String duration;
        /** 路段坐标点串 */
        private String polyline;
    }

    /**
     * 地点搜索请求
     */
    @Data
    public static class PlaceSearchRequest {
        /** 搜索关键词 */
        private String keywords;
        /** 搜索类型 */
        private String types;
        /** 查询城市 */
        private String city;
        /** 中心点坐标（周边搜索） */
        private String location;
        /** 搜索半径（米） */
        private Integer radius = 3000;
        /** 页码 */
        private Integer page = 1;
        /** 每页数量 */
        private Integer offset = 20;
        /** 返回结果类型 */
        private String output = "json";
    }

    /**
     * 地点搜索响应
     */
    @Data
    public static class PlaceSearchResponse {
        /** 状态码 */
        private String status;
        /** 返回结果数目 */
        private String count;
        /** 返回状态说明 */
        private String info;
        /** 建议信息 */
        private Suggestion suggestion;
        /** POI列表 */
        private List<PlacePoi> pois;
    }

    /**
     * 建议信息
     */
    @Data
    public static class Suggestion {
        /** 关键词建议列表 */
        private List<String> keywords;
        /** 城市建议列表 */
        private List<String> cities;
    }

    /**
     * 地点POI
     */
    @Data
    public static class PlacePoi {
        /** POI ID */
        private String id;
        /** POI名称 */
        private String name;
        /** POI类型 */
        private String type;
        /** 电话 */
        private String tel;
        /** 方向 */
        private String direction;
        /** 距离 */
        private String distance;
        /** 坐标点 */
        private String location;
        /** 地址 */
        private String address;
        /** 区域编码 */
        private String adcode;
        /** 省份 */
        private String pname;
        /** 城市 */
        private String cityname;
        /** 区县 */
        private String adname;
    }

    /**
     * 坐标点
     */
    @Data
    public static class Location {
        /** 经度 */
        private BigDecimal longitude;
        /** 纬度 */
        private BigDecimal latitude;
    }
}
