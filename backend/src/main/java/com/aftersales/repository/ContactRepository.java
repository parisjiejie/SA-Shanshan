package com.aftersales.repository;

import com.aftersales.entity.Contact;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * 联系人数据访问层
 */
@Repository
public interface ContactRepository extends JpaRepository<Contact, Long> {

    List<Contact> findByCustomerId(Long customerId);

    List<Contact> findByPhone(String phone);

    List<Contact> findByCustomerIdAndApprovalStatus(Long customerId, Contact.ApprovalStatus approvalStatus);
}
