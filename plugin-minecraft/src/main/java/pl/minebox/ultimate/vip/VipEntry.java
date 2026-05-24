package pl.minebox.ultimate.vip;

import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

public final class VipEntry {

    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm")
            .withZone(ZoneId.systemDefault());

    private final UUID uuid;
    private final String name;
    private final String packageName;
    private final long expiresAt;

    public VipEntry(UUID uuid, String name, String packageName, long expiresAt) {
        this.uuid = uuid;
        this.name = name;
        this.packageName = packageName;
        this.expiresAt = expiresAt;
    }

    public UUID uuid() {
        return uuid;
    }

    public String name() {
        return name;
    }

    public String packageName() {
        return packageName;
    }

    public long expiresAt() {
        return expiresAt;
    }

    public boolean isPermanent() {
        return expiresAt <= 0;
    }

    public boolean isExpired() {
        return !isPermanent() && System.currentTimeMillis() >= expiresAt;
    }

    public long remainingMillis() {
        if (isPermanent()) {
            return -1;
        }
        return Math.max(0, expiresAt - System.currentTimeMillis());
    }

    public String formattedExpiration() {
        if (isPermanent()) {
            return "permanent";
        }
        return DATE_FORMAT.format(Instant.ofEpochMilli(expiresAt));
    }

    public String formattedRemaining() {
        if (isPermanent()) {
            return "na zawsze";
        }

        long seconds = remainingMillis() / 1000;
        long days = seconds / 86400;
        long hours = (seconds % 86400) / 3600;
        long minutes = (seconds % 3600) / 60;

        if (days > 0) {
            return days + "d " + hours + "h";
        }
        if (hours > 0) {
            return hours + "h " + minutes + "m";
        }
        return minutes + "m";
    }
}
