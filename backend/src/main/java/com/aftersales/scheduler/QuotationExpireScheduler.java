package com.aftersales.scheduler;

import com.aftersales.entity.Quotation;
import com.aftersales.repository.QuotationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

/**
 * 报价单过期检查定时任务
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class QuotationExpireScheduler {

    private final QuotationRepository quotationRepository;

    /**
     * 每天凌晨2点检查过期报价单
     */
    @Scheduled(cron = "0 0 2 * * ?")
    @Transactional
    public void checkExpiredQuotations() {
        log.info("开始检查过期报价单...");

        LocalDate today = LocalDate.now();

        // 查询所有已发送且已过期的报价单
        List<Quotation> expiredQuotations = quotationRepository.findAll().stream()
                .filter(q -> q.getStatus() == Quotation.QuotationStatus.SENT)
                .filter(q -> q.getExpireDate() != null && q.getExpireDate().isBefore(today))
                .toList();

        int count = 0;
        for (Quotation quotation : expiredQuotations) {
            quotation.setStatus(Quotation.QuotationStatus.EXPIRED);
            quotationRepository.save(quotation);
            count++;
            log.info("报价单已过期: {}, 过期日期: {}", quotation.getQuotationNo(), quotation.getExpireDate());
        }

        log.info("过期报价单检查完成，共处理 {} 条记录", count);
    }

    /**
     * 每小时检查一次即将过期的报价单（提前3天提醒）
     */
    @Scheduled(cron = "0 0 * * * ?")
    @Transactional
    public void checkExpiringQuotations() {
        log.info("开始检查即将过期的报价单...");

        LocalDate today = LocalDate.now();
        LocalDate warningDate = today.plusDays(3);

        // 查询3天内即将过期的已发送报价单
        List<Quotation> expiringQuotations = quotationRepository.findAll().stream()
                .filter(q -> q.getStatus() == Quotation.QuotationStatus.SENT)
                .filter(q -> q.getExpireDate() != null)
                .filter(q -> !q.getExpireDate().isBefore(today))
                .filter(q -> !q.getExpireDate().isAfter(warningDate))
                .toList();

        for (Quotation quotation : expiringQuotations) {
            long daysUntilExpire = today.until(quotation.getExpireDate()).getDays();
            log.info("报价单即将过期: {}, 剩余天数: {}, 客户ID: {}",
                    quotation.getQuotationNo(), daysUntilExpire, quotation.getCustomerId());

            // TODO: 发送提醒通知给客户或销售人员
            // notificationService.sendExpiringQuotationNotification(quotation);
        }

        log.info("即将过期的报价单检查完成，共 {} 条记录需要提醒", expiringQuotations.size());
    }
}
