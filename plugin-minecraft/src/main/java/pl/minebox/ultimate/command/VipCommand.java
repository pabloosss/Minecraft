package pl.minebox.ultimate.command;

import org.bukkit.command.Command;
import org.bukkit.command.CommandExecutor;
import org.bukkit.command.CommandSender;
import org.bukkit.entity.Player;
import pl.minebox.ultimate.MineBoxUltimatePlugin;

public final class VipCommand implements CommandExecutor {

    private final MineBoxUltimatePlugin plugin;

    public VipCommand(MineBoxUltimatePlugin plugin) {
        this.plugin = plugin;
    }

    @Override
    public boolean onCommand(CommandSender sender, Command command, String label, String[] args) {
        if (!(sender instanceof Player player)) {
            sender.sendMessage("Ta komenda jest tylko dla gracza.");
            return true;
        }

        player.sendMessage(plugin.vipManager().getVipStatusText(player));
        return true;
    }
}
