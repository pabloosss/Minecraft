package pl.minebox.ultimate;

import org.bukkit.command.PluginCommand;
import org.bukkit.plugin.java.JavaPlugin;
import pl.minebox.ultimate.api.MineBoxApiClient;
import pl.minebox.ultimate.command.MineBoxCommand;
import pl.minebox.ultimate.command.VipCommand;
import pl.minebox.ultimate.listener.PlayerJoinListener;
import pl.minebox.ultimate.vip.VipManager;

public final class MineBoxUltimatePlugin extends JavaPlugin {

    private MineBoxApiClient apiClient;
    private VipManager vipManager;
    private int panelSyncTaskId = -1;
    private int vipExpiryTaskId = -1;

    @Override
    public void onEnable() {
        saveDefaultConfig();

        this.apiClient = new MineBoxApiClient(this);
        this.vipManager = new VipManager(this);

        registerCommands();
        registerListeners();
        startPanelSyncTask();
        startVipExpiryTask();

        getLogger().info("MineBox Ultimate enabled.");
    }

    @Override
    public void onDisable() {
        if (panelSyncTaskId != -1) {
            getServer().getScheduler().cancelTask(panelSyncTaskId);
        }
        if (vipExpiryTaskId != -1) {
            getServer().getScheduler().cancelTask(vipExpiryTaskId);
        }
        if (apiClient != null) {
            apiClient.shutdown();
        }
        getLogger().info("MineBox Ultimate disabled.");
    }

    public void reloadMineBox() {
        reloadConfig();
        apiClient.reload();
        vipManager.reload();
        restartPanelSyncTask();
    }

    public MineBoxApiClient apiClient() {
        return apiClient;
    }

    public VipManager vipManager() {
        return vipManager;
    }

    private void registerCommands() {
        MineBoxCommand mineBoxCommand = new MineBoxCommand(this);
        PluginCommand minebox = getCommand("minebox");
        if (minebox != null) {
            minebox.setExecutor(mineBoxCommand);
            minebox.setTabCompleter(mineBoxCommand);
        }

        PluginCommand vip = getCommand("vip");
        if (vip != null) {
            vip.setExecutor(new VipCommand(this));
        }
    }

    private void registerListeners() {
        getServer().getPluginManager().registerEvents(new PlayerJoinListener(this), this);
    }

    private void restartPanelSyncTask() {
        if (panelSyncTaskId != -1) {
            getServer().getScheduler().cancelTask(panelSyncTaskId);
            panelSyncTaskId = -1;
        }
        startPanelSyncTask();
    }

    private void startPanelSyncTask() {
        if (!getConfig().getBoolean("panel.enabled", false)) {
            getLogger().info("Panel sync is disabled in config.yml.");
            return;
        }

        long intervalSeconds = getConfig().getLong("panel.sync-interval-seconds", 30L);
        long intervalTicks = Math.max(20L, intervalSeconds * 20L);

        panelSyncTaskId = getServer().getScheduler()
                .runTaskTimerAsynchronously(this, () -> apiClient.pushServerStatus(), 100L, intervalTicks)
                .getTaskId();
    }

    private void startVipExpiryTask() {
        vipExpiryTaskId = getServer().getScheduler()
                .runTaskTimer(this, () -> {
                    int removed = vipManager.removeExpiredVips();
                    if (removed > 0) {
                        getLogger().info("Removed expired VIP entries: " + removed);
                    }
                }, 20L * 60L, 20L * 60L * 5L)
                .getTaskId();
    }
}
