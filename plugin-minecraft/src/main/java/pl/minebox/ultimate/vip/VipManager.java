package pl.minebox.ultimate.vip;

import org.bukkit.Bukkit;
import org.bukkit.ChatColor;
import org.bukkit.OfflinePlayer;
import org.bukkit.command.ConsoleCommandSender;
import org.bukkit.configuration.ConfigurationSection;
import org.bukkit.configuration.file.FileConfiguration;
import org.bukkit.configuration.file.YamlConfiguration;
import org.bukkit.entity.Player;
import pl.minebox.ultimate.MineBoxUltimatePlugin;

import java.io.File;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

public final class VipManager {

    private final MineBoxUltimatePlugin plugin;
    private final Map<UUID, VipEntry> vipEntries = new LinkedHashMap<>();
    private File vipFile;
    private FileConfiguration vipConfig;

    public VipManager(MineBoxUltimatePlugin plugin) {
        this.plugin = plugin;
        setupFile();
        reload();
    }

    public void reload() {
        setupFile();
        vipConfig = YamlConfiguration.loadConfiguration(vipFile);
        vipEntries.clear();

        for (String key : vipConfig.getKeys(false)) {
            try {
                UUID uuid = UUID.fromString(key);
                String name = vipConfig.getString(key + ".name", "Unknown");
                String packageName = vipConfig.getString(key + ".package", "vip").toLowerCase();
                long expiresAt = vipConfig.getLong(key + ".expires-at", -1L);
                vipEntries.put(uuid, new VipEntry(uuid, name, packageName, expiresAt));
            } catch (IllegalArgumentException exception) {
                plugin.getLogger().warning("Invalid UUID in vips.yml: " + key);
            }
        }
    }

    public Optional<VipEntry> getVip(Player player) {
        VipEntry entry = vipEntries.get(player.getUniqueId());
        if (entry == null) {
            return Optional.empty();
        }
        if (entry.isExpired()) {
            removeVip(player.getUniqueId(), player.getName(), true);
            return Optional.empty();
        }
        return Optional.of(entry);
    }

    public Optional<VipEntry> getVip(UUID uuid) {
        VipEntry entry = vipEntries.get(uuid);
        if (entry == null) {
            return Optional.empty();
        }
        if (entry.isExpired()) {
            removeVip(uuid, entry.name(), true);
            return Optional.empty();
        }
        return Optional.of(entry);
    }

    public boolean isVip(Player player) {
        return getVip(player).isPresent();
    }

    public List<VipEntry> listActiveVips() {
        removeExpiredVips();
        return vipEntries.values().stream()
                .sorted(Comparator.comparing(VipEntry::name, String.CASE_INSENSITIVE_ORDER))
                .toList();
    }

    public boolean packageExists(String packageName) {
        return plugin.getConfig().isConfigurationSection("vip.packages." + packageName.toLowerCase());
    }

    public VipEntry giveVip(String playerName, String packageName, int days) {
        String normalizedPackage = packageName.toLowerCase();
        OfflinePlayer offlinePlayer = Bukkit.getOfflinePlayer(playerName);
        UUID uuid = offlinePlayer.getUniqueId();
        String safeName = offlinePlayer.getName() != null ? offlinePlayer.getName() : playerName;
        long expiresAt = days <= 0 ? -1L : System.currentTimeMillis() + (days * 24L * 60L * 60L * 1000L);

        VipEntry entry = new VipEntry(uuid, safeName, normalizedPackage, expiresAt);
        vipEntries.put(uuid, entry);
        saveEntry(entry);
        executePackageCommands(safeName, normalizedPackage, days);
        plugin.apiClient().notifyVipPurchase(safeName, normalizedPackage);
        return entry;
    }

    public boolean removeVip(String playerName, boolean expired) {
        OfflinePlayer offlinePlayer = Bukkit.getOfflinePlayer(playerName);
        UUID uuid = offlinePlayer.getUniqueId();
        String safeName = offlinePlayer.getName() != null ? offlinePlayer.getName() : playerName;
        return removeVip(uuid, safeName, expired);
    }

