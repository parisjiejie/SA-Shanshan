package com.aftersales.controller;

import com.aftersales.dto.ApiResponse;
import com.aftersales.dto.PageResult;
import com.aftersales.dto.WorkorderDTO;
import com.aftersales.entity.Contact;
import com.aftersales.entity.Employee;
import com.aftersales.entity.Workorder;
import com.aftersales.repository.ContactRepository;
import com.aftersales.repository.EmployeeRepository;
import com.aftersales.service.WorkorderService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/workorders")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class WorkorderController {

    private final WorkorderService workorderService;
    private final EmployeeRepository employeeRepository;
    private final ContactRepository contactRepository;

    @GetMapping
    public ApiResponse<PageResult<WorkorderDTO>> getList(
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "10") Integer pageSize,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Long customerId,
            @RequestParam(required = false) Long employeeId,
            @RequestParam(required = false) Workorder.WorkorderStatus status,
            @RequestParam(required = false) Workorder.WorkorderType type) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        Employee currentEmployee = employeeRepository.findByUsername(username).orElse(null);

        String currentUserRole = null;
        Long currentUserId = null;
        String currentUserDepartment = null;
        Long currentUserCustomerId = null;

        if (currentEmployee != null) {
            currentUserRole = currentEmployee.getRole().name();
            currentUserId = currentEmployee.getId();
            currentUserDepartment = currentEmployee.getDepartment();

            if ("CUSTOMER".equals(currentUserRole)) {
                List<Contact> contacts = contactRepository.findByPhone(currentEmployee.getPhone());
                if (!contacts.isEmpty()) {
                    currentUserCustomerId = contacts.get(0).getCustomerId();
                }
            }
        }

        PageResult<WorkorderDTO> result = workorderService.getList(
                page, pageSize, keyword, customerId, employeeId, status, type,
                currentUserRole, currentUserId, currentUserDepartment, currentUserCustomerId);
        return ApiResponse.success(result);
    }

    @GetMapping("/{id}")
    public ApiResponse<WorkorderDTO> getById(@PathVariable Long id) {
        WorkorderDTO workorder = workorderService.getById(id);
        return ApiResponse.success(workorder);
    }

    @GetMapping("/no/{workorderNo}")
    public ApiResponse<WorkorderDTO> getByWorkorderNo(@PathVariable String workorderNo) {
        WorkorderDTO workorder = workorderService.getByWorkorderNo(workorderNo);
        return ApiResponse.success(workorder);
    }

    @PostMapping
    public ApiResponse<WorkorderDTO> create(@RequestBody WorkorderDTO.CreateRequest request) {
        WorkorderDTO newWorkorder = workorderService.create(request);
        return ApiResponse.success("创建成功", newWorkorder);
    }

    @PutMapping("/{id}")
    public ApiResponse<WorkorderDTO> update(@PathVariable Long id, @RequestBody WorkorderDTO.UpdateRequest request) {
        WorkorderDTO updatedWorkorder = workorderService.update(id, request);
        return ApiResponse.success("更新成功", updatedWorkorder);
    }

    @PostMapping("/{id}/accept")
    public ApiResponse<WorkorderDTO> accept(@PathVariable Long id, @RequestBody WorkorderDTO.AcceptRequest request) {
        WorkorderDTO updatedWorkorder = workorderService.accept(id, request.getEmployeeId());
        return ApiResponse.success("接单成功", updatedWorkorder);
    }

    @PostMapping("/{id}/start")
    public ApiResponse<WorkorderDTO> start(@PathVariable Long id) {
        WorkorderDTO updatedWorkorder = workorderService.start(id);
        return ApiResponse.success("开始处理", updatedWorkorder);
    }

    @PostMapping("/{id}/complete")
    public ApiResponse<WorkorderDTO> complete(@PathVariable Long id, @RequestBody WorkorderDTO.CompleteRequest request) {
        WorkorderDTO updatedWorkorder = workorderService.complete(id, request);
        return ApiResponse.success("工单已完成", updatedWorkorder);
    }

    @PostMapping("/{id}/cancel")
    public ApiResponse<WorkorderDTO> cancel(@PathVariable Long id) {
        WorkorderDTO updatedWorkorder = workorderService.cancel(id);
        return ApiResponse.success("工单已取消", updatedWorkorder);
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        workorderService.delete(id);
        return ApiResponse.success("删除成功", null);
    }

    @DeleteMapping("/batch")
    public ApiResponse<Void> batchDelete(@RequestBody Map<String, List<Long>> request) {
        List<Long> ids = request.get("ids");
        workorderService.batchDelete(ids);
        return ApiResponse.success("批量删除成功", null);
    }

    @GetMapping("/customer/{customerId}")
    public ApiResponse<List<WorkorderDTO>> getByCustomerId(@PathVariable Long customerId) {
        List<WorkorderDTO> workorders = workorderService.getByCustomerId(customerId);
        return ApiResponse.success(workorders);
    }

    @GetMapping("/employee/{employeeId}")
    public ApiResponse<List<WorkorderDTO>> getByEmployeeId(@PathVariable Long employeeId) {
        List<WorkorderDTO> workorders = workorderService.getByEmployeeId(employeeId);
        return ApiResponse.success(workorders);
    }

    @GetMapping("/simple")
    public ApiResponse<List<WorkorderDTO.SimpleDTO>> getAllSimple() {
        List<WorkorderDTO.SimpleDTO> workorders = workorderService.getAllSimple();
        return ApiResponse.success(workorders);
    }

    @GetMapping("/statistics")
    public ApiResponse<WorkorderService.WorkorderStatistics> getStatistics() {
        WorkorderService.WorkorderStatistics stats = workorderService.getStatistics();
        return ApiResponse.success(stats);
    }
}
