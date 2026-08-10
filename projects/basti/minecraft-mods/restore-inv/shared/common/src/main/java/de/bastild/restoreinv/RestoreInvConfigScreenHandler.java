package de.bastild.restoreinv;

import net.minecraft.entity.player.PlayerEntity;
import net.minecraft.entity.player.PlayerInventory;
import net.minecraft.inventory.SimpleInventory;
import net.minecraft.item.ItemStack;
import net.minecraft.item.Items;
import net.minecraft.screen.GenericContainerScreenHandler;
import net.minecraft.screen.ScreenHandlerType;
import net.minecraft.screen.SimpleNamedScreenHandlerFactory;
import net.minecraft.screen.slot.SlotActionType;
import net.minecraft.server.network.ServerPlayerEntity;
import net.minecraft.text.Text;

public class RestoreInvConfigScreenHandler extends GenericContainerScreenHandler {
    private final RestoreInvStorage storage;
    private final PlayerEntity player;

    public RestoreInvConfigScreenHandler(int syncId, PlayerInventory playerInventory, RestoreInvStorage storage,
            PlayerEntity player) {
        super(ScreenHandlerType.GENERIC_9X3, syncId, playerInventory, new SimpleInventory(9 * 3), 3);
        this.storage = storage;
        this.player = player;
        storage.updateConfigGUI(this);
    }

    @Override
    public ItemStack quickMove(PlayerEntity player, int slotIndex) {
        // Verhindere, dass jemand die Config-Items aus der GUI rausholt.
        if (slotIndex >= 0 && slotIndex < this.getInventory().size()) {
            return ItemStack.EMPTY;
        }
        return super.quickMove(player, slotIndex);
    }

    @Override
    public void onSlotClick(int slotIndex, int button, SlotActionType actionType, PlayerEntity player) {
        if (slotIndex < 0 || slotIndex >= this.getInventory().size()) {
            return;
        }
        if (!(player instanceof ServerPlayerEntity sp)) {
            return;
        }

        // Alle Slots ausser "Last Saves" (4) aendern globale Server-Settings bzw.
        // oeffnen das Admin-Panel -> Admin-Recht erforderlich.
        if (slotIndex != 4 && !PermissionGate.canAdminister(sp)) {
            sp.sendMessage(Text.translatable("restoreinv.msg.no_permission_config"), false);
            return;
        }

        boolean isLeft  = button == 0 && actionType == SlotActionType.PICKUP;
        boolean isRight = button == 1 && actionType == SlotActionType.PICKUP;

        switch (slotIndex) {
            case 1: // Slot 1 +1
                if (isLeft) {
                    storage.autoSaveInterval1 = Math.min(60, storage.autoSaveInterval1 + 1);
                    redraw(sp, Text.translatable("restoreinv.feedback.interval1", storage.autoSaveInterval1));
                }
                return;
            case 2: // Slot 1 -1
                if (isLeft) {
                    storage.autoSaveInterval1 = Math.max(1, storage.autoSaveInterval1 - 1);
                    redraw(sp, Text.translatable("restoreinv.feedback.interval1", storage.autoSaveInterval1));
                }
                return;
            case 10: // Slot 2 +1
                if (isLeft) {
                    storage.autoSaveInterval2 = Math.min(60, storage.autoSaveInterval2 + 1);
                    redraw(sp, Text.translatable("restoreinv.feedback.interval2", storage.autoSaveInterval2));
                }
                return;
            case 11: // Slot 2 -1
                if (isLeft) {
                    storage.autoSaveInterval2 = Math.max(1, storage.autoSaveInterval2 - 1);
                    redraw(sp, Text.translatable("restoreinv.feedback.interval2", storage.autoSaveInterval2));
                }
                return;
            case 3: // Chat-Toggle
                if (isLeft) {
                    storage.showSaveMessages = !storage.showSaveMessages;
                    redraw(sp, Text.translatable("restoreinv.feedback.messages", onOff(storage.showSaveMessages)));
                }
                return;
            case 4: // Last Saves
                if (isLeft) {
                    sp.openHandledScreen(new SimpleNamedScreenHandlerFactory(
                            (syncId, inv, p) -> new LastSavesScreenHandler(syncId, inv, storage, p),
                            Text.translatable("restoreinv.gui.last_saves")));
                }
                return;
            case 5: // Admin Panel (nur Berechtigte)
                if (isLeft) {
                    sp.openHandledScreen(new SimpleNamedScreenHandlerFactory(
                            (syncId, inv, p) -> new AdminPanelScreenHandler(syncId, inv, storage, p),
                            Text.translatable("restoreinv.gui.admin_panel")));
                }
                return;
            case 7: // Sound-Toggle
                if (isLeft) {
                    storage.playRestoreSound = !storage.playRestoreSound;
                    redraw(sp, Text.translatable("restoreinv.feedback.sound", onOff(storage.playRestoreSound)));
                }
                return;
            case 8: // Death-Save-Toggle
                if (isLeft) {
                    storage.autoSaveOnDeath = !storage.autoSaveOnDeath;
                    redraw(sp, Text.translatable("restoreinv.feedback.death", onOff(storage.autoSaveOnDeath)));
                }
                return;
            case 13: // Saves pro Slot
                if (isLeft) {
                    storage.savesPerSlot = Math.min(RestoreInvStorage.MAX_SAVES_PER_SLOT, storage.savesPerSlot + 1);
                    storage.trimAllBuffers();
                    redraw(sp, Text.translatable("restoreinv.feedback.saves_per_slot", storage.savesPerSlot));
                } else if (isRight) {
                    storage.savesPerSlot = Math.max(1, storage.savesPerSlot - 1);
                    storage.trimAllBuffers();
                    redraw(sp, Text.translatable("restoreinv.feedback.saves_per_slot", storage.savesPerSlot));
                }
                return;
            case 14: // OP-Restore-Toggle
                if (isLeft) {
                    storage.requireOpForRestore = !storage.requireOpForRestore;
                    redraw(sp, Text.translatable("restoreinv.feedback.op_only", onOff(storage.requireOpForRestore)));
                }
                return;
            case 18: // Save Config
                if (isLeft) {
                    storage.saveConfig();
                    sp.closeHandledScreen();
                    sp.sendMessage(Text.translatable("restoreinv.msg.config_saved"), false);
                }
                return;
            default:
                // Unbenutzte Slots: einfach ignorieren.
                return;
        }
    }

    private static Text onOff(boolean on) {
        return Text.translatable(on ? "restoreinv.config.on" : "restoreinv.config.off");
    }

    private void redraw(ServerPlayerEntity sp, Text msg) {
        storage.updateConfigGUI(this);
        sp.sendMessage(msg, false);
    }

    public void updateConfigGUI(GenericContainerScreenHandler container) {
        storage.updateConfigGUI(container);
    }
}
