package com.example.timermod;

import net.fabricmc.api.ModInitializer;
import net.fabricmc.fabric.api.command.v2.CommandRegistrationCallback;
import net.fabricmc.fabric.api.event.lifecycle.v1.ServerTickEvents;

public class TimerMod implements ModInitializer {
    public static final String MOD_ID = "timermod";

    @Override
    public void onInitialize() {
        // Register commands
        CommandRegistrationCallback.EVENT.register((dispatcher, registryAccess, environment) -> {
            TimerCommands.registerCommands(dispatcher);
        });

        // Register tick event
        ServerTickEvents.END_SERVER_TICK.register(server -> {
            TimerManager.getInstance().onServerTick();
        });
    }
}
