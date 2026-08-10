package net.bastianklaus.keepinveverywhere;

import net.bastianklaus.keepinveverywhere.config.ModConfig;
import net.bastianklaus.keepinveverywhere.net.ModNetworking;
import net.bastianklaus.keepinveverywhere.region.RegionJobs;
import net.bastianklaus.keepinveverywhere.server.KeepInventoryLogic;
import net.bastianklaus.keepinveverywhere.server.ServerLoadHandler;
import net.fabricmc.api.ModInitializer;
import net.fabricmc.fabric.api.entity.event.v1.ServerPlayerEvents;
import net.fabricmc.fabric.api.event.lifecycle.v1.ServerTickEvents;
import net.fabricmc.fabric.api.networking.v1.ServerPlayNetworking;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Common entrypoint. Runs on both the integrated/dedicated server and the client.
 * Registers networking, the cross-death inventory copy, and loads the global config.
 */
public class KeepInvEverywhere implements ModInitializer {
    public static final String MOD_ID = "keepinveverywhere";
    public static final Logger LOGGER = LoggerFactory.getLogger("KeepInvEverywhere");

    @Override
    public void onInitialize() {
        ModConfig.init();
        ModNetworking.registerPayloads();

        // Server receives a "load this named slot" request and applies it authoritatively.
        ServerPlayNetworking.registerGlobalReceiver(ModNetworking.LoadRequest.ID, (payload, context) -> {
            var player = context.player();
            player.getServer().execute(() -> ServerLoadHandler.apply(player, payload.name()));
        });

        // Independent "keep inventory on death": when the toggle (or the vanilla gamerule)
        // is on, the dropped-on-death inventory is preserved (drop is cancelled by the mixin)
        // and copied onto the freshly respawned player here.
        ServerPlayerEvents.COPY_FROM.register((oldPlayer, newPlayer, alive) -> {
            if (!alive && KeepInventoryLogic.shouldKeep(newPlayer)) {
                newPlayer.getInventory().clone(oldPlayer.getInventory());
                if (ModConfig.get().keepXp) {
                    newPlayer.experienceLevel = oldPlayer.experienceLevel;
                    newPlayer.experienceProgress = oldPlayer.experienceProgress;
                    newPlayer.totalExperience = oldPlayer.totalExperience;
                }
            }
        });

        // Region copy/paste jobs are sliced across server ticks (large builds never freeze the game).
        ServerTickEvents.END_SERVER_TICK.register(RegionJobs::tick);

        LOGGER.info("KeepInvEverywhere initialized.");
    }
}
