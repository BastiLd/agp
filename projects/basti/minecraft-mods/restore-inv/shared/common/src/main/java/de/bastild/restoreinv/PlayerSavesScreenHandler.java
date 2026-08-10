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

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public class PlayerSavesScreenHandler extends GenericContainerScreenHandler {
    public final RestoreInvStorage storage;
    public final PlayerEntity player;
    public final UUID targetUuid;

    public PlayerSavesScreenHandler(int syncId, PlayerInventory playerInventory, RestoreInvStorage storage,
            PlayerEntity player, UUID targetUuid) {
        super(ScreenHandlerType.GENERIC_9X3, syncId, playerInventory, new SimpleInventory(9 * 3), 3);
        this.storage = storage;
        this.player = player;
        this.targetUuid = targetUuid;
        populate();
    }

    private void populate() {
        List<List<RestoreInvStorage.Save>> saves = storage.getLastSaves(targetUuid);
        for (int slot = 0; slot < RestoreInvStorage.SLOTS; slot++) {
            ItemStack icon = new ItemStack(Items.CHEST);
            List<RestoreInvStorage.Save> savesList = saves != null && slot < saves.size()
                    ? saves.get(slot) : new ArrayList<>();
            if (!savesList.isEmpty()) {
                RestoreInvStorage.Save latest = savesList.get(0);
                Text when = RestoreInvStorage.formatRelativeTime(latest.timestampMillis);
                int items = RestoreInvStorage.countNonEmpty(latest.stacks);
                icon.set(DataComponentTypes.CUSTOM_NAME,
                        Text.translatable("restoreinv.gui.latest_save", RestoreInvStorage.slotName(slot)));
                icon.set(DataComponentTypes.LORE, new LoreComponent(List.of(
                        when,
                        Text.translatable("restoreinv.gui.items_short", items),
                        Text.literal(""),
                        Text.translatable("restoreinv.gui.click_preview_simple"))));
            } else {
                icon.set(DataComponentTypes.CUSTOM_NAME, RestoreInvStorage.slotName(slot));
                icon.set(DataComponentTypes.LORE, new LoreComponent(List.of(
                        Text.translatable("restoreinv.gui.empty"))));
            }
            this.getInventory().setStack(slot, icon);
        }
        ItemStack back = new ItemStack(Items.ARROW);
        back.set(DataComponentTypes.CUSTOM_NAME, Text.translatable("restoreinv.gui.back"));
        this.getInventory().setStack(8, back);
    }

    @Override
    public void onSlotClick(int slotIndex, int button, SlotActionType actionType, PlayerEntity player) {
        // Fremde Spieler-Saves -> rein administrativ.
        if (!(player instanceof net.minecraft.server.network.ServerPlayerEntity admin)
                || !PermissionGate.canAdminister(admin)) {
            return;
        }
        ItemStack clicked = this.getInventory().getStack(slotIndex);
        if (clicked.getItem() == Items.ARROW) {
            if (player instanceof net.minecraft.server.network.ServerPlayerEntity sp) {
                sp.openHandledScreen(new net.minecraft.screen.SimpleNamedScreenHandlerFactory(
                        (syncId, inv, p) -> new AdminPanelScreenHandler(syncId, inv, storage, p),
                        Text.translatable("restoreinv.gui.admin_panel")));
            }
            return;
        }
        if (clicked.getItem() == Items.CHEST && slotIndex >= 0 && slotIndex < RestoreInvStorage.SLOTS) {
            if (player instanceof net.minecraft.server.network.ServerPlayerEntity sp) {
                final int chosenSlot = slotIndex;
                final UUID chosenTarget = targetUuid;
                sp.openHandledScreen(
                        new net.minecraft.screen.SimpleNamedScreenHandlerFactory(
                                (syncId, inv, p) -> new PreviewRestoreScreenHandler(syncId, inv, storage, p,
                                        chosenSlot, 0, chosenTarget),
                                Text.translatable("restoreinv.gui.preview_title_player",
                                        RestoreInvStorage.slotName(chosenSlot))));
            }
            return;
        }
        super.onSlotClick(slotIndex, button, actionType, player);
    }

    public UUID getTargetUuid() {
        return targetUuid;
    }
}
