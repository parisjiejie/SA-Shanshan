package com.service.aftersales.service.impl;

import cn.hutool.http.HttpRequest;
import cn.hutool.http.HttpResponse;
import cn.hutool.json.JSONArray;
import cn.hutool.json.JSONObject;
import cn.hutool.json.JSONUtil;
import com.service.aftersales.config.ThirdPartyApiConfig;
import com.service.aftersales.dto.AmapDTO;
import com.service.aftersales.service.AmapService;
import com.service.aftersales.service.ApiCallLogService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

/**
 * 高德地图服务实现
 */
@Slf4j
@Service
public class AmapServiceImpl implements AmapService {

    @Autowired
    private ThirdPartyApiConfig apiConfig;

    @Autowired
    private ApiCallLogService apiCallLogService;

    private static final String API_TYPE = "AMAP";

    @Override
    public AmapDTO.GeocodeResponse geocode(AmapDTO.GeocodeRequest request) {
        long startTime = System.currentTimeMillis();
        String apiName = "geocode";
        String requestParams = JSONUtil.toJsonStr(request);
        String responseData = null;
        Integer status = 0;
        String errorMsg = null;

        try {
            if (!apiConfig.getAmap().isEnabled()) {
                errorMsg = "高德地图服务未启用";
                log.warn(errorMsg);
                return createMockGeocodeResponse(request);
            }

            String url = apiConfig.getAmap().getBaseUrl() + "/geocode/geo";

            HttpResponse response = HttpRequest.get(url)
                    .form("key", apiConfig.getAmap().getKey())
                    .form("address", request.getAddress())
                    .form("city", request.getCity())
                    .form("output", request.getOutput())
                    .timeout(apiConfig.getAmap().getConnectTimeout())
                    .execute();

            responseData = response.body();

            if (response.getStatus() == 200) {
                JSONObject json = JSONUtil.parseObj(responseData);
                if ("1".equals(json.getStr("status"))) {
                    status = 1;
                    return parseGeocodeResponse(json);
                } else {
                    errorMsg = json.getStr("info");
                    log.error("高德地理编码失败: {}", errorMsg);
                }
            } else {
                errorMsg = "HTTP " + response.getStatus();
                log.error("高德请求失败: {}", errorMsg);
            }
        } catch (Exception e) {
            errorMsg = e.getMessage();
            log.error("高德地理编码异常", e);
        } finally {
            int costTime = (int) (System.currentTimeMillis() - startTime);
            apiCallLogService.logApiCall(API_TYPE, apiName, requestParams, responseData, status, errorMsg, costTime);
        }

        return createMockGeocodeResponse(request);
    }

    @Override
    public AmapDTO.RegeocodeResponse regeocode(AmapDTO.RegeocodeRequest request) {
        long startTime = System.currentTimeMillis();
        String apiName = "regeocode";
        String requestParams = JSONUtil.toJsonStr(request);
        String responseData = null;
        Integer status = 0;
        String errorMsg = null;

        try {
            if (!apiConfig.getAmap().isEnabled()) {
                errorMsg = "高德地图服务未启用";
                log.warn(errorMsg);
                return createMockRegeocodeResponse(request);
            }

            String url = apiConfig.getAmap().getBaseUrl() + "/geocode/regeo";

            HttpResponse response = HttpRequest.get(url)
                    .form("key", apiConfig.getAmap().getKey())
                    .form("location", request.getLocation())
                    .form("extensions", request.getExtensions())
                    .form("output", request.getOutput())
                    .timeout(apiConfig.getAmap().getConnectTimeout())
                    .execute();

            responseData = response.body();

            if (response.getStatus() == 200) {
                JSONObject json = JSONUtil.parseObj(responseData);
                if ("1".equals(json.getStr("status"))) {
                    status = 1;
                    return parseRegeocodeResponse(json);
                } else {
                    errorMsg = json.getStr("info");
                    log.error("高德逆地理编码失败: {}", errorMsg);
                }
            } else {
                errorMsg = "HTTP " + response.getStatus();
                log.error("高德请求失败: {}", errorMsg);
            }
        } catch (Exception e) {
            errorMsg = e.getMessage();
            log.error("高德逆地理编码异常", e);
        } finally {
            int costTime = (int) (System.currentTimeMillis() - startTime);
            apiCallLogService.logApiCall(API_TYPE, apiName, requestParams, responseData, status, errorMsg, costTime);
        }

        return createMockRegeocodeResponse(request);
    }

