package pl.minebox.ultimate.command;

import org.bukkit.ChatColor;
import org.bukkit.command.Command;
import org.bukkit.command.CommandExecutor;
import org.bukkit.command.CommandSender;
import org.bukkit.command.TabCompleter;
import pl.minebox.ultimate.MineBoxUltimatePlugin;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

public final class MineBoxCommand implements CommandExecutor, TabCompleter {

    private final MineBoxUltimatePlugin plugin;
    private final List<String> subCommands = Arrays.asList("status", "reload", "vip", "sync");

    public MineBoxCommand(MineBoxUltimatePlugin plugin) {
        this.plugin = plugin;
    }

    @Override
    public boolean onCommand(CommandSender sender, Command command, String label, String[] args) {
        if (!sender.hasPermission("minebox.admin")) {
            sender.sendMessage(message(plugin.getConfig().getString("messages.no-permission", "&cNie masz uprawnień.")));
            return true;
        }

        if (args.length == 0) {
            sendHelp(sender);
            return true;
        }

        switch (args[0].toLowerCase()) {
            case "status" -> sendStatus(sender);
            case "reload" -> {
                plugin.reloadMineBox();
                sender.sendMessage(message(plugin.getConfig().getString("messages.reloaded", "&aKonfiguracja przeładowana.")));
            }
            case "sync" -> {
                plugin.getServer().getScheduler().runTaskAsynchronously(plugin, () -> plugin.apiClient().pushServerStatus());
                sender.sendMessage(message("&aWysłano status serwera do panelu MineBox."));
            }
            case "vip" -> handleVip(sender, args);
            default -> sendHelp(sender);
        }

        return true;
    }

    private void handleVip(CommandSender sender, String[] args) {
        if (args.length < 4 || !args[1].equalsIgnoreCase("give")) {
            sender.sendMessage(message("&eUżycie: /minebox vip give <gracz> <pakiet>"));
            return;
        }

        String playerName = plugin.vipManager().getOfflinePlayerName(args[2]);
        String packageName = args[3].toLowerCase();
        plugin.vipManager().activatePackage(playerName, packageName);
        sender.sendMessage(message("&aAktywowano pakiet &e" + packageName + " &adla gracza &e" + playerName + "&a."));
    }

    private void sendStatus(CommandSender sender) {
        sender.sendMessage(color("&8&m----------------&r &aMineBox Ultimate &8&m----------------"));
        sender.sendMessage(color("&7Server ID: &e" + plugin.getConfig().getString("server.id")));
        sender.sendMessage(color("&7Panel: &e" + (plugin.getConfig().getBoolean("panel.enabled") ? "włączony" : "wyłączony")));
        sender.sendMessage(color("&7Online: &e" + plugin.getServer().getOnlinePlayers().size() + "&7/&e" + plugin.getServer().getMaxPlayers()));
        sender.sendMessage(color("&7VIP: &e" + (plugin.getConfig().getBoolean("vip.enabled") ? "włączony" : "wyłączony")));
    }

    private void sendHelp(CommandSender sender) {
        sender.sendMessage(color("&8&m----------------&r &aMineBox Ultimate &8&m----------------"));
        sender.sendMessage(color("&e/minebox status &7- status pluginu"));
        sender.sendMessage(color("&e/minebox reload &7- przeładuj konfigurację"));
        sender.sendMessage(color("&e/minebox sync &7- wyślij status do panelu"));
        sender.sendMessage(color("&e/minebox vip give <gracz> <pakiet> &7- aktywuj VIP-a"));
    }

    private String message(String text) {
        String prefix = plugin.getConfig().getString("messages.prefix", "&8[&aMineBox&8] &7");
        return color(prefix + text);
    }

    private String color(String text) {
        return ChatColor.translateAlternateColorCodes('&', text);
    }

    @Override
    public List<String> onTabComplete(CommandSender sender, Command command, String alias, String[] args) {
        if (args.length == 1) {
            return subCommands.stream()
                    .filter(item -> item.startsWith(args[0].toLowerCase()))
                    .collect(Collectors.toList());
        }
        if (args.length == 2 && args[0].equalsIgnoreCase("vip")) {
            return List.of("give");
        }
        if (args.length == 4 && args[0].equalsIgnoreCase("vip") && args[1].equalsIgnoreCase("give")) {
            return new ArrayList<>(plugin.getConfig().getConfigurationSection("vip.packages").getKeys(false));
        }
        return List.of();
    }
}
