package pl.minebox.ultimate.listener;

import org.bukkit.event.EventHandler;
import org.bukkit.event.Listener;
import org.bukkit.event.player.PlayerJoinEvent;
import pl.minebox.ultimate.MineBoxUltimatePlugin;

public final class PlayerJoinListener implements Listener {

    private final MineBoxUltimatePlugin plugin;

    public PlayerJoinListener(MineBoxUltimatePlugin plugin) {
        this.plugin = plugin;
    }

    @EventHandler
    public void onPlayerJoin(PlayerJoinEvent event) {
        plugin.vipManager().sendJoinMessage(event.getPlayer());
    }
}
