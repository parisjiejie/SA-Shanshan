package com.aftersales.scheduler;

import com.aftersales.entity.Part;
import com.aftersales.repository.PartRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * 库存预警检查定时任务
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class InventoryAlertScheduler {

    private final PartRepository partRepository;

    /**
     * 每天上午9点检查库存预警
     */
    @Scheduled(cron = "0 0 9 * * ?")
    @Transactional
    public void checkInventoryAlert() {
        log.info("开始检查库存预警...");

        // 查询所有库存紧张的配件
        List<Part> tightParts = partRepository.findLowStockParts(null).getContent();

        int outOfStockCount = 0;
        int tightCount = 0;

        for (Part part : tightParts) {
            if (part.getStock() <= 0) {
                outOfStockCount++;
                log.warn("配件缺货: {} ({}), 当前库存: {}",
                        part.getName(), part.getCode(), part.getStock());

                // 更新状态为缺货
                if (part.getStatus() != Part.PartStatus.OUT_OF_STOCK) {
                    part.setStatus(Part.PartStatus.OUT_OF_STOCK);
                    partRepository.save(part);
                }
            } else if (part.getStock() <= part.getMinStock()) {
                tightCount++;
                log.warn("配件库存紧张: {} ({}), 当前库存: {}, 最小库存: {}",
                        part.getName(), part.getCode(), part.getStock(), part.getMinStock());

                // 更新状态为紧张
                if (part.getStatus() != Part.PartStatus.TIGHT) {
                    part.setStatus(Part.PartStatus.TIGHT);
                    partRepository.save(part);
                }
            }
        }

        log.info("库存预警检查完成，缺货: {} 种，库存紧张: {} 种", outOfStockCount, tightCount);

        // TODO: 发送库存预警通知给采购人员
        // if (outOfStockCount > 0 || tightCount > 0) {
        //     notificationService.sendInventoryAlert(outOfStockCount, tightCount);
        // }
    }

    /**
     * 每小时检查一次库存状态（自动更新库存状态）
     */
    @Scheduled(cron = "0 0 * * * ?")
    @Transactional
    public void updateInventoryStatus() {
        log.info("开始更新库存状态...");

        List<Part> allParts = partRepository.findAll();
        int updatedCount = 0;

        for (Part part : allParts) {
            Part.PartStatus newStatus = calculateStockStatus(part);

            if (newStatus != part.getStatus()) {
                part.setStatus(newStatus);
                partRepository.save(part);
                updatedCount++;
                log.info("配件状态更新: {} ({}), 新状态: {}",
                        part.getName(), part.getCode(), newStatus);
            }
        }

        log.info("库存状态更新完成，共更新 {} 条记录", updatedCount);
    }

    /**
     * 计算库存状态
     */
    private Part.PartStatus calculateStockStatus(Part part) {
        Integer stock = part.getStock();
        Integer minStock = part.getMinStock();

        if (stock == null || stock <= 0) {
            return Part.PartStatus.OUT_OF_STOCK;
        } else if (stock <= minStock) {
            return Part.PartStatus.TIGHT;
        } else {
            return Part.PartStatus.SUFFICIENT;
        }
    }
}
