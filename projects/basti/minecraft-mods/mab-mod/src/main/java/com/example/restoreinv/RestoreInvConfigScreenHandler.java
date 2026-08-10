package com.example.restoreinv;

import net.minecraft.entity.player.PlayerEntity;
import net.minecraft.entity.player.PlayerInventory;
import net.minecraft.inventory.SimpleInventory;
import net.minecraft.item.ItemStack;
import net.minecraft.item.Items;
import net.minecraft.screen.GenericContainerScreenHandler;
import net.minecraft.screen.ScreenHandlerType;
import net.minecraft.screen.slot.Slot;
import net.minecraft.text.Text;
import net.minecraft.screen.slot.SlotActionType;
import net.minecraft.server.network.ServerPlayerEntity;

public class RestoreInvConfigScreenHandler extends GenericContainerScreenHandler {
    private final RestoreInvStorage storage;

    public RestoreInvConfigScreenHandler(int syncId, PlayerInventory playerInventory, RestoreInvStorage storage,
            PlayerEntity player) {
        super(ScreenHandlerType.GENERIC_9X3, syncId, playerInventory, new SimpleInventory(9 * 3), 3);
        this.storage = storage;
        storage.updateConfigGUI(this);
    }

    @Override
    public ItemStack quickMove(PlayerEntity player, int slotIndex) {
        // Prevent moving items out of the config GUI slots
        Slot slot = this.slots.get(slotIndex);
        if (slot != null && slot.hasStack()) {
            // For now, disallow any quick move from config slots.
            // This might need more refined logic later.
            if (slotIndex < 9 * 3) { // Assuming 9x3 chest
                return ItemStack.EMPTY; // Prevent moving items from GUI slots
            }
        }
        return super.quickMove(player, slotIndex);
    }

    @Override
    public void onSlotClick(int slotIndex, int button, SlotActionType actionType, PlayerEntity player) {
        if (slotIndex >= 0 && slotIndex < this.getInventory().size()) {
            ItemStack clickedStack = this.getInventory().getStack(slotIndex);

            boolean handled = false;

            if (actionType == SlotActionType.PICKUP) { // Left click
                if (clickedStack.getItem() == Items.EMERALD) { // Increase button
                    if (slotIndex == 1) { // Slot 1 increase
                        storage.autoSaveInterval1 = Math.min(60, storage.autoSaveInterval1 + 1);
                        storage.updateConfigGUI(this);
                        player.sendMessage(
                                Text.literal("Slot 1 Intervall auf " + storage.autoSaveInterval1 + " Minuten erhöht!"),
                                false);
                        handled = true;
                    } else if (slotIndex == 10) { // Slot 2 increase
                        storage.autoSaveInterval2 = Math.min(60, storage.autoSaveInterval2 + 1);
                        storage.updateConfigGUI(this);
                        player.sendMessage(
                                Text.literal("Slot 2 Intervall auf " + storage.autoSaveInterval2 + " Minuten erhöht!"),
                                false);
                        handled = true;
                    }
                } else if (clickedStack.getItem() == Items.REDSTONE) { // Decrease button
                    if (slotIndex == 2) { // Slot 1 decrease
                        storage.autoSaveInterval1 = Math.max(1, storage.autoSaveInterval1 - 1);
                        storage.updateConfigGUI(this);
                        player.sendMessage(
                                Text.literal(
                                        "Slot 1 Intervall auf " + storage.autoSaveInterval1 + " Minuten verringert!"),
                                false);
                        handled = true;
                    } else if (slotIndex == 11) {
                        storage.autoSaveInterval2 = Math.max(1, storage.autoSaveInterval2 - 1);
                        storage.updateConfigGUI(this);
                        player.sendMessage(
                                Text.literal(
                                        "Slot 2 Intervall auf " + storage.autoSaveInterval2 + " Minuten verringert!"),
                                false);
                        handled = true;
                    }
                } else if (clickedStack.getItem() == Items.EMERALD_BLOCK) { // Save button
                    if (slotIndex == 18) {
                        storage.saveConfig();
                        ((ServerPlayerEntity) player).closeHandledScreen();
                        player.sendMessage(Text.literal("Konfiguration gespeichert!"), false);
                        handled = true;
                    }
                }
            }
            if (handled) {
                return;
            }
        }
        super.onSlotClick(slotIndex, button, actionType, player);
    }
}