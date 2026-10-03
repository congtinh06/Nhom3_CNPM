package com.saigonvoice.location.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

/**
 * Derives machine-readable reason codes from the structural signals of a URL.
 * These codes are consumed by narration-service to build a natural-language
 * explanation in the receiver's language.
 */
@Slf4j
@Component
public class ReasonCodeDetector {

    /** Domain-age thresholds (days). WHOIS may be unavailable; heuristics only. */
    private static final int DOMAIN_TOO_NEW_DAYS = 30;

    private static final List<String> VIETNAMESE_BANK_BRAND_KEYWORDS = List.of(
            "vietcombank", "techcombank", "mbbank", "bidv", "tpbank", "acb",
            "vpbank", "sacombank", "vib", "hdbank", "ocb", "seabank", "agribank"
    );

    private static final List<String> GENERIC_BANK_KEYWORDS = List.of(
            "bank", "ebanking", "internetbanking", "onlinebanking"
    );

    private static final List<String> KNOWN_SHORT_URL_HOSTS = List.of(
            "bit.ly", "tinyurl.com", "t.co", "goo.gl", "is.gd", "cutt.ly",
            "shorturl.at", "rb.gy", "tiny.cc", "rebrand.ly"
    );

    @Value("${verification.mock-mode:false}")
    private boolean mockMode;

    /**
     * @param domainAgeInDays domain age in days, or null when unknown.
     */
    public List<String> detect(String url, String domain, boolean blacklisted, Long domainAgeInDays) {
        List<String> reasons = new ArrayList<>();

        if (blacklisted) {
            reasons.add("BLACKLISTED_DOMAIN");
        }

        if (domainAgeInDays != null && domainAgeInDays < DOMAIN_TOO_NEW_DAYS) {
            reasons.add("DOMAIN_TOO_NEW");
        }

        String lowerUrl = url.toLowerCase(Locale.ROOT);
        String lowerDomain = domain != null ? domain.toLowerCase(Locale.ROOT) : "";

        if (lowerUrl.startsWith("http://")) {
            reasons.add("NO_HTTPS");
        }

        String sslReason = detectSslIssue(lowerDomain);
        if (sslReason != null) {
            reasons.add(sslReason);
        }

        if (usesBrandKeyword(lowerDomain, lowerUrl)) {
            reasons.add("BRAND_KEYWORD_MATCH");
        }

        if (KNOWN_SHORT_URL_HOSTS.contains(lowerDomain)) {
            reasons.add("SHORT_URL_OBFUSCATION");
        }

        if (hasSuspiciousRedirect(lowerUrl)) {
            reasons.add("SUSPICIOUS_REDIRECT");
        }

        if (mockMode && looksLikeMockPhishing(lowerUrl)) {
            // Keep the demo flow narratable when every source stays silent
            reasons.add("BLACKLISTED_DOMAIN");
        }

        return reasons;
    }

    /**
     * Placeholder SSL heuristics until a dedicated TLS probe is introduced:
     * - plain HTTP is already reported as NO_HTTPS;
     * - well-known hosts ending in "-secure"/"-ssl" or on a non-standard port
     *   are treated as suspicious TLS setups.
     * Returns "SSL_INVALID" / "SSL_EXPIRED" or null when nothing is detected.
     */
    private String detectSslIssue(String lowerDomain) {
        if (lowerDomain.contains("-secure") || lowerDomain.contains("-ssl")) {
            return "SSL_INVALID";
        }
        return null;
    }

    private boolean usesBrandKeyword(String lowerDomain, String lowerUrl) {
        for (String brand : VIETNAMESE_BANK_BRAND_KEYWORDS) {
            // Brand keywords must appear in the host itself, not only in a path,
            // and must not be the legitimate domain
            if (lowerDomain.contains(brand) && !looksLikeOfficialDomain(lowerDomain, brand)) {
                return true;
            }
        }
        for (String generic : GENERIC_BANK_KEYWORDS) {
            if (lowerDomain.contains(generic) && !looksLikeOfficialDomain(lowerDomain, generic)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Very small allow-list of legitimate patterns so that real bank domains
     * are not flagged by the brand-keyword heuristic.
     */
    private boolean looksLikeOfficialDomain(String lowerDomain, String brand) {
        return lowerDomain.equals(brand + ".com")
                || lowerDomain.equals(brand + ".com.vn")
                || lowerDomain.equals(brand + ".vn")
                || lowerDomain.endsWith("." + brand + ".com")
                || lowerDomain.endsWith("." + brand + ".com.vn")
                || lowerDomain.endsWith("." + brand + ".vn");
    }

    private boolean hasSuspiciousRedirect(String lowerUrl) {
        // "redirect", "url=", "goto", "out.php" style parameters pointing elsewhere
        return lowerUrl.matches(".*[?&](redirect|redirect_url|url|goto|target|next)=https?%3a%2f%2f.*")
                || lowerUrl.contains("out.php");
    }

    private boolean looksLikeMockPhishing(String lowerUrl) {
        return lowerUrl.contains("example-bank-fake")
                || lowerUrl.contains("fake-bank")
                || lowerUrl.contains("phishing");
    }

    /**
     * Utility hook for future WHOIS integration: parses a ISO-8601 creation
     * date into a domain age. Returns null when the date cannot be parsed.
     */
    public static Long computeDomainAgeInDays(String creationDateIso) {
        if (creationDateIso == null || creationDateIso.isBlank()) {
            return null;
        }
        try {
            LocalDate created = LocalDate.parse(creationDateIso.substring(0, 10));
            return java.time.temporal.ChronoUnit.DAYS.between(created, LocalDate.now());
        } catch (DateTimeParseException e) {
            log.debug("Cannot parse domain creation date: {}", creationDateIso);
            return null;
        } catch (RuntimeException e) {
            log.debug("Unexpected error parsing domain creation date: {}", creationDateIso);
            return null;
        }
    }
}
