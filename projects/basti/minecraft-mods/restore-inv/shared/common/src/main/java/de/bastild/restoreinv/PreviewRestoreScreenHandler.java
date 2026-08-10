package de.bastild.restoreinv;

import net.minecraft.entity.player.PlayerEntity;
import net.minecraft.entity.player.PlayerInventory;
import net.minecraft.inventory.SimpleInventory;
import net.minecraft.item.ItemStack;
import net.minecraft.item.Items;
import net.minecraft.screen.GenericContainerScreenHandler;
import net.minecraft.screen.ScreenHandlerType;
import net.minecraft.screen.slot.SlotActionType;
import net.minecraft.text.Text;
import net.minecraft.component.DataComponentTypes;
import net.minecraft.component.type.LoreComponent;
import net.minecraft.server.network.ServerPlayerEntity;

import java.util.List;
import java.util.UUID;

/**
 * Zeigt vor dem Wiederherstellen das komplette Inventar zur Vorschau:
 *   Row 0  (Slots 0..3, 8) : Ruestung + Offhand
 *   Row 1..3 (9..35)        : Hauptinventar
 *   Row 4  (36..44)         : Hotbar
 *   Row 5  (45..53)         : Aktions-Buttons (49 Restore, 53 Cancel)
 *
 * targetUuid != null => Admin-Modus.
 */
public class PreviewRestoreScreenHandler extends GenericContainerScreenHandler {
    private final RestoreInvStorage storage;
    private final int slot;
    private final int saveIndex;
    private final UUID targetUuid;

    private static final int CONFIRM_SLOT = 49;
    private static final int CANCEL_SLOT  = 53;
    private static final int HOTBAR_FIRST = 36;
    private static final int MAIN_FIRST   = 9;
    private static final int OFFHAND_SLOT = 8;

    public PreviewRestoreScreenHandler(int syncId, PlayerInventory playerInventory, RestoreInvStorage storage,
            PlayerEntity opener, int slot, int saveIndex, UUID targetUuid) {
        super(ScreenHandlerType.GENERIC_9X6, syncId, playerInventory, new SimpleInventory(9 * 6), 6);
        this.storage = storage;
        this.slot = slot;
        this.saveIndex = saveIndex;
        this.targetUuid = targetUuid;
        populate(opener);
    }

    private void populate(PlayerEntity opener) {
        UUID id = targetUuid != null ? targetUuid : opener.getUuid();
        List<List<RestoreInvStorage.Save>> slotSaves = storage.getLastSaves(id);
        RestoreInvStorage.Save save = (slotSaves != null && slot >= 0 && slot < slotSaves.size()
                && saveIndex >= 0 && saveIndex < slotSaves.get(slot).size())
                ? slotSaves.get(slot).get(saveIndex) : null;
        ItemStack[] inv = save != null ? save.stacks : null;

        SimpleInventory grid = (SimpleInventory) this.getInventory();

        if (inv != null) {
            int armorBase = 36;
            int offhandIdx = inv.length - 1;

            for (int a = 0; a < 4 && (armorBase + a) < inv.length; a++) {
                ItemStack stack = inv[armorBase + a];
                if (stack != null && !stack.isEmpty()) grid.setStack(a, stack.copy());
            }
            if (offhandIdx >= 0 && offhandIdx < inv.length) {
                ItemStack off = inv[offhandIdx];
                if (off != null && !off.isEmpty()) grid.setStack(OFFHAND_SLOT, off.copy());
            }
            for (int i = 9; i < 36 && i < inv.length; i++) {
                ItemStack stack = inv[i];
                if (stack != null && !stack.isEmpty()) grid.setStack(MAIN_FIRST + (i - 9), stack.copy());
            }
            for (int i = 0; i < 9 && i < inv.length; i++) {
                ItemStack stack = inv[i];
                if (stack != null && !stack.isEmpty()) grid.setStack(HOTBAR_FIRST + i, stack.copy());
            }
        }

        ItemStack confirm = new ItemStack(Items.LIME_WOOL);
        Text confirmTitle = save != null
                ? Text.translatable("restoreinv.preview.confirm_time",
                        RestoreInvStorage.formatRelativeTime(save.timestampMillis))
                : Text.translatable("restoreinv.preview.confirm");
        confirm.set(DataComponentTypes.CUSTOM_NAME, confirmTitle);
        confirm.set(DataComponentTypes.LORE, new LoreComponent(List.of(
                Text.translatable("restoreinv.preview.confirm_desc"))));
        grid.setStack(CONFIRM_SLOT, confirm);

        ItemStack cancel = new ItemStack(Items.RED_WOOL);
        cancel.set(DataComponentTypes.CUSTOM_NAME, Text.translatable("restoreinv.gui.back"));
        cancel.set(DataComponentTypes.LORE, new LoreComponent(List.of(
                Text.translatable("restoreinv.preview.cancel_desc"))));
        grid.setStack(CANCEL_SLOT, cancel);
    }

    @Override
    public ItemStack quickMove(PlayerEntity player, int slotIndex) {
        return ItemStack.EMPTY;
    }

    @Override
    public void onSlotClick(int slotIndex, int button, SlotActionType actionType, PlayerEntity player) {
        if (slotIndex >= 0 && slotIndex < this.getInventory().size()) {
            if (slotIndex == CONFIRM_SLOT) {
                if (player instanceof ServerPlayerEntity sp) {
                    if (targetUuid == null) {
                        if (!storage.canRestore(sp)) {
                            sp.sendMessage(Text.translatable("restoreinv.msg.no_permission_restore"), false);
                            return;
                        }
                        storage.restoreInventoryFromSave(sp, slot, saveIndex);
                        sp.sendMessage(Text.translatable("restoreinv.msg.restored"), false);
                    } else {
                        // Admin-Modus: fremdes Inventar wiederherstellen -> Admin-Recht noetig.
                        if (!PermissionGate.canAdminister(sp)) {
                            sp.sendMessage(Text.translatable("restoreinv.msg.no_permission_action"), false);
                            return;
                        }
                        net.minecraft.server.MinecraftServer server = PlatformCompat.serverOf(sp);
                        if (server != null) {
                            ServerPlayerEntity target = server.getPlayerManager().getPlayer(targetUuid);
                            if (target != null) {
                                storage.restoreInventoryFromSave(target, slot, saveIndex);
                                sp.sendMessage(Text.translatable("restoreinv.msg.restored_other"), false);
                            } else {
                                sp.sendMessage(Text.translatable("restoreinv.msg.player_offline"), false);
                            }
                        }
                    }
                    sp.closeHandledScreen();
                }
                return;
            }
            if (slotIndex == CANCEL_SLOT) {
                if (player instanceof ServerPlayerEntity sp) {
                    if (targetUuid == null) {
                        sp.openHandledScreen(new net.minecraft.screen.SimpleNamedScreenHandlerFactory(
                                (syncId, inv, p) -> new LastSavesScreenHandler(syncId, inv, storage, p),
                                Text.translatable("restoreinv.gui.last_saves")));
                    } else {
                        UUID t = targetUuid;
                        sp.openHandledScreen(new net.minecraft.screen.SimpleNamedScreenHandlerFactory(
                                (syncId, inv, p) -> new PlayerSavesScreenHandler(syncId, inv, storage, p, t),
                                Text.translatable("restoreinv.gui.player_saves")));
                    }
                }
                return;
            }
            return;
        }
    }
}
