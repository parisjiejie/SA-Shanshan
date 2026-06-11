package com.aftersales.mapper;

import com.aftersales.dto.ContactDTO;
import com.aftersales.entity.Contact;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.ReportingPolicy;
import org.mapstruct.factory.Mappers;

import java.util.List;

/**
 * 联系人对象映射器
 */
@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface ContactMapper {

    ContactMapper INSTANCE = Mappers.getMapper(ContactMapper.class);

    /**
     * 实体转DTO
     */
    ContactDTO toDTO(Contact contact);

    /**
     * DTO转实体
     */
    Contact toEntity(ContactDTO dto);

    /**
     * 创建请求转实体
     */
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "approvalStatus", ignore = true)
    @Mapping(target = "registerTime", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    Contact toEntity(ContactDTO.CreateRequest request);

    /**
     * 更新请求转实体
     */
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "registerTime", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    void updateEntityFromRequest(ContactDTO.UpdateRequest request, @MappingTarget Contact contact);

    /**
     * 实体列表转DTO列表
     */
    List<ContactDTO> toDTOList(List<Contact> contacts);

    /**
     * 实体转简要DTO
     */
    ContactDTO.SimpleDTO toSimpleDTO(Contact contact);
}
