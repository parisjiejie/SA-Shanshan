package com.aftersales.mapper;

import com.aftersales.dto.QuotationDTO;
import com.aftersales.entity.Quotation;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.ReportingPolicy;
import org.mapstruct.factory.Mappers;

import java.util.List;

/**
 * 报价单对象映射器
 */
@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface QuotationMapper {

    QuotationMapper INSTANCE = Mappers.getMapper(QuotationMapper.class);

    /**
     * 实体转DTO
     */
    QuotationDTO toDTO(Quotation quotation);

    /**
     * DTO转实体
     */
    Quotation toEntity(QuotationDTO dto);

    /**
     * 创建请求转实体
     */
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "quotationNo", ignore = true)
    @Mapping(target = "status", ignore = true)
    @Mapping(target = "totalAmount", ignore = true)
    @Mapping(target = "expireDate", ignore = true)
    @Mapping(target = "pdfUrl", ignore = true)
    @Mapping(target = "createdBy", ignore = true)
    @Mapping(target = "approvedBy", ignore = true)
    @Mapping(target = "approvedTime", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    Quotation toEntity(QuotationDTO.CreateRequest request);

    /**
     * 更新请求转实体
     */
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "quotationNo", ignore = true)
    @Mapping(target = "status", ignore = true)
    @Mapping(target = "totalAmount", ignore = true)
    @Mapping(target = "expireDate", ignore = true)
    @Mapping(target = "pdfUrl", ignore = true)
    @Mapping(target = "createdBy", ignore = true)
    @Mapping(target = "approvedBy", ignore = true)
    @Mapping(target = "approvedTime", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    void updateEntityFromRequest(QuotationDTO.UpdateRequest request, @MappingTarget Quotation quotation);

    /**
     * 实体列表转DTO列表
     */
    List<QuotationDTO> toDTOList(List<Quotation> quotations);

    /**
     * 实体转简要DTO
     */
    QuotationDTO.SimpleDTO toSimpleDTO(Quotation quotation);
}