    @Override
    public AmapDTO.DirectionResponse direction(AmapDTO.DirectionRequest request) {
        long startTime = System.currentTimeMillis();
        String apiName = "direction";
        String requestParams = JSONUtil.toJsonStr(request);
        String responseData = null;
        Integer status = 0;
        String errorMsg = null;

        try {
            if (!apiConfig.getAmap().isEnabled()) {
                errorMsg = "高德地图服务未启用";
                log.warn(errorMsg);
                return createMockDirectionResponse(request);
            }

            String url = apiConfig.getAmap().getBaseUrl() + "/direction/driving";

            HttpResponse response = HttpRequest.get(url)
                    .form("key", apiConfig.getAmap().getKey())
                    .form("origin", request.getOrigin())
                    .form("destination", request.getDestination())
                    .form("strategy", request.getStrategy())
                    .form("output", request.getOutput())
                    .timeout(apiConfig.getAmap().getConnectTimeout())
                    .execute();

            responseData = response.body();

            if (response.getStatus() == 200) {
                JSONObject json = JSONUtil.parseObj(responseData);
                if ("1".equals(json.getStr("status"))) {
                    status = 1;
                    return parseDirectionResponse(json);
                } else {
                    errorMsg = json.getStr("info");
                    log.error("高德路径规划失败: {}", errorMsg);
                }
            } else {
                errorMsg = "HTTP " + response.getStatus();
                log.error("高德请求失败: {}", errorMsg);
            }
        } catch (Exception e) {
            errorMsg = e.getMessage();
            log.error("高德路径规划异常", e);
        } finally {
            int costTime = (int) (System.currentTimeMillis() - startTime);
            apiCallLogService.logApiCall(API_TYPE, apiName, requestParams, responseData, status, errorMsg, costTime);
        }

        return createMockDirectionResponse(request);
    }

    @Override
    public AmapDTO.PlaceSearchResponse placeSearch(AmapDTO.PlaceSearchRequest request) {
        long startTime = System.currentTimeMillis();
        String apiName = "placeSearch";
        String requestParams = JSONUtil.toJsonStr(request);
        String responseData = null;
        Integer status = 0;
        String errorMsg = null;

        try {
            if (!apiConfig.getAmap().isEnabled()) {
                errorMsg = "高德地图服务未启用";
                log.warn(errorMsg);
                return createMockPlaceSearchResponse(request);
            }

            String url = apiConfig.getAmap().getBaseUrl() + "/place/text";

            HttpResponse response = HttpRequest.get(url)
                    .form("key", apiConfig.getAmap().getKey())
                    .form("keywords", request.getKeywords())
                    .form("types", request.getTypes())
                    .form("city", request.getCity())
                    .form("page", request.getPage())
                    .form("offset", request.getOffset())
                    .form("output", request.getOutput())
                    .timeout(apiConfig.getAmap().getConnectTimeout())
                    .execute();

            responseData = response.body();

            if (response.getStatus() == 200) {
                JSONObject json = JSONUtil.parseObj(responseData);
                if ("1".equals(json.getStr("status"))) {
                    status = 1;
                    return parsePlaceSearchResponse(json);
                } else {
                    errorMsg = json.getStr("info");
                    log.error("高德地点搜索失败: {}", errorMsg);
                }
            } else {
                errorMsg = "HTTP " + response.getStatus();
                log.error("高德请求失败: {}", errorMsg);
            }
        } catch (Exception e) {
            errorMsg = e.getMessage();
            log.error("高德地点搜索异常", e);
        } finally {
            int costTime = (int) (System.currentTimeMillis() - startTime);
            apiCallLogService.logApiCall(API_TYPE, apiName, requestParams, responseData, status, errorMsg, costTime);
        }

        return createMockPlaceSearchResponse(request);
    }

