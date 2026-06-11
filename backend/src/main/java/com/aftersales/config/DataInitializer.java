package com.aftersales.config;

import com.aftersales.entity.*;
import com.aftersales.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 数据初始化器
 * 在应用启动时创建测试数据
 */
@Slf4j
@Configuration
@RequiredArgsConstructor
public class DataInitializer {

    private final EmployeeRepository employeeRepository;
    private final CustomerRepository customerRepository;
    private final AssetRepository assetRepository;
    private final ContactRepository contactRepository;
    private final PartRepository partRepository;
    private final PasswordEncoder passwordEncoder;

    @Bean
    public CommandLineRunner initData() {
        return args -> {
            // 检查是否已有数据
            if (employeeRepository.count() > 0) {
                log.info("数据已存在，跳过初始化");
                return;
            }

            log.info("开始初始化测试数据...");

            // 1. 创建员工数据
            initEmployees();

            // 2. 创建客户数据
            initCustomers();

            // 3. 创建设备数据
            initAssets();

            // 4. 创建联系人数据
            initContacts();

            // 5. 创建配件数据
            initParts();

            log.info("测试数据初始化完成！");
        };
    }

    private void initEmployees() {
        log.info("初始化员工数据...");

        Employee admin = new Employee();
        admin.setEmployeeNo("E20240001");
        admin.setUsername("admin");
        admin.setPassword(passwordEncoder.encode("admin123"));
        admin.setName("系统管理员");
        admin.setPhone("13800138000");
        admin.setEmail("admin@aftersales.com");
        admin.setDepartment("技术部");
        admin.setPosition("系统管理员");
        admin.setRole(Employee.EmployeeRole.ADMIN);
        admin.setStatus(Employee.EmployeeStatus.ACTIVE);
        admin.setEntryDate(LocalDate.of(2024, 1, 1));
        employeeRepository.save(admin);

        Employee manager = new Employee();
        manager.setEmployeeNo("E20240002");
        manager.setUsername("manager");
        manager.setPassword(passwordEncoder.encode("manager123"));
        manager.setName("张经理");
        manager.setPhone("13800138001");
        manager.setEmail("manager@aftersales.com");
        manager.setDepartment("售后部");
        manager.setPosition("部门经理");
        manager.setRole(Employee.EmployeeRole.MANAGER);
        manager.setStatus(Employee.EmployeeStatus.ACTIVE);
        manager.setEntryDate(LocalDate.of(2024, 1, 1));
        employeeRepository.save(manager);

        Employee engineer1 = new Employee();
        engineer1.setEmployeeNo("E20240003");
        engineer1.setUsername("engineer01");
        engineer1.setPassword(passwordEncoder.encode("engineer123"));
        engineer1.setName("李工程师");
        engineer1.setPhone("13800138002");
        engineer1.setEmail("engineer01@aftersales.com");
        engineer1.setDepartment("售后部");
        engineer1.setPosition("售后工程师");
        engineer1.setRole(Employee.EmployeeRole.ENGINEER);
        engineer1.setStatus(Employee.EmployeeStatus.ACTIVE);
        engineer1.setEntryDate(LocalDate.of(2024, 1, 15));
        employeeRepository.save(engineer1);

        Employee sales = new Employee();
        sales.setEmployeeNo("E20240004");
        sales.setUsername("sales01");
        sales.setPassword(passwordEncoder.encode("sales123"));
        sales.setName("赵销售");
        sales.setPhone("13800138003");
        sales.setEmail("sales01@aftersales.com");
        sales.setDepartment("销售部");
        sales.setPosition("销售代表");
        sales.setRole(Employee.EmployeeRole.SALES);
        sales.setStatus(Employee.EmployeeStatus.ACTIVE);
        sales.setEntryDate(LocalDate.of(2024, 1, 10));
        employeeRepository.save(sales);

        log.info("员工数据初始化完成，共 {} 条", employeeRepository.count());
    }

    private void initCustomers() {
        log.info("初始化客户数据...");

        Customer customer1 = new Customer();
        customer1.setName("北京科技有限公司");
        customer1.setCreditCode("91110108MA00123456");
        customer1.setLegalPerson("张三");
        customer1.setAddress("北京市海淀区中关村大街1号");
        customer1.setPhone("010-12345678");
        customer1.setEmail("contact@beijingtech.com");
        customer1.setLevel(Customer.CustomerLevel.VIP);
        customer1.setStatus(Customer.CustomerStatus.ACTIVE);
        customerRepository.save(customer1);

        Customer customer2 = new Customer();
        customer2.setName("上海制造有限公司");
        customer2.setCreditCode("91310115MA00234567");
        customer2.setLegalPerson("李四");
        customer2.setAddress("上海市浦东新区张江路2号");
        customer2.setPhone("021-87654321");
        customer2.setEmail("info@shanghaimfg.com");
        customer2.setLevel(Customer.CustomerLevel.NORMAL);
        customer2.setStatus(Customer.CustomerStatus.ACTIVE);
        customerRepository.save(customer2);

        Customer customer3 = new Customer();
        customer3.setName("广州贸易集团");
        customer3.setCreditCode("91440101MA00345678");
        customer3.setLegalPerson("王五");
        customer3.setAddress("广州市天河区珠江新城3号");
        customer3.setPhone("020-11223344");
        customer3.setEmail("contact@guangzhoutrade.com");
        customer3.setLevel(Customer.CustomerLevel.POTENTIAL);
        customer3.setStatus(Customer.CustomerStatus.ACTIVE);
        customerRepository.save(customer3);

        log.info("客户数据初始化完成，共 {} 条", customerRepository.count());
    }

