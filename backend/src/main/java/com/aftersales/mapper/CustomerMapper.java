package com.aftersales.mapper;

import com.aftersales.dto.CustomerDTO;
import com.aftersales.entity.Customer;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.ReportingPolicy;
import org.mapstruct.factory.Mappers;

import java.util.List;

/**
 * 客户对象映射器
 */
@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface CustomerMapper {

    CustomerMapper INSTANCE = Mappers.getMapper(CustomerMapper.class);

    /**
     * 实体转DTO
     */
    CustomerDTO toDTO(Customer customer);

    /**
     * DTO转实体
     */
    Customer toEntity(CustomerDTO dto);

    /**
     * 创建请求转实体
     */
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    Customer toEntity(CustomerDTO.CreateRequest request);

    /**
     * 更新请求转实体
     */
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    void updateEntityFromRequest(CustomerDTO.UpdateRequest request, @MappingTarget Customer customer);

    /**
     * 实体列表转DTO列表
     */
    List<CustomerDTO> toDTOList(List<Customer> customers);

    /**
     * 实体转简要DTO
     */
    CustomerDTO.SimpleDTO toSimpleDTO(Customer customer);
}
