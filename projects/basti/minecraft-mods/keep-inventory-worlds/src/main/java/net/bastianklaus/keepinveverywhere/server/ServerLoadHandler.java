package net.bastianklaus.keepinveverywhere.server;

import net.bastianklaus.keepinveverywhere.KeepInvEverywhere;
import net.bastianklaus.keepinveverywhere.data.InventorySnapshot;
import net.bastianklaus.keepinveverywhere.data.SlotStore;
import net.bastianklaus.keepinveverywhere.net.ModNetworking;
import net.fabricmc.fabric.api.networking.v1.ServerPlayNetworking;
import net.minecraft.server.network.ServerPlayerEntity;

/**
 * Applies a saved slot to a player's inventory on the server thread, then re-syncs the client
 * and reports the outcome. This is the only operation that must be server-authoritative.
 */
public final class ServerLoadHandler {
    private ServerLoadHandler() {
    }

    public static void apply(ServerPlayerEntity player, String slotName) {
        try {
            InventorySnapshot snapshot = SlotStore.load(slotName, player.getRegistryManager());
            if (snapshot == null) {
                send(player, false, "keepinveverywhere.message.not_found", 0, 0);
                return;
            }

            int restored = snapshot.restoreTo(player.getInventory());

            // Push the new inventory state back to the client.
            player.getInventory().markDirty();
            player.playerScreenHandler.sendContentUpdates();
            player.currentScreenHandler.sendContentUpdates();

            send(player, true, "keepinveverywhere.message.loaded", restored, snapshot.skipped());
        } catch (Exception e) {
            KeepInvEverywhere.LOGGER.error("Failed to load slot '{}' for {}", slotName, player.getName().getString(), e);
            send(player, false, "keepinveverywhere.message.load_error", 0, 0);
        }
    }

    private static void send(ServerPlayerEntity player, boolean success, String key, int restored, int skipped) {
        ServerPlayNetworking.send(player, new ModNetworking.LoadResult(success, key, restored, skipped));
    }
}
