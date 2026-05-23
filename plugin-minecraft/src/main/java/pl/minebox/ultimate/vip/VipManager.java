package pl.minebox.ultimate.vip;

import org.bukkit.Bukkit;
import org.bukkit.ChatColor;
import org.bukkit.OfflinePlayer;
import org.bukkit.command.ConsoleCommandSender;
import org.bukkit.entity.Player;
import pl.minebox.ultimate.MineBoxUltimatePlugin;

import java.util.List;

public final class VipManager {

    private final MineBoxUltimatePlugin plugin;
    private String vipPermission;

    public VipManager(MineBoxUltimatePlugin plugin) {
        this.plugin = plugin;
        reload();
    }

    public void reload() {
        this.vipPermission = plugin.getConfig().getString("vip.permission", "minebox.vip");
    }

    public boolean isVip(Player player) {
        return player.hasPermission(vipPermission);
    }

    public void activatePackage(String playerName, String packageName) {
        String path = "vip.packages." + packageName + ".commands-on-buy";
        List<String> commands = plugin.getConfig().getStringList(path);

        if (commands.isEmpty()) {
            plugin.getLogger().warning("VIP package not found or has no commands: " + packageName);
            return;
        }

        ConsoleCommandSender console = Bukkit.getConsoleSender();
        for (String rawCommand : commands) {
            String command = rawCommand
                    .replace("%player%", playerName)
                    .replace("%package%", packageName);
            Bukkit.dispatchCommand(console, command);
        }

        plugin.apiClient().notifyVipPurchase(playerName, packageName);
    }

    public void sendJoinMessage(Player player) {
        if (!plugin.getConfig().getBoolean("vip.enabled", true)) {
            return;
        }
        if (!isVip(player)) {
            return;
        }

        String message = plugin.getConfig().getString("vip.join-message", "&6[VIP] &e%player% &7dołączył na serwer!")
                .replace("%player%", player.getName());
        Bukkit.broadcastMessage(color(message));
    }

    public String getVipStatusText(Player player) {
        if (isVip(player)) {
            return color("&aMasz aktywny status VIP.");
        }
        return color("&7Nie masz aktywnego VIP-a. Kupisz go przez panel MineBox.");
    }

    public String getOfflinePlayerName(String name) {
        OfflinePlayer offlinePlayer = Bukkit.getOfflinePlayerIfCached(name);
        return offlinePlayer != null && offlinePlayer.getName() != null ? offlinePlayer.getName() : name;
    }

    private String color(String text) {
        return ChatColor.translateAlternateColorCodes('&', text);
    }
}
