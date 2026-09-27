package com.antiphishing.narration.service;

import com.antiphishing.narration.dto.NarrationRequest;
import com.antiphishing.narration.dto.NarrationResponse;
import com.antiphishing.narration.exception.InvalidNarrationException;
import com.antiphishing.narration.exception.UnsupportedLocaleException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.MessageSource;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Slf4j
public class NarrationServiceImpl implements NarrationService {

    private static final Set<String> SUPPORTED_LOCALES = Set.of("vi", "en");
    private static final String DEFAULT_LOCALE = "vi";
    private static final String REASON_KEY_PREFIX = "reason.";
    private static final String REASON_FALLBACK_KEY = "reason.unknown";
    private static final String OPENING_HIGH_RISK_KEY = "narration.opening.high";
    private static final String OPENING_LOW_RISK_KEY = "narration.opening.low";
    private static final String CLOSING_KEY = "narration.closing";
    private static final double HIGH_RISK_THRESHOLD = 0.7;

    private final MessageSource messageSource;

    @Override
    public NarrationResponse narrate(NarrationRequest request) {
        if (request.getReasonCodes() == null || request.getReasonCodes().isEmpty()) {
            throw new InvalidNarrationException("reasonCodes must not be empty");
        }

        String requestedLocale = (request.getLocale() == null || request.getLocale().isBlank())
                ? DEFAULT_LOCALE
                : request.getLocale().trim().toLowerCase();
        Locale locale = resolveLocale(requestedLocale);

        List<String> reasonCodes = new ArrayList<>(new LinkedHashSet<>(request.getReasonCodes()));
        List<String> reasonSentences = new ArrayList<>();
        for (String code : reasonCodes) {
            reasonSentences.add(resolveReasonMessage(code, locale));
        }

        double riskScore = request.getRiskScore() != null ? request.getRiskScore() : 0.0;
        String openingKey = riskScore >= HIGH_RISK_THRESHOLD ? OPENING_HIGH_RISK_KEY : OPENING_LOW_RISK_KEY;

        String explanation = (messageSource.getMessage(openingKey, null, locale)
                + " " + String.join(", ", reasonSentences)
                + ". " + messageSource.getMessage(CLOSING_KEY, null, locale))
                .replaceAll("\\s+", " ")
                .trim();

        log.info("Generated narration: locale={}, riskScore={}, reasonCodes={}", locale, riskScore, reasonCodes);

        return NarrationResponse.builder()
                .explanation(explanation)
                .locale(locale.getLanguage())
                .reasonCodesUsed(reasonCodes)
                .build();
    }

    private Locale resolveLocale(String requestedLocale) {
        Locale candidate = Locale.forLanguageTag(requestedLocale);
        if (candidate.getLanguage().isBlank() || !SUPPORTED_LOCALES.contains(candidate.getLanguage())) {
            throw new UnsupportedLocaleException(
                    "Unsupported locale: " + requestedLocale + " (supported: vi, en)");
        }
        return candidate;
    }

    private String resolveReasonMessage(String code, Locale locale) {
        try {
            return messageSource.getMessage(REASON_KEY_PREFIX + code, null, locale);
        } catch (Exception ex) {
            return messageSource.getMessage(REASON_FALLBACK_KEY, new Object[]{code}, locale);
        }
    }
}