    @Override
    public AmapDTO.Location getLocationByAddress(String address, String city) {
        AmapDTO.GeocodeRequest request = new AmapDTO.GeocodeRequest();
        request.setAddress(address);
        request.setCity(city);

        AmapDTO.GeocodeResponse response = geocode(request);
        if (response.getGeocodes() != null && !response.getGeocodes().isEmpty()) {
            String location = response.getGeocodes().get(0).getLocation();
            String[] coords = location.split(",");
            if (coords.length == 2) {
                AmapDTO.Location loc = new AmapDTO.Location();
                loc.setLongitude(new BigDecimal(coords[0]));
                loc.setLatitude(new BigDecimal(coords[1]));
                return loc;
            }
        }
        return null;
    }

    @Override
    public AmapDTO.AddressComponent getAddressByLocation(String longitude, String latitude) {
        AmapDTO.RegeocodeRequest request = new AmapDTO.RegeocodeRequest();
        request.setLocation(longitude + "," + latitude);

        AmapDTO.RegeocodeResponse response = regeocode(request);
        if (response.getRegeocode() != null) {
            return response.getRegeocode().getAddressComponent();
        }
        return null;
    }

    @Override
    public AmapDTO.Path calculateRoute(String origin, String destination) {
        AmapDTO.DirectionRequest request = new AmapDTO.DirectionRequest();
        request.setOrigin(origin);
        request.setDestination(destination);

        AmapDTO.DirectionResponse response = direction(request);
        if (response.getRoute() != null && response.getRoute().getPaths() != null && !response.getRoute().getPaths().isEmpty()) {
            return response.getRoute().getPaths().get(0);
        }
        return null;
    }

    // ========== 解析响应方法 ==========

    private AmapDTO.GeocodeResponse parseGeocodeResponse(JSONObject json) {
        AmapDTO.GeocodeResponse response = new AmapDTO.GeocodeResponse();
        response.setStatus(json.getStr("status"));
        response.setCount(json.getStr("count"));
        response.setInfo(json.getStr("info"));

        JSONArray geocodes = json.getJSONArray("geocodes");
        if (geocodes != null) {
            List<AmapDTO.Geocode> geocodeList = new ArrayList<>();
            for (int i = 0; i < geocodes.size(); i++) {
                JSONObject item = geocodes.getJSONObject(i);
                AmapDTO.Geocode geocode = new AmapDTO.Geocode();
                geocode.setFormattedAddress(item.getStr("formatted_address"));
                geocode.setCountry(item.getStr("country"));
                geocode.setProvince(item.getStr("province"));
                geocode.setCity(item.getStr("city"));
                geocode.setDistrict(item.getStr("district"));
                geocode.setStreet(item.getStr("street"));
                geocode.setNumber(item.getStr("number"));
                geocode.setAdcode(item.getStr("adcode"));
                geocode.setLocation(item.getStr("location"));
                geocode.setLevel(item.getStr("level"));
                geocodeList.add(geocode);
            }
            response.setGeocodes(geocodeList);
        }

        return response;
    }

