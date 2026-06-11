package com.aftersales.controller;

import com.aftersales.dto.ApiResponse;
import com.aftersales.service.FileStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import jakarta.servlet.http.HttpServletRequest;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

/**
 * 文件管理控制器
 */
@RestController
@RequestMapping("/files")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class FileController {

    private final FileStorageService fileStorageService;

    /**
     * 上传头像
     */
    @PostMapping("/avatar/{userId}")
    public ApiResponse<Map<String, String>> uploadAvatar(
            @PathVariable Long userId,
            @RequestParam("file") MultipartFile file) {
        String filename = fileStorageService.storeAvatar(file, userId);
        String fileUrl = fileStorageService.getFileUrl(filename, "avatar");
        
        Map<String, String> result = new HashMap<>();
        result.put("filename", filename);
        result.put("url", fileUrl);
        
        return ApiResponse.success("头像上传成功", result);
    }

    /**
     * 上传PDF
     */
    @PostMapping("/pdf/{quotationId}")
    public ApiResponse<Map<String, String>> uploadPdf(
            @PathVariable Long quotationId,
            @RequestParam("file") MultipartFile file) {
        String filename = fileStorageService.storePdf(file, quotationId);
        String fileUrl = fileStorageService.getFileUrl(filename, "pdf");
        
        Map<String, String> result = new HashMap<>();
        result.put("filename", filename);
        result.put("url", fileUrl);
        
        return ApiResponse.success("PDF上传成功", result);
    }

    /**
     * 上传临时文件
     */
    @PostMapping("/temp")
    public ApiResponse<Map<String, String>> uploadTempFile(@RequestParam("file") MultipartFile file) {
        String filename = fileStorageService.storeTempFile(file);
        String fileUrl = fileStorageService.getFileUrl(filename, "temp");
        
        Map<String, String> result = new HashMap<>();
        result.put("filename", filename);
        result.put("url", fileUrl);
        
        return ApiResponse.success("文件上传成功", result);
    }

    /**
     * 下载头像
     */
    @GetMapping("/avatar/{filename:.+}")
    public ResponseEntity<Resource> downloadAvatar(@PathVariable String filename, HttpServletRequest request) {
        return downloadFile(filename, "avatar", request);
    }

    /**
     * 下载PDF
     */
    @GetMapping("/pdf/{filename:.+}")
    public ResponseEntity<Resource> downloadPdf(@PathVariable String filename, HttpServletRequest request) {
        return downloadFile(filename, "pdf", request);
    }

    /**
     * 下载临时文件
     */
    @GetMapping("/temp/{filename:.+}")
    public ResponseEntity<Resource> downloadTempFile(@PathVariable String filename, HttpServletRequest request) {
        return downloadFile(filename, "temp", request);
    }

    /**
     * 删除头像
     */
    @DeleteMapping("/avatar/{filename:.+}")
    public ApiResponse<Void> deleteAvatar(@PathVariable String filename) {
        fileStorageService.deleteFile(filename, "avatar");
        return ApiResponse.success("头像删除成功", null);
    }

    /**
     * 删除PDF
     */
    @DeleteMapping("/pdf/{filename:.+}")
    public ApiResponse<Void> deletePdf(@PathVariable String filename) {
        fileStorageService.deleteFile(filename, "pdf");
        return ApiResponse.success("PDF删除成功", null);
    }

    /**
     * 通用文件下载方法
     */
    private ResponseEntity<Resource> downloadFile(String filename, String type, HttpServletRequest request) {
        Resource resource = fileStorageService.loadFile(filename, type);

        // 确定内容类型
        String contentType = determineContentType(request, resource);

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .body(resource);
    }

    /**
     * 确定内容类型
     */
    private String determineContentType(HttpServletRequest request, Resource resource) {
        String contentType = null;
        try {
            contentType = request.getServletContext().getMimeType(resource.getFile().getAbsolutePath());
        } catch (IOException ex) {
            // 忽略异常
        }

        // 默认内容类型
        if (contentType == null) {
            contentType = "application/octet-stream";
        }

        return contentType;
    }
}
