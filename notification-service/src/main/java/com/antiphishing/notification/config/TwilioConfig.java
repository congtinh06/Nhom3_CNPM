package com.antiphishing.notification.config;

import com.twilio.Twilio;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

@Slf4j
@Configuration
public class TwilioConfig {

    @Value("${notification.sms.enabled:false}")
    private boolean smsEnabled;

    @Value("${twilio.account-sid:}")
    private String accountSid;

    @Value("${twilio.auth-token:}")
    private String authToken;

    @PostConstruct
    public void init() {
        if (smsEnabled && accountSid != null && !accountSid.trim().isEmpty() && authToken != null && !authToken.trim().isEmpty()) {
            try {
                Twilio.init(accountSid, authToken);
                log.info("Twilio SDK đã được khởi tạo thành công.");
            } catch (Exception e) {
                log.warn("Không thể khởi tạo Twilio SDK: {}. Kênh SMS sẽ tạm thời bị vô hiệu hóa.", e.getMessage());
            }
        } else {
            log.info("Kênh SMS Twilio đang ở trạng thái TẮT (mặc định cho đồ án môn học).");
        }
    }
}
