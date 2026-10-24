package com.echora.content.util;

import java.time.LocalDateTime;
import java.time.ZoneOffset;

/** Mọi mốc thời gian ghi DB dùng UTC, khớp DEFAULT SYSUTCDATETIME() của migration. */
public final class TimeUtils {
    private TimeUtils() {
    }

    public static LocalDateTime nowUtc() {
        return LocalDateTime.now(ZoneOffset.UTC);
    }
}
