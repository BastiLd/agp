package com.example.whodidwhatwhen;

import org.bukkit.plugin.java.JavaPlugin;
import org.bukkit.Bukkit;
import org.bukkit.event.Listener;

public class WhoDidWhatWhenPlugin extends JavaPlugin {

    private static WhoDidWhatWhenPlugin instance;

    public static WhoDidWhatWhenPlugin getInstance() {
        return instance;
    }

    @Override
    public void onEnable() {
        instance = this;
        getLogger().info("Who Did What When Tracker has been enabled!");

        // Register the ContainerTracker as an event listener
        Bukkit.getPluginManager().registerEvents(new ContainerTracker(), this);

    }

    @Override
    public void onDisable() {
        getLogger().info("Who Did What When Tracker has been disabled!");
    }
}