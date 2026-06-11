package com.aftersales.service;

import com.aftersales.config.FileStorageConfig;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

/**
 * 文件存储服务
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class FileStorageService {

    private final FileStorageConfig fileStorageConfig;
    
    private Path uploadPath;
    private Path avatarPath;
    private Path pdfPath;
    private Path tempPath;

    /**
     * 初始化存储目录
     */
    @PostConstruct
    public void init() {
        try {
            uploadPath = Paths.get(fileStorageConfig.getUploadPath()).toAbsolutePath().normalize();
            avatarPath = uploadPath.resolve(fileStorageConfig.getAvatarPath());
            pdfPath = uploadPath.resolve(fileStorageConfig.getPdfPath());
            tempPath = uploadPath.resolve(fileStorageConfig.getTempPath());

            // 创建目录
            Files.createDirectories(avatarPath);
            Files.createDirectories(pdfPath);
            Files.createDirectories(tempPath);

            log.info("文件存储目录初始化完成: {}", uploadPath);
        } catch (IOException e) {
            throw new RuntimeException("无法创建文件存储目录", e);
        }
    }

    /**
     * 存储头像文件
     */
    public String storeAvatar(MultipartFile file, Long userId) {
        // 验证文件类型
        validateImageFile(file);
        
        // 生成文件名
        String extension = getFileExtension(file.getOriginalFilename());
        String filename = "avatar_" + userId + "_" + UUID.randomUUID().toString().substring(0, 8) + "." + extension;
        
        return storeFile(file, avatarPath, filename);
    }

    /**
     * 存储PDF文件
     */
    public String storePdf(MultipartFile file, Long quotationId) {
        // 验证文件类型
        validatePdfFile(file);
        
        // 生成文件名
        String filename = "quotation_" + quotationId + "_" + UUID.randomUUID().toString().substring(0, 8) + ".pdf";
        
        return storeFile(file, pdfPath, filename);
    }

    /**
     * 存储临时文件
     */
    public String storeTempFile(MultipartFile file) {
        String extension = getFileExtension(file.getOriginalFilename());
        String filename = "temp_" + UUID.randomUUID().toString() + "." + extension;
        
        return storeFile(file, tempPath, filename);
    }

    /**
     * 存储文件到指定路径
     */
    private String storeFile(MultipartFile file, Path targetPath, String filename) {
        try {
            // 检查文件大小
            if (file.getSize() > fileStorageConfig.getMaxSize() * 1024 * 1024) {
                throw new RuntimeException("文件大小超过限制: " + fileStorageConfig.getMaxSize() + "MB");
            }

            // 保存文件
            Path targetLocation = targetPath.resolve(filename);
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

            log.info("文件上传成功: {}", filename);
            return filename;
        } catch (IOException e) {
            throw new RuntimeException("文件存储失败: " + filename, e);
        }
    }

    /**
     * 加载文件
     */
    public Resource loadFile(String filename, String type) {
        try {
            Path filePath = getPathByType(type).resolve(filename).normalize();
            Resource resource = new UrlResource(filePath.toUri());
            
            if (resource.exists()) {
                return resource;
            } else {
                throw new RuntimeException("文件不存在: " + filename);
            }
        } catch (MalformedURLException e) {
            throw new RuntimeException("文件加载失败: " + filename, e);
        }
    }

    /**
     * 删除文件
     */
    public void deleteFile(String filename, String type) {
        try {
            Path filePath = getPathByType(type).resolve(filename);
            Files.deleteIfExists(filePath);
            log.info("文件删除成功: {}", filename);
        } catch (IOException e) {
            throw new RuntimeException("文件删除失败: " + filename, e);
        }
    }

    /**
     * 获取文件访问URL
     */
    public String getFileUrl(String filename, String type) {
        return fileStorageConfig.getAccessUrl() + "/" + type + "/" + filename;
    }

    /**
     * 验证图片文件
     */
    private void validateImageFile(MultipartFile file) {
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new RuntimeException("只允许上传图片文件");
        }
        
        List<String> allowedTypes = Arrays.asList("image/jpeg", "image/png", "image/gif", "image/webp");
        if (!allowedTypes.contains(contentType)) {
            throw new RuntimeException("不支持的图片格式，只允许: JPG, PNG, GIF, WEBP");
        }
    }

    /**
     * 验证PDF文件
     */
    private void validatePdfFile(MultipartFile file) {
        String contentType = file.getContentType();
        if (contentType == null || !contentType.equals("application/pdf")) {
            throw new RuntimeException("只允许上传PDF文件");
        }
    }

    /**
     * 根据类型获取路径
     */
    private Path getPathByType(String type) {
        return switch (type) {
            case "avatar" -> avatarPath;
            case "pdf" -> pdfPath;
            case "temp" -> tempPath;
            default -> uploadPath;
        };
    }

    /**
     * 获取文件扩展名
     */
    private String getFileExtension(String filename) {
        if (filename == null) {
            return "";
        }
        int lastDotIndex = filename.lastIndexOf('.');
        return lastDotIndex == -1 ? "" : filename.substring(lastDotIndex + 1).toLowerCase();
    }
}
