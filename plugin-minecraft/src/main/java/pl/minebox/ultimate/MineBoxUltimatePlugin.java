package pl.minebox.ultimate;

import org.bukkit.plugin.java.JavaPlugin;
import pl.minebox.ultimate.api.MineBoxApiClient;
import pl.minebox.ultimate.command.MineBoxCommand;
import pl.minebox.ultimate.command.VipCommand;
import pl.minebox.ultimate.listener.PlayerJoinListener;
import pl.minebox.ultimate.vip.VipManager;

public final class MineBoxUltimatePlugin extends JavaPlugin {

    private MineBoxApiClient apiClient;
    private VipManager vipManager;

    @Override
    public void onEnable() {
        saveDefaultConfig();

        this.apiClient = new MineBoxApiClient(this);
        this.vipManager = new VipManager(this);

        registerCommands();
        registerListeners();
        startPanelSyncTask();

        getLogger().info("MineBox Ultimate enabled.");
    }

    @Override
    public void onDisable() {
        if (apiClient != null) {
            apiClient.shutdown();
        }
        getLogger().info("MineBox Ultimate disabled.");
    }

    public void reloadMineBox() {
        reloadConfig();
        apiClient.reload();
        vipManager.reload();
    }

    public MineBoxApiClient apiClient() {
        return apiClient;
    }

    public VipManager vipManager() {
        return vipManager;
    }

    private void registerCommands() {
        MineBoxCommand mineBoxCommand = new MineBoxCommand(this);
        getCommand("minebox").setExecutor(mineBoxCommand);
        getCommand("minebox").setTabCompleter(mineBoxCommand);
        getCommand("vip").setExecutor(new VipCommand(this));
    }

    private void registerListeners() {
        getServer().getPluginManager().registerEvents(new PlayerJoinListener(this), this);
    }

    private void startPanelSyncTask() {
        if (!getConfig().getBoolean("panel.enabled", false)) {
            getLogger().info("Panel sync is disabled in config.yml.");
            return;
        }

        long intervalSeconds = getConfig().getLong("panel.sync-interval-seconds", 30L);
        long intervalTicks = Math.max(20L, intervalSeconds * 20L);

        getServer().getScheduler().runTaskTimerAsynchronously(this, () -> apiClient.pushServerStatus(), 100L, intervalTicks);
    }
}