    private AmapDTO.RegeocodeResponse parseRegeocodeResponse(JSONObject json) {
        AmapDTO.RegeocodeResponse response = new AmapDTO.RegeocodeResponse();
        response.setStatus(json.getStr("status"));
        response.setInfo(json.getStr("info"));

        JSONObject regeocodeJson = json.getJSONObject("regeocode");
        if (regeocodeJson != null) {
            AmapDTO.Regeocode regeocode = new AmapDTO.Regeocode();
            regeocode.setFormattedAddress(regeocodeJson.getStr("formatted_address"));

            // 解析地址组成要素
            JSONObject addressComponentJson = regeocodeJson.getJSONObject("addressComponent");
            if (addressComponentJson != null) {
                AmapDTO.AddressComponent addressComponent = new AmapDTO.AddressComponent();
                addressComponent.setCountry(addressComponentJson.getStr("country"));
                addressComponent.setProvince(addressComponentJson.getStr("province"));
                addressComponent.setCity(addressComponentJson.getStr("city"));
                addressComponent.setDistrict(addressComponentJson.getStr("district"));
                addressComponent.setStreet(addressComponentJson.getStr("street"));
                addressComponent.setStreetNumber(addressComponentJson.getStr("streetNumber"));
                addressComponent.setAdcode(addressComponentJson.getStr("adcode"));
                addressComponent.setCitycode(addressComponentJson.getStr("citycode"));
                regeocode.setAddressComponent(addressComponent);
            }

            // 解析POI信息
            JSONArray pois = regeocodeJson.getJSONArray("pois");
            if (pois != null) {
                List<AmapDTO.Poi> poiList = new ArrayList<>();
                for (int i = 0; i < pois.size(); i++) {
                    JSONObject item = pois.getJSONObject(i);
                    AmapDTO.Poi poi = new AmapDTO.Poi();
                    poi.setName(item.getStr("name"));
                    poi.setType(item.getStr("type"));
                    poi.setDistance(item.getStr("distance"));
                    poi.setDirection(item.getStr("direction"));
                    poi.setAddress(item.getStr("address"));
                    poi.setLocation(item.getStr("location"));
                    poi.setId(item.getStr("id"));
                    poiList.add(poi);
                }
                regeocode.setPois(poiList);
            }

            // 解析道路信息
            JSONArray roads = regeocodeJson.getJSONArray("roads");
            if (roads != null) {
                List<AmapDTO.Road> roadList = new ArrayList<>();
                for (int i = 0; i < roads.size(); i++) {
                    JSONObject item = roads.getJSONObject(i);
                    AmapDTO.Road road = new AmapDTO.Road();
                    road.setName(item.getStr("name"));
                    road.setDistance(item.getStr("distance"));
                    road.setDirection(item.getStr("direction"));
                    road.setLocation(item.getStr("location"));
                    roadList.add(road);
                }
                regeocode.setRoads(roadList);
            }

            response.setRegeocode(regeocode);
        }

        return response;
    }

    private AmapDTO.DirectionResponse parseDirectionResponse(JSONObject json) {
        AmapDTO.DirectionResponse response = new AmapDTO.DirectionResponse();
        response.setStatus(json.getStr("status"));
        response.setInfo(json.getStr("info"));

        JSONObject routeJson = json.getJSONObject("route");
        if (routeJson != null) {
            AmapDTO.Route route = new AmapDTO.Route();
            route.setOrigin(routeJson.getStr("origin"));
            route.setDestination(routeJson.getStr("destination"));
            route.setTaxiCost(routeJson.getStr("taxi_cost"));

            JSONArray paths = routeJson.getJSONArray("paths");
            if (paths != null) {
                List<AmapDTO.Path> pathList = new ArrayList<>();
                for (int i = 0; i < paths.size(); i++) {
                    JSONObject item = paths.getJSONObject(i);
                    AmapDTO.Path path = new AmapDTO.Path();
                    path.setDistance(item.getStr("distance"));
                    path.setDuration(item.getStr("duration"));
                    path.setStrategy(item.getStr("strategy"));
                    path.setTolls(item.getStr("tolls"));
                    path.setTollDistance(item.getStr("toll_distance"));

                    // 解析路段信息
                    JSONArray steps = item.getJSONArray("steps");
                    if (steps != null) {
                        List<AmapDTO.Step> stepList = new ArrayList<>();
                        for (int j = 0; j < steps.size(); j++) {
                            JSONObject stepItem = steps.getJSONObject(j);
                            AmapDTO.Step step = new AmapDTO.Step();
                            step.setInstruction(stepItem.getStr("instruction"));
                            step.setDistance(stepItem.getStr("distance"));
                            step.setDuration(stepItem.getStr("duration"));
                            step.setPolyline(stepItem.getStr("polyline"));
                            stepList.add(step);
                        }
                        path.setSteps(stepList);
                    }

                    pathList.add(path);
                }
                route.setPaths(pathList);
            }

            response.setRoute(route);
        }

        return response;
    }

