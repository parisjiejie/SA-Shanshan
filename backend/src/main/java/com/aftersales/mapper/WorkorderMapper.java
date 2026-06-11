package com.aftersales.mapper;

import com.aftersales.dto.WorkorderDTO;
import com.aftersales.entity.Workorder;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.ReportingPolicy;
import org.mapstruct.factory.Mappers;

import java.util.List;

/**
 * 工单对象映射器
 */
@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface WorkorderMapper {

    WorkorderMapper INSTANCE = Mappers.getMapper(WorkorderMapper.class);

    /**
     * 实体转DTO
     */
    WorkorderDTO toDTO(Workorder workorder);

    /**
     * DTO转实体
     */
    Workorder toEntity(WorkorderDTO dto);

    /**
     * 创建请求转实体
     */
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "workorderNo", ignore = true)
    @Mapping(target = "status", ignore = true)
    @Mapping(target = "solution", ignore = true)
    @Mapping(target = "employeeId", ignore = true)
    @Mapping(target = "createTime", ignore = true)
    @Mapping(target = "acceptTime", ignore = true)
    @Mapping(target = "startTime", ignore = true)
    @Mapping(target = "completeTime", ignore = true)
    @Mapping(target = "customerSign", ignore = true)
    @Mapping(target = "evaluationScore", ignore = true)
    @Mapping(target = "evaluationContent", ignore = true)
    @Mapping(target = "createdBy", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    Workorder toEntity(WorkorderDTO.CreateRequest request);

    /**
     * 更新请求转实体
     */
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "workorderNo", ignore = true)
    @Mapping(target = "createTime", ignore = true)
    @Mapping(target = "acceptTime", ignore = true)
    @Mapping(target = "startTime", ignore = true)
    @Mapping(target = "completeTime", ignore = true)
    @Mapping(target = "createdBy", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    void updateEntityFromRequest(WorkorderDTO.UpdateRequest request, @MappingTarget Workorder workorder);

    /**
     * 实体列表转DTO列表
     */
    List<WorkorderDTO> toDTOList(List<Workorder> workorders);

    /**
     * 实体转简要DTO
     */
    WorkorderDTO.SimpleDTO toSimpleDTO(Workorder workorder);
}
