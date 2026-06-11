package com.aftersales.mapper;

import com.aftersales.dto.PartDTO;
import com.aftersales.entity.Part;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.ReportingPolicy;
import org.mapstruct.factory.Mappers;

import java.util.List;

/**
 * 配件对象映射器
 */
@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface PartMapper {

    PartMapper INSTANCE = Mappers.getMapper(PartMapper.class);

    /**
     * 实体转DTO
     */
    PartDTO toDTO(Part part);

    /**
     * DTO转实体
     */
    Part toEntity(PartDTO dto);

    /**
     * 创建请求转实体
     */
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "status", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    Part toEntity(PartDTO.CreateRequest request);

    /**
     * 更新请求转实体
     */
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    void updateEntityFromRequest(PartDTO.UpdateRequest request, @MappingTarget Part part);

    /**
     * 实体列表转DTO列表
     */
    List<PartDTO> toDTOList(List<Part> parts);

    /**
     * 实体转简要DTO
     */
    PartDTO.SimpleDTO toSimpleDTO(Part part);
}
