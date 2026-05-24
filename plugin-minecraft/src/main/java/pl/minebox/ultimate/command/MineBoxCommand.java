package pl.minebox.ultimate.command;

import org.bukkit.Bukkit;
import org.bukkit.ChatColor;
import org.bukkit.command.Command;
import org.bukkit.command.CommandExecutor;
import org.bukkit.command.CommandSender;
import org.bukkit.command.TabCompleter;
import pl.minebox.ultimate.MineBoxUltimatePlugin;
import pl.minebox.ultimate.vip.VipEntry;

import java.lang.reflect.Method;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

public final class MineBoxCommand implements CommandExecutor, TabCompleter {

    private final MineBoxUltimatePlugin plugin;
    private final List<String> subCommands = Arrays.asList("status", "reload", "vip", "sync");
    private final List<String> vipSubCommands = Arrays.asList("give", "remove", "list");

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

        String subCommand = args[0].toLowerCase(Locale.ROOT);
        switch (subCommand) {
            case "status":
                sendStatus(sender);
                break;
            case "reload":
                plugin.reloadMineBox();
                sender.sendMessage(message(plugin.getConfig().getString("messages.reloaded", "&aKonfiguracja przeładowana.")));
                break;
            case "sync":
                Bukkit.getScheduler().runTaskAsynchronously(plugin, new Runnable() {
                    @Override
                    public void run() {
                        plugin.apiClient().pushServerStatus();
                    }
                });
                sender.sendMessage(message("&aWysłano status serwera do panelu MineBox."));
                break;
            case "vip":
                handleVip(sender, args);
                break;
            default:
                sendHelp(sender);
                break;
        }

