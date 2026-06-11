package com.aftersales.mapper;

import com.aftersales.dto.AssetDTO;
import com.aftersales.entity.Asset;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.ReportingPolicy;
import org.mapstruct.factory.Mappers;

import java.util.List;

/**
 * 设备对象映射器
 */
@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface AssetMapper {

    AssetMapper INSTANCE = Mappers.getMapper(AssetMapper.class);

    /**
     * 实体转DTO
     */
    AssetDTO toDTO(Asset asset);

    /**
     * DTO转实体
     */
    Asset toEntity(AssetDTO dto);

    /**
     * 创建请求转实体
     */
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    Asset toEntity(AssetDTO.CreateRequest request);

    /**
     * 更新请求转实体
     */
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    void updateEntityFromRequest(AssetDTO.UpdateRequest request, @MappingTarget Asset asset);

    /**
     * 实体列表转DTO列表
     */
    List<AssetDTO> toDTOList(List<Asset> assets);

    /**
     * 实体转简要DTO
     */
    AssetDTO.SimpleDTO toSimpleDTO(Asset asset);
}
