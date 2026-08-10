package com.example.restoreinv;

import net.fabricmc.api.ModInitializer;
import net.fabricmc.fabric.api.command.v2.CommandRegistrationCallback;
import net.minecraft.server.command.CommandManager;
import net.minecraft.text.Text;
import net.minecraft.server.network.ServerPlayerEntity;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
import net.minecraft.server.MinecraftServer;
import net.fabricmc.fabric.api.event.lifecycle.v1.ServerLifecycleEvents;

public class RestoreInvMod implements ModInitializer {
    private final RestoreInvStorage storage = new RestoreInvStorage();
    private final ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(1);
    private MinecraftServer serverInstance = null;

    @Override
    public void onInitialize() {
        // Lade die Konfiguration
        storage.loadConfig();

        // Perform an initial save for slots 0 and 1 when the server starts
        ServerLifecycleEvents.SERVER_STARTED.register(server -> {
            serverInstance = server;
            for (ServerPlayerEntity player : storage.getOnlinePlayers(server)) {
                storage.saveInventory(player, 0); // Initial save to slot 0
                storage.saveInventory(player, 1); // Initial save to slot 1
                player.sendMessage(Text.literal("Initial inventory backup for slots 1 & 2 complete."), false);
            }
        });

        // Register commands
        CommandRegistrationCallback.EVENT.register((dispatcher, registryAccess, environment) -> {
            dispatcher.register(CommandManager.literal("restoreInv")
                    .then(CommandManager.literal("1")
                            .executes(context -> {
                                ServerPlayerEntity player = context.getSource().getPlayer();
                                if (player != null) {
                                    storage.restoreInventory(player, 0);
                                    context.getSource().sendMessage(Text.literal("Inventory restored from slot 1"));
                                }
                                return 1;
                            }))
                    .then(CommandManager.literal("2")
                            .executes(context -> {
                                ServerPlayerEntity player = context.getSource().getPlayer();
                                if (player != null) {
                                    storage.restoreInventory(player, 1);
                                    context.getSource().sendMessage(Text.literal("Inventory restored from slot 2"));
                                }
                                return 1;
                            }))
                    .then(CommandManager.literal("3")
                            .executes(context -> {
                                ServerPlayerEntity player = context.getSource().getPlayer();
                                if (player != null) {
                                    storage.restoreInventory(player, 2);
                                    context.getSource().sendMessage(Text.literal("Inventory restored from slot 3"));
                                }
                                return 1;
                            }))
                    .then(CommandManager.literal("save")
                            .executes(context -> {
                                ServerPlayerEntity player = context.getSource().getPlayer();
                                if (player != null) {
                                    storage.saveInventory(player, 2);
                                    context.getSource().sendMessage(Text.literal("Inventory saved to slot 3"));
                                }
                                return 1;
                            }))
                    .then(CommandManager.literal("config")
                            .executes(context -> {
                                ServerPlayerEntity player = context.getSource().getPlayer();
                                if (player != null) {
                                    storage.openConfigScreen(player);
                                }
                                return 1;
                            })));
        });

        // Start autosave tasks
        scheduler.scheduleAtFixedRate(() -> {
            if (serverInstance == null)
                return;
            // Save to slot 1 every minute
            for (ServerPlayerEntity player : storage.getOnlinePlayers(serverInstance)) {
                storage.saveInventory(player, 0);
            }
        }, storage.getAutoSaveInterval1(), storage.getAutoSaveInterval1(), TimeUnit.MINUTES);

        scheduler.scheduleAtFixedRate(() -> {
            if (serverInstance == null)
                return;
            // Save to slot 2 every 5 minutes
            for (ServerPlayerEntity player : storage.getOnlinePlayers(serverInstance)) {
                storage.saveInventory(player, 1);
            }
        }, storage.getAutoSaveInterval2(), storage.getAutoSaveInterval2(), TimeUnit.MINUTES);
    }
}