    private AmapDTO.PlaceSearchResponse parsePlaceSearchResponse(JSONObject json) {
        AmapDTO.PlaceSearchResponse response = new AmapDTO.PlaceSearchResponse();
        response.setStatus(json.getStr("status"));
        response.setCount(json.getStr("count"));
        response.setInfo(json.getStr("info"));

        // 解析建议信息
        JSONObject suggestionJson = json.getJSONObject("suggestion");
        if (suggestionJson != null) {
            AmapDTO.Suggestion suggestion = new AmapDTO.Suggestion();
            suggestion.setKeywords(suggestionJson.getBeanList("keywords", String.class));
            suggestion.setCities(suggestionJson.getBeanList("cities", String.class));
            response.setSuggestion(suggestion);
        }

        // 解析POI列表
        JSONArray pois = json.getJSONArray("pois");
        if (pois != null) {
            List<AmapDTO.PlacePoi> poiList = new ArrayList<>();
            for (int i = 0; i < pois.size(); i++) {
                JSONObject item = pois.getJSONObject(i);
                AmapDTO.PlacePoi poi = new AmapDTO.PlacePoi();
                poi.setId(item.getStr("id"));
                poi.setName(item.getStr("name"));
                poi.setType(item.getStr("type"));
                poi.setTel(item.getStr("tel"));
                poi.setDirection(item.getStr("direction"));
                poi.setDistance(item.getStr("distance"));
                poi.setLocation(item.getStr("location"));
                poi.setAddress(item.getStr("address"));
                poi.setAdcode(item.getStr("adcode"));
                poi.setPname(item.getStr("pname"));
                poi.setCityname(item.getStr("cityname"));
                poi.setAdname(item.getStr("adname"));
                poiList.add(poi);
            }
            response.setPois(poiList);
        }

        return response;
    }

    // ========== 创建模拟响应方法 ==========

    private AmapDTO.GeocodeResponse createMockGeocodeResponse(AmapDTO.GeocodeRequest request) {
        AmapDTO.GeocodeResponse response = new AmapDTO.GeocodeResponse();
        response.setStatus("1");
        response.setCount("1");
        response.setInfo("OK");

        List<AmapDTO.Geocode> geocodeList = new ArrayList<>();
        AmapDTO.Geocode geocode = new AmapDTO.Geocode();
        geocode.setFormattedAddress(request.getAddress());
        geocode.setCountry("中国");
        geocode.setProvince("北京市");
        geocode.setCity("北京市");
        geocode.setDistrict("朝阳区");
        geocode.setStreet("模拟街道");
        geocode.setNumber("100号");
        geocode.setAdcode("110105");
        geocode.setLocation("116.480881,39.989410");
        geocode.setLevel("门址");
        geocodeList.add(geocode);

        response.setGeocodes(geocodeList);
        return response;
    }

