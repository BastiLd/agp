package net.bastianklaus.keepinveverywhere.client;

import net.bastianklaus.keepinveverywhere.KeepInvEverywhere;
import net.bastianklaus.keepinveverywhere.data.InventorySnapshot;
import net.bastianklaus.keepinveverywhere.data.SlotStore;
import net.fabricmc.fabric.api.client.networking.v1.ClientPlayNetworking;
import net.bastianklaus.keepinveverywhere.net.ModNetworking;
import net.minecraft.client.MinecraftClient;
import net.minecraft.client.network.ClientPlayerEntity;

/**
 * Client-side glue for the GUI. Saving/listing/editing slots happen directly against
 * {@link SlotStore} (the local player's inventory is fully populated on the client). Loading is
 * delegated to the server, which must set the inventory authoritatively.
 */
public final class ClientSlotActions {
    private ClientSlotActions() {
    }

    /** Whether a world is loaded and the server accepts our load packets. */
    public static boolean serverAvailable() {
        return MinecraftClient.getInstance().player != null
                && ClientPlayNetworking.canSend(ModNetworking.LoadRequest.ID);
    }

    /** True if the local player currently has any item in any of the 41 slots. */
    public static boolean inventoryOccupied() {
        ClientPlayerEntity player = MinecraftClient.getInstance().player;
        if (player == null) {
            return false;
        }
        for (int i = 0; i < InventorySnapshot.SIZE; i++) {
            if (!player.getInventory().getStack(i).isEmpty()) {
                return true;
            }
        }
        return false;
    }

    /** Save the local player's complete inventory into a named slot. Returns success. */
    public static boolean save(String displayName) {
        MinecraftClient client = MinecraftClient.getInstance();
        ClientPlayerEntity player = client.player;
        if (player == null || client.world == null) {
            return false;
        }
        try {
            InventorySnapshot snapshot = InventorySnapshot.capture(player.getInventory());
            SlotStore.save(displayName, snapshot, client.world.getRegistryManager());
            return true;
        } catch (Exception e) {
            KeepInvEverywhere.LOGGER.error("Failed to save slot '{}'", displayName, e);
            return false;
        }
    }

    /** Ask the server to restore a saved slot into the player's inventory. */
    public static void requestLoad(String displayName) {
        if (serverAvailable()) {
            ClientPlayNetworking.send(new ModNetworking.LoadRequest(displayName));
        }
    }
}
