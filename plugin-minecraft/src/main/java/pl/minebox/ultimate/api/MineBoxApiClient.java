package pl.minebox.ultimate.api;

import org.bukkit.Bukkit;
import pl.minebox.ultimate.MineBoxUltimatePlugin;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

public final class MineBoxApiClient {

    private final MineBoxUltimatePlugin plugin;
    private HttpClient httpClient;
    private String apiUrl;
    private String apiKey;
    private String serverId;

    public MineBoxApiClient(MineBoxUltimatePlugin plugin) {
        this.plugin = plugin;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(5))
                .build();
        reload();
    }

    public void reload() {
        this.apiUrl = plugin.getConfig().getString("panel.api-url", "https://mine-box.pl/api");
        this.apiKey = plugin.getConfig().getString("panel.api-key", "CHANGE_ME");
        this.serverId = plugin.getConfig().getString("server.id", "local-test-server");
    }

    public void shutdown() {
        // Reserved for future websocket/client shutdown.
    }

    public void pushServerStatus() {
        if (!plugin.getConfig().getBoolean("panel.enabled", false)) {
            return;
        }

        String body = "{"
                + "\"serverId\":\"" + escape(serverId) + "\","
                + "\"onlinePlayers\":" + Bukkit.getOnlinePlayers().size() + ","
                + "\"maxPlayers\":" + Bukkit.getMaxPlayers() + ","
                + "\"minecraftVersion\":\"" + escape(Bukkit.getMinecraftVersion()) + "\","
                + "\"status\":\"online\""
                + "}";

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(apiUrl + "/minecraft/status"))
                .timeout(Duration.ofSeconds(8))
                .header("Content-Type", "application/json")
                .header("Authorization", "Bearer " + apiKey)
                .POST(HttpRequest.BodyPublishers.ofString(body))
                .build();

        try {
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() >= 300) {
                plugin.getLogger().warning("Panel status sync failed: HTTP " + response.statusCode());
            }
        } catch (IOException e) {
            plugin.getLogger().warning("Panel status sync failed: " + e.getMessage());
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            plugin.getLogger().warning("Panel status sync interrupted.");
        } catch (IllegalArgumentException e) {
            plugin.getLogger().warning("Invalid panel api-url in config.yml: " + apiUrl);
        }
    }

    public void notifyVipPurchase(String playerName, String packageName) {
        if (!plugin.getConfig().getBoolean("panel.enabled", false)) {
            return;
        }

        String body = "{"
                + "\"serverId\":\"" + escape(serverId) + "\","
                + "\"player\":\"" + escape(playerName) + "\","
                + "\"package\":\"" + escape(packageName) + "\""
                + "}";

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(apiUrl + "/minecraft/vip/purchase-confirmed"))
                .timeout(Duration.ofSeconds(8))
                .header("Content-Type", "application/json")
                .header("Authorization", "Bearer " + apiKey)
                .POST(HttpRequest.BodyPublishers.ofString(body))
                .build();

        Bukkit.getScheduler().runTaskAsynchronously(plugin, () -> {
            try {
                httpClient.send(request, HttpResponse.BodyHandlers.discarding());
            } catch (IOException | InterruptedException e) {
                if (e instanceof InterruptedException) {
                    Thread.currentThread().interrupt();
                }
                plugin.getLogger().warning("VIP purchase notify failed: " + e.getMessage());
            }
        });
    }

    private String escape(String value) {
        return value == null ? "" : value.replace("\\", "\\\\").replace("\"", "\\\"");
    }
}