    private AmapDTO.RegeocodeResponse createMockRegeocodeResponse(AmapDTO.RegeocodeRequest request) {
        AmapDTO.RegeocodeResponse response = new AmapDTO.RegeocodeResponse();
        response.setStatus("1");
        response.setInfo("OK");

        AmapDTO.Regeocode regeocode = new AmapDTO.Regeocode();
        regeocode.setFormattedAddress("北京市朝阳区模拟街道100号");

        AmapDTO.AddressComponent addressComponent = new AmapDTO.AddressComponent();
        addressComponent.setCountry("中国");
        addressComponent.setProvince("北京市");
        addressComponent.setCity("北京市");
        addressComponent.setDistrict("朝阳区");
        addressComponent.setStreet("模拟街道");
        addressComponent.setStreetNumber("100号");
        addressComponent.setAdcode("110105");
        addressComponent.setCitycode("010");
        regeocode.setAddressComponent(addressComponent);

        response.setRegeocode(regeocode);
        return response;
    }

    private AmapDTO.DirectionResponse createMockDirectionResponse(AmapDTO.DirectionRequest request) {
        AmapDTO.DirectionResponse response = new AmapDTO.DirectionResponse();
        response.setStatus("1");
        response.setInfo("OK");

        AmapDTO.Route route = new AmapDTO.Route();
        route.setOrigin(request.getOrigin());
        route.setDestination(request.getDestination());
        route.setTaxiCost("35");

        List<AmapDTO.Path> pathList = new ArrayList<>();
        AmapDTO.Path path = new AmapDTO.Path();
        path.setDistance("5000");
        path.setDuration("900");
        path.setStrategy("0");
        path.setTolls("0");
        path.setTollDistance("0");

        List<AmapDTO.Step> stepList = new ArrayList<>();
        AmapDTO.Step step1 = new AmapDTO.Step();
        step1.setInstruction("从起点向正东方向出发,行驶100米,右转");
        step1.setDistance("100");
        step1.setDuration("30");
        step1.setPolyline("116.480881,39.989410;116.481881,39.989410");
        stepList.add(step1);

        AmapDTO.Step step2 = new AmapDTO.Step();
        step2.setInstruction("沿道路行驶4.9公里,到达目的地");
        step2.setDistance("4900");
        step2.setDuration("870");
        step2.setPolyline("116.481881,39.989410;116.500000,39.990000");
        stepList.add(step2);

        path.setSteps(stepList);
        pathList.add(path);
        route.setPaths(pathList);

        response.setRoute(route);
        return response;
    }

    private AmapDTO.PlaceSearchResponse createMockPlaceSearchResponse(AmapDTO.PlaceSearchRequest request) {
        AmapDTO.PlaceSearchResponse response = new AmapDTO.PlaceSearchResponse();
        response.setStatus("1");
        response.setCount("2");
        response.setInfo("OK");

        List<AmapDTO.PlacePoi> poiList = new ArrayList<>();

        AmapDTO.PlacePoi poi1 = new AmapDTO.PlacePoi();
        poi1.setId("B000A8URP1");
        poi1.setName(request.getKeywords() + "（模拟）");
        poi1.setType("商务住宅;住宅区;住宅小区");
        poi1.setTel("010-12345678");
        poi1.setDirection("东北");
        poi1.setDistance("500");
        poi1.setLocation("116.480881,39.989410");
        poi1.setAddress("北京市朝阳区模拟街道100号");
        poi1.setAdcode("110105");
        poi1.setPname("北京市");
        poi1.setCityname("北京市");
        poi1.setAdname("朝阳区");
        poiList.add(poi1);

        AmapDTO.PlacePoi poi2 = new AmapDTO.PlacePoi();
        poi2.setId("B000A8URP2");
        poi2.setName(request.getKeywords() + "二期（模拟）");
        poi2.setType("商务住宅;住宅区;住宅小区");
        poi2.setTel("010-87654321");
        poi2.setDirection("东南");
        poi2.setDistance("800");
        poi2.setLocation("116.485881,39.984410");
        poi2.setAddress("北京市朝阳区模拟街道200号");
        poi2.setAdcode("110105");
        poi2.setPname("北京市");
        poi2.setCityname("北京市");
        poi2.setAdname("朝阳区");
        poiList.add(poi2);

        response.setPois(poiList);
        return response;
    }
}