    public boolean removeVip(UUID uuid, String playerName, boolean expired) {
        VipEntry removed = vipEntries.remove(uuid);
        vipConfig.set(uuid.toString(), null);
        saveFile();

        executeRemoveCommands(playerName);

        if (removed != null) {
            plugin.getLogger().info("Removed VIP from " + playerName + (expired ? " because it expired." : "."));
        }
        return removed != null;
    }

    public int removeExpiredVips() {
        List<VipEntry> expired = new ArrayList<>();
        for (VipEntry entry : vipEntries.values()) {
            if (entry.isExpired()) {
                expired.add(entry);
            }
        }

        for (VipEntry entry : expired) {
            removeVip(entry.uuid(), entry.name(), true);
        }
        return expired.size();
    }

    public void handleJoin(Player player) {
        Optional<VipEntry> optionalVip = getVip(player);
        if (optionalVip.isEmpty()) {
            return;
        }

        VipEntry entry = optionalVip.get();
        String message = plugin.getConfig().getString("vip.join-message", "&6[VIP] &e%player% &7dołączył na serwer!")
                .replace("%player%", player.getName())
                .replace("%package%", entry.packageName().toUpperCase())
                .replace("%remaining%", entry.formattedRemaining());
        Bukkit.broadcastMessage(color(message));
    }

    public String getVipStatusText(Player player) {
        Optional<VipEntry> optionalVip = getVip(player);
        if (optionalVip.isEmpty()) {
            return color("&8[&aMineBox&8] &7Nie masz aktywnego VIP-a.");
        }

        VipEntry entry = optionalVip.get();
        return color("&8[&aMineBox&8] &aMasz aktywny pakiet: &e" + entry.packageName().toUpperCase()
                + "&a. Pozostało: &e" + entry.formattedRemaining()
                + "&a. Wygasa: &e" + entry.formattedExpiration());
    }

    public List<String> getPackageNames() {
        ConfigurationSection section = plugin.getConfig().getConfigurationSection("vip.packages");
        if (section == null) {
            return List.of();
        }
        return new ArrayList<>(section.getKeys(false));
    }

    private void executePackageCommands(String playerName, String packageName, int days) {
        String path = "vip.packages." + packageName + ".commands-on-buy";
        List<String> commands = plugin.getConfig().getStringList(path);
        ConsoleCommandSender console = Bukkit.getConsoleSender();

        for (String rawCommand : commands) {
            String command = rawCommand
                    .replace("%player%", playerName)
                    .replace("%package%", packageName)
                    .replace("%days%", String.valueOf(days));
            Bukkit.dispatchCommand(console, command);
        }
    }

    private void executeRemoveCommands(String playerName) {
        List<String> commands = plugin.getConfig().getStringList("vip.commands-on-remove");
        if (commands.isEmpty()) {
            commands = List.of(
                    "lp user %player% permission unset minebox.vip",
                    "lp user %player% permission unset minebox.svip"
            );
        }

        ConsoleCommandSender console = Bukkit.getConsoleSender();
        for (String rawCommand : commands) {
            Bukkit.dispatchCommand(console, rawCommand.replace("%player%", playerName));
        }
    }

    private void saveEntry(VipEntry entry) {
        String key = entry.uuid().toString();
        vipConfig.set(key + ".name", entry.name());
        vipConfig.set(key + ".package", entry.packageName());
        vipConfig.set(key + ".expires-at", entry.expiresAt());
        saveFile();
    }

    private void setupFile() {
        if (!plugin.getDataFolder().exists() && !plugin.getDataFolder().mkdirs()) {
            plugin.getLogger().warning("Could not create plugin data folder.");
        }

        vipFile = new File(plugin.getDataFolder(), "vips.yml");
        if (!vipFile.exists()) {
            try {
                if (!vipFile.createNewFile()) {
                    plugin.getLogger().warning("Could not create vips.yml.");
                }
            } catch (IOException exception) {
                plugin.getLogger().warning("Could not create vips.yml: " + exception.getMessage());
            }
        }
    }

    private void saveFile() {
        try {
            vipConfig.save(vipFile);
        } catch (IOException exception) {
            plugin.getLogger().warning("Could not save vips.yml: " + exception.getMessage());
        }
    }

    private String color(String text) {
        return ChatColor.translateAlternateColorCodes('&', text == null ? "" : text);
    }
}