        return true;
    }

    private void handleVip(CommandSender sender, String[] args) {
        if (args.length < 2) {
            sendVipHelp(sender);
            return;
        }

        String vipCommand = args[1].toLowerCase(Locale.ROOT);
        switch (vipCommand) {
            case "give":
                handleVipGive(sender, args);
                break;
            case "remove":
                handleVipRemove(sender, args);
                break;
            case "list":
                handleVipList(sender);
                break;
            default:
                sendVipHelp(sender);
                break;
        }
    }

    private void handleVipGive(CommandSender sender, String[] args) {
        if (args.length < 4) {
            sender.sendMessage(message("&eUżycie: /minebox vip give <gracz> <pakiet> [dni]"));
            return;
        }

        String playerName = args[2];
        String packageName = args[3].toLowerCase(Locale.ROOT);
        int days = plugin.getConfig().getInt("vip.default-duration-days", 30);

        if (args.length >= 5) {
            try {
                days = Integer.parseInt(args[4]);
            } catch (NumberFormatException exception) {
                sender.sendMessage(message("&cDni muszą być liczbą. Dla permanentnego VIP-a wpisz 0 albo -1."));
                return;
            }
        }

        if (!plugin.vipManager().packageExists(packageName)) {
            sender.sendMessage(message("&cNie ma takiego pakietu w config.yml: &e" + packageName));
            return;
        }

        VipEntry entry = plugin.vipManager().giveVip(playerName, packageName, days);
        sender.sendMessage(message("&aNadano pakiet &e" + entry.packageName().toUpperCase(Locale.ROOT)
                + " &adla &e" + entry.name() + "&a. Wygasa: &e" + entry.formattedExpiration()));
    }

    private void handleVipRemove(CommandSender sender, String[] args) {
        if (args.length < 3) {
            sender.sendMessage(message("&eUżycie: /minebox vip remove <gracz>"));
            return;
        }

        boolean removed = plugin.vipManager().removeVip(args[2], false);
        if (removed) {
            sender.sendMessage(message("&aUsunięto VIP-a graczowi &e" + args[2] + "&a."));
        } else {
            sender.sendMessage(message("&eTen gracz nie miał zapisanego VIP-a: &6" + args[2]));
        }
    }

    private void handleVipList(CommandSender sender) {
        List<VipEntry> entries = plugin.vipManager().listActiveVips();
        if (entries.isEmpty()) {
            sender.sendMessage(message("&7Brak aktywnych VIP-ów."));
            return;
        }

        sender.sendMessage(color("&8&m----------------&r &aAktywni VIP &8&m----------------"));
        for (VipEntry entry : entries) {
            sender.sendMessage(color("&e" + entry.name()
                    + " &7| &a" + entry.packageName().toUpperCase(Locale.ROOT)
                    + " &7| wygasa: &f" + entry.formattedExpiration()
                    + " &7| zostało: &f" + entry.formattedRemaining()));
        }
    }

    private void sendStatus(CommandSender sender) {
        Runtime runtime = Runtime.getRuntime();
        long maxMb = runtime.maxMemory() / 1024 / 1024;
        long totalMb = runtime.totalMemory() / 1024 / 1024;
        long freeMb = runtime.freeMemory() / 1024 / 1024;
        long usedMb = totalMb - freeMb;

        sender.sendMessage(color("&8&m----------------&r &aMineBox Ultimate &8&m----------------"));
        sender.sendMessage(color("&7Nazwa serwera: &e" + plugin.getConfig().getString("server.display-name", "MineBox Test Server")));
        sender.sendMessage(color("&7Server ID: &e" + plugin.getConfig().getString("server.id", "local-test-server")));
        sender.sendMessage(color("&7Wersja pluginu: &e" + plugin.getDescription().getVersion()));
        sender.sendMessage(color("&7VIP system: &e" + enabledText(plugin.getConfig().getBoolean("vip.enabled", true))));
        sender.sendMessage(color("&7Panel sync: &e" + enabledText(plugin.getConfig().getBoolean("panel.enabled", false))));
        sender.sendMessage(color("&7Online: &e" + Bukkit.getOnlinePlayers().size() + "&7/&e" + Bukkit.getMaxPlayers()));
        sender.sendMessage(color("&7RAM: &e" + usedMb + " MB &7/ &e" + maxMb + " MB &8(total: " + totalMb + " MB)"));
        sender.sendMessage(color("&7TPS: &e" + getTpsText()));
    }

    private String getTpsText() {
        try {
            Method method = Bukkit.getServer().getClass().getMethod("getTPS");
            double[] tps = (double[]) method.invoke(Bukkit.getServer());
            if (tps.length == 0) {
                return "brak danych";
            }
            return String.format(Locale.US, "%.2f / %.2f / %.2f", Math.min(20.0, tps[0]), Math.min(20.0, tps[1]), Math.min(20.0, tps[2]));
        } catch (Exception exception) {
            return "brak danych";
        }
    }

    private String enabledText(boolean enabled) {
        return enabled ? "włączony" : "wyłączony";
    }

    private void sendHelp(CommandSender sender) {
        sender.sendMessage(color("&8&m----------------&r &aMineBox Ultimate &8&m----------------"));
        sender.sendMessage(color("&e/minebox status &7- status pluginu"));
        sender.sendMessage(color("&e/minebox reload &7- przeładuj konfigurację"));
        sender.sendMessage(color("&e/minebox sync &7- wyślij status do panelu"));
        sender.sendMessage(color("&e/minebox vip give <gracz> <pakiet> [dni] &7- nadaj VIP-a"));
        sender.sendMessage(color("&e/minebox vip remove <gracz> &7- usuń VIP-a"));
        sender.sendMessage(color("&e/minebox vip list &7- lista aktywnych VIP-ów"));
    }

    private void sendVipHelp(CommandSender sender) {
        sender.sendMessage(message("&eUżycie:"));
        sender.sendMessage(color("&e/minebox vip give <gracz> <pakiet> [dni]"));
        sender.sendMessage(color("&e/minebox vip remove <gracz>"));
        sender.sendMessage(color("&e/minebox vip list"));
    }

    private String message(String text) {
        String prefix = plugin.getConfig().getString("messages.prefix", "&8[&aMineBox&8] &7");
        return color(prefix + text);
    }

    private String color(String text) {
        return ChatColor.translateAlternateColorCodes('&', text == null ? "" : text);
    }

    @Override
    public List<String> onTabComplete(CommandSender sender, Command command, String alias, String[] args) {
        if (args.length == 1) {
            return filter(subCommands, args[0]);
        }
        if (args.length == 2 && args[0].equalsIgnoreCase("vip")) {
            return filter(vipSubCommands, args[1]);
        }
        if (args.length == 4 && args[0].equalsIgnoreCase("vip") && args[1].equalsIgnoreCase("give")) {
            return filter(plugin.vipManager().getPackageNames(), args[3]);
        }
        if (args.length == 5 && args[0].equalsIgnoreCase("vip") && args[1].equalsIgnoreCase("give")) {
            return filter(Arrays.asList("30", "60", "90", "0"), args[4]);
        }
        return new ArrayList<String>();
    }

    private List<String> filter(List<String> values, String prefix) {
        String lowerPrefix = prefix.toLowerCase(Locale.ROOT);
        return values.stream()
                .filter(item -> item.toLowerCase(Locale.ROOT).startsWith(lowerPrefix))
                .collect(Collectors.toList());
    }
}