    private void initAssets() {
        log.info("初始化设备数据...");

        Asset asset1 = new Asset();
        asset1.setSerialNumber("SN2024001001");
        asset1.setModel("EL-3000");
        asset1.setName("客梯A1");
        asset1.setCustomerId(1L);
        asset1.setType("ELEVATOR");
        asset1.setStatus(Asset.AssetStatus.RUNNING);
        asset1.setManufactureDate(LocalDate.of(2023, 6, 1));
        asset1.setSalesDate(LocalDate.of(2023, 8, 1));
        asset1.setInstallDate(LocalDate.of(2023, 9, 1));
        asset1.setWarrantyEndDate(LocalDate.of(2025, 9, 1));
        asset1.setIsEl(true);
        asset1.setInstallAddress("北京市海淀区中关村大街1号A座");
        assetRepository.save(asset1);

        Asset asset2 = new Asset();
        asset2.setSerialNumber("SN2024001002");
        asset2.setModel("EL-3000");
        asset2.setName("客梯A2");
        asset2.setCustomerId(1L);
        asset2.setType("ELEVATOR");
        asset2.setStatus(Asset.AssetStatus.RUNNING);
        asset2.setManufactureDate(LocalDate.of(2023, 6, 1));
        asset2.setSalesDate(LocalDate.of(2023, 8, 1));
        asset2.setInstallDate(LocalDate.of(2023, 9, 1));
        asset2.setWarrantyEndDate(LocalDate.of(2025, 9, 1));
        asset2.setIsEl(true);
        asset2.setInstallAddress("北京市海淀区中关村大街1号B座");
        assetRepository.save(asset2);

        Asset asset3 = new Asset();
        asset3.setSerialNumber("SN2024002001");
        asset3.setModel("AC-500");
        asset3.setName("中央空调主机");
        asset3.setCustomerId(2L);
        asset3.setType("HVAC");
        asset3.setStatus(Asset.AssetStatus.RUNNING);
        asset3.setManufactureDate(LocalDate.of(2023, 3, 15));
        asset3.setSalesDate(LocalDate.of(2023, 5, 15));
        asset3.setInstallDate(LocalDate.of(2023, 6, 15));
        asset3.setWarrantyEndDate(LocalDate.of(2025, 6, 15));
        asset3.setIsEl(false);
        asset3.setInstallAddress("上海市浦东新区张江路2号车间");
        assetRepository.save(asset3);

        log.info("设备数据初始化完成，共 {} 条", assetRepository.count());
    }

    private void initContacts() {
        log.info("初始化联系人数据...");

        Contact contact1 = new Contact();
        contact1.setCustomerId(1L);
        contact1.setName("张经理");
        contact1.setPhone("13900001111");
        contact1.setEmail("zhang@beijingtech.com");
        contact1.setPosition("采购经理");
        contact1.setIsPrimary(true);
        contact1.setApprovalStatus(Contact.ApprovalStatus.APPROVED);
        contact1.setRegisterTime(LocalDateTime.now());
        contactRepository.save(contact1);

        Contact contact2 = new Contact();
        contact2.setCustomerId(2L);
        contact2.setName("王主任");
        contact2.setPhone("13900002222");
        contact2.setEmail("wang@shanghaimfg.com");
        contact2.setPosition("设备部主任");
        contact2.setIsPrimary(true);
        contact2.setApprovalStatus(Contact.ApprovalStatus.APPROVED);
        contact2.setRegisterTime(LocalDateTime.now());
        contactRepository.save(contact2);

        log.info("联系人数据初始化完成，共 {} 条", contactRepository.count());
    }

    private void initParts() {
        log.info("初始化配件数据...");

        Part part1 = new Part();
        part1.setCode("P001");
        part1.setName("电梯门机变频器");
        part1.setModel("VFD-300");
        part1.setCategory("电气");
        part1.setSpecification("功率3.7kW，电压380V");
        part1.setUnit("个");
        part1.setStock(15);
        part1.setMinStock(5);
        part1.setMaxStock(30);
        part1.setPrice(new java.math.BigDecimal("2800.00"));
        part1.setSupplier("西门子");
        part1.setLocation("A01-01");
        part1.setStatus(Part.PartStatus.SUFFICIENT);
        partRepository.save(part1);

        Part part2 = new Part();
        part2.setCode("P002");
        part2.setName("电梯主板");
        part2.setModel("MB-2000");
        part2.setCategory("电气");
        part2.setSpecification("32位ARM处理器");
        part2.setUnit("个");
        part2.setStock(8);
        part2.setMinStock(3);
        part2.setMaxStock(15);
        part2.setPrice(new java.math.BigDecimal("5800.00"));
        part2.setSupplier("三菱");
        part2.setLocation("A01-02");
        part2.setStatus(Part.PartStatus.SUFFICIENT);
        partRepository.save(part2);

        Part part3 = new Part();
        part3.setCode("P003");
        part3.setName("空调压缩机");
        part3.setModel("CP-500");
        part3.setCategory("机械");
        part3.setSpecification("5匹涡旋压缩机");
        part3.setUnit("台");
        part3.setStock(5);
        part3.setMinStock(2);
        part3.setMaxStock(10);
        part3.setPrice(new java.math.BigDecimal("12500.00"));
        part3.setSupplier("大金");
        part3.setLocation("B01-01");
        part3.setStatus(Part.PartStatus.TIGHT);
        partRepository.save(part3);

        log.info("配件数据初始化完成，共 {} 条", partRepository.count());
    }
}